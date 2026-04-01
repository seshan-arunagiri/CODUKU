from supabase import create_client, Client
from app.core.config import settings
from typing import Optional, Dict, List, Any
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class SupabaseService:
    """Supabase PostgreSQL Database Service"""
    
    _instance: Optional[Client] = None
    
    @classmethod
    def get_client(cls) -> Client:
        """Get or create Supabase client"""
        if cls._instance is None:
            cls._instance = create_client(
                settings.SUPABASE_URL,
                settings.SUPABASE_SERVICE_ROLE_KEY
            )
            logger.info("✅ Supabase connected")
        return cls._instance
    
    # ===== USER OPERATIONS =====
    
    @classmethod
    async def create_user(cls, email: str, username: str, password_hash: str, house: str) -> Dict:
        """Create new user"""
        client = cls.get_client()
        try:
            response = client.table("users").insert({
                "email": email,
                "username": username,
                "password_hash": password_hash,
                "house": house.lower(),
                "total_score": 0,
                "problems_solved": 0,
                "created_at": datetime.utcnow().isoformat()
            }).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            logger.error(f"❌ Error creating user: {e}")
            return None
    
    @classmethod
    async def get_user_by_email(cls, email: str) -> Optional[Dict]:
        """Get user by email"""
        client = cls.get_client()
        try:
            response = client.table("users").select("*").eq("email", email).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            logger.error(f"❌ Error fetching user: {e}")
            return None
    
    @classmethod
    async def get_user_by_id(cls, user_id: str) -> Optional[Dict]:
        """Get user by ID"""
        client = cls.get_client()
        try:
            response = client.table("users").select("*").eq("id", user_id).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            logger.error(f"❌ Error fetching user: {e}")
            return None
    
    # ===== PROBLEM OPERATIONS =====
    
    @classmethod
    async def get_problems(cls, limit: int = 100, offset: int = 0) -> List[Dict]:
        """Get problems list"""
        client = cls.get_client()
        try:
            response = client.table("problems").select("*").order("difficulty").range(offset, offset + limit - 1).execute()
            return response.data if response.data else []
        except Exception as e:
            logger.error(f"❌ Error fetching problems: {e}")
            return []
    
    @classmethod
    async def get_problem(cls, problem_id: int) -> Optional[Dict]:
        """Get single problem"""
        client = cls.get_client()
        try:
            response = client.table("problems").select("*").eq("id", problem_id).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            logger.error(f"❌ Error fetching problem: {e}")
            return None
    
    @classmethod
    async def get_test_cases(cls, problem_id: int) -> List[Dict]:
        """Get test cases for problem"""
        client = cls.get_client()
        try:
            response = client.table("test_cases").select("*").eq("problem_id", problem_id).execute()
            return response.data if response.data else []
        except Exception as e:
            logger.error(f"❌ Error fetching test cases: {e}")
            return []
    
    # ===== SUBMISSION OPERATIONS =====
    
    @classmethod
    async def create_submission(cls, user_id: str, problem_id: int, language: str, source_code: str) -> Optional[Dict]:
        """Create new submission"""
        client = cls.get_client()
        try:
            response = client.table("submissions").insert({
                "user_id": user_id,
                "problem_id": problem_id,
                "language": language,
                "source_code": source_code,
                "status": "pending",
                "test_cases_passed": 0,
                "test_cases_total": 0,
                "score": 0,
                "created_at": datetime.utcnow().isoformat()
            }).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            logger.error(f"❌ Error creating submission: {e}")
            return None
    
    @classmethod
    async def update_submission(cls, submission_id: str, **kwargs) -> Optional[Dict]:
        """Update submission"""
        client = cls.get_client()
        try:
            kwargs["updated_at"] = datetime.utcnow().isoformat()
            response = client.table("submissions").update(kwargs).eq("id", submission_id).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            logger.error(f"❌ Error updating submission: {e}")
            return None
    
    @classmethod
    async def get_submission(cls, submission_id: str) -> Optional[Dict]:
        """Get submission by ID"""
        client = cls.get_client()
        try:
            response = client.table("submissions").select("*").eq("id", submission_id).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            logger.error(f"❌ Error fetching submission: {e}")
            return None
    
    @classmethod
    async def get_user_submissions(cls, user_id: str, limit: int = 50) -> List[Dict]:
        """Get user's submissions"""
        client = cls.get_client()
        try:
            response = client.table("submissions").select("*").eq("user_id", user_id).order("created_at", desc=True).limit(limit).execute()
            return response.data if response.data else []
        except Exception as e:
            logger.error(f"❌ Error fetching submissions: {e}")
            return []

supabase_service = SupabaseService()
