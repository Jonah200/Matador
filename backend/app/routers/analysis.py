from concurrent.futures import Executor
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
import uuid
import asyncio
import json

from app.DTO.Article import Article
from app.services.core import run_all_services
from app.util.event_bus import EventBus
from app.util.job_store import JobStore
from app.util.types import Job, Paragraph

router = APIRouter()

@router.post("/analyze")
async def analyze(article: Article, request: Request):
    job_id = str(uuid.uuid4())

    job = Job(job_id=job_id,
              paragraphs=[Paragraph(
                  index=para['index'],
                  text=para['text']) 
                  for para in article.paragraphs])

    executor: Executor = request.app.state.executor
    event_bus: EventBus = request.app.state.event_bus
    job_store: JobStore = request.app.state.job_store

    await job_store.create_job(job)

    asyncio.create_task(run_all_services(job_id, job_store, executor, event_bus))

    return {"job_id": job_id}

@router.get("/stream/{job_id}")
async def stream_job(job_id: str, request: Request):
    event_bus: EventBus = request.app.state.event_bus
    job_store: JobStore = request.app.state.job_store

    if not await job_store.exists(job_id):
        raise HTTPException(status_code=404, detail="job_id not found")

    async def event_generator():
        try:
            async for event in event_bus.subscribe(job_id):
                yield f"data: {json.dumps(event.to_dict())}\n\n"
                if event.service_name == "job_complete":
                    break

        except Exception as e:
            print(e)

    return StreamingResponse(event_generator(), media_type="text/event-stream")