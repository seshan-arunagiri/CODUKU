import json
import random
import urllib.request
from typing import Any, Dict, Optional


BASE = "http://localhost:8000"


def _request(
    method: str,
    path: str,
    body: Optional[Dict[str, Any]] = None,
    headers: Optional[Dict[str, str]] = None,
) -> Dict[str, Any]:
    url = BASE + path
    data = None if body is None else json.dumps(body).encode("utf-8")

    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Content-Type", "application/json")
    if headers:
        for k, v in headers.items():
            req.add_header(k, v)

    with urllib.request.urlopen(req) as resp:
        raw = resp.read().decode("utf-8")
        return json.loads(raw)


def main() -> None:
    email = f"alice{random.randint(1000, 9999)}@test.com"
    password = "test123"

    register = {"name": "Alice", "email": email, "password": password, "house": "gryffindor"}
    reg_res = _request("POST", "/api/auth/register", register)
    token = reg_res["access_token"]

    login_body = {"email": email, "password": password}
    login_res = _request("POST", "/api/auth/login", login_body)
    token2 = login_res["access_token"]

    headers = {"Authorization": f"Bearer {token2}"}
    questions = _request("GET", "/api/questions", headers=headers)
    first_problem = questions[0]

    sample_code = (
        "def solution(nums, target):\n"
        "    seen = {}\n"
        "    for i, num in enumerate(nums):\n"
        "        complement = target - num\n"
        "        if complement in seen:\n"
        "            return [seen[complement], i]\n"
        "        seen[num] = i\n"
        "    return []\n"
    )

    submit = {"problem_id": first_problem["id"], "code": sample_code, "language": "python"}
    submit_res = _request("POST", "/api/submit", submit, headers=headers)

    global_leader = _request("GET", "/api/leaderboards/global", headers=headers)
    houses_leader = _request("GET", "/api/leaderboards/houses", headers=headers)

    print("register_ok=True")
    print(f"login_ok=True")
    print(f"submit_status={submit_res.get('status')}")
    print(f"submit_message={submit_res.get('message')}")
    print(f"global_count={len(global_leader)}")
    print(f"houses_count={len(houses_leader)}")


if __name__ == "__main__":
    main()

