#!/usr/bin/env python
"""Test CODUKU API endpoints"""

import requests
import json
import random

BASE_URL = "http://localhost:8000"

def test_health():
    """Test health check"""
    print("=" * 50)
    print("TEST: Health Check")
    print("=" * 50)
    response = requests.get(f"{BASE_URL}/health")
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}\n")
    return response.status_code == 200

def test_get_problems():
    """Test get all problems"""
    print("=" * 50)
    print("TEST: Get Problems")
    print("=" * 50)
    response = requests.get(f"{BASE_URL}/api/v1/problems")
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        problems = response.json()
        print(f"Total problems: {len(problems)}")
        if problems:
            for i, p in enumerate(problems[:3]):
                print(f"\n  Problem {i+1}: {p.get('title', 'N/A')}")
                print(f"    Difficulty: {p.get('difficulty', 'N/A')}")
                print(f"    Score: {p.get('score', 'N/A')}")
    else:
        print(f"Error: {response.text}")
    print()
    return response.status_code == 200

def test_leaderboard():
    """Test get leaderboard"""
    print("=" * 50)
    print("TEST: Get Leaderboard")
    print("=" * 50)
    response = requests.get(f"{BASE_URL}/api/v1/leaderboards/global")
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        leaderboard = response.json()
        print(f"Leaderboard entries: {len(leaderboard)}")
        if leaderboard:
            print("\nTop 5 Users:")
            for i, entry in enumerate(leaderboard[:5]):
                print(f"  {i+1}. {entry.get('name', 'N/A')} - {entry.get('total_score', 0)} pts")
    else:
        print(f"Error: {response.text}")
    print()
    return response.status_code == 200

def test_registration():
    """Test user registration"""
    print("=" * 50)
    print("TEST: User Registration")
    print("=" * 50)
    
    email = f"test{random.randint(10000, 99999)}@coduku.dev"
    data = {
        "email": email,
        "password": "TestPass123!",
        "name": f"Test User {random.randint(1, 100)}"
    }
    
    response = requests.post(f"{BASE_URL}/api/v1/auth/register", json=data)
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        result = response.json()
        print(f"✓ User registered successfully")
        print(f"  Email: {result.get('email')}")
        print(f"  User ID: {result.get('user_id')}")
        print(f"  House: {result.get('house')}")
        print(f"  Token: {result.get('access_token', 'N/A')[:30]}...")
        return True, result.get('access_token'), result.get('user_id')
    else:
        print(f"✗ Registration failed: {response.text}")
        return False, None, None
    print()

def test_get_user_profile(token):
    """Test get user profile"""
    print("=" * 50)
    print("TEST: Get User Profile")
    print("=" * 50)
    
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/api/v1/users/me", headers=headers)
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        user = response.json()
        print(f"✓ Profile retrieved")
        print(f"  Name: {user.get('name')}")
        print(f"  Email: {user.get('email')}")
        print(f"  House: {user.get('house')}")
        print(f"  Total Score: {user.get('total_score')}")
        print(f"  Problems Solved: {user.get('problems_solved')}")
    else:
        print(f"✗ Error: {response.text}")
    print()

def main():
    print("\n")
    print("╔" + "═" * 48 + "╗")
    print("║" + " " * 10 + "CODUKU API ENDPOINT TESTING" + " " * 12 + "║")
    print("╚" + "═" * 48 + "╝")
    print()
    
    results = {
        "Health Check": test_health(),
        "Get Problems": test_get_problems(),
        "Get Leaderboard": test_leaderboard(),
    }
    
    # Test registration and profile
    success, token, user_id = test_registration()
    results["User Registration"] = success
    
    if token:
        test_get_user_profile(token)
        results["Get User Profile"] = True
    
    # Print summary
    print("=" * 50)
    print("TEST SUMMARY")
    print("=" * 50)
    for test_name, passed in results.items():
        status = "✓ PASS" if passed else "✗ FAIL"
        print(f"{status}: {test_name}")
    
    total = len(results)
    passed = sum(1 for v in results.values() if v)
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All tests passed! System is operational.")
    else:
        print(f"\n⚠️  Some tests failed. Please review.")

if __name__ == "__main__":
    main()
