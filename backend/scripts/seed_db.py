import asyncio
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parents[1]))

from app.database import Base, SessionLocal, engine
from app.schemas import RequestCreate
from app.services.sample_data import SAMPLE_REQUESTS
from app.services.tickets import process_request


async def main():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        for sample in SAMPLE_REQUESTS:
            await process_request(db, RequestCreate(**sample))
    finally:
        db.close()


if __name__ == "__main__":
    asyncio.run(main())
