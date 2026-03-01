# models/review_like.py
from datetime import datetime
from sqlmodel import SQLModel, Field


class ReviewLike(SQLModel, table=True):
    review_id: int = Field(foreign_key="review.id", primary_key=True)
    user_id: int = Field(foreign_key="user.id", primary_key=True)

    created_at: datetime = Field(default_factory=datetime.utcnow)
