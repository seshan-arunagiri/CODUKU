"""
Create necessary database tables for CODUKU judge service
"""

import psycopg2
from datetime import datetime

# Database connection
conn = psycopg2.connect(
    host="localhost",
    port=5432,
    database="coduku",
    user="postgres",
    password="postgres"
)
cursor = conn.cursor()

try:
    # Create users table
    print("📋 Creating users table...")
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        username VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255),
        house VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)
    print("✅ Users table created/verified")

    # Create submissions table
    print("📋 Creating submissions table...")
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS submissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        problem_id INTEGER NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
        language VARCHAR(50) NOT NULL,
        source_code TEXT NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        test_cases_passed INTEGER DEFAULT 0,
        test_cases_total INTEGER DEFAULT 0,
        score INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        execution_time FLOAT,
        memory_used INTEGER,
        error_message TEXT,
        details JSONB
    );
    """)
    print("✅ Submissions table created/verified")
    
    # Create index on user_id and problem_id for faster queries
    print("📋 Creating database indexes...")
    cursor.execute("""
    CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON submissions(user_id);
    CREATE INDEX IF NOT EXISTS idx_submissions_problem_id ON submissions(problem_id);
    CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
    """)
    print("✅ Indexes created/verified")

    # Create leaderboard table
    print("📋 Creating leaderboard table...")
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS leaderboard (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(255) UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        total_score INTEGER DEFAULT 0,
        problems_solved INTEGER DEFAULT 0,
        ranking INTEGER,
        last_submission TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)
    print("✅ Leaderboard table created/verified")

    conn.commit()
    print("\n✅ All tables created successfully!")

except Exception as e:
    conn.rollback()
    print(f"❌ Error creating tables: {e}")
finally:
    cursor.close()
    conn.close()
