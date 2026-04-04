#!/usr/bin/env python3
"""
CODUKU Problem Seeding Script via PostgreSQL Direct Insertion
"""

import psycopg2
from psycopg2.extras import RealDictCursor
import json
import sys

# Configuration
DB_CONFIG = {
    "host": "localhost",
    "port": 5432,
    "database": "coduku",
    "user": "postgres",
    "password": "postgres"
}

# Color codes
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

def create_tables(conn):
    """Create required tables if they don't exist"""
    try:
        with conn.cursor() as cur:
            # Create problems table
            cur.execute("""
                CREATE TABLE IF NOT EXISTS problems (
                    id SERIAL PRIMARY KEY,
                    title VARCHAR(255) NOT NULL,
                    description TEXT NOT NULL,
                    difficulty VARCHAR(50),
                    score INTEGER DEFAULT 100,
                    time_limit FLOAT DEFAULT 5.0,
                    memory_limit INTEGER DEFAULT 256,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            # Create test_cases table
            cur.execute("""
                CREATE TABLE IF NOT EXISTS test_cases (
                    id SERIAL PRIMARY KEY,
                    problem_id INTEGER NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
                    input TEXT NOT NULL,
                    output TEXT NOT NULL,
                    visible BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            conn.commit()
            print_success("Database tables created/verified")
            return True
    except Exception as e:
        print_error(f"Failed to create tables: {e}")
        return False

def seed_problems(conn):
    """Insert test problems into database"""
    
    problems = [
        {
            "title": "Two Sum",
            "description": "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.",
            "difficulty": "easy",
            "score": 10,
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
            "score": 8,
            "test_cases": [
                {"input": "hello", "output": "olleh"},
                {"input": "Hannah", "output": "hannaH"}
            ]
        },
        {
            "title": "Palindrome Number",
            "description": "Given an integer x, return true if x is a palindrome integer. An integer is a palindrome when it reads the same forwards and backwards.",
            "difficulty": "easy",
            "score": 10,
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
            "score": 15,
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
            "score": 12,
            "test_cases": [
                {"input": "2", "output": "1"},
                {"input": "3", "output": "2"},
                {"input": "4", "output": "3"}
            ]
        }
    ]
    
    print_header("Seeding Problems to PostgreSQL")
    
    success_count = 0
    with conn.cursor() as cur:
        for i, problem in enumerate(problems, 1):
            try:
                # Insert problem
                cur.execute("""
                    INSERT INTO problems (title, description, difficulty, score, time_limit, memory_limit)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    RETURNING id
                """, (
                    problem["title"],
                    problem["description"],
                    problem["difficulty"],
                    problem["score"],
                    5.0,
                    256
                ))
                
                problem_id = cur.fetchone()[0]
                print(f"\n{Colors.YELLOW}Problem {i}: {problem['title']} (ID: {problem_id}){Colors.END}")
                
                # Insert test cases
                for j, tc in enumerate(problem.get("test_cases", []), 1):
                    cur.execute("""
                        INSERT INTO test_cases (problem_id, input, output, visible)
                        VALUES (%s, %s, %s, TRUE)
                    """, (problem_id, tc["input"], tc["output"]))
                    print_info(f"  Test case {j}: {tc['input'][:30]}... → {tc['output'][:30]}...")
                
                print_success(f"Problem {i} added with {len(problem.get('test_cases', []))} test cases")
                success_count += 1
                
            except Exception as e:
                print_error(f"Failed to add problem {i}: {e}")
    
    conn.commit()
    print(f"\n{Colors.BOLD}Added {success_count}/{len(problems)} problems{Colors.END}")
    return success_count == len(problems)

def verify_problems(conn):
    """Verify problems were added"""
    print_header("Verifying Problems")
    
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT id, title, difficulty, score FROM problems ORDER BY id")
            problems = cur.fetchall()
            
            if not problems:
                print_error("No problems found in database!")
                return False
            
            print_success(f"Found {len(problems)} problem(s):")
            for p in problems:
                print_info(f"  • [{p['id']}] {p['title']} [{p['difficulty'].upper()}] - {p['score']} pts")
            
            return True
    except Exception as e:
        print_error(f"Failed to verify: {e}")
        return False

def main():
    print_header("🧙 CODUKU Problem Seeding (PostgreSQL Direct)")
    print_info(f"Database: {DB_CONFIG['host']}:{DB_CONFIG['port']}/{DB_CONFIG['database']}")
    
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        print_success("Connected to PostgreSQL")
    except Exception as e:
        print_error(f"Failed to connect to database: {e}")
        print_info("Make sure PostgreSQL is running: docker-compose up postgres")
        return False
    
    try:
        # Create tables
        if not create_tables(conn):
            return False
        
        # Seed problems
        if not seed_problems(conn):
            return False
        
        # Verify
        if not verify_problems(conn):
            return False
        
        print_header("✨ Seeding Complete!")
        print_success("Problems are now in PostgreSQL!")
        print_info("Note: Judge service expects problems in Supabase.")
        print_info("Update the judge service to read from PostgreSQL for full functionality.")
        
        return True
        
    finally:
        conn.close()

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
