import json
import random
import urllib.request


BASE = "http://localhost:8000"


def request(method: str, path: str, body=None, headers=None):
    url = BASE + path
    data = None if body is None else json.dumps(body).encode("utf-8")
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Content-Type", "application/json")
    if headers:
        for k, v in headers.items():
            req.add_header(k, v)
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))


def main():
    email = f"v1user{random.randint(1000,9999)}@test.com"
    password = "test123"

    reg = request(
        "POST",
        "/api/v1/auth/register",
        {"name": "Bob", "email": email, "password": password, "house": "hufflepuff"},
    )
    token = reg["access_token"]

    login = request(
        "POST",
        "/api/v1/auth/login",
        {"email": email, "password": password},
    )
    token = login["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    questions = request("GET", "/api/v1/questions", headers=headers)
    submit_res = request(
        "POST",
        "/api/v1/submit",
        {"problem_id": questions[0]["id"], "code": "print(1)", "language": "python"},
        headers=headers,
    )
    leader = request("GET", "/api/v1/leaderboards/global", headers=headers)

    print("ok=True")
    print("submit_status=" + str(submit_res.get("status")))
    print("leader_count=" + str(len(leader)))


if __name__ == "__main__":
    main()

