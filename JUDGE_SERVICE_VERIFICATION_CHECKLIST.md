# Judge Service - Production Verification Checklist

**Date**: April 7, 2026  
**Checklist Version**: 2.0  
**Status**: Pre-Deployment  

---

## Phase 1: Pre-Deployment Verification (5-10 minutes)

### Code Quality Checks
- [ ] All Python files pass `flake8` linting
  ```bash
  flake8 backend/services/judge_service/ --max-line-length=100
  ```

- [ ] Type hints present on all public functions
  ```bash
  # Manual spot check main.py, database_service.py
  grep -n "def " backend/services/judge_service/app/services/*.py
  ```

- [ ] No hardcoded secrets in config files
  ```bash
  grep -r "password\|api_key\|secret" backend/services/judge_service/ \
    --exclude-dir=__pycache__ | grep -v "config.py"
  ```

- [ ] All imports are valid and available in requirements.txt
  ```bash
  # Check requirements
  cat backend/services/judge_service/requirements.txt
  ```

### Configuration Pre-Check
- [ ] `.env` file exists with all required variables
  ```
  Required:
  ✓ JUDGE0_URL=http://judge0:2358
  ✓ JUDGE0_API_KEY=xxx
  ✓ POSTGRES_URL=postgresql://...
  ✓ REDIS_HOST=redis
  ```

- [ ] docker-compose.yml syntax is valid
  ```bash
  docker-compose config > /dev/null && echo "✓ Valid" || echo "✗ Invalid"
  ```

- [ ] All environment variables in docker-compose mapped correctly
  ```bash
  docker-compose config | grep -A 30 "judge:"
  ```

### Dependency Verification
- [ ] All Python dependencies available
  ```bash
  docker run --rm python:3.11 bash -c \
    "pip install -q -r /dev/stdin < backend/services/judge_service/requirements.txt && echo '✓ All deps OK'"
  ```

- [ ] Judge0 image (1.13.0) is available
  ```bash
  docker pull judge0/judge0:1.13.0
  ```

- [ ] PostgreSQL 16 image available
  ```bash
  docker pull postgres:16-alpine
  ```

- [ ] All services can be built/pulled without errors
  ```bash
  docker-compose pull
  docker-compose build judge
  ```

---

## Phase 2: Deployment Verification (5-10 minutes)

### Service Startup
- [ ] All containers start without errors
  ```bash
  docker-compose up -d
  docker-compose ps
  ```
  
  Expected output:
  ```
  postgres         "postgres"         Up (healthy)
  redis            "redis-server"     Up
  judge0           "bundle exec..."   Up (healthy)
  judge0-worker    "bundle exec..."   Up
  judge            "python app.py"    Up (healthy)
  ```

- [ ] No critical errors in logs
  ```bash
  docker-compose logs --no-pager | grep -i "error\|failed\|exception" | wc -l
  # Should be 0 or only expected warnings
  ```

- [ ] Database initialized
  ```bash
  docker exec postgres psql -U coduku -d coduku -c \
    "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';"
  # Should show > 3 tables
  ```

- [ ] Judge0 is accessible
  ```bash
  curl -s http://localhost:2358 | grep -q "Judge0" && echo "✓ Judge0 OK" || echo "✗ Judge0 Not OK"
  ```

- [ ] Redis is responding
  ```bash
  docker exec redis redis-cli ping
  # Should respond: PONG
  ```

### Service Health Checks
- [ ] Judge service health endpoint responds
  ```bash
  curl -s http://localhost:8002/health | python -m json.tool
  ```
  
  Expected response:
  ```json
  {
    "status": "healthy",
    "judge0": "online",
    "database": "connected",
    "redis": "ready"
  }
  ```

- [ ] Database connection pool healthy
  ```bash
  curl -s http://localhost:8002/health | grep -q "database.*connected" && echo "✓" || echo "✗"
  ```

- [ ] Judge0 worker processing
  ```bash
  docker-compose logs judge0-worker | grep -i "working\|processing" | tail -3
  ```

---

## Phase 3: Functional Testing (10-15 minutes)

### API Endpoint Tests

#### Test 1: Health Check
```bash
curl -X GET http://localhost:8002/health \
  -H "Content-Type: application/json"

# ✓ Should return 200 with health status
```

#### Test 2: Submit Python Code
```bash
curl -X POST http://localhost:8002/api/judge/submit \
  -H "Content-Type: application/json" \
  -d '{
    "problem_id": 1,
    "language": "python3",
    "source_code": "def add(a,b):\n    return a+b\n\nprint(add(2,3))",
    "user_id": "test_user"
  }'

# ✓ Should return 200 with submission_id
# ✓ Response should include "verdict": "Accepted" (if test case is simple)
```
- [ ] Returns status code 200
- [ ] Response contains `submission_id`
- [ ] Response contains `verdict` field
- [ ] Response contains `test_cases` array

#### Test 3: Submit JavaScript Code
```bash
curl -X POST http://localhost:8002/api/judge/submit \
  -H "Content-Type: application/json" \
  -d '{
    "problem_id": 2,
    "language": "javascript",
    "source_code": "console.log(2 + 3);",
    "user_id": "test_user"
  }'

# ✓ Should return 200 with submission_id
```
- [ ] Language "javascript" accepted
- [ ] Code executed successfully
- [ ] Verdict received

#### Test 4: Get Submission Details
```bash
# First, get submission_id from a previous submission
SUBMISSION_ID=<from_previous_response>

curl -X GET http://localhost:8002/api/judge/submission/$SUBMISSION_ID \
  -H "Content-Type: application/json"

# ✓ Should return 200 with full submission details
```
- [ ] Returns status code 200
- [ ] Contains all test case results
- [ ] Contains execution metadata

#### Test 5: Get User Statistics
```bash
curl -X GET http://localhost:8002/api/judge/statistics/test_user \
  -H "Content-Type: application/json"

# ✓ Should return stats like:
# { "total_submissions": 2, "accepted": 1, ... }
```
- [ ] Returns status code 200
- [ ] Contains `total_submissions` count
- [ ] Contains verdict breakdowns

### Language Support Test

Test each major language:
- [ ] Python: `python, python3, python2`
  ```bash
  curl -X POST http://localhost:8002/api/judge/submit -H "Content-Type: application/json" \
    -d '{"problem_id":1,"language":"python3","source_code":"print(1)","user_id":"u1"}'
  ```

- [ ] JavaScript: `javascript, js, node`
  ```bash
  curl -X POST http://localhost:8002/api/judge/submit -H "Content-Type: application/json" \
    -d '{"problem_id":1,"language":"javascript","source_code":"console.log(1)","user_id":"u1"}'
  ```

- [ ] Java: `java`
  ```bash
  curl -X POST http://localhost:8002/api/judge/submit -H "Content-Type: application/json" \
    -d '{"problem_id":1,"language":"java","source_code":"...","user_id":"u1"}'
  ```

- [ ] C++: `cpp, c++`
  ```bash
  curl -X POST http://localhost:8002/api/judge/submit -H "Content-Type: application/json" \
    -d '{"problem_id":1,"language":"cpp","source_code":"...","user_id":"u1"}'
  ```

### Output Normalization Tests

#### Test: Whitespace Handling
```
Input:     "  hello  \r\n  world  \n"
Expected:  "hello\nworld"
Actual:    ?
Result: [ ] PASS [ ] FAIL
```

#### Test: Float Comparison
```
Input:     actual="3.14159", expected="3.14160"
Tolerance: 1e-6
Result: [ ] SHOULD MATCH [ ] SHOULD NOT MATCH
```

#### Test: Empty Lines Stripping
```
Input:     "line1\n\n\nline2"
Mode:      "strict"
Expected:  "line1\nline2"
Result: [ ] PASS [ ] FAIL
```

---

## Phase 4: Performance Verification (5-10 minutes)

### Response Time Benchmarks

#### Single Submission
- [ ] Simple code (1 line, 1 test): < 5 seconds
- [ ] Moderate code (10 lines, 4 tests): < 20 seconds
- [ ] Complex code (50+ lines, multiple tests): < 60 seconds

Test command:
```bash
time curl -X POST http://localhost:8002/api/judge/submit \
  -H "Content-Type: application/json" \
  -d '{...}'
```

### Concurrent Load Test

Simulate 10 concurrent submissions:
```bash
for i in {1..10}; do
  curl -X POST http://localhost:8002/api/judge/submit \
    -H "Content-Type: application/json" \
    -d "{...,$i}" &
done
wait

# ✓ All should complete without errors
# ✓ No "connection pool exhausted" errors
```

- [ ] All 10 requests complete successfully
- [ ] Average response time < 30 seconds
- [ ] No "connection pool exhausted" errors
- [ ] No "timeout" errors

### Resource Usage

```bash
docker stats judge --no-stream

# Check output:
# CPU%   < 50%
# MEM%   < 40%  (around 500MB on 2GB container)
```

- [ ] CPU usage < 50%
- [ ] Memory usage < 500MB
- [ ] No memory leaks observed

---

## Phase 5: Database Verification (5 minutes)

### Schema Verification
```bash
docker exec postgres psql -U coduku -d coduku -c "\dt public.*"
```

- [ ] `submissions` table exists
- [ ] `test_results` table exists
- [ ] `submission_history` table exists (if used)
- [ ] All indexes present

### Data Integrity
```bash
# Check submissions were stored
docker exec postgres psql -U coduku -d coduku -c \
  "SELECT COUNT(*) FROM submissions;"

# Should show > 0 after test submissions
```

- [ ] Submissions table has data from tests
- [ ] Each submission has required fields filled
- [ ] Timestamps are recent (within last 5 minutes)

### Connection Pool Health
```bash
# Check active connections
docker exec postgres psql -U coduku -d coduku -c \
  "SELECT usename, state, COUNT(*) FROM pg_stat_activity GROUP BY 1,2;"
```

- [ ] Active connections < 20 (POOL_SIZE)
- [ ] No "idle in transaction" connections (potential danger)
- [ ] No stalled connections

---

## Phase 6: Error Handling Verification (5 minutes)

### Test Error Scenarios

#### Test 1: Invalid Language
```bash
curl -X POST http://localhost:8002/api/judge/submit \
  -H "Content-Type: application/json" \
  -d '{"problem_id":1,"language":"invalid_lang","source_code":"...","user_id":"u1"}'
```

- [ ] Returns 400 status (client error)
- [ ] Response contains error message
- [ ] No stack trace in response

#### Test 2: Code Size Limit
```bash
# Generate 5KB of code (exceeds 4KB limit)
LARGE_CODE=$(python -c "print('# ' + 'x' * 10000)")

curl -X POST http://localhost:8002/api/judge/submit \
  -H "Content-Type: application/json" \
  -d "{\"problem_id\":1,\"language\":\"python3\",\"source_code\":\"$LARGE_CODE\",\"user_id\":\"u1\"}"
```

- [ ] Returns 413 status (payload too large)
- [ ] Response contains error message

#### Test 3: Missing Required Field
```bash
curl -X POST http://localhost:8002/api/judge/submit \
  -H "Content-Type: application/json" \
  -d '{"problem_id":1,"language":"python3"}'
```

- [ ] Returns 422 status (validation error)
- [ ] Response specifies missing field

#### Test 4: Judge0 Timeout Handling
- [ ] Submission with 10+ second execution time handled
- [ ] Response includes "Timeout" or similar message
- [ ] System continues accepting submissions

### Circuit Breaker Test

Temporarily stop Judge0:
```bash
docker-compose stop judge0
```

Submit a request:
```bash
curl -X POST http://localhost:8002/api/judge/submit \
  -H "Content-Type: application/json" \
  -d '{...}'
```

- [ ] After 5 failures, circuit breaker opens
- [ ] Returns error message indicating Judge0 offline
- [ ] No 500 errors, gracefully degraded
- [ ] System recovers when Judge0 restarts

Re-enable Judge0:
```bash
docker-compose start judge0
```

- [ ] Circuit breaker automatically closes after 60 seconds
- [ ] System returns to normal operation

---

## Phase 7: Security Verification (5 minutes)

### Input Validation
- [ ] XSS attempt rejected: `<script>alert('xss')</script>`
- [ ] SQL injection attempt rejected: `'; DROP TABLE submissions; --`
- [ ] Large input rejected: > 4KB code
- [ ] Invalid JSON rejected: `{invalid json}`

Test XSS:
```bash
curl -X POST http://localhost:8002/api/judge/submit \
  -H "Content-Type: application/json" \
  -d '{"problem_id":1,"language":"python3","source_code":"<script>alert(1)</script>","user_id":"u1"}'
```

- [ ] Returns 200 (accepted as code)
- [ ] Not executed as HTML
- [ ] Stored safely in database

### Resource Limits
- [ ] Time limit enforced: submission with infinite loop returns "Timeout"
- [ ] Memory limit enforced: large array allocation returns "Memory Limit"
- [ ] Queue limits enforced: 1000+ submissions don't crash system

### No Sensitive Data Exposure
Review response bodies:
```bash
curl -s http://localhost:8002/api/judge/submission/1 | grep -i "password\|secret\|key"
```

- [ ] No API keys exposed
- [ ] No internal paths exposed
- [ ] No database credentials visible
- [ ] Stack traces not shown to users

---

## Phase 8: Documentation Verification (5 minutes)

### Files Present
- [ ] `JUDGE_SERVICE_DEPLOYMENT_GUIDE.md` exists and is readable
- [ ] `JUDGE_SERVICE_COMPLETE.md` exists (this summary)
- [ ] `JUDGE_SERVICE_QUICK_REFERENCE.md` exists
- [ ] Code comments present in critical sections

### Documentation Quality
- [ ] All functions have docstrings
- [ ] Configuration options documented
- [ ] Troubleshooting guide complete
- [ ] API examples provided

Test documentation:
```bash
head -20 JUDGE_SERVICE_DEPLOYMENT_GUIDE.md
head -20 JUDGE_SERVICE_QUICK_REFERENCE.md
```

- [ ] Both documents readable and formatted
- [ ] Both contain executable commands with examples

---

## Phase 9: Rollback Readiness (5 minutes)

### Backup Preparation
- [ ] Database backup script exists
  ```bash
  # Create backup
  docker exec postgres pg_dump -U coduku coduku > backup_$(date +%Y%m%d).sql
  
  # Verify backup
  file backup_*.sql | grep -q "ASCII\|SQL" && echo "✓" || echo "✗"
  ```

- [ ] Backup file size reasonable (> 50KB for initialized DB)

### Volume Management
- [ ] Docker volumes documented
  ```bash
  docker volume ls | grep judge
  ```

- [ ] Volume cleanup procedure known
- [ ] Data persistence verified across restart

---

## Phase 10: Sign-Off Checklist

### Technical Review
- [ ] Code review completed: ✓ APPROVED / ✗ NEEDS FIXES
- [ ] Performance acceptable: ✓ YES / ✗ NEEDS TUNING
- [ ] Security review passed: ✓ YES / ✗ NEEDS HARDENING
- [ ] Documentation complete: ✓ YES / ✗ INCOMPLETE

### Deployment Readiness
- [ ] All Phase 1-9 items completed
- [ ] No critical issues remaining
- [ ] Team trained on operations
- [ ] Runbooks and procedures documented

### Sign-Off
```
Verified By:           ________________
Date:                  ________________
Status:               ¤ READY FOR PROD  ¤ NEEDS FIXES
Comments:             _________________________________
```

---

## Emergency Contacts & Escalation

```
Primary Contact:      [Name/Team]
On-Call Engineer:     [Contact info]
Judge0 Support:       https://judge0.com
PostgreSQL Docs:      https://www.postgresql.org/docs/

Emergency Procedures: See JUDGE_SERVICE_DEPLOYMENT_GUIDE.md (Section 8)
```

---

## Quick Health Check Commands

Use these commands for ongoing monitoring:

```bash
# All in one health check
docker-compose exec judge curl -s http://localhost:8002/health | python -m json.tool

# Database health
docker exec postgres psql -U coduku -d coduku -c "SELECT COUNT(*) FROM submissions;"

# Redis health
docker exec redis redis-cli PING

# Judge0 health
curl -s http://localhost:2358/ | head -5

# Logs
docker-compose logs --tail=50 judge

# Resource usage
docker stats --no-stream

# Circuit breaker status
docker-compose logs judge | grep -i "circuit\|breaker" | tail -5
```

---

**Checklist Version**: 2.0  
**Last Updated**: April 7, 2026  
**Status**: Ready for Production Deployment  

Completed all phases? → See JUDGE_SERVICE_DEPLOYMENT_GUIDE.md for post-deployment steps
