"""
CODUKU Leaderboard Service - Production Ready
Handles leaderboard updates, ranking calculations, and Redis persistence.
Updates global and house-based rankings in real-time.
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import asyncpg
import redis
import logging
import os
from datetime import datetime
import json

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="CODUKU Leaderboard Service",
    description="Real-time leaderboard and ranking management",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============= DATABASE CONFIGURATION =============

DB_USER = os.getenv("POSTGRES_USER", "coduku")
DB_PASSWORD = os.getenv("POSTGRES_PASSWORD", "coduku123")
DB_HOST = os.getenv("POSTGRES_HOST", "postgres")
DB_PORT = int(os.getenv("POSTGRES_PORT", 5432))
DB_NAME = os.getenv("POSTGRES_DB", "coduku")

REDIS_HOST = os.getenv("REDIS_HOST", "redis")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
REDIS_DB = int(os.getenv("REDIS_DB", 0))

# Global database and cache connections
db_pool = None
redis_client = None


# ============= DATA MODELS =============

class ScoreUpdateRequest(BaseModel):
    """Request to update user score"""
    user_id: str
    username: str
    house: str
    problem_id: int
    score: int
    submission_id: str


class LeaderboardEntry(BaseModel):
    """Leaderboard entry"""
    rank: int
    user_id: str
    username: str
    house: str
    total_points: int
    problems_solved: int
    submission_count: int
    last_submission: Optional[str] = None


class HouseStats(BaseModel):
    """House-based statistics"""
    house: str
    total_points: int
    members: int
    problems_solved: int
    average_points: float


# ============= DATABASE INITIALIZATION =============

async def init_db():
    """Initialize database connection pool"""
    global db_pool
    try:
        db_pool = await asyncpg.create_pool(
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME,
            host=DB_HOST,
            port=DB_PORT,
            min_size=5,
            max_size=20,
        )
        logger.info("Database pool initialized")

        # Create tables if they don't exist
        async with db_pool.acquire() as conn:
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    user_id VARCHAR(50) PRIMARY KEY,
                    username VARCHAR(255) NOT NULL UNIQUE,
                    house VARCHAR(50) NOT NULL,
                    email VARCHAR(255),
                    created_at TIMESTAMP DEFAULT NOW()
                )
            """)

            await conn.execute("""
                CREATE TABLE IF NOT EXISTS submissions (
                    submission_id VARCHAR(100) PRIMARY KEY,
                    user_id VARCHAR(50) NOT NULL,
                    problem_id INT NOT NULL,
                    language VARCHAR(50),
                    verdict VARCHAR(50),
                    score INT DEFAULT 0,
                    submitted_at TIMESTAMP DEFAULT NOW(),
                    FOREIGN KEY (user_id) REFERENCES users(user_id)
                )
            """)

            await conn.execute("""
                CREATE TABLE IF NOT EXISTS leaderboard (
                    user_id VARCHAR(50) PRIMARY KEY,
                    username VARCHAR(255) NOT NULL,
                    house VARCHAR(50) NOT NULL,
                    total_points INT DEFAULT 0,
                    problems_solved INT DEFAULT 0,
                    submission_count INT DEFAULT 0,
                    last_submission TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT NOW(),
                    FOREIGN KEY (user_id) REFERENCES users(user_id)
                )
            """)

            await conn.execute("""
                CREATE TABLE IF NOT EXISTS problem_scores (
                    user_id VARCHAR(50) NOT NULL,
                    problem_id INT NOT NULL,
                    score INT DEFAULT 0,
                    submission_id VARCHAR(100),
                    submitted_at TIMESTAMP DEFAULT NOW(),
                    PRIMARY KEY (user_id, problem_id),
                    FOREIGN KEY (user_id) REFERENCES users(user_id)
                )
            """)

            # Create indexes for better performance
            await conn.execute("CREATE INDEX IF NOT EXISTS idx_leaderboard_points ON leaderboard(total_points DESC)")
            await conn.execute("CREATE INDEX IF NOT EXISTS idx_leaderboard_house ON leaderboard(house)")
            await conn.execute("CREATE INDEX IF NOT EXISTS idx_submissions_user ON submissions(user_id)")

        logger.info("Database tables initialized")

    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        raise


async def init_redis():
    """Initialize Redis connection"""
    global redis_client
    try:
        redis_client = redis.Redis(
            host=REDIS_HOST,
            port=REDIS_PORT,
            db=REDIS_DB,
            decode_responses=True
        )
        redis_client.ping()
        logger.info("Redis connection established")
    except Exception as e:
        logger.error(f"Failed to connect to Redis: {e}")
        raise


@app.on_event("startup")
async def startup():
    """Initialize connections on startup"""
    await init_db()
    await init_redis()


@app.on_event("shutdown")
async def shutdown():
    """Close connections on shutdown"""
    global db_pool, redis_client
    if db_pool:
        await db_pool.close()
    if redis_client:
        redis_client.close()


# ============= LEADERBOARD OPERATIONS =============

async def update_user_leaderboard(
    user_id: str,
    username: str,
    house: str,
    problem_id: int,
    score: int,
    submission_id: str
):
    """Update user leaderboard entry after successful submission"""
    try:
        async with db_pool.acquire() as conn:
            # Create user if doesn't exist
            await conn.execute("""
                INSERT INTO users (user_id, username, house)
                VALUES ($1, $2, $3)
                ON CONFLICT (user_id) DO NOTHING
            """, user_id, username, house)

            # Update/create leaderboard entry
            await conn.execute("""
                INSERT INTO leaderboard (user_id, username, house, total_points, problems_solved, submission_count, last_submission)
                VALUES ($1, $2, $3, $4, 1, 1, NOW())
                ON CONFLICT (user_id) DO UPDATE SET
                    total_points = leaderboard.total_points + $4,
                    problems_solved = leaderboard.problems_solved + 1,
                    submission_count = leaderboard.submission_count + 1,
                    last_submission = NOW(),
                    updated_at = NOW()
            """, user_id, username, house, score)

            # Record problem score
            await conn.execute("""
                INSERT INTO problem_scores (user_id, problem_id, score, submission_id, submitted_at)
                VALUES ($1, $2, $3, $4, NOW())
                ON CONFLICT (user_id, problem_id) DO UPDATE SET
                    score = GREATEST(problem_scores.score, $3),
                    submission_id = $4,
                    submitted_at = NOW()
            """, user_id, problem_id, score, submission_id)

            # Record submission
            await conn.execute("""
                INSERT INTO submissions (submission_id, user_id, problem_id, verdict, score, submitted_at)
                VALUES ($1, $2, $3, 'Accepted', $4, NOW())
            """, submission_id, user_id, problem_id, score)

        # Update Redis sorted sets for real-time rankings
        update_redis_rankings(user_id, username, house, score)

        logger.info(f"Leaderboard updated: {username} (+{score} points)")

    except Exception as e:
        logger.error(f"Error updating leaderboard: {e}")
        raise


def update_redis_rankings(user_id: str, username: str, house: str, score: int):
    """Update Redis sorted sets for global and house rankings"""
    try:
        # Global leaderboard
        redis_client.zadd("leaderboard:global", {f"{user_id}:{username}": score}, incr=True)

        # House leaderboard
        redis_client.zadd(f"leaderboard:house:{house}", {f"{user_id}:{username}": score}, incr=True)

        # User stats (for quick access)
        redis_client.hset(f"user:{user_id}", mapping={
            "username": username,
            "house": house,
            "updated_at": datetime.now().isoformat()
        })

        logger.info(f"Redis rankings updated for {username}")

    except Exception as e:
        logger.error(f"Error updating Redis rankings: {e}")


async def get_global_leaderboard(limit: int = 100, offset: int = 0) -> List[LeaderboardEntry]:
    """Get global leaderboard with pagination"""
    try:
        async with db_pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT 
                    ROW_NUMBER() OVER (ORDER BY total_points DESC) as rank,
                    user_id,
                    username,
                    house,
                    total_points,
                    problems_solved,
                    submission_count,
                    last_submission
                FROM leaderboard
                ORDER BY total_points DESC
                LIMIT $1 OFFSET $2
            """, limit, offset)

            return [
                LeaderboardEntry(
                    rank=row['rank'],
                    user_id=row['user_id'],
                    username=row['username'],
                    house=row['house'],
                    total_points=row['total_points'],
                    problems_solved=row['problems_solved'],
                    submission_count=row['submission_count'],
                    last_submission=row['last_submission'].isoformat() if row['last_submission'] else None
                )
                for row in rows
            ]

    except Exception as e:
        logger.error(f"Error fetching global leaderboard: {e}")
        return []


async def get_house_leaderboard(house: str, limit: int = 100) -> List[LeaderboardEntry]:
    """Get house-based leaderboard"""
    try:
        async with db_pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT 
                    ROW_NUMBER() OVER (ORDER BY total_points DESC) as rank,
                    user_id,
                    username,
                    house,
                    total_points,
                    problems_solved,
                    submission_count,
                    last_submission
                FROM leaderboard
                WHERE LOWER(house) = LOWER($1)
                ORDER BY total_points DESC
                LIMIT $2
            """, house, limit)

            return [
                LeaderboardEntry(
                    rank=row['rank'],
                    user_id=row['user_id'],
                    username=row['username'],
                    house=row['house'],
                    total_points=row['total_points'],
                    problems_solved=row['problems_solved'],
                    submission_count=row['submission_count'],
                    last_submission=row['last_submission'].isoformat() if row['last_submission'] else None
                )
                for row in rows
            ]

    except Exception as e:
        logger.error(f"Error fetching house leaderboard: {e}")
        return []


async def get_house_statistics() -> List[HouseStats]:
    """Get statistics for each house"""
    try:
        async with db_pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT 
                    house,
                    COUNT(*) as members,
                    SUM(total_points) as total_points,
                    SUM(problems_solved) as problems_solved,
                    AVG(total_points)::INT as average_points
                FROM leaderboard
                GROUP BY house
                ORDER BY total_points DESC
            """)

            return [
                HouseStats(
                    house=row['house'],
                    total_points=row['total_points'] or 0,
                    members=row['members'],
                    problems_solved=row['problems_solved'] or 0,
                    average_points=row['average_points'] or 0.0
                )
                for row in rows
            ]

    except Exception as e:
        logger.error(f"Error fetching house statistics: {e}")
        return []


async def get_user_rank(user_id: str) -> Optional[Dict[str, Any]]:
    """Get user's current rank and stats"""
    try:
        async with db_pool.acquire() as conn:
            row = await conn.fetchrow("""
                SELECT 
                    ROW_NUMBER() OVER (ORDER BY total_points DESC) as rank,
                    *
                FROM leaderboard
                WHERE user_id = $1
            """, user_id)

            if row:
                return {
                    "rank": row['rank'],
                    "user_id": row['user_id'],
                    "username": row['username'],
                    "house": row['house'],
                    "total_points": row['total_points'],
                    "problems_solved": row['problems_solved'],
                    "submission_count": row['submission_count']
                }
            return None

    except Exception as e:
        logger.error(f"Error fetching user rank: {e}")
        return None


# ============= API ENDPOINTS =============

@app.get("/health")
async def health_check():
    """Service health check"""
    db_healthy = db_pool is not None
    redis_healthy = redis_client is not None

    return {
        "status": "healthy" if (db_healthy and redis_healthy) else "degraded",
        "database": "connected" if db_healthy else "offline",
        "cache": "connected" if redis_healthy else "offline",
        "service": "leaderboard",
        "timestamp": datetime.now().isoformat()
    }


@app.post("/api/v1/update_score")
async def update_score(request: ScoreUpdateRequest, background_tasks: BackgroundTasks):
    """Update leaderboard on successful submission (called by Judge Service)"""
    try:
        logger.info(f"Score update request: {request.username} - Problem {request.problem_id}, Score {request.score}")

        # Update in background (non-blocking)
        background_tasks.add_task(
            update_user_leaderboard,
            user_id=request.user_id,
            username=request.username,
            house=request.house,
            problem_id=request.problem_id,
            score=request.score,
            submission_id=request.submission_id
        )

        return {
            "status": "success",
            "message": f"Score update queued for {request.username}",
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        logger.error(f"Error in update_score: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/leaderboard", response_model=Dict[str, Any])
async def get_leaderboard(limit: int = 50, offset: int = 0):
    """Get global leaderboard"""
    try:
        entries = await get_global_leaderboard(limit, offset)

        return {
            "status": "success",
            "type": "global",
            "limit": limit,
            "offset": offset,
            "entries": entries,
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        logger.error(f"Error fetching leaderboard: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/leaderboard/house/{house}", response_model=Dict[str, Any])
async def get_house_leaderboard_endpoint(house: str, limit: int = 50):
    """Get house-specific leaderboard"""
    try:
        entries = await get_house_leaderboard(house, limit)

        return {
            "status": "success",
            "type": "house",
            "house": house,
            "entries": entries,
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        logger.error(f"Error fetching house leaderboard: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/houses/stats", response_model=Dict[str, Any])
async def get_houses_stats():
    """Get statistics for all houses"""
    try:
        stats = await get_house_statistics()

        return {
            "status": "success",
            "houses": stats,
            "timestamp": datetime.now().isoformat()
        }

    except Exception as e:
        logger.error(f"Error fetching house stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/users/{user_id}/rank", response_model=Dict[str, Any])
async def get_user_rank_endpoint(user_id: str):
    """Get specific user's rank and stats"""
    try:
        rank_data = await get_user_rank(user_id)

        if not rank_data:
            raise HTTPException(status_code=404, detail=f"User {user_id} not found")

        return {
            "status": "success",
            "rank_data": rank_data,
            "timestamp": datetime.now().isoformat()
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching user rank: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8003,
        log_level="info"
    )
