import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

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

@app.get("/health")
def health(): return {"status": "healthy", "service": "leaderboard"}

@app.get("/api/v1/leaderboards/global")
async def get_global_leaderboard(limit: int = 100):
    leaderboard = await redis_service.get_leaderboard("global", 0, limit - 1)
    return {
        "leaderboard": [
            {"rank": idx + 1, "user_id": user, "score": int(score)}
            for idx, (user, score) in enumerate(leaderboard)
        ],
        "total": len(leaderboard)
    }

@app.get("/api/v1/leaderboards/houses")
async def get_house_leaderboards():
    houses = ["gryffindor", "hufflepuff", "ravenclaw", "slytherin"]
    result = {}
    for house in houses:
        leaderboard = await redis_service.get_leaderboard(house, 0, 99)
        result[house] = {
            "name": house.title(),
            "emoji": {"gryffindor": "🦁", "hufflepuff": "🦡", "ravenclaw": "🦅", "slytherin": "🐍"}[house],
            "leaderboard": [
                {"rank": idx + 1, "user_id": user, "score": int(score)}
                for idx, (user, score) in enumerate(leaderboard)
            ],
            "total_score": sum(int(score) for _, score in leaderboard)
        }
    return result

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"❌ Unhandled exception: {exc}", exc_info=True)
    return {"error": str(exc), "status_code": 500, "message": "Internal server error"}
