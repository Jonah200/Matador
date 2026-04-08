import asyncio

from app.util.logging_config import setup_logging
setup_logging()
from app.util.event_bus import RedisEventBus
from app.util.job_store import RedisJobStore

from app.services.core import ServiceWorkerManager
from app.services.claim_detection.claim_detection import detect_claims
from concurrent.futures import ProcessPoolExecutor

import os
import redis.asyncio as aioredis
from dotenv import load_dotenv
load_dotenv()

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
    executor = ProcessPoolExecutor()

    ner_service_worker_manager = ServiceWorkerManager(service_name="cd_service",
                                                      event_bus=event_bus,
                                                      job_store=job_store,
                                                      executor=executor,
                                                      process_fn=detect_claims)
    
    await ner_service_worker_manager.start()

    while True:
        await asyncio.sleep(3600)

if __name__ == "__main__":
    asyncio.run(main())