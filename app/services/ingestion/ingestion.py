import asyncio
from datetime import date, timedelta
from sqlmodel import select

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from core.database import AsyncSessionLocal
from services.ingestion.competitions import ingest_competition
from services.ingestion.teams import ingest_competition_teams_and_squads
from services.ingestion.matches import ingest_competition_matches
from models.competition import Competition

DEFAULT_COMPETITIONS = ["PL", "CL", "FL1", "SA", "PD", "BL1"]


# -----------------------------
# COMPETITION INGESTION
# -----------------------------
async def ingest_competitions_job():
    print("Running competition ingestion...")
    async with AsyncSessionLocal() as session:
        for code in DEFAULT_COMPETITIONS:
            await ingest_competition(session, code)
    print("Competition ingestion finished.")


# -----------------------------
# TEAMS + SQUADS INGESTION
# -----------------------------
async def ingest_teams_and_squads_job():
    print("Running teams + squads ingestion...")
    snapshot_date = date.today()

    async with AsyncSessionLocal() as session:
        competitions = (await session.execute(select(Competition))).scalars().all()

        for comp in competitions:
            await ingest_competition_teams_and_squads(
                session,
                comp,
                snapshot_date
            )

    print("Teams + squads ingestion finished.")


# -----------------------------
# MATCHES INGESTION
# -----------------------------
async def ingest_matches_job():
    print("Running match ingestion...")

    async with AsyncSessionLocal() as session:
        competitions = (await session.execute(select(Competition))).scalars().all()

        for comp in competitions:
            await ingest_competition_matches(
                session,
                comp,
                date_from=date.today() - timedelta(days=7),
                date_to=date.today()
            )

    print("Match ingestion finished.")


# -----------------------------
# SCHEDULER
# -----------------------------
def start_scheduler():
    scheduler = AsyncIOScheduler()

    # Competitions: once per week (Monday at 03:00)
    # scheduler.add_job(
    #     ingest_competitions_job,
    #     CronTrigger(day_of_week="mon", hour=3, minute=0),
    #     name="competition_ingestion",
    #     max_instances=1,
    #     coalesce=True,
    # )

    # Teams + squads: once per day (02:00)
    # scheduler.add_job(
    #     ingest_teams_and_squads_job,
    #     CronTrigger(hour=2, minute=0),
    #     name="teams_squads_ingestion",
    #     max_instances=1,
    #     coalesce=True,
    # )

    # Matches: every hour
    scheduler.add_job(
        ingest_matches_job,
        CronTrigger(minute=0),
        name="matches_ingestion",
        max_instances=1,
        coalesce=True,
    )

    scheduler.start()
    return scheduler


async def scheduler_main():
    scheduler = start_scheduler()

    print("Scheduler started...")

    try:
        while True:
            await asyncio.sleep(3600)
    except (KeyboardInterrupt, SystemExit):
        scheduler.shutdown()


if __name__ == "__main__":
    asyncio.run(scheduler_main())