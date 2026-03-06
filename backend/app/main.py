import asyncio
from concurrent.futures import ThreadPoolExecutor
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import analysis

from app.util.event_bus import InMemoryEventBus
from app.util.job_store import InMemoryJobStore

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(analysis.router)

# The lifespan context manager handles any tasks that need to be completed 
# TODO We should load models here as well
@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.executor = ThreadPoolExecutor()
    app.state.event_bus = InMemoryEventBus()
    app.state.job_store = InMemoryJobStore(event_bus=app.state.event_bus)
    cleanup_task = asyncio.create_task(app.state.job_store.cleanup())
    try:
        yield
    finally:
        cleanup_task.cancel()
        try:
            await cleanup_task
        except asyncio.CancelledError:
            pass
        app.state.executor.shutdown(wait=True)

app.router.lifespan_context = lifespan

# Basic Health Endpoint to ensure API is running
@app.get("/health")
async def health_check():
    return {"message": "ok"}