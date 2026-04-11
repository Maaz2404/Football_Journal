from fastapi import FastAPI
import asyncio
import os
from services.ingestion.ingestion import scheduler_main, ingest_matches_job

app = FastAPI()
scheduler_task = None


@app.api_route("/", methods=["GET", "HEAD"])
async def health_check():
    return {"status": "Scheduler is running"}


@app.api_route("/trigger", methods=["GET", "HEAD"])
async def trigger():
    await ingest_matches_job()
    return {"status": "ingestion run"}


@app.on_event("startup")
async def start_scheduler():
    global scheduler_task
    if scheduler_task is None:
        scheduler_task = asyncio.create_task(scheduler_main())
        print("Scheduler started...")


@app.on_event("shutdown")
async def stop_scheduler():
    global scheduler_task
    if scheduler_task:
        scheduler_task.cancel()
        try:
            await scheduler_task
        except asyncio.CancelledError:
            print("Scheduler stopped.")