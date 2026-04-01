import json
import argparse
import httpx
import asyncio
from dotenv import load_dotenv
import os


def parse_args():
    p = argparse.ArgumentParser(description="Seed CODUKU problems/test_cases into Supabase.")
    p.add_argument("--problems", default="problems.json", help="Path to problems.json")
    return p.parse_args()


async def main():
    args = parse_args()

    load_dotenv("d:\\Projects\\coduku\\coduku-git-project\\backend\\.env", override=True)
    supabase_url = os.getenv("SUPABASE_URL")
    service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    if not supabase_url or not service_key:
        raise RuntimeError("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in backend/.env")

    headers = {
        "Authorization": f"Bearer {service_key}",
        "apikey": service_key,
        "Content-Type": "application/json",
        # Ask PostgREST to return inserted rows.
        "Prefer": "return=representation",
    }

    with open(os.path.join("d:\\Projects\\coduku\\coduku-git-project", args.problems), "r", encoding="utf-8") as f:
        problems = json.load(f)

    async with httpx.AsyncClient(timeout=30) as client:
        for p in problems:
            title = p["title"]
            # Check if the problem already exists by title.
            existing = await client.get(
                f"{supabase_url}/rest/v1/problems",
                headers=headers,
                params={"title": f"eq.{title}", "limit": 1, "select": "id"},
            )
            if existing.status_code != 200:
                raise RuntimeError(f"Supabase select problems failed: {existing.status_code} {existing.text[:200]}")

            data = existing.json() or []
            if data:
                problem_row_id = data[0]["id"]
            else:
                # Insert problem; Supabase generates SERIAL id.
                insert_payload = {
                    "title": title,
                    "description": p["description"],
                    "difficulty": p["difficulty"],
                    "difficulty_multiplier": float(p.get("difficulty_multiplier", 1.0)),
                    "base_score": int(p.get("base_score", 100)),
                }
                inserted = await client.post(
                    f"{supabase_url}/rest/v1/problems",
                    headers=headers,
                    json=[insert_payload],
                )
                if inserted.status_code not in (200, 201):
                    raise RuntimeError(f"Supabase insert problems failed: {inserted.status_code} {inserted.text[:200]}")
                inserted_rows = inserted.json() or []
                if not inserted_rows:
                    raise RuntimeError(f"Supabase insert problems returned no rows for title={title}")
                problem_row_id = inserted_rows[0]["id"]

            # Insert visible + hidden test cases (schema has only expected_output + is_visible).
            test_cases = p.get("test_cases", [])
            # If any test cases already exist for this problem_id, skip re-inserting.
            tc_existing = await client.get(
                f"{supabase_url}/rest/v1/test_cases",
                headers=headers,
                params={"problem_id": f"eq.{problem_row_id}", "limit": 1, "select": "id"},
            )
            if tc_existing.status_code != 200:
                raise RuntimeError(f"Supabase select test_cases failed: {tc_existing.status_code} {tc_existing.text[:200]}")
            if (tc_existing.json() or []):
                print(f"skip test_cases title={title} (already seeded)")
                continue

            tc_payload = []
            for tc in test_cases:
                tc_payload.append(
                    {
                        "problem_id": problem_row_id,
                        "input": tc["input"],
                        "expected_output": tc["output"],
                        "is_visible": bool(tc.get("visible", True)),
                    }
                )

            if tc_payload:
                inserted_tcs = await client.post(
                    f"{supabase_url}/rest/v1/test_cases",
                    headers=headers,
                    json=tc_payload,
                )
                if inserted_tcs.status_code not in (200, 201):
                    raise RuntimeError(
                        f"Supabase insert test_cases failed: {inserted_tcs.status_code} {inserted_tcs.text[:200]}"
                    )

            print(f"seeded title={title} problem_id={problem_row_id} test_cases={len(tc_payload)}")


if __name__ == "__main__":
    asyncio.run(main())

