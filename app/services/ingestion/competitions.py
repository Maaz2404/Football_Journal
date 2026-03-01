from datetime import date
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy import select

from services.api_football_data import fetch_competitions
from models.competition import Competition


def _parse_date(value: str | None) -> date | None:
    if not value:
        return None
    return date.fromisoformat(value)


async def ingest_competition(
    session: AsyncSession,
    competition_code: str,
):
    """
    Ingest latest season of ONE competition
    """

    data = await fetch_competitions(code=competition_code)

    seasons = data.get("seasons", [])
    if not seasons:
        return

    # latest season by startDate
    latest = max(
        seasons,
        key=lambda s: s["startDate"] or "0000-00-00"
    )

    competition_api_id = latest["id"]

    # Check if already ingested
    stmt = select(Competition).where(Competition.id == competition_api_id)
    result = await session.execute(stmt)
    existing = result.scalar_one_or_none()


    if existing:
        return  # idempotent, nothing to do

    competition = Competition(
        id=competition_api_id,
        name=data["name"],
        type=data["type"],
        area_name=data["area"]["name"],
        start_date=_parse_date(latest["startDate"]),
        end_date=_parse_date(latest["endDate"]),
        code=data["code"],
    )

    session.add(competition)
    await session.commit()
