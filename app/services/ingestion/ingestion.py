import asyncio
from datetime import date
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select
from datetime import timedelta

from core.database import AsyncSessionLocal
from services.ingestion.competitions import ingest_competition
from services.ingestion.teams import ingest_competition_teams_and_squads
from services.ingestion.matches import ingest_competition_matches
from models.competition import Competition

DEFAULT_COMPETITIONS = ["PL", "CL", "FL1", "SA", "PD", "BL1"]

async def main():
    snapshot_date = date.today()

    async with AsyncSessionLocal() as session:
        # 1️⃣ Ingest competitions
        # for code in DEFAULT_COMPETITIONS:
        #     await ingest_competition(session, code)

        # 2️⃣ Ingest teams + squads in one pass
        competitions = (await session.execute(select(Competition))).scalars().all()
        # for comp in competitions:
        #     await ingest_competition_teams_and_squads(
        #         session, comp, snapshot_date
        #     )
        for comp in competitions:
            await ingest_competition_matches(session, comp, date_from=date.today() - timedelta(days=7),
                                             date_to=date.today())    

if __name__ == "__main__":
    asyncio.run(main())
