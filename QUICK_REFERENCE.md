# � CODUKU QUICK START - ONE PAGE REFERENCE

## 🚀 Full System Startup

```powershell
# 1. Navigate to project
cd d:\Projects\CODUKU

# 2. Clean old build (first time only)
docker-compose down -v

# 3. Start everything
docker-compose up -d --build

# ⏳ Wait 2-3 minutes for all services to be healthy...
```

## 🗄️ Initialize Database

```powershell
# Copy SQL script to database
docker cp init_db.sql coduku-postgres-1:/tmp/

# Run initialization
docker exec coduku-postgres-1 psql -U postgres -d coduku -f /tmp/init_db.sql

# Restart Judge service
docker restart coduku-judge-1 && Start-Sleep -Seconds 3
```

## ✅ Verify Setup

```powershell
# Check all services are healthy (all should show "healthy")
docker ps --format "table {{.Names}}\t{{.Status}}"

# Test API (should return status 200 and 5 problems)
$r = Invoke-WebRequest "http://localhost/api/v1/questions" -UseBasicParsing
($r.Content | ConvertFrom-Json) | select count, problems
```

## 🌐 Access Application

| Component | URL |
|-----------|-----|
| **Frontend** | http://localhost:3000 |
| **API Gateway** | http://localhost/api/v1 |
| **Auth Service** | http://localhost:8001 |
| **Judge Service** | http://localhost:8002 |
| **Leaderboard** | http://localhost:8003 |
| **Mentor** | http://localhost:8004 |
| **Database** | localhost:5432 (psql) |

## 🎬 Demo Flow

1. Open http://localhost:3000
2. **Sign Up**: email=test@demo.com, password=Demo123!, house=Gryffindor
3. Go to **Code Arena** → Click "Two Sum"
4. Copy this Python solution:
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
5. Click **Submit** → Watch for ✅ "Accepted" verdict
6. Check **Leaderboard** to see ranking
7. Try **Mentor** for AI assistance

## 📊 What You'll See

- **5 Seed Problems**: Two Sum, Reverse String, Palindrome, Valid Parentheses, Fibonacci
- **14 Test Cases**: Each problem thoroughly tested
- **Confetti Animation**: When you solve a problem
- **Leaderboard Rankings**: By house and points
- **AI Mentor**: Provides hints and explanations

## 🛠️ Troubleshooting

### Services not healthy?
```powershell
docker-compose logs        # See what went wrong
docker-compose restart     # Restart all services
```

### API returns 502?
```powershell
docker restart coduku-gateway-1
Start-Sleep -Seconds 3
```

### Database empty?
```powershell
docker exec coduku-postgres-1 psql -U postgres -d coduku -c "SELECT COUNT(*) FROM problems;"
# Should return: 5
```

### Reset everything
```powershell
docker-compose down -v
docker-compose up -d --build
# Then re-run database initialization
```

## 🎯 Key Stats

- **Build Time**: 2-3 minutes
- **Services**: 8+ containers
- **Problems**: 5 with 14 test cases
- **Languages Supported**: Python, JavaScript, Java, C++, Go, etc.
- **Code Execution**: Judge0 (via Docker)

## 📱 Supported Browsers

- Chrome/Chromium ✅
- Edge ✅
- Firefox ✅
- Safari ✅

## 💾 Architecture

```
React Frontend (3000)
       ↓
   NGINX Gateway (80)
       ↓
  [4 Microservices]
  - Auth (8001)
  - Judge (8002)
  - Leaderboard (8003)
  - Mentor (8004)
       ↓
  [Data Layer]
  - PostgreSQL
  - Redis
  - ChromaDB
```

## 🔑 Default Credentials

| Field | Value |
|-------|-------|
| Email | test@demo.com |
| Password | Demo123! |
| House | Gryffindor |

## 📚 Detailed Docs

- **Full Guide**: See `DEMO_GUIDE.md`
- **Demo Checklist**: See `DEMO_CHECKLIST.md`
- **Architecture**: See `ARCHITECTURE.md`
- **API Reference**: See `API_REFERENCE.md`

## ⏱️ Timeline

| Task | Time |
|------|------|
| Start Docker build | 0m |
| All services healthy | 2-3m |
| Database initialization | 3-4m |
| Test API | 4m |
| Open frontend | 4m |
| **Total Ready**: | **~5 minutes** |
| Full demo (auth → submit → leaderboard) | **~15 minutes** |

---

**Version**: 2.0 (Updated)  
**Status**: ✅ Production Ready  
**Last Updated**: April 3, 2026
```

---

## Test Flows

### 1. Register & Login
```bash
# Register
curl -X POST http://localhost/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@college.edu",
    "username": "testuser",
    "password": "Pass123!",
    "house": "gryffindor"
  }' | jq '.access_token' -r > /tmp/token.txt

TOKEN=$(cat /tmp/token.txt)

# Verify auth
curl http://localhost/api/v1/auth/me -H "Authorization: Bearer $TOKEN" | jq
```

### 2. Submit Code
```bash
TOKEN="<your_token_here>"

curl -X POST http://localhost/api/v1/submissions/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "problem_id": 1,
    "language": "python3",
    "source_code": "print(42)"
  }' | jq '.'
```

### 3. Check Leaderboard
```bash
curl http://localhost/api/v1/leaderboards/global | jq '.users | .[0:5]'
```

### 4. Test WebSocket
```bash
npm install -g wscat
wscat -c "ws://localhost/ws/test-client?user_id=test-user"

# Inside WebSocket:
> {"type": "subscribe_leaderboard"}
> {"type": "ping"}
< {"type": "pong"}
```

---

## Docker Compose Cheatsheet

```bash
# Containers
docker-compose ps                          # List services
docker-compose restart auth                # Restart service
docker-compose stop leaderboard            # Stop service

# Logs
docker-compose logs --tail=20              # Last 20 lines
docker-compose logs -f --since 10m          # Last 10 minutes

# Cleanup
docker-compose down                        # Stop & remove
docker-compose down -v                     # Stop & remove volumes
docker-compose prune                       # Clean unused resources
```

---

## Debugging Tips

### Service Won't Start
```bash
# Check logs for errors
docker-compose logs judge

# Rebuild from scratch
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

### Connection Refused
```bash
# Verify service is running
docker-compose ps

# Check port is listening
netstat -tuln | grep LISTEN

# Test directly
curl http://localhost:8002/health
```

### Database Issues
```bash
# Check PostgreSQL
docker-compose exec postgres psql -U postgres

# Reset database
docker-compose exec postgres dropdb -U postgres coduku
docker-compose restart postgres
```

### WebSocket Connection Failed
```bash
# Check judge service logs
docker-compose logs judge

# Verify NGINX routing
curl -v -H "Connection: Upgrade" http://localhost:8002/health
```

---

## Configuration Quick Reference

```bash
# View current environment
grep -E "^[^#]" .env

# Update single variable
sed -i 's/OPENAI_API_KEY=.*/OPENAI_API_KEY=sk-new-key/' .env

# Test environment is loaded
docker-compose config | grep OPENAI_API_KEY
```

---

## Performance Testing

```bash
# Load test (send 100 requests)
for i in {1..100}; do
  curl http://localhost/api/v1/leaderboards/global &
done
wait

# Monitor resource usage
watch -n 2 'docker stats --no-stream'

# Check database connections
docker-compose exec postgres psql -U postgres -c \
  "SELECT count(*) FROM pg_stat_activity;"
```

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Port already in use | `sudo lsof -i :8001` then kill process |
| Out of memory | `docker-compose down` then `docker system prune -a` |
| Slow services | `docker-compose restart` or check logs |
| Database locked | `docker-compose down -v` (clears volumes) |
| WebSocket fails | Restart judge service: `docker-compose restart judge` |

---

## Environment Variables to Update

```bash
# CRITICAL (Must set for full functionality)
JWT_SECRET=<your-super-secret-key>
SUPABASE_URL=<your-supabase-project-url>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
OPENAI_API_KEY=<sk-your-openai-key>

# OPTIONAL (Development defaults work)
POSTGRES_PASSWORD=postgres
REDIS_URL=redis://redis:6379
JUDGE0_API_URL=http://judge0:2358
```

---

## Useful Aliases

Add to `~/.bashrc` or `~/.zshrc`:

```bash
# CODUKU aliases
alias cdku="cd /media/spidey/New\ Volume/Projects/coduku"
alias dcu="docker-compose up -d"
alias dcd="docker-compose down"
alias dcl="docker-compose logs -f"
alias dcs="docker-compose ps"

# Example: cdku && dcu logs -f judge
```

---

## Next Steps After Deployment

1. ✅ Verify all services are healthy (`curl http://localhost/health`)
2. 📝 Register a test account
3. 💻 Submit your first code problem
4. 📊 Check the leaderboard
5. 🧙 Request an AI hint
6. 🔄 Watch real-time updates via WebSocket

---

## Documentation Links

| Document | Purpose |
|----------|---------|
| [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md) | Complete setup guide |
| [API_REFERENCE.md](API_REFERENCE.md) | Full API documentation |
| [README_PHASE1.md](README_PHASE1.md) | Phase 1 overview |
| [ARCHITECTURE.md](ARCHITECTURE.md) | System architecture |
| [CONTEXT.md](CONTEXT.md) | Project context |

---

## Support

- 📖 Check documentation first
- 🐛 Review logs: `docker-compose logs`
- 💬 GitHub Issues: (link to repo)
- 📧 Email: support@coduku.college.edu

---

**Last Updated**: 2026-04-01  
**CODUKU Version**: 1.0.0  
**Status**: ✅ Production Ready
