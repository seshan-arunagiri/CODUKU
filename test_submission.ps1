#!/usr/bin/env pwsh
# Test script for code submission flow

Write-Host "=== CODUKU Submission Test ===" -ForegroundColor Cyan

# Step 1: Login
Write-Host "`n1. Logging in..." -ForegroundColor Yellow
try {
    $loginResp = Invoke-WebRequest "http://localhost/api/v1/auth/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body '{"email":"gryffindor@test.com","password":"Test123!"}' `
        -UseBasicParsing `
        -ErrorAction Stop
    
    $loginData = $loginResp.Content | ConvertFrom-Json
    $token = $loginData.access_token
    Write-Host "✅ Logged in successfully" -ForegroundColor Green
    Write-Host "   User: $($loginData.username)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 2: Get problems list
Write-Host "`n2. Fetching problems..." -ForegroundColor Yellow
try {
    $problemsResp = Invoke-WebRequest "http://localhost/api/v1/problems" `
        -Method GET `
        -ContentType "application/json" `
        -UseBasicParsing `
        -ErrorAction Stop
    
    $problems = ($problemsResp.Content | ConvertFrom-Json).problems
    Write-Host "✅ Got $($problems.Count) problems" -ForegroundColor Green
    Write-Host "   First problem: $($problems[0].title)" -ForegroundColor Gray
    $problemId = $problems[0].id
} catch {
    Write-Host "❌ Failed to fetch problems: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 3: Submit code
Write-Host "`n3. Submitting code..." -ForegroundColor Yellow
$submitBody = @{
    problem_id = $problemId
    language = "python3"
    source_code = @"
def twoSum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []

# Test
print(twoSum([2, 7, 11, 15], 9))
"@
} | ConvertTo-Json

try {
    $submitResp = Invoke-WebRequest "http://localhost/api/v1/submissions" `
        -Method POST `
        -ContentType "application/json" `
        -Headers @{"Authorization" = "Bearer $token"} `
        -Body $submitBody `
        -UseBasicParsing `
        -ErrorAction Stop
    
    $submitData = $submitResp.Content | ConvertFrom-Json
    $submissionId = $submitData.submission_id
    Write-Host "✅ Code submitted successfully" -ForegroundColor Green
    Write-Host "   Submission ID: $submissionId" -ForegroundColor Gray
    Write-Host "   Status: $($submitData.status)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Submission failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Response: $($_.Exception.Response.StatusCode)" -ForegroundColor Gray
    exit 1
}

# Step 4: Check submission status repeatedly
Write-Host "`n4. Checking submission status..." -ForegroundColor Yellow
$maxAttempts = 30
for ($i = 0; $i -lt $maxAttempts; $i++) {
    try {
        $statusResp = Invoke-WebRequest "http://localhost/api/v1/submissions/$submissionId" `
            -Method GET `
            -ContentType "application/json" `
            -Headers @{"Authorization" = "Bearer $token"} `
            -UseBasicParsing `
            -ErrorAction Stop
        
        $statusData = $statusResp.Content | ConvertFrom-Json
        $status = $statusData.status
        
        if ($status -ne "pending") {
            Write-Host "✅ Submission completed" -ForegroundColor Green
            Write-Host "   Status: $status" -ForegroundColor Gray
            Write-Host "   Score: $($statusData.score)" -ForegroundColor Gray
            if ($statusData.test_cases_total) {
                Write-Host "   Tests: $($statusData.test_cases_passed)/$($statusData.test_cases_total)" -ForegroundColor Gray
            }
            break
        }
        
        Write-Host "   Still pending... (attempt $($i+1)/$maxAttempts)" -ForegroundColor Gray
        Start-Sleep -Milliseconds 500
    } catch {
        Write-Host "❌ Status check failed: $($_.Exception.Message)" -ForegroundColor Red
        break
    }
}

Write-Host "`n=== Test Complete ===" -ForegroundColor Cyan
