# CODUKU Implementation Checklist & Quick-Reference Guide

**Project Duration:** 8 Weeks | **Team Size:** 5 Members  
**Start Date:** Week 1 (Monday) | **Launch Date:** Week 8 (Friday)

---

## Sprint 0: Week 1 — Foundation Setup

### Monday (Day 1)

- [ ] **All Members:** Clone repository
  ```bash
  git clone https://github.com/seshan-arunagiri/CODUKU.git
  cd CODUKU
  ```

- [ ] **All Members:** Run existing MVP
  ```bash
  docker-compose up -d
  docker-compose logs -f  # Verify all services start
  ```

- [ ] **All Members:** Verify local access
  - [ ] Frontend: http://localhost:3000
  - [ ] Backend: http://localhost:5000/health
  - [ ] MongoDB: mongodb://localhost:27017
  - [ ] Redis: redis-cli -p 6379 PING

- [ ] **DevOps:** Add Judge0 service to docker-compose.yml
  ```yaml
  judge0:
    image: judge0/judge0:latest
    ports:
      - "2358:2358"
  ```

- [ ] **DevOps:** Add Redis service version check
  ```bash
  redis-cli --version  # Should be 7.0+
  ```

### Tuesday - Wednesday (Days 2-3)

- [ ] **DevOps + Backend Lead:** Update docker-compose.yml with all services
  - [ ] Judge0 (CE v1.13+)
  - [ ] Redis (7.0+)
  - [ ] Celery worker
  - [ ] MongoDB replica set (optional for dev)

- [ ] **Lead:** Initialize GitHub Projects board
  - [ ] Create columns: Backlog | To Do | In Progress | Review | Done
  - [ ] Add 20+ initial tasks for Sprint 1

- [ ] **All Members:** Configure development environment
  - [ ] Create `.env.local` file
  - [ ] Set `JUDGE0_API_URL=http://localhost:2358`
  - [ ] Set `REDIS_URL=redis://localhost:6379/0`
  - [ ] Set `MONGODB_URI=mongodb://localhost:27017/coduku`

- [ ] **QA Lead:** Create testing infrastructure
  - [ ] Set up pytest for backend
  - [ ] Set up React Testing Library for frontend
  - [ ] Create test fixtures (sample problems, users)

### Thursday - Friday (Days 4-5)

- [ ] **All Members:** First successful Judge0 test
  - [ ] Backend Specialist: Write Python client for Judge0 API
  - [ ] Test submission: Submit "Hello World" in Python, C, JavaScript
  - [ ] Verify results returned successfully

- [ ] **DevOps:** Verify Celery setup
  - [ ] Redis broker connectivity
  - [ ] Celery worker can receive tasks
  - [ ] Basic task execution (echo task)

- [ ] **Frontend:** Update React to support new backend
  - [ ] Add axios for API calls
  - [ ] Add socket.io-client package
  - [ ] Create basic Layout component

- [ ] **QA Lead:** Document Sprint 0 outcomes
  - [ ] Environment setup guide (README)
  - [ ] Issue any blockers in GitHub Issues

### Friday (End of Sprint 0)

- [ ] **All Members:** Demo verification
  - [ ] All services running: `docker-compose ps` (all UP)
  - [ ] Can submit code to Judge0 and get result
  - [ ] GitHub Projects board populated with Sprint 1 tasks

---

## Sprint 1: Weeks 2-3 — Scalable Core

### Week 2: Backend Foundation

#### Day 1 (Monday)

- [ ] **Backend Specialist:** Judge0 Python wrapper
  - [ ] Create `services/judge0.py`
  - [ ] Implement submission creation + polling
  - [ ] Handle all Judge0 response types (Accepted, WA, TLE, etc.)
  - [ ] Unit tests for Judge0 client (3+ test cases)

- [ ] **Lead:** Flask API structure
  - [ ] Create `/api/submit` endpoint
  - [ ] Input validation for source_code, language_id, problem_id
  - [ ] Response structure: `{ submission_id, status }`

- [ ] **DevOps:** Redis ZSET leaderboard initialization
  - [ ] Create Redis connection pool
  - [ ] Write ZADD, ZREVRANK, ZREVRANGE wrappers
  - [ ] Test leaderboard operations

#### Days 2-3

- [ ] **Backend Specialist:** Celery task integration
  - [ ] Create `tasks/execute_submission.py`
  - [ ] Task receives submission_id, calls Judge0
  - [ ] Stores result in MongoDB
  - [ ] Updates Redis leaderboard
  - [ ] Basic error handling + retry logic

- [ ] **Lead:** Submission model (MongoDB)
  - [ ] Define `Submission` schema
  - [ ] Fields: user_id, problem_id, source_code, status, score, created_at
  - [ ] Indexes for fast queries by (user_id, problem_id)

- [ ] **QA Lead:** Start writing integration tests
  - [ ] Test `/api/submit` endpoint
  - [ ] Mock Judge0 responses
  - [ ] Verify MongoDB records created

#### Days 4-5

- [ ] **Backend Specialist:** Error handling hardening
  - [ ] Judge0 timeout handling
  - [ ] Network error retries
  - [ ] Graceful degradation if services down

- [ ] **Lead:** `/api/submission/{id}` GET endpoint
  - [ ] Poll for submission status
  - [ ] Return execution results (stdout, stderr, status)
  - [ ] Cache results in Redis (TTL: 3600s)

- [ ] **QA Lead:** Load test Celery queue
  - [ ] Submit 20+ codes rapidly
  - [ ] Verify all execute without hanging
  - [ ] Check queue depth doesn't exceed 10min backlog

### Week 3: Real-Time & Leaderboards

#### Days 1-2

- [ ] **DevOps:** Flask-SocketIO setup
  - [ ] Add SocketIO to Flask app
  - [ ] Configure Redis message broker
  - [ ] Create `/leaderboard` namespace

- [ ] **Frontend:** WebSocket client
  - [ ] Install socket.io-client
  - [ ] Connect to `/leaderboard` namespace on mount
  - [ ] Handle 'score_updated' event
  - [ ] Render live leaderboard updates

- [ ] **Lead:** SocketIO event handlers
  - [ ] `@socketio.on('connect')` → Send top 100 leaderboard
  - [ ] Backend task publishes 'score_updated' event
  - [ ] Broadcast to leaderboard namespace

#### Days 3-5

- [ ] **Frontend:** Leaderboard component
  - [ ] Create `Leaderboard.jsx` with user list
  - [ ] Display rank, name, house, score
  - [ ] Real-time updates without page refresh
  - [ ] CSS styling with house colors (Tailwind)

- [ ] **DevOps:** Leaderboard caching strategy
  - [ ] Cache top 100 in Redis (TTL: 300s)
  - [ ] Only update on score change
  - [ ] Implement throttling (updates max 1x per 500ms)

- [ ] **QA Lead:** End-to-end integration test
  - [ ] User 1 submits code → Score updates
  - [ ] User 2 sees leaderboard update in real-time
  - [ ] Verify MongoDB records + Redis ZSET consistent

### Friday (End of Sprint 1)

- [ ] **All:** Demo verification checklist
  - [ ] `/api/submit` returns submission_id
  - [ ] `/api/submission/{id}` returns status
  - [ ] Leaderboard updates live for all users
  - [ ] MongoDB contains submission records
  - [ ] Redis ZSET leaderboard:global has correct scores
  - [ ] No console errors/warnings

- [ ] **QA Lead:** Document Sprint 1 completion
  - [ ] Update README with API endpoints
  - [ ] Log any known issues for Sprint 2

---

## Sprint 2: Weeks 4-5 — Complexity Analysis & Scoring

### Week 4: Complexity Analysis Module

#### Days 1-3

- [ ] **Backend Specialist:** AST-based complexity analyzer
  - [ ] Create `services/complexity.py`
  - [ ] Parse Python code AST
  - [ ] Detect loop nesting depth
  - [ ] Identify recursive functions
  - [ ] Map to Big-O: O(1), O(log n), O(n), O(n log n), O(n²), etc.

- [ ] **Backend Specialist:** Unit tests for analyzer
  - [ ] Test O(1): Simple assignment
  - [ ] Test O(n): Single loop
  - [ ] Test O(n²): Nested loops
  - [ ] Test O(log n): Binary search
  - [ ] Test O(2^n): Recursive Fibonacci
  - [ ] Confidence score for each

- [ ] **QA Lead:** Test cases for complexity module
  - [ ] Test suite of 20+ snippets with known complexity
  - [ ] Coverage: Functions, classes, edge cases

#### Days 4-5

- [ ] **Backend Specialist:** Celery task for analysis
  - [ ] Create `tasks/analyze_complexity.py`
  - [ ] Call complexity analyzer after Judge0 result
  - [ ] Store Big-O in submission.complexity_analysis
  - [ ] Handle non-Python languages gracefully (return "Unknown")

- [ ] **Lead:** Scoring formula implementation
  - [ ] Create `services/scoring.py`
  - [ ] Base score: 100
  - [ ] Complexity multipliers: O(1): +20%, O(n²): -15%, etc.
  - [ ] Speed multipliers: <100ms: +10%, >2000ms: -10%
  - [ ] Final formula: total = base × complexity_mult × speed_mult

### Week 5: Integration & Broadcasting

#### Days 1-2

- [ ] **Backend Specialist:** Update execute_submission task
  - [ ] After Judge0 result, call analyze_complexity
  - [ ] Calculate score with multipliers
  - [ ] Store score in submission document

- [ ] **DevOps:** Enhanced SocketIO broadcast
  - [ ] Publish 'score_updated' with complexity bonus
  - [ ] Include Big-O in leaderboard update
  - [ ] Update Redis ZSET with complexity-adjusted score

- [ ] **Frontend:** Show complexity in results
  - [ ] Display Big-O after submission
  - [ ] Show base score + complexity bonus + speed bonus breakdown
  - [ ] Highlight if complexity is worse than expected

#### Days 3-5

- [ ] **QA Lead:** End-to-end complexity scenario
  - [ ] Submit O(n²) solution → Score with -15% penalty
  - [ ] Submit O(n log n) solution → Score with -5% penalty
  - [ ] Submit O(n) solution → Full score
  - [ ] Verify leaderboard ranks updated accordingly

- [ ] **All:** Performance testing
  - [ ] 50 concurrent submissions
  - [ ] Leaderboard updates <1 second
  - [ ] Complexity analysis <500ms per submission

### Friday (End of Sprint 2)

- [ ] **All:** Demo verification
  - [ ] Submit code → See complexity analysis
  - [ ] Verify scoring: O(n²) < O(n) < O(n log n) < O(1)
  - [ ] Leaderboard reflects complexity bonuses
  - [ ] Live updates work for multiple users

---

## Sprint 3: Weeks 6-7 — Gamification

### Week 6: Live Battles

#### Days 1-2

- [ ] **Backend Specialist:** Battle model & endpoints
  - [ ] Create Battle schema (MongoDB)
  - [ ] `POST /api/battle/start` → Creates session
  - [ ] Matchmaking: Pair users of similar skill
  - [ ] Time limit: 5-10 minutes per battle

- [ ] **Frontend:** Battle UI
  - [ ] Create `Battle.jsx` component
  - [ ] Display opponent info
  - [ ] Show problem + time remaining
  - [ ] Split-screen for both coders (optional)

- [ ] **DevOps:** Battle socket events
  - [ ] `battle_started` → Send to both participants
  - [ ] `battle_progress` → Real-time score updates
  - [ ] `battle_ended` → Winner announcement

#### Days 3-5

- [ ] **Backend Specialist:** Battle logic
  - [ ] Track who solves problem first
  - [ ] Award points: First place: +50, Second: +30
  - [ ] Update user stats + house score

- [ ] **Frontend:** Battle completion
  - [ ] Show results: "You won by 2min 30sec"
  - [ ] Display points earned
  - [ ] Option to start new battle

- [ ] **QA Lead:** Battle end-to-end test
  - [ ] 2 users start 1v1 battle
  - [ ] User 1 submits solution first
  - [ ] User 2 sees User 1 solved it
  - [ ] Both see final results
  - [ ] Both leaderboards updated

### Week 7: Relay Races

#### Days 1-3

- [ ] **Backend Specialist:** Relay race logic
  - [ ] 2 teams × N members each
  - [ ] 3-5 problems per relay
  - [ ] Members take turns (sequential)
  - [ ] Total time tracked

- [ ] **Frontend:** Relay UI
  - [ ] Show teams + current solver
  - [ ] Problem queue
  - [ ] Team score tracker
  - [ ] Turn notification

- [ ] **DevOps:** Relay socket events
  - [ ] `relay_started` → Teams + problems
  - [ ] `relay_turn_changed` → Next solver
  - [ ] `relay_problem_solved` → Points awarded
  - [ ] `relay_finished` → Winner + scores

#### Days 4-5

- [ ] **Backend Specialist:** House points aggregation
  - [ ] Battle points → House leaderboard
  - [ ] Relay points → House leaderboard
  - [ ] Daily/weekly snapshots in MongoDB

- [ ] **Frontend:** House dashboard
  - [ ] Show house score progression
  - [ ] Display recent battle/relay results
  - [ ] House-specific achievements

- [ ] **QA Lead:** Load test battles + relays
  - [ ] 10 simultaneous 1v1 battles
  - [ ] 5 simultaneous relay races
  - [ ] Verify no race conditions

### Friday (End of Sprint 3)

- [ ] **All:** Gamification demo
  - [ ] 1v1 battle playable end-to-end
  - [ ] Relay race playable (2 teams)
  - [ ] House leaderboard updated
  - [ ] Live updates for all watching

---

## Sprint 4: Week 8 — Polish & Launch

### Days 1-2 (Monday-Tuesday)

- [ ] **QA Lead:** Full regression testing
  - [ ] All endpoints tested
  - [ ] All UI components tested
  - [ ] Real-time events tested
  - [ ] Fix any critical bugs found

- [ ] **Frontend:** Polish UI
  - [ ] House theme CSS finalized
  - [ ] Animations for house transitions
  - [ ] Loading states + spinners
  - [ ] Error messages user-friendly

- [ ] **Backend:** Security hardening
  - [ ] Rate limiting on all endpoints
  - [ ] Input sanitization
  - [ ] SQL/NoSQL injection prevention
  - [ ] CORS properly configured

### Days 3-4 (Wednesday-Thursday)

- [ ] **QA Lead:** Load testing (Locust)
  - [ ] Ramp up to 1,000 concurrent WebSocket connections
  - [ ] Submit 50 codes/second
  - [ ] Verify no dropped connections
  - [ ] Document performance metrics

- [ ] **DevOps:** Deployment preparation
  - [ ] docker-compose.yml finalized
  - [ ] Environment variables documented (.env template)
  - [ ] Health checks configured for all services
  - [ ] Logging + monitoring setup (Prometheus)

- [ ] **Lead:** Documentation sprint
  - [ ] README with setup instructions
  - [ ] API documentation (Swagger/OpenAPI)
  - [ ] Architecture diagram
  - [ ] Deployment guide for college server

### Days 5 (Friday - Launch)

- [ ] **All:** Final pre-launch checklist
  - [ ] All tests passing: `npm test`, `pytest`
  - [ ] No console errors/warnings
  - [ ] No linting issues: `eslint`, `pylint`
  - [ ] Database migrated (fresh)
  - [ ] Sample data loaded (10 problems, 50 users)

- [ ] **DevOps:** Deploy to production/staging
  - [ ] Pull latest code from `main`
  - [ ] Run migrations
  - [ ] Start all services: `docker-compose up -d`
  - [ ] Smoke test: Submit code → Get result

- [ ] **QA Lead:** Final verification
  - [ ] Public demo link working
  - [ ] Can register, login, submit, see leaderboard
  - [ ] Battles work end-to-end
  - [ ] All house colors display correctly

- [ ] **Lead:** Demo presentation
  - [ ] 30-minute presentation for faculty/college
  - [ ] Show: Authentication → Problem solving → Leaderboard → Battles
  - [ ] Discuss architecture + scalability
  - [ ] Outline future features

- [ ] **All:** Code finalization
  - [ ] Final PR reviews + merges
  - [ ] Tag release: `v1.0.0-production`
  - [ ] Archive documentation

---

## Code Quality Targets

### Test Coverage

- [ ] Backend: 70%+ line coverage (pytest)
  ```bash
  pytest --cov=app tests/ --cov-report=html
  ```

- [ ] Frontend: 60%+ line coverage (React Testing)
  ```bash
  npm test -- --coverage
  ```

### Linting Standards

- [ ] Backend: 0 PEP8 errors
  ```bash
  pylint app/
  flake8 app/
  ```

- [ ] Frontend: 0 ESLint errors
  ```bash
  npm run lint
  ```

### Performance Benchmarks

| Metric | Target | Actual |
|--------|--------|--------|
| Code submission latency | <2 seconds | __ |
| Leaderboard query | <200ms | __ |
| WebSocket message delay | <100ms | __ |
| Judge0 execution | <5 seconds | __ |
| Complexity analysis | <500ms | __ |
| Concurrent connections | 1,000+ | __ |

---

## Risk & Contingency Checklist

### Critical Path Items (If Behind Schedule)

**Week 4-5:** If complexity analysis delayed
- [ ] Ship without Big-O scoring first
- [ ] Add complexity bonus in Week 6

**Week 6-7:** If battles not ready
- [ ] Ship leaderboard first (core feature)
- [ ] Defer battles to post-launch

**Week 8:** If deployment issues
- [ ] Ship to staging first
- [ ] Collect feedback for production v1.1

### Known Issues Tracker

| Issue | Status | Workaround | Sprint |
|-------|--------|-----------|--------|
| Judge0 sandbox escape CVE-2024-29021 | Known | Use latest image | 0 |
| Redis Sorted Set memory | Monitor | Implement TTL on old entries | 3 |
| Celery task loss on crash | Monitor | Redis persistence (AOF) | 1 |

---

## Team Communication Schedule

### Daily Standups
- **Time:** 4:00 PM IST
- **Format:** Slack/Discord voice call (15 min)
- **Questions:** What did I do? What will I do? Blockers?

### Weekly Planning
- **Monday 10:00 AM:** Sprint planning (30 min)
- **Friday 4:00 PM:** Sprint review + retro (30 min)

### Emergency Escalation
- **Blocker:** Post in #blockers channel
- **Critical issue:** @mention Lead in Slack
- **Production incident:** Video call immediately

---

## Tools & Resources

### Essential Tools

| Tool | Purpose | Setup |
|------|---------|-------|
| GitHub | Version control | Already in place |
| Docker | Local development | `brew install docker` |
| Postman | API testing | Desktop app |
| VS Code | Code editor | Extensions: Python, ESLint, Prettier |
| Discord | Team chat | Create `#coduku` channel |

### Documentation References

- Judge0 Docs: https://ce.judge0.com/
- Flask-SocketIO: https://flask-socketio.readthedocs.io/
- Redis Sorted Sets: https://redis.io/commands/zadd/
- Celery: https://docs.celeryproject.org/
- React 18: https://react.dev/

### Sample Data Script

```bash
# Load test problems + users
python scripts/load_sample_data.py --count 10_problems --users 50
```

---

## Launch Criteria Acceptance

### Go/No-Go Decision (Friday Week 8, 3:00 PM)

**MUST HAVE (All must pass):**
- [ ] Zero critical bugs
- [ ] All core features functional
- [ ] 70% backend test coverage
- [ ] 0 PEP8 linting errors
- [ ] Database backups working
- [ ] Monitoring/logging active

**SHOULD HAVE (80%+ required):**
- [ ] 60% frontend test coverage
- [ ] Load test passes (1,000 users)
- [ ] Documentation complete
- [ ] Demo presentation ready

**NICE TO HAVE (Optional for v1.0):**
- [ ] Plagiarism detection
- [ ] AI hints
- [ ] Advanced analytics
- [ ] Mobile app

**GO DECISION:**
If all MUST HAVEs + 80% SHOULD HAVEs → **LAUNCH**
Else → **DELAY 1 WEEK** for fixes

---

## Post-Launch (Week 9+)

- [ ] Monitor production logs
- [ ] Collect user feedback
- [ ] Fix high-priority bugs
- [ ] Plan v1.1 features (plagiarism, AI, mobile)
- [ ] Expand problem database (50→200+ problems)
- [ ] Promote platform in college

---

**Checklist Version:** 1.0  
**Last Updated:** March 28, 2026  
**Status:** Ready for Team Execution
