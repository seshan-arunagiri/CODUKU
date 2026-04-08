# Judge Service - Quick Reference Card

## 🔥 Critical Endpoints

### Submit Code
```
POST /api/judge/submit

Request:
{
  "problem_id": 1,
  "language": "python3",
  "source_code": "print('hello')",
  "user_id": "user123"
}

Response:
{
  "submission_id": 12345,
  "verdict": "Accepted",     # or "Partial", "Wrong Answer", "Error"
  "passed_tests": 4,
  "total_tests": 4,
  "score": 100,
  "test_cases": [...]
}
```

### Get Submission
```
GET /api/judge/submission/{submission_id}

Returns: Full submission with all test case details
```

### Get User Statistics
```
GET /api/judge/statistics/{user_id}

Returns:
{
  "total_submissions": 42,
  "accepted": 18,
  "wrong_answer": 15,
  "compilation_errors": 5,
  "runtime_errors": 4
}
```

### Health Check
```
GET /api/judge/health

Returns:
{
  "status": "healthy",
  "judge0": "online",
  "database": "connected",
  "redis": "ready"
}
```

---

## ⚙️ Configuration Essentials

### Timeouts & Limits
```
JUDGE0_TIMEOUT = 90           # seconds to wait for execution
TIME_LIMIT = 10               # seconds per test case
MEMORY_LIMIT = 256            # MB per test case
MAX_POLLS = 60                # polling attempts (~2 min total)
```

### Database
```
POSTGRES_URL = "postgresql://user:pass@postgres:5432/coduku"
POSTGRES_POOL_SIZE = 20       # connections in pool
POSTGRES_POOL_TIMEOUT = 30    # connection timeout (seconds)
```

### Judge0
```
JUDGE0_URL = "http://judge0:2358"
JUDGE0_API_KEY = "xxx"        # from judge0 setup
REDIS_HOST = "redis"          # NOT localhost!
REDIS_PORT = 6379
```

### Output Comparison
```
OUTPUT_NORMALIZE_MODE = "lines"  # "strict", "lines", or "lenient"
FLOAT_TOLERANCE = 1e-6           # For fuzzy comparisons
```

---

## 🗂️ File Locations

```
Judge Service Root:
└── backend/services/judge_service/

Key Files:
├── app/main.py                          # Main API endpoints
├── app/services/judge_service.py        # Core logic
├── app/services/database_service.py     # ✨ NEW: DB persistence
├── app/services/output_normalizer.py    # ✨ NEW: Output comparison
├── app/services/error_handler.py        # ✨ NEW: Error recovery
├── app/core/config.py                   # Configuration
├── Dockerfile
└── requirements.txt

Related:
├── docker-compose.yml                   # All services config
├── JUDGE_SERVICE_DEPLOYMENT_GUIDE.md    # Operations guide
└── JUDGE_SERVICE_COMPLETE.md            # This summary
```

---

## 🚀 Deployment Quick Start

### 1️⃣ Verify Docker Setup
```bash
# Check Docker daemon
docker ps

# Check services healthy
docker-compose ps
```

### 2️⃣ Setup Environment
```bash
# Copy if needed
cp .env.example .env

# Key variables:
JUDGE0_URL=http://judge0:2358
REDIS_HOST=redis
POSTGRES_URL=postgresql://...
```

### 3️⃣ Deploy
```bash
# Rebuild Judge service
docker-compose up -d --build judge

# Wait for startup (30s)
sleep 30

# Verify health
curl http://localhost:8002/health
```

### 4️⃣ Test
```bash
python scripts/test_submission_flow.py
```

---

## 🧪 Supported Languages

```
Python:     python, python3, python2
JavaScript: javascript, js, node
Java:       java
C++:        cpp, c++
C:          c, csharp, c#
Go:         go
Rust:       rust
Ruby:       ruby
PHP:        php
Swift:      swift
Kotlin:     kotlin
```

**How it works**: Language aliases mapped to Judge0 language IDs
Example: `python3` → Language ID 71

---

## 🔧 Troubleshooting

### "Judge0 service temporarily unavailable"
```
✓ Check Judge0 health: curl :2358/health
✓ Check Redis: docker exec redis redis-cli ping → PONG
✓ Check jobs queue: docker exec redis redis-cli LLEN resque:queue:default
✓ Check worker: docker-compose logs judge0-worker | grep "Working on"
```

### "Unsupported language: python3"
```
✓ Language already added to LANGUAGE_IDS dict
✓ If custom language, add: LANGUAGE_IDS = {"your_lang": id_from_judge0}
✓ Restart: docker-compose restart judge
```

### "Compilation error" on all submissions
```
✓ Check code actually compiles locally
✓ Check timeout not too short (try 90s)
✓ Check whitespace/CRLF issues: OutputNormalizer handles this
```

### Database "connection pool exhausted"
```
✓ Increase POSTGRES_POOL_SIZE in config.py
✓ Check for connection leaks: query submissions table
✓ Restart judge service: docker-compose restart judge
```

### Slow submissions
```
✓ Monitor Judge0 CPU: docker stats judge0
✓ Check polling backoff in services/judge_service.py
✓ Increase Judge0 resources (docker-compose.yml)
✓ Check test case output size (might slow comparison)
```

---

## 📊 Database Schema Quick Look

### submissions table
```sql
CREATE TABLE submissions (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255),
  problem_id INTEGER,
  language VARCHAR(50),
  source_code TEXT,
  verdict VARCHAR(50),        -- "Accepted", "Wrong Answer", etc
  score INTEGER,              -- 0-100
  passed_tests INTEGER,
  total_tests INTEGER,
  execution_time_ms INTEGER,
  judge0_submission_ids TEXT, -- JSON array
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_user_submissions ON submissions(user_id, created_at DESC);
CREATE INDEX idx_problem_submissions ON submissions(problem_id, verdict);
```

### test_results table
```sql
CREATE TABLE test_results (
  id SERIAL PRIMARY KEY,
  submission_id INTEGER,
  test_case_number INTEGER,
  judge0_submission_id INTEGER,
  verdict VARCHAR(50),        -- Judge0 status
  output TEXT,
  expected_output TEXT,
  normalized_match BOOLEAN,
  execution_time_ms INTEGER,
  memory_used_mb INTEGER,
  created_at TIMESTAMP
);
```

---

## 🔌 Integration Points

### → Leaderboard Service
```
When verdict = "Accepted":
  POST /api/leaderboard/update
  {
    "user_id": "...",
    "problem_id": 1,
    "score": 100,
    "time_ms": 2345
  }
```

### ← Authentication Service
```
Header: Authorization: Bearer {token}
Validated against: backend/services/auth_service.py
```

### ↔ User Service
```
On submission, fetch user details for:
  - User rank calculation
  - Score update
  - Achievement unlock
```

---

## 💾 Backup & Recovery

### Database Backup
```bash
# Full backup
docker exec postgres pg_dump -U coduku coduku > backup.sql

# Restore
cat backup.sql | docker exec -i postgres psql -U coduku coduku
```

### Volume Cleanup
```bash
# Remove old data (⚠️ destructive!)
docker-compose down -v

# Recreate clean
docker-compose up -d
```

---

## 📈 Performance Targets

| Metric | Target | Monitoring |
|--------|--------|------------|
| API response time | < 2s | Application logs |
| Submission throughput | 30+ / min | Judge0 metrics |
| Database latency | < 100ms | PostgreSQL slow query log |
| Judge0 availability | > 99.5% | Health check endpoint |
| Circuit breaker trips | < 5/day | Error logs |
| Memory usage | < 1GB | `docker stats` |
| CPU usage | < 50% | `docker stats` |

---

## 🎯 Common Operations

### Add a New Language
```python
# In app/core/config.py, update LANGUAGE_IDS:
LANGUAGE_IDS = {
    ...
    "your_language": 1234  # From Judge0 API
}

# Restart:
docker-compose restart judge
```

### Change Output Normalization
```bash
# In docker-compose.yml for judge service:
OUTPUT_NORMALIZE_MODE: "strict"  # or "lines" or "lenient"

# Restart:
docker-compose restart judge
```

### Increase Time Limits
```bash
# In docker-compose.yml for judge service:
TIME_LIMIT_SECONDS: 15  # default is 10

# Restart:
docker-compose restart judge
```

### Monitor in Real-Time
```bash
# Logs
docker-compose logs -f judge

# Database activity
docker exec postgres psql -U coduku -d coduku -c "SELECT * FROM submissions ORDER BY created_at DESC LIMIT 5;"

# Redis queue
docker exec redis redis-cli LLEN resque:queue:default
```

---

## 📚 Documentation Map

```
📖 For Deployment:      → JUDGE_SERVICE_DEPLOYMENT_GUIDE.md
📖 For Architecture:    → JUDGE_SERVICE_COMPLETE.md (this file)
📖 For API Reference:   → JUDGE_SERVICE_DEPLOYMENT_GUIDE.md (Section 5)
📖 For Troubleshooting: → This card (Troubleshooting section)
📖 For Configuration:   → app/core/config.py
📖 For Operations:      → JUDGE_SERVICE_DEPLOYMENT_GUIDE.md (Section 8)
```

---

**Last Updated**: April 7, 2026  
**Status**: ✅ Production Ready  
**Version**: 2.0.0

---

## ⚡ TL;DR - Get Running in 60 Seconds

```bash
# 1. Start Docker (if not running)
# Open Docker Desktop

# 2. Navigate to project
cd d:\Projects\coduku

# 3. Deploy
docker-compose down -v
docker-compose up -d --build judge postgres redis judge0 judge0-worker

# 4. Wait 30s for startup
timeout 30

# 5. Test
curl http://localhost:8002/health
python scripts/test_submission_flow.py

# Done! ✅
```

---
