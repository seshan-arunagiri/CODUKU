# 🎯 CODUKU - Project Overview

## What is CODUKU?

**CODUKU** is a competitive coding platform similar to:
- HackerRank
- LeetCode
- CodeChef
- AtCoder

It allows students and professionals to:
- 💻 **Write Code** - Solve programming problems
- ⚡ **Execute Code** - Run code in 18+ programming languages
- 🏆 **Compete** - Participate in leaderboards
- 🎓 **Learn** - Improve coding skills
- 👥 **Connect** - Compete with peers

---

## 🚀 Key Features

### 1. **Problem Library**
- Browse multiple coding problems
- Problems from easy to hard difficulty
- Different categories (Arrays, Strings, Trees, etc.)
- Each problem has test cases

### 2. **Code Editor**
- **Monaco Editor** - Professional code editing
- **Syntax Highlighting** - For all languages
- **Code Completion** - Smart suggestions
- **Line Numbers** - Easy navigation

### 3. **Multi-Language Support**
Solve problems in any of these languages:
```
Python, C, C++, C#, Java, JavaScript, Go, Rust, 
Ruby, PHP, Swift, Kotlin, TypeScript, R, Scala, 
Groovy, Objective-C, and more (18+ languages)
```

### 4. **Real-time Judge**
- **Instant Execution** - Run code immediately
- **Test Cases** - Check against multiple tests
- **Error Messages** - Clear feedback on failures
- **Results** - Pass/Fail status

### 5. **Leaderboard System**
- **Global Rankings** - See all competitors
- **House System** - Team-based competition
  - 🦁 Gryffindor
  - 🦡 Hufflepuff
  - 🅗 Ravenclaw
  - 🐍 Slytherin
- **Score Tracking** - Points for each submission
- **Real-time Updates** - Live leaderboard changes

### 6. **User Management**
- **Secure Registration** - Create accounts
- **JWT Authentication** - Secure API access
- **Password Hashing** - bcrypt encryption
- **Profile Management** - Track progress

---

## 🏗️ Technical Architecture

### Frontend (What Users See)
```
Next.js 14 (React Framework)
├── Pages (Login, Register, Home)
├── Components (Editor, Leaderboard, Problems)
└── TypeScript (Type Safety)
```

**Technologies:**
- Next.js 14
- React 18
- TypeScript
- Tailwind CSS (Styling)
- Monaco Editor (Code editing)
- Axios (API calls)

### Backend (What Powers It)
```
Python FastAPI
├── Authentication (JWT + Supabase)
├── Problem Management (MongoDB)
├── Submissions (Judge0 Integration)
├── Leaderboard (Redis)
└── User Profiles (MongoDB)
```

**Technologies:**
- FastAPI (Web framework)
- Python 3.9+
- MongoDB (Database)
- Redis (Caching/Leaderboard)
- Judge0 (Code execution)
- JWT (Security)

---

## 🔄 How It Works

### User Journey

```
1. User visits http://localhost:3000
   ↓
2. User registers or logs in
   ↓
3. User sees list of available problems
   ↓
4. User selects a problem to solve
   ↓
5. Problem statement displays in browser
   ↓
6. User writes code in Monaco Editor
   ↓
7. User selects programming language
   ↓
8. User clicks "Submit"
   ↓
9. Backend sends code to Judge0
   ↓
10. Judge0 compiles & executes code
   ↓
11. Results returned to frontend
   ↓
12. User sees Pass/Fail + Score
   ↓
13. Leaderboard updates automatically
```

### Behind the Scenes Flow

```
Frontend Request
    ↓
Next.js API Route
    ↓
Axios HTTP Request (to Backend API)
    ↓
Python FastAPI Route Handler
    ↓
[Authenticates with JWT]
    ↓
[Validates Problem ID]
    ↓
[Sends Code to Judge0]
    ↓
Judge0 Returns Result
    ↓
[Stores in MongoDB]
    ↓
[Updates Redis Leaderboard]
    ↓
Response JSON to Frontend
    ↓
React Updates UI
    ↓
User Sees Results
```

---

## 📊 Database Schema

### Users Collection
```json
{
  "_id": "123",
  "email": "user@example.com",
  "username": "johndoe",
  "house": "Gryffindor",
  "total_score": 1500,
  "problems_solved": 25,
  "created_at": "2024-01-15"
}
```

### Problems Collection
```json
{
  "_id": 1,
  "title": "Two Sum",
  "description": "Find two numbers that add up to target",
  "difficulty": "Easy",
  "points": 10,
  "test_cases": [...],
  "solution": "..."
}
```

### Submissions Collection
```json
{
  "_id": "456",
  "user_id": "123",
  "problem_id": 1,
  "code": "def solution(arr, target): ...",
  "language": "python3",
  "status": "ACCEPTED",
  "score": 10,
  "submitted_at": "2024-01-15T10:30:00"
}
```

### Leaderboard (Redis)
```
User Rankings stored in sorted sets
Global: "leaderboard:global"
House: "leaderboard:gryffindor"
Problem: "leaderboard:problem:1"
```

---

## 🔐 Security Features

### Authentication
- **Password Hashing**: bcrypt (not stored as plain text)
- **JWT Tokens**: Secure session management
- **HTTPS**: Encrypted communication (in production)
- **CORS**: Cross-origin protection

### Data Protection
- **MongoDB Validation**: Schema validation
- **Input Sanitization**: No SQL injection
- **Rate Limiting**: Prevent abuse
- **Environment Variables**: Secrets not in code

### Code Execution Safety
- **Sandboxed Execution**: Judge0 runs code safely
- **Resource Limits**: Time & memory constraints
- **Timeout Protection**: Infinite loops don't break system
- **No File System Access**: Limited code scope

---

## 📈 Performance Features

### Optimization
- **Redis Caching**: Fast leaderboard access
- **MongoDB Indexes**: Quick problem lookup
- **WebSocket Support**: Real-time updates
- **Lazy Loading**: Load problems on demand
- **Next.js Optimization**: Automatic code splitting

### Scalability
- **Microservices Ready**: Can split services
- **Horizontal Scaling**: Add more servers
- **Load Balancing**: Distribute requests
- **Async Processing**: Non-blocking operations

---

## 🎯 Use Cases

### For Individuals
- 🏋️ **Practice**: Improve coding skills
- 💼 **Interviews**: Prepare for tech interviews
- 👨‍🎓 **Learning**: Understand algorithms
- 📊 **Tracking**: Monitor progress

### For Teams
- 🏆 **Competitions**: Coding contests
- 👥 **Collaboration**: Team challenges
- 🏠 **House Battles**: House-based tournaments
- 🎓 **Teaching**: Educational tool

### For Institutions
- 📚 **Courses**: Coding practice platform
- 🧪 **Assessments**: Evaluate students
- 🏅 **Competitions**: Host internal contests
- 📊 **Analytics**: Track learning metrics

---

## 🔧 Configuration

The project is pre-configured with development settings. For production:

### Environment Setup
- Create `.env` file with real API keys
- Configure MongoDB with real cluster
- Set up Redis cluster
- Get Judge0 RapidAPI key
- Configure Supabase authentication

### Deployment Options
1. **Heroku** - Easy one-click deployment
2. **AWS** - EC2 + RDS + ElastiCache
3. **Google Cloud** - Cloud Run + Firestore
4. **Azure** - App Service + Cosmos DB
5. **DigitalOcean** - App Platform + Managed Databases
6. **Docker** - Containerized deployment

---

## 📊 Current Status

### ✅ Completed
- Backend API (100%)
- Frontend UI (100%)
- Code execution (100%)
- Authentication (100%)
- Leaderboard (100%)
- Database integration (100%)

### 🚀 Production Ready
- All features working
- Error handling complete
- Security implemented
- Documentation provided

### 📝 Optional Enhancements
- Email notifications
- Problem discussions
- Solution sharing
- Practice schedules
- Team invitations
- Problem difficulty rating

---

## 💡 How to Get Started

### Quick Start (5 minutes)
1. Clone repository
2. Install dependencies
3. Start backend: `python -m uvicorn backend.main:app --port 8000`
4. Start frontend: `cd frontend && npm run dev`
5. Open http://localhost:3000

### Full Manual (15 minutes)
Follow **[RUN_THIS_FIRST_GUIDE.md](RUN_THIS_FIRST_GUIDE.md)**

### Docker (10 minutes)
```bash
docker-compose up -d
# Access at http://localhost:3000
```

---

## 🎓 Learning Resources

### Understanding the Code
- **Frontend**: React components in `frontend/components/`
- **Backend**: API routes in `backend/app/main.py`
- **API Docs**: http://localhost:8000/docs (Swagger UI)

### Documentation Files
- `API_REFERENCE.md` - All API endpoints
- `ARCHITECTURE.md` - System design
- `SETUP_AND_RUN_GUIDE.md` - Setup instructions
- `QUICK_START_GUIDE.md` - Quick reference

---

## 🤝 Contributing

Want to improve CODUKU?

1. **Report Issues**: Found a bug? Create an issue
2. **Feature Requests**: Have an idea? Suggest it
3. **Code Contributions**: Submit a pull request
4. **Documentation**: Help improve docs
5. **Testing**: Test and report results

---

## 📞 Support

### Getting Help
1. Check documentation files
2. Review API docs at http://localhost:8000/docs
3. Check browser console (F12) for errors
4. Review backend logs in terminal

### Common Issues
- Port conflicts? Kill process and restart
- npm install failing? Clear cache and retry
- API errors? Check MongoDB connection
- Blank page? Check `.env` files

---

## 🎉 Ready to Start?

**➡️ Go to [RUN_THIS_FIRST_GUIDE.md](RUN_THIS_FIRST_GUIDE.md) and follow the setup steps!**

Then visit **http://localhost:3000** and start coding! 🚀

---

*CODUKU - Learn. Code. Compete. Win! 🏆*
