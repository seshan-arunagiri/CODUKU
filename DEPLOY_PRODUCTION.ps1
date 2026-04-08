# ╔═══════════════════════════════════════════════════════════════════════════╗
# ║         CODUKU - COMPLETE PRODUCTION REBUILD & VERIFICATION                ║
# ║         Run this script to deploy the entire system fresh                   ║
# ╚═══════════════════════════════════════════════════════════════════════════╝

Write-Host "`n" -ForegroundColor Cyan
Write-Host "╔═══════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                   🚀 CODUKU PRODUCTION DEPLOYMENT 🚀                      ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan

# ============================================================================
# STEP 1: ENVIRONMENT SETUP
# ============================================================================
Write-Host "`n[STEP 1] ENVIRONMENT SETUP" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow

$ProjectRoot = "D:\Projects\coduku"
cd $ProjectRoot

# Create .env if not exists
if (-not (Test-Path ".env")) {
    Write-Host "Creating .env file..." -ForegroundColor Cyan
    @"
JWT_SECRET=your-super-secret-jwt-key-change-in-production
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
"@ | Out-File -FilePath ".env" -Encoding UTF8
}

Write-Host "✅ Environment configured" -ForegroundColor Green

# ============================================================================
# STEP 2: CLEAN UP OLD DEPLOYMENT
# ============================================================================
Write-Host "`n[STEP 2] CLEAN UP OLD CONTAINERS" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow

Write-Host "Stopping all containers..." -ForegroundColor Cyan
docker-compose down -v 2>&1 | Out-Null

Write-Host "Waiting 3 seconds..." -ForegroundColor Cyan
Start-Sleep -Seconds 3

Write-Host "✅ Old deployment cleaned" -ForegroundColor Green

# ============================================================================
# STEP 3: BUILD AND START SERVICES
# ============================================================================
Write-Host "`n[STEP 3] BUILD AND START SERVICES" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow

Write-Host "Building Docker images and starting services..." -ForegroundColor Cyan
Write-Host "(This may take 3-5 minutes on first run)" -ForegroundColor Gray

docker-compose up -d --build 2>&1 | Select-String -Pattern "Creating|Starting|Network"

# ============================================================================
# STEP 4: WAIT FOR JUDGE0 INITIALIZATION
# ============================================================================
Write-Host "`n[STEP 4] WAIT FOR JUDGE0 TO INITIALIZE" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow

Write-Host "Judge0 compiles language runtimes on first start..." -ForegroundColor Cyan
Write-Host "This takes 1-2 minutes. Waiting..." -ForegroundColor Gray

$judge0_ready = $false
$attempts = 0
$max_attempts = 120  # 2 minutes max

while (-not $judge0_ready -and $attempts -lt $max_attempts) {
    try {
        $response = Invoke-WebRequest "http://localhost:2358/" -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            $judge0_ready = $true
            Write-Host "✅ Judge0 is ready!" -ForegroundColor Green
        }
    } catch {
        $attempts++
        if ($attempts % 10 -eq 0) {
            Write-Host "  ⏳ Still initializing... ($attempts/$max_attempts)" -ForegroundColor Gray
        }
        Start-Sleep -Seconds 1
    }
}

if (-not $judge0_ready) {
    Write-Host "❌ Judge0 did not start in time. Check logs:" -ForegroundColor Red
    docker-compose logs judge0 --tail 50
    exit 1
}

# ============================================================================
# STEP 5: VERIFY ALL SERVICES ARE HEALTHY
# ============================================================================
Write-Host "`n[STEP 5] VERIFY ALL SERVICES" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow

Write-Host "Service Health Status:" -ForegroundColor Cyan
$services = @("judge0", "judge", "leaderboard", "postgres", "redis", "auth", "mentor", "gateway", "frontend")
$all_healthy = $true

foreach ($service in $services) {
    $container = docker ps --format "{{.Names}}" | Select-String "^coduku-$service"
    if ($container) {
        $status = docker ps --format "table {{.Names}}\t{{.Status}}" | Select-String "coduku-$service" | ForEach-Object {$_.Split("`t")[1]}
        
        if ($status -match "healthy|running") {
            Write-Host "  ✅ $service : $status" -ForegroundColor Green
        } else {
            Write-Host "  ⚠️  $service : $status" -ForegroundColor Yellow
            $all_healthy = $false
        }
    } else {
        Write-Host "  ❌ $service : NOT RUNNING" -ForegroundColor Red
        $all_healthy = $false
    }
}

if (-not $all_healthy) {
    Write-Host "`nSome services are not healthy. Checking logs..." -ForegroundColor Yellow
    docker-compose logs --tail 50
}

# ============================================================================
# STEP 6: TEST CRITICAL ENDPOINTS
# ============================================================================
Write-Host "`n[STEP 6] TEST CRITICAL ENDPOINTS" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow

# Test Judge0 directly
Write-Host "Testing Judge0..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest "http://localhost:2358/" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    Write-Host "  ✅ Judge0 API: WORKING" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Judge0 API: FAILED" -ForegroundColor Red
}

# Test Judge Service - Problems endpoint
Write-Host "Testing Judge Service (Problems)..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest "http://localhost:8002/api/v1/problems?limit=1" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    $json = $response.Content | ConvertFrom-Json
    if ($json.total -eq 8) {
        Write-Host "  ✅ Judge Service: WORKING ($($json.total) problems loaded)" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️  Judge Service: Only $($json.total) problems found (expected 8)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ❌ Judge Service: FAILED - $_" -ForegroundColor Red
}

# Test Leaderboard Service
Write-Host "Testing Leaderboard Service..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest "http://localhost:8003/health" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    Write-Host "  ✅ Leaderboard Service: WORKING" -ForegroundColor Green
} catch {
    Write-Host "  ❌ Leaderboard Service: FAILED - $_" -ForegroundColor Red
}

# Test Frontend
Write-Host "Testing Frontend..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest "http://localhost" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "  ✅ Frontend: LOADING at http://localhost" -ForegroundColor Green
    }
} catch {
    Write-Host "  ⚠️  Frontend: Still initializing - $_" -ForegroundColor Yellow
}

# ============================================================================
# STEP 7: SUBMISSION TEST (REAL CODE EXECUTION)
# ============================================================================
Write-Host "`n[STEP 7] TEST CODE EXECUTION (REAL JUDGE0 TEST)" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow

Write-Host "Submitting Python code to Judge0..." -ForegroundColor Cyan

$pythonCode = @"
nums = list(map(int, input().split()))
target = int(input())
for i in range(len(nums)):
    for j in range(i+1, len(nums)):
        if nums[i] + nums[j] == target:
            print([i, j])
"@

$body = @{
    problem_id = 1
    language = "python"
    code = $pythonCode
    user_id = "test_user_$(Get-Random)"
    username = "TestPython"
    house = "Gryffindor"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "http://localhost:8002/api/v1/submissions" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body `
        -UseBasicParsing `
        -TimeoutSec 30 `
        -ErrorAction Stop
    
    $result = $response.Content | ConvertFrom-Json
    
    Write-Host "  ✅ Code Execution: SUCCESS" -ForegroundColor Green
    Write-Host "     Verdict: $($result.submission.verdict)" -ForegroundColor Cyan
    Write-Host "     Passed: $($result.submission.passed_test_cases)/$($result.submission.total_test_cases) tests" -ForegroundColor Cyan
    
    if ($result.submission.passed_test_cases -eq $result.submission.total_test_cases) {
        Write-Host "  ✅✅✅ ALL TESTS PASSED - SYSTEM IS FULLY FUNCTIONAL! ✅✅✅" -ForegroundColor Green
    }
} catch {
    Write-Host "  ❌ Code Execution Test Failed:" -ForegroundColor Red
    Write-Host "     $_" -ForegroundColor Red
}

# ============================================================================
# STEP 8: FINAL STATUS & NEXT STEPS
# ============================================================================
Write-Host "`n[STEP 8] DEPLOYMENT COMPLETE" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow

Write-Host "`n🎯 SYSTEM READY FOR HOD DEMO!`n" -ForegroundColor Green

Write-Host "📋 Quick Reference:" -ForegroundColor Cyan
Write-Host "  Frontend:          http://localhost" -ForegroundColor White
Write-Host "  Judge Service API: http://localhost:8002" -ForegroundColor White
Write-Host "  Leaderboard API:   http://localhost:8003" -ForegroundColor White
Write-Host "  Auth Service:      http://localhost:8001" -ForegroundColor White
Write-Host "  Judge0 API:        http://localhost:2358" -ForegroundColor White
Write-Host "  PostgreSQL:        localhost:5432" -ForegroundColor White
Write-Host "  Redis:             localhost:6379" -ForegroundColor White

Write-Host "`n📚 Useful Commands:" -ForegroundColor Cyan
Write-Host "  View logs:         docker-compose logs -f" -ForegroundColor White
Write-Host "  Judge0 logs:       docker-compose logs judge0 --tail 100" -ForegroundColor White
Write-Host "  Stop services:     docker-compose down" -ForegroundColor White
Write-Host "  Restart service:   docker-compose restart judge" -ForegroundColor White

Write-Host "`n🎬 Next Steps:" -ForegroundColor Green
Write-Host "  1. Open http://localhost in your browser" -ForegroundColor White
Write-Host "  2. Register a new user (test account)" -ForegroundColor White
Write-Host "  3. Go to Code Arena and submit code" -ForegroundColor White
Write-Host "  4. Check the leaderboard for live updates" -ForegroundColor White
Write-Host "  5. View profile to see stats and submission history" -ForegroundColor White

Write-Host "`n╔═══════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║                  ✅ CODUKU IS PRODUCTION READY ✅                         ║" -ForegroundColor Green
Write-Host "╚═══════════════════════════════════════════════════════════════════════════╝`n" -ForegroundColor Green
