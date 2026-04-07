import redis.asyncio as redis
from app.core.config import settings
import logging
import json
from typing import Optional, Any

logger = logging.getLogger(__name__)

class RedisCache:
    def __init__(self):
        self._client: Optional[redis.Redis] = None
        self._available = False
    
    async def connect(self):
        try:
            self._client = redis.from_url(
                settings.redis_url,
                encoding="utf-8",
                decode_responses=True,
            )
            await self._client.ping()
            self._available = True
            logger.info("Redis connected successfully")
        except Exception as e:
            logger.warning(f"Redis not available: {e}. Caching disabled.")
            self._client = None
            self._available = False
    
    async def disconnect(self):
        if self._client:
            await self._client.close()
            logger.info("Redis disconnected")
    
    @property
    def is_available(self) -> bool:
        return self._available and self._client is not None
    
    async def get(self, key: str) -> Optional[Any]:
        if not self.is_available:
            return None
        try:
            value = await self._client.get(key)
            if value:
                return json.loads(value)
        except Exception as e:
            logger.error(f"Redis get error: {e}")
        return None
    
    async def set(self, key: str, value: Any, ttl: int = None) -> bool:
        if not self.is_available:
            return False
        try:
            ttl = ttl or settings.cache_ttl_seconds
            await self._client.setex(key, ttl, json.dumps(value))
            return True
        except Exception as e:
            logger.error(f"Redis set error: {e}")
            return False
    
    async def delete(self, key: str) -> bool:
        if not self.is_available:
            return False
        try:
            await self._client.delete(key)
            return True
        except Exception as e:
            logger.error(f"Redis delete error: {e}")
            return False
    
    async def delete_pattern(self, pattern: str) -> int:
        if not self.is_available:
            return 0
        try:
            keys = []
            async for key in self._client.scan_iter(match=pattern):
                keys.append(key)
            if keys:
                return await self._client.delete(*keys)
        except Exception as e:
            logger.error(f"Redis delete pattern error: {e}")
        return 0

# Global cache instance
cache = RedisCache()
