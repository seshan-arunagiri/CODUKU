import logging
import json
import os
from datetime import datetime
from uuid import uuid4
from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthCredentials
import jwt
from pydantic import BaseModel
from datetime import datetime
import logging
import json
import os

from app.websocket_manager import manager
from app.events import EventBus
from app.services.supabase_service import supabase_service
from app.services.redis_service import redis_service
from app.services.judge0_service import judge0_service
from app.core.config import settings


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


security = HTTPBearer()


def get_current_user_sync(credentials: HTTPAuthCredentials = Depends(security)) -> str:
    try:
        payload = jwt.decode(
            credentials.credentials,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM],
        )
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_id
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


app = FastAPI(title="Judge Service", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class SubmissionRequest(BaseModel):
    problem_id: int
    language: str
    source_code: str


class SubmissionResponse(BaseModel):
    submission_id: str
    status: str
    message: str


REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/1")
event_bus = EventBus(REDIS_URL)

async def handle_submission_completed(event_data):
    """Handle submission completion from judge0"""
    logger.info(f"🎯 Submission completed: {event_data}")
    
    # Update leaderboard
    user_id = event_data.get("user_id")
    score = event_data.get("score")
    
    await manager.broadcast_leaderboard_update({
        "user_id": user_id,
        "new_score": score,
        "timestamp": datetime.utcnow().isoformat()
    })
    
    # Publish to leaderboard service
    await event_bus.publish("leaderboard:update", event_data)

@app.on_event("startup")
async def startup():
    await event_bus.init()
    # Subscribe to submission events from all services
    await event_bus.subscribe("submission:completed", handle_submission_completed)

@app.get("/health")
def health():
    return {"status": "healthy", "service": "judge"}


@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str, user_id: str = Query(...)):
    """
    WebSocket endpoint for real-time updates
    """
    await manager.connect(websocket, client_id, user_id)
    
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message["type"] == "subscribe_leaderboard":
                manager.user_leaderboard_subs.add(user_id)
                await websocket.send_text(json.dumps({
                    "type": "subscribed",
                    "channel": "leaderboard"
                }))
            
            elif message["type"] == "unsubscribe_leaderboard":
                manager.user_leaderboard_subs.discard(user_id)
            
            elif message["type"] == "ping":
                await websocket.send_text(json.dumps({"type": "pong"}))
    
    except WebSocketDisconnect:
        await manager.disconnect(user_id, websocket)
        logger.info(f"🔌 Client disconnected: {client_id}")
    
    except Exception as e:
        logger.error(f"❌ WebSocket error: {e}")
        await manager.disconnect(user_id, websocket)


async def execute_submission_background(submission_id: str, language: str, source_code: str, test_cases: list):
    try:
        results = await judge0_service.execute_with_test_cases(language, source_code, test_cases)
        score = 100 if results["passed"] == results["total"] and results["status"] == "accepted" else 0
        update_data = {
            "status": results["status"].lower().replace(" ", "_"),
            "test_cases_passed": results["passed"],
            "test_cases_total": results["total"],
            "score": score,
            "execution_details": results.get("details", []),
            "completed_at": datetime.utcnow().isoformat()
        }
        await supabase_service.update_submission(submission_id, **update_data)
        if score > 0:
            user = await supabase_service.get_submission(submission_id)
            if user:
                await redis_service.add_to_leaderboard("global", user["user_id"], score)
                await handle_submission_completed({"user_id": user["user_id"], "score": score})
    except Exception as e:
        logger.error(f"❌ Background execution error: {e}")

@app.post("/api/v1/submissions", response_model=SubmissionResponse)
async def submit_code(
    req: SubmissionRequest,
    background_tasks: BackgroundTasks,
    user_id: str = Depends(get_current_user_sync),
):
    problem = await supabase_service.get_problem(req.problem_id)
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")

    test_cases = await supabase_service.get_test_cases(req.problem_id)
    if not test_cases:
        raise HTTPException(status_code=400, detail="No test cases for this problem")

    submission = await supabase_service.create_submission(
        user_id, req.problem_id, req.language, req.source_code
    )

    background_tasks.add_task(
        execute_submission_background,
        submission["id"],
        req.language,
        req.source_code,
        test_cases,
    )

    return {
        "submission_id": str(submission["id"]),
        "status": "pending",
        "message": "Evaluating...",
    }


@app.get("/api/v1/problems")
async def list_problems(limit: int = 100, offset: int = 0):
    problems = await supabase_service.get_problems(limit, offset)
    return {"problems": problems, "count": len(problems)}


@app.get("/api/v1/problems/{problem_id}")
async def get_problem(problem_id: int):
    problem = await supabase_service.get_problem(problem_id)
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")
    test_cases = await supabase_service.get_test_cases(problem_id)
    return {"problem": problem, "test_cases": test_cases}


# Backwards-compatible aliases for the existing React app (`/questions`).
@app.get("/api/v1/questions")
async def list_questions(limit: int = 100, offset: int = 0):
    return await list_problems(limit=limit, offset=offset)


@app.get("/api/v1/questions/{problem_id}")
async def get_question(problem_id: int):
    return await get_problem(problem_id)


@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    return {
        "error": str(exc),
        "status_code": 500,
        "message": "Internal server error",
    }
