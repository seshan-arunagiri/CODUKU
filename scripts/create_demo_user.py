#!/usr/bin/env python3
"""
Create Demo User for CODUKU
Demo credentials:
  Email: demo@coduku.com
  Password: demo1234
  House: Gryffindor
"""

import os
import sys
import asyncio
from datetime import datetime
from uuid import uuid4
import hashlib
from passlib.context import CryptContext

# Add backend to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

import asyncpg
from dotenv import load_dotenv

load_dotenv()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

DEMO_USER = {
    "email": "demo@coduku.com",
    "username": "DemoWizard",
    "password": "demo1234",
    "house": "gryffindor"
}

async def create_demo_user():
    """Create demo user in PostgreSQL"""
    
    # Connection string
    postgres_url = os.getenv('POSTGRES_URL', 'postgresql://postgres:postgres@localhost:5432/coduku')
    
    conn = None
    try:
        # Connect to database
        conn = await asyncpg.connect(postgres_url)
        print(f"✅ Connected to database")
        
        # Hash password
        password_hash = pwd_context.hash(DEMO_USER["password"])
        user_id = str(uuid4())
        
        # Check if user already exists
        existing = await conn.fetchrow(
            "SELECT id FROM users WHERE email = $1",
            DEMO_USER["email"]
        )
        
        if existing:
            print(f"⚠️  Demo user already exists! Updating...")
            await conn.execute(
                """UPDATE users SET password_hash = $1, house = $2, updated_at = $3
                   WHERE email = $4""",
                password_hash,
                DEMO_USER["house"],
                datetime.utcnow(),
                DEMO_USER["email"]
            )
        else:
            print(f"📝 Creating demo user...")
            
            # Insert user
            await conn.execute(
                """INSERT INTO users (id, email, username, password_hash, house, created_at, updated_at)
                   VALUES ($1, $2, $3, $4, $5, $6, $7)""",
                user_id,
                DEMO_USER["email"],
                DEMO_USER["username"],
                password_hash,
                DEMO_USER["house"],
                datetime.utcnow(),
                datetime.utcnow()
            )
            
            # Create leaderboard entry
            try:
                await conn.execute(
                    """INSERT INTO leaderboard (id, user_id, total_score, problems_solved, ranking, acceptance_rate, created_at, updated_at)
                       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)""",
                    str(uuid4()),
                    user_id,
                    0,
                    0,
                    999,
                    0.0,
                    datetime.utcnow(),
                    datetime.utcnow()
                )
            except Exception as e:
                print(f"⚠️  Leaderboard entry warning: {e}")
                # Continue even if leaderboard fails
        
        print("\n✅ Demo user created/updated successfully!\n")
        print("📋 Demo Credentials:")
        print(f"   Email:    {DEMO_USER['email']}")
        print(f"   Password: {DEMO_USER['password']}")
        print(f"   House:    {DEMO_USER['house'].title()}")
        print("\n🚀 Use these credentials to login and test the platform!\n")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)
    finally:
        if conn:
            await conn.close()

if __name__ == "__main__":
    asyncio.run(create_demo_user())
