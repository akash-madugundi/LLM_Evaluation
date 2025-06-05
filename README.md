# LLM Output Evaluation System
An end-to-end evaluation framework for improving the quality of LLM-generated responses to user queries from uploaded documents. This system enables user feedback collection, automatic scoring, answer ranking, and a retry mechanism for improving underperforming outputs.

## Video
https://github.com/user-attachments/assets/f1a92ae0-eef6-439d-bb18-dd5fe9626abd

---

## Premise
Users of an internal LLM-based tool complained about vague, non-actionable answers. To address this, we designed an evaluation system that:
- Captures user feedback
- Automatically scores LLM outputs
- Surfaces bad answers
- Tracks performance regressions over time
- Supports iterative improvement

---

## Prerequisites
- Python-3.12
- Ollama Installed - Use `ollama pull qwen2.5:0.5b` for model download.

---

## Features
### PDF Upload + Document Q&A
- Users can upload PDFs containing reference content.
- After upload, they can ask questions based on the document.
- LLM generates responses using document context.
### Feedback Collection
- Users can:
  - 👍 Like
  - 👎 Dislike
  - 📝 Add comments
- Feedback is stored in a PostgreSQL database.
### Developer Evaluation Mode
- When enabled, each answer displays:
  - BLEU Scores
  - ROUGE-L Scores
- Feedback tagged as negative can be used to retry and generate improved answers.
- Evaluation scores are visible when Developer Mode is toggled.
### Analytics & Analysis Panel
- View detailed analysis of system performance:
  - Ranked answers based on evaluation metrics
  - Surfaced low-quality outputs
  - Regression tracking over time for system performance

---

## 🛠️ Technologies Used

- **Frontend:** React.js, TailwindCSS
- **Backend:** FastAPI, Uvicorn, Langchain, Ollama
- **Evaluation:** BLEU, ROUGE
- **Database:** PostgreSQL
- **PDF Parsing:** PyPDF2
- **LLM API:** Gemini API (Google Generative AI)
- **Deployment:** Vercel (frontend), Render (backend)

---

## Getting Started

### 1. Clone the repository
```bash
git clone <repository-url>
cd LLM_Evaluation
```

### 2. Setup Frontend
#### Install dependencies:
```
npm install
```
#### Set up environment variables (.env file):
```bash
VITE_BACKEND_URL=<backend_url>
```
#### Run the frontend:
```
npm run dev
```

### 3. Setup Backend
#### Create Virtual Environment
```
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```
#### Install Dependencies
```bash
pip install -r requirements.txt
```
#### Set up environment variables (.env file):
```bash
GOOGLE_API_KEY=AIzaSyCcuxazr__yGZM038YokopKb03o3cjzdA0
DB_NAME=llm_eval_db
DB_USER=llm_eval_db_user
DB_PASSWORD=9kYts546iqR6JO3Kw0jYV1IJQTF7L4PZ
DB_HOST=dpg-d0qvvnruibrs73f0kup0-a.oregon-postgres.render.com
DB_PORT=5432
```
#### Run the backend:
```
uvicorn server:app --reload --port 5000
```

---

## API Endpoints
#### POST /upload-pdf
- Request: { "pdf": <uploaded_pdf_file> }

#### POST /ask
- Request: { "question": <any_ques_from_pdf> }
- Response: { "answer": <corresponding_ans>, "metrics": <scores> }

#### POST /feedback
- Request: { "id": <message_id>, "type: <like_or_dislike>, "comment": <any_comment> }

#### POST /retry
- Request: { "question": <retry_ques> }
- Response: { "answer": <retried_ans>, "metrics": <corresponding_scores> }

#### GET /analysis
- Response: { "details": <ranking_regressions> }

---

## Testing
- *For testing:* Use `testing.pdf`

---

## PFA
![Screenshot 2025-06-05 115828](https://github.com/user-attachments/assets/c8b8edca-1bc4-4267-b8d5-8145a55ef34c)
![Screenshot 2025-06-05 115927](https://github.com/user-attachments/assets/7d102a58-3c17-48c2-ab61-766df44de99f)
![Screenshot 2025-06-05 115955](https://github.com/user-attachments/assets/32d59e9d-0320-437a-a24b-393033faf83f)
![Screenshot 2025-06-05 120914](https://github.com/user-attachments/assets/19e789ee-d289-4310-b682-c6b104e7068f)
![Screenshot 2025-06-05 121050](https://github.com/user-attachments/assets/190860c1-9696-45b9-a5d9-d83ca286884b)
![Screenshot 2025-06-05 120926](https://github.com/user-attachments/assets/3cad435e-4391-418a-9b44-317473666790)
