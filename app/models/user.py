# models/user.py
from datetime import datetime
from sqlmodel import SQLModel, Field
from typing import Optional


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

    auth_provider_id: str = Field(index=True, unique=True)
    username: Optional[str] = Field(index=True, unique=True)

    created_at: datetime = Field(default_factory=datetime.utcnow)
