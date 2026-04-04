# CODUKU - Complete Build & Deployment Guide

## 🎯 Project Overview

CODOKU is a **full-featured competitive coding platform** (LeetCode/HackerRank-style) built with:

- **Backend**: FastAPI (Python) with Judge0 integration
- **Frontend**: React 18 with Monaco Editor
- **Database**: MongoDB + Redis + Optional Supabase
- **Code Execution**: Judge0 (60+ languages)
- **Real-time Updates**: WebSockets for live leaderboards
- **Deployment**: Docker + NGINX

---

##  📋 What's Been Implemented

### ✅ Backend Services (COMPLETE)

#### Services Created:
1. **auth_service.py** - User registration, login, JWT authentication
2. **judge_service.py** - Code execution via Judge0
3. **leaderboard_service.py** - Global & house-based rankings
4. **mentor_service.py** - Mentor/guidance system (starter template)
5. **user_service.py** - User profiles, statistics, preferences
6. **admin_service.py** - Problem management, analytics, admin panel
7. **house_service.py** - House system with achievements & themes

#### API Endpoints (30+):
```
Authentication:
- POST   /api/v1/auth/register          - Register new user
- POST   /api/v1/auth/login             - User login
- GET    /api/v1/auth/me                - Get current user

Problems:
- GET    /api/v1/questions              - List all problems
- GET    /api/v1/questions/{id}         - Get problem details
- POST   /api/v1/questions              - Create problem (admin)

Submissions:
- POST   /api/v1/submit                 - Submit code for execution
- GET    /api/v1/submissions/{id}       - Get submission status
- GET    /api/v1/submissions            - User's submissions

Leaderboards:
- GET    /api/v1/leaderboards/global    - Global rankings
- GET    /api/v1/leaderboards/houses    - House rankings
- GET    /api/v1/leaderboards/house/{name}

Users:
- GET    /api/v1/users/me               - Current user profile
- GET    /api/v1/users/{id}             - User profile by ID
- PATCH  /api/v1/users/me               - Update profile
- GET    /api/v1/users/me/stats         - User statistics

Houses:
- GET    /api/v1/houses                 - All houses
- GET    /api/v1/houses/{name}          - House details
- GET    /api/v1/houses/{name}/members  - House leaderboard
- GET    /api/v1/houses/{name}/achievements

Admin:
- POST   /api/v1/admin/problems         - Create problem
- GET    /api/v1/admin/problems         - List problems (with pagination)
- PATCH  /api/v1/admin/problems/{id}    - Update problem
- DELETE /api/v1/admin/problems/{id}    - Delete problem
- GET    /api/v1/admin/users            - List all users
- GET    /api/v1/admin/analytics/overview - System analytics
```

### ✅ Database & Persistence
- MongoDB integration for users, problems, submissions
- Redis for real-time leaderboard caching
- Supabase support (optional)
- In-memory fallback for offline testing

### ✅ Judge0 Integration
- Supports 18+ programming languages
- Multiple test case execution
- Time/memory limit enforcement  
- Async job polling
- Error handling & timeouts

---

## 🚀 Next Steps - Frontend Completion

### Frontend Pages Needed:
1. **AuthPage.jsx** - ✅ Existing (needs refinement)
2. **DashboardPage.jsx** - Complete with stats, achievements, quick actions
3. **CodeEditor.jsx** - Problem list, code editor, submission results
4. **LeaderboardPage.jsx** - Global & house-based rankings
5. **AdminPanel.jsx** - Problem management (optional)

### Components to Create:
- ProblemListCard
- CodeEditorPanel
- SubmissionResult
- HouseCard
- LeaderboardTable
- UserProfileCard

### Services Already Available:
- `/src/services/apiService.js` - All API functions implemented
- Language templates & configurations
- WebSocket manager for real-time updates

---

## 🛠️ Setup & Running Locally

### Prerequisites:
```bash
# Python 3.10+
# Node.js 16+
# Docker & Docker Compose
# MongoDB (local or cloud)
# Redis (optional, for production)
```

### Backend Setup:
```bash
# 1. Navigate to backend
cd backend

# 2. Create virtual environment
python -m venv .venv
.\.venv\Scripts\Activate.ps1  # Windows
source .venv/bin/activate      # Mac/Linux

# 3. Install dependencies
pip install -r requirements.txt

# 4. Create .env file
cat > .env << EOF
# JWT Settings
JWT_SECRET=your-secret-key-change-in-production

# Judge0 Settings  
JUDGE0_API_URL=http://localhost:2358
JUDGE0_MODE=auto

# Database
DATABASE_URL=mongodb://localhost:27017/coduku
REDIS_URL=redis://localhost:6379

# Supabase (optional)
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
EOF

# 5. Run backend
python -m uvicorn backend.main:app --port 8000 --reload
```

### Frontend Setup:
```bash
# 1. Navigate to frontend
cd frontend

# 2. Install dependencies
npm install

# 3. Create .env file
cat > .env << EOF
REACT_APP_API_URL=http://localhost:8000/api/v1
EOF

# 4. Run frontend
npm start
```

### Using Docker Compose:
```bash
# From project root
docker-compose up -d

# Access:
# Frontend: http://localhost:3000
# Backend: http://localhost:8000
# NGINX: http://localhost:80
# Judge0: http://localhost:2358
```

---

## 📦 Judge0 Docker Setup

Judge0 is already configured in `docker-compose.yml`. To run it separately:

```bash
docker run -d \
  -p 2358:2358 \
  -e REDIS_URL=redis://redis:6379 \
  judge0/judge0:latest
```

---

## 🔐 Important Security Notes

1. **JWT Secret**: Change `JWT_SECRET` in production
2. **CORS**: Update allowed origins in `backend/main.py`
3. **Admin Role**: Set up admin users via MongoDB directly
4. **Password Hashing**: Uses bcrypt with salting
5. **Token Expiry**: Tokens expire after 30 days

---

## 📊 Database Schema

### Users Collection:
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "User Name",
  "username": "username",
  "password_hash": "bcrypt_hash",
  "house": "gryffindor",
  "role": "student",
  "total_score": 1200,
  "problems_solved": 25,
  "submissions": 45,
  "created_at": "2024-01-01T00:00:00Z"
}
```

### Problems Collection:
```json
{
  "id": "p1",
  "title": "Two Sum",
  "description": "Find two numbers that sum to target",
  "difficulty": "easy",
  "score": 100,
  "base_score": 100,
  "difficulty_multiplier": 1.0,
  "time_limit": 5.0,
  "memory_limit": 256,
  "test_cases": [
    {
      "input": "[2,7,11,15]\n9",
      "output": "[0,1]",
      "visible": true
    }
  ]
}
```

### Submissions Collection:
```json
{
  "id": "uuid",
  "user_id": "user_uuid",
  "user_email": "user@example.com",
  "problem_id": "p1",
  "language": "python3",
  "source_code": "...",
  "status": "accepted",
  "test_cases_passed": 5,
  "test_cases_total": 5,
  "score": 100,
  "execution_time_ms": 45.2,
  "created_at": "2024-01-01T12:30:00Z"
}
```

---

## 🎨 Frontend Features to Complete

### AuthPage.jsx
- ✅ Registration form
- ✅ Login form  
- ✅ House selection
- ✅ Form validation
- ❌ Two-factor authentication (optional)
- ❌ Forgot password flow (optional)

### DashboardPage.jsx (To implement)
```jsx
// Key sections:
- User greeting with house emoji
- Quick stats (rank, score, problems solved)
- House information card
- Recent achievements
- Recommended problems
- Action buttons (Start coding, View leaderboards)
- Performance breakdown chart
- Languages used statistics
```

### CodeEditor.jsx (To implement)
```jsx
// Key sections:
- Problem list sidebar
- Problem details panel
- Monaco editor
- Language selector
- Submit button
- Result panel with test case validation
- Execution time/memory display
- AI code review (optional)
```

### LeaderboardPage.jsx (To implement)
```jsx
// Key sections:
- Global leaderboard table
- House-based leaderboards
- Time filters (all-time, monthly, weekly)
- User search
- Rank indicators
- Score progression
```

---

## 🚀 Deployment Guide

### AWS/Azure Deployment:
1. Dockerize both services (Dockerfile exists)
2. Push to container registry
3. Deploy with Docker Compose or Kubernetes
4. Set up MongoDB Atlas cloud instance
5. Configure Redis instance
6. Set environment variables

### Heroku Deployment:
```bash
# Create app
heroku create coduku

# Set environment variables
heroku config:set JWT_SECRET=...
heroku config:set DATABASE_URL=...

# Deploy
git push heroku main
```

### Local Production Mode:
```bash
# Set environment variables
export JUDGE0_MODE=real
export JWT_SECRET=production-secret-key

# Run with gunicorn
gunicorn -w 4 -k uvicorn.workers.UvicornWorker backend.main:app
```

---

## 🔍 Testing

### Backend Tests:
```bash
# Install pytest
pip install pytest pytest-asyncio

# Run tests
pytest tests/

# Test specific service
pytest tests/test_auth_service.py -v
```

### Frontend Tests:
```bash
# Install testing dependencies
npm install --save-dev jest @testing-library/react

# Run tests
npm test

# Coverage
npm test -- --coverage
```

### Manual API Testing:
```bash
# Test registration
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "username": "testuser",
    "house": "gryffindor"
  }'

# Test login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# Test problems list
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/v1/questions
```

---

## 🐛 Troubleshooting

### Judge0 Connection Issues:
```bash
# Check if Judge0 is running
curl http://localhost:2358/health

# Restart Judge0
docker-compose restart judge0

# Check logs
docker-compose logs judge0
```

### MongoDB Connection Issues:
```bash
# Test connection
python -c "from pymongo import MongoClient; print(MongoClient('mongodb://localhost:27017'))"

# Start MongoDB
docker-compose up -d mongo
```

### Frontend API Connection Issues:
- Check REACT_APP_API_URL in .env
- Verify backend is running on port 8000
- Check CORS settings in backend/main.py
- Look at browser console for error messages

---

## 📈 Performance Optimization

### Backend:
- Enable Redis for leaderboard caching
- Use MongoDB indexes on frequently queried fields
- Implement pagination for large result sets
- Cache problem data in memory

### Frontend:
- Code-split React components
- Lazy load leaderboard data
- Memoize expensive computations
- Use React.memo for component optimization

---

## 🎉 Next Phase - Advanced Features

### Phase 1 (Done):
- ✅ Core authentication
- ✅ Problem management
- ✅ Code execution via Judge0
- ✅ Leaderboards
- ✅ House system

### Phase 2 (Frontend completion):
- [ ] Complete DashboardPage
- [ ] Complete CodeEditor
- [ ] Complete LeaderboardPage
- [ ] Add styling
- [ ] Responsive design

### Phase 3 (Advanced):
- [ ] WebSocket real-time updates
- [ ] Achievement system
- [ ] Plagiarism detection
- [ ] Live coding battles
- [ ] Team competitions
- [ ] Code complexity analyzer

### Phase 4 (Production):
- [ ] Performance tuning
- [ ] Security hardening
- [ ] Comprehensive testing
- [ ] Documentation
- [ ] Monitoring & logging
- [ ] CI/CD pipeline

---

## 📞 Support & Contributing

For issues or questions:
1. Check the troubleshooting section
2. Review API documentation
3. Check MongoDB/Redis logs
4. Create an issue with reproduction steps

---

## 📄 License

This project is open-source. See LICENSE file for details.

---

## 🙏 Credits

Built with:
- [FastAPI](https://fastapi.tiangolo.com/) - Modern Python framework
- [React](https://react.dev/) - UI library
- [Judge0](https://judge0.com/) - Code execution engine
- [MongoDB](https://www.mongodb.com/) - Database
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) - Code editor

