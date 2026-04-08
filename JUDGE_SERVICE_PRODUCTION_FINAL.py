"""
CODUKU Judge Service - Production Ready
Handles code submission evaluation, Judge0 integration, and leaderboard updates.
Supports 13+ programming languages with detailed test case feedback.
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import httpx
import asyncio
import logging
import os
import re
from enum import Enum
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
    title="CODUKU Judge Service",
    description="Code submission evaluation and language compilation service",
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

# ============= CONFIGURATION =============
JUDGE0_URL = os.getenv("JUDGE0_URL", "http://judge0:2358")
LEADERBOARD_URL = os.getenv("LEADERBOARD_URL", "http://leaderboard:8003")
JUDGE0_API_KEY = os.getenv("JUDGE0_API_KEY", "")

# Language ID mappings (Judge0 official IDs)
LANGUAGE_IDS = {
    "python": 71,
    "java": 62,
    "cpp": 54,
    "c": 50,
    "javascript": 63,
    "typescript": 74,
    "go": 60,
    "rust": 73,
    "csharp": 51,
    "ruby": 72,
    "php": 68,
    "swift": 83,
    "kotlin": 78,
}

# ============= DATA MODELS =============

class VerdictEnum(str, Enum):
    """Submission verdict status codes"""
    ACCEPTED = "Accepted"
    WRONG_ANSWER = "Wrong Answer"
    RUNTIME_ERROR = "Runtime Error"
    TIME_LIMIT = "Time Limit Exceeded"
    COMPILATION_ERROR = "Compilation Error"
    PARTIAL = "Partially Correct"
    PENDING = "Pending"


class TestCaseResult(BaseModel):
    """Individual test case result"""
    test_case_number: int
    input: str
    expected_output: str
    actual_output: str
    passed: bool
    runtime_ms: Optional[float] = None
    memory_mb: Optional[float] = None
    error: Optional[str] = None


class SubmissionResult(BaseModel):
    """Complete submission evaluation result"""
    submission_id: str
    verdict: VerdictEnum
    total_test_cases: int
    passed_test_cases: int
    language: str
    runtime_ms: Optional[float] = None
    memory_mb: Optional[float] = None
    compilation_error: Optional[str] = None
    test_cases: List[TestCaseResult]
    score: int  # Points earned (0-100 based on difficulty)
    submitted_code: str
    submission_time: str


class ProblemExample(BaseModel):
    """Example input/output for a problem"""
    input: str
    output: str
    explanation: Optional[str] = None


class TestCase(BaseModel):
    """Test case for a problem"""
    input: str
    expected_output: str


class Problem(BaseModel):
    """Coding problem definition"""
    id: int
    title: str
    description: str
    difficulty: str  # Easy, Medium, Hard
    points: int  # Points awarded on "Accepted"
    examples: List[ProblemExample]
    test_cases: List[TestCase]
    constraints: str
    time_limit_seconds: int
    memory_limit_mb: int


class SubmissionRequest(BaseModel):
    """Submission payload"""
    problem_id: int
    language: str
    code: str
    user_id: str
    username: str
    house: str


class RunSubmissionRequest(BaseModel):
    """Request to run code on specific test cases"""
    problem_id: int
    language: str
    code: str
    test_cases: List[Dict[str, str]] = None  # Override test cases


# ============= PROBLEM BANK =============

PROBLEMS: Dict[int, Problem] = {
    1: Problem(
        id=1,
        title="Two Sum",
        description="""Given an array of integers nums and an integer target, return the indices of the two numbers that add up to target.

You may assume each input has exactly one solution, and you cannot use the same element twice.

Return the answer in any order.""",
        difficulty="Easy",
        points=10,
        examples=[
            ProblemExample(
                input="nums = [2,7,11,15], target = 9",
                output="[0,1]",
                explanation="nums[0] + nums[1] == 9, so we return [0, 1]."
            ),
            ProblemExample(
                input="nums = [3,2,4], target = 6",
                output="[1,2]",
                explanation="nums[1] + nums[2] == 6, so we return [1, 2]."
            ),
        ],
        test_cases=[
            TestCase(input="[2,7,11,15]\n9", expected_output="[0,1]"),
            TestCase(input="[3,2,4]\n6", expected_output="[1,2]"),
            TestCase(input="[3,3]\n6", expected_output="[0,1]"),
            TestCase(input="[2,5,5,11]\n10", expected_output="[1,2]"),
        ],
        constraints="2 <= nums.length <= 10^4, -10^9 <= nums[i] <= 10^9, -10^9 <= target <= 10^9",
        time_limit_seconds=1,
        memory_limit_mb=256
    ),
    2: Problem(
        id=2,
        title="Reverse String",
        description="""Write a function that reverses a string. The input string is given as an array of characters s.

You must do this by modifying the input array in-place with O(1) extra memory.""",
        difficulty="Easy",
        points=10,
        examples=[
            ProblemExample(
                input='s = ["h","e","l","l","o"]',
                output='["o","l","l","e","h"]',
                explanation="Characters in the string are reversed."
            ),
            ProblemExample(
                input='s = ["H","a","n","n","a","h"]',
                output='["h","a","n","n","a","H"]',
                explanation="Characters are reversed in-place."
            ),
        ],
        test_cases=[
            TestCase(input="hello", expected_output="olleh"),
            TestCase(input="Hannah", expected_output="hannaH"),
            TestCase(input="a", expected_output="a"),
            TestCase(input="ab", expected_output="ba"),
        ],
        constraints="1 <= s.length <= 10^5, s[i] is an ASCII character.",
        time_limit_seconds=1,
        memory_limit_mb=256
    ),
    3: Problem(
        id=3,
        title="Palindrome Number",
        description="""Given an integer x, return true if x is palindromic integer.

An integer is a palindrome when it reads the same backward as forward.

Negative integers are not palindromes. Numbers ending with 0 are not palindromes (except 0 itself).""",
        difficulty="Easy",
        points=10,
        examples=[
            ProblemExample(
                input="x = 121",
                output="true",
                explanation="121 reads as 121 from left to right and from right to left."
            ),
            ProblemExample(
                input="x = -121",
                output="false",
                explanation="From left to right, it reads -121. From right to left, it becomes 121-. Therefore it is not a palindrome."
            ),
        ],
        test_cases=[
            TestCase(input="121", expected_output="true"),
            TestCase(input="-121", expected_output="false"),
            TestCase(input="10", expected_output="false"),
            TestCase(input="0", expected_output="true"),
        ],
        constraints="-2^31 <= x <= 2^31 - 1",
        time_limit_seconds=1,
        memory_limit_mb=256
    ),
    4: Problem(
        id=4,
        title="Valid Parentheses",
        description="""Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.

An input string is valid if:
- Open brackets are closed by the same type of brackets.
- Open brackets are closed in the correct order.
- Every close bracket has a corresponding open bracket of the same type.""",
        difficulty="Easy",
        points=10,
        examples=[
            ProblemExample(
                input='s = "()"',
                output="true",
                explanation="All brackets are properly matched."
            ),
            ProblemExample(
                input='s = "([{}])"',
                output="true",
                explanation="Nested and properly matched brackets."
            ),
        ],
        test_cases=[
            TestCase(input="()", expected_output="true"),
            TestCase(input="([{}])", expected_output="true"),
            TestCase(input="(]", expected_output="false"),
            TestCase(input="([)]", expected_output="false"),
        ],
        constraints="1 <= s.length <= 10^4, s[i] is '(', ')', '{', '}', '[' or ']'.",
        time_limit_seconds=1,
        memory_limit_mb=256
    ),
    5: Problem(
        id=5,
        title="Merge Sorted Array",
        description="""You are given two integer arrays nums1 and nums2, sorted in non-decreasing order, and two integers m and n, 
representing the number of valid elements in nums1 and nums2 respectively.

Merge nums2 into nums1 as one sorted array.

Note: The number of elements initialized in nums1 and nums2 are m and n respectively. You may assume that nums1 has a total length of m + n, 
that it has enough space to hold additional elements from nums2.""",
        difficulty="Easy",
        points=15,
        examples=[
            ProblemExample(
                input="nums1 = [1,2,3,0,0,0], m = 3, nums2 = [2,5,6], n = 3",
                output="[1,2,2,3,5,6]",
                explanation="Arrays are merged into sorted order."
            ),
        ],
        test_cases=[
            TestCase(input="[1,2,3,0,0,0]\n3\n[2,5,6]\n3", expected_output="[1,2,2,3,5,6]"),
            TestCase(input="[1]\n1\n[]\n0", expected_output="[1]"),
            TestCase(input="[0]\n0\n[1]\n1", expected_output="[1]"),
        ],
        constraints="nums1.length == m + n, nums2.length == n, 0 <= m, n <= 200, 1 <= m + n <= 200, -10^9 <= nums1[i], nums2[j] <= 10^9",
        time_limit_seconds=1,
        memory_limit_mb=256
    ),
    6: Problem(
        id=6,
        title="Contains Duplicate",
        description="""Given an integer array nums, return true if any value appears at least twice in the array, 
and return false if every element is distinct.""",
        difficulty="Easy",
        points=15,
        examples=[
            ProblemExample(
                input="nums = [1,2,3,1]",
                output="true",
                explanation="The element 1 appears twice."
            ),
            ProblemExample(
                input="nums = [1,2,3,4]",
                output="false",
                explanation="All elements are distinct."
            ),
        ],
        test_cases=[
            TestCase(input="[1,2,3,1]", expected_output="true"),
            TestCase(input="[1,2,3,4]", expected_output="false"),
            TestCase(input="[1,1,1,3,3,4,3,2,4,2]", expected_output="true"),
        ],
        constraints="1 <= nums.length <= 10^5, -10^9 <= nums[i] <= 10^9",
        time_limit_seconds=2,
        memory_limit_mb=256
    ),
    7: Problem(
        id=7,
        title="Best Time to Buy and Sell Stock",
        description="""You are given an array prices where prices[i] is the price of a given stock on the ith day.

You want to maximize your profit by choosing a single day to buy one stock and a different day in the future to sell that stock.

Return the maximum profit you can achieve from this transaction. If you cannot achieve any profit, return 0.

Constraint: You must sell before you can buy again.""",
        difficulty="Medium",
        points=20,
        examples=[
            ProblemExample(
                input="prices = [7,1,5,3,6,4]",
                output="5",
                explanation="Buy on day 2 (price=1) and sell on day 5 (price=6), profit = 6-1 = 5."
            ),
            ProblemExample(
                input="prices = [7,6,4,3,1]",
                output="0",
                explanation="No transactions are done, max profit = 0."
            ),
        ],
        test_cases=[
            TestCase(input="[7,1,5,3,6,4]", expected_output="5"),
            TestCase(input="[7,6,4,3,1]", expected_output="0"),
            TestCase(input="[2,4,1]", expected_output="2"),
        ],
        constraints="1 <= prices.length <= 10^5, 0 <= prices[i] <= 10^4",
        time_limit_seconds=2,
        memory_limit_mb=256
    ),
    8: Problem(
        id=8,
        title="Maximum Subarray",
        description="""Given an integer array nums, find the contiguous subarray (containing at least one number) which has the largest sum and return its sum.

A subarray is a contiguous part of an array.

Example: [-2,1,-3,4,-1,2,1,-5,4] has the largest sum subarray: [4,-1,2,1] with sum 6.""",
        difficulty="Medium",
        points=20,
        examples=[
            ProblemExample(
                input="nums = [-2,1,-3,4,-1,2,1,-5,4]",
                output="6",
                explanation="Subarray [4,-1,2,1] has sum 6 (largest)."
            ),
            ProblemExample(
                input="nums = [5,4,-1,7,8]",
                output="23",
                explanation="The entire array is the largest subarray."
            ),
        ],
        test_cases=[
            TestCase(input="[-2,1,-3,4,-1,2,1,-5,4]", expected_output="6"),
            TestCase(input="[5,4,-1,7,8]", expected_output="23"),
            TestCase(input="[-1]", expected_output="-1"),
        ],
        constraints="1 <= nums.length <= 10^5, -10^4 <= nums[i] <= 10^4",
        time_limit_seconds=2,
        memory_limit_mb=256
    ),
}

# ============= JUDGE0 INTERACTION =============

async def get_judge0_status() -> bool:
    """Check if Judge0 is running and healthy"""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(f"{JUDGE0_URL}/")
            return response.status_code == 200
    except Exception as e:
        logger.error(f"Judge0 health check failed: {e}")
        return False


async def submit_to_judge0(code: str, language_id: int, stdin: str, expected_output: str) -> Dict[str, Any]:
    """
    Submit code to Judge0 for evaluation.
    Returns Judge0 token for polling results.
    """
    headers = {"Content-Type": "application/json"}
    if JUDGE0_API_KEY:
        headers["X-Auth-Token"] = JUDGE0_API_KEY

    payload = {
        "source_code": code,
        "language_id": language_id,
        "stdin": stdin,
        "expected_output": expected_output,
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{JUDGE0_URL}/submissions",
                json=payload,
                headers=headers,
            )
            response.raise_for_status()
            data = response.json()
            logger.info(f"Submitted to Judge0: token={data.get('token')}")
            return data
    except Exception as e:
        logger.error(f"Error submitting to Judge0: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to submit to Judge0: {str(e)}")


async def poll_judge0_result(token: str, max_retries: int = 30) -> Dict[str, Any]:
    """Poll Judge0 for submission result with exponential backoff"""
    headers = {}
    if JUDGE0_API_KEY:
        headers["X-Auth-Token"] = JUDGE0_API_KEY

    for attempt in range(max_retries):
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(
                    f"{JUDGE0_URL}/submissions/{token}",
                    headers=headers,
                    params={"base64": "false"}
                )
                response.raise_for_status()
                data = response.json()

                # Status codes: 0=queue, 1=processing, 2=accepted, 3=wrong answer, etc.
                status = data.get("status", {}).get("id", 0)

                if status in [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]:  # Completed
                    logger.info(f"Judge0 result for {token}: status={status}, verdict={data}")
                    return data

                # Not done yet, wait before retrying
                wait_time = min(1 + attempt * 0.5, 5)  # Exponential backoff, max 5s
                await asyncio.sleep(wait_time)

        except Exception as e:
            logger.error(f"Error polling Judge0: {e}")
            if attempt == max_retries - 1:
                raise HTTPException(status_code=500, detail=f"Judge0 polling timeout: {str(e)}")

    raise HTTPException(status_code=500, detail="Judge0 result polling timed out after 30 attempts")


def map_judge0_verdict(judge0_status_id: int, passed_count: int, total_count: int) -> VerdictEnum:
    """Map Judge0 status code to submission verdict"""
    judge0_verdicts = {
        1: VerdictEnum.PENDING,
        2: VerdictEnum.PENDING,
        3: VerdictEnum.ACCEPTED if passed_count == total_count else VerdictEnum.WRONG_ANSWER,
        4: VerdictEnum.WRONG_ANSWER,
        5: VerdictEnum.TIME_LIMIT,
        6: VerdictEnum.COMPILATION_ERROR,
        7: VerdictEnum.RUNTIME_ERROR,
        8: VerdictEnum.RUNTIME_ERROR,
        9: VerdictEnum.TIME_LIMIT,
        10: VerdictEnum.RUNTIME_ERROR,
        11: VerdictEnum.RUNTIME_ERROR,
        12: VerdictEnum.COMPILATION_ERROR,
        13: VerdictEnum.RUNTIME_ERROR,
        14: VerdictEnum.RUNTIME_ERROR,
    }
    return judge0_verdicts.get(judge0_status_id, VerdictEnum.RUNTIME_ERROR)


async def normalize_output(output: str) -> str:
    """Normalize output for comparison (strip whitespace, handle newlines)"""
    if not output:
        return ""
    return output.strip()


async def evaluate_submission(
    code: str,
    language: str,
    test_cases: List[TestCase],
    problem_id: int
) -> tuple[List[TestCaseResult], VerdictEnum, int]:
    """
    Evaluate submission against all test cases.
    Returns (test_results, overall_verdict, score)
    """
    test_results = []
    passed_count = 0

    if language.lower() not in LANGUAGE_IDS:
        raise HTTPException(status_code=400, detail=f"Unsupported language: {language}")

    language_id = LANGUAGE_IDS[language.lower()]

    # Judge0 health check
    is_healthy = await get_judge0_status()
    if not is_healthy:
        raise HTTPException(status_code=500, detail="Judge0 service is currently offline")

    for idx, test_case in enumerate(test_cases, 1):
        try:
            # Submit to Judge0
            judge0_response = await submit_to_judge0(
                code=code,
                language_id=language_id,
                stdin=test_case.input,
                expected_output=test_case.expected_output
            )

            token = judge0_response.get("token")
            if not token:
                logger.error(f"No token in Judge0 response: {judge0_response}")
                raise ValueError("Judge0 returned no token")

            # Poll for result
            result = await poll_judge0_result(token)

            # Extract details
            status_id = result.get("status", {}).get("id", 0)
            actual_output = result.get("stdout", "").strip() if result.get("stdout") else ""
            stderr = result.get("stderr", "")
            compile_output = result.get("compile_output", "")
            runtime_ms = result.get("time")
            memory_mb = result.get("memory")

            # Normalize for comparison
            expected_normalized = await normalize_output(test_case.expected_output)
            actual_normalized = await normalize_output(actual_output)
            passed = expected_normalized == actual_normalized and status_id == 3

            if passed:
                passed_count += 1

            error_msg = stderr if stderr else (compile_output if compile_output else None)

            test_results.append(TestCaseResult(
                test_case_number=idx,
                input=test_case.input[:100],  # Truncate for display
                expected_output=expected_normalized[:100],
                actual_output=actual_normalized[:100],
                passed=passed,
                runtime_ms=float(runtime_ms) if runtime_ms else None,
                memory_mb=float(memory_mb) if memory_mb else None,
                error=error_msg
            ))

        except Exception as e:
            logger.error(f"Error evaluating test case {idx}: {e}")
            test_results.append(TestCaseResult(
                test_case_number=idx,
                input=test_case.input[:100],
                expected_output=test_case.expected_output[:100],
                actual_output="",
                passed=False,
                error=str(e)
            ))

    # Determine overall verdict and score
    if passed_count == len(test_cases):
        verdict = VerdictEnum.ACCEPTED
        score = 100
    elif passed_count > 0:
        verdict = VerdictEnum.PARTIAL
        score = int((passed_count / len(test_cases)) * 100)
    else:
        verdict = VerdictEnum.WRONG_ANSWER
        score = 0

    return test_results, verdict, score


# ============= BACKGROUND TASKS =============

async def update_leaderboard(
    user_id: str,
    username: str,
    house: str,
    problem_id: int,
    score: int,
    submission_id: str
):
    """Send leaderboard update to Leaderboard Service"""
    try:
        payload = {
            "user_id": user_id,
            "username": username,
            "house": house,
            "problem_id": problem_id,
            "score": score,
            "submission_id": submission_id
        }

        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                f"{LEADERBOARD_URL}/api/v1/update_score",
                json=payload
            )
            
            if response.status_code == 200:
                logger.info(f"Leaderboard updated for {username}: +{score} points")
            else:
                logger.error(f"Leaderboard update failed: {response.text}")

    except Exception as e:
        logger.error(f"Error updating leaderboard: {e}")


# ============= API ENDPOINTS =============

@app.get("/health")
async def health_check():
    """Service health check"""
    judge0_healthy = await get_judge0_status()
    return {
        "status": "healthy" if judge0_healthy else "degraded",
        "judge0": "connected" if judge0_healthy else "offline",
        "service": "judge",
        "timestamp": datetime.now().isoformat()
    }


@app.get("/api/v1/problems", response_model=Dict[str, Any])
async def get_problems(limit: int = 100, offset: int = 0):
    """Get all problems with pagination"""
    try:
        all_problems = list(PROBLEMS.values())
        paginated = all_problems[offset:offset + limit]

        return {
            "status": "success",
            "total": len(all_problems),
            "returned": len(paginated),
            "problems": paginated
        }
    except Exception as e:
        logger.error(f"Error fetching problems: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/problems/{problem_id}", response_model=Dict[str, Any])
async def get_problem(problem_id: int):
    """Get specific problem details"""
    try:
        if problem_id not in PROBLEMS:
            raise HTTPException(status_code=404, detail=f"Problem {problem_id} not found")

        problem = PROBLEMS[problem_id]
        return {
            "status": "success",
            "problem": problem
        }
    except Exception as e:
        logger.error(f"Error fetching problem {problem_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/v1/submissions", response_model=Dict[str, Any])
async def submit_code(request: SubmissionRequest, background_tasks: BackgroundTasks):
    """Submit code for evaluation"""
    try:
        # Validate problem exists
        if request.problem_id not in PROBLEMS:
            raise HTTPException(status_code=404, detail=f"Problem {request.problem_id} not found")

        problem = PROBLEMS[request.problem_id]

        # Evaluate submission
        test_results, verdict, score = await evaluate_submission(
            code=request.code,
            language=request.language,
            test_cases=problem.test_cases,
            problem_id=request.problem_id
        )

        # Create submission ID (timestamp-based)
        submission_id = f"sub_{int(datetime.now().timestamp() * 1000)}"

        # If Accepted, update leaderboard in background
        if verdict == VerdictEnum.ACCEPTED:
            background_tasks.add_task(
                update_leaderboard,
                user_id=request.user_id,
                username=request.username,
                house=request.house,
                problem_id=request.problem_id,
                score=score,
                submission_id=submission_id
            )

        submission_result = SubmissionResult(
            submission_id=submission_id,
            verdict=verdict,
            total_test_cases=len(test_results),
            passed_test_cases=sum(1 for r in test_results if r.passed),
            language=request.language,
            test_cases=test_results,
            score=score if verdict == VerdictEnum.ACCEPTED else 0,
            submitted_code=request.code,
            submission_time=datetime.now().isoformat()
        )

        return {
            "status": "success",
            "submission": submission_result
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error evaluating submission: {e}")
        raise HTTPException(status_code=500, detail=f"Submission evaluation failed: {str(e)}")


@app.post("/api/v1/submissions/run", response_model=Dict[str, Any])
async def run_submission(request: RunSubmissionRequest):
    """Run code on custom test cases"""
    try:
        if request.problem_id not in PROBLEMS:
            raise HTTPException(status_code=404, detail=f"Problem {request.problem_id} not found")

        problem = PROBLEMS[request.problem_id]

        # Use provided test cases or problem's test cases
        test_cases = request.test_cases or problem.test_cases

        # Convert dict test cases to TestCase objects if needed
        if test_cases and isinstance(test_cases[0], dict):
            test_cases = [
                TestCase(input=tc["input"], expected_output=tc["expected_output"])
                for tc in test_cases
            ]

        test_results, verdict, score = await evaluate_submission(
            code=request.code,
            language=request.language,
            test_cases=test_cases,
            problem_id=request.problem_id
        )

        return {
            "status": "success",
            "verdict": verdict,
            "passed": sum(1 for r in test_results if r.passed),
            "total": len(test_results),
            "test_cases": test_results
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error running submission: {e}")
        raise HTTPException(status_code=500, detail=f"Test execution failed: {str(e)}")


@app.get("/api/v1/submissions/{submission_id}", response_model=Dict[str, Any])
async def get_submission(submission_id: str):
    """Get submission details (in real app, fetch from DB)"""
    try:
        # This is a placeholder - in production, fetch from database
        return {
            "status": "success",
            "message": f"Submission {submission_id} retrieved"
        }
    except Exception as e:
        logger.error(f"Error fetching submission: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8002,
        log_level="info"
    )
