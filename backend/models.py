from pydantic import BaseModel

class PDFContentRequest(BaseModel):
    text: str

class QueryRequest(BaseModel):
    question: str

class FeedbackRequest(BaseModel):
    message_id: int
    feedback_type: str | None = None  # 'up', 'down', or 'comment'
    comment: str | None = None

class RetryRequest(BaseModel):
    question: str
    response: str