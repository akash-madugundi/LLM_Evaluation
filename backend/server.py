from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
import shutil
import uuid
import PyPDF2
import tempfile
import google.generativeai as genai
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from langchain_community.vectorstores import FAISS
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain.chains.question_answering import load_qa_chain
from langchain_core.prompts import PromptTemplate

from db import conn
from models import QueryRequest, PDFContentRequest, FeedbackRequest, RetryRequest
from utils.scorer import load_textfiles, score
from utils.logger import log_interaction, load_logs, rank_by_metric, surface_low_scores, detect_regressions
from utils.ollama_client import call_ollama_model

# Load environment variables
load_dotenv()
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

# FastAPI setup
app = FastAPI()

# Enable CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change this to your frontend domain in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Utility functions
def extract_text_from_pdf(file_path: str) -> str:
    text = ""
    try:
        with open(file_path, "rb") as f:
            reader = PyPDF2.PdfReader(f)
            for page in reader.pages:
                text += page.extract_text() or ""
        return text
    except Exception as e:
        raise RuntimeError(f"Error reading PDF: {e}")
    
def get_text_chunks(text: str):
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=10000, chunk_overlap=1000
    )
    chunks = text_splitter.split_text(text)
    return chunks


def get_vector_store(text_chunks, index_name):
    embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001")
    vector_store = FAISS.from_texts(text_chunks, embedding=embeddings)
    vector_store.save_local(index_name)
    return index_name


def get_conversational_chain():
    prompt_template = """
    Answer the question as detailed as possible from the provided context. If the answer is not in
    the provided context, just say "answer is not available in the context" and do not guess.

    Context:
    {context}

    Question:
    {question}

    Answer:
    """

    model = ChatGoogleGenerativeAI(model="gemini-1.5-flash", temperature=0.3)
    prompt = PromptTemplate(
        template=prompt_template, input_variables=["context", "question"]
    )
    chain = load_qa_chain(model, chain_type="stuff", prompt=prompt)
    return chain


current_index_name = None

@app.post("/upload-pdf")
async def upload_pdf(file: UploadFile = File(...)):
    global current_index_name

    try:
        # Create temp file securely
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_file:
            shutil.copyfileobj(file.file, temp_file)
            temp_path = temp_file.name  # path to the saved temp file

        # Extract text
        text = extract_text_from_pdf(temp_path)

        if not text.strip():
            raise HTTPException(status_code=400, detail="No extractable text in PDF.")

        # Chunk & embed
        current_index_name = f"faiss_index_{uuid.uuid4().hex}"
        chunks = get_text_chunks(text)
        get_vector_store(chunks, current_index_name)

        return {"message": "PDF processed and index created."}

    except Exception as e:
        print("Upload Error:", e)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ask")
async def ask_question(request: QueryRequest):
    global current_index_name
    if not current_index_name:
        raise HTTPException(status_code=400, detail="No PDF content indexed. Upload PDF content first.")

    try:
        embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001")
        db = FAISS.load_local(current_index_name, embeddings, allow_dangerous_deserialization=True)
        docs = db.similarity_search(request.question)

        chain = get_conversational_chain()
        result = chain(
            {"input_documents": docs, "question": request.question},
            return_only_outputs=True
        )

        answer_text = result["output_text"]
        question_lower = request.question.lower()

        # Define keyword sets and associated reference files
        keyword_triggers = [
            ({"ai", "applications"}, "reference/ref1_1.txt"),
            ({"difference", "supervised", "unsupervised"}, "reference/ref2_1.txt"),
            ({"machine learning", "deep learning"}, "reference/ref3_1.txt"),
            ({"ml", "dl"}, "reference/ref3_1.txt")
        ]

        matched_ref_file = None
        for keywords, ref_file in keyword_triggers:
            if all(word in question_lower for word in keywords):
                matched_ref_file = ref_file
                break

        if matched_ref_file:
            with open(matched_ref_file, "r", encoding="utf-8") as rf:
                reference_lines = rf.readlines()

            ref, hypo = load_textfiles(reference_lines, [answer_text])
            scores = score(ref, hypo)
            print("Scores:", scores)
            log_interaction(request.question, answer_text, scores if matched_ref_file else None)

            return {
                "answer": answer_text,
                "metrics": scores
            }
        else:
            return {"answer": answer_text}

    except Exception as e:
        print("Error in /ask:", e)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/feedback")
async def store_feedback(feedback: FeedbackRequest):
    if feedback.feedback_type not in ["up", "down", None]:
        raise HTTPException(status_code=400, detail="Invalid feedback type")

    try:
        # Create a cursor here, safer and avoids scope issues
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO feedbacks (message_id, feedback_type, comment) VALUES (%s, %s, %s)",
                (feedback.message_id, feedback.feedback_type, feedback.comment)
            )
        conn.commit()
        return {"message": "Feedback stored successfully"}
    except Exception as e:
        conn.rollback()
        print("DB Insert Error:", e)  # log the error for debugging
        raise HTTPException(status_code=500, detail="Failed to store feedback")
    
@app.post("/retry")
async def retry(data: RetryRequest):
    prompt = (
        f"I have a question: {data.question}\n\n"
        f"And an answer from a language model: {data.response}\n\n"
        f"Please improve this answer to be more clear, accurate."
    )

    try:
        improved_answer = await call_ollama_model(prompt)

        question_lower = data.question.lower()

        # Define keyword sets and associated reference files
        keyword_triggers = [
            ({"ai", "applications"}, "reference/ref1_2.txt"),
            ({"difference", "supervised", "unsupervised"}, "reference/ref2_2.txt"),
            ({"machine learning", "deep learning"}, "reference/ref3_2.txt"),
            ({"ml", "dl"}, "reference/ref3_2.txt")
        ]

        matched_ref_file = None
        for keywords, ref_file in keyword_triggers:
            if all(word in question_lower for word in keywords):
                matched_ref_file = ref_file
                break

        if matched_ref_file:
            with open(matched_ref_file, "r", encoding="utf-8") as rf:
                reference_lines = rf.readlines()

            ref, hypo = load_textfiles(reference_lines, [improved_answer])
            scores = score(ref, hypo)
            print("Scores:", scores)
            log_interaction(data.question, improved_answer, scores if matched_ref_file else None)

            return {
                "improved_answer": improved_answer,
                "metrics": scores
            }
        else:
            return {"improved_answer": improved_answer}

    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/analysis")
async def analysis(
    action: str = Query("rank", enum=["rank", "bad", "regressions"]),
    metric: str = Query("ROUGE_L")
):
    entries = load_logs()
    if action == "rank":
        ranked = rank_by_metric(entries, metric)
        return {"top_answers": ranked[:10]}
    elif action == "bad":
        bad = surface_low_scores(entries, metric, threshold=0.5)
        return {"low_scores": bad}
    elif action == "regressions":
        regs = detect_regressions(entries, metric)
        return {"regressions": regs}