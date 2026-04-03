# 🎬 CODUKU DEMO CHECKLIST

Use this checklist when presenting CODUKU to the HOD.

---

## Pre-Demo Setup (15 minutes before)

### Verify System Running
```powershell
# Run this command - all should show "healthy"
docker ps --format "table {{.Names}}\t{{.Status}}"
```

**Expected: 8-9 containers all showing "healthy"**

- [ ] `coduku-frontend-1` - healthy
- [ ] `coduku-gateway-1` - healthy  
- [ ] `coduku-judge-1` - healthy
- [ ] `coduku-auth-1` - healthy
- [ ] `coduku-leaderboard-1` - healthy
- [ ] `coduku-mentor-1` - healthy
- [ ] `coduku-postgres-1` - healthy
- [ ] `coduku-redis-1` - healthy

### Verify API
```powershell
$response = Invoke-WebRequest "http://localhost/api/v1/questions" -UseBasicParsing
$data = $response.Content | ConvertFrom-Json
write-host "Problems: $($data.count)"  # Should show: Problems: 5
```

**Expected: Status 200, Problems: 5**

- [ ] API responds with 200 status
- [ ] Returns 5 problems
- [ ] No errors in response

### Open Chrome/Edge
- [ ] Open http://localhost:3000
- [ ] Frontend loads without errors
- [ ] See login/signup page

---

## Demo Flow (10-15 minutes)

### Section 1: Authentication & Profile (2 minutes)

**Talking Points:**
- "This is the login and registration system"
- "Users select their house (Gryffindor, Hufflepuff, Ravenclaw, Slytherin)"
- "Different houses will show on the leaderboard"

**Demo Steps:**
1. [ ] Click "Sign Up"
2. [ ] Fill form:
   - Email: `test@demo.com`
   - Password: `Demo123!`
   - House: Select **Gryffindor**
3. [ ] Click "Register"
4. [ ] Wait for redirect to Dashboard
5. [ ] Point out:
   - User profile with house badge
   - Navigation menu (Code Arena, Leaderboard, Mentor)

---

### Section 2: Code Arena (5 minutes)

**Talking Points:**
- "This is the competitive coding problems page"
- "Users can see all available problems to solve"
- "Each problem has difficulty rating and acceptance rate"
- "Problems are from real coding interviews"

**Demo Steps:**
1. [ ] Click "Code Arena" in menu
2. [ ] Point out all 5 problems:
   - [ ] Two Sum
   - [ ] Reverse String
   - [ ] Palindrome Number
   - [ ] Valid Parentheses
   - [ ] Fibonacci Sequence
3. [ ] Click on "Two Sum" problem
4. [ ] Show problem statement and constraints
5. [ ] Show test cases listed

---

### Section 3: Code Submission (5 minutes)

**Talking Points:**
- "Users can write code in the Monaco Editor"
- "Real-time syntax highlighting for multiple languages"
- "Judge0 executes code and runs test cases"
- "Instant verdict and performance metrics"

**Demo Steps:**
1. [ ] In Code Arena → Two Sum, go to Editor tab
2. [ ] Show the code editor interface
3. [ ] Copy & paste this Python solution:

```python
def twoSum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []
```

4. [ ] Click "Submit"
5. [ ] Wait for execution (20-30 seconds)
6. [ ] Show:
   - [ ] "Accepted" verdict
   - [ ] ✅ All test cases passed
   - [ ] Confetti animation
   - [ ] Score awarded
7. [ ] Point out:
   - Submission tracking
   - Time complexity insights
   - Memory usage

---

### Section 4: Leaderboard (2 minutes)

**Talking Points:**
- "Leaderboard ranks users by house"
- "Points awarded for each accepted submission"
- "Tracks problems solved and overall rank"

**Demo Steps:**
1. [ ] Click "Leaderboard" in menu
2. [ ] Show:
   - [ ] Rankings by house
   - [ ] Points and problems solved
   - Your submission appearing in rankings
   - [ ] Gryffindor house badge

---

### Section 5: Mentor (1 minute)

**Talking Points:**
- "AI-powered mentor provides code hints and explanations"
- "Helps students learn without giving full solutions"
- "Available 24/7 for guidance"

**Demo Steps:**
1. [ ] Click "Mentor" in menu
2. [ ] Show mentor interface
3. [ ] Show how students can ask for help:
   - "Can you explain this algorithm?"
   - "What's wrong with my approach?"
   - "Give me a hint for problem X"

---

### Section 6: Technical Architecture (3 minutes - Optional)

**Talking Points:**
- "Microservices architecture for scalability"
- "Containerized with Docker for easy deployment"
- "NGINX API Gateway for routing requests"
- "PostgreSQL for persistent data storage"
- "Judge0 integration for code execution"

**Demo Steps:**
1. [ ] Open Terminal
2. [ ] Show Docker containers:
   ```powershell
   docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
   ```
3. [ ] Explain services:
   - Frontend (React) - Port 3000
   - Auth Service - Port 8001
   - Judge Service - Port 8002
   - Leaderboard Service - Port 8003
   - Mentor Service - Port 8004
   - NGINX Gateway - Port 80
   - PostgreSQL - Port 5432
   - Redis - Port 6379

4. [ ] Show database:
   ```powershell
   docker exec -it coduku-postgres-1 psql -U postgres -d coduku
   # Once in psql:
   SELECT * FROM problems;
   \q
   ```

---

## Key Points to Highlight

### ✅ What Works
- [ ] All services starting healthy automatically
- [ ] Problems loading instantly
- [ ] Code execution (Judge0) working reliably
- [ ] Real-time results and scoring
- [ ] House system with leaderboards
- [ ] Multi-language support
- [ ] Confetti celebration animation
- [ ] Complete frontend integration

### 📊 Statistics to Mention
- **5** seed problems with 14 test cases
- **4** microservices running independently
- **8+** Docker containers orchestrated
- **< 30 seconds** code execution time
- **100%** test pass rate on demo code

### 🏆 House System
- **Gryffindor** - Brave and Bold (Red & Gold)
- **Hufflepuff** - Loyal and Fair (Yellow & Black)
- **Ravenclaw** - Wise and Creative (Blue & Bronze)
- **Slytherin** - Ambitious and Cunning (Green & Silver)

---

## Backup Plans

### If Frontend Won't Load
```powershell
docker-compose down
docker-compose up -d --build frontend
# Wait 2 minutes
# Refresh http://localhost:3000
```

### If API Returns 502
```powershell
docker restart coduku-gateway-1
Start-Sleep -Seconds 3
# Verify: Invoke-WebRequest "http://localhost/api/v1/questions"
```

### If Code Submission Times Out
```powershell
docker logs coduku-judge-1 | tail -20
# Show logs while explaining: "Checking Judge service logs..."
```

### If Database Seems Empty
```powershell
docker exec -it coduku-postgres-1 psql -U postgres -d coduku
SELECT COUNT(*) FROM problems;
\q
```

---

## Notes for HOD

**What to Emphasize:**

1. **Full Stack Development**
   - Modern React frontend
   - Python microservices
   - Containerized architecture
   - Cloud-ready design

2. **Real Engineering Practices**
   - Microservices architecture
   - API gateway pattern
   - Database layer separation
   - Caching (Redis)
   - Vector embeddings (ChromaDB)

3. **Scalability & Reliability**
   - Stateless services
   - Horizontal scalability
   - Load balancing ready
   - Health checks

4. **User Experience**
   - Intuitive UI
   - Real-time feedback
   - Gamification (points, leaderboard)
   - Community features

5. **AI/ML Integration**
   - Mentor service with AI
   - Vector embeddings
   - Semantic search ready

---

## Time Breakdown
- **Authorization**: 2 min
- **Code Arena**: 5 min
- **Submission**: 5 min
- **Leaderboard**: 2 min
- **Mentor**: 1 min
- **Architecture** (if time): 3 min
- **Questions**: Remaining time

**Total**: 15-20 minutes + Q&A

---

## Contact Info
**For Issues During Demo:**
- Check DEMO_GUIDE.md for detailed troubleshooting
- Check docker-compose logs for service errors
- Reset with: `docker-compose down -v && docker-compose up -d --build`

---

**Good luck with your demo! 🎉**
