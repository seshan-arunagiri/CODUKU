# 🎯 CODUKU API DOCUMENTATION & INTEGRATION GUIDE

## Service Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React/Next.js)               │
│                        Port: 3000                           │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│            NGINX API Gateway (Port: 80/443)                 │
│    Routes requests to microservices based on URL paths      │
└─┬──────────────┬──────────────┬──────────────┬──────────────┘
  │              │              │              │
  ▼              ▼              ▼              ▼
┌──────────────────────────────────────────────────────────────┐
│  Auth          │ Judge       │ Leaderboard  │ Mentor/AI   │
│  Service       │ Service     │ Service      │ Service     │
│  Port: 8001    │ Port: 8002  │ Port: 8003   │ Port: 8004  │
│  • Register    │ • Execute   │ • Ranking    │ • Tutoring  │
│  • Login       │ • Submit    │ • Scores     │ • RAG       │
│  • JWT Auth    │ • WebSocket │ • Updates    │ • ChatBot   │
└──────────────────────────────────────────────────────────────┘
  │              │              │              │
  └──────────────┴──────────────┴──────────────┘
            │
┌───────────▼──────────────────────────────────────────────────┐
│                  Shared Infrastructure                        │
├───────────────────────────────────────────────────────────────┤
│ • PostgreSQL (Port 5432) - Main database                     │
│ • Redis (Port 6379) - Cache & Pub/Sub messaging              │
│ • Judge0 (Port 2358) - Code execution engine                 │
│ • ChromaDB (Port 8000) - Vector embeddings for RAG           │
└───────────────────────────────────────────────────────────────┘
```

---

## 🔐 AUTH SERVICE API

**Base URL**: `http://localhost/api/v1/auth/`

### 1. Register User

```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@college.edu",
  "username": "harrypotter",
  "password": "SecurePass123!",
  "house": "gryffindor"
}
```

**Response** (200):
```json
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer",
  "user_id": "usr_123",
  "email": "user@college.edu",
  "username": "harrypotter",
  "house": "gryffindor",
  "message": "Welcome! You've been sorted into Gryffindor! 🧙"
}
```

### 2. Login

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@college.edu",
  "password": "SecurePass123!"
}
```

### 3. Get Current User

```http
GET /api/v1/auth/me
Authorization: Bearer eyJhbGc...

Response (200):
{
  "user_id": "usr_123",
  "email": "user@college.edu",
  "username": "harrypotter",
  "house": "gryffindor",
  "created_at": "2026-04-01T10:00:00Z",
  "rank": 42,
  "score": 2500
}
```

---

## ⚖️ JUDGE SERVICE API

**Base URL**: `http://localhost/api/v1/`

### 1. Submit Code

```http
POST /api/v1/submissions/
Authorization: Bearer eyJhbGc...
Content-Type: application/json

{
  "problem_id": 1,
  "language": "python3",
  "source_code": "def solve():\n    return 42"
}
```

**Response** (202 Accepted):
```json
{
  "submission_id": "sub_abc123",
  "status": "pending",
  "user_id": "usr_123",
  "problem_id": 1,
  "language": "python3",
  "created_at": "2026-04-01T10:05:30Z"
}
```

### 2. Get Submission Status

```http
GET /api/v1/submissions/{submission_id}
Authorization: Bearer eyJhbGc...
```

**Response** (200):
```json
{
  "submission_id": "sub_abc123",
  "status": "accepted",
  "verdict": "AC",
  "runtime_ms": 45,
  "memory_kb": 2048,
  "output": "42",
  "expected_output": "42",
  "test_cases_passed": 100,
  "test_cases_total": 100,
  "score": 100,
  "timestamp": "2026-04-01T10:06:00Z"
}
```

**Status Values**:
- `pending` - Waiting to execute
- `compiling` - Compiling source code
- `running` - Executing on test cases
- `accepted` - All tests passed ✅
- `wrong_answer` - Output doesn't match ❌
- `runtime_error` - Code crashed 💥
- `time_limit_exceeded` - Too slow ⏱️
- `memory_limit_exceeded` - Used too much RAM 🗜️
- `compilation_error` - Syntax error 🔴

### 3. List Problems

```http
GET /api/v1/questions/?skip=0&limit=20
```

**Response** (200):
```json
{
  "total": 150,
  "problems": [
    {
      "id": 1,
      "title": "Two Sum",
      "difficulty": "easy",
      "acceptance_rate": 92.5,
      "attempts": 5000,
      "accepted": 4625,
      "description": "Given an array of integers...",
      "constraints": ["1 <= nums.length <= 10^4"],
      "examples": [...]
    }
  ]
}
```

### 4. WebSocket - Real-Time Updates

```javascript
// Connect to WebSocket
const ws = new WebSocket('ws://localhost/ws/client-123?user_id=usr_123');

ws.onopen = () => {
  // Subscribe to leaderboard updates
  ws.send(JSON.stringify({ type: 'subscribe_leaderboard' }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  if (data.type === 'submission_result') {
    console.log('Submission result:', data.data);
    // {
    //   submission_id: "sub_123",
    //   status: "accepted",
    //   score: 100,
    //   user_id: "usr_123",
    //   timestamp: "2026-04-01T10:06:00Z"
    // }
  }
  
  if (data.type === 'leaderboard_update') {
    console.log('Leaderboard update:', data.data);
    // {
    //   user_id: "usr_123",
    //   new_score: 2600,
    //   rank: 41,
    //   timestamp: "2026-04-01T10:06:00Z"
    // }
  }
};
```

---

## 📊 LEADERBOARD SERVICE API

**Base URL**: `http://localhost/api/v1/leaderboards/`

### 1. Global Leaderboard

```http
GET /api/v1/leaderboards/global?limit=100&offset=0
```

**Response** (200):
```json
{
  "leaderboard": "global",
  "users": [
    {
      "rank": 1,
      "user_id": "usr_456",
      "username": "albus",
      "house": "ravenclaw",
      "score": 5000,
      "problems_solved": 50,
      "submission_count": 125,
      "success_rate": 40.0
    },
    {
      "rank": 2,
      "user_id": "usr_123",
      "username": "harrypotter",
      "house": "gryffindor",
      "score": 4800,
      "problems_solved": 48,
      "submission_count": 120,
      "success_rate": 40.0
    }
  ],
  "total": 500,
  "generated_at": "2026-04-01T10:07:00Z"
}
```

### 2. House Leaderboards

```http
GET /api/v1/leaderboards/houses
```

**Response** (200):
```json
{
  "gryffindor": {
    "rank": 1,
    "total_score": 150000,
    "members": 50,
    "average_score": 3000,
    "house_color": "#D91E63",
    "top_members": [
      {
        "rank": 1,
        "username": "harrypotter",
        "score": 2600
      }
    ]
  },
  "slytherin": {
    "rank": 2,
    "total_score": 145000,
    "members": 48,
    ...
  },
  "ravenclaw": {
    "rank": 3,
    ...
  },
  "hufflepuff": {
    "rank": 4,
    ...
  }
}
```

### 3. User Rank

```http
GET /api/v1/leaderboards/user/{user_id}
Authorization: Bearer eyJhbGc...
```

**Response** (200):
```json
{
  "user_id": "usr_123",
  "username": "harrypotter",
  "rank": 42,
  "global_rank": 42,
  "house_rank": 5,
  "score": 2600,
  "house": "gryffindor",
  "problems_solved": 48,
  "submission_count": 120,
  "success_rate": 40.0,
  "streak": 5,
  "last_submission": "2026-04-01T10:06:00Z"
}
```

---

## 🧙 MENTOR/AI SERVICE API

**Base URL**: `http://localhost/api/v1/mentor/`

### 1. Get AI Hint

```http
POST /api/v1/mentor/hint
Authorization: Bearer eyJhbGc...
Content-Type: application/json

{
  "problem_id": 1,
  "hint_level": 1,
  "language": "python3"
}
```

**Hint Levels**:
- 1 = Conceptual hint (think about the algorithm)
- 2 = Code structure hint (how to organize code)
- 3 = Implementation hint (specific functions)
- 4 = Debug hint (test case specific)

**Response** (200):
```json
{
  "problem_id": 1,
  "hint_level": 1,
  "hint": "Think about using a hash map to store previously seen values for O(1) lookup.",
  "confidence": 0.95,
  "related_problems": [2, 15, 167]
}
```

### 2. Chat with Tutor

```http
POST /api/v1/mentor/chat
Authorization: Bearer eyJhbGc...
Content-Type: application/json

{
  "problem_id": 1,
  "message": "I'm stuck on the two pointer approach",
  "context": {
    "submission_id": "sub_123",
    "language": "python3",
    "code": "def twoSum(nums, target):\n    # Help me!"
  }
}
```

**Response** (200):
```json
{
  "response": "Two pointers work great when the array is sorted! In this case, you might want to use a hash map instead. Have you considered how to achieve O(n) time complexity?",
  "suggestions": [
    "Use a hash map to track seen values",
    "Iterate through array once",
    "Return indices when pair found"
  ],
  "related_concepts": ["hash_map", "two_pointers", "array_iteration"],
  "confidence": 0.92,
  "followed_up": true
}
```

---

## 🔄 SERVICE-TO-SERVICE COMMUNICATION

### Event System (Redis Pub/Sub)

Services communicate via Redis channels:

```python
# Judge Service - When submission completes
await event_bus.publish("submission:completed", {
    "submission_id": "sub_123",
    "user_id": "usr_123",
    "status": "accepted",
    "score": 100,
    "timestamp": "2026-04-01T10:06:00Z"
})

# Leaderboard Service - Subscribes and updates rankings
await event_bus.subscribe("submission:completed", handle_submission_completed)

# Mentor Service - Subscribes for analytics
await event_bus.subscribe("submission:completed", track_submission_analytics)
```

### Event Channels

| Channel | Publisher | Subscribers | Payload |
|---------|-----------|-------------|---------|
| `submission:created` | Judge | Leaderboard, Mentor | submission_id, user_id, problem_id |
| `submission:completed` | Judge | Leaderboard, Mentor | submission_id, verdict, score |
| `leaderboard:update` | Leaderboard | Frontend (WebSocket) | user_id, rank, score |
| `user:score_changed` | Leaderboard | Analytics | user_id, delta, timestamp |
| `problem:solved` | Judge | Mentor, Analytics | user_id, problem_id, time |

---

## 🧪 TESTING THE API

### Using cURL

```bash
# Register
curl -X POST http://localhost/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@college.edu",
    "username": "testuser",
    "password": "Pass123!",
    "house": "gryffindor"
  }'

# Login
curl -X POST http://localhost/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@college.edu",
    "password": "Pass123!"
  }'

# Submit code
curl -X POST http://localhost/api/v1/submissions/ \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "problem_id": 1,
    "language": "python3",
    "source_code": "print(42)"
  }'
```

### Using Python SDK

```python
import requests
import json

class CodukuClient:
    def __init__(self, base_url="http://localhost"):
        self.base_url = base_url
        self.token = None
    
    def register(self, email, username, password, house="gryffindor"):
        response = requests.post(
            f"{self.base_url}/api/v1/auth/register",
            json={
                "email": email,
                "username": username,
                "password": password,
                "house": house
            }
        )
        self.token = response.json()["access_token"]
        return response.json()
    
    def submit_code(self, problem_id, language, source_code):
        response = requests.post(
            f"{self.base_url}/api/v1/submissions/",
            headers={"Authorization": f"Bearer {self.token}"},
            json={
                "problem_id": problem_id,
                "language": language,
                "source_code": source_code
            }
        )
        return response.json()
    
    def get_leaderboard(self):
        response = requests.get(
            f"{self.base_url}/api/v1/leaderboards/global"
        )
        return response.json()

# Usage
client = CodukuClient()
client.register("test@college.edu", "testuser", "Pass123!")
submission = client.submit_code(1, "python3", "print(42)")
leaderboard = client.get_leaderboard()
```

### Using JavaScript

```javascript
class CodukuClient {
  constructor(baseUrl = 'http://localhost') {
    this.baseUrl = baseUrl;
    this.token = null;
    this.ws = null;
  }

  async register(email, username, password, house = 'gryffindor') {
    const response = await fetch(`${this.baseUrl}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, username, password, house })
    });
    const data = await response.json();
    this.token = data.access_token;
    return data;
  }

  async submitCode(problemId, language, sourceCode) {
    const response = await fetch(`${this.baseUrl}/api/v1/submissions/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        problem_id: problemId,
        language,
        source_code: sourceCode
      })
    });
    return response.json();
  }

  connectWebSocket(userId) {
    this.ws = new WebSocket(
      `ws://localhost/ws/client-${Math.random()}?user_id=${userId}`
    );
    this.ws.onmessage = (event) => {
      console.log('Message:', JSON.parse(event.data));
    };
  }

  async getLeaderboard() {
    const response = await fetch(`${this.baseUrl}/api/v1/leaderboards/global`);
    return response.json();
  }
}

// Usage
const client = new CodukuClient();
await client.register('test@college.edu', 'testuser', 'Pass123!');
const submission = await client.submitCode(1, 'python3', 'print(42)');
const leaderboard = await client.getLeaderboard();
```

---

## 🔐 AUTHENTICATION & SECURITY

### JWT Token Structure

```json
{
  "sub": "usr_123",
  "email": "user@college.edu",
  "exp": 1743638400,
  "iat": 1743552000,
  "iss": "coduku",
  "aud": "coduku-app"
}
```

### Rate Limiting

- Auth endpoints: 10 requests/minute per IP
- Submission endpoint: 1 request/second per user
- Leaderboard: 100 requests/minute per IP
- WebSocket: 1000 messages/hour per connection

### CORS Headers

```
Access-Control-Allow-Origin: http://localhost:3000
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Allow-Credentials: true
Access-Control-Max-Age: 3600
```

---

## 📈 MONITORING & DEBUGGING

### Health Check Endpoints

```bash
# All services
curl http://localhost/health

# Individual services
curl http://localhost:8001/health  # Auth
curl http://localhost:8002/health  # Judge
curl http://localhost:8003/health  # Leaderboard
curl http://localhost:8004/health  # Mentor
```

### Logs

```bash
# All logs
docker-compose logs -f

# Service-specific
docker-compose logs -f judge
docker-compose logs -f leaderboard
```

### Error Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | OK | Success ✅ |
| 202 | Accepted | Processing asynchronously |
| 400 | Bad Request | Check request format |
| 401 | Unauthorized | Invalid/missing token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 429 | Too Many Requests | Rate limited, retry later |
| 500 | Server Error | Contact support |
| 503 | Service Unavailable | Service down, try again |

---

**API Version**: 1.0.0
**Last Updated**: 2026-04-01
**Status**: ✅ Production Ready
