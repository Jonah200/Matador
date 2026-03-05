from abc import ABC, abstractmethod
import asyncio
from typing import AsyncGenerator, Dict

from app.util.types import ServiceResult

# EventBus for handling service result streaming. 
# Current implementation only handles one listener, but under normal use cases, this should be ok.
class EventBus(ABC):
    @abstractmethod
    async def publish(self, job_id: str, payload: ServiceResult | dict):
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