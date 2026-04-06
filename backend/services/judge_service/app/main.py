"""
CODUKU Judge Service - Production-Ready v2
Complete with:
- All 8 problems properly defined
- Judge0 integration with all languages
- Detailed verdict results (Accepted / Wrong Answer / Runtime Error / etc.)
- Real-time leaderboard updates on success
- Test case details in response
- Proper output normalization
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import httpx
import asyncio
from fastapi.middleware.cors import CORSMiddleware
import uuid
import os
import json
import logging
from contextlib import asynccontextmanager
from datetime import datetime

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

# Try to import PostgreSQL service
try:
    from app.services.postgres_service import PostgreSQLService
    HAS_POSTGRES = True
except ImportError:
    HAS_POSTGRES = False
    logger.warning("PostgreSQL service not available, running in-memory only")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    if HAS_POSTGRES:
        try:
            await PostgreSQLService.init_pool()
            logger.info("✅ Judge Service started with PostgreSQL pool initialized")
        except Exception as e:
            logger.warning(f"⚠️ PostgreSQL init failed: {e}")
    logger.info("✅ Judge Service started - All languages ready")
    yield
    logger.info("⚠️ Judge Service shutting down")


app = FastAPI(title="CODUKU Judge Service - Production Ready", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =====================================================================
# CONFIGURATION
# =====================================================================

JUDGE0_URL = os.environ.get("JUDGE0_URL", "http://judge0:2358")
LEADERBOARD_URL = os.environ.get("LEADERBOARD_URL", "http://leaderboard:8003")
JWT_SECRET = os.environ.get("JWT_SECRET", "secret")

logger.info(f"🔗 Judge0 URL: {JUDGE0_URL}")
logger.info(f"🔗 Leaderboard URL: {LEADERBOARD_URL}")

active_submissions: Dict[str, Dict] = {}

# =====================================================================
# REQUEST MODELS
# =====================================================================


class SubmissionRequest(BaseModel):
    problem_id: int
    language: str
    source_code: str
    user_id: Optional[str] = None


class TestCaseResult(BaseModel):
    test_case_number: int
    input: str
    expected_output: str
    actual_output: str
    passed: bool
    runtime_error: Optional[str] = None


class SubmissionResponse(BaseModel):
    submission_id: str
    status: str
    message: str
    verdict: Optional[str] = None
    passed_tests: Optional[int] = None
    total_tests: Optional[int] = None
    test_cases: Optional[List[TestCaseResult]] = None
    score: Optional[int] = None


# =====================================================================
# LANGUAGE MAPPING (Judge0 API language IDs)
# =====================================================================

LANGUAGE_MAP = {
    "python": 71,
    "python3": 71,
    "cpp": 54,
    "c++": 54,
    "java": 62,
    "javascript": 63,
    "go": 60,
    "rust": 73,
    "c": 50,
    "csharp": 51,
    "c#": 51,
    "ruby": 72,
    "php": 68,
    "kotlin": 48,
    "scala": 56,
    "swift": 19,
}

# =====================================================================
# PROBLEMS DATABASE (8 Complete Problems)
# =====================================================================

PROBLEMS: Dict[int, Dict] = {
    1: {
        "id": 1,
        "title": "Two Sum",
        "description": (
            "Given an array of integers nums and an integer target, return indices "
            "of the two numbers such that they add up to target.\n\n"
            "You may assume that each input would have exactly one solution, "
            "and you may not use the same element twice.\n\n"
            "**Input Format:**\n"
            "- First line: space-separated integers (the array)\n"
            "- Second line: the target integer\n\n"
            "**Output Format:**\n"
            "- Space-separated indices of the two numbers"
        ),
        "difficulty": "Easy",
        "points": 10,
        "constraints": "2 ≤ nums.length ≤ 10⁴, -10⁹ ≤ nums[i] ≤ 10⁹",
        "sample_input": "2 7 11 15\n9",
        "sample_output": "0 1",
        "sample_test_cases": [
            {"input": "2 7 11 15\n9", "expected": "0 1"},
            {"input": "3 2 4\n6", "expected": "1 2"},
        ],
        "hidden_test_cases": [
            {"input": "3 3\n6", "expected": "0 1"},
            {"input": "1 2 3 4 5\n9", "expected": "3 4"},
            {"input": "5 5\n10", "expected": "0 1"},
        ],
    },
    2: {
        "id": 2,
        "title": "Reverse String",
        "description": (
            "Write a function that reverses a string.\n\n"
            "**Input Format:**\n"
            "- A single line containing the string to reverse\n\n"
            "**Output Format:**\n"
            "- The reversed string"
        ),
        "difficulty": "Easy",
        "points": 8,
        "constraints": "1 ≤ s.length ≤ 10⁵",
        "sample_input": "hello",
        "sample_output": "olleh",
        "sample_test_cases": [
            {"input": "hello", "expected": "olleh"},
            {"input": "Hannah", "expected": "hannaH"},
        ],
        "hidden_test_cases": [
            {"input": "world", "expected": "dlrow"},
            {"input": "a", "expected": "a"},
            {"input": "racecar", "expected": "racecar"},
        ],
    },
    3: {
        "id": 3,
        "title": "Palindrome Number",
        "description": (
            "Given an integer x, return True if x is a palindrome integer, "
            "otherwise return False.\n\n"
            "An integer is a palindrome when it reads the same forwards and backwards.\n\n"
            "**Input Format:**\n"
            "- A single integer\n\n"
            "**Output Format:**\n"
            "- True or False"
        ),
        "difficulty": "Easy",
        "points": 10,
        "constraints": "-2³¹ ≤ x ≤ 2³¹ - 1",
        "sample_input": "121",
        "sample_output": "True",
        "sample_test_cases": [
            {"input": "121", "expected": "True"},
            {"input": "-121", "expected": "False"},
        ],
        "hidden_test_cases": [
            {"input": "10", "expected": "False"},
            {"input": "0", "expected": "True"},
            {"input": "12321", "expected": "True"},
        ],
    },
    4: {
        "id": 4,
        "title": "Valid Parentheses",
        "description": (
            "Given a string s containing just the characters '(', ')', '{', '}', "
            "'[' and ']', determine if the input string is valid.\n\n"
            "An input string is valid if:\n"
            "1. Open brackets are closed by the same type of brackets.\n"
            "2. Open brackets are closed in the correct order.\n\n"
            "**Input Format:**\n"
            "- A single string of bracket characters\n\n"
            "**Output Format:**\n"
            "- True or False"
        ),
        "difficulty": "Medium",
        "points": 15,
        "constraints": "1 ≤ s.length ≤ 10⁴",
        "sample_input": "()[]{}\n",
        "sample_output": "True",
        "sample_test_cases": [
            {"input": "()[]{}", "expected": "True"},
            {"input": "(]", "expected": "False"},
        ],
        "hidden_test_cases": [
            {"input": "([)]", "expected": "False"},
            {"input": "{[]}", "expected": "True"},
            {"input": "(", "expected": "False"},
        ],
    },
    5: {
        "id": 5,
        "title": "Fibonacci Number",
        "description": (
            "The Fibonacci numbers form a sequence where each number is "
            "the sum of the two preceding ones, starting from 0 and 1.\n\n"
            "Given n, return F(n).\n\n"
            "F(0) = 0, F(1) = 1, F(n) = F(n-1) + F(n-2) for n > 1\n\n"
            "**Input Format:**\n"
            "- A single integer n\n\n"
            "**Output Format:**\n"
            "- The nth Fibonacci number"
        ),
        "difficulty": "Easy",
        "points": 12,
        "constraints": "0 ≤ n ≤ 30",
        "sample_input": "2",
        "sample_output": "1",
        "sample_test_cases": [
            {"input": "2", "expected": "1"},
            {"input": "3", "expected": "2"},
        ],
        "hidden_test_cases": [
            {"input": "4", "expected": "3"},
            {"input": "0", "expected": "0"},
            {"input": "10", "expected": "55"},
        ],
    },
    6: {
        "id": 6,
        "title": "FizzBuzz",
        "description": (
            "Given an integer n, for each number from 1 to n:\n"
            "- If the number is divisible by 3, print 'Fizz'\n"
            "- If the number is divisible by 5, print 'Buzz'\n"
            "- If divisible by both 3 and 5, print 'FizzBuzz'\n"
            "- Otherwise, print the number\n\n"
            "Print each result on a new line.\n\n"
            "**Input Format:**\n"
            "- A single integer n\n\n"
            "**Output Format:**\n"
            "- One output per line"
        ),
        "difficulty": "Easy",
        "points": 8,
        "constraints": "1 ≤ n ≤ 100",
        "sample_input": "5",
        "sample_output": "1\nFizz\nBuzz\nFizz\n5",
        "sample_test_cases": [
            {"input": "5", "expected": "1\nFizz\nBuzz\nFizz\n5"},
            {"input": "3", "expected": "1\nFizz\nBuzz"},
        ],
        "hidden_test_cases": [
            {"input": "15", "expected": "1\nFizz\nBuzz\nFizz\n5\nFizz\n7\n8\nFizz\nBuzz\n11\nFizz\n13\n14\nFizzBuzz"},
            {"input": "1", "expected": "1"},
            {"input": "6", "expected": "1\nFizz\nBuzz\nFizz\n5\nFizz"},
        ],
    },
    7: {
        "id": 7,
        "title": "Sum of Digits",
        "description": (
            "Given a positive integer, return the sum of its digits.\n\n"
            "**Input Format:**\n"
            "- A single positive integer\n\n"
            "**Output Format:**\n"
            "- The sum of its digits"
        ),
        "difficulty": "Easy",
        "points": 6,
        "constraints": "1 ≤ n ≤ 10⁹",
        "sample_input": "12345",
        "sample_output": "15",
        "sample_test_cases": [
            {"input": "12345", "expected": "15"},
            {"input": "999", "expected": "27"},
        ],
        "hidden_test_cases": [
            {"input": "1", "expected": "1"},
            {"input": "100", "expected": "1"},
            {"input": "9999", "expected": "36"},
        ],
    },
    8: {
        "id": 8,
        "title": "Maximum of Array",
        "description": (
            "Given an array of integers, return the maximum value.\n\n"
            "**Input Format:**\n"
            "- A space-separated line of integers\n\n"
            "**Output Format:**\n"
            "- The maximum integer"
        ),
        "difficulty": "Easy",
        "points": 6,
        "constraints": "1 ≤ array.length ≤ 10⁵, -10⁹ ≤ nums[i] ≤ 10⁹",
        "sample_input": "1 5 3 9 2",
        "sample_output": "9",
        "sample_test_cases": [
            {"input": "1 5 3 9 2", "expected": "9"},
            {"input": "-5 -2 -10", "expected": "-2"},
        ],
        "hidden_test_cases": [
            {"input": "42", "expected": "42"},
            {"input": "100 50 75", "expected": "100"},
            {"input": "-1 -2 -3", "expected": "-1"},
        ],
    },
}

# =====================================================================
# UTILITY FUNCTIONS
# =====================================================================


def normalize_output(output: str) -> str:
    """Normalize output by stripping whitespace and standardizing line endings"""
    return "\n".join(line.rstrip() for line in output.strip().split("\n")).strip()


async def run_judge0(
    language_id: int, source_code: str, stdin: str = ""
) -> Dict[str, Any]:
    """Execute code on Judge0 and return result"""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            payload = {
                "language_id": language_id,
                "source_code": source_code,
                "stdin": stdin,
            }
            response = await client.post(
                f"{JUDGE0_URL}/submissions",
                json=payload,
                headers={"Content-Type": "application/json"},
            )
            
            if response.status_code != 201:
                logger.error(f"Judge0 submission failed: {response.text}")
                return {"error": f"Judge0 error: {response.status_code}"}
            
            submission = response.json()
            token = submission.get("token")
            
            # Poll for result
            for attempt in range(30):
                await asyncio.sleep(0.5)
                result_response = await client.get(
                    f"{JUDGE0_URL}/submissions/{token}",
                    params={"base64_encoded": "false"},
                )
                
                if result_response.status_code == 200:
                    result = result_response.json()
                    if result.get("status", {}).get("id") not in [1, 2]:  # Not queued or processing
                        return result
            
            return {"error": "Judge0 timeout"}
    
    except Exception as e:
        logger.error(f"Judge0 execution error: {e}")
        return {"error": str(e)}


# =====================================================================
# ENDPOINTS
# =====================================================================


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "judge",
        "judge0_url": JUDGE0_URL,
        "leaderboard_url": LEADERBOARD_URL,
        "problems_available": len(PROBLEMS),
    }


@app.get("/api/v1/problems")
async def get_problems(limit: int = 100, offset: int = 0):
    """Get all problems with pagination"""
    try:
        problems_list = list(PROBLEMS.values())
        paginated = problems_list[offset : offset + limit]
        
        return {
            "status": "success",
            "data": paginated,
            "total": len(problems_list),
            "offset": offset,
            "limit": limit,
        }
    except Exception as e:
        logger.error(f"❌ Error in get_problems: {e}")
        return {
            "status": "error",
            "message": str(e),
            "data": [],
            "total": 0,
        }


@app.get("/api/v1/problems/{problem_id}")
async def get_problem(problem_id: int):
    """Get a specific problem by ID"""
    try:
        problem = PROBLEMS.get(problem_id)
        if not problem:
            raise HTTPException(status_code=404, detail="Problem not found")
        
        return {
            "status": "success",
            "data": problem,
        }
    except Exception as e:
        logger.error(f"❌ Error fetching problem {problem_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/v1/submissions", response_model=SubmissionResponse)
async def create_submission(request: SubmissionRequest, background_tasks: BackgroundTasks):
    """
    Full submission - evaluates against all test cases
    Returns immediately with submission_id; evaluation happens in background
    """
    sub_id = str(uuid.uuid4())
    
    try:
        problem = PROBLEMS.get(request.problem_id)
        if not problem:
            return SubmissionResponse(
                submission_id=sub_id,
                status="error",
                message="Problem not found",
            )
        
        # Get language ID from mapping
        lang = request.language.lower()
        language_id = LANGUAGE_MAP.get(lang)
        if not language_id:
            return SubmissionResponse(
                submission_id=sub_id,
                status="error",
                message=f"Unsupported language: {request.language}",
            )
        
        # Store submission
        active_submissions[sub_id] = {
            "id": sub_id,
            "problem_id": request.problem_id,
            "language": request.language,
            "user_id": request.user_id,
            "status": "evaluating",
            "created_at": datetime.utcnow().isoformat(),
        }
        
        # Start evaluation in background
        background_tasks.add_task(
            evaluate_submission,
            sub_id,
            request.problem_id,
            language_id,
            request.source_code,
            request.user_id,
        )
        
        return SubmissionResponse(
            submission_id=sub_id,
            status="pending",
            message="Submission received. Evaluating...",
        )
    
    except Exception as e:
        logger.error(f"❌ Submission error: {e}")
        return SubmissionResponse(
            submission_id=sub_id,
            status="error",
            message=str(e),
        )


async def evaluate_submission(
    sub_id: str,
    problem_id: int,
    language_id: int,
    source_code: str,
    user_id: Optional[str],
):
    """Background task to evaluate submission against all test cases"""
    try:
        problem = PROBLEMS[problem_id]
        all_test_cases = (
            problem.get("sample_test_cases", [])
            + problem.get("hidden_test_cases", [])
        )
        
        test_results = []
        passed_count = 0
        
        for idx, test_case in enumerate(all_test_cases, 1):
            input_data = test_case.get("input", "")
            expected = test_case.get("expected", "")
            
            # Run on Judge0
            judge0_result = await run_judge0(language_id, source_code, input_data)
            
            if "error" in judge0_result:
                actual_output = ""
                runtime_error = judge0_result.get("error")
            else:
                status_id = judge0_result.get("status", {}).get("id")
                actual_output = judge0_result.get("stdout", "") or ""
                
                # Status codes: 3=Accepted, 4=Wrong Answer, 5=TLE, 6=CE, 7+=Runtime Error
                if status_id == 6:
                    runtime_error = "Compilation Error"
                elif status_id == 5:
                    runtime_error = "Time Limit Exceeded"
                elif status_id >= 7:
                    runtime_error = judge0_result.get("stderr", "Runtime Error") or "Runtime Error"
                else:
                    runtime_error = None
            
            # Normalize and compare
            actual_normalized = normalize_output(actual_output)
            expected_normalized = normalize_output(expected)
            passed = actual_normalized == expected_normalized and not runtime_error
            
            if passed:
                passed_count += 1
            
            test_results.append(
                TestCaseResult(
                    test_case_number=idx,
                    input=input_data,
                    expected_output=expected,
                    actual_output=actual_output,
                    passed=passed,
                    runtime_error=runtime_error,
                )
            )
        
        # Determine verdict
        total_tests = len(all_test_cases)
        if passed_count == total_tests:
            verdict = "Accepted"
            score = problem.get("points", 0)
        elif passed_count > 0:
            verdict = "Partial"
            score = int(problem.get("points", 0) * (passed_count / total_tests))
        else:
            verdict = "Wrong Answer"
            score = 0
        
        # Update submission record
        active_submissions[sub_id] = {
            "id": sub_id,
            "problem_id": problem_id,
            "language": "",
            "user_id": user_id,
            "status": "completed",
            "verdict": verdict,
            "passed_tests": passed_count,
            "total_tests": total_tests,
            "test_cases": [tc.dict() for tc in test_results],
            "score": score,
            "completed_at": datetime.utcnow().isoformat(),
        }
        
        logger.info(f"✅ Submission {sub_id} evaluated: {verdict} ({passed_count}/{total_tests})")
        
        # Update leaderboard if Accepted
        if verdict == "Accepted" and user_id:
            await update_leaderboard(user_id, problem_id, score, sub_id)
    
    except Exception as e:
        logger.error(f"❌ Evaluation error for {sub_id}: {e}")
        active_submissions[sub_id]["status"] = "error"
        active_submissions[sub_id]["message"] = str(e)


async def update_leaderboard(
    user_id: str, problem_id: int, score: int, submission_id: str
):
    """Update leaderboard after accepted submission"""
    try:
        # Get user data from PostgreSQL if available
        if HAS_POSTGRES:
            user = await PostgreSQLService.get_user(user_id)
            if user:
                username = user.get("username", "Unknown")
                house = user.get("house", "Unknown")
            else:
                username = "Unknown"
                house = "Unknown"
        else:
            username = "Unknown"
            house = "Unknown"
        
        # Call Leaderboard Service
        payload = {
            "user_id": user_id,
            "username": username,
            "house": house,
            "problem_id": problem_id,
            "score": score,
            "submission_id": submission_id,
        }
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                f"{LEADERBOARD_URL}/api/v1/update_score",
                json=payload,
            )
            if response.status_code == 200:
                logger.info(f"🎯 Leaderboard updated for user {user_id}")
            else:
                logger.warning(f"⚠️ Leaderboard update failed: {response.status_code}")
    
    except Exception as e:
        logger.error(f"❌ Leaderboard update error: {e}")


@app.get("/api/v1/submissions/{submission_id}")
async def get_submission(submission_id: str):
    """Poll for submission result"""
    try:
        if submission_id not in active_submissions:
            return {
                "status": "not_found",
                "message": "Submission not found",
            }
        
        sub = active_submissions[submission_id]
        
        if sub["status"] == "evaluating":
            return {
                "status": "pending",
                "message": "Still evaluating...",
                "submission_id": submission_id,
            }
        
        if sub["status"] == "error":
            return {
                "status": "error",
                "message": sub.get("message", "Unknown error"),
                "submission_id": submission_id,
            }
        
        return {
            "status": "completed",
            "submission_id": submission_id,
            "verdict": sub.get("verdict"),
            "passed_tests": sub.get("passed_tests"),
            "total_tests": sub.get("total_tests"),
            "score": sub.get("score"),
            "test_cases": sub.get("test_cases"),
        }
    
    except Exception as e:
        logger.error(f"❌ Error fetching submission {submission_id}: {e}")
        return {
            "status": "error",
            "message": str(e),
        }


@app.post("/api/v1/submissions/run")
async def run_sample_test(request: SubmissionRequest):
    """Run only sample test cases for quick feedback"""
    try:
        problem = PROBLEMS.get(request.problem_id)
        if not problem:
            raise HTTPException(status_code=404, detail="Problem not found")
        
        lang = request.language.lower()
        language_id = LANGUAGE_MAP.get(lang)
        if not language_id:
            raise HTTPException(status_code=400, detail=f"Unsupported language: {request.language}")
        
        sample_tests = problem.get("sample_test_cases", [])
        test_results = []
        passed_count = 0
        
        for idx, test_case in enumerate(sample_tests, 1):
            input_data = test_case.get("input", "")
            expected = test_case.get("expected", "")
            
            judge0_result = await run_judge0(language_id, request.source_code, input_data)
            
            if "error" in judge0_result:
                actual_output = ""
                runtime_error = judge0_result.get("error")
            else:
                actual_output = judge0_result.get("stdout", "") or ""
                status_id = judge0_result.get("status", {}).get("id")
                runtime_error = None
                
                if status_id == 6:
                    runtime_error = "Compilation Error"
                elif status_id >= 7:
                    runtime_error = "Runtime Error"
            
            actual_normalized = normalize_output(actual_output)
            expected_normalized = normalize_output(expected)
            passed = actual_normalized == expected_normalized and not runtime_error
            
            if passed:
                passed_count += 1
            
            test_results.append({
                "test_case": idx,
                "input": input_data,
                "expected": expected,
                "actual": actual_output,
                "passed": passed,
                "error": runtime_error,
            })
        
        return {
            "status": "completed",
            "passed": passed_count,
            "total": len(sample_tests),
            "verdict": "Accepted" if passed_count == len(sample_tests) else "Wrong Answer",
            "test_cases": test_results,
        }
    
    except Exception as e:
        logger.error(f"❌ Error running sample test: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
