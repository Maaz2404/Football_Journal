from datetime import date, datetime, timedelta
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession

from services.api_football_data import fetch_competition_matches
from models.match import Match
from models.competition import Competition


async def ingest_competition_matches(
    session: AsyncSession,
    competition: Competition,
    date_from: date | None = None,
    date_to: date | None = None,
    days_ahead: int = 7,
    season: int | None = None,
) -> None:
    """
    Fetch matches for a competition within a date range and upsert them.

    - If date_from/date_to not provided:
        defaults to today → today + days_ahead
    - Inserts new matches
    - Updates existing matches (status, scores, kickoff time, etc.)
    """

    today = date.today()

    # Default range behavior (backward compatible)
    if date_from is None:
        date_from = today

    if date_to is None:
        date_to = date_from + timedelta(days=days_ahead)

    data = await fetch_competition_matches(
        competition.code,
        season=season,
        dateFrom=date_from.isoformat(),
        dateTo=date_to.isoformat(),
    )

    matches = data.get("matches", [])

    for m in matches:
        match_id = m["id"]

        # Parse kickoff time
        utc_date = datetime.fromisoformat(
            m["utcDate"].replace("Z", "+00:00")
        )

        home_score = m["score"]["fullTime"]["home"]
        away_score = m["score"]["fullTime"]["away"]

        # Check if match exists
        existing = await session.get(Match, match_id)

        if not existing:
            # Insert new match
            session.add(
                Match(
                    id=match_id,
                    competition_id=competition.id,
                    utc_date=utc_date,
                    status=m["status"],
                    matchday=m.get("matchday"),
                    home_team_id=m["homeTeam"]["id"],
                    away_team_id=m["awayTeam"]["id"],
                    home_score=home_score,
                    away_score=away_score,
                )
            )
        else:
            # Update ALL mutable fields (API data can change)
            existing.utc_date = utc_date
            existing.status = m["status"]
            existing.matchday = m.get("matchday")
            existing.home_team_id = m["homeTeam"]["id"]
            existing.away_team_id = m["awayTeam"]["id"]
            existing.home_score = home_score
            existing.away_score = away_score

    await session.commit()