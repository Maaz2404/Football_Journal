# models/team_squad.py
from datetime import date
from sqlmodel import SQLModel, Field
from typing import Optional


class TeamSquad(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)

    team_id: int = Field(foreign_key="team.id")
    player_id: int = Field(foreign_key="player.id")

    valid_from: date
    valid_to: Optional[date] = None
