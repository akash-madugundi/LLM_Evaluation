from fastapi import FastAPI, UploadFile, File, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
import shutil
import uuid
import PyPDF2
import tempfile
import psycopg2

import google.generativeai as genai
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from langchain_community.vectorstores import FAISS
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain.chains.question_answering import load_qa_chain
from langchain_core.prompts import PromptTemplate

from bleu.bleu import Bleu
from rouge.rouge import Rouge

def load_textfiles(references, hypothesis):
    combined_ref = " ".join(line.strip() for line in references)
    combined_hypo = " ".join(line.strip() for line in hypothesis)

    # Wrap both in dict format expected by scorers
    refs = {0: [combined_ref]}
    hypo = {0: [combined_hypo]}

    return refs, hypo

def score(ref, hypo):
    scorers = [
        (Bleu(4), ["Bleu_1", "Bleu_2", "Bleu_3", "Bleu_4"]),
        (Rouge(), "ROUGE_L"),
    ]
    final_scores = {}

    for scorer, method in scorers:
        score_val, scores = scorer.compute_score(ref, hypo)
        if isinstance(score_val, list):
            for m, s in zip(method, score_val):
                final_scores[m] = s
        else:
            final_scores[method] = score_val

    return final_scores

# Load environment variables
load_dotenv()
genai.configure(api_key=os.getenv("GOOGLE_API_KEY"))

# Set up PostgreSQL connection
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")

# Connect to PostgreSQL
conn = psycopg2.connect(
    dbname=DB_NAME,
    user=DB_USER,
    password=DB_PASSWORD,
    host=DB_HOST,
    port=DB_PORT
)

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

# Request body model
class QARequest(BaseModel):
    text: str
    question: str

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

class PDFContentRequest(BaseModel):
    text: str

class QueryRequest(BaseModel):
    question: str

class FeedbackRequest(BaseModel):
    message_id: int
    feedback_type: str | None = None  # 'up', 'down', or 'comment'
    comment: str | None = None

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
            ({"ai", "applications"}, "reference/ref1.txt"),
            ({"difference", "supervised", "unsupervised"}, "reference/ref2.txt")
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