import asyncio
import time
import random

from app.DTO.Article import Article

def fake_nlp_task(paragraph_index: int):

    time.sleep(2)

    return {
        "type": "paragraph",
        "index": paragraph_index,
        "analysis": {
            "subjectivity_model": round(random.random(), 3),
            "emotional_intensity" : round(random.random(), 3)
        }
    }

async def run_fake_analysis(job_id: str, queue: asyncio.Queue, article: Article):
    loop = asyncio.get_running_loop()
    
    try:
        for i in range(5):
            result = await loop.run_in_executor(
                None,
                fake_nlp_task,
                i
            )

            await queue.put(result)

        await queue.put({"type": "complete"})

    except Exception as e:
        await queue.put({
            "type": "error",
            "message": str(e)
        })
