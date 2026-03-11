from datetime import datetime, time
from fastapi import APIRouter,HTTPException, Depends,status
from sqlalchemy import delete,select, and_
from sqlmodel import Session
from core.database import get_db
from utils.validation import validate_motm_player
from models.review import Review
from models.review_player_tag import ReviewPlayerTag,ReviewPlayerTagType
from models.match import Match
from models.user import User
from models.review_like import ReviewLike

from schemas.review import (
    ReviewCreate,
    ReviewUpdate,
    ReviewResponse,
)
from core.auth import get_current_user  


router = APIRouter(prefix="/reviews", tags=["reviews"])

@router.post("", response_model=ReviewResponse)
async def create_review(
    payload: ReviewCreate,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # 1️⃣ Match exists
    match = await session.get(Match, payload.match_id)
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    # 2️⃣ Only FINISHED matches
    if match.status != "FINISHED":
        raise HTTPException(
            status_code=400,
            detail="Cannot review a match that is not finished"
        )

    # 3️⃣ Create review
    review = Review(
        user_id=current_user.id,
        match_id=payload.match_id,
        focus_level=payload.focus_level,
        notes=payload.notes,
        created_at=datetime.utcnow(),
    )

    session.add(review)

    try:
        await session.commit()
        await session.refresh(review)
    except Exception:
        session.rollback()
        raise HTTPException(
            status_code=400,
            detail="You have already reviewed this match"
        )

    motm_player_id = None

    # 4️⃣ Handle MOTM
    if payload.motm_player_id:
        await validate_motm_player(session, payload.motm_player_id, match)

        tag = ReviewPlayerTag(
            review_id=review.id,
            player_id=payload.motm_player_id,
            tag_type=ReviewPlayerTagType.MOTM,
        )
        session.add(tag)
        await session.commit()

        motm_player_id = payload.motm_player_id

    return ReviewResponse(
        id=review.id,
        user_id=review.user_id,
        username=current_user.username,
        match_id=review.match_id,
        focus_level=review.focus_level,
        notes=review.notes,
        created_at=review.created_at,
        motm_player_id=motm_player_id,
    )

@router.put("/{review_id}", response_model=ReviewResponse)
async def update_review(
    review_id: int,
    payload: ReviewUpdate,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    review = await session.get(Review, review_id)

    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    if review.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not allowed")

    match = await session.get(Match, review.match_id)

    # Update fields
    if payload.focus_level is not None:
        review.focus_level = payload.focus_level

    if payload.notes is not None:
        review.notes = payload.notes

    session.add(review)
    await session.commit()

    motm_player_id = None

    # Handle MOTM update (including removal)
    if payload.motm_player_id is not None:
        # Remove existing MOTM
        await session.execute(
            delete(ReviewPlayerTag).where(
                ReviewPlayerTag.review_id == review.id,
                ReviewPlayerTag.tag_type == ReviewPlayerTagType.MOTM,
            )
        )
        await session.commit()

        # If new one provided
        if payload.motm_player_id:
            validate_motm_player(session, payload.motm_player_id, match)

            tag = ReviewPlayerTag(
                review_id=review.id,
                player_id=payload.motm_player_id,
                tag_type=ReviewPlayerTagType.MOTM,
            )
            session.add(tag)
            await session.commit()

            motm_player_id = payload.motm_player_id

    return ReviewResponse(
        id=review.id,
        user_id=review.user_id,
        username=current_user.username,
        match_id=review.match_id,
        focus_level=review.focus_level,
        notes=review.notes,
        created_at=review.created_at,
        motm_player_id=motm_player_id,
    )

@router.delete("/{review_id}")
async def delete_review(
    review_id: int,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    review = await session.get(Review, review_id)

    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    if review.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not allowed")

    await session.delete(review)
    await session.commit()

    return {"message": "Review deleted successfully"}

@router.get("/match/{match_id}", response_model=list[ReviewResponse])
async def get_match_reviews(
    match_id: int,
    session: Session = Depends(get_db),
):
    # 1️⃣ Ensure match exists
    match = await session.get(Match, match_id)
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    # 2️⃣ Fetch reviews, usernames, and MOTM tags in one query.
    result = await session.execute(
        select(
            Review.id,
            Review.user_id,
            Review.match_id,
            Review.focus_level,
            Review.notes,
            Review.created_at,
            User.username,
            ReviewPlayerTag.player_id.label("motm_player_id"),
        )
        .join(User, User.id == Review.user_id)
        .outerjoin(
            ReviewPlayerTag,
            and_(
                ReviewPlayerTag.review_id == Review.id,
                ReviewPlayerTag.tag_type == ReviewPlayerTagType.MOTM,
            ),
        )
        .where(Review.match_id == match_id)
        .order_by(Review.created_at.desc())
    )
    rows = result.all()

    return [
        ReviewResponse(
            id=row.id,
            user_id=row.user_id,
            username=row.username,
            match_id=row.match_id,
            focus_level=row.focus_level,
            notes=row.notes,
            created_at=row.created_at,
            motm_player_id=row.motm_player_id,
        )
        for row in rows
    ]

@router.post("/{review_id}/like", status_code=status.HTTP_204_NO_CONTENT)
async def toggle_review_like(
    review_id: int,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # 1️⃣ Check review exists
    review = await session.get(Review, review_id)
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    # 2️⃣ Prevent self-like
    if review.user_id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="You cannot like your own review",
        )

    # 3️⃣ Check if already liked
    result = await session.execute(
        select(ReviewLike).where(
            ReviewLike.review_id == review_id,
            ReviewLike.user_id == current_user.id,
        )
    )
    existing_like = result.scalar_one_or_none()

    # 4️⃣ Toggle logic
    if existing_like:
        await session.delete(existing_like)
    else:
        like = ReviewLike(
            review_id=review_id,
            user_id=current_user.id,
        )
        session.add(like)

    await session.commit()

    return
