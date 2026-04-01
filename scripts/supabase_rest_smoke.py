import os
import json
import httpx
from dotenv import load_dotenv


def main() -> None:
    load_dotenv("d:\\Projects\\coduku\\coduku-git-project\\backend\\.env", override=True)
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        print("supabase_config_ok=False")
        return

    tables = ["users", "problems", "test_cases", "submissions"]
    headers = {
        "Authorization": f"Bearer {key}",
        "apikey": key,
        "Content-Type": "application/json",
    }

    try:
        for t in tables:
            endpoint = f"{url}/rest/v1/{t}?select=*&limit=1"
            r = httpx.get(endpoint, headers=headers, timeout=20)
            body_preview = (r.text or "").replace("\n", " ")[:120]
            print(f"table={t} http_status={r.status_code} body_preview={body_preview}")
    except Exception as e:
        print("request_failed")
        print("error_type=" + type(e).__name__)
        print("error=" + str(e))


if __name__ == "__main__":
    main()

