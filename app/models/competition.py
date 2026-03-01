# models/competition.py
from datetime import date
from sqlmodel import SQLModel, Field
from typing import Optional
from enum import Enum


class CompetitionType(str, Enum):
    LEAGUE = "LEAGUE"
    CUP = "CUP"


class Competition(SQLModel, table=True):
    id: int = Field(primary_key=True)  # API competition id

    name: str
    type: CompetitionType
    area_name: Optional[str] = None
    code: str
    start_date: Optional[date] = None
    end_date: Optional[date] = None
