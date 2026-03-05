import pytest
import json
import asyncio

@pytest.mark.asyncio
async def test_event_bus_and_job_store(client, test_app):
    job_store = test_app.state.job_store
    event_bus = test_app.state.event_bus

    assert job_store is not None
    assert event_bus is not None

    content = {
        "url": "https://sample.com/article",
        "authors": ["Jane Doe", "John Doe"],
        "org": "sample news",
        "paragraphs": [{"index": 0, "text": "The article text"}, {"index": 1, "text": "is in here"}]
    }

    response = client.post("/analyze", content=json.dumps(content))
    assert response.status_code == 200

    job_id = response.json()['job_id']

    job = await job_store.get_job(job_id)

    print(job)
    

    

# @pytest.mark.asyncio
# async def test_basic_job_flow(client):
#     content = {
#         "url": "https://sample.com/article",
#         "authors": ["Jane Doe", "John Doe"],
#         "org": "sample news",
#         "paragraphs": [{"index": 0, "text": "The article text"}, {"index": 1, "text": "is in here"}]
#     }
#     response = client.post("/analyze", content=json.dumps(content))
#     assert response.status_code == 200
    
#     job_id = response.json()["job_id"]
#     assert job_id in jobs

#     with client.stream("GET", f"/stream/{job_id}") as event_stream:
#         received_messages = []

#         for line in event_stream.iter_lines():
#             if line:
#                 payload = json.loads(line.split("data: ")[1])
#                 received_messages.append(payload)
#                 if payload.get("type") == "complete":
#                     break

#     paragraph_msgs = [m for m in received_messages if m.get("type") == "paragraph"]
#     assert len(paragraph_msgs) == 5
#     assert received_messages[-1]["type"] == "complete"
#     assert job_id not in jobs