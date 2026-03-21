from abc import ABC, abstractmethod
import asyncio
import time
from typing import Dict
import redis
import os
import json

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
        
class RedisJobStore(JobStore):
    def __init__(self, event_bus: EventBus, redis: redis.Redis, maximum_lifetime: int = 600, completed_ttl: int = 300):
        redis_url ="localhost"
        self._maximum_lifetime = maximum_lifetime
        self._completed_ttl = completed_ttl
        self._redis = redis
        self._event_bus = event_bus

    async def initialize(self):
        await self._redis.ping()

    # TODO As is this will run on every server intance, but only one instance is needed. Possibly move this out of the app entirley??
    async def cleanup(self, completed_ttl = 300, maximum_lifetime = 600):
        """
        Redis handles cleanup via expire/TTL. This will wait for the job to expire, then delete the results channel.
        """
        pubsub = self._redis.pubsub()
        # TODO May want to change this to use keyevent instead of keyspace.
        await pubsub.psubscribe("__keyspace@0__:*")
        # TODO Make sure REDIS is configured to publish keyspace messages

        async for msg in pubsub.listen():
            if msg['data'] == 'expired':
                job_id = msg['channel'].split(":")[-1]
                await self._event_bus.delete_channel(job_id)
    
    async def create_job(self, job):
        key = f"job:{job.job_id}"
        await self._redis.json().set(key, '$', job.to_dict(), nx=True)
        await self._redis.expire(key, self._maximum_lifetime)

    async def get_job(self, job_id):
        key = f"job:{job_id}"
        job_dict = await self._redis.json().get(key)
        if not job_dict:
            return # TODO raise?
        return Job.from_dict(job_dict)

    async def update_status(self, job_id, status):
        key = f"job:{job_id}"
        await self._redis.json().set(key, "$.status", status.value, xx=True)
        if status == JobStatus.COMPLETE:
            now = time.time()
            await self._redis.json().set(key, "$.completed_at", now, xx=True)
            await self._redis.expire(key, self._completed_ttl)

    async def exists(self, job_id):
        key = f"job:{job_id}"
        if await self._redis.exists(key):
            return True
        return False

    async def store_result(self, job_id, result):
        key = f"job:{job_id}"
        if await self.exists(job_id):
            await self._redis.json().arrappend(key, "$.results", result.to_dict())
            return True
        else:
            return False