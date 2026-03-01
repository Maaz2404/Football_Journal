# models/player.py
from datetime import date
from sqlmodel import SQLModel, Field
from typing import Optional


class Player(SQLModel, table=True):
    id: int = Field(primary_key=True)  # API person id

    name: str
    position: Optional[str] = None
    date_of_birth: Optional[date] = None
    nationality: Optional[str] = None
