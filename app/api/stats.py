from fastapi import APIRouter, Depends
from sqlalchemy import select, func, union_all
from sqlalchemy.orm import aliased
from datetime import datetime, timedelta, timezone
from calendar import monthrange
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError
from sqlmodel import Session
from models.match import Match
from models.team import Team
from models.competition import Competition
from models.player import Player
from models.review import Review
from models.review_player_tag import ReviewPlayerTag, ReviewPlayerTagType
from models.user import User
from core.database import get_db
from core.auth import get_current_user

router = APIRouter(prefix="/stats", tags=["stats"])

def _resolve_viewer_timezone(viewer_tz: str | None):
    if not viewer_tz:
        return timezone.utc
    try:
        return ZoneInfo(viewer_tz)
    except ZoneInfoNotFoundError:
        return timezone.utc


def build_date_range(range_type: str, month: int = None, year: int = None, viewer_tz: str | None = None):
    tzinfo = _resolve_viewer_timezone(viewer_tz)
    now_local = datetime.now(timezone.utc).astimezone(tzinfo)

    if range_type == "weekly":
        start_local = now_local - timedelta(days=7)
        return start_local.astimezone(timezone.utc), now_local.astimezone(timezone.utc)

    if range_type == "monthly":
        if not month or not year:
            raise ValueError("Month and year required for monthly range")
        start_local = datetime(year, month, 1, 0, 0, 0, tzinfo=tzinfo)
        last_day = monthrange(year, month)[1]
        end_local = datetime(year, month, last_day, 23, 59, 59, tzinfo=tzinfo)
        return start_local.astimezone(timezone.utc), end_local.astimezone(timezone.utc)

    if range_type == "yearly":
        if not year:
            raise ValueError("Year required for yearly range")
        start_local = datetime(year, 1, 1, 0, 0, 0, tzinfo=tzinfo)
        end_local = datetime(year, 12, 31, 23, 59, 59, tzinfo=tzinfo)
        return start_local.astimezone(timezone.utc), end_local.astimezone(timezone.utc)

    if range_type == "custom":
        if month and year:
            # custom with month+year → monthly window
            start_local = datetime(year, month, 1, 0, 0, 0, tzinfo=tzinfo)
            last_day = monthrange(year, month)[1]
            end_local = datetime(year, month, last_day, 23, 59, 59, tzinfo=tzinfo)
            return start_local.astimezone(timezone.utc), end_local.astimezone(timezone.utc)
        if year:
            # custom with year only → full year
            start_local = datetime(year, 1, 1, 0, 0, 0, tzinfo=tzinfo)
            end_local = datetime(year, 12, 31, 23, 59, 59, tzinfo=tzinfo)
            return start_local.astimezone(timezone.utc), end_local.astimezone(timezone.utc)

    return None, None


@router.get("/me/matches")
async def get_my_matches(
    range: str = None,
    month: int = None,
    year: int = None,
    viewer_tz: str | None = None,
    limit: int = 20,
    offset: int = 0,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    home_team = aliased(Team)
    away_team = aliased(Team)

    stmt = (
        select(
            Match,
            home_team.short_name.label("home_team_name"),
            home_team.crest_url.label("home_team_crest"),
            away_team.short_name.label("away_team_name"),
            away_team.crest_url.label("away_team_crest"),
            Competition.name.label("competition_name")
        )
        .join(Review, Review.match_id == Match.id)
        .join(home_team, Match.home_team_id == home_team.id)
        .join(away_team, Match.away_team_id == away_team.id)
        .join(Competition, Match.competition_id == Competition.id)
        .where(Review.user_id == current_user.id)
        .order_by(Match.utc_date.desc())
        .limit(limit)
        .offset(offset)
    )

    if range:
        start, end = build_date_range(range, month, year, viewer_tz)
        stmt = stmt.where(Match.utc_date >= start, Match.utc_date <= end)

    result = await session.execute(stmt)
    matches_data = []
    for match, h_name, h_crest, a_name, a_crest, c_name in result:
        m_dict = match.model_dump()
        m_dict["home_team_name"] = h_name
        m_dict["home_team_crest"] = h_crest
        m_dict["away_team_name"] = a_name
        m_dict["away_team_crest"] = a_crest
        m_dict["competition_name"] = c_name
        matches_data.append(m_dict)

    return matches_data

from sqlalchemy import func, union_all

@router.get("/me/teams")
async def get_my_teams(
    range: str = None,
    month: int = None,
    year: int = None,
    viewer_tz: str | None = None,
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
        start, end = build_date_range(range, month, year, viewer_tz)
        base_query = base_query.where(Match.utc_date >= start, Match.utc_date <= end)
        away_query = away_query.where(Match.utc_date >= start, Match.utc_date <= end)

    union_stmt = union_all(base_query, away_query).subquery()

    stmt = (
        select(
            union_stmt.c.team_id, 
            Team.short_name.label("team_name"), 
            Team.crest_url.label("crest_url"),
            func.count().label("count")
        )
        .join(Team, union_stmt.c.team_id == Team.id)
        .group_by(union_stmt.c.team_id, Team.short_name, Team.crest_url)
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
    viewer_tz: str | None = None,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = (
        select(
            ReviewPlayerTag.player_id,
            Player.name.label("player_name"),
            func.count().label("count")
        )
        .join(Review, Review.id == ReviewPlayerTag.review_id)
        .join(Match, Match.id == Review.match_id)
        .join(Player, Player.id == ReviewPlayerTag.player_id)
        .where(
            Review.user_id == current_user.id,
            ReviewPlayerTag.tag_type == ReviewPlayerTagType.MOTM,
        )
        .group_by(ReviewPlayerTag.player_id, Player.name)
        .order_by(func.count().desc())
        .limit(1)
    )

    if range:
        start, end = build_date_range(range, month, year, viewer_tz)
        stmt = stmt.where(Match.utc_date >= start, Match.utc_date <= end)

    result = await session.execute(stmt)
    row = result.first()
    return dict(row._mapping) if row else None

@router.get("/me/most-watched-competition")
async def get_my_top_competition(
    range: str = None,
    month: int = None,
    year: int = None,
    viewer_tz: str | None = None,
    session: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = (
        select(
            Match.competition_id,
            Competition.name.label("competition_name"),
            func.count().label("count")
        )
        .join(Review, Review.match_id == Match.id)
        .join(Competition, Competition.id == Match.competition_id)
        .where(Review.user_id == current_user.id)
        .group_by(Match.competition_id, Competition.name)
        .order_by(func.count().desc())
        .limit(1)
    )

    if range:
        start, end = build_date_range(range, month, year, viewer_tz)
        stmt = stmt.where(Match.utc_date >= start, Match.utc_date <= end)

    result = await session.execute(stmt)
    row = result.first()
    return dict(row._mapping) if row else None

@router.get("/me/total-matches")
async def get_total_matches(
    range: str = None,
    month: int = None,
    year: int = None,
    viewer_tz: str | None = None,
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
        start, end = build_date_range(range, month, year, viewer_tz)
        stmt = stmt.where(Match.utc_date >= start, Match.utc_date <= end)

    result = await session.execute(stmt)
    return {"total": result.scalar_one()}

@router.get("/match/{match_id}/motm-leader")
async def get_match_motm_leader(
    match_id: int,
    limit: int = 3,
    session: Session = Depends(get_db),
):
    counts_subquery = (
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
        .subquery()
    )

    stmt = (
        select(
            counts_subquery.c.player_id,
            Player.name.label("player_name"),
            counts_subquery.c.count,
        )
        .join(Player, Player.id == counts_subquery.c.player_id)
        .order_by(counts_subquery.c.count.desc())
        .limit(limit)
    )

    result = await session.execute(stmt)
    rows = result.all()
    return [dict(row._mapping) for row in rows]
