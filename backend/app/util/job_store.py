import time
from typing import List, Set
import redis.asyncio as aioredis
import json

from app.util.types import JobMeta
from app.DTO.Article import Article

# JobStore holds job metadata
class JobStore:
    async def create_job(self, job_id: str, article: Article, expected_services: List[str]): ...

    async def get_article(self, job_id: str) -> Article: ...

    async def mark_running(self, job_id: str): ...

    async def add_result(self, job_id: str, service: str, result: dict): ...

    async def mark_failed(self, job_id: str, service: str): ...

    async def get_job_meta(self, job_id: str) -> JobMeta | None: ...

    async def is_complete(self, job_id: str) -> bool: ...

    async def mark_completed(self, job_id: str): ...

    async def exists(self, job_id: str) -> bool: ...

    async def delete_job(self, job_id: str): ...

    async def get_result(self, job_id: str, service_name: str) -> dict: ...

    async def get_all_jobs(self) -> Set[str]: ...

    async def get_remaining_services(self, job_id: str) -> Set[str]: ...
class RedisJobStore(JobStore):
    def __init__(self, redis: aioredis.Redis):
        self.redis = redis

    def _meta_key(self, job_id: str): return f"job:{job_id}:meta"
    def _article_key(self, job_id: str): return f"job:{job_id}:article"
    def _results_key(self, job_id: str): return f"job:{job_id}:results"
    def _completed_key(self, job_id: str): return f"job:{job_id}:completed"
    def _failed_key(self, job_id: str): return f"job:{job_id}:failed"
    def _services_key(self, job_id: str): return f"job:{job_id}:services"

    async def create_job(self, job_id, article, expected_services):
        pipe = self.redis.pipeline(transaction=True)

        pipe.hset(self._meta_key(job_id), mapping={
            "status": "pending",
            "created_at": str(time.time()),
            "expected_services": json.dumps(expected_services),
            "completed_at": -1
        })

        pipe.set(self._article_key(job_id), article.model_dump_json())
        pipe.sadd("job:all", job_id)

        await pipe.execute()

    async def get_article(self, job_id):
        res = await self.redis.get(self._article_key(job_id))
        return Article.model_validate(json.loads(res))
    
    async def mark_running(self, job_id):
        await self.redis.hset(self._meta_key(job_id), "status", "running")

    async def add_result(self, job_id, service, result):
        pipe = self.redis.pipeline()

        pipe.hset(self._results_key(job_id), mapping={
            service: json.dumps(result)
        })

        pipe.sadd(self._completed_key(job_id), service)

        await pipe.execute()

    async def get_result(self, job_id, service_name):
        result = await self.redis.hget(self._results_key(job_id), service_name)
        return json.loads(result)

    async def mark_failed(self, job_id, service):
        await self.redis.sadd(self._failed_key(job_id), service)

    async def get_job_meta(self, job_id):
        data = await self.redis.hgetall(self._meta_key(job_id))

        if not data:
            return None
        
        data['expected_services'] = json.loads(data['expected_services'])

        return JobMeta(job_id=job_id,
                       status=data['status'],
                       created_at=float(data['created_at']),
                       completed_at=float(data['completed_at']),
                       expected_services=data['expected_services'])
    
    async def is_complete(self, job_id):
        meta = await self.get_job_meta(job_id)

        expected = set(meta.expected_services)

        completed = set(await self.redis.smembers(self._completed_key(job_id)))
        failed = set(await self.redis.smembers(self._failed_key(job_id)))

        return len(expected) == len(completed) + len(failed)
    
    async def mark_completed(self, job_id):
        pipe = self.redis.pipeline()

        pipe.hset(self._meta_key(job_id), "status", "completed")
        pipe.hset(self._meta_key(job_id), "completed_at", time.time())

        await pipe.execute()

    async def exists(self, job_id):
        if await self.redis.exists(self._meta_key(job_id)):
            return True
        return False
    
    async def delete_job(self, job_id):
        job_keys = [self._meta_key(job_id), 
                    self._article_key(job_id), 
                    self._completed_key(job_id), 
                    self._failed_key(job_id),
                    self._results_key(job_id), 
                    self._services_key(job_id)
                ]

        async with self.redis.pipeline(transaction=True) as pipe:
            pipe.delete(*job_keys)
            pipe.srem("job:all", job_id)
            results = await pipe.execute()
        print(f"Deleted {results[0]} keys")
    
    async def get_all_jobs(self):
        return await self.redis.smembers("job:all")
    
    async def get_remaining_services(self, job_id):
        meta = await self.get_job_meta(job_id)
        completed_services = await self.redis.smembers(self._completed_key(job_id))
        failed_services = await self.redis.smembers(self._failed_key(job_id))
        return set(meta.expected_services).difference(completed_services | failed_services)