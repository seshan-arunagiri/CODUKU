#!/usr/bin/env python3
"""
CODUKU Full System Verification Script
Tests all critical endpoints and user flows
"""

import requests
import json
import time
import sys
from datetime import datetime

# Color codes for terminal output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'
BOLD = '\033[1m'

# Configuration
API_BASE = "http://localhost/api/v1"
TIMEOUT = 10
TEST_EMAIL = f"test_{int(time.time())}@coduku.dev"
TEST_PASSWORD = "TestPass123!"
TEST_USERNAME = f"student_{int(time.time())}"

class Colors:
    @staticmethod
    def success(msg): return f"{GREEN}✅ {msg}{RESET}"
    @staticmethod
    def error(msg): return f"{RED}❌ {msg}{RESET}"
    @staticmethod
    def warning(msg): return f"{YELLOW}⚠️  {msg}{RESET}"
    @staticmethod
    def info(msg): return f"{BLUE}ℹ️  {msg}{RESET}"
    @staticmethod
    def header(msg): return f"{BOLD}{BLUE}{'='*60}\n  {msg}\n{'='*60}{RESET}"

class TestResults:
    def __init__(self):
        self.results = []
        self.token = None
        self.user_id = None
        self.submission_id = None
        self.problem_id = None
    
    def add(self, name, passed, details=""):
        self.results.append({"name": name, "passed": passed, "details": details})
        status = Colors.success(name) if passed else Colors.error(name)
        print(status + (f" - {details}" if details else ""))
    
    def summary(self):
        total = len(self.results)
        passed = sum(1 for r in self.results if r["passed"])
        print(f"\n{Colors.header('Test Summary')}")
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total*100):.1f}%\n")
        return passed == total

results = TestResults()

def test_gateway_health():
    """Test NGINX Gateway is responding"""
    print(f"\n{Colors.header('Test 1: Gateway Health Check')}")
    try:
        response = requests.get(f"{API_BASE.replace('/api/v1', '')}/health", timeout=TIMEOUT)
        results.add("Gateway Health", response.status_code == 200, f"Status: {response.status_code}")
    except Exception as e:
        results.add("Gateway Health", False, f"Error: {str(e)}")

def test_auth_service_health():
    """Test Auth Service is responding"""
    print(f"\n{Colors.header('Test 2: Auth Service Health')}")
    try:
        response = requests.get("http://localhost:8001/health", timeout=TIMEOUT)
        results.add("Auth Service Health", response.status_code == 200, f"Status: {response.status_code}")
    except Exception as e:
        results.add("Auth Service Health", False, f"Error: {str(e)}")

def test_judge_service_health():
    """Test Judge Service is responding"""
    print(f"\n{Colors.header('Test 3: Judge Service Health')}")
    try:
        response = requests.get("http://localhost:8002/health", timeout=TIMEOUT)
        results.add("Judge Service Health", response.status_code == 200, f"Status: {response.status_code}")
    except Exception as e:
        results.add("Judge Service Health", False, f"Error: {str(e)}")

def test_leaderboard_service_health():
    """Test Leaderboard Service is responding"""
    print(f"\n{Colors.header('Test 4: Leaderboard Service Health')}")
    try:
        response = requests.get("http://localhost:8003/health", timeout=TIMEOUT)
        results.add("Leaderboard Service Health", response.status_code == 200, f"Status: {response.status_code}")
    except Exception as e:
        results.add("Leaderboard Service Health", False, f"Error: {str(e)}")

def test_judge0_health():
    """Test Judge0 is responding"""
    print(f"\n{Colors.header('Test 5: Judge0 Execution Engine')}")
    try:
        response = requests.get("http://localhost:2358/health", timeout=TIMEOUT)
        results.add("Judge0 Health", response.status_code == 200, f"Status: {response.status_code}")
    except Exception as e:
        results.add("Judge0 Health", False, f"Error: {str(e)}")

def test_user_registration():
    """Test user registration"""
    print(f"\n{Colors.header('Test 6: User Registration')}")
    try:
        payload = {
            "email": TEST_EMAIL,
            "username": TEST_USERNAME,
            "password": TEST_PASSWORD,
            "house": "gryffindor"
        }
        response = requests.post(f"{API_BASE}/auth/register", json=payload, timeout=TIMEOUT)
        
        if response.status_code == 200:
            data = response.json()
            results.token = data.get("access_token")
            results.user_id = data.get("user_id")
            results.add("User Registration", True, f"User: {data.get('email')}, House: {data.get('house')}")
            print(Colors.info(f"Registered: {TEST_EMAIL}"))
        else:
            results.add("User Registration", False, f"Status: {response.status_code}, Response: {response.text}")
    except Exception as e:
        results.add("User Registration", False, f"Error: {str(e)}")

def test_user_login():
    """Test user login"""
    print(f"\n{Colors.header('Test 7: User Login')}")
    try:
        payload = {
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        }
        response = requests.post(f"{API_BASE}/auth/login", json=payload, timeout=TIMEOUT)
        
        if response.status_code == 200:
            data = response.json()
            results.token = data.get("access_token")
            results.add("User Login", True, f"Token received")
            print(Colors.info(f"Token: {results.token[:30]}..."))
        else:
            results.add("User Login", False, f"Status: {response.status_code}")
    except Exception as e:
        results.add("User Login", False, f"Error: {str(e)}")

def test_get_profile():
    """Test getting user profile"""
    print(f"\n{Colors.header('Test 8: Get User Profile')}")
    if not results.token:
        results.add("Get Profile", False, "Token not available")
        return
    
    try:
        headers = {"Authorization": f"Bearer {results.token}"}
        response = requests.get(f"{API_BASE}/auth/me", headers=headers, timeout=TIMEOUT)
        
        if response.status_code == 200:
            data = response.json()
            results.add("Get Profile", True, f"User: {data.get('username')}, Score: {data.get('total_score', 0)}")
            print(Colors.info(f"House: {data.get('house')}, Problems Solved: {data.get('problems_solved', 0)}"))
        else:
            results.add("Get Profile", False, f"Status: {response.status_code}")
    except Exception as e:
        results.add("Get Profile", False, f"Error: {str(e)}")

def test_get_problems():
    """Test getting problems list"""
    print(f"\n{Colors.header('Test 9: Get Problems List')}")
    if not results.token:
        results.add("Get Problems", False, "Token not available")
        return
    
    try:
        headers = {"Authorization": f"Bearer {results.token}"}
        response = requests.get(f"{API_BASE}/questions?limit=10&offset=0", headers=headers, timeout=TIMEOUT)
        
        if response.status_code == 200:
            data = response.json()
            problem_list = data.get("questions", []) or data.get("data", []) or []
            if problem_list:
                results.problem_id = problem_list[0].get("id")
                results.add("Get Problems", True, f"Found {len(problem_list)} problems")
                print(Colors.info(f"First problem: {problem_list[0].get('title')}"))
            else:
                results.add("Get Problems", True, "No problems in database (add via admin)")
                print(Colors.warning("Create problems via admin endpoints to test submissions"))
        else:
            results.add("Get Problems", False, f"Status: {response.status_code}")
    except Exception as e:
        results.add("Get Problems", False, f"Error: {str(e)}")

def test_submit_code():
    """Test submitting code for evaluation"""
    print(f"\n{Colors.header('Test 10: Submit Code')}")
    if not results.token or not results.problem_id:
        results.add("Submit Code", False, "Token or Problem ID not available")
        return
    
    try:
        headers = {"Authorization": f"Bearer {results.token}"}
        payload = {
            "problem_id": results.problem_id,
            "language": "python3",
            "source_code": 'print("Hello World")'
        }
        response = requests.post(f"{API_BASE}/submissions", json=payload, headers=headers, timeout=TIMEOUT)
        
        if response.status_code == 200:
            data = response.json()
            results.submission_id = data.get("submission_id")
            results.add("Submit Code", True, f"Submission ID: {results.submission_id}")
        else:
            results.add("Submit Code", False, f"Status: {response.status_code}, Response: {response.text}")
    except Exception as e:
        results.add("Submit Code", False, f"Error: {str(e)}")

def test_check_submission():
    """Test checking submission status"""
    print(f"\n{Colors.header('Test 11: Check Submission Status')}")
    if not results.token or not results.submission_id:
        results.add("Check Submission", False, "Token or Submission ID not available")
        return
    
    try:
        headers = {"Authorization": f"Bearer {results.token}"}
        max_attempts = 30
        poll_interval = 1  # seconds
        
        for attempt in range(max_attempts):
            response = requests.get(f"{API_BASE}/submissions/{results.submission_id}", headers=headers, timeout=TIMEOUT)
            
            if response.status_code == 200:
                data = response.json()
                status = data.get("status", "unknown")
                
                if status != "pending":
                    results.add("Check Submission", True, 
                               f"Status: {status}, Passed: {data.get('test_cases_passed', 0)}/{data.get('test_cases_total', 0)}")
                    print(Colors.info(f"Score: {data.get('score', 0)}, Time: {data.get('execution_time_ms', 0)}ms"))
                    return
                
                print(Colors.info(f"  Polling... ({attempt + 1}/{max_attempts})"), end='\r')
                time.sleep(poll_interval)
            else:
                results.add("Check Submission", False, f"Status: {response.status_code}")
                return
        
        results.add("Check Submission", False, "Timeout: Judge0 took too long to execute")
    except Exception as e:
        results.add("Check Submission", False, f"Error: {str(e)}")

def test_get_leaderboard():
    """Test getting global leaderboard"""
    print(f"\n{Colors.header('Test 12: Get Global Leaderboard')}")
    try:
        response = requests.get(f"{API_BASE}/leaderboards/global?limit=10", timeout=TIMEOUT)
        
        if response.status_code == 200:
            data = response.json()
            leaders = data.get("leaderboard", []) or data.get("data", []) or []
            results.add("Get Leaderboard", True, f"Found {len(leaders)} entries")
            if leaders:
                print(Colors.info(f"Top user: {leaders[0].get('username')} with {leaders[0].get('total_score', 0)} points"))
        else:
            results.add("Get Leaderboard", False, f"Status: {response.status_code}")
    except Exception as e:
        results.add("Get Leaderboard", False, f"Error: {str(e)}")

def test_get_house_leaderboards():
    """Test getting house leaderboards"""
    print(f"\n{Colors.header('Test 13: Get House Leaderboards')}")
    try:
        response = requests.get(f"{API_BASE}/leaderboards/houses", timeout=TIMEOUT)
        
        if response.status_code == 200:
            data = response.json()
            results.add("Get House Leaderboards", True, f"Houses retrieved")
            for house, score in data.items():
                print(Colors.info(f"  {house}: {score} points"))
        else:
            results.add("Get House Leaderboards", False, f"Status: {response.status_code}")
    except Exception as e:
        results.add("Get House Leaderboards", False, f"Error: {str(e)}")

def main():
    """Run all tests"""
    print(f"\n{Colors.header('CODUKU FULL SYSTEM VERIFICATION')}")
    print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"API Base: {API_BASE}\n")
    
    # Run all tests
    test_gateway_health()
    test_auth_service_health()
    test_judge_service_health()
    test_leaderboard_service_health()
    test_judge0_health()
    test_user_registration()
    test_user_login()
    test_get_profile()
    test_get_problems()
    test_submit_code()
    test_check_submission()
    test_get_leaderboard()
    test_get_house_leaderboards()
    
    # Print summary
    all_passed = results.summary()
    
    # Exit with appropriate code
    sys.exit(0 if all_passed else 1)

if __name__ == "__main__":
    main()
