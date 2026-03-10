from abc import ABC, abstractmethod
from concurrent.futures import Executor
from typing import List
import asyncio

from app.util.event_bus import EventBus
from app.util.job_store import JobStore
from app.util.types import Job, JobStatus, Paragraph, ServiceResult, ServiceResultCode, ServiceScope

class AnalysisService(ABC):
    """
    The AnalysisService interface is the base class that all service classes must extend
    
    Attributes:
        name (str): Name of the service
        scope (ServiceScope): Defines if a service is paragraph or article level
    """
    name: str
    scope: ServiceScope

    @abstractmethod
    def run(self, text: str) -> dict:
        """Run analysis and return the result as a dict"""
        pass

# Service Registry
REGISTERED_SERVICES: List[AnalysisService] = []

# Decorator for registering service classes
def register_service(cls):
    REGISTERED_SERVICES.append(cls())
    return cls

# Runner Function
async def run_all_services(job_id: str, job_store: JobStore, executor: Executor, event_bus: EventBus):
    """
    Run all registered services for a job, streaming results via the EventBus.
    Works with both ThreadPoolExecutor + InMemoryEventBus and
    ProcessPoolExecutor + RedisEventBus.
    """
    await job_store.update_status(job_id=job_id, status=JobStatus.RUNNING)
    job: Job = await job_store.get_job(job_id)
    async def run_service_paragraph(service: AnalysisService, paragraph: Paragraph):
        loop = asyncio.get_running_loop()
        try:
            # Run service in executor (thread or process)
            result = await loop.run_in_executor(executor, service.run, paragraph.text)

            service_result = ServiceResult(service_name=service.name,
                                           service_scope=ServiceScope.PARAGRAPH,
                                           paragraph_index=paragraph.index,
                                           result_code=ServiceResultCode.COMPLETE,
                                           result=result)

            stored = await job_store.store_result(job_id, service_result)
            if not stored:
                return

            await event_bus.publish(job_id, service_result)

        except Exception as e:
            service_result = ServiceResult(service_name=service.name,
                                           service_scope=ServiceScope.PARAGRAPH,
                                           paragraph_index=paragraph.index,
                                           result_code=ServiceResultCode.FAILED,
                                           error=str(e))
            stored = await job_store.store_result(job_id, service_result)
            if not stored:
                return

            await event_bus.publish(job_id, service_result)

    async def run_service_article(service: AnalysisService):
        loop = asyncio.get_running_loop()
        try:
            full_text = " ".join([p.text for p in job.paragraphs])
            result = await loop.run_in_executor(executor, service.run, full_text)

            service_result = ServiceResult(service_name=service.name,
                                           service_scope=ServiceScope.ARTICLE,
                                           result_code=ServiceResultCode.COMPLETE,
                                           result=result)

            stored = await job_store.store_result(job_id, service_result)
            if not stored:
                return

            await event_bus.publish(job_id, service_result)

        except Exception as e:
            service_result = ServiceResult(service_name=service.name,
                                           service_scope=ServiceScope.PARAGRAPH,
                                           result_code=ServiceResultCode.FAILED,
                                           error=str(e))
            stored = await job_store.store_result(job_id, service_result)
            if not stored:
                return

            await event_bus.publish(job_id, service_result)

    # Schedule all tasks
    tasks = []
    for service in REGISTERED_SERVICES:
        print(f"Running {service.name}")
        if service.scope == ServiceScope.PARAGRAPH:
            for paragraph in job.paragraphs:
                tasks.append(asyncio.create_task(run_service_paragraph(service, paragraph)))
        else:
            tasks.append(asyncio.create_task(run_service_article(service)))

    # Wait for all tasks to finish
    # TODO handle failed tasks
    completed = await asyncio.gather(*tasks, return_exceptions=True)
    for ret in completed:
        if isinstance(ret, BaseException):
            print(f"Error on a service: {ret}", flush=True)
    await job_store.update_status(job_id, JobStatus.COMPLETE)

    # Publish job completion
    completion = ServiceResult(service_name="job_complete",
                               service_scope=ServiceScope.ARTICLE,
                               result_code=ServiceResultCode.COMPLETE)
    await event_bus.publish(job_id, completion)