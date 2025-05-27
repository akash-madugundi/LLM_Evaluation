from fastapi import FastAPI, HTTPException
import psycopg2
from pydantic import BaseModel

class FeedbackRequest(BaseModel):
    message_id: int
    feedback_type: str 

# Set up PostgreSQL connection
conn = psycopg2.connect(
    dbname="LLM-Eval",
    user="postgres",
    password="datahack",
    host="localhost",
    port="5432"
)
cur = conn.cursor()

@app.post("/feedback")
async def store_feedback(feedback: FeedbackRequest):
    if feedback.feedback_type not in ["up", "down"]:
        raise HTTPException(status_code=400, detail="Invalid feedback type")

    try:
        cur.execute(
            "INSERT INTO feedbacks (message_id, feedback_type) VALUES (%s, %s)",
            (feedback.message_id, feedback.feedback_type)
        )
        conn.commit()
        return {"message": "Feedback stored successfully"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
