import asyncio
from services.ingestion.ingestion import scheduler_main

if __name__ == "__main__":
    asyncio.run(scheduler_main())