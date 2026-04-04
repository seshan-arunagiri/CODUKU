import httpx
from app.core.config import settings
from typing import Dict, Optional
import asyncio
import logging

logger = logging.getLogger(__name__)

class Judge0Service:
    """Judge0 API Service - Code Execution"""
    
    # Language ID mapping
    LANGUAGE_MAP = {
        "python3": 71,
        "python": 71,
        "cpp": 54,
        "cpp17": 54,
        "c++": 54,
        "java": 62,
        "javascript": 63,
        "js": 63,
        "go": 60,
        "rust": 73,
        "c": 50,
        "csharp": 51,
        "cs": 51,
        "ruby": 72,
        "php": 68,
        "swift": 75,
        "kotlin": 78,
    }
    
    @classmethod
    async def submit_code(
        cls,
        language: str,
        source_code: str,
        stdin: str = "",
        expected_output: str = ""
    ) -> str:
        """Submit code to Judge0, return token"""
        
        language_lower = language.lower()
        if language_lower not in cls.LANGUAGE_MAP:
            raise ValueError(f"Unsupported language: {language}")
        
        language_id = cls.LANGUAGE_MAP[language_lower]
        
        payload = {
            "language_id": language_id,
            "source_code": source_code,
            "stdin": stdin,
            "expected_output": expected_output,
            "time_limit": 5,
            "memory_limit": 262144,
        }
        
        try:
            async with httpx.AsyncClient(timeout=settings.JUDGE0_TIMEOUT) as client:
                response = await client.post(
                    f"{settings.JUDGE0_API_URL}/submissions?base64_encoded=false&wait=false",
                    json=payload
                )
                
                if response.status_code not in [201, 200]:
                    logger.error(f"❌ Judge0 submission failed: {response.text}")
                    raise Exception(f"Judge0 submission failed: {response.status_code}")
                
                token = response.json()["token"]
                logger.debug(f"✅ Submitted to Judge0, token: {token}")
                return token
        except Exception as e:
            logger.error(f"❌ Judge0 submit error: {e}")
            raise
    
    @classmethod
    async def get_result(cls, token: str) -> Dict:
        """Get submission result"""
        
        try:
            async with httpx.AsyncClient(timeout=settings.JUDGE0_TIMEOUT) as client:
                response = await client.get(
                    f"{settings.JUDGE0_API_URL}/submissions/{token}?base64_encoded=false"
                )
                
                if response.status_code != 200:
                    logger.error(f"❌ Judge0 result fetch failed: {response.text}")
                    raise Exception(f"Failed to get result: {response.status_code}")
                
                return response.json()
        except Exception as e:
            logger.error(f"❌ Judge0 result error: {e}")
            raise
    
    @classmethod
    async def poll_until_complete(cls, token: str, max_polls: int = 60) -> Dict:
        """Poll until submission completes"""
        
        for attempt in range(max_polls):
            try:
                result = await cls.get_result(token)
                
                # Status: 1=Queued, 2=Processing, 3+=Complete
                if result["status"]["id"] not in [1, 2]:
                    logger.info(f"✅ Execution complete: {result['status']['description']}")
                    return result
                
                wait_time = min(0.5 * (attempt + 1), 2)  # Exponential backoff, max 2s
                await asyncio.sleep(wait_time)
            except Exception as e:
                logger.error(f"❌ Poll attempt {attempt + 1} failed: {e}")
                if attempt == max_polls - 1:
                    raise
                await asyncio.sleep(1)
        
        raise TimeoutError("Judge0 execution timeout")
    
    @classmethod
    async def execute_with_test_cases(
        cls,
        language: str,
        source_code: str,
        test_cases: list
    ) -> Dict:
        """Execute code against multiple test cases"""
        
        results = {
            "passed": 0,
            "total": len(test_cases),
            "status": "accepted",
            "details": []
        }
        
        for idx, test_case in enumerate(test_cases):
            try:
                token = await cls.submit_code(
                    language=language,
                    source_code=source_code,
                    stdin=test_case.get("input", ""),
                    expected_output=test_case.get("expected_output", "")
                )
                
                result = await cls.poll_until_complete(token)
                
                # Extract status
                status_id = result["status"]["id"]
                status_desc = result["status"]["description"]
                
                if status_id == 3:  # Accepted
                    results["passed"] += 1
                    results["details"].append({
                        "test_case": idx + 1,
                        "status": "accepted",
                        "output": result.get("stdout", "").strip()
                    })
                else:
                    results["status"] = status_desc
                    results["details"].append({
                        "test_case": idx + 1,
                        "status": status_desc,
                        "stdout": result.get("stdout", ""),
                        "stderr": result.get("stderr", ""),
                        "compile_output": result.get("compile_output", "")
                    })
                    
            except Exception as e:
                logger.error(f"❌ Test case {idx + 1} error: {e}")
                results["status"] = "runtime_error"
                results["details"].append({
                    "test_case": idx + 1,
                    "status": "runtime_error",
                    "error": str(e)
                })
        
        return results

judge0_service = Judge0Service()
