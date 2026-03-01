# models/team.py
from sqlmodel import SQLModel, Field
from typing import Optional


class Team(SQLModel, table=True):
    id: int = Field(primary_key=True)  # API team id

    name: str
    short_name: Optional[str] = None
    crest_url: Optional[str] = None
