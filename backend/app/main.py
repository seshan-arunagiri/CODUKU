from fastapi import FastAPI, HTTPException, Depends, status, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from contextlib import asynccontextmanager
from pydantic import BaseModel, EmailStr
import jwt
from datetime import datetime, timedelta
from passlib.context import CryptContext
import logging
import asyncio
from uuid import uuid4

from app.core.config import settings
from app.services.supabase_service import supabase_service
from app.services.redis_service import redis_service
from app.services.judge0_service import judge0_service

# ===== LOGGING =====
logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ===== PASSWORD HASHING =====
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ===== PYDANTIC MODELS =====

class RegisterRequest(BaseModel):
    email: EmailStr
    username: str
    password: str
    house: str = "gryffindor"

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class AuthResponse(BaseModel):
    access_token: str
    user_id: str
    username: str
    house: str
    message: str

class SubmissionRequest(BaseModel):
    problem_id: int
    language: str
    source_code: str

class SubmissionResponse(BaseModel):
    submission_id: str
    status: str
    message: str

# ===== STARTUP/SHUTDOWN =====

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 CODUKU API Starting...")
    yield
    logger.info("💤 CODUKU API Shutting Down...")

# ===== CREATE FASTAPI APP =====

app = FastAPI(
    title=settings.API_TITLE,
    version=settings.API_VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# ===== MIDDLEWARE =====

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ===== SECURITY =====

security = HTTPBearer()

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.utcnow() + timedelta(hours=settings.JWT_EXPIRATION_HOURS),
        "iat": datetime.utcnow()
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """Extract user ID from JWT"""
    try:
        payload = jwt.decode(credentials.credentials, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_id
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ===== BACKGROUND TASKS =====

async def execute_submission_background(
    submission_id: str,
    language: str,
    source_code: str,
    test_cases: list
):
    """Background task to execute submission via Judge0"""
    try:
        logger.info(f"⏳ Executing submission {submission_id}...")
        
        results = await judge0_service.execute_with_test_cases(language, source_code, test_cases)
        
        # Calculate score
        score = 100 if results["passed"] == results["total"] and results["status"] == "accepted" else 0
        
        # Update submission in Supabase
        update_data = {
            "status": results["status"].lower().replace(" ", "_"),
            "test_cases_passed": results["passed"],
            "test_cases_total": results["total"],
            "score": score,
            "execution_details": results.get("details", []),
            "completed_at": datetime.utcnow().isoformat()
        }
        
        await supabase_service.update_submission(submission_id, **update_data)
        
        # Update Redis leaderboard
        if score > 0:
            user = await supabase_service.get_submission(submission_id)
            if user:
                await redis_service.add_to_leaderboard("global", user["user_id"], score)
        
        logger.info(f"✅ Submission {submission_id} completed: {results['status']}")
        
    except Exception as e:
        logger.error(f"❌ Background execution error: {e}", exc_info=True)
        await supabase_service.update_submission(
            submission_id,
            status="runtime_error",
            error_message=str(e),
            completed_at=datetime.utcnow().isoformat()
        )

# ===== ROUTES =====

@app.get("/")
async def root():
    return {
        "message": "🧙 CODUKU API v2.0",
        "status": "operational",
        "docs": "/docs",
        "endpoints": [
            f"{settings.API_PREFIX}/auth/register",
            f"{settings.API_PREFIX}/auth/login",
            f"{settings.API_PREFIX}/auth/me",
            f"{settings.API_PREFIX}/problems",
            f"{settings.API_PREFIX}/submissions",
            f"{settings.API_PREFIX}/leaderboards/global"
        ]
    }

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "CODUKU API"}

# ===== AUTH ROUTES =====

@app.post(f"{settings.API_PREFIX}/auth/register", response_model=AuthResponse)
async def register(req: RegisterRequest):
    """Register new user"""
    
    # Check if user exists
    existing = await supabase_service.get_user_by_email(req.email)
    if existing:
        raise HTTPException(status_code=400, detail="User already exists")
    
    # Create user
    user = await supabase_service.create_user(
        email=req.email,
        username=req.username,
        password_hash=hash_password(req.password),
        house=req.house
    )
    
    if not user:
        raise HTTPException(status_code=500, detail="Failed to create user")
    
    # Create token
    token = create_access_token(user["id"], user["email"])
    
    logger.info(f"✅ User registered: {req.email} → {req.house}")
    
    return AuthResponse(
        access_token=token,
        user_id=user["id"],
        username=user["username"],
        house=user["house"],
        message=f"Welcome to CODUKU! You've been sorted into {req.house.title()}! 🧙"
    )

@app.post(f"{settings.API_PREFIX}/auth/login", response_model=AuthResponse)
async def login(req: LoginRequest):
    """Login user"""
    
    user = await supabase_service.get_user_by_email(req.email)
    if not user or not verify_password(req.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_access_token(user["id"], user["email"])
    
    logger.info(f"✅ User logged in: {req.email}")
    
    return AuthResponse(
        access_token=token,
        user_id=user["id"],
        username=user["username"],
        house=user["house"],
        message=f"Welcome back! 🧙"
    )

@app.get(f"{settings.API_PREFIX}/auth/me")
async def get_me(user_id: str = Depends(get_current_user)):
    """Get current user profile"""
    
    user = await supabase_service.get_user_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get user's rank
    rank = await redis_service.get_user_rank("global", user_id)
    
    return {
        **user,
        "rank": rank
    }

# ===== PROBLEM ROUTES =====

@app.get(f"{settings.API_PREFIX}/problems")
async def list_problems(limit: int = 100, offset: int = 0):
    """List all problems"""
    
    problems = await supabase_service.get_problems(limit, offset)
    return {
        "problems": problems,
        "count": len(problems),
        "total": 1000  # Mock total
    }

# Alias endpoint for frontend compatibility
@app.get(f"{settings.API_PREFIX}/questions")
async def list_questions(limit: int = 100, offset: int = 0):
    """Alias for list_problems - returns all questions/problems"""
    
    problems = await supabase_service.get_problems(limit, offset)
    return {
        "problems": problems,
        "count": len(problems),
        "total": 1000  # Mock total
    }

@app.get(f"{settings.API_PREFIX}/problems/{{problem_id}}")
async def get_problem(problem_id: int):
    """Get problem with test cases"""
    
    problem = await supabase_service.get_problem(problem_id)
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")
    
    test_cases = await supabase_service.get_test_cases(problem_id)
    
    return {
        "problem": problem,
        "test_cases": test_cases,
        "acceptance_rate": 65.5  # Mock
    }

# ===== SUBMISSION ROUTES =====

@app.post(f"{settings.API_PREFIX}/submissions", response_model=SubmissionResponse)
async def submit_code(
    req: SubmissionRequest,
    background_tasks: BackgroundTasks,
    user_id: str = Depends(get_current_user)
):
    """Submit code for execution"""
    
    # Validate problem
    problem = await supabase_service.get_problem(req.problem_id)
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")
    
    # Get test cases
    test_cases = await supabase_service.get_test_cases(req.problem_id)
    if not test_cases:
        raise HTTPException(status_code=400, detail="No test cases for this problem")
    
    # Create submission
    submission = await supabase_service.create_submission(
        user_id=user_id,
        problem_id=req.problem_id,
        language=req.language,
        source_code=req.source_code
    )
    
    if not submission:
        raise HTTPException(status_code=500, detail="Failed to create submission")
    
    # Start background execution
    background_tasks.add_task(
        execute_submission_background,
        submission["id"],
        req.language,
        req.source_code,
        test_cases
    )
    
    logger.info(f"📝 Submission created: {submission['id']}")
    
    return SubmissionResponse(
        submission_id=submission["id"],
        status="pending",
        message="⏳ Your code is being evaluated..."
    )

@app.get(f"{settings.API_PREFIX}/submissions/{{submission_id}}")
async def get_submission(submission_id: str, user_id: str = Depends(get_current_user)):
    """Get submission status and results"""
    
    submission = await supabase_service.get_submission(submission_id)
    if not submission or submission["user_id"] != user_id:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    status_messages = {
        "pending": "⏳ Evaluating...",
        "accepted": "✅ Accepted!",
        "wrong_answer": "❌ Wrong Answer",
        "time_limit_exceeded": "⏱️ Time Limit Exceeded",
        "runtime_error": "💥 Runtime Error",
        "compilation_error": "🔴 Compilation Error"
    }
    
    return {
        "submission_id": submission_id,
        "status": submission["status"],
        "test_cases_passed": submission.get("test_cases_passed", 0),
        "test_cases_total": submission.get("test_cases_total", 0),
        "score": submission.get("score", 0),
        "message": status_messages.get(submission["status"], "Unknown"),
        "execution_details": submission.get("execution_details"),
        "completed_at": submission.get("completed_at")
    }

@app.get(f"{settings.API_PREFIX}/submissions")
async def list_user_submissions(limit: int = 50, user_id: str = Depends(get_current_user)):
    """Get user's submission history"""
    
    submissions = await supabase_service.get_user_submissions(user_id, limit)
    return {
        "submissions": submissions,
        "count": len(submissions)
    }

# ===== LEADERBOARD ROUTES =====

@app.get(f"{settings.API_PREFIX}/leaderboards/global")
async def get_global_leaderboard(limit: int = 100):
    """Get global leaderboard"""
    
    leaderboard = await redis_service.get_leaderboard("global", 0, limit - 1)
    
    return {
        "leaderboard": [
            {
                "rank": idx + 1,
                "user_id": user,
                "score": int(score)
            }
            for idx, (user, score) in enumerate(leaderboard)
        ],
        "total": len(leaderboard)
    }

@app.get(f"{settings.API_PREFIX}/leaderboards/houses")
async def get_house_leaderboards():
    """Get all house leaderboards"""
    
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

# ===== ERROR HANDLING =====

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"❌ Unhandled exception: {exc}", exc_info=True)
    return {
        "error": str(exc),
        "status_code": 500,
        "message": "Internal server error"
    }

# ===== RUN =====

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=settings.DEBUG,
        log_level="info"
    )
