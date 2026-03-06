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
    """
    The stream_job endpoint initiates an SSE stream of service results.
    Params:
        job_id (str): UUID4 Job_ID returned from /analysis. Included in URL String
        request (Request): FastAPI request object, automatically included by the FastAPI router when endpoint is called

    Returns:
        StreamingResponse: On success initiates an SSE stream that will send service results as they become available.
        Each returned service result is a JSON object representing a ServiceResult object with the following fields:
        service_scope: str: Either 'article' or 'paragraph'
        service_name: str: Name of returning service, or 'job_complete' once all services completed
        result_code: str: Either 'complete' or 'failed'
        paragraph_index: int | None: For paragraph scoped services this is the index in the paragraphs array the result corresponds to, null for article scoped services
        result: dict | None: Dictionary of results returned by the AnalysisService run function, or null if an error occurred
        error: str | None: Error string if the service raised and Exception, or null if returned normally
        completed_at: float: Time of completion of the service in the form of seconds.microseconds since Epoch
    """
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