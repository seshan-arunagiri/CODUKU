import json
import time
import random
import urllib.request
import urllib.error
from typing import Any, Dict, Optional


BASE = "http://localhost:8000"


def request(method: str, path: str, body: Optional[Dict[str, Any]] = None, headers: Optional[Dict[str, str]] = None) -> Dict[str, Any]:
    url = BASE + path
    data = None if body is None else json.dumps(body).encode("utf-8")
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Content-Type", "application/json")
    if headers:
        for k, v in headers.items():
            req.add_header(k, v)
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8") if hasattr(e, "read") else ""
        print("http_error_status=" + str(e.code))
        if raw:
            print("http_error_body=" + raw[:400])
        raise


def main() -> None:
    email = f"lbuser{random.randint(1000, 9999)}@test.com"
    password = "test123"

    reg = request(
        "POST",
        "/api/v1/auth/register",
        {
            "email": email,
            "username": "lbuser",
            "name": "lbuser",
            "password": password,
            "house": "gryffindor",
        },
    )

    login = request(
        "POST",
        "/api/v1/auth/login",
        {"email": email, "password": password},
    )
    token = login["access_token"]
    headers = {"Authorization": "Bearer " + token}

    # Submit a small Python solution.
    submit = request(
        "POST",
        "/api/v1/submissions",
        {"problem_id": 1, "language": "python3", "source_code": "print('ok')"},
        headers=headers,
    )
    submission_id = submit["id"]

    # Poll.
    for _ in range(120):
        status_res = request("GET", f"/api/v1/submissions/{submission_id}", headers=headers)
        if status_res["status"] != "pending":
            break
        time.sleep(0.5)

    # Leaderboards smoke.
    lb_global = request("GET", "/api/v1/leaderboards/global", headers=headers)
    lb_houses = request("GET", "/api/v1/leaderboards/houses", headers=headers)
    lb_house = request("GET", "/api/v1/leaderboards/house/gryffindor", headers=headers)

    print("global_top_count=" + str(len(lb_global)))
    print("houses_count=" + str(len(lb_houses)))
    print("gryffindor_members_count=" + str(len(lb_house)))


if __name__ == "__main__":
    main()

