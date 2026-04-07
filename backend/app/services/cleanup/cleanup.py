from app.util.event_bus import EventBus
from app.util.job_store import JobStore
import asyncio
import time
from loguru import logger
 
MAX_JOB_DURATION = 60
COMPLETED_TTL = 300
CLEANUP_INTERVAL = 5

async def cleanup_loop(event_bus: EventBus, job_store: JobStore):
    while True:
        try:
            job_ids = await job_store.get_all_jobs()
            
            now = time.time()

            for job_id in job_ids:
                job = await job_store.get_job_meta(job_id)

                if not job:
                    continue

                if job.status != "completed":
                    #Job is complete, but has not yet been marked complete: Mark complete, send complete signal, move on
                    if await job_store.is_complete(job_id):
                        logger.trace(f"[CLEANUP] Job {job_id} being marked as completed")
                        await job_store.mark_completed(job_id)
                        await event_bus.publish(f"job:{job_id}:services",
                                            {
                                                "service_name": "job_complete",
                                                "status": "complete"
                                            },
                                            stream=True)
                        continue
                    #If job is expired then send kill signal, mark complete, and alert client that the job failed
                    if now - job.created_at > MAX_JOB_DURATION:
                        remaining = await job_store.get_remaining_services(job_id)
                        logger.trace(f"[CLEANUP] Job {job_id} has timed out, killing remaining: {remaining}")
                        await event_bus.publish("job_control",
                                                {
                                                    "job_id": job_id,
                                                    "action": "timeout"
                                                 })
                        for service in remaining:
                            await job_store.mark_failed(job_id, service)

                        await job_store.mark_completed(job_id)

                        await event_bus.publish(f"job:{job_id}:services",
                                                {
                                                    "service_name": "job_complete",
                                                    "status": "failed"
                                                },
                                                stream=True)
                        
                if job.status == "completed":
                    if now - job.completed_at > COMPLETED_TTL:
                        logger.trace(f"[CLEANUP] Deleting completed job {job_id}")
                        await job_store.delete_job(job_id)

        except Exception as e:
            logger.error(f"[CLEANUP ERROR] {str(e)}")

        await asyncio.sleep(CLEANUP_INTERVAL)