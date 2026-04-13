import asyncio

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
import uuid
import json

from app.DTO.Article import Article
from app.util.event_bus import EventBus
from app.util.job_store import JobStore

router = APIRouter()

@router.post("/analyze")
async def analyze(article: Article, request: Request):
    job_id = str(uuid.uuid4())

    event_bus: EventBus = request.app.state.event_bus
    job_store: JobStore = request.app.state.job_store
    expected_services = ["ner_service", "textrank_service", "ed_service", "cd_service", "isd_service"]
    await job_store.create_job(job_id=job_id,
                               article=article,
                               expected_services=expected_services) #TODO Change from hardcoded to dynamic expected_services

    await event_bus.publish("job_created", {"job_id": job_id, "expected_services": expected_services}, stream=True, maxlen=1000)

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

    queue = asyncio.Queue()

    async def callback(data: dict):
        await queue.put(data)

    await event_bus.subscribe(f"job:{job_id}:services", 
                        callback, 
                        stream=True, 
                        consumer_group="main_server", 
                        consumer_name="main_server_1",
                        catchup=True)
    
    async def event_generator():
        try:
            while True:
                try:
                    event = await asyncio.wait_for(queue.get(), timeout=0.5)
                except asyncio.TimeoutError:
                    if await request.is_disconnected():
                        break
                    continue
                ret = {"service_name": event.get("service_name"), "status": event.get('status'), "result": None}
                if ret['status'] == 'completed':
                    ret['result'] = await job_store.get_result(job_id, ret['service_name'])

                yield f"data: {json.dumps(ret)}\n\n"

                if event.get("service_name") == "job_complete":
                    break

        except Exception as e:
            print(f"Error: {e}")

        finally:
            await event_bus.unsubscribe(f"job:{job_id}:services")

    return StreamingResponse(event_generator(), media_type="text/event-stream")