from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel


class MatchBase(BaseModel):
    id: int
    competition_id: int
    competition_name: Optional[str] = None
    utc_date: datetime
    status: str
    matchday: Optional[int]

    home_team_id: int
    home_team_name: Optional[str] = None
    away_team_id: int
    away_team_name: Optional[str] = None

    home_score: Optional[int]
    away_score: Optional[int]


class MatchListResponse(BaseModel):
    matches: List[MatchBase]


class PlayerMini(BaseModel):
    id: int
    name: str
    


class TeamMini(BaseModel):
    id: int
    name: str
    short_name : Optional[str]
    crest_url : Optional[str]


class MatchDetailResponse(BaseModel):
    match: MatchBase
    home_team: TeamMini
    away_team: TeamMini
    home_squad_players: List[PlayerMini]
    away_squad_players: List[PlayerMini]

