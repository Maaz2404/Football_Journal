# models/review_player_tag.py
from sqlmodel import SQLModel, Field
from typing import Optional
from enum import Enum
from sqlalchemy import Index


class ReviewPlayerTagType(str, Enum):
    MOTM = "MOTM"


class ReviewPlayerTag(SQLModel, table=True):
    __table_args__ = (
        Index("ix_tag_review_id", "review_id"),
        Index("ix_tag_player_id", "player_id"),
    )
    id: Optional[int] = Field(default=None, primary_key=True)

    review_id: int = Field(foreign_key="review.id")
    player_id: int = Field(foreign_key="player.id")

    tag_type: ReviewPlayerTagType
