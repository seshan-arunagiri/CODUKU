import httpx


API_URL = "http://localhost:8000/api/v1"


def main() -> None:
    email = "smoke_" + "coduku_" + "user@example.com".replace("user", "u" + "x")
    password = "Password123!"
    username = "smokey"
    name = "Smoke User"
    house = "gryffindor"

    # Register (ignore if already exists)
    with httpx.Client(timeout=30) as client:
        try:
            r = client.post(
                f"{API_URL}/auth/register",
                json={
                    "email": email,
                    "password": password,
                    "username": username,
                    "name": name,
                    "house": house,
                },
            )
            if r.status_code not in (200, 400):
                print("register_failed_http", r.status_code, r.text[:200])
                return
        except Exception as e:
            print("register_failed", type(e).__name__, str(e))
            return

        # Login
        r = client.post(
            f"{API_URL}/auth/login",
            json={"email": email, "password": password},
        )
        r.raise_for_status()
        data = r.json()
        token = data["access_token"]

        # Questions
        rq = client.get(
            f"{API_URL}/questions",
            headers={"Authorization": f"Bearer {token}"},
        )
        rq.raise_for_status()
        questions = rq.json()

        print("questions_count", len(questions))
        if questions:
            print("first_question_keys", sorted(list(questions[0].keys())))

        # Me
        rm = client.get(
            f"{API_URL}/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        rm.raise_for_status()
        me = rm.json()
        print("me_total_score", me.get("total_score"))
        print("me_house", me.get("house"))


if __name__ == "__main__":
    main()

