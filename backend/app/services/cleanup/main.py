from app.services.cleanup.cleanup import cleanup_loop
from app.util.event_bus import RedisEventBus
from app.util.job_store import RedisJobStore
import asyncio
import redis.asyncio as aioredis
from dotenv import load_dotenv
from app.util.logging_config import setup_logging
setup_logging()
from loguru import logger
load_dotenv()
import os

async def main():
    redis_host = os.environ.get("REDIS_URL", "localhost")
    redis_port = int(os.environ.get("REDIS_PORT", 6379))
    redis_user = os.environ.get("REDIS_USER")
    redis_pwd = os.environ.get("REDIS_PWD")
    redis_client = aioredis.Redis(host=redis_host, 
                                       port=redis_port,
                                       username=redis_user, 
                                       password=redis_pwd, 
                                       decode_responses=True, 
                                       max_connections=20)
    
    await redis_client.ping()
    event_bus = RedisEventBus(redis_client)
    job_store = RedisJobStore(redis_client)

    logger.info("[CLEANUP] Starting Cleanup Service")
    await cleanup_loop(event_bus=event_bus,job_store=job_store)

if __name__ == "__main__":
    asyncio.run(main())