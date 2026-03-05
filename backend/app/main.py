import asyncio
from concurrent.futures import ProcessPoolExecutor, ThreadPoolExecutor
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import redis
from app.routers import analysis
from dotenv import load_dotenv
load_dotenv()
import os

from app.util.event_bus import InMemoryEventBus, RedisEventBus
from app.util.job_store import InMemoryJobStore, RedisJobStore

app = FastAPI()

from fastapi.middleware.cors import CORSMiddleware  

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
    redis_host = os.environ.get("REDIS_URL", "localhost")
    redis_port = int(os.environ.get("REDIS_PORT", 6379))
    redis_user = os.environ.get("REDIS_USER")
    redis_pwd = os.environ.get("REDIS_PWD")
    app.state.executor = ProcessPoolExecutor()
    redis_client = redis.asyncio.Redis(host=redis_host, 
                                       port=redis_port,
                                       username=redis_user, 
                                       password=redis_pwd, 
                                       decode_responses=True, 
                                       max_connections=20)
    await redis_client.ping()
    app.state.event_bus = RedisEventBus(redis=redis_client)
    app.state.job_store = RedisJobStore(redis=redis_client, event_bus=app.state.event_bus)
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