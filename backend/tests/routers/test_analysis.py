import pytest
import json
import asyncio

from app.routers.analysis import jobs

@pytest.mark.asyncio
async def test_basic_job_flow(client):
    response = client.post("/analyze")
    assert response.status_code == 200

    job_id = response.json()["job_id"]
    assert job_id in jobs

    with client.stream("GET", f"/stream/{job_id}") as event_stream:
        received_messages = []

        for line in event_stream.iter_lines():
            if line:
                payload = json.loads(line.split("data: ")[1])
                received_messages.append(payload)
                if payload.get("type") == "complete":
                    break

    paragraph_msgs = [m for m in received_messages if m.get("type") == "paragraph"]
    assert len(paragraph_msgs) == 5
    assert received_messages[-1]["type"] == "complete"
    assert job_id not in jobs