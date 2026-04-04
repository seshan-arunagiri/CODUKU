#!/usr/bin/env python3
"""
CODUKU Problem Seeding Script
Adds 5 test problems to the database for compiler/scoring/leaderboard testing
"""

import requests
import json
import sys
from datetime import datetime

# Configuration
API_BASE = "http://localhost"
AUTH_EMAIL = "gryffindor@test.com"
AUTH_PASSWORD = "Test123!"

# Color codes for output
class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    END = '\033[0m'
    BOLD = '\033[1m'

def print_header(msg):
    print(f"\n{Colors.BOLD}{Colors.CYAN}{'='*60}")
    print(f"{msg}")
    print(f"{'='*60}{Colors.END}\n")

def print_success(msg):
    print(f"{Colors.GREEN}✅ {msg}{Colors.END}")

def print_error(msg):
    print(f"{Colors.RED}❌ {msg}{Colors.END}")

def print_info(msg):
    print(f"{Colors.BLUE}ℹ️  {msg}{Colors.END}")

def login():
    """Login and get JWT token"""
    print_header("Step 1: Authenticating")
    
    try:
        response = requests.post(
            f"{API_BASE}/api/v1/auth/login",
            json={
                "email": AUTH_EMAIL,
                "password": AUTH_PASSWORD
            },
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            token = data.get("access_token")
            user_id = data.get("user_id")
            print_success(f"Logged in as {AUTH_EMAIL}")
            print_info(f"User ID: {user_id}")
            print_info(f"Token: {token[:30]}...")
            return token, user_id
        else:
            print_error(f"Login failed: {response.status_code}")
            print_error(f"Response: {response.text}")
            return None, None
            
    except Exception as e:
        print_error(f"Login error: {str(e)}")
        return None, None


def add_problem(token, problem_data, index):
    """Add a single problem"""
    print(f"\n{Colors.YELLOW}Adding Problem {index}: {problem_data['title']}{Colors.END}")
    
    # Prepare test cases
    test_cases = []
    for tc in problem_data.get("test_cases", []):
        test_cases.append({
            "input": tc["input"],
            "output": tc["output"],
            "visible": True
        })
    
    payload = {
        "title": problem_data["title"],
        "description": problem_data["description"],
        "difficulty": problem_data["difficulty"],
        "score": problem_data.get("points", 100),
        "time_limit": 5.0,
        "memory_limit": 256,
        "test_cases": test_cases
    }
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Try multiple endpoints
    endpoints = [
        f"{API_BASE}/api/v1/questions",  # Gateway route
        "http://localhost:8000/api/v1/questions",  # Monolith backend
        "http://localhost:8002/api/v1/questions",  # Judge service
    ]
    
    for endpoint in endpoints:
        print_info(f"Trying: {endpoint}")
        try:
            response = requests.post(
                endpoint,
                json=payload,
                headers=headers,
                timeout=5
            )
            
            if response.status_code in [200, 201]:
                data = response.json()
                problem_id = data.get("problem", {}).get("id") or f"p{index}"
                print_success(f"Problem added (ID: {problem_id})")
                return True
            else:
                print_info(f"  Status {response.status_code} - {response.text[:100]}")
                
        except Exception as e:
            print_info(f"  Error: {str(e)[:80]}")
            continue
    
    print_error(f"Failed to add problem on any endpoint")
    return False


def get_problems(token):
    """List all available problems"""
    print_header("Step 3: Verifying Problems")
    
    endpoints = [
        f"{API_BASE}/api/v1/questions",  # Gateway
        "http://localhost:8000/api/v1/questions",  # Monolith
        "http://localhost:8002/api/v1/questions",  # Judge service
    ]
    
    headers = {"Authorization": f"Bearer {token}"}
    
    for endpoint in endpoints:
        print_info(f"Trying: {endpoint}")
        try:
            response = requests.get(
                endpoint,
                headers=headers,
                timeout=5
            )
            
            if response.status_code == 200:
                problems = response.json()
                if isinstance(problems, dict) and "problems" in problems:
                    problems = problems["problems"]
                if isinstance(problems, dict) and not isinstance(problems, list):
                    problems = [problems]
                
                print_success(f"Found {len(problems)} problem(s)")
                for p in problems:
                    if isinstance(p, dict):
                        difficulty = p.get("difficulty", "Unknown").upper()
                        score = p.get("score", "?")
                        title = p.get("title", "Unknown")
                        print_info(f"  • {title} [{difficulty}] - {score} pts")
                return True
            else:
                print_info(f"  Status {response.status_code}")
                
        except Exception as e:
            print_info(f"  Error: {str(e)[:60]}")
            continue
    
    print_error("Failed to list problems on any endpoint")
    return False


def main():
    print_header("🧙 CODUKU Problem Seeding Script")
    print_info(f"Target API: {API_BASE}")
    print_info(f"Auth User: {AUTH_EMAIL}")
    
    # Step 1: Login
    token, user_id = login()
    if not token:
        print_error("Failed to authenticate. Aborting.")
        return False
    
    # Define 5 test problems
    print_header("Step 2: Adding 5 Test Problems")
    
    problems = [
        {
            "title": "Two Sum",
            "description": "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.",
            "difficulty": "easy",
            "points": 10,
            "test_cases": [
                {"input": "2 7 11 15\n9", "output": "0 1"},
                {"input": "3 2 4\n6", "output": "1 2"},
                {"input": "3 3\n6", "output": "0 1"}
            ]
        },
        {
            "title": "Reverse String",
            "description": "Write a function that reverses a string. The input string is given as a sequence of characters.",
            "difficulty": "easy",
            "points": 8,
            "test_cases": [
                {"input": "hello", "output": "olleh"},
                {"input": "Hannah", "output": "hannaH"}
            ]
        },
        {
            "title": "Palindrome Number",
            "description": "Given an integer x, return true if x is a palindrome integer. An integer is a palindrome when it reads the same forwards and backwards.",
            "difficulty": "easy",
            "points": 10,
            "test_cases": [
                {"input": "121", "output": "True"},
                {"input": "-121", "output": "False"},
                {"input": "10", "output": "False"}
            ]
        },
        {
            "title": "Valid Parentheses",
            "description": "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.",
            "difficulty": "medium",
            "points": 15,
            "test_cases": [
                {"input": "()[]{}", "output": "True"},
                {"input": "(]", "output": "False"},
                {"input": "([)]", "output": "False"}
            ]
        },
        {
            "title": "Fibonacci Number",
            "description": "The Fibonacci numbers form a sequence where each number is the sum of the two preceding ones. Given n, return F(n).",
            "difficulty": "easy",
            "points": 12,
            "test_cases": [
                {"input": "2", "output": "1"},
                {"input": "3", "output": "2"},
                {"input": "4", "output": "3"}
            ]
        }
    ]
    
    # Add all problems
    success_count = 0
    for i, problem in enumerate(problems, 1):
        if add_problem(token, problem, i):
            success_count += 1
    
    print(f"\n{Colors.BOLD}Added {success_count}/{len(problems)} problems{Colors.END}")
    
    # Step 3: Verify
    if get_problems(token):
        print_header("✨ Seeding Complete!")
        print_success("You can now test the compiler with these problems.")
        print_info(f"Login at http://localhost:3000 with {AUTH_EMAIL} / Test123!")
        print_info("Submit code to test the full pipeline:")
        print_info("  1. Code compilation via Judge0")
        print_info("  2. Score calculation")
        print_info("  3. Leaderboard updates")
        return True
    else:
        print_error("Failed to verify problems")
        return False


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
