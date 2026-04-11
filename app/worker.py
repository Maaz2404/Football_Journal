import asyncio
import os
from fastapi import FastAPI
import uvicorn

from services.ingestion.ingestion import scheduler_main

app = FastAPI()
scheduler_task = None


@app.get("/",methods=["GET", "HEAD"])
async def health_check():
    return {"status": "Scheduler is running"}


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
            
@app.get("/trigger", methods=["GET", "HEAD"])
async def trigger():
    from services.ingestion.ingestion import ingest_matches_job
    await ingest_matches_job()
    return {"status": "ingestion run"}            


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 10000))
    uvicorn.run(app, host="0.0.0.0", port=port)