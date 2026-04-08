# JUDGE SERVICE IMPLEMENTATION GUIDE
## Complete Step-by-Step for Compiler & Coding Environment

**Target:** Make Judge0 integration fully functional, reliable, and production-ready  
**Your Role:** Core compiler/judge service  
**Deadline:** Optimize within 4 weeks

---

## 📋 TABLE OF CONTENTS

1. [Current State Analysis](#current-state)
2. [Judge0 Setup & Configuration](#judge0-setup)
3. [Core Service Implementation](#core-service)
4. [Test Case Engine](#test-cases)
5. [Error Handling & Verdict Mapping](#error-handling)
6. [Performance Optimization](#optimization)
7. [Integration Points](#integration)
8. [Testing Strategy](#testing)
9. [Deployment Checklist](#deployment)
10. [Troubleshooting Guide](#troubleshooting)

---

## <a id="current-state"></a>1. CURRENT STATE ANALYSIS

### What You Have in `main`

**Judge0Service Class Structure:**
```python
class Judge0Service:
    # 60+ language mappings
    LANGUAGE_MAP = {
        "python3": 71,
        "java": 62,
        "cpp": 54,
        # ... 57 more
    }
    
    # 4 Core Methods:
    ✅ submit_code()           # Submit to Judge0
    ✅ get_result()            # Fetch result by token
    ✅ poll_until_complete()   # Wait for completion
    ✅ execute_with_test_cases() # Batch execution
```

### Current Limitations

```
❌ Issue 1: Slow Startup
   Problem: Judge0 takes 2-3 minutes to initialize
   Impact: Container health checks fail
   Status: Partially fixed with start_period: 150s
   TODO: Better monitoring

❌ Issue 2: Polling Mechanism
   Problem: Fixed 60 polls with exponential backoff
   Impact: May timeout on slow systems
   Status: Works but not optimal
   TODO: Adaptive polling

❌ Issue 3: Error Mapping
   Problem: All non-Accepted verdicts treated equally
   Impact: Can't distinguish TLE from Wrong Answer
   Status: Needs granular mapping
   TODO: Add status_id → verdict enum

❌ Issue 4: Output Comparison
   Problem: Exact string match only
   Impact: Fails with whitespace/formatting differences
   Status: Basic works but edge cases fail
   TODO: Add normalization + fuzzy matching

❌ Issue 5: WebSocket Integration
   Problem: No real-time status updates to frontend
   Impact: User sees "Waiting..." for long periods
   Status: Not implemented
   TODO: Add streaming status updates

❌ Issue 6: Database Logging
   Problem: No permanent submission records
   Impact: Can't track history or statistics
   Status: Results only in memory
   TODO: Persist to PostgreSQL
```

---

## <a id="judge0-setup"></a>2. JUDGE0 SETUP & CONFIGURATION

### Docker Compose Configuration (CORRECT VERSION)

```yaml
# docker-compose.yml
version: '3.9'

services:
  judge0:
    image: judge0/judge0:1.13.0
    container_name: judge0_server
    ports:
      - "2358:2358"
    environment:
      # Database for Judge0 internal state
      DATABASE_URL: postgresql://judge0_user:judge0_password@postgres:5432/judge0
      REDIS_URL: redis://redis:6379/1
      
      # API Configuration
      API_BASE_URL: http://localhost:2358
      ENABLE_LOGGING: "true"
      LOG_LEVEL: info
      
      # Authentication
      AUTH_TOKEN: your_secret_token_here
      
      # Resources
      MEMORY_LIMIT: 262144  # 256 MB per submission
      CPU_TIME_LIMIT: 10    # 10 seconds per submission
      
      # Request Configuration
      MAX_QUEUE_SIZE: 500
      MAX_SUBMISSION_SIZE: 4096
      
    volumes:
      # Persistent storage for test files
      - judge0_data:/tmp/judge0
      
    networks:
      - coduku_network
    
    # ⚠️ CRITICAL: Long startup period
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:2358/"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 150s  # Wait 2.5 minutes for Judge0 to boot
    
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy

  postgres:
    image: postgres:15-alpine
    container_name: postgres_db
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: coduku_db
      
      # Also create judge0 database
      POSTGRES_INITDB_ARGS: "-c databases=judge0"
    
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init_db.sql:/docker-entrypoint-initdb.d/init.sql
    
    networks:
      - coduku_network
    
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: redis_cache
    ports:
      - "6379:6379"
    
    volumes:
      - redis_data:/data
    
    networks:
      - coduku_network
    
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
  redis_data:
  judge0_data:

networks:
  coduku_network:
    driver: bridge
```

### Setup Script (Initialization)

```bash
#!/bin/bash
# setup_judge0.sh

echo "🚀 Starting CODUKU Judge0 Setup..."

# 1. Create directories
mkdir -p ./data/postgres
mkdir -p ./data/redis
mkdir -p ./data/judge0

# 2. Set permissions
chmod 755 ./data/*

# 3. Create initial database
cat > init_db.sql << 'EOF'
-- Create judge0 database and user
CREATE DATABASE IF NOT EXISTS judge0;
CREATE USER IF NOT EXISTS judge0_user WITH PASSWORD 'judge0_password';
ALTER ROLE judge0_user SET client_encoding TO 'utf8';
ALTER ROLE judge0_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE judge0_user SET default_transaction_deferrable TO on;
ALTER ROLE judge0_user SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE judge0 TO judge0_user;

-- Create CODUKU database
CREATE DATABASE IF NOT EXISTS coduku_db;
CREATE USER IF NOT EXISTS coduku_user WITH PASSWORD 'coduku_password';
GRANT ALL PRIVILEGES ON DATABASE coduku_db TO coduku_user;
EOF

# 4. Start services
echo "🐳 Starting Docker Compose..."
docker-compose down -v  # Clean slate
docker-compose up -d --build

# 5. Wait for services
echo "⏳ Waiting for services to be healthy..."
sleep 30

# 6. Verify Judge0
echo "🔍 Checking Judge0 health..."
curl -s http://localhost:2358/ | jq . || echo "Judge0 not responding yet..."

# 7. Create tables
echo "📊 Creating database tables..."
python3 -c "
import psycopg2
from psycopg2.extras import execute_values

conn = psycopg2.connect(
    host='localhost',
    database='coduku_db',
    user='coduku_user',
    password='coduku_password'
)
cur = conn.cursor()

# Your table creation SQL here (see below)

conn.commit()
cur.close()
conn.close()
print('✅ Tables created successfully')
"

echo "✨ Setup complete!"
```

---

## <a id="core-service"></a>3. CORE SERVICE IMPLEMENTATION

### Enhanced Judge0Service (Updated Version)

```python
# backend/services/judge_service/app/services/judge0_service.py

import asyncio
import logging
import json
from typing import Dict, List, Optional, Tuple
from enum import Enum
import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# VERDICT ENUMERATIONS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class VerdictStatus(str, Enum):
    """Verdict statuses from Judge0"""
    IN_QUEUE = "In Queue"              # ID: 1
    PROCESSING = "Processing"          # ID: 2
    ACCEPTED = "Accepted"              # ID: 3
    WRONG_ANSWER = "Wrong Answer"      # ID: 4
    TIME_LIMIT_EXCEEDED = "Time Limit Exceeded"  # ID: 5
    MEMORY_LIMIT_EXCEEDED = "Memory Limit Exceeded"  # ID: 6
    RUNTIME_ERROR = "Runtime Error"    # ID: 11
    COMPILATION_ERROR = "Compilation Error"  # ID: 12
    UNKNOWN = "Unknown"                # ID: others


class VerdictSeverity(str, Enum):
    """Severity levels for verdicts"""
    ACCEPTED = "accepted"
    WRONG_ANSWER = "wrong_answer"
    TIMEOUT = "timeout"
    MEMORY = "memory_limit"
    COMPILATION = "compilation_error"
    RUNTIME = "runtime_error"
    UNKNOWN = "unknown"


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# VERDICT MAPPER
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class VerdictMapper:
    """Maps Judge0 status codes to verdicts with proper categorization"""
    
    # Judge0 status ID → (VerdictStatus, VerdictSeverity, Recoverable)
    STATUS_MAP = {
        1: (VerdictStatus.IN_QUEUE, VerdictSeverity.UNKNOWN, True),
        2: (VerdictStatus.PROCESSING, VerdictSeverity.UNKNOWN, True),
        3: (VerdictStatus.ACCEPTED, VerdictSeverity.ACCEPTED, False),
        4: (VerdictStatus.WRONG_ANSWER, VerdictSeverity.WRONG_ANSWER, False),
        5: (VerdictStatus.TIME_LIMIT_EXCEEDED, VerdictSeverity.TIMEOUT, False),
        6: (VerdictStatus.MEMORY_LIMIT_EXCEEDED, VerdictSeverity.MEMORY, False),
        11: (VerdictStatus.RUNTIME_ERROR, VerdictSeverity.RUNTIME, False),
        12: (VerdictStatus.COMPILATION_ERROR, VerdictSeverity.COMPILATION, False),
    }
    
    @classmethod
    def map_status(cls, status_id: int) -> Tuple[str, str, bool]:
        """
        Map Judge0 status ID to (verdict, severity, recoverable)
        
        Returns:
            (verdict_name, severity, is_recoverable)
        """
        if status_id in cls.STATUS_MAP:
            verdict, severity, recoverable = cls.STATUS_MAP[status_id]
            return verdict.value, severity.value, recoverable
        
        logger.warning(f"⚠️ Unknown status ID: {status_id}")
        return VerdictStatus.UNKNOWN.value, VerdictSeverity.UNKNOWN.value, False
    
    @classmethod
    def is_accepted(cls, status_id: int) -> bool:
        """Check if verdict is accepted"""
        return status_id == 3
    
    @classmethod
    def is_compilation_error(cls, status_id: int) -> bool:
        """Check if verdict is compilation error"""
        return status_id == 12
    
    @classmethod
    def is_timeout(cls, status_id: int) -> bool:
        """Check if verdict is time limit exceeded"""
        return status_id == 5
    
    @classmethod
    def is_memory_limit(cls, status_id: int) -> bool:
        """Check if verdict is memory limit exceeded"""
        return status_id == 6


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# OUTPUT NORMALIZATION
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class OutputNormalizer:
    """Normalize outputs for comparison"""
    
    @staticmethod
    def normalize(output: str, strip_whitespace: bool = True) -> str:
        """
        Normalize output for comparison
        
        Args:
            output: Raw output string
            strip_whitespace: Strip leading/trailing whitespace
        
        Returns:
            Normalized output
        """
        if not output:
            return ""
        
        # Handle CRLF vs LF
        output = output.replace('\r\n', '\n')
        
        if strip_whitespace:
            # Strip leading/trailing from each line and globally
            lines = [line.rstrip() for line in output.split('\n')]
            output = '\n'.join(lines).strip()
        
        return output
    
    @staticmethod
    def compare(actual: str, expected: str, fuzzy: bool = False, tolerance: float = 0.0001) -> bool:
        """
        Compare actual output with expected
        
        Args:
            actual: Actual output
            expected: Expected output
            fuzzy: Allow floating point comparison
            tolerance: Tolerance for float comparison
        
        Returns:
            True if outputs match
        """
        actual_norm = OutputNormalizer.normalize(actual)
        expected_norm = OutputNormalizer.normalize(expected)
        
        if actual_norm == expected_norm:
            return True
        
        # Try fuzzy float comparison
        if fuzzy:
            try:
                actual_float = float(actual_norm)
                expected_float = float(expected_norm)
                return abs(actual_float - expected_float) <= tolerance
            except (ValueError, TypeError):
                pass
        
        return False


# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# JUDGE0 SERVICE
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

class Judge0Service:
    """Enhanced Judge0 API wrapper for the judge microservice"""

    # Language ID mappings (Judge0)
    LANGUAGE_MAP = {
        "python": 71,
        "python3": 71,
        "python2": 70,
        "java": 62,
        "javascript": 63,
        "js": 63,
        "nodejs": 63,
        "cpp": 54,
        "cpp11": 54,
        "cpp14": 54,
        "cpp17": 54,
        "c++": 54,
        "c": 50,
        "csharp": 51,
        "cs": 51,
        "go": 60,
        "rust": 73,
        "php": 68,
        "ruby": 72,
        "swift": 75,
        "kotlin": 78,
        "clojure": 86,
        "elixir": 57,
        "erlang": 58,
        "haskell": 61,
        "ocaml": 83,
        "r": 80,
        "scala": 81,
        "typescript": 74,
    }

    def __init__(self):
        self.api_url = settings.JUDGE0_API_URL or "http://judge0:2358"
        self.timeout = settings.JUDGE0_TIMEOUT or 60
        self.max_polls = 60  # Max 60 polls = 5 minutes with backoff
        self.verdict_mapper = VerdictMapper()
        self.output_normalizer = OutputNormalizer()

    async def _make_request(
        self,
        method: str,
        endpoint: str,
        json: Optional[Dict] = None,
        timeout: Optional[int] = None
    ) -> httpx.Response:
        """Make HTTP request to Judge0 API"""
        url = f"{self.api_url}{endpoint}"
        timeout = timeout or self.timeout
        
        async with httpx.AsyncClient(timeout=timeout) as client:
            if method == "POST":
                return await client.post(url, json=json)
            elif method == "GET":
                return await client.get(url)
        
    async def submit_code(
        self,
        language: str,
        source_code: str,
        stdin: str = "",
        expected_output: str = "",
    ) -> str:
        """
        Submit code to Judge0 for compilation and execution
        
        Args:
            language: Programming language (python, java, cpp, etc.)
            source_code: Source code to execute
            stdin: Standard input for the program
            expected_output: Expected output for comparison
        
        Returns:
            Judge0 submission token
        
        Raises:
            ValueError: If language is not supported
            RuntimeError: If Judge0 API fails
        """
        lang = language.lower().strip()
        
        if lang not in self.LANGUAGE_MAP:
            raise ValueError(f"❌ Unsupported language: {language}. Supported: {list(self.LANGUAGE_MAP.keys())}")
        
        language_id = self.LANGUAGE_MAP[lang]
        
        payload = {
            "language_id": language_id,
            "source_code": source_code,
            "stdin": stdin,
            "expected_output": expected_output,
            "time_limit": 5,
            "memory_limit": 262144,  # 256 MB
        }
        
        try:
            logger.info(f"📤 Submitting {lang} code to Judge0...")
            resp = await self._make_request(
                "POST",
                "/submissions?base64_encoded=false&wait=false",
                json=payload,
                timeout=10
            )
            
            if resp.status_code not in (200, 201):
                logger.error(f"❌ Judge0 submit failed: {resp.status_code} - {resp.text}")
                raise RuntimeError(f"Judge0 submit failed: {resp.status_code}")
            
            token = resp.json()["token"]
            logger.debug(f"✅ Submission token: {token}")
            return token
            
        except httpx.TimeoutException:
            logger.error("❌ Judge0 submit timeout")
            raise RuntimeError("Judge0 submit timeout - server may be overloaded")
        except Exception as e:
            logger.error(f"❌ Judge0 submit error: {str(e)}")
            raise

    async def get_result(self, token: str) -> Dict:
        """
        Fetch submission result by token
        
        Args:
            token: Judge0 submission token
        
        Returns:
            Result dictionary with status, stdout, stderr, etc.
        
        Raises:
            RuntimeError: If Judge0 API fails
        """
        try:
            logger.debug(f"📥 Fetching result for token: {token}")
            resp = await self._make_request(
                "GET",
                f"/submissions/{token}?base64_encoded=false"
            )
            
            if resp.status_code != 200:
                logger.error(f"❌ Judge0 get_result failed: {resp.status_code}")
                raise RuntimeError(f"Judge0 get_result failed: {resp.status_code}")
            
            result = resp.json()
            return result
            
        except Exception as e:
            logger.error(f"❌ Judge0 get_result error: {str(e)}")
            raise

    async def poll_until_complete(
        self,
        token: str,
        max_polls: int = None,
        initial_delay: float = 0.5,
        max_delay: float = 2.0
    ) -> Dict:
        """
        Poll Judge0 until submission is complete
        
        Uses adaptive exponential backoff:
        - Poll 1: wait 0.5s
        - Poll 2: wait 1.0s
        - Poll 3: wait 1.5s
        - Poll 4+: wait 2.0s (capped)
        
        Args:
            token: Judge0 submission token
            max_polls: Maximum number of polls (default 60)
            initial_delay: Initial delay between polls
            max_delay: Maximum delay between polls
        
        Returns:
            Final submission result
        
        Raises:
            TimeoutError: If polling exceeds max attempts
        """
        max_polls = max_polls or self.max_polls
        
        for attempt in range(max_polls):
            try:
                result = await self.get_result(token)
                status_id = result.get("status", {}).get("id")
                
                # Status 1 = In Queue, 2 = Processing
                if status_id not in (1, 2):
                    logger.debug(f"✅ Execution complete: {result['status']['description']}")
                    return result
                
                # Calculate adaptive delay
                delay = min(initial_delay * (attempt + 1), max_delay)
                logger.debug(f"⏳ Poll {attempt + 1}/{max_polls}, waiting {delay:.1f}s...")
                await asyncio.sleep(delay)
                
            except Exception as e:
                logger.error(f"❌ Poll attempt {attempt + 1} failed: {str(e)}")
                await asyncio.sleep(1)  # Brief wait before retry
        
        logger.error(f"❌ Polling timeout after {max_polls} attempts")
        raise TimeoutError(f"Judge0 execution timeout after {max_polls} polls")

    async def execute_with_test_cases(
        self,
        language: str,
        source_code: str,
        test_cases: List[Dict],
        timeout: int = None
    ) -> Dict:
        """
        Execute code against multiple test cases
        
        Args:
            language: Programming language
            source_code: Source code
            test_cases: List of dicts with 'input' and 'output' keys
            timeout: Custom timeout per test case
        
        Returns:
            Result dictionary:
            {
                "passed": int,          # Number of passed test cases
                "total": int,           # Total test cases
                "verdict": str,         # Overall verdict (Accepted, Wrong Answer, etc.)
                "severity": str,        # Severity classification
                "execution_time": float,  # Total execution time
                "details": [            # Per-test-case details
                    {
                        "test_case": 1,
                        "verdict": "Accepted",
                        "output": "...",
                        "error": null,
                        "execution_time": 0.123
                    },
                    ...
                ]
            }
        """
        if not test_cases:
            logger.warning("⚠️ No test cases provided")
            return {
                "passed": 0,
                "total": 0,
                "verdict": "No test cases",
                "severity": "unknown",
                "execution_time": 0,
                "details": []
            }
        
        import time
        start_time = time.time()
        
        results = {
            "passed": 0,
            "total": len(test_cases),
            "verdict": "Accepted",  # Optimistic default
            "severity": "accepted",
            "execution_time": 0,
            "details": [],
            "language": language
        }
        
        logger.info(f"🚀 Executing {len(test_cases)} test cases for {language}...")
        
        for idx, test_case in enumerate(test_cases):
            tc_start = time.time()
            tc_idx = idx + 1
            
            try:
                # Extract test case inputs
                stdin = test_case.get("input", test_case.get("stdin", ""))
                expected = test_case.get("output", test_case.get("expected_output", ""))
                
                logger.debug(f"📋 Test case {tc_idx}/{len(test_cases)}")
                
                # Submit
                token = await self.submit_code(
                    language=language,
                    source_code=source_code,
                    stdin=stdin,
                    expected_output=expected
                )
                
                # Poll until complete
                result = await self.poll_until_complete(token)
                
                # Extract result details
                status_id = result.get("status", {}).get("id")
                status_desc = result.get("status", {}).get("description", "Unknown")
                stdout = (result.get("stdout") or "").strip()
                stderr = (result.get("stderr") or "").strip()
                compile_output = result.get("compile_output") or ""
                tc_time = time.time() - tc_start
                
                # Verdict mapping
                verdict, severity, _ = self.verdict_mapper.map_status(status_id)
                
                # Check if accepted
                if self.verdict_mapper.is_accepted(status_id):
                    results["passed"] += 1
                    detail = {
                        "test_case": tc_idx,
                        "verdict": verdict,
                        "output": stdout,
                        "error": None,
                        "execution_time": tc_time,
                        "severity": severity
                    }
                    logger.info(f"✅ Test {tc_idx}: {verdict}")
                else:
                    # Failure - update overall verdict
                    if results["verdict"] == "Accepted":  # Only override if currently accepted
                        results["verdict"] = verdict
                        results["severity"] = severity
                    
                    # Compilation error details
                    if self.verdict_mapper.is_compilation_error(status_id):
                        error_msg = compile_output or stderr or "Unknown compilation error"
                    else:
                        error_msg = stderr or stdout or "No output"
                    
                    detail = {
                        "test_case": tc_idx,
                        "verdict": verdict,
                        "output": stdout,
                        "error": error_msg,
                        "execution_time": tc_time,
                        "severity": severity,
                        "stderr": stderr,
                        "compile_output": compile_output
                    }
                    logger.warning(f"❌ Test {tc_idx}: {verdict}")
                
                results["details"].append(detail)
                
            except Exception as e:
                logger.error(f"❌ Test case {tc_idx} error: {str(e)}")
                results["verdict"] = "Runtime Error"
                results["severity"] = "runtime_error"
                results["details"].append({
                    "test_case": tc_idx,
                    "verdict": "Runtime Error",
                    "output": "",
                    "error": str(e),
                    "execution_time": time.time() - tc_start,
                    "severity": "runtime_error"
                })
        
        results["execution_time"] = time.time() - start_time
        
        logger.info(
            f"✨ Execution complete: {results['passed']}/{results['total']} passed, "
            f"Verdict: {results['verdict']}, Time: {results['execution_time']:.2f}s"
        )
        
        return results


# Create singleton instance
judge0_service = Judge0Service()
```

---

## <a id="test-cases"></a>4. TEST CASE ENGINE

### Test Case Manager

```python
# backend/services/judge_service/app/services/test_case_manager.py

from typing import List, Dict, Optional
from datetime import datetime
from app.services.postgres_service import PostgreSQLService

class TestCaseManager:
    """Manage test cases and execution results"""
    
    @staticmethod
    async def get_test_cases(
        problem_id: int,
        include_hidden: bool = False
    ) -> List[Dict]:
        """
        Fetch test cases for a problem
        
        Args:
            problem_id: Problem ID
            include_hidden: Include hidden test cases (admin only)
        
        Returns:
            List of test cases with input/output
        """
        pool = await PostgreSQLService.get_pool()
        
        query = """
            SELECT id, problem_id, input, expected_output, is_hidden
            FROM test_cases
            WHERE problem_id = %s
        """
        
        if not include_hidden:
            query += " AND is_hidden = FALSE"
        
        query += " ORDER BY id ASC"
        
        async with pool.acquire() as conn:
            rows = await conn.fetch(query, problem_id)
            return [dict(row) for row in rows]
    
    @staticmethod
    async def save_submission_result(
        submission_id: int,
        test_case_id: int,
        verdict: str,
        output: str,
        error: Optional[str] = None,
        execution_time: float = 0.0
    ) -> int:
        """Save individual test case result"""
        pool = await PostgreSQLService.get_pool()
        
        query = """
            INSERT INTO submission_results
            (submission_id, test_case_id, verdict, actual_output, error_message, execution_time)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id
        """
        
        async with pool.acquire() as conn:
            result_id = await conn.fetchval(
                query,
                submission_id,
                test_case_id,
                verdict,
                output,
                error,
                execution_time
            )
            return result_id
    
    @staticmethod
    async def save_submission(
        user_id: int,
        problem_id: int,
        language: str,
        source_code: str,
        verdict: str,
        score: float,
        execution_time: float
    ) -> int:
        """Save submission to database"""
        pool = await PostgreSQLService.get_pool()
        
        query = """
            INSERT INTO submissions
            (user_id, problem_id, language, source_code, verdict, score, execution_time, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, NOW())
            RETURNING id
        """
        
        async with pool.acquire() as conn:
            submission_id = await conn.fetchval(
                query,
                user_id,
                problem_id,
                language,
                source_code,
                verdict,
                score,
                execution_time
            )
            return submission_id
```

---

## <a id="error-handling"></a>5. ERROR HANDLING & VERDICT MAPPING

### Error Handler with Recovery

```python
# backend/services/judge_service/app/services/error_handler.py

import logging
from enum import Enum
from typing import Dict, Optional

logger = logging.getLogger(__name__)


class ErrorCategory(str, Enum):
    """Error categories for handling and recovery"""
    JUDGE0_OFFLINE = "judge0_offline"
    TIMEOUT = "timeout"
    MEMORY_ERROR = "memory_error"
    COMPILATION_ERROR = "compilation_error"
    RUNTIME_ERROR = "runtime_error"
    WRONG_ANSWER = "wrong_answer"
    UNKNOWN = "unknown"


class ErrorHandler:
    """Centralized error handling and recovery logic"""
    
    @staticmethod
    def categorize_error(
        error_message: str,
        status_id: Optional[int] = None
    ) -> Dict:
        """
        Categorize an error and determine recovery strategy
        
        Returns:
            {
                "category": ErrorCategory,
                "user_message": str,  # Message for frontend
                "recoverable": bool,  # Can user retry?
                "should_retry": bool, # Should we retry internally?
                "details": str
            }
        """
        error_lower = error_message.lower()
        
        # Judge0 offline
        if any(term in error_lower for term in ["connection refused", "unreachable", "offline"]):
            return {
                "category": ErrorCategory.JUDGE0_OFFLINE,
                "user_message": "Compiler service temporarily unavailable. Please try again in a moment.",
                "recoverable": True,
                "should_retry": True,
                "details": error_message
            }
        
        # Timeout
        if "timeout" in error_lower or "timed out" in error_lower:
            return {
                "category": ErrorCategory.TIMEOUT,
                "user_message": "Execution took too long. Your code might have an infinite loop.",
                "recoverable": True,
                "should_retry": False,
                "details": error_message
            }
        
        # Memory error
        if "memory" in error_lower or "oom" in error_lower:
            return {
                "category": ErrorCategory.MEMORY_ERROR,
                "user_message": "Your code used too much memory.",
                "recoverable": True,
                "should_retry": False,
                "details": error_message
            }
        
        # Compilation error
        if "compilation" in error_lower or "syntax" in error_lower:
            return {
                "category": ErrorCategory.COMPILATION_ERROR,
                "user_message": "Your code has syntax errors. Check the compiler output.",
                "recoverable": True,
                "should_retry": False,
                "details": error_message
            }
        
        # Runtime error
        if any(term in error_lower for term in ["runtime", "segmentation", "access violation", "undefined"]):
            return {
                "category": ErrorCategory.RUNTIME_ERROR,
                "user_message": "Runtime error in your code. Check for null pointers or invalid operations.",
                "recoverable": True,
                "should_retry": False,
                "details": error_message
            }
        
        # Unknown
        return {
            "category": ErrorCategory.UNKNOWN,
            "user_message": "An unexpected error occurred. Please try again.",
            "recoverable": True,
            "should_retry": True,
            "details": error_message
        }
    
    @staticmethod
    async def handle_with_retry(
        func,
        max_retries: int = 3,
        initial_delay: float = 1.0
    ):
        """
        Retry a function with exponential backoff
        
        Example:
            result = await ErrorHandler.handle_with_retry(
                lambda: judge0_service.submit_code(...)
            )
        """
        import asyncio
        
        for attempt in range(max_retries):
            try:
                return await func()
            except Exception as e:
                if attempt == max_retries - 1:
                    raise
                
                delay = initial_delay * (2 ** attempt)
                logger.warning(f"⚠️ Attempt {attempt + 1} failed: {str(e)}. Retrying in {delay}s...")
                await asyncio.sleep(delay)
```

---

## <a id="optimization"></a>6. PERFORMANCE OPTIMIZATION

### Caching & Rate Limiting

```python
# backend/services/judge_service/app/services/cache_manager.py

from redis import Redis
import json
from typing import Optional, Dict

class CacheManager:
    """Manage caching for judge results"""
    
    def __init__(self, redis_url: str = "redis://localhost:6379/2"):
        self.redis = Redis.from_url(redis_url, decode_responses=True)
        self.ttl = 86400  # 24 hours
    
    def cache_submission(self, submission_id: int, result: Dict) -> bool:
        """Cache submission result"""
        key = f"submission:{submission_id}"
        try:
            self.redis.setex(key, self.ttl, json.dumps(result))
            return True
        except Exception as e:
            logger.warning(f"Cache write failed: {e}")
            return False
    
    def get_cached_submission(self, submission_id: int) -> Optional[Dict]:
        """Get cached submission result"""
        key = f"submission:{submission_id}"
        try:
            data = self.redis.get(key)
            return json.loads(data) if data else None
        except Exception as e:
            logger.warning(f"Cache read failed: {e}")
            return None
    
    def increment_submission_count(self, user_id: int) -> int:
        """Track submissions per user (for rate limiting)"""
        key = f"submissions:user:{user_id}:hour"
        return self.redis.incr(key)
    
    def set_rate_limit(self, user_id: int, limit: int = 100) -> bool:
        """Set rate limit (100 submissions per hour)"""
        key = f"submissions:user:{user_id}:hour"
        self.redis.expire(key, 3600)
        current = int(self.redis.get(key) or 0)
        return current < limit


cache_manager = CacheManager()
```

---

## <a id="integration"></a>7. INTEGRATION POINTS

### Judge Service Main Endpoint

```python
# backend/services/judge_service/app/main.py

from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel
import logging

from app.services.judge0_service import judge0_service
from app.services.test_case_manager import TestCaseManager
from app.services.error_handler import ErrorHandler

logger = logging.getLogger(__name__)
app = FastAPI(title="Judge Service")


class SubmissionRequest(BaseModel):
    """Frontend submission request"""
    problem_id: int
    language: str
    source_code: str


class SubmissionResponse(BaseModel):
    """Response to frontend"""
    submission_id: int
    verdict: str
    score: float
    passed: int
    total: int
    execution_time: float
    details: list


@app.post("/api/judge/submit", response_model=SubmissionResponse)
async def submit_solution(
    req: SubmissionRequest,
    background_tasks: BackgroundTasks,
    user_id: int = Depends(get_current_user)
):
    """
    Submit solution for judging
    
    Flow:
    1. Fetch test cases
    2. Execute with Judge0
    3. Save results to PostgreSQL
    4. Update leaderboard in background
    5. Return verdict to frontend
    """
    try:
        # 1. Get test cases (sample + hidden)
        test_cases = await TestCaseManager.get_test_cases(
            req.problem_id,
            include_hidden=True
        )
        
        if not test_cases:
            raise HTTPException(
                status_code=404,
                detail="No test cases found for this problem"
            )
        
        # 2. Execute code against test cases
        execution_result = await judge0_service.execute_with_test_cases(
            language=req.language,
            source_code=req.source_code,
            test_cases=test_cases
        )
        
        # 3. Save submission to database
        submission_id = await TestCaseManager.save_submission(
            user_id=user_id,
            problem_id=req.problem_id,
            language=req.language,
            source_code=req.source_code,
            verdict=execution_result["verdict"],
            score=calculate_score(execution_result),
            execution_time=execution_result["execution_time"]
        )
        
        # 4. Save detailed results
        for idx, detail in enumerate(execution_result["details"]):
            await TestCaseManager.save_submission_result(
                submission_id=submission_id,
                test_case_id=test_cases[idx]["id"],
                verdict=detail["verdict"],
                output=detail["output"],
                error=detail.get("error"),
                execution_time=detail.get("execution_time", 0)
            )
        
        # 5. Update leaderboard in background
        background_tasks.add_task(
            update_leaderboard,
            user_id,
            execution_result["verdict"] == "Accepted"
        )
        
        return SubmissionResponse(
            submission_id=submission_id,
            verdict=execution_result["verdict"],
            score=calculate_score(execution_result),
            passed=execution_result["passed"],
            total=execution_result["total"],
            execution_time=execution_result["execution_time"],
            details=execution_result["details"]
        )
        
    except ValueError as e:
        logger.error(f"Validation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Submission error: {e}")
        
        # Categorize and handle error
        error_info = ErrorHandler.categorize_error(str(e))
        raise HTTPException(
            status_code=500,
            detail=error_info["user_message"]
        )


async def update_leaderboard(user_id: int, accepted: bool):
    """Update leaderboard after successful submission"""
    try:
        # Call leaderboard service
        from app.services.leaderboard_client import leaderboard_client
        await leaderboard_client.update_score(user_id, accepted)
    except Exception as e:
        logger.error(f"Leaderboard update failed: {e}")


def calculate_score(execution_result: dict) -> float:
    """Calculate score based on verdict"""
    if execution_result["verdict"] == "Accepted":
        # Score = (passed / total) * 100 * difficulty_multiplier
        accuracy = execution_result["passed"] / execution_result["total"]
        return round(accuracy * 100, 2)
    return 0.0
```

---

## <a id="testing"></a>8. TESTING STRATEGY

### Comprehensive Test Suite

```python
# tests/test_judge0_service.py

import pytest
import asyncio
from app.services.judge0_service import Judge0Service, VerdictMapper, OutputNormalizer


class TestVerdictMapper:
    """Test verdict mapping"""
    
    def test_accepted_status(self):
        verdict, severity, recoverable = VerdictMapper.map_status(3)
        assert verdict == "Accepted"
        assert severity == "accepted"
        assert recoverable == False
    
    def test_wrong_answer_status(self):
        verdict, severity, recoverable = VerdictMapper.map_status(4)
        assert verdict == "Wrong Answer"
        assert severity == "wrong_answer"
        assert recoverable == False
    
    def test_timeout_status(self):
        verdict, severity, recoverable = VerdictMapper.map_status(5)
        assert verdict == "Time Limit Exceeded"
        assert severity == "timeout"
        assert recoverable == False
    
    def test_compilation_error_status(self):
        verdict, severity, recoverable = VerdictMapper.map_status(12)
        assert verdict == "Compilation Error"
        assert severity == "compilation_error"
        assert recoverable == False


class TestOutputNormalizer:
    """Test output normalization"""
    
    def test_whitespace_normalization(self):
        output = "  hello world  \n"
        normalized = OutputNormalizer.normalize(output)
        assert normalized == "hello world"
    
    def test_crlf_handling(self):
        output = "hello\r\nworld"
        normalized = OutputNormalizer.normalize(output)
        assert normalized == "hello\nworld"
    
    def test_exact_match(self):
        assert OutputNormalizer.compare("hello", "hello") == True
        assert OutputNormalizer.compare("hello", "world") == False
    
    def test_float_comparison(self):
        assert OutputNormalizer.compare("3.14", "3.14001", fuzzy=True) == True
        assert OutputNormalizer.compare("3.0", "3.5", fuzzy=True) == False


class TestJudge0Service:
    """Test Judge0 service (requires running Judge0)"""
    
    @pytest.fixture
    def service(self):
        return Judge0Service()
    
    @pytest.mark.asyncio
    async def test_language_support(self, service):
        """Test if language mappings are valid"""
        for lang in ["python", "java", "cpp", "c", "javascript"]:
            assert lang in service.LANGUAGE_MAP
            assert isinstance(service.LANGUAGE_MAP[lang], int)
    
    @pytest.mark.asyncio
    async def test_simple_python_execution(self, service):
        """Test simple Python code execution"""
        code = """
def solution(n):
    return n * 2
"""
        test_cases = [
            {"input": "5", "output": "10"}
        ]
        
        result = await service.execute_with_test_cases(
            language="python",
            source_code=code,
            test_cases=test_cases
        )
        
        assert result["passed"] == 1
        assert result["total"] == 1
        assert result["verdict"] == "Accepted"
    
    @pytest.mark.asyncio
    async def test_wrong_answer_detection(self, service):
        """Test detection of wrong answer"""
        code = """
def solution(n):
    return n * 3  # Wrong: should return n * 2
"""
        test_cases = [
            {"input": "5", "output": "10"}
        ]
        
        result = await service.execute_with_test_cases(
            language="python",
            source_code=code,
            test_cases=test_cases
        )
        
        assert result["passed"] == 0
        assert result["verdict"] == "Wrong Answer"
    
    @pytest.mark.asyncio
    async def test_syntax_error_detection(self, service):
        """Test detection of syntax errors"""
        code = "def broken( # syntax error"
        test_cases = [
            {"input": "5", "output": "10"}
        ]
        
        result = await service.execute_with_test_cases(
            language="python",
            source_code=code,
            test_cases=test_cases
        )
        
        assert result["verdict"] == "Compilation Error"
        assert result["passed"] == 0
```

### Load Testing

```python
# tests/load_test.py

import asyncio
import time
from app.services.judge0_service import judge0_service


async def load_test_concurrent_submissions(num_submissions: int = 50):
    """
    Test Judge0 with concurrent submissions
    
    Simulates multiple users submitting code simultaneously
    """
    code = """
def solution(n):
    return n * 2
"""
    
    test_cases = [
        {"input": str(i), "output": str(i * 2)}
        for i in range(1, 6)
    ]
    
    async def submit_and_judge():
        return await judge0_service.execute_with_test_cases(
            language="python",
            source_code=code,
            test_cases=test_cases
        )
    
    print(f"🚀 Starting load test: {num_submissions} concurrent submissions...")
    
    start = time.time()
    tasks = [submit_and_judge() for _ in range(num_submissions)]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    elapsed = time.time() - start
    
    successful = sum(1 for r in results if not isinstance(r, Exception))
    failed = len(results) - successful
    
    print(f"""
    ✨ Load Test Results:
    - Total submissions: {num_submissions}
    - Successful: {successful}
    - Failed: {failed}
    - Total time: {elapsed:.2f}s
    - Average time per submission: {elapsed / num_submissions:.2f}s
    - Throughput: {num_submissions / elapsed:.1f} submissions/second
    """)
    
    return {
        "total": num_submissions,
        "successful": successful,
        "failed": failed,
        "total_time": elapsed,
        "avg_time": elapsed / num_submissions,
        "throughput": num_submissions / elapsed
    }


if __name__ == "__main__":
    # Run load test
    asyncio.run(load_test_concurrent_submissions(50))
```

---

## <a id="deployment"></a>9. DEPLOYMENT CHECKLIST

### Pre-Deployment Checklist

```markdown
## 🚀 Judge Service Deployment Checklist

### Code Quality
- [ ] All functions have docstrings
- [ ] Type hints on all functions
- [ ] Error handling for all external calls
- [ ] Logging at appropriate levels (INFO, WARNING, ERROR)
- [ ] No hardcoded secrets in code
- [ ] All environment variables documented

### Testing
- [ ] Unit tests pass (90%+ coverage)
- [ ] Integration tests pass
- [ ] Load test with 50+ concurrent submissions
- [ ] Test with all supported languages (Python, Java, C++, etc.)
- [ ] Test error scenarios (syntax error, timeout, memory limit)
- [ ] Test database persistence

### Security
- [ ] Judge0 isolation verified (no host access)
- [ ] Rate limiting configured
- [ ] Input validation on all endpoints
- [ ] SQL injection prevention (parameterized queries)
- [ ] Authentication/Authorization on all endpoints
- [ ] CORS properly configured

### Performance
- [ ] Judge0 startup time optimized (< 3 minutes)
- [ ] Polling algorithm tested (< 5 seconds average)
- [ ] Concurrent execution tested (50+ submissions)
- [ ] Database indexes created
- [ ] Redis caching enabled
- [ ] Memory usage within limits

### Operations
- [ ] Docker images built and tested
- [ ] docker-compose.yml configured correctly
- [ ] All services have healthchecks
- [ ] Logging configured (ELK or CloudWatch)
- [ ] Monitoring/Alerting setup
- [ ] Backup strategy documented

### Documentation
- [ ] API documentation (OpenAPI/Swagger)
- [ ] Deployment guide
- [ ] Troubleshooting guide
- [ ] Team handoff documentation
- [ ] Emergency procedures

### Staging
- [ ] Deploy to staging environment
- [ ] Run full integration tests
- [ ] Load testing in staging
- [ ] Security audit
- [ ] Performance benchmarking

### Production
- [ ] Backup created
- [ ] Rollback plan documented
- [ ] Monitor for 24 hours post-deployment
- [ ] All KPIs within acceptable range
- [ ] Team on standby for issues
```

---

## <a id="troubleshooting"></a>10. TROUBLESHOOTING GUIDE

### Common Issues & Solutions

```markdown
## 🔧 Troubleshooting Guide

### Issue 1: Judge0 Healthcheck Failing

**Symptom:**
```
judge0 | Waiting for healthcheck...
judge0 | Healthcheck failed after 150 seconds
```

**Solutions:**
1. Increase `start_period` to 180 seconds in docker-compose.yml
2. Check Judge0 logs: `docker logs judge0_server`
3. Verify databases are healthy:
   ```bash
   docker-compose ps  # Check all green
   ```
4. Restart all services:
   ```bash
   docker-compose down -v
   docker-compose up -d --build
   sleep 180
   curl http://localhost:2358/  # Should return JSON
   ```

### Issue 2: Code Execution Timeout

**Symptom:**
```
TimeoutError: Judge0 execution timeout after 60 polls
```

**Solutions:**
1. Increase `max_polls` in judge0_service.py
2. Increase time limits in docker-compose environment
3. Check if Judge0 is overloaded:
   ```bash
   docker stats judge0
   ```
4. Reduce concurrent submissions initially

### Issue 3: Wrong Answer Not Detected

**Symptom:**
```
Code returns "15" but expected "10", verdict is "Accepted"
```

**Solutions:**
1. Check OutputNormalizer:
   ```python
   # Verify whitespace handling
   assert OutputNormalizer.compare("15\n", "10") == False
   ```
2. Check test case format (input/output keys)
3. Verify expected output in test cases
4. Test verdict mapping manually

### Issue 4: Database Connection Errors

**Symptom:**
```
psycopg2.OperationalError: could not connect to server
```

**Solutions:**
1. Check PostgreSQL is running:
   ```bash
   docker-compose ps postgres
   ```
2. Verify connection string in config
3. Wait for PostgreSQL to be healthy
4. Check logs: `docker logs postgres_db`

### Issue 5: High Memory Usage

**Symptom:**
```
Judge0 consuming > 2GB RAM
OOMKilled
```

**Solutions:**
1. Reduce `MEMORY_LIMIT` in docker-compose
2. Implement submission queue instead of parallel
3. Monitor with: `docker stats`
4. Add memory limits to docker-compose

### Issue 6: Slow Polling

**Symptom:**
```
Average submission takes > 30 seconds
```

**Solutions:**
1. Reduce initial_delay in poll_until_complete
2. Implement adaptive polling based on attempt
3. Use Judge0 batch API if available
4. Cache results for identical submissions

### Issue 7: Missing Verdicts

**Symptom:**
```
Some verdicts not recorded correctly
```

**Solutions:**
1. Verify VerdictMapper covers all status_ids
2. Check Judge0 status documentation
3. Log all status_ids received: `logger.debug(f"Status: {status_id}")`
4. Test each verdict type manually
```

---

## 📊 Sample Monitoring Dashboard

```python
# monitoring/metrics.py

from prometheus_client import Counter, Histogram, Gauge

# Metrics
submission_counter = Counter(
    'judge_submissions_total',
    'Total submissions',
    ['language', 'verdict']
)

execution_time = Histogram(
    'judge_execution_seconds',
    'Execution time in seconds',
    buckets=(0.1, 0.5, 1.0, 2.0, 5.0, 10.0)
)

active_submissions = Gauge(
    'judge_active_submissions',
    'Currently executing submissions'
)

judge0_health = Gauge(
    'judge0_health',
    'Judge0 service health (1=healthy, 0=down)'
)

# Usage in service
@app.post("/api/judge/submit")
async def submit_solution(req: SubmissionRequest):
    active_submissions.inc()
    start = time.time()
    
    try:
        result = await judge0_service.execute(req)
        submission_counter.labels(
            language=req.language,
            verdict=result['verdict']
        ).inc()
        execution_time.observe(time.time() - start)
        return result
    finally:
        active_submissions.dec()
```

---

## 🎯 Success Metrics

Track these metrics to ensure quality:

```
✅ Judge0 Uptime: > 99.5%
✅ Average Execution Time: < 3 seconds
✅ Verdict Accuracy: 100%
✅ Test Case Pass Rate: Match expected
✅ Concurrent Submissions (50+): No timeouts
✅ Memory Usage: < 2GB
✅ CPU Usage: < 80%
✅ Database Response Time: < 100ms
✅ Support for Languages: 13+
✅ Error Handling Coverage: 100%
```

---

**You've got all the tools and knowledge. Now go make it production-ready! 🚀⚡**
