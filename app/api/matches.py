from fastapi import APIRouter, Depends, Query
from sqlmodel import Session, select
from datetime import datetime, timedelta
from core.database import get_db
from models.match import Match
from models.team import Team
from models.competition import Competition
from schemas.match import MatchListResponse, MatchBase
from sqlalchemy import or_
from sqlalchemy.orm import aliased

router = APIRouter(prefix="/matches", tags=["matches"])


@router.get("", response_model=MatchListResponse)
async def get_matches(
    date_from: datetime | None = Query(None),
    date_to: datetime | None = Query(None),
    status: str | None = Query(None),
    session: Session = Depends(get_db)
):
    # Defaults: if neither provided, use a 3-day lookback / 3-day lookahead window
    if date_from is None and date_to is None:
        today = datetime.utcnow()
        date_from = today - timedelta(days=3)
        date_to = today + timedelta(days=3)
    elif date_from is None:
        # if only date_to provided, make a window ending at date_to
        date_from = date_to - timedelta(days=3)
    elif date_to is None:
        # if only date_from provided, make a window starting at date_from
        date_to = date_from + timedelta(days=3)

    # If the caller passed the exact same timestamp for both bounds, expand the upper bound
    # to include that whole day (or at least a non-empty range).
    if date_from == date_to:
        date_to = date_to + timedelta(days=1)

    home_team = aliased(Team)
    away_team = aliased(Team)

    statement = (
        select(
            Match,
            home_team.short_name.label("home_team_name"),
            away_team.short_name.label("away_team_name"),
            Competition.name.label("competition_name")
        )
        .join(home_team, Match.home_team_id == home_team.id)
        .join(away_team, Match.away_team_id == away_team.id)
        .join(Competition, Match.competition_id == Competition.id)
        .where(
            Match.utc_date >= date_from,
            Match.utc_date <= date_to
        )
    )

    if status:
        statement = statement.where(Match.status == status)

    result = await session.execute(statement)
    matches_data = []
    for match, h_name, a_name, c_name in result:
        m_dict = match.model_dump()
        m_dict["home_team_name"] = h_name
        m_dict["away_team_name"] = a_name
        m_dict["competition_name"] = c_name
        matches_data.append(m_dict)

    return {"matches": matches_data}

from fastapi import HTTPException
from models.match import Match
from models.player import Player
from models.team import Team
from models.team_squad import TeamSquad
from schemas.match import MatchDetailResponse, PlayerMini, TeamMini


@router.get("/{match_id}", response_model=MatchDetailResponse)
async def get_match_detail(
    match_id: int,
    session: Session = Depends(get_db)
):
    # if get_db provides an async session, await the call
    match = await session.get(Match, match_id)
    print(match)

    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    home_team =  await session.get(Team, match.home_team_id)
    away_team =  await session.get(Team, match.away_team_id)

    match_date = match.utc_date

    # Home squad
    home_statement = (
        select(Player)
        .join(TeamSquad, TeamSquad.player_id == Player.id)
        .where(
            TeamSquad.team_id == match.home_team_id,
            TeamSquad.valid_from <= match_date,
            or_(
                TeamSquad.valid_to == None,
                TeamSquad.valid_to >= match_date
            )
        )
    )

    home_players =  (await session.execute(home_statement)).scalars().all()

    # Away squad
    away_statement = (
        select(Player)
        .join(TeamSquad, TeamSquad.player_id == Player.id)
        .where(
            TeamSquad.team_id == match.away_team_id,
            TeamSquad.valid_from <= match_date,
            or_(
                TeamSquad.valid_to == None,
                TeamSquad.valid_to >= match_date
            )
        )
    )

    away_players = (await session.execute(away_statement)).scalars().all()

    return {
        "match": match,
        "home_team": TeamMini(id=home_team.id, name=home_team.name, short_name=home_team.short_name, crest_url=home_team.crest_url),
        "away_team": TeamMini(id=away_team.id, name=away_team.name, short_name=away_team.short_name,crest_url=away_team.crest_url),
        "home_squad_players": [
            PlayerMini(id=p.id, name=p.name) for p in home_players
        ],
        "away_squad_players": [
            PlayerMini(id=p.id, name=p.name) for p in away_players
        ],
    }