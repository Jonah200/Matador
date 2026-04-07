from concurrent.futures import Executor
from typing import Awaitable, Callable, Dict, List
import asyncio

from app.util.event_bus import EventBus
from app.util.job_store import JobStore
from app.DTO.Article import Article

class ServiceWorkerManagerInterface:
    def __init__(
            self,
            service_name: str,
            event_bus: EventBus,
            job_store: JobStore,
            process_fn: Callable[[Article], dict],
            executor: Executor,
            max_worker: int = 2
    ):
        ...

    async def start(self):
        """Start listening for new jobs"""

    async def handle_job_created(self, msg: dict):
        """Callback for handling new jobs"""

    async def handle_control_event(self, msg: dict):
        """Callback for control messages"""

    async def run_worker(self, job_id: str):
        """Spawn  an manage a new worker"""

    async def shutdown(self):
        """Shutdown the service"""

class ServiceWorkerManager(ServiceWorkerManagerInterface):
    def __init__(self, service_name, event_bus, job_store, process_fn, executor, max_workers = 2):
        self.service_name = service_name
        self.event_bus: EventBus = event_bus
        self.job_store: JobStore = job_store
        self.process_fn = process_fn
        self.max_workers = max_workers
        self.executor = executor

        self.running_jobs: Dict[str, asyncio.Task] = {}
        self.semaphore = asyncio.Semaphore(max_workers)

    async def start(self):
        await self.event_bus.subscribe(
            "job_created",
            self.handle_job_created,
            stream=True,
            consumer_group=self.service_name,
            consumer_name=f"{self.service_name}_1"
            )
        
        await self.event_bus.subscribe(
            "job_control",
            self.handle_control_event
        )
        print(f"[SERVICE WORKER MANAGER] Service started: {self.service_name}", flush=True)

    async def handle_job_created(self, msg):
        job_id = msg["job_id"]
        expected_services = msg["expected_services"]

        if self.service_name not in expected_services:
            return
        
        if job_id in self.running_jobs:
            return
        
        def _cleanup(t):
            self.running_jobs.pop(job_id, None)
            if t.cancelled():
                print(f"[SERVICE WORKER MANAGER] {self.service_name} cancelled job returned: {job_id}")
            else:
                print(f"[SERVICE WORKER MANAGER] {self.service_name} task complete: {job_id}")


        task = asyncio.create_task(self.run_worker(job_id))

        task.add_done_callback(_cleanup)

        self.running_jobs[job_id] = task

    async def run_worker(self, job_id):
        print(f"[SERVICE WORKER MANAGER] processing {self.service_name}: {job_id}", flush=True)
        article = await self.job_store.get_article(job_id)
        try:
            async with self.semaphore:
                    loop = asyncio.get_running_loop()
                    result = await loop.run_in_executor(self.executor, 
                                                        self.process_fn,
                                                        article)
            await self.job_store.add_result(job_id, self.service_name, result)
            await self.event_bus.publish(f"job:{job_id}:services", 
                                   {
                                       "service_name": self.service_name,
                                       "status": "completed",
                                   }, 
                                    stream=True)
        
        except Exception as e:
            print(f"[SERVICE WORKER MANAGER] ran into an exception {e} while processing a job: {job_id}")
            await self.job_store.mark_failed(job_id, self.service_name)
            await self.event_bus.publish(f"job:{job_id}:services", 
                                   {
                                       "service_name": self.service_name,
                                       "status": "failed",
                                   }, 
                                    stream=True) 
        
    async def handle_control_event(self, msg):
        job_id = msg.get('job_id')
        action = msg.get('action')
        if not job_id:
            return
        if action == "timeout":
            if job_id in self.running_jobs:
                print(f"[SERVICE WORKER MANAGER] job timeout signal recieved, cancelling job: {job_id}")
                self.running_jobs[job_id].cancel()

    async def shutdown(self):
        pass #TODO