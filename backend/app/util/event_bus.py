import asyncio
import json
from typing import Awaitable, Callable, Dict, Optional

import redis.asyncio as aioredis
from redis.asyncio.client import PubSub
from redis.exceptions import ResponseError

from app.util.types import ServiceResult

# EventBus for handling service result streaming. 
# Current implementation only handles one listener, but under normal use cases, this should be ok.
class EventBus:
    async def publish(self, channel: str, message: Dict, *, stream=False, maxlen: int | None = None): ...

    async def subscribe(self, channel: str,
                        callback: Callable[[Dict], Awaitable[None]], 
                        *, 
                        stream = False, 
                        consumer_group: Optional[str] = None,
                        consumer_name: Optional[str] = None,
                        read_count: int = 10,
                        block_ms: int = 5000,
                        catchup: bool = False
                        ): ...

    async def unsubscribe(self, channel: str): ...


class RedisEventBus(EventBus):
    def __init__(self, redis: aioredis.Redis):
        self.redis = redis
        self.pubsub_connections: Dict[str, PubSub] = {}
        self.pubsub_tasks: Dict[str, asyncio.Task] = {}
        self.stream_tasks: Dict[str, asyncio.Task] = {}

    async def close(self):
        for task in self.stream_tasks.values():
            task.cancel()
        self.stream_tasks.clear()

        for task in self.pubsub_tasks.values():
            task.cancel()
        self.pubsub_tasks.clear()

        for pub in self.pubsub_connections.values():
            await pub.unsubscribe()
            await pub.close()
        self.pubsub_connections.clear()

    async def publish(self, channel, message, *, stream=False, maxlen=None):
        data = json.dumps(message)
        if stream:
            await self.redis.xadd(channel, {"data": data}, maxlen=maxlen)
        else:
            await self.redis.publish(channel, data)

    async def subscribe(self, channel, 
                        callback, 
                        *, 
                        stream=False, 
                        consumer_group = None, 
                        consumer_name = None, 
                        read_count = 10,
                        block_ms = 5000,
                        catchup=False):
        if stream:
            if not consumer_group or not consumer_name:
                raise ValueError("consumer_group and consumer_name required to subscribe to stream")
            await self._subscribe_stream(channel, callback, consumer_group, consumer_name, read_count, block_ms, catchup)
        else:
            await self._subscribe_pubsub(channel, callback)

    #TODO What if it attempts to subscribe to the same stream twice? Shouldn't happen but may need to be handled
    async def _subscribe_stream(self, channel: str,
                                callback: Callable[[dict], Awaitable[None]], 
                                consumer_group: str, 
                                consumer_name: str, 
                                read_count: int, 
                                block_ms: int,
                                catchup: bool = False):
        try:
            intial_id = "0-0" if catchup else "$"
            await self.redis.xgroup_create(channel, groupname=consumer_group, mkstream=True, id=intial_id)
        except ResponseError:
            pass # Consumer Group already exists

        async def reader():
            start_id = "0" if catchup else ">"
            while True:
                resp = await self.redis.xreadgroup(
                    groupname=consumer_group,
                    consumername=consumer_name,
                    streams={channel: start_id},
                    count=read_count,
                    block=block_ms
                )
                start_id = ">"
                if not resp:
                    await asyncio.sleep(0.1)
                    continue

                for stream, messages in resp:
                    for message_id, message_fields in messages:
                        data = json.loads(message_fields["data"])
                        try:
                            await callback(data)  
                            await self.redis.xack(channel, consumer_group, message_id)
                        except Exception as e:
                            print(f"Error handling a stream message {message_id}: {e}")

        task = asyncio.create_task(reader())
        self.stream_tasks[channel] = task

    async def _subscribe_pubsub(self, channel: str, 
                                callback: Callable[[dict], Awaitable[None]]):
        pubsub = self.redis.pubsub()
        await pubsub.subscribe(channel)
        self.pubsub_connections[channel] = pubsub

        async def reader():
            async for msg in pubsub.listen():
                if msg is None:
                    continue
                if msg["type"] != "message":
                    continue
                data = json.loads(msg["data"])
                await callback(data)

        task = asyncio.create_task(reader())
        self.pubsub_tasks[channel] = task

    async def unsubscribe(self, channel):
        if channel in self.pubsub_connections:
            pubsub = self.pubsub_connections.pop(channel)
            await pubsub.unsubscribe()
            await pubsub.close()

        if channel in self.pubsub_tasks:
            task = self.pubsub_tasks.pop(channel)
            task.cancel()

        if channel in self.stream_tasks:
            task = self.stream_tasks.pop(channel)
            task.cancel()