import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import asyncpg

from app.core.config import settings
from app.services.redis_service import redis_service

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title=settings.API_TITLE, version=settings.API_VERSION)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# PostgreSQL connection pool
db_pool = None


# =====================================================================
# REQUEST MODELS
# =====================================================================

class UpdateScoreRequest(BaseModel):
    user_id: str
    username: str
    house: str
    problem_id: int
    score: int
    submission_id: str


# =====================================================================
# LIFECYCLE
# =====================================================================

@app.on_event("startup")
async def startup():
    global db_pool
    try:
        db_pool = await asyncpg.create_pool(settings.POSTGRES_URL, min_size=5, max_size=20)
        logger.info("✅ PostgreSQL pool initialized for leaderboard service")
    except Exception as e:
        logger.error(f"❌ Failed to initialize PostgreSQL pool: {e}")


@app.on_event("shutdown")
async def shutdown():
    global db_pool
    if db_pool:
        await db_pool.close()


# =====================================================================
# HEALTH CHECK
# =====================================================================

@app.get("/health")
def health(): 
    return {"status": "healthy", "service": "leaderboard"}


# =====================================================================
# LEADERBOARD UPDATE ENDPOINT (CRITICAL FOR JUDGE SERVICE)
# =====================================================================

@app.post("/api/v1/update_score")
async def update_leaderboard_score(request: UpdateScoreRequest):
    """
    *** CALLED BY JUDGE SERVICE AFTER ACCEPTED SUBMISSION ***
    
    Updates:
    1. PostgreSQL leaderboard table (global score)
    2. Redis sorted sets (global + house rankings for real-time display)
    3. Adds points to house total
    
    Request body:
    {
        "user_id": "uuid",
        "username": "wizard_name",
        "house": "gryffindor",
        "problem_id": 1,
        "score": 10,
        "submission_id": "uuid"
    }
    """
    
    if not db_pool:
        logger.error("❌ Database pool not initialized")
        return {
            "status": "error",
            "message": "Database connection failed",
            "updated": False
        }
    
    try:
        async with db_pool.acquire() as conn:
            # 1. Get or create leaderboard entry
            existing = await conn.fetchval(
                "SELECT id FROM leaderboard WHERE user_id = $1",
                request.user_id
            )
            
            if existing:
                # Update existing entry
                await conn.execute("""
                    UPDATE leaderboard 
                    SET total_score = total_score + $1,
                        problems_solved = problems_solved + 1,
                        updated_at = NOW()
                    WHERE user_id = $2
                """, request.score, request.user_id)
                logger.info(f"✅ Updated leaderboard for {request.username}: +{request.score}")
            else:
                # Create new leaderboard entry
                await conn.execute("""
                    INSERT INTO leaderboard (user_id, total_score, problems_solved, ranking, created_at, updated_at)
                    VALUES ($1, $2, 1, 0, NOW(), NOW())
                """, request.user_id, request.score)
                logger.info(f"✅ Created leaderboard entry for {request.username}: {request.score}")
            
            # 2. Record the specific problem submission
            await conn.execute("""
                INSERT INTO problem_scores (user_id, problem_id, score, submission_id, achieved_at)
                VALUES ($1, $2, $3, $4, NOW())
                ON CONFLICT (user_id, problem_id) DO UPDATE
                SET score = EXCLUDED.score, 
                    submission_id = EXCLUDED.submission_id,
                    achieved_at = NOW()
            """, request.user_id, request.problem_id, request.score, request.submission_id)
        
        # 3. Update Redis sorted sets for real-time leaderboards
        
        # Global leaderboard (score-based ranking)
        redis_key_global = "leaderboard:global"
        await redis_service.zadd(redis_key_global, {f"{request.user_id}:{request.username}": request.score})
        
        # House leaderboard (score-based ranking per house)
        redis_key_house = f"leaderboard:house:{request.house.lower()}"
        await redis_service.zadd(redis_key_house, {f"{request.user_id}:{request.username}": request.score})
        
        # User profile cache (invalidate to refresh)
        redis_key_user = f"user:{request.user_id}"
        await redis_service.delete(redis_key_user)
        
        logger.info(
            f"🎯 Leaderboard updated: user={request.username}, house={request.house}, "
            f"problem_id={request.problem_id}, score={request.score}"
        )
        
        return {
            "status": "success",
            "message": f"Score updated for {request.username}",
            "updated": True,
            "user_id": request.user_id,
            "username": request.username,
            "house": request.house,
            "score_added": request.score
        }
        
    except Exception as e:
        logger.error(f"❌ Failed to update leaderboard: {e}", exc_info=True)
        return {
            "status": "error",
            "message": str(e),
            "updated": False
        }


# =====================================================================
# GET GLOBAL LEADERBOARD
# =====================================================================

@app.get("/api/v1/leaderboards/global")
async def get_global_leaderboard(limit: int = 100):
    """Get global leaderboard from PostgreSQL leaderboard table"""
    if not db_pool:
        return {"leaderboard": [], "total": 0}
    
    try:
        async with db_pool.acquire() as conn:
            rows = await conn.fetch("""
                SELECT l.user_id, u.username, u.house, l.total_score, l.problems_solved, l.ranking
                FROM leaderboard l
                LEFT JOIN users u ON l.user_id = u.id
                ORDER BY l.total_score DESC, l.problems_solved DESC
                LIMIT $1
            """, limit)
            
        leaderboard = [
            {
                "rank": idx + 1,
                "user_id": row['user_id'],
                "username": row['username'] or "Unknown",
                "house": (row['house'] or "unknown").lower(),
                "score": row['total_score'] or 0,
                "problems_solved": row['problems_solved'] or 0
            }
            for idx, row in enumerate(rows)
        ]
        
        return {
            "leaderboard": leaderboard,
            "total": len(leaderboard)
        }
    except Exception as e:
        logger.error(f"❌ Failed to fetch global leaderboard: {e}")
        return {"leaderboard": [], "total": 0}


# =====================================================================
# GET HOUSE LEADERBOARDS
# =====================================================================

@app.get("/api/v1/leaderboards/houses")
async def get_house_leaderboards():
    """Get house-wise leaderboards from PostgreSQL"""
    if not db_pool:
        return {"houses": {}}
    
    try:
        houses = ["gryffindor", "hufflepuff", "ravenclaw", "slytherin"]
        result = {}
        
        async with db_pool.acquire() as conn:
            for house in houses:
                rows = await conn.fetch("""
                    SELECT l.user_id, u.username, l.total_score, l.problems_solved
                    FROM leaderboard l
                    LEFT JOIN users u ON l.user_id = u.id
                    WHERE LOWER(u.house) = $1
                    ORDER BY l.total_score DESC, l.problems_solved DESC
                    LIMIT 100
                """, house)
                
                leaderboard = [
                    {
                        "rank": idx + 1,
                        "user_id": row['user_id'],
                        "username": row['username'] or "Unknown",
                        "score": row['total_score'] or 0,
                        "problems_solved": row['problems_solved'] or 0
                    }
                    for idx, row in enumerate(rows)
                ]
                
                house_total_score = sum((row['total_score'] or 0) for row in rows)
                
                result[house] = {
                    "name": house.title(),
                    "emoji": {
                        "gryffindor": "🦁",
                        "hufflepuff": "🦡",
                        "ravenclaw": "🦅",
                        "slytherin": "🐍"
                    }[house],
                    "leaderboard": leaderboard,
                    "total_score": house_total_score,
                    "total_members": len(rows)
                }
        
        return {"houses": result}
    except Exception as e:
        logger.error(f"❌ Failed to fetch house leaderboards: {e}")
        return {"houses": {}}


# =====================================================================
# EXCEPTION HANDLER
# =====================================================================

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"❌ Unhandled exception: {exc}", exc_info=True)
    return {"error": str(exc), "status_code": 500, "message": "Internal server error"}
