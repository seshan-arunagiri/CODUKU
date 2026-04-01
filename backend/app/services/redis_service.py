import redis
from redis import Redis
from typing import Optional, Dict, List, Any, Tuple
from app.core.config import settings
import logging
import json

logger = logging.getLogger(__name__)

class RedisService:
    """Upstash Redis Service - Leaderboards & Caching"""
    
    _instance: Optional[Redis] = None
    
    @classmethod
    def get_client(cls) -> Redis:
        """Get or create Redis client"""
        if cls._instance is None:
            try:
                cls._instance = redis.from_url(
                    settings.UPSTASH_REDIS_URL,
                    decode_responses=True,
                    socket_connect_timeout=5
                )
                # Test connection
                cls._instance.ping()
                logger.info("✅ Redis (Upstash) connected")
            except Exception as e:
                logger.error(f"❌ Redis connection failed: {e}")
                raise
        return cls._instance
    
    # ===== CACHE OPERATIONS =====
    
    @classmethod
    async def set(cls, key: str, value: Any, ttl: int = 3600):
        """Set cache value"""
        try:
            client = cls.get_client()
            key = f"{settings.REDIS_NAMESPACE}:{key}"
            value_str = json.dumps(value) if not isinstance(value, str) else value
            client.setex(key, ttl, value_str)
        except Exception as e:
            logger.error(f"❌ Redis SET error: {e}")
    
    @classmethod
    async def get(cls, key: str) -> Optional[Any]:
        """Get cache value"""
        try:
            client = cls.get_client()
            key = f"{settings.REDIS_NAMESPACE}:{key}"
            value = client.get(key)
            if value:
                try:
                    return json.loads(value)
                except:
                    return value
            return None
        except Exception as e:
            logger.error(f"❌ Redis GET error: {e}")
            return None
    
    @classmethod
    async def delete(cls, key: str):
        """Delete cache key"""
        try:
            client = cls.get_client()
            key = f"{settings.REDIS_NAMESPACE}:{key}"
            client.delete(key)
        except Exception as e:
            logger.error(f"❌ Redis DELETE error: {e}")
    
    # ===== LEADERBOARD OPERATIONS (SORTED SETS) =====
    
    @classmethod
    async def add_to_leaderboard(cls, leaderboard: str, user_id: str, score: float):
        """Add user to leaderboard sorted set"""
        try:
            client = cls.get_client()
            key = f"{settings.REDIS_NAMESPACE}:leaderboard:{leaderboard}"
            client.zadd(key, {user_id: score})
            logger.debug(f"✅ Added {user_id} to {leaderboard}: {score}")
        except Exception as e:
            logger.error(f"❌ Leaderboard ADD error: {e}")
    
    @classmethod
    async def increment_leaderboard_score(cls, leaderboard: str, user_id: str, score_delta: float):
        """Increment user's leaderboard score"""
        try:
            client = cls.get_client()
            key = f"{settings.REDIS_NAMESPACE}:leaderboard:{leaderboard}"
            client.zincrby(key, score_delta, user_id)
        except Exception as e:
            logger.error(f"❌ Leaderboard INCR error: {e}")
    
    @classmethod
    async def get_leaderboard(cls, leaderboard: str, start: int = 0, stop: int = 99) -> List[Tuple]:
        """Get leaderboard top users"""
        try:
            client = cls.get_client()
            key = f"{settings.REDIS_NAMESPACE}:leaderboard:{leaderboard}"
            results = client.zrevrange(key, start, stop, withscores=True)
            return [(user, int(float(score))) for user, score in results]
        except Exception as e:
            logger.error(f"❌ Leaderboard GET error: {e}")
            return []
    
    @classmethod
    async def get_user_rank(cls, leaderboard: str, user_id: str) -> Optional[int]:
        """Get user's rank (1-indexed)"""
        try:
            client = cls.get_client()
            key = f"{settings.REDIS_NAMESPACE}:leaderboard:{leaderboard}"
            rank = client.zrevrank(key, user_id)
            return rank + 1 if rank is not None else None
        except Exception as e:
            logger.error(f"❌ Leaderboard RANK error: {e}")
            return None
    
    @classmethod
    async def get_user_score(cls, leaderboard: str, user_id: str) -> Optional[float]:
        """Get user's score"""
        try:
            client = cls.get_client()
            key = f"{settings.REDIS_NAMESPACE}:leaderboard:{leaderboard}"
            score = client.zscore(key, user_id)
            return float(score) if score is not None else 0
        except Exception as e:
            logger.error(f"❌ Leaderboard SCORE error: {e}")
            return 0

redis_service = RedisService()
