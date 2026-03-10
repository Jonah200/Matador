from abc import ABC, abstractmethod
import asyncio
import uuid
import json
from typing import AsyncGenerator, Dict

from redis import Redis

from app.util.types import ServiceResult

# EventBus for handling service result streaming. 
# Current implementation only handles one listener, but under normal use cases, this should be ok.
class EventBus(ABC):
    @abstractmethod
    async def publish(self, job_id: str, payload: ServiceResult):
        pass
    @abstractmethod
    async def subscribe(self, job_id: str) -> AsyncGenerator[ServiceResult, None]:
        pass
    @abstractmethod
    async def delete_channel(self, job_id: str):
        pass

class InMemoryEventBus(EventBus):
    def __init__(self):
        self._channels: Dict[str, asyncio.Queue] = {}
        self._lock = asyncio.Lock()

    async def delete_channel(self, job_id):
        async with self._lock:
            self._channels.pop(job_id, None)

    async def publish(self, job_id, payload):
        async with self._lock:
            if job_id not in self._channels:
                self._channels[job_id] = asyncio.Queue()
            await self._channels[job_id].put(payload)
    
    async def subscribe(self, job_id):
        async with self._lock:
            if job_id not in self._channels:
                self._channels[job_id] = asyncio.Queue()
            queue = self._channels[job_id]

        while True:
            event = await queue.get()
            yield event


class RedisEventBus(EventBus):
    def __init__(self, redis: Redis):
        self._redis = redis

    async def delete_channel(self, job_id):
        key = f"results:{job_id}"
        await self._redis.delete(key)
    
    async def publish(self, job_id, payload):
        key = f"results:{job_id}"
        await self._redis.xadd(key, {"data": json.dumps(payload.to_dict())})
    
    async def subscribe(self, job_id):
        key = f"results:{job_id}"
        group = str(uuid.uuid4())
        await self._redis.xgroup_create(key, group, mkstream=True, id=0)
        try:
            while True:
                msg = await self._redis.xreadgroup(streams={key: ">"}, consumername="Client", groupname=group, count=1, block=0)
                msg_id, data = msg[0][1][0]
                await self._redis.xack(key, group, msg_id)
                yield ServiceResult.from_dict(json.loads(data['data']))
        finally:
            await self._redis.xgroup_destroy(key, group)
