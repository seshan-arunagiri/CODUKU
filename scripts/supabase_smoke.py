import os

from dotenv import load_dotenv
from supabase import create_client


def main() -> None:
    load_dotenv("d:\\Projects\\coduku\\coduku-git-project\\backend\\.env", override=True)
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        print("supabase_config_ok=False")
        return

    supabase = create_client(url, key)
    try:
        res = supabase.table("users").select("id,email").limit(1).execute()
        print("supabase_query_ok=True")
        print("rows=" + str(len(res.data or [])))
    except Exception as e:
        print("supabase_query_ok=False")
        print("error_type=" + type(e).__name__)
        print("error=" + str(e))


if __name__ == "__main__":
    main()

