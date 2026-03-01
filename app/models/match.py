# models/match.py
from datetime import datetime
from sqlmodel import SQLModel, Field
from typing import Optional
from sqlalchemy import Column, DateTime, Index

class Match(SQLModel, table=True):
    __table_args__ = (
        Index("ix_match_utc_date", "utc_date"),
        Index("ix_match_competition_id", "competition_id"),
    )
    id: int = Field(primary_key=True)  # API match id

    competition_id: int = Field(foreign_key="competition.id")

    utc_date: datetime = Field(sa_column=Column(DateTime(timezone=True)))
    status: str  # SCHEDULED / FINISHED / TIMED
    matchday: Optional[int] = None

    home_team_id: int = Field(foreign_key="team.id")
    away_team_id: int = Field(foreign_key="team.id")

    home_score: Optional[int] = None
    away_score: Optional[int] = None
