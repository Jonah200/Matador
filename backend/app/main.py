import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from app.routers import analysis

app = FastAPI()

app.include_router(analysis.router)

# The lifespan context manager handles any tasks that need to be completed 
# TODO We should load models here as well
@asynccontextmanager
async def lifespan(app: FastAPI):
    cleanup_task = asyncio.create_task(analysis.cleanup_jobs())
    try:
        yield
    finally:
        cleanup_task.cancel()
        try:
            await cleanup_task
        except asyncio.CancelledError:
            pass

app.router.lifespan_context = lifespan

# Basic Health Endpoint to ensure API is running
@app.get("/health")
async def health_check():
    return {"message": "ok"}