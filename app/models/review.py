# models/review.py
from datetime import datetime
from sqlmodel import SQLModel, Field
from sqlalchemy import UniqueConstraint, Index
from typing import Optional
from enum import Enum


class FocusLevel(str, Enum):
    RED = "red"
    YELLOW = "yellow"
    GREEN = "green"


class Review(SQLModel, table=True):
    __table_args__ = (
        UniqueConstraint("user_id", "match_id"),
        Index("ix_review_user_id", "user_id"),
        Index("ix_review_match_id", "match_id"),
    )
    id: Optional[int] = Field(default=None, primary_key=True)

    user_id: int = Field(foreign_key="user.id")
    match_id: int = Field(foreign_key="match.id")

    focus_level: FocusLevel
    notes: Optional[str] = None

    created_at: datetime = Field(default_factory=datetime.utcnow)
