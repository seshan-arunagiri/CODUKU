# CODUKU JUDGE SERVICE - QUICK START GUIDE
## For You (Nithish) - Compiler & Coding Environment Core

---

## 🎯 YOUR MISSION (Next 4 Weeks)

**Make Judge0 integration 100% functional, reliable, and production-ready**

---

## 📍 START HERE (TODAY)

### Step 1: Understand Current State
```bash
# Clone main branch
git clone -b main https://github.com/seshan-arunagiri/CODUKU.git
cd CODUKU

# Review judge service architecture
cat backend/services/judge_service/app/main.py
cat backend/services/judge_service/app/services/judge0_service.py

# Check docker-compose
cat docker-compose.yml
```

### Step 2: Identify Issues
```
Current Problems:
❌ Judge0 slow startup (2-3 min)
❌ Basic error handling (all failures = same verdict)
❌ No real-time WebSocket updates
❌ Output comparison is fragile (whitespace)
❌ No permanent result storage
❌ Missing advanced verdicts (TLE, MLE distinction)
```

### Step 3: Set Up Development Environment
```bash
# 1. Install Docker Desktop
# 2. Clone repo
# 3. Create docker-compose with 150s start_period

# 4. Start services
docker-compose down -v
docker-compose up -d --build
sleep 150  # Wait for Judge0

# 5. Verify
curl http://localhost:2358/  # Should return JSON
docker-compose ps  # All should be healthy
```

---

## 🛠️ WEEK 1: Stabilize Judge0 Core

### Day 1-2: Review & Setup
- [ ] Read judge0_service.py completely
- [ ] Understand LANGUAGE_MAP (60+ languages)
- [ ] Trace submit_code() → poll_until_complete() flow
- [ ] Test with simple Python submission

### Day 3-4: Fix Startup Issues
```python
# Current problem: Judge0 takes 2-3 minutes

# Solution: Docker healthcheck tuning
# In docker-compose.yml:
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:2358/"]
  interval: 10s
  timeout: 5s
  retries: 5
  start_period: 150s  # ← Critical: 2.5 minutes

# Test startup:
docker-compose down -v
docker-compose up -d --build
time curl http://localhost:2358/  # Measure time
```

### Day 5: Implement Error Categorization
```python
# Create VerdictMapper.py to map Judge0 status IDs

STATUS_MAP = {
    1: ("In Queue", "unknown", True),
    2: ("Processing", "unknown", True),
    3: ("Accepted", "accepted", False),           # ✅
    4: ("Wrong Answer", "wrong_answer", False),  # ❌
    5: ("Time Limit Exceeded", "timeout", False),  # ⏱️
    6: ("Memory Limit Exceeded", "memory", False),  # 💾
    11: ("Runtime Error", "runtime", False),      # 💥
    12: ("Compilation Error", "compilation", False),  # 🔴
}

# Then update judge0_service.py to use VerdictMapper
```

### Day 6-7: Polling Optimization
```python
# Current: Fixed delays
# Better: Adaptive exponential backoff

async def poll_until_complete(self, token, max_polls=60):
    for attempt in range(max_polls):
        result = await self.get_result(token)
        status_id = result["status"]["id"]
        
        if status_id not in (1, 2):  # Not queued/processing
            return result
        
        # Adaptive delay: 0.5s, 1s, 1.5s, 2s, 2s, ...
        delay = min(0.5 * (attempt + 1), 2.0)
        await asyncio.sleep(delay)
```

---

## 🔍 WEEK 2: Enhance Test Case Engine

### Day 1-2: Output Normalization
```python
# Create OutputNormalizer.py

class OutputNormalizer:
    @staticmethod
    def normalize(output: str) -> str:
        # Remove CRLF vs LF differences
        output = output.replace('\r\n', '\n')
        
        # Strip whitespace per line
        lines = [line.rstrip() for line in output.split('\n')]
        
        # Global strip
        return '\n'.join(lines).strip()
    
    @staticmethod
    def compare(actual, expected, fuzzy=False):
        # Normalize both
        actual_norm = OutputNormalizer.normalize(actual)
        expected_norm = OutputNormalizer.normalize(expected)
        
        # Exact match
        if actual_norm == expected_norm:
            return True
        
        # Fuzzy float comparison
        if fuzzy:
            try:
                actual_float = float(actual_norm)
                expected_float = float(expected_norm)
                return abs(actual_float - expected_float) <= 0.0001
            except:
                pass
        
        return False
```

### Day 3-4: Test Case Manager
```python
# Create TestCaseManager.py to handle:
# - Load test cases from database
# - Save results to PostgreSQL
# - Track passed/failed

# Key table schema:
"""
CREATE TABLE test_cases (
  id SERIAL PRIMARY KEY,
  problem_id INT,
  input TEXT,
  expected_output TEXT,
  is_hidden BOOLEAN DEFAULT FALSE
);

CREATE TABLE submission_results (
  id SERIAL PRIMARY KEY,
  submission_id INT,
  test_case_id INT,
  verdict VARCHAR(50),
  actual_output TEXT,
  error_message TEXT,
  execution_time FLOAT
);
"""
```

### Day 5-6: Multiple Test Case Support
```python
# Update execute_with_test_cases() to:
# 1. Handle sample + hidden tests
# 2. Collect all results
# 3. Determine overall verdict from parts
# 4. Calculate aggregate score

async def execute_with_test_cases(
    self,
    language,
    source_code,
    test_cases
) -> Dict:
    results = {
        "passed": 0,
        "total": len(test_cases),
        "verdict": "Accepted",  # Optimistic
        "severity": "accepted",
        "details": []
    }
    
    for idx, tc in enumerate(test_cases):
        # Submit each test case
        token = await self.submit_code(
            language,
            source_code,
            stdin=tc["input"],
            expected_output=tc["output"]
        )
        
        # Poll for result
        result = await self.poll_until_complete(token)
        
        # Map verdict
        status_id = result["status"]["id"]
        verdict = VerdictMapper.map_status(status_id)[0]
        
        # Check if accepted
        if VerdictMapper.is_accepted(status_id):
            results["passed"] += 1
        else:
            # Update overall verdict (first failure wins)
            if results["verdict"] == "Accepted":
                results["verdict"] = verdict
        
        # Store detail
        results["details"].append({
            "test_case": idx + 1,
            "verdict": verdict,
            "output": result.get("stdout", ""),
            "error": result.get("stderr", "")
        })
    
    return results
```

### Day 7: Testing
- [ ] Test with Python submissions (simple cases)
- [ ] Test with Java submissions
- [ ] Test error detection (syntax error, TLE, etc.)
- [ ] Verify output normalization works

---

## 🔗 WEEK 3: Integration with Leaderboard

### Day 1-2: Submission Database
```python
# Add to judge service main.py:

@app.post("/api/judge/submit")
async def submit_solution(req: SubmissionRequest):
    # 1. Get test cases
    test_cases = await TestCaseManager.get_test_cases(req.problem_id)
    
    # 2. Execute
    execution_result = await judge0_service.execute_with_test_cases(
        language=req.language,
        source_code=req.source_code,
        test_cases=test_cases
    )
    
    # 3. Save submission
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
    for detail in execution_result["details"]:
        await TestCaseManager.save_submission_result(
            submission_id=submission_id,
            verdict=detail["verdict"],
            output=detail["output"],
            error=detail.get("error")
        )
    
    # 5. Update leaderboard (async background task)
    background_tasks.add_task(
        update_leaderboard,
        user_id,
        execution_result["verdict"] == "Accepted"
    )
    
    return execution_result
```

### Day 3-4: Leaderboard Integration
```python
# Call Leaderboard Service when "Accepted"

async def update_leaderboard(user_id: int, accepted: bool):
    if accepted:
        # Call leaderboard service
        import httpx
        async with httpx.AsyncClient() as client:
            await client.post(
                "http://leaderboard:8003/api/leaderboard/update_score",
                json={"user_id": user_id, "problem_solved": 1}
            )
```

### Day 5-6: WebSocket Real-time Updates
```python
# Optional: Add WebSocket for live status

from fastapi import WebSocket

@app.websocket("/ws/judge/{submission_id}")
async def websocket_judge_status(submission_id: str):
    # Send status updates as submission progresses
    # "Queued" → "Compiling" → "Running" → "Accepted"
    
    while True:
        status = await get_submission_status(submission_id)
        await websocket.send_json(status)
        
        if status["completed"]:
            break
        
        await asyncio.sleep(0.5)
```

### Day 7: Testing Full Flow
- [ ] Submit → Judge0 executes → Save to DB → Leaderboard updates
- [ ] Verify score calculation
- [ ] Check house leaderboard updates
- [ ] Test with multiple users

---

## ✅ WEEK 4: Testing & Optimization

### Day 1-2: Unit Tests
```bash
# Create tests/test_judge_service.py

# Test verdict mapping
assert VerdictMapper.map_status(3)[0] == "Accepted"
assert VerdictMapper.map_status(4)[0] == "Wrong Answer"
assert VerdictMapper.map_status(5)[0] == "Time Limit Exceeded"

# Test output normalization
assert OutputNormalizer.compare("hello\n", "hello") == True
assert OutputNormalizer.compare("3.14", "3.14001", fuzzy=True) == True

# Run tests
pytest tests/test_judge_service.py -v
```

### Day 3-4: Integration Tests
```bash
# Test end-to-end submission flow

# 1. Submit Python code
curl -X POST http://localhost:8002/api/judge/submit \
  -H "Content-Type: application/json" \
  -d '{
    "problem_id": 1,
    "language": "python",
    "source_code": "def solution(n):\n    return n * 2"
  }'

# 2. Check response has verdict, score, execution_time
# 3. Check database has submission record
# 4. Verify leaderboard updated

# Repeat for Java, C++, etc.
```

### Day 5-6: Load Testing
```python
# Test with 50+ concurrent submissions

import asyncio

async def load_test():
    tasks = []
    for i in range(50):
        tasks.append(submit_solution(...))
    
    results = await asyncio.gather(*tasks)
    
    successful = sum(1 for r in results if r.get("verdict"))
    print(f"Passed: {successful}/50")
```

### Day 7: Performance Tuning
- [ ] Check execution times: < 3 seconds average
- [ ] Verify Judge0 CPU/Memory: < 80% usage
- [ ] Database query performance: < 100ms
- [ ] No timeouts with 50+ concurrent submissions

---

## 🚀 DEPLOYMENT CHECKLIST

Before presenting to HOD:

```bash
# 1. Final cleanup
git add .
git commit -m "Judge service production ready"
git push origin main

# 2. Start fresh containers
docker-compose down -v
docker-compose up -d --build
sleep 150

# 3. Verify all services healthy
docker-compose ps  # All should be "healthy" or "up"

# 4. Quick functionality test
# - Register a user
# - Submit Python code (should work)
# - Check verdict is correct
# - Check leaderboard updates
# - Check profile page shows submission

# 5. Present to HOD
# - Show source code submission
# - Run code in real-time
# - Show verdict (Accepted, Wrong Answer, etc.)
# - Show real-time leaderboard update
# - Show house rivalries in action
```

---

## 💡 KEY FILES YOU'LL MODIFY

### Main Files to Update:
```
backend/services/judge_service/
├── app/
│   ├── main.py                           ← Update /api/judge/submit endpoint
│   ├── services/
│   │   ├── judge0_service.py             ← ADD: VerdictMapper, OutputNormalizer
│   │   ├── test_case_manager.py          ← NEW: Test case handling
│   │   ├── error_handler.py              ← NEW: Error categorization
│   │   └── postgres_service.py           ← Save results to DB
│   └── websocket_manager.py              ← Optional: Real-time updates
├── requirements.txt                      ← Add new dependencies
└── Dockerfile                            ← Ensure all packages installed

docker-compose.yml                        ← Set start_period: 150s for judge0
```

---

## 📊 QUICK REFERENCE: JUDGE0 STATUS CODES

```
ID   Status                  Verdict              Action
─────────────────────────────────────────────────────────
1    In Queue               Processing...         Poll again
2    Processing             Processing...         Poll again
3    ✅ Accepted             Accepted             PASS
4    ❌ Wrong Answer         Wrong Answer         FAIL
5    ⏱️  Time Limit Exceeded  Time Limit Exceeded  FAIL
6    💾 Memory Limit Ex.     Memory Limit Exceeded FAIL
11   💥 Runtime Error        Runtime Error         FAIL
12   🔴 Compilation Error    Compilation Error    FAIL
```

---

## 🎯 SUCCESS CRITERIA

Your implementation is complete when:

```
✅ Judge0 starts successfully (< 3 min)
✅ Python submissions work (verdict correct)
✅ Java submissions work (verdict correct)
✅ C++/C submissions work (verdict correct)
✅ Error detection works (syntax, runtime, TLE)
✅ Output comparison handles whitespace
✅ Multiple test cases execute correctly
✅ Results saved to PostgreSQL
✅ Leaderboard updates on "Accepted"
✅ 50+ concurrent submissions no timeout
✅ Average execution time < 3 seconds
✅ No memory leaks or crashes
✅ All error cases handled gracefully
```

---

## 🔧 TROUBLESHOOTING QUICK TIPS

### Judge0 Won't Start
```bash
# Check logs
docker logs judge0

# Increase wait time in docker-compose to 180s
# Verify Redis/PostgreSQL are running first
```

### Verdicts Wrong
```bash
# Check VerdictMapper status_id mapping
# Test manually: map_status(4) should return "Wrong Answer"
```

### Timeouts
```bash
# Increase max_polls from 60 to 80
# Reduce concurrent submissions initially
# Check Judge0 resource usage: docker stats
```

### Database Errors
```bash
# Check PostgreSQL running: docker-compose ps postgres
# Verify connection string in config
# Check database tables exist
```

---

## 📞 QUICK COMMANDS

```bash
# Start everything
docker-compose down -v && docker-compose up -d --build && sleep 150

# Check all services healthy
docker-compose ps

# View logs for a service
docker logs judge0
docker logs postgres_db
docker logs redis_cache

# Test Judge0 directly
curl http://localhost:2358/

# Connect to PostgreSQL
docker exec -it postgres_db psql -U postgres -d coduku_db

# Restart only judge service
docker-compose restart judge0

# Clean rebuild
docker-compose down -v
docker system prune -f
docker-compose up -d --build
```

---

## 📚 REFERENCE DOCS

You have 2 comprehensive guides:

1. **CODUKU_BRANCH_ANALYSIS_AND_RECOMMENDATIONS.md**
   - Which branch has what
   - Best features from each
   - Overall architecture

2. **JUDGE_SERVICE_IMPLEMENTATION_GUIDE.md**
   - Detailed code examples
   - Complete implementations
   - Testing strategies
   - Deployment checklist

---

## 🎓 LEARNING PATH

If you're new to any of these, learn in this order:

1. **Docker & Compose** (if new)
   - Understand container basics
   - How docker-compose orchestrates services
   - Healthchecks and dependencies

2. **FastAPI** (if new)
   - Async Python web framework
   - Route definitions
   - Dependency injection

3. **Judge0 API** (core)
   - Language mappings
   - Submission format
   - Status codes & polling

4. **PostgreSQL** (if new)
   - Basic SQL
   - Connection pooling
   - Async drivers

5. **Redis** (optional, for caching)
   - Key-value store
   - TTL
   - Sorted sets for leaderboards

---

## ✨ YOU'VE GOT THIS!

**Timeline: 4 weeks**
- Week 1: Stabilize (Monday-Friday)
- Week 2: Enhance (Monday-Friday)
- Week 3: Integrate (Monday-Friday)
- Week 4: Test & Deploy (Monday-Friday)

**Checkpoint meetings (every Friday):**
- Friday: Show progress, discuss blockers, adjust plan

**Final presentation:** EOW Friday of Week 4

---

**When you hit a blocker:**
1. Check the detailed guide
2. Check Judge0 API docs
3. Check test suite
4. Ask team members
5. Come back to this quick guide

**You are the judge service expert now. Own it! 🚀⚡**
