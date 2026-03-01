from fastapi import APIRouter, Depends
from core.auth import get_current_user
from models.user import User

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user)):
    """
    Returns the current logged-in user info.
    """
    return {
        "id": current_user.id,
        "auth_provider_id": current_user.auth_provider_id,
        "username": current_user.username,
        "created_at": current_user.created_at.isoformat()
    }
