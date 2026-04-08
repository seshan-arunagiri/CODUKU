# Submission Pipeline Bugfix Design

## Overview

The CODUKU submission pipeline has 7 interconnected bugs that together break the end-to-end flow
from code submission through Judge0 execution to leaderboard scoring. The fix strategy is surgical:
each bug is isolated to a specific file and function, and the existing infrastructure (DatabaseService,
OutputNormalizer) is wired in rather than rewritten.

**System flow:**

```
Frontend (React)
    │  POST /api/v1/submissions
    ▼
NGINX Gateway (:80)
    │  proxy_pass → judge:8002
    ▼
Judge Service (main.py)
    │  submit_to_judge0()  →  Judge0 API (:2358)
    │                              │
    │                         judge0-worker (Resque)
    │                              │
    │  poll_judge0_result()  ←  result ready
    │
    ├─ normalize_output()  →  OutputNormalizer.compare()
    ├─ update_leaderboard()  →  Leaderboard Service (:8003)
    │                              │
    │                         PostgreSQL (users, submissions)
    │                         Redis (cache invalidation)
    └─ DatabaseService.save_submission()  →  PostgreSQL (submissions)
```

---

## Glossary

- **Bug_Condition (C)**: The set of inputs or system states that trigger one or more of the 7 bugs
- **Property (P)**: The desired correct behavior for each bug condition
- **Preservation**: Existing verdict logic, problem retrieval, and health endpoints that must remain unchanged
- **isBugCondition**: Pseudocode predicate identifying buggy inputs (see Bug Details)
- **poll_judge0_result**: Function in `main.py` that polls Judge0 for a submission token result
- **normalize_output**: Function in `main.py` that normalizes stdout before comparison
- **update_leaderboard**: Function in `main.py` that POSTs score to the leaderboard service
- **SUBMISSIONS_DB**: In-memory dict in `main.py` currently used instead of PostgreSQL
- **DatabaseService**: Class in `database_service.py` with `initialize()`, `save_submission()`, `get_submission()`
- **OutputNormalizer**: Class in `output_normalizer.py` with `compare(normalize_mode="lines")`
- **LANGUAGE_IDS**: Dict in `main.py` mapping language aliases to Judge0 integer IDs
- **LANGUAGE_MAP**: Dict in `judge0_service.py` — must mirror LANGUAGE_IDS after fix
- **UpdateScoreRequest**: Pydantic model in leaderboard `main.py` requiring `points: int` and `language: str`

---

## Bug Details

### Bug Condition

The pipeline is broken when any of the following conditions hold:

**Formal Specification:**
```
FUNCTION isBugCondition(X)
  INPUT: X — a submission request or system event
  OUTPUT: boolean

  RETURN (
    // Bug 1: Startup race — judge0-worker has no healthcheck
    X.event = "docker_stack_start"
    AND judge0_worker.healthcheck = NONE
  ) OR (
    // Bug 2: Polling exhaustion — linear delay, 60 attempts
    X.event = "poll_judge0"
    AND sleep_formula(attempt) = min(0.5 + attempt * 0.2, 2.0)
  ) OR (
    // Bug 3: Output normalization — only .strip(), misses \r\n and per-line whitespace
    X.event = "compare_output"
    AND normalize_fn(output) = output.strip()
  ) OR (
    // Bug 4: Leaderboard field mismatch — sends "score" instead of "points"
    X.event = "update_leaderboard"
    AND payload.key = "score"
    AND "language" NOT IN payload
  ) OR (
    // Bug 5: In-memory storage — lost on restart
    X.event = "get_submission"
    AND storage_backend = "SUBMISSIONS_DB_dict"
  ) OR (
    // Bug 6: Language ID inconsistency
    X.language IN ["typescript", "swift"]
    AND (main_py_id(X.language) != judge0_service_id(X.language))
  )
END FUNCTION
```

### Examples

- **Bug 1**: Stack starts, judge0-worker is marked ready immediately (no healthcheck), judge service
  starts before the Resque worker queue is processing — first submissions silently queue forever.
- **Bug 2**: A slow Java submission takes 45 s; 60 attempts × avg 1.25 s = 75 s budget, but the
  linear cap means attempts 10–60 all sleep 2 s = 100 s total. With exponential backoff (30 attempts,
  cap 10 s) the budget is ~5 min, matching real-world slow cases.
- **Bug 3**: Judge0 returns `"42\n"`, expected is `"42"`. `"42\n".strip() == "42"` passes, but
  `"42\r\n".strip() == "42"` also passes — however `"42 \n".strip() == "42 "` (trailing space
  preserved) fails. OutputNormalizer with `normalize_mode="lines"` handles all cases.
- **Bug 4**: `update_leaderboard` posts `{"score": 100, "user_id": ..., ...}`. The leaderboard
  `UpdateScoreRequest` model has `points: int` and `language: str` as required fields. Pydantic
  rejects the request with 422, score is silently dropped.
- **Bug 5**: User submits, gets `submission_id = "sub_1234"`. Service restarts. `GET
  /api/v1/submissions/sub_1234` returns 404 or "Pending" because `SUBMISSIONS_DB` is empty.
- **Bug 6**: User submits TypeScript — `main.py` maps `typescript → 74` (correct), but
  `judge0_service.py` has no `typescript` key at all, so `Judge0Service.submit_code("typescript",
  ...)` raises `ValueError: Unsupported language`. Swift: `main.py → 83`, `judge0_service.py → 75`.

---

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- All existing verdict types (Accepted, Wrong Answer, Runtime Error, Compilation Error, Time Limit
  Exceeded, Partial) must continue to be returned correctly
- `GET /api/v1/problems` and `GET /api/v1/problems/{id}` must continue to work without Judge0
- `GET /health` must continue to return service status without blocking
- Mouse-based UI interactions and non-submission API calls must be unaffected
- The leaderboard's cache invalidation, house standings, and global ranking logic must be unchanged

**Scope:**
All inputs that do NOT trigger isBugCondition should be completely unaffected. This includes:
- Submissions in languages other than `typescript`/`swift` (already consistent)
- Submissions where Judge0 responds within the first few polling attempts
- Output comparisons where stdout has no trailing whitespace or CRLF
- Leaderboard calls that already use the correct field names (none currently do — all are broken)

---

## Hypothesized Root Cause

1. **Missing healthcheck on judge0-worker (Bug 1)**: The `judge0-worker` service was added without
   a healthcheck block. Docker Compose has no way to know when the Resque worker is actually
   processing jobs, so it marks the container healthy immediately after start.

2. **Copy-paste polling loop (Bug 2)**: The linear formula `min(0.5 + attempt * 0.2, 2.0)` was
   written as a placeholder. The comment says "exponential backoff" but the implementation is linear.
   The 60-attempt limit was set without calculating total wait time.

3. **Incomplete normalize_output (Bug 3)**: `normalize_output` was written as a one-liner stub
   (`output.strip()`). The `OutputNormalizer` class already exists in `output_normalizer.py` with
   full CRLF handling and per-line stripping, but was never wired into `evaluate_submission`.

4. **Field name mismatch (Bug 4)**: The leaderboard `UpdateScoreRequest` model uses `points` (the
   domain term), but `update_leaderboard` in `main.py` was written with `score` (the local variable
   name). The `language` field was omitted entirely. No integration test caught this.

5. **In-memory storage (Bug 5)**: `SUBMISSIONS_DB` was a development placeholder. The comment
   `# In production, this would be in a database` was never acted on. `DatabaseService` was built
   in parallel but never wired into `main.py`.

6. **Divergent language maps (Bug 6)**: `LANGUAGE_IDS` in `main.py` and `LANGUAGE_MAP` in
   `judge0_service.py` were maintained independently. `main.py` added `typescript: 74` and
   corrected `swift: 83`, but `judge0_service.py` was not updated.

---

## Correctness Properties

Property 1: Bug Condition — Submission Pipeline Produces Correct Verdicts

_For any_ submission request where isBugCondition holds (any of the 6 bug conditions is true),
the fixed pipeline SHALL: return a valid verdict (Accepted / Wrong Answer / Runtime Error /
Compilation Error / Time Limit Exceeded), persist the submission to PostgreSQL via DatabaseService,
update the leaderboard with the correct `points` and `language` fields when verdict is Accepted,
and return the submission record on subsequent GET requests — without crashing or silently dropping data.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7**

Property 2: Preservation — Non-Buggy Inputs Produce Identical Behavior

_For any_ input where isBugCondition does NOT hold (language is not typescript/swift, output has
no CRLF or per-line trailing whitespace, Judge0 responds quickly, service has not restarted), the
fixed pipeline SHALL produce exactly the same verdict, score, and test case details as the original
pipeline, preserving all existing correct behavior.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9**

---

## Fix Implementation

### Bug 1 — Add healthcheck to judge0-worker and fix depends_on

**File**: `docker-compose.yml`

**Exact change — add healthcheck block to `judge0-worker` service:**
```yaml
judge0-worker:
  image: judge0/judge0:1.13.0
  container_name: judge0_worker
  command: bash -c "cd /api && QUEUES='*' bundle exec rake resque:work"
  healthcheck:
    test: ["CMD-SHELL", "cd /api && bundle exec rails runner 'puts Resque.workers.any? ? 0 : 1' 2>/dev/null | grep -q 0 || exit 1"]
    interval: 15s
    timeout: 10s
    retries: 5
    start_period: 60s
  depends_on:
    judge0:
      condition: service_healthy
    redis:
      condition: service_healthy
    postgres:
      condition: service_healthy
  ...
```

**Exact change — update `judge` service depends_on for judge0-worker:**
```yaml
judge:
  depends_on:
    judge0:
      condition: service_healthy
    judge0-worker:
      condition: service_healthy   # was: service_started
    postgres:
      condition: service_healthy
    redis:
      condition: service_healthy
```

---

### Bug 2 — Exponential backoff in poll_judge0_result

**File**: `backend/services/judge_service/app/main.py`

**Function**: `poll_judge0_result`

**Pseudocode for fixed polling loop:**
```
FUNCTION poll_judge0_result(token, max_retries=30)
  FOR attempt IN 0..max_retries-1 DO
    result ← GET /submissions/{token}
    IF result.status.id NOT IN [1, 2] THEN
      RETURN result
    END IF
    sleep_time ← min(1.0 * (2 ** attempt), 10.0)  // 1s, 2s, 4s, 8s, 10s, 10s, ...
    AWAIT sleep(sleep_time)
  END FOR
  RAISE TimeoutError("Judge0 result polling timed out after 30 attempts")
END FUNCTION
```

**Specific change** (replace the sleep line and default arg):
```python
# Before:
async def poll_judge0_result(token: str, max_retries: int = 60) -> Dict[str, Any]:
    ...
    sleep_time = min(0.5 + (attempt * 0.2), 2.0)  # Start at 0.5s, max 2s

# After:
async def poll_judge0_result(token: str, max_retries: int = 30) -> Dict[str, Any]:
    ...
    sleep_time = min(1.0 * (2 ** attempt), 10.0)  # Exponential: 1s, 2s, 4s, 8s, cap 10s
```

---

### Bug 3 — Use OutputNormalizer in normalize_output and evaluate_submission

**File**: `backend/services/judge_service/app/main.py`

**Function**: `normalize_output` and `evaluate_submission`

**Specific changes:**

1. Import OutputNormalizer at top of file:
```python
from app.services.output_normalizer import OutputNormalizer
```

2. Replace `normalize_output` stub:
```python
# Before:
async def normalize_output(output: str) -> str:
    if not output:
        return ""
    return output.strip()

# After:
async def normalize_output(output: str) -> str:
    if not output:
        return ""
    # Normalize CRLF, per-line trailing whitespace, and overall strip
    text = output.replace('\r\n', '\n').replace('\r', '\n')
    lines = [line.rstrip() for line in text.split('\n')]
    return '\n'.join(lines).strip()
```

3. In `evaluate_submission`, replace the manual comparison with `OutputNormalizer.compare`:
```python
# Before:
expected_normalized = await normalize_output(test_case.expected_output)
actual_normalized = await normalize_output(actual_output)
passed = (expected_normalized == actual_normalized) and (status_id == 3)

# After:
match, _ = OutputNormalizer.compare(
    actual_output,
    test_case.expected_output,
    normalize_mode="lines"
)
passed = match and (status_id == 3)
```

---

### Bug 4 — Fix leaderboard payload (score → points, add language)

**File**: `backend/services/judge_service/app/main.py`

**Function**: `update_leaderboard`

**Specific change:**
```python
# Before:
payload = {
    "user_id": user_id,
    "username": username,
    "house": house,
    "problem_id": problem_id,
    "score": score,
    "submission_id": submission_id
}

# After:
payload = {
    "user_id": user_id,
    "username": username,
    "house": house,
    "problem_id": problem_id,
    "points": score,          # renamed: score → points
    "language": language,     # added: required by UpdateScoreRequest
}
```

Note: `update_leaderboard` signature must also accept `language: str` as a parameter, and the
call site in `submit_code` must pass `request.language`.

---

### Bug 5 — Wire DatabaseService for submission persistence

**File**: `backend/services/judge_service/app/main.py`

**Specific changes:**

1. Import and remove in-memory dict:
```python
# Remove:
SUBMISSIONS_DB: Dict[str, Dict[str, Any]] = {}

# Add import:
from app.services.database_service import DatabaseService
import uuid
```

2. Add startup event to initialize DB:
```python
@app.on_event("startup")
async def startup():
    await DatabaseService.initialize()
```

3. In `submit_code`, replace SUBMISSIONS_DB write with DatabaseService:
```python
# Before:
submission_id = f"sub_{int(datetime.now().timestamp() * 1000)}"
SUBMISSIONS_DB[submission_id] = { ... }

# After:
submission_id = str(uuid.uuid4())
db_submission_id = await DatabaseService.save_submission(
    user_id=request.user_id,
    problem_id=request.problem_id,
    language=request.language,
    source_code=request.code,
    verdict=verdict.value,
    score=score if verdict == VerdictEnum.ACCEPTED else 0,
    passed_tests=sum(1 for r in test_results if r.passed),
    total_tests=len(test_results),
    execution_time=0.0,
)
```

4. In `GET /api/v1/submissions/{id}`, replace SUBMISSIONS_DB read:
```python
# Before:
submission = SUBMISSIONS_DB.get(submission_id)

# After:
submission = await DatabaseService.get_submission(int(submission_id))
```

---

### Bug 6 — Unify LANGUAGE_IDS across main.py and judge0_service.py

**File 1**: `backend/services/judge_service/app/main.py`

The canonical map (already mostly correct in main.py, add missing aliases):
```python
LANGUAGE_IDS = {
    "python": 71,
    "python3": 71,
    "python2": 71,
    "java": 62,
    "cpp": 54,
    "cpp17": 54,
    "c++": 54,
    "c": 50,
    "javascript": 63,
    "js": 63,
    "node": 63,
    "typescript": 74,
    "ts": 74,
    "go": 60,
    "rust": 73,
    "csharp": 51,
    "c#": 51,
    "cs": 51,
    "ruby": 72,
    "php": 68,
    "swift": 83,    # correct ID (was 75 in judge0_service.py)
    "kotlin": 78,
}
```

**File 2**: `backend/services/judge_service/app/services/judge0_service.py`

Replace `LANGUAGE_MAP` to mirror the canonical map:
```python
LANGUAGE_MAP = {
    "python": 71,
    "python3": 71,
    "python2": 71,
    "java": 62,
    "cpp": 54,
    "cpp17": 54,
    "c++": 54,
    "c": 50,
    "javascript": 63,
    "js": 63,
    "node": 63,
    "typescript": 74,
    "ts": 74,
    "go": 60,
    "rust": 73,
    "csharp": 51,
    "c#": 51,
    "cs": 51,
    "ruby": 72,
    "php": 68,
    "swift": 83,
    "kotlin": 78,
}
```

---

## Testing Strategy

### Validation Approach

Two-phase approach: first run exploratory tests on UNFIXED code to surface counterexamples and
confirm root cause analysis; then run fix-checking and preservation tests on the fixed code.

---

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate each bug on unfixed code. Confirm or refute
root cause hypotheses. If refuted, re-hypothesize before implementing the fix.

**Test Plan**: Write unit tests that directly invoke the buggy functions with inputs that trigger
each bug condition. Run on UNFIXED code and observe failures.

**Test Cases:**

1. **Polling linear delay test** (Bug 2): Call `poll_judge0_result` with a mock Judge0 that always
   returns status 1 (In Queue). Record actual sleep times per attempt. Assert they follow
   `min(0.5 + attempt * 0.2, 2.0)` — this confirms the bug. (Will fail on fixed code.)

2. **Output normalization CRLF test** (Bug 3): Call `normalize_output("42\r\n")` and
   `normalize_output("42 \n")`. Assert result equals `"42"`. On unfixed code, `"42\r\n".strip()`
   returns `"42"` (passes) but `"42 \n".strip()` returns `"42 "` (fails comparison).

3. **Leaderboard payload schema test** (Bug 4): Capture the payload dict built in
   `update_leaderboard`. Assert it contains key `"points"` and key `"language"`. On unfixed code,
   it contains `"score"` and no `"language"` — Pydantic 422 error.

4. **In-memory storage loss test** (Bug 5): Submit a request, capture `submission_id`. Clear
   `SUBMISSIONS_DB`. Call `GET /api/v1/submissions/{id}`. Assert it returns the submission. On
   unfixed code, it returns 404 after the dict is cleared.

5. **Language ID mismatch test** (Bug 6): Call `Judge0Service.submit_code("typescript", ...)` on
   unfixed code. Assert it raises `ValueError: Unsupported language`. Call with `"swift"` and
   assert language_id is 83. On unfixed code, swift maps to 75.

**Expected Counterexamples:**
- `normalize_output("42 \n")` returns `"42 "` instead of `"42"` — confirms Bug 3
- `update_leaderboard` payload has `"score"` key — confirms Bug 4
- `Judge0Service.submit_code("typescript", ...)` raises ValueError — confirms Bug 6

---

### Fix Checking

**Goal**: Verify that for all inputs where isBugCondition holds, the fixed pipeline produces
the expected behavior.

**Pseudocode:**
```
FOR ALL X WHERE isBugCondition(X) DO
  result := submissionPipeline_fixed(X)
  ASSERT result.verdict IN VALID_VERDICTS
  IF result.verdict = "Accepted" THEN
    ASSERT leaderboard_payload.points = result.score
    ASSERT leaderboard_payload.language = X.language
  END IF
  ASSERT DatabaseService.get_submission(result.submission_id) IS NOT NULL
  ASSERT no_crash(result)
END FOR
```

---

### Preservation Checking

**Goal**: Verify that for all inputs where isBugCondition does NOT hold, the fixed pipeline
produces the same result as the original.

**Pseudocode:**
```
FOR ALL X WHERE NOT isBugCondition(X) DO
  ASSERT submissionPipeline_original(X) = submissionPipeline_fixed(X)
END FOR
```

**Testing Approach**: Property-based testing is recommended because:
- It generates many random output strings to verify normalization is unchanged for clean inputs
- It generates random language names to verify non-affected languages still map correctly
- It catches edge cases that manual tests miss

**Test Cases:**

1. **Output normalization preservation**: For any output string with no `\r\n` and no trailing
   per-line whitespace, `normalize_output_fixed(s)` must equal `normalize_output_original(s)`.
2. **Language map preservation**: For any language in the original map (excluding swift/typescript),
   `LANGUAGE_IDS[lang]` must equal the original value.
3. **Verdict preservation**: For a submission where Judge0 returns status 4 (Wrong Answer),
   the verdict must still be `VerdictEnum.WRONG_ANSWER` after the fix.

---

### Unit Tests

- Test `normalize_output` with: trailing `\n`, `\r\n`, per-line trailing spaces, mixed CRLF+spaces,
  empty string, None
- Test `poll_judge0_result` sleep times: verify attempt 0→1s, attempt 1→2s, attempt 3→8s,
  attempt 4→10s (capped), attempt 5→10s (still capped)
- Test `update_leaderboard` payload: assert `"points"` key present, `"score"` key absent,
  `"language"` key present
- Test `LANGUAGE_IDS` and `LANGUAGE_MAP` parity: for every key in LANGUAGE_IDS, assert
  `LANGUAGE_MAP[key] == LANGUAGE_IDS[key]`
- Test `DatabaseService.save_submission` + `get_submission` round-trip with a mock asyncpg pool

### Property-Based Tests

- **Property 1 (Fix Checking)**: Generate random `(language, stdout, expected_output)` triples
  where stdout has random trailing whitespace/CRLF. Assert `OutputNormalizer.compare` returns
  True when the content (ignoring whitespace) matches.
- **Property 2 (Preservation — normalization)**: Generate random clean output strings (no CRLF,
  no trailing spaces). Assert `normalize_output_fixed(s) == s.strip()` (same as original for
  clean inputs).
- **Property 3 (Preservation — language map)**: For all language aliases not in
  `["typescript", "ts", "swift"]`, assert `LANGUAGE_IDS[lang] == original_value`.
- **Property 4 (Polling timeout)**: Generate random attempt counts 0–29. Assert
  `min(1.0 * (2 ** attempt), 10.0)` is always in range `[1.0, 10.0]` and is monotonically
  non-decreasing.

### Integration Tests

- Submit a TypeScript solution end-to-end; assert verdict is returned (not ValueError)
- Submit a correct Python solution with `\r\n` line endings in stdout; assert verdict is Accepted
- Submit an Accepted solution; assert leaderboard service receives `points` field (mock leaderboard)
- Restart judge service (clear in-memory state); assert previous submission is still retrievable
  via `GET /api/v1/submissions/{id}` from PostgreSQL
- Start docker stack; assert `judge` service does not start until `judge0-worker` healthcheck passes
