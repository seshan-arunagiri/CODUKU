# 🚀 CODUKU QUICK REFERENCE CARD

## One-Liner Deployment
```bash
cd /media/spidey/New\ Volume/Projects/coduku && cp .env.example .env && docker-compose up -d && sleep 15 && curl http://localhost/health
```

---

## Service Ports & URLs

```
┌─────────────────────────────────────────────┐
│ 🌐 Frontend      http://localhost:3000      │
│ 🔐 Auth API      http://localhost:8001      │
│ ⚖️  Judge API     http://localhost:8002      │
│ 📊 Leaderboard   http://localhost:8003      │
│ 🧙 Mentor API    http://localhost:8004      │
│ 🌐 Gateway       http://localhost (80)      │
│ 🔌 WebSocket     ws://localhost/ws          │
└─────────────────────────────────────────────┘
```

---

## Essential Commands

```bash
# START EVERYTHING
docker-compose up -d && sleep 10 && echo "Ready!"

# STOP EVERYTHING
docker-compose down

# VIEW LOGS
docker-compose logs -f                    # All services
docker-compose logs -f judge              # Specific service

# HEALTH CHECK
curl http://localhost/health              # All services
curl http://localhost:8001/health         # Auth
curl http://localhost:8002/health         # Judge

# DATABASE
docker-compose exec postgres psql -U postgres -c "\l"  # List databases
docker-compose exec redis redis-cli ping                # Test Redis

# REBUILD
docker-compose build --no-cache
docker-compose up -d --build
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
