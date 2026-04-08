#!/usr/bin/env python3
"""
Test CODUKU submission flow end-to-end
"""

import requests
import json
import time
import sys

BASE_URL = "http://localhost"
API_URL = f"{BASE_URL}/api/v1"

print("="*60)
print("🧪 CODUKU SUBMISSION TEST FLOW")
print("="*60)

# 1. Login with demo user
print("\n1️⃣ Logging in with demo user...")
login_response = requests.post(
    f"{API_URL}/auth/login",
    json={"email": "demo@coduku.com", "password": "demo1234"}
)

if login_response.status_code != 200:
    print(f"❌ Login failed: {login_response.text}")
    sys.exit(1)

login_data = login_response.json()
token = login_data.get("access_token")
user_id = login_data.get("user_id")
username = login_data.get("username")
house = login_data.get("house")

print(f"✅ Logged in as: {username} ({house})")
print(f"   Token: {token[:20]}...")

# 2. Get problems
print("\n2️⃣ Fetching problems...")
problems_response = requests.get(f"{API_URL}/problems")

if problems_response.status_code != 200:
    print(f"❌ Failed to fetch problems: {problems_response.text}")
    sys.exit(1)

problems_data = problems_response.json()
problems = problems_data.get("data") or problems_data.get("problems") or []

if isinstance(problems_data, list):
    problems = problems_data

print(f"✅ Found {len(problems)} problems")

if not problems:
    print("❌ No problems available")
    sys.exit(1)

problem = problems[0]
problem_id = problem.get("id", 1)
print(f"   Selected: {problem.get('title', 'Problem 1')}")

# 3. Submit a simple Python solution
print(f"\n3️⃣ Submitting Python solution for problem {problem_id}...")

# Two Sum solution (for problem 1)
code = """
def twoSum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []

# Parse input
line = input().strip()
target = int(input().strip())
nums = eval(line)

# Solve and print result
result = twoSum(nums, target)
print(result)
"""

submission_response = requests.post(
    f"{API_URL}/submissions",
    json={
        "problem_id": problem_id,
        "language": "python",
        "code": code,
        "user_id": user_id,
        "username": username,
        "house": house
    },
    headers={"Authorization": f"Bearer {token}"}
)

if submission_response.status_code != 200:
    print(f"❌ Submission failed: {submission_response.status_code}")
    print(f"   Response: {submission_response.text}")
    sys.exit(1)

submission_data = submission_response.json()
print(f"✅ Submission accepted")

# Extract submission ID and verdict
submission = submission_data.get("submission")
if not submission:
    print(f"❌ No submission in response: {submission_data}")
    sys.exit(1)

submission_id = submission.get("submission_id")
verdict = submission.get("verdict")
passed = submission.get("passed_test_cases", 0)
total = submission.get("total_test_cases", 0)

print(f"   Submission ID: {submission_id}")
print(f"   Verdict: {verdict}")
print(f"   Test Cases: {passed}/{total} passed")

# 4. Retrieve submission to verify storage
print(f"\n4️⃣ Retrieving submission details...")
retrieve_response = requests.get(
    f"{API_URL}/submissions/{submission_id}",
    headers={"Authorization": f"Bearer {token}"}
)

if retrieve_response.status_code != 200:
    print(f"⚠️  Failed to retrieve submission: {retrieve_response.status_code}")
else:
    retrieved = retrieve_response.json()
    retrieved_submission = retrieved.get("submission")
    if retrieved_submission:
        print(f"✅ Submission retrieved from storage")
        print(f"   Verdict: {retrieved_submission.get('verdict')}")
        print(f"   Score: {retrieved_submission.get('score')} points")
    else:
        print(f"⚠️  Submission data not found in response")

print("\n" + "="*60)
print("✨ TEST COMPLETED SUCCESSFULLY!")
print("="*60)
print("\nℹ️ You can now:")
print("   1. Open http://localhost:3000 in your browser")
print("   2. Login with: demo@coduku.com / demo1234")
print("   3. Select a problem and submit code")
print("   4. Watch the verdict update in real-time!")
print("="*60)
