from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
import uuid
import asyncio
import json
import time

from app.services.sample_service import run_fake_analysis
from app.DTO.Article import Article

router = APIRouter()

jobs: dict[str, dict] = {}

# This function will watch for jobs that were created over ttl seconds ago and remove them to prevent old results from piling up
async def cleanup_jobs(ttl=300):
    while True:
        now = time.time()
        to_delete = [job_id for job_id, job in jobs.items()
                     if now - job["created"] > ttl]
        for job_id in to_delete:
            del jobs[job_id]
        await asyncio.sleep(60)

@router.post("/analyze")
async def analyze(article: Article):
    job_id = str(uuid.uuid4())

    queue = asyncio.Queue()

    jobs[job_id] = {
        "queue": queue,
        "complete": False, # As of now this field is unnecessary, but it may be useful in the future
        "created": time.time()
    }

    asyncio.create_task(run_fake_analysis(job_id, queue, article))

    return {"job_id" : job_id}

@router.get("/stream/{job_id}")
async def stream_job(job_id: str):
    
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")
    
    queue = jobs[job_id]["queue"]

    async def event_generator():
        try:
            while True:
                message = await queue.get()
                yield f"data: {json.dumps(message)}\n\n"

                if message["type"] == "complete":
                    break
            
        finally:
            # Cleanup of completed jobs
            del jobs[job_id]


    return StreamingResponse(event_generator(), media_type="text/event-stream")