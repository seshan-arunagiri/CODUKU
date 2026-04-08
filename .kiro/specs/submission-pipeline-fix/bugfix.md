# Bugfix Requirements Document

## Introduction

The CODUKU submission pipeline has several interconnected bugs that together break the end-to-end flow from code submission through Judge0 execution to leaderboard scoring. The core issues are: Judge0 takes too long to start and its dependent services fail their healthchecks before it is ready; the polling loop uses a fixed linear delay with too few retries, causing premature timeouts; output comparison strips too little whitespace, producing false "Wrong Answer" verdicts for correct solutions; the leaderboard `/update_score` endpoint is called with a `score` field but the endpoint expects a `points` field, silently dropping score updates; and submissions are stored in a process-local `SUBMISSIONS_DB` dict instead of PostgreSQL, so all history is lost on restart. Additionally, the language map in `judge_service/app/main.py` is missing several languages present in the `Judge0Service` class (e.g. `typescript`, `swift` uses wrong ID 83 vs 75), and the `judge0-worker` service has no healthcheck, so it can start before Judge0 is fully ready.

---

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN the Docker stack starts THEN the `judge0` container takes 2–5 minutes to initialize but its `start_period` is only 30 s (no `start_period` was set before the recent partial fix), causing `judge` and `judge0-worker` to fail their dependency checks and crash-loop before Judge0 is ready.

1.2 WHEN `judge0-worker` starts THEN it has no healthcheck, so Docker marks it healthy immediately and `judge` starts before the worker queue is actually processing.

1.3 WHEN the judge service polls Judge0 for a result THEN it uses a linear delay (`0.5 + attempt * 0.2`, capped at 2 s) with a maximum of 60 attempts, which does not implement true exponential backoff and can exhaust retries on slow test cases.

1.4 WHEN Judge0 returns `stdout` with a trailing newline (the default for most runtimes) THEN the current `normalize_output` in `main.py` only calls `.strip()` on the raw string but does not normalize internal whitespace or line endings consistently, causing the string comparison to fail and returning "Wrong Answer" for a correct solution.

1.5 WHEN a submission receives an "Accepted" verdict THEN `update_leaderboard` posts `{"score": score, ...}` to `/api/v1/update_score`, but the leaderboard service's `UpdateScoreRequest` model requires the field to be named `points`, not `score`, so the request fails validation and no score is recorded.

1.6 WHEN a submission is stored THEN it is written to the in-memory `SUBMISSIONS_DB` dict in `main.py`; on service restart or container redeploy all submission history is lost and `GET /api/v1/submissions/{id}` returns "pending" for every past submission.

1.7 WHEN a user submits code in `typescript` THEN the language map in `main.py` maps it to Judge0 language ID 74, but the `Judge0Service` class in `judge0_service.py` does not include `typescript` at all, creating an inconsistency; similarly `swift` is mapped to ID 83 in `main.py` but to ID 75 in `judge0_service.py`.

1.8 WHEN the frontend calls the submission endpoint THEN it may target a direct service port (e.g. `localhost:8002`) instead of routing through the NGINX gateway on port 80, bypassing authentication middleware and causing CORS errors in production.

### Expected Behavior (Correct)

2.1 WHEN the Docker stack starts THEN the `judge0` healthcheck SHALL have `start_period: 180s` (already present) and `judge0-worker` SHALL depend on `judge0` with `condition: service_healthy`, so `judge` only starts after both Judge0 and its worker are confirmed ready.

2.2 WHEN `judge0-worker` starts THEN it SHALL have a healthcheck (e.g. checking the Resque worker process) so Docker can report its readiness accurately and downstream services wait correctly.

2.3 WHEN the judge service polls Judge0 for a result THEN it SHALL use true exponential backoff starting at 1 s, doubling each attempt up to a 10 s cap, with a maximum of 30 attempts (≈ 5 minutes total), and SHALL raise a clear timeout error if the limit is reached.

2.4 WHEN Judge0 returns `stdout` with trailing newlines, leading whitespace, or Windows-style `\r\n` line endings THEN the output normalizer SHALL strip all leading/trailing whitespace, normalize `\r\n` to `\n`, and strip trailing whitespace from each line before comparing, so a correct solution is never marked "Wrong Answer" due to whitespace differences.

2.5 WHEN a submission receives an "Accepted" verdict THEN `update_leaderboard` SHALL post `{"points": score, ...}` (using the field name `points`) to the leaderboard service's `/api/v1/update_score` endpoint so the score is correctly recorded.

2.6 WHEN a submission is completed THEN it SHALL be persisted to the PostgreSQL `submissions` table (using the `DatabaseService` already present in `database_service.py`) with a UUID-based `submission_id`, and `GET /api/v1/submissions/{id}` SHALL retrieve it from the database rather than from the in-memory dict.

2.7 WHEN a user submits code in any of the 18+ supported languages THEN the language ID map SHALL be unified across `main.py` and `judge0_service.py`, using the correct Judge0 IDs (e.g. `swift` → 83, `typescript` → 74) and covering all aliases (`python`, `python3`, `python2`, `js`, `node`, `ts`, `c#`, `cs`, `cpp17`, `c++`).

2.8 WHEN the frontend submits code THEN it SHALL route all API calls through the NGINX gateway (`/api/v1/submissions`) rather than directly to service ports, so authentication and CORS headers are applied consistently.

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a user submits correct code for any existing problem THEN the system SHALL CONTINUE TO return an "Accepted" verdict with the correct score.

3.2 WHEN a user submits code that produces wrong output THEN the system SHALL CONTINUE TO return a "Wrong Answer" verdict with per-test-case details.

3.3 WHEN a user submits code with a syntax error THEN the system SHALL CONTINUE TO return a "Compilation Error" verdict with the compiler message.

3.4 WHEN a user submits code that exceeds the time limit THEN the system SHALL CONTINUE TO return a "Time Limit Exceeded" verdict.

3.5 WHEN a user submits code that causes a runtime exception THEN the system SHALL CONTINUE TO return a "Runtime Error" verdict with the error message.

3.6 WHEN the leaderboard service receives a valid `/api/v1/update_score` request THEN it SHALL CONTINUE TO update the user's total points, increment `problems_solved`, and invalidate the Redis leaderboard cache.

3.7 WHEN `GET /api/v1/problems` or `GET /api/v1/problems/{id}` is called THEN the system SHALL CONTINUE TO return the full problem list and individual problem details without requiring Judge0 to be healthy.

3.8 WHEN `GET /health` is called on the judge service THEN it SHALL CONTINUE TO return service status including Judge0 connectivity, without blocking the response.

3.9 WHEN a submission is in progress and the judge service is polled via `GET /api/v1/submissions/{id}` THEN the system SHALL CONTINUE TO return a "Pending" status until the result is available.

---

## Bug Condition Pseudocode

```pascal
// Bug Condition: identifies inputs/states that trigger the submission pipeline bugs
FUNCTION isBugCondition(X)
  INPUT: X — a submission request or system startup event
  OUTPUT: boolean

  RETURN (
    // Startup race condition
    X.event = "docker_stack_start" AND judge0_ready_time > start_period
  ) OR (
    // Polling exhaustion
    X.event = "poll_judge0" AND X.execution_time_ms > (60 * 2000)
  ) OR (
    // Output normalization false negative
    X.event = "compare_output" AND X.actual_output ends_with "\n"
      AND X.expected_output does_not_end_with "\n"
  ) OR (
    // Leaderboard field mismatch
    X.event = "update_leaderboard" AND X.verdict = "Accepted"
  ) OR (
    // In-memory storage loss
    X.event = "get_submission" AND service_restarted = true
  ) OR (
    // Language ID mismatch
    X.language IN ["typescript", "swift"] AND caller = "main.py"
  )
END FUNCTION

// Property: Fix Checking
FOR ALL X WHERE isBugCondition(X) DO
  result ← submissionPipeline'(X)
  ASSERT result.verdict IN ["Accepted", "Wrong Answer", "Compilation Error",
                             "Runtime Error", "Time Limit Exceeded"]
         AND result.leaderboard_updated = true  // when verdict = "Accepted"
         AND result.persisted_to_db = true
         AND no_crash(result)
END FOR

// Property: Preservation Checking
FOR ALL X WHERE NOT isBugCondition(X) DO
  ASSERT submissionPipeline(X) = submissionPipeline'(X)
END FOR
```
