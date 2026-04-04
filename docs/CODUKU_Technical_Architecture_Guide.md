# CODUKU Technical Architecture & Implementation Guide

**Version:** 1.0  
**Date:** March 28, 2026  
**Status:** Production-Ready Specification  
**Team:** 5 Members | 8-Week Delivery  

---

## Table of Contents

1. [System Architecture Overview](#system-architecture-overview)
2. [Technology Stack Deep Dive](#technology-stack-deep-dive)
3. [Database Schema Design](#database-schema-design)
4. [API Specification](#api-specification)
5. [Real-Time Architecture](#real-time-architecture)
6. [Code Execution Pipeline](#code-execution-pipeline)
7. [Complexity Analysis Module](#complexity-analysis-module)
8. [Testing Strategy](#testing-strategy)
9. [Deployment Configuration](#deployment-configuration)
10. [Monitoring & Observability](#monitoring--observability)

---

## System Architecture Overview

### High-Level System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│  (React 18 + Monaco Editor + Socket.IO Client)                  │
└────────────┬────────────────────────────────────────────────────┘
             │ HTTP REST + WebSocket
             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API GATEWAY / FLASK                        │
│  • Authentication (JWT)                                          │
│  • Rate Limiting (Redis-backed)                                 │
│  • Request Routing                                              │
│  • SocketIO Event Handling                                      │
└────────────┬──────────────────────────────────────────────────┬─┘
             │                                                  │
             ▼                                                  ▼
┌──────────────────────────┐                    ┌──────────────────────┐
│  MONGODB                 │                    │  REDIS (Primary)     │
│  • Users                 │                    │  • Sessions          │
│  • Problems              │                    │  • Leaderboards      │
│  • Submissions           │                    │  • Cache Layer       │
│  • Battle Sessions       │                    │  • Message Queue     │
└──────────────────────────┘                    └──────────────────────┘
                                                         ▲
                                                         │
                    ┌────────────────────────────────────┘
                    │
                    ▼
        ┌───────────────────────────┐
        │   CELERY TASK QUEUE       │
        │  (Worker Pool)            │
        ├───────────────────────────┤
        │ • Judge0 Submission       │
        │ • Complexity Analysis     │
        │ • Plagiarism Check        │
        │ • Leaderboard Snapshot    │
        └───────────────────────────┘
                    │
                    ▼
        ┌───────────────────────────┐
        │   JUDGE0                  │
        │ (Secure Sandbox)          │
        │ 60+ Languages             │
        │ Docker-based Isolation    │
        └───────────────────────────┘
```

### Component Responsibilities

| Component | Role | Scaling |
|-----------|------|---------|
| **React Frontend** | User interface, code editor, real-time dashboards | Static CDN |
| **Flask API** | REST endpoints, auth, request validation | Horizontal (Gunicorn workers) |
| **MongoDB** | Persistent data storage | Replica set + sharding |
| **Redis** | Session cache, leaderboard ZSET, message broker | Cluster mode |
| **Judge0** | Code execution sandbox | Multiple instances, load-balanced |
| **Celery** | Async task processing | Worker scaling (10-50 workers) |

---

## Technology Stack Deep Dive

### Backend: Flask 3.0 + Python 3.12

#### Key Dependencies

```python
Flask==3.0.0
Flask-SocketIO==5.3.5
Flask-JWT-Extended==4.5.2
Flask-CORS==4.0.0
Flask-Limiter==3.5.0
celery==5.3.4
redis==5.0.1
pymongo==4.6.0
requests==2.31.0
gunicorn==21.2.0
eventlet==0.33.3
```

#### Project Structure

```
coduku-backend/
├── app/
│   ├── __init__.py           # Flask app factory
│   ├── models/
│   │   ├── user.py
│   │   ├── problem.py
│   │   ├── submission.py
│   │   └── battle.py
│   ├── routes/
│   │   ├── auth.py           # Login, registration
│   │   ├── submission.py      # Code submission, results
│   │   ├── leaderboard.py     # Ranking queries
│   │   ├── problem.py         # Problem management
│   │   └── battle.py          # Battle endpoints
│   ├── services/
│   │   ├── judge0.py          # Judge0 API wrapper
│   │   ├── complexity.py       # Big-O analyzer
│   │   ├── scoring.py          # Score calculation
│   │   └── leaderboard.py      # Redis operations
│   ├── tasks/
│   │   ├── execute_code.py     # Celery task
│   │   ├── analyze_complexity.py
│   │   └── update_leaderboard.py
│   ├── events/
│   │   ├── socketio_events.py  # WebSocket handlers
│   │   └── handlers.py
│   ├── middleware/
│   │   ├── auth.py             # JWT verification
│   │   ├── rate_limit.py        # Rate limiting
│   │   └── error_handler.py
│   └── utils/
│       ├── validators.py        # Input validation
│       ├── logger.py
│       └── config.py
├── tests/
│   ├── test_api.py
│   ├── test_judge0.py
│   ├── test_complexity.py
│   └── conftest.py
├── migrations/                 # Alembic (if using SQLAlchemy)
├── requirements.txt
├── wsgi.py                     # WSGI entry point
└── config.py                   # Environment configuration
```

### Frontend: React 18 + Vite

#### Key Dependencies

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "axios": "^1.6.0",
    "socket.io-client": "^4.7.2",
    "@monaco-editor/react": "^4.5.0",
    "react-router-dom": "^6.20.0",
    "zustand": "^4.4.1",
    "tailwindcss": "^3.3.6",
    "recharts": "^2.10.3"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.2.0",
    "@testing-library/react": "^14.1.2",
    "@testing-library/jest-dom": "^6.1.5"
  }
}
```

#### Component Structure

```
src/
├── components/
│   ├── Editor/
│   │   ├── CodeEditor.jsx      # Monaco wrapper
│   │   ├── LanguageSelector.jsx
│   │   └── TestCaseRunner.jsx
│   ├── Leaderboard/
│   │   ├── GlobalLeaderboard.jsx
│   │   ├── HouseLeaderboard.jsx
│   │   └── LeaderboardRow.jsx
│   ├── Battle/
│   │   ├── BattleArena.jsx
│   │   ├── BattleOpponent.jsx
│   │   └── BattleResultModal.jsx
│   ├── Navigation/
│   │   ├── Header.jsx
│   │   ├── Sidebar.jsx
│   │   └── HouseSelector.jsx
│   ├── Common/
│   │   ├── Loading.jsx
│   │   ├── ErrorBoundary.jsx
│   │   └── Toast.jsx
│   └── Dashboard/
│       ├── StudentDashboard.jsx
│       └── AdminDashboard.jsx
├── hooks/
│   ├── useAuth.js             # JWT token management
│   ├── useSocket.js            # Socket.IO connection
│   ├── useLeaderboard.js        # Real-time leaderboard
│   └── useSubmission.js         # Code submission logic
├── services/
│   ├── api.js                  # Axios instance + endpoints
│   ├── socket.js               # Socket.IO initialization
│   └── auth.js                 # Authentication service
├── store/
│   ├── authStore.js            # Zustand auth state
│   ├── leaderboardStore.js      # Real-time leaderboard state
│   └── battleStore.js           # Battle state management
├── styles/
│   ├── globals.css
│   ├── themes/
│   │   ├── gryffindor.css
│   │   ├── hufflepuff.css
│   │   ├── ravenclaw.css
│   │   └── slytherin.css
│   └── components/
├── utils/
│   ├── formatters.js
│   ├── validators.js
│   └── constants.js
└── App.jsx
```

---

## Database Schema Design

### MongoDB Collections

#### Users Collection

```javascript
{
  "_id": ObjectId,
  "username": String,
  "email": String,
  "password_hash": String,
  "house": "gryffindor" | "hufflepuff" | "ravenclaw" | "slytherin",
  "avatar_url": String,
  "bio": String,
  "created_at": ISODate,
  "updated_at": ISODate,
  "role": "student" | "admin" | "moderator",
  "stats": {
    "total_submissions": Number,
    "total_accepted": Number,
    "total_score": Number,
    "level": Number  // Based on experience
  },
  "profile": {
    "college": String,
    "branch": String,
    "year": Number
  }
}
```

#### Problems Collection

```javascript
{
  "_id": ObjectId,
  "title": String,
  "description": String,
  "difficulty": "easy" | "medium" | "hard",
  "tags": [String],
  "test_cases": [
    {
      "input": String,
      "expected_output": String,
      "description": String
    }
  ],
  "time_limit_ms": Number,  // Default: 1000
  "memory_limit_mb": Number, // Default: 64
  "solution_language": String,
  "solution_code": String,  // Reference only
  "acceptance_rate": Number,
  "submissions_count": Number,
  "created_at": ISODate,
  "created_by": ObjectId,  // User reference
  "constraints": {
    "min_length": Number,
    "max_length": Number
  }
}
```

#### Submissions Collection

```javascript
{
  "_id": ObjectId,
  "user_id": ObjectId,
  "problem_id": ObjectId,
  "source_code": String,
  "language_id": Number,  // Judge0 language ID
  "status": "pending" | "accepted" | "wrong_answer" | "runtime_error" | "time_limit_exceeded",
  "execution_time_ms": Number,
  "memory_used_mb": Number,
  "judge0_token": String,
  "judge0_response": Object,  // Full response from Judge0
  "test_cases_passed": Number,
  "test_cases_total": Number,
  "stdout": String,
  "stderr": String,
  "compile_output": String,
  "complexity_analysis": {
    "big_o": "O(1)" | "O(log n)" | "O(n)" | "O(n log n)" | "O(n²)" | "O(2^n)" | "Unknown",
    "space_complexity": String,
    "confidence": Number,  // 0.0-1.0
    "loops": [
      {
        "type": "for" | "while" | "recursion",
        "depth": Number,
        "variable": String
      }
    ]
  },
  "score": {
    "base_score": Number,
    "complexity_bonus": Number,
    "speed_bonus": Number,
    "total_score": Number
  },
  "submitted_at": ISODate,
  "completed_at": ISODate
}
```

#### Battle Sessions Collection

```javascript
{
  "_id": ObjectId,
  "battle_type": "1v1" | "relay" | "team_vs_team",
  "participants": [
    {
      "user_id": ObjectId,
      "house": String,
      "current_score": Number,
      "problems_solved": Number,
      "ready": Boolean
    }
  ],
  "problems": [ObjectId],  // Problem references
  "status": "waiting" | "in_progress" | "completed",
  "winner_id": ObjectId,
  "created_at": ISODate,
  "started_at": ISODate,
  "ended_at": ISODate,
  "duration_seconds": Number,
  "rounds": [
    {
      "problem_id": ObjectId,
      "submission_id": ObjectId,
      "solver_id": ObjectId,
      "time_taken_ms": Number
    }
  ]
}
```

### Redis Key Schema

```
# Leaderboards (Sorted Sets)
leaderboard:global → ZSET(user_id, score)
leaderboard:house:{house} → ZSET(user_id, score)
leaderboard:problem:{problem_id} → ZSET(user_id, score)
leaderboard:weekly:{week_number} → ZSET(user_id, score)

# Cache (Strings)
cache:user:{user_id} → JSON(user object) [TTL: 3600s]
cache:problem:{problem_id} → JSON(problem object) [TTL: 7200s]
cache:leaderboard:top:100 → JSON(top 100 users) [TTL: 300s]

# Sessions (Hashes)
session:{token} → HASH(user_id, email, house) [TTL: 86400s]

# Rate Limiting (Strings with expiry)
rate_limit:submit:{user_id} → Counter [TTL: 60s]
rate_limit:api:{ip} → Counter [TTL: 60s]

# Battle State (Hashes)
battle:{battle_id} → HASH(status, participants, score_state)
battle_queue → LIST (user_ids waiting for match)
```

---

## API Specification

### Authentication Endpoints

#### POST /api/auth/register

Register a new user.

**Request:**
```json
{
  "username": "john_doe",
  "email": "john@college.edu",
  "password": "SecurePass123",
  "house": "gryffindor"
}
```

**Response (201):**
```json
{
  "user_id": "507f1f77bcf86cd799439011",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": 86400
}
```

#### POST /api/auth/login

Login existing user.

**Request:**
```json
{
  "email": "john@college.edu",
  "password": "SecurePass123"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "user_id": "507f1f77bcf86cd799439011",
    "username": "john_doe",
    "house": "gryffindor"
  }
}
```

### Submission Endpoints

#### POST /api/submit

Submit code for execution.

**Request:**
```json
{
  "source_code": "print('Hello, World!')",
  "language_id": 71,
  "problem_id": "507f1f77bcf86cd799439012"
}
```

**Response (202):**
```json
{
  "submission_id": "507f1f77bcf86cd799439013",
  "status": "pending",
  "message": "Your submission is being processed"
}
```

#### GET /api/submission/{submission_id}

Get submission status and results.

**Response (200):**
```json
{
  "submission_id": "507f1f77bcf86cd799439013",
  "status": "accepted",
  "execution_time_ms": 42,
  "memory_used_mb": 8,
  "test_cases_passed": 5,
  "test_cases_total": 5,
  "score": {
    "base_score": 100,
    "complexity_bonus": 20,
    "speed_bonus": 10,
    "total_score": 130
  },
  "complexity_analysis": {
    "big_o": "O(n)",
    "confidence": 0.95
  }
}
```

### Leaderboard Endpoints

#### GET /api/leaderboard

Get global leaderboard (top 100).

**Query Parameters:**
- `limit`: 10-100 (default: 50)
- `offset`: 0+ (default: 0)
- `scope`: "global" | "house" | "problem" (default: "global")
- `house`: Filter by house (optional)

**Response (200):**
```json
{
  "leaderboard": [
    {
      "rank": 1,
      "user_id": "507f1f77bcf86cd799439011",
      "username": "alice",
      "house": "ravenclaw",
      "score": 5420,
      "problems_solved": 18
    },
    {
      "rank": 2,
      "user_id": "507f1f77bcf86cd799439012",
      "username": "bob",
      "house": "gryffindor",
      "score": 5100,
      "problems_solved": 16
    }
  ],
  "total_count": 250,
  "timestamp": "2026-03-28T10:30:00Z"
}
```

#### GET /api/leaderboard/house/{house}

Get house-specific leaderboard.

**Response:** Same format as global leaderboard.

### Battle Endpoints

#### POST /api/battle/start

Initiate a 1v1 battle.

**Request:**
```json
{
  "battle_type": "1v1",
  "difficulty": "medium"
}
```

**Response (201):**
```json
{
  "battle_id": "507f1f77bcf86cd799439014",
  "status": "waiting_for_opponent",
  "problem": {
    "id": "507f1f77bcf86cd799439015",
    "title": "Two Sum",
    "description": "...",
    "time_limit_ms": 2000
  },
  "participants": [
    {
      "user_id": "507f1f77bcf86cd799439011",
      "username": "alice",
      "ready": true
    }
  ]
}
```

#### POST /api/battle/{battle_id}/submit

Submit solution during battle.

**Request:**
```json
{
  "source_code": "...",
  "language_id": 71
}
```

**Response (202):**
```json
{
  "battle_id": "507f1f77bcf86cd799439014",
  "status": "accepted",
  "time_taken_ms": 1234,
  "score_gained": 100,
  "current_score": 100
}
```

---

## Real-Time Architecture

### Flask-SocketIO Event Flow

#### Client → Server Events

```javascript
// Submission event
socket.emit('submit_code', {
  source_code: '...',
  language_id: 71,
  problem_id: '...'
});

// Battle action
socket.emit('battle_action', {
  battle_id: '...',
  action: 'submit_solution',
  payload: { source_code: '...', language_id: 71 }
});

// Join leaderboard updates
socket.emit('join_leaderboard', {
  scope: 'global',  // or 'house:gryffindor'
  limit: 100
});
```

#### Server → Client Events (Broadcasts)

```javascript
// Score updated
socket.on('score_updated', (data) => {
  // data = { user_id, new_score, rank, house }
  console.log(`${data.user_id} scored ${data.new_score}`);
  updateLeaderboard(data);
});

// Battle started
socket.on('battle_started', (data) => {
  // data = { battle_id, opponent, problem, time_limit }
  startBattle(data);
});

// Battle result
socket.on('battle_result', (data) => {
  // data = { battle_id, winner_id, final_scores }
  showBattleResult(data);
});

// Leaderboard snapshot
socket.on('leaderboard_update', (data) => {
  // data = { leaderboard: [{rank, user, score}], timestamp }
  renderLeaderboard(data.leaderboard);
});
```

### Message Queue Pattern

```python
# Backend: When submission completes
@socketio.on('submission_complete', namespace='/submissions')
def handle_submission_complete(data):
    """
    Broadcast to all users in leaderboard room
    """
    socketio.emit(
        'score_updated',
        {
            'user_id': data['user_id'],
            'new_score': data['new_score'],
            'rank': data['rank'],
            'house': data['house']
        },
        room='leaderboard:global',
        namespace='/leaderboard'
    )
    
    # Also update house leaderboard
    socketio.emit(
        'score_updated',
        data,
        room=f'leaderboard:house:{data["house"]}',
        namespace='/leaderboard'
    )
```

### Redis Pub/Sub Integration

```python
# Worker publishes to Redis channel
redis_client.publish('leaderboard_updates', json.dumps({
    'user_id': submission.user_id,
    'new_score': new_score,
    'timestamp': datetime.now().isoformat()
}))

# Flask subscribes and broadcasts via Socket.IO
@app.before_request
def subscribe_to_redis():
    """Subscribe to Redis channels on app startup"""
    def redis_listener():
        pubsub = redis_client.pubsub()
        pubsub.subscribe('leaderboard_updates', 'battle_events')
        
        for message in pubsub.listen():
            if message['type'] == 'message':
                if message['channel'] == b'leaderboard_updates':
                    socketio.emit('score_updated', json.loads(message['data']))
                elif message['channel'] == b'battle_events':
                    socketio.emit('battle_update', json.loads(message['data']))
    
    thread = threading.Thread(target=redis_listener, daemon=True)
    thread.start()
```

---

## Code Execution Pipeline

### Judge0 Integration Sequence

```
1. User submits code (POST /api/submit)
   ↓
2. Flask validates input, creates Submission record (status: pending)
   ↓
3. Enqueue Celery task: execute_submission.delay(submission_id)
   ↓
4. Celery Worker receives task
   ↓
5. Worker calls judge0_client.create_submission({
     source_code: code,
     language_id: 71,
     stdin: test_case_input,
     expected_output: test_case_expected,
     time_limit: 1000,
     memory_limit: 64000
   })
   ↓
6. Judge0 returns submission token (async)
   ↓
7. Worker polls Judge0 API: /submissions/{token} (every 500ms)
   ↓
8. Judge0 returns result {
     status: { id: 3, description: "Accepted" },
     stdout: "expected output",
     stderr: null,
     time: "0.042",
     memory: 8192
   }
   ↓
9. Worker stores result in MongoDB submission document
   ↓
10. Worker calculates complexity bonus via AST analysis
   ↓
11. Worker updates Redis ZSET:
    ZADD leaderboard:global {score} {user_id}
    ZADD leaderboard:house:{house} {score} {user_id}
   ↓
12. Worker publishes Redis event: leaderboard_updates
   ↓
13. Flask receives event, broadcasts via Socket.IO to all clients
   ↓
14. Client receives 'score_updated' event, re-renders leaderboard
```

### Celery Task Definition

```python
# tasks.py
from celery import shared_task
from app.services.judge0 import Judge0Client
from app.services.complexity import ComplexityAnalyzer
from app.services.scoring import calculate_score

judge0 = Judge0Client()
complexity = ComplexityAnalyzer()

@shared_task(
    bind=True,
    max_retries=3,
    default_retry_delay=60,
    time_limit=30000  # 30 second timeout
)
def execute_submission(self, submission_id: str):
    """
    Execute user code against test cases
    """
    try:
        submission = Submission.objects(id=submission_id).first()
        if not submission:
            raise ValueError(f"Submission {submission_id} not found")
        
        problem = Problem.objects(id=submission.problem_id).first()
        test_cases = problem.test_cases
        
        # Execute each test case
        passed = 0
        judge0_responses = []
        
        for test_case in test_cases:
            response = judge0.submit(
                source_code=submission.source_code,
                language_id=submission.language_id,
                stdin=test_case['input'],
                expected_output=test_case['expected_output'],
                time_limit_ms=problem.time_limit_ms,
                memory_limit_mb=problem.memory_limit_mb
            )
            
            judge0_responses.append(response)
            if response['status']['id'] == 3:  # Accepted
                passed += 1
        
        # Update submission with results
        submission.test_cases_passed = passed
        submission.test_cases_total = len(test_cases)
        
        if passed == len(test_cases):
            submission.status = 'accepted'
        else:
            submission.status = 'wrong_answer'
        
        submission.judge0_response = judge0_responses[0]  # Latest response
        submission.completed_at = datetime.now()
        submission.save()
        
        # Analyze complexity
        complexity_analysis = complexity.analyze(
            source_code=submission.source_code,
            language=submission.language_id
        )
        submission.complexity_analysis = complexity_analysis
        
        # Calculate score
        score = calculate_score(
            submission=submission,
            complexity_analysis=complexity_analysis,
            problem=problem
        )
        submission.score = score
        submission.save()
        
        # Update leaderboard
        update_leaderboard_task.delay(submission.user_id, score['total_score'])
        
        return {
            'submission_id': str(submission_id),
            'status': submission.status,
            'score': score['total_score']
        }
        
    except Exception as exc:
        # Retry with exponential backoff
        raise self.retry(exc=exc, countdown=2 ** self.request.retries)
```

---

## Complexity Analysis Module

### AST-Based Big-O Detection

```python
# complexity.py
import ast
import inspect

class ComplexityAnalyzer:
    """
    Analyzes Python code AST to estimate Big-O complexity
    """
    
    def __init__(self):
        self.loop_depth = 0
        self.recursive = False
        self.operations = []
    
    def analyze(self, source_code: str, language: int = 71) -> dict:
        """
        Analyze code and return complexity estimate
        """
        if language != 71:  # Python only for now
            return {'big_o': 'Unknown', 'confidence': 0.0}
        
        try:
            tree = ast.parse(source_code)
            self._walk_tree(tree)
            
            return {
                'big_o': self._infer_complexity(),
                'space_complexity': self._infer_space(),
                'confidence': self._get_confidence(),
                'loops': self.operations,
                'is_recursive': self.recursive
            }
        except SyntaxError:
            return {'big_o': 'Unknown', 'confidence': 0.0}
    
    def _walk_tree(self, node):
        """Traverse AST and identify complexity patterns"""
        for child in ast.walk(node):
            if isinstance(child, (ast.For, ast.While)):
                self.operations.append({
                    'type': 'loop',
                    'depth': self.loop_depth,
                    'line': child.lineno
                })
                self.loop_depth += 1
                self._walk_tree(child)
                self.loop_depth -= 1
            
            elif isinstance(child, ast.Call):
                if isinstance(child.func, ast.Name):
                    if child.func.id in ['sorted', 'list.sort']:
                        self.operations.append({
                            'type': 'sort',
                            'line': child.lineno
                        })
            
            elif isinstance(child, ast.FunctionDef):
                # Check for recursion
                for subnode in ast.walk(child):
                    if isinstance(subnode, ast.Call):
                        if isinstance(subnode.func, ast.Name):
                            if subnode.func.id == child.name:
                                self.recursive = True
    
    def _infer_complexity(self) -> str:
        """Map operations to Big-O"""
        if self.recursive:
            return "O(2^n)"  # Naive estimate for recursion
        
        max_loop_depth = max(
            [op['depth'] for op in self.operations if op.get('type') == 'loop'],
            default=0
        )
        
        if max_loop_depth == 0:
            return "O(1)"
        elif max_loop_depth == 1:
            if any(op['type'] == 'sort' for op in self.operations):
                return "O(n log n)"
            return "O(n)"
        elif max_loop_depth == 2:
            return "O(n²)"
        else:
            return "O(n³)"
    
    def _infer_space(self) -> str:
        """Estimate space complexity"""
        # Simplified: track list/dict creations
        return "O(n)"
    
    def _get_confidence(self) -> float:
        """Return confidence score (0.0-1.0)"""
        if self.recursive:
            return 0.6  # Lower confidence for recursion
        return 0.85
```

### Scoring Multipliers

```python
# scoring.py

BASE_SCORE = 100  # Full points for correct solution

COMPLEXITY_MULTIPLIERS = {
    'O(1)': 1.2,      # +20%
    'O(log n)': 1.15, # +15%
    'O(n)': 1.0,      # No change
    'O(n log n)': 0.95, # -5%
    'O(n²)': 0.85,    # -15%
    'O(n³)': 0.70,    # -30%
    'O(2^n)': 0.5,    # -50%
    'Unknown': 1.0    # No change
}

SPEED_MULTIPLIERS = {
    'very_fast': 1.1,   # <100ms: +10%
    'fast': 1.05,       # <500ms: +5%
    'normal': 1.0,      # <1000ms: No change
    'slow': 0.95,       # <2000ms: -5%
    'very_slow': 0.9    # >2000ms: -10%
}

def calculate_score(submission, complexity_analysis, problem):
    """
    Calculate final score with bonuses
    """
    base = BASE_SCORE
    
    # Complexity bonus
    complexity_key = complexity_analysis['big_o']
    complexity_mult = COMPLEXITY_MULTIPLIERS.get(complexity_key, 1.0)
    
    # Speed bonus
    exec_time_ms = submission.execution_time_ms
    if exec_time_ms < 100:
        speed_mult = SPEED_MULTIPLIERS['very_fast']
    elif exec_time_ms < 500:
        speed_mult = SPEED_MULTIPLIERS['fast']
    elif exec_time_ms < 1000:
        speed_mult = SPEED_MULTIPLIERS['normal']
    elif exec_time_ms < 2000:
        speed_mult = SPEED_MULTIPLIERS['slow']
    else:
        speed_mult = SPEED_MULTIPLIERS['very_slow']
    
    complexity_bonus = int(base * (complexity_mult - 1.0))
    speed_bonus = int(base * (speed_mult - 1.0))
    total = base + complexity_bonus + speed_bonus
    
    return {
        'base_score': base,
        'complexity_bonus': complexity_bonus,
        'speed_bonus': speed_bonus,
        'total_score': total
    }
```

---

## Testing Strategy

### Backend Testing (pytest)

```python
# tests/test_submission.py
import pytest
from app import create_app, db
from app.models import User, Problem, Submission

@pytest.fixture
def app():
    app = create_app('testing')
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def auth_token(client):
    client.post('/api/auth/register', json={
        'username': 'testuser',
        'email': 'test@college.edu',
        'password': 'Test123!',
        'house': 'gryffindor'
    })
    response = client.post('/api/auth/login', json={
        'email': 'test@college.edu',
        'password': 'Test123!'
    })
    return response.json['token']

class TestSubmissionAPI:
    def test_submit_code_pending(self, client, auth_token):
        response = client.post(
            '/api/submit',
            json={
                'source_code': 'print("Hello")',
                'language_id': 71,
                'problem_id': '507f1f77bcf86cd799439012'
            },
            headers={'Authorization': f'Bearer {auth_token}'}
        )
        assert response.status_code == 202
        assert response.json['status'] == 'pending'
    
    def test_get_submission_result(self, client, auth_token):
        # Submit first
        submit_response = client.post('/api/submit', ...)
        submission_id = submit_response.json['submission_id']
        
        # Poll for result
        result_response = client.get(
            f'/api/submission/{submission_id}',
            headers={'Authorization': f'Bearer {auth_token}'}
        )
        assert result_response.status_code == 200
        assert 'status' in result_response.json

class TestLeaderboard:
    def test_get_global_leaderboard(self, client):
        response = client.get('/api/leaderboard?limit=50')
        assert response.status_code == 200
        assert 'leaderboard' in response.json
        assert len(response.json['leaderboard']) <= 50
    
    def test_get_house_leaderboard(self, client):
        response = client.get('/api/leaderboard/house/gryffindor')
        assert response.status_code == 200
        # All results should be from gryffindor
        for user in response.json['leaderboard']:
            assert user['house'] == 'gryffindor'
```

### Frontend Testing (React Testing Library)

```javascript
// tests/components/CodeEditor.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import { CodeEditor } from '../../src/components/Editor/CodeEditor';

describe('CodeEditor', () => {
  it('renders with initial code', () => {
    render(<CodeEditor initialCode="print('hello')" />);
    expect(screen.getByText(/print/)).toBeInTheDocument();
  });

  it('handles language selection', () => {
    const { getByRole } = render(<CodeEditor />);
    const select = getByRole('combobox', { name: /language/i });
    fireEvent.change(select, { target: { value: 'javascript' } });
    expect(select.value).toBe('javascript');
  });

  it('emits code on submit', () => {
    const onSubmit = jest.fn();
    render(<CodeEditor onSubmit={onSubmit} />);
    const button = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(button);
    expect(onSubmit).toHaveBeenCalled();
  });
});
```

### Load Testing (Locust)

```python
# load_tests/locustfile.py
from locust import HttpUser, task, constant_throughput

class CodeExecutionUser(HttpUser):
    wait_time = constant_throughput(1)  # 1 request per second
    
    @task(3)
    def submit_code(self):
        self.client.post(
            '/api/submit',
            json={
                'source_code': 'print("hello")',
                'language_id': 71,
                'problem_id': '507f1f77bcf86cd799439012'
            },
            headers={'Authorization': f'Bearer {self.token}'}
        )
    
    @task(1)
    def get_leaderboard(self):
        self.client.get('/api/leaderboard?limit=100')
    
    def on_start(self):
        # Login once
        response = self.client.post('/api/auth/login', json={
            'email': 'loadtest@college.edu',
            'password': 'LoadTest123!'
        })
        self.token = response.json()['token']
```

---

## Deployment Configuration

### docker-compose.yml

```yaml
version: '3.8'

services:
  # Frontend
  frontend:
    build:
      context: ./coduku-frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      REACT_APP_API_URL: http://localhost:5000
      REACT_APP_WS_URL: ws://localhost:5000/socket.io
    depends_on:
      - backend
    networks:
      - coduku_network

  # Backend API
  backend:
    build:
      context: ./coduku-backend
      dockerfile: Dockerfile
    ports:
      - "5000:5000"
    environment:
      MONGODB_URI: mongodb://mongo:27017/coduku
      REDIS_URL: redis://redis:6379/0
      JUDGE0_API_URL: http://judge0:2358
      CELERY_BROKER_URL: redis://redis:6379/1
      JWT_SECRET_KEY: ${JWT_SECRET_KEY:-dev-secret-key}
    depends_on:
      - mongo
      - redis
      - judge0
    networks:
      - coduku_network
    command: gunicorn --worker-class eventlet -w 1 --bind 0.0.0.0:5000 wsgi:app

  # Celery Worker
  celery_worker:
    build:
      context: ./coduku-backend
      dockerfile: Dockerfile
    environment:
      MONGODB_URI: mongodb://mongo:27017/coduku
      REDIS_URL: redis://redis:6379/0
      JUDGE0_API_URL: http://judge0:2358
      CELERY_BROKER_URL: redis://redis:6379/1
    depends_on:
      - mongo
      - redis
      - judge0
      - backend
    networks:
      - coduku_network
    command: celery -A app.tasks worker --loglevel=info --concurrency=10

  # MongoDB
  mongo:
    image: mongo:7.0
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db
    environment:
      MONGO_INITDB_DATABASE: coduku
    networks:
      - coduku_network
    healthcheck:
      test: echo 'db.runCommand("ping").ok' | mongosh localhost:27017/test --quiet
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis
  redis:
    image: redis:7.0-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - coduku_network
    command: redis-server --appendonly yes
    healthcheck:
      test: redis-cli ping
      interval: 10s
      timeout: 5s
      retries: 5

  # Judge0
  judge0:
    image: judge0/judge0:latest
    ports:
      - "2358:2358"
    environment:
      WORKERS: 4
      MAX_CPU_TIME: 5
      MAX_MEMORY: 262144
    networks:
      - coduku_network
    healthcheck:
      test: curl -f http://localhost:2358/health || exit 1
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  mongo_data:
  redis_data:

networks:
  coduku_network:
    driver: bridge
```

---

## Monitoring & Observability

### Prometheus Metrics

```python
# app/metrics.py
from prometheus_client import Counter, Histogram, Gauge
import time

# Counters
submissions_counter = Counter(
    'coduku_submissions_total',
    'Total submissions received',
    ['status']  # pending, accepted, wrong_answer, error
)

battles_counter = Counter(
    'coduku_battles_total',
    'Total battles created',
    ['type']  # 1v1, relay, team
)

# Histograms
execution_time = Histogram(
    'coduku_execution_time_seconds',
    'Code execution time',
    buckets=(0.1, 0.5, 1.0, 2.0, 5.0)
)

leaderboard_query_time = Histogram(
    'coduku_leaderboard_query_seconds',
    'Leaderboard query latency',
    buckets=(0.01, 0.05, 0.1, 0.5)
)

# Gauges
active_websocket_connections = Gauge(
    'coduku_active_websocket_connections',
    'Current WebSocket connections'
)

celery_queue_depth = Gauge(
    'coduku_celery_queue_depth',
    'Number of pending Celery tasks'
)
```

### Logging Configuration

```python
# app/utils/logger.py
import logging
import json
from pythonjsonlogger import jsonlogger

def setup_logging():
    """Configure structured JSON logging"""
    logger = logging.getLogger()
    
    # JSON formatter
    logHandler = logging.StreamHandler()
    formatter = jsonlogger.JsonFormatter()
    logHandler.setFormatter(formatter)
    logger.addHandler(logHandler)
    logger.setLevel(logging.INFO)
    
    return logger

logger = setup_logging()

# Usage
logger.info("User submitted code", extra={
    'user_id': user_id,
    'problem_id': problem_id,
    'language': language,
    'code_length': len(source_code)
})
```

---

## Conclusion

This specification provides a complete blueprint for implementing CODUKU as a production-grade system. The architecture leverages proven technologies (Judge0, Redis, Celery, Flask-SocketIO) in patterns validated at scale by leading competitive programming platforms.

Key principles:
1. **Asynchronous execution** prevents blocking during code evaluation
2. **Real-time leaderboards** using Redis Sorted Sets provide O(log N) updates
3. **Complexity analysis** differentiates from existing platforms
4. **Robust testing** at multiple levels (unit, integration, load)
5. **Container-based deployment** enables college server deployment

With disciplined execution and agile rituals, the 5-person team will deliver a system that becomes the standard for collegiate competitive programming.

---

**Document Version:** 1.0  
**Last Updated:** March 28, 2026  
**Status:** Ready for Development
