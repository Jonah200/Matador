from abc import ABC, abstractmethod
import asyncio
import time
from typing import Dict

from app.util.event_bus import EventBus
from app.util.types import Job, JobStatus, ServiceResult

# JobStore holds job metadata
class JobStore(ABC):
    @abstractmethod
    async def cleanup(self, completed_ttl: int = 300, maximum_lifetime: int = 600):
        pass
    @abstractmethod
    async def create_job(self, job: Job):
        pass
    @abstractmethod
    async def get_job(self, job_id: str) -> Job:
        pass
    @abstractmethod
    async def update_status(self, job_id: str, status: JobStatus):
        pass
    @abstractmethod
    async def exists(self, job_id: str) -> bool:
        pass
    @abstractmethod
    async def store_result(self, job_id: str, result: ServiceResult) -> bool:
        pass

class InMemoryJobStore(JobStore):
    def __init__(self, event_bus: EventBus):
        self._jobs: Dict[str, Job] = {}
        self._lock = asyncio.Lock()
        self._event_bus = event_bus

    async def cleanup(self, completed_ttl: int = 300, maximum_lifetime: int = 600):
        while True:
            now = time.time()

            async with self._lock:
                expired = [
                    job_id
                    for job_id, job in self._jobs.items()
                    if (
                        (job.status == JobStatus.COMPLETE and job.completed_at and now - job.completed_at > completed_ttl)
                        or (now - job.created_at > maximum_lifetime)
                    )
                ]

            for job_id in expired:
                del self._jobs[job_id]
            
            for job_id in expired:
                await self._event_bus.delete_channel(job_id)
        
            await asyncio.sleep(60)

    async def create_job(self, job):
        async with self._lock:
            self._jobs[job.job_id] = job

    async def get_job(self, job_id):
        async with self._lock:
            job = self._jobs.get(job_id)
            if not job:
                raise KeyError
            return job

    async def update_status(self, job_id, status):
        async with self._lock:
            job = self._jobs.get(job_id)
            if not job:
                return #TODO raise?
            self._jobs[job_id].status = status
            if status == JobStatus.COMPLETE:
                self._jobs[job_id].completed_at = time.time()
    
    async def exists(self, job_id):
        async with self._lock:
            return job_id in self._jobs
        
    async def store_result(self, job_id, result):
        async with self._lock:
            job = self._jobs.get(job_id)
            if not job:
                return False
            job.results.append(result)
        return True
        