import json
import random
import time
import urllib.request
import urllib.error
from typing import Any, Dict, Optional


BASE = "http://localhost:8000"


def request(
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
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8") if hasattr(e, "read") else ""
        print("http_error_status=" + str(e.code))
        if raw:
            print("http_error_body=" + raw)
        raise


def main() -> None:
    email = f"day2user{random.randint(1000, 9999)}@test.com"
    password = "test123"
    headers: Dict[str, str]

    reg = request(
        "POST",
        "/api/v1/auth/register",
        {
            "email": email,
            "username": "day2",
            "name": "day2",
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

    submit = request(
        "POST",
        "/api/v1/submissions",
        {"problem_id": 1, "language": "python3", "source_code": "print('ok')"},
        headers=headers,
    )
    submission_id = submit["id"]
    print("submit_status=" + submit["status"])

    for i in range(120):
        status_res = request("GET", f"/api/v1/submissions/{submission_id}", headers=headers)
        if status_res["status"] != "pending":
            print("final_status=" + status_res["status"])
            print("score=" + str(status_res["score"]))
            print(
                "passed=" + str(status_res["test_cases_passed"]) + "/" + str(status_res["test_cases_total"])
            )
            return
        time.sleep(0.5)

    raise TimeoutError("Polling timed out")


if __name__ == "__main__":
    main()

