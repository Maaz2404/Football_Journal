from fastapi import APIRouter, Depends
from sqlalchemy import select, func, union_all
from sqlalchemy.orm import aliased
from datetime import datetime, timedelta
from calendar import monthrange
from sqlmodel import Session
from models.match import Match
from models.review import Review
from models.review_player_tag import ReviewPlayerTag, ReviewPlayerTagType
from models.user import User
from core.database import get_db
from core.auth import get_current_user

router = APIRouter(prefix="/stats", tags=["stats"])

def build_date_range(range_type: str, month: int = None, year: int = None):
    now = datetime.utcnow()

    if range_type == "weekly":
        start = now - timedelta(days=7)
        end = now
        return start, end

    if range_type == "monthly":
        if not month or not year:
            raise ValueError("Month and year required for monthly range")
        start = datetime(year, month, 1)
        last_day = monthrange(year, month)[1]
        end = datetime(year, month, last_day, 23, 59, 59)
        return start, end

    if range_type == "yearly":
        if not year:
            raise ValueError("Year required for yearly range")
        start = datetime(year, 1, 1)
        end = datetime(year, 12, 31, 23, 59, 59)
        return start, end

    return None, None


@router.get("/me/matches")
async def get_my_matches(
    range: str = None,
    month: int = None,
    year: int = None,
    limit: int = 20,
    offset: int = 0,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = (
        select(Match)
        .join(Review, Review.match_id == Match.id)
        .where(Review.user_id == current_user.id)
        .order_by(Match.utc_date.desc())
        .limit(limit)
        .offset(offset)
    )

    if range:
        start, end = build_date_range(range, month, year)
        stmt = stmt.where(Match.utc_date >= start, Match.utc_date <= end)

    result = await session.execute(stmt)
    matches = result.scalars().all()

    return matches

from sqlalchemy import func, union_all

@router.get("/me/teams")
async def get_my_teams(
    range: str = None,
    month: int = None,
    year: int = None,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    base_query = (
        select(Match.home_team_id.label("team_id"))
        .join(Review, Review.match_id == Match.id)
        .where(Review.user_id == current_user.id)
    )

    away_query = (
        select(Match.away_team_id.label("team_id"))
        .join(Review, Review.match_id == Match.id)
        .where(Review.user_id == current_user.id)
    )

    if range:
        start, end = build_date_range(range, month, year)
        base_query = base_query.where(Match.utc_date >= start, Match.utc_date <= end)
        away_query = away_query.where(Match.utc_date >= start, Match.utc_date <= end)

    union_stmt = union_all(base_query, away_query).subquery()

    stmt = (
        select(union_stmt.c.team_id, func.count().label("count"))
        .group_by(union_stmt.c.team_id)
        .order_by(func.count().desc())
    )

    result = await session.execute(stmt)
    rows = result.all()
    return [dict(row._mapping) for row in rows]

@router.get("/me/motm-player")
async def get_my_top_motm_player(
    range: str = None,
    month: int = None,
    year: int = None,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = (
        select(
            ReviewPlayerTag.player_id,
            func.count().label("count")
        )
        .join(Review, Review.id == ReviewPlayerTag.review_id)
        .join(Match, Match.id == Review.match_id)
        .where(
            Review.user_id == current_user.id,
            ReviewPlayerTag.tag_type == ReviewPlayerTagType.MOTM,
        )
        .group_by(ReviewPlayerTag.player_id)
        .order_by(func.count().desc())
        .limit(1)
    )

    if range:
        start, end = build_date_range(range, month, year)
        stmt = stmt.where(Match.utc_date >= start, Match.utc_date <= end)

    result = await session.execute(stmt)
    row = result.first()
    return dict(row._mapping) if row else None

@router.get("/me/most-watched-competition")
async def get_my_top_competition(
    range: str = None,
    month: int = None,
    year: int = None,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = (
        select(
            Match.competition_id,
            func.count().label("count")
        )
        .join(Review, Review.match_id == Match.id)
        .where(Review.user_id == current_user.id)
        .group_by(Match.competition_id)
        .order_by(func.count().desc())
        .limit(1)
    )

    if range:
        start, end = build_date_range(range, month, year)
        stmt = stmt.where(Match.utc_date >= start, Match.utc_date <= end)

    result = await session.execute(stmt)
    row = result.first()
    return dict(row._mapping) if row else None

@router.get("/me/total-matches")
async def get_total_matches(
    range: str = None,
    month: int = None,
    year: int = None,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = (
        select(func.count())
        .select_from(Review)
        .join(Match, Match.id == Review.match_id)
        .where(Review.user_id == current_user.id)
    )

    if range:
        start, end = build_date_range(range, month, year)
        stmt = stmt.where(Match.utc_date >= start, Match.utc_date <= end)

    result = await session.execute(stmt)
    return {"total": result.scalar_one()}

@router.get("/match/{match_id}/motm-leader")
async def get_match_motm_leader(
    match_id: int,
    session: Session = Depends(get_db),
):
    stmt = (
        select(
            ReviewPlayerTag.player_id,
            func.count().label("count")
        )
        .join(Review, Review.id == ReviewPlayerTag.review_id)
        .where(
            Review.match_id == match_id,
            ReviewPlayerTag.tag_type == ReviewPlayerTagType.MOTM,
        )
        .group_by(ReviewPlayerTag.player_id)
        .order_by(func.count().desc())
        .limit(1)
    )

    result = await session.execute(stmt)
    row = result.first()
    return dict(row._mapping) if row else None
