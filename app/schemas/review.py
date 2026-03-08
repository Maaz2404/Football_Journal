from typing import Optional
from pydantic import BaseModel
from datetime import datetime
from models.review import FocusLevel


class ReviewCreate(BaseModel):
    match_id: int
    focus_level: FocusLevel
    notes: Optional[str] = None
    motm_player_id: Optional[int] = None
    
class ReviewUpdate(BaseModel):
    focus_level: Optional[FocusLevel] = None
    notes: Optional[str] = None
    motm_player_id: Optional[int] = None

class ReviewResponse(BaseModel):
    id: int
    user_id: int
    username: Optional[str]
    match_id: int
    focus_level: FocusLevel
    notes: Optional[str]
    created_at: datetime
    motm_player_id: Optional[int]
