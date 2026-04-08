# Implementation Plan

- [x] 1. Write bug condition exploration tests (BEFORE implementing any fix)
  - **Property 1: Bug Condition** - Submission Pipeline Bug Surface Tests
  - **CRITICAL**: These tests MUST FAIL on unfixed code — failure confirms the bugs exist
  - **DO NOT attempt to fix the tests or the code when they fail**
  - **GOAL**: Surface counterexamples that demonstrate each bug on unfixed code
  - Create `backend/services/judge_service/tests/test_bug_exploration.py`
  - **Bug 2 — Polling linear delay**: Mock Judge0 to always return status 1 (In Queue); record actual sleep times per attempt; assert they follow `min(0.5 + attempt * 0.2, 2.0)` — confirms the bug exists on unfixed code
  - **Bug 3 — Output normalization CRLF**: Call `normalize_output("42 \n")` and assert result equals `"42"` — on unfixed code `"42 \n".strip()` returns `"42 "` (trailing space), confirming the false-negative
  - **Bug 4 — Leaderboard payload schema**: Capture the payload dict built in `update_leaderboard`; assert it contains key `"points"` and key `"language"` — on unfixed code it has `"score"` and no `"language"`, confirming Pydantic 422
  - **Bug 5 — In-memory storage loss**: Submit a request, capture `submission_id`, clear `SUBMISSIONS_DB`, call `GET /api/v1/submissions/{id}`, assert it returns the submission — on unfixed code it returns 404
  - **Bug 6 — Language ID mismatch**: Call `Judge0Service.submit_code("typescript", ...)` and assert no ValueError; assert `Judge0Service.LANGUAGE_MAP["swift"] == 83` — on unfixed code typescript raises ValueError and swift maps to 75
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests FAIL (this is correct — it proves the bugs exist)
  - Document counterexamples found to understand root cause
  - Mark task complete when tests are written, run, and failures are documented
  - _Requirements: 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

- [x] 2. Write preservation property tests using Hypothesis (BEFORE implementing any fix)
  - **Property 2: Preservation** - Non-Buggy Input Behavior Baseline
  - **IMPORTANT**: Follow observation-first methodology — observe unfixed code behavior for non-buggy inputs first
  - Create `backend/services/judge_service/tests/test_preservation.py` using `hypothesis`
  - **Preservation 1 — Output normalization (clean inputs)**: Use `@given(st.text(alphabet=st.characters(blacklist_characters='\r'), min_size=1))` filtered to strings with no trailing per-line whitespace; assert `normalize_output_fixed(s) == s.strip()` (same as original for clean inputs)
  - **Preservation 2 — Language map (non-affected languages)**: Use `@given(st.sampled_from(["python", "python3", "java", "cpp", "c", "javascript", "go", "rust", "csharp", "ruby", "php", "kotlin"]))` and assert `LANGUAGE_IDS[lang]` equals the original canonical value
  - **Preservation 3 — Polling backoff bounds**: Use `@given(st.integers(min_value=0, max_value=29))` and assert `min(1.0 * (2 ** attempt), 10.0)` is always in `[1.0, 10.0]` and is monotonically non-decreasing
  - **Preservation 4 — Verdict mapping**: Assert that for Judge0 status 4 (Wrong Answer), `map_judge0_verdict` still returns `VerdictEnum.WRONG_ANSWER`; for status 6 returns `VerdictEnum.COMPILATION_ERROR`; for status 5 returns `VerdictEnum.TIME_LIMIT`
  - Observe and record actual outputs on UNFIXED code for non-buggy inputs
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

- [x] 3. Fix Bug 1 — Judge0 startup race condition

  - [x] 3.1 Add healthcheck to judge0-worker in docker-compose.yml
    - Add `healthcheck` block to `judge0-worker` service:
      ```yaml
      healthcheck:
        test: ["CMD-SHELL", "cd /api && bundle exec rails runner 'puts Resque.workers.any? ? 0 : 1' 2>/dev/null | grep -q 0 || exit 1"]
        interval: 15s
        timeout: 10s
        retries: 5
        start_period: 60s
      ```
    - _Bug_Condition: X.event = "docker_stack_start" AND judge0_worker.healthcheck = NONE_
    - _Expected_Behavior: judge0-worker reports readiness accurately; Docker waits before starting judge_
    - _Preservation: All other service healthchecks and depends_on conditions unchanged_
    - _Requirements: 2.1, 2.2_

  - [x] 3.2 Update judge service depends_on for judge0-worker
    - In `docker-compose.yml`, change `judge` service `depends_on.judge0-worker.condition` from `service_started` to `service_healthy`
    - _Requirements: 2.1, 2.2_

- [x] 4. Fix Bug 2 — Polling exponential backoff

  - [x] 4.1 Replace linear delay with exponential backoff in poll_judge0_result
    - In `backend/services/judge_service/app/main.py`, function `poll_judge0_result`:
    - Change default `max_retries` from `60` to `30`
    - Replace sleep formula: `min(0.5 + (attempt * 0.2), 2.0)` → `min(1.0 * (2 ** attempt), 10.0)`
    - Update timeout error message to reference 30 attempts
    - _Bug_Condition: X.event = "poll_judge0" AND sleep_formula(attempt) = min(0.5 + attempt * 0.2, 2.0)_
    - _Expected_Behavior: sleep_time = min(1.0 * (2 ** attempt), 10.0); sequence: 1s, 2s, 4s, 8s, 10s, 10s..._
    - _Preservation: Polling still returns result when Judge0 responds quickly (attempt 0 or 1)_
    - _Requirements: 2.3_

- [x] 5. Fix Bug 3 — Output normalization

  - [x] 5.1 Import OutputNormalizer and fix normalize_output function
    - In `backend/services/judge_service/app/main.py`, add import: `from app.services.output_normalizer import OutputNormalizer`
    - Replace `normalize_output` stub body with CRLF-aware normalization:
      ```python
      text = output.replace('\r\n', '\n').replace('\r', '\n')
      lines = [line.rstrip() for line in text.split('\n')]
      return '\n'.join(lines).strip()
      ```
    - _Bug_Condition: X.event = "compare_output" AND normalize_fn(output) = output.strip()_
    - _Expected_Behavior: CRLF normalized, per-line trailing whitespace stripped, overall stripped_
    - _Preservation: Clean inputs (no CRLF, no trailing spaces) produce same result as before_
    - _Requirements: 2.4_

  - [x] 5.2 Wire OutputNormalizer.compare into evaluate_submission
    - In `evaluate_submission`, replace the manual string comparison:
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
    - _Requirements: 2.4_

- [x] 6. Fix Bug 4 — Leaderboard payload field names

  - [x] 6.1 Rename score→points, add language param to update_leaderboard
    - In `backend/services/judge_service/app/main.py`, update `update_leaderboard` signature to accept `language: str`
    - Rename `"score": score` → `"points": score` in the payload dict
    - Add `"language": language` to the payload dict
    - Remove `"submission_id"` from payload (not in `UpdateScoreRequest` model)
    - _Bug_Condition: X.event = "update_leaderboard" AND payload.key = "score" AND "language" NOT IN payload_
    - _Expected_Behavior: payload contains "points" and "language"; leaderboard service accepts with 200_
    - _Preservation: Leaderboard cache invalidation, house standings, global ranking logic unchanged_
    - _Requirements: 2.5_

  - [x] 6.2 Update call site in submit_code to pass language
    - In `submit_code` endpoint, update the `background_tasks.add_task(update_leaderboard, ...)` call to pass `request.language` as the `language` argument
    - _Requirements: 2.5_

- [x] 7. Fix Bug 5 — PostgreSQL persistence

  - [x] 7.1 Add DatabaseService import and remove SUBMISSIONS_DB
    - In `backend/services/judge_service/app/main.py`:
    - Add imports: `from app.services.database_service import DatabaseService` and `import uuid`
    - Remove the `SUBMISSIONS_DB: Dict[str, Dict[str, Any]] = {}` declaration
    - _Bug_Condition: X.event = "get_submission" AND storage_backend = "SUBMISSIONS_DB_dict"_
    - _Expected_Behavior: submissions persisted to PostgreSQL; survive service restart_
    - _Preservation: GET /api/v1/problems and GET /health unaffected_
    - _Requirements: 2.6_

  - [x] 7.2 Add startup event to initialize DatabaseService
    - Add (or update existing) `@app.on_event("startup")` handler to call `await DatabaseService.initialize()`
    - _Requirements: 2.6_

  - [x] 7.3 Replace SUBMISSIONS_DB write with DatabaseService.save_submission
    - In `submit_code`, replace `submission_id = f"sub_{...}"` and `SUBMISSIONS_DB[submission_id] = {...}` with:
      ```python
      submission_id = str(uuid.uuid4())
      db_id = await DatabaseService.save_submission(
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
    - _Requirements: 2.6_

  - [x] 7.4 Replace SUBMISSIONS_DB read with DatabaseService.get_submission
    - In `GET /api/v1/submissions/{submission_id}`, replace `SUBMISSIONS_DB.get(submission_id)` with `await DatabaseService.get_submission(int(submission_id))`
    - Handle the case where `submission_id` is a UUID string (store and retrieve by UUID or map to DB integer id)
    - _Requirements: 2.6_

- [x] 8. Fix Bug 6 — Language map unification

  - [x] 8.1 Update LANGUAGE_IDS in main.py with canonical map
    - In `backend/services/judge_service/app/main.py`, replace `LANGUAGE_IDS` dict with the canonical map:
      - Add missing aliases: `"cpp17": 54`, `"c++": 54`, `"ts": 74`, `"cs": 51`, `"python2": 71`, `"node": 63`
      - Ensure `"swift": 83` (already correct in main.py)
      - Ensure `"typescript": 74` (already correct in main.py)
    - _Bug_Condition: X.language IN ["typescript", "swift"] AND main_py_id != judge0_service_id_
    - _Expected_Behavior: all aliases resolve to same Judge0 ID in both files_
    - _Preservation: All previously supported languages (python, java, cpp, c, js, go, rust, csharp, ruby, php, kotlin) map to same IDs as before_
    - _Requirements: 2.7_

  - [x] 8.2 Update LANGUAGE_MAP in judge0_service.py to mirror canonical map
    - In `backend/services/judge_service/app/services/judge0_service.py`, replace `LANGUAGE_MAP` to match the canonical map from 8.1:
      - Add: `"python2": 71`, `"node": 63`, `"typescript": 74`, `"ts": 74`, `"c++": 54`, `"cpp17": 54`, `"cs": 51`
      - Fix: `"swift": 75` → `"swift": 83`
    - _Requirements: 2.7_

- [x] 9. Verify Bug 7 — Frontend routing via NGINX gateway

  - [x] 9.1 Confirm apiService.js uses REACT_APP_API_URL
    - Verify `frontend/src/services/apiService.js` line: `const API_BASE = process.env.REACT_APP_API_URL || '/api/v1';`
    - Confirm `docker-compose.yml` frontend service sets `REACT_APP_API_URL: http://localhost/api/v1` (pointing to NGINX on port 80)
    - Confirm no hardcoded `localhost:8002` or direct service port references exist in apiService.js
    - This is already correct — no code change needed, document as verified
    - _Bug_Condition: frontend calls direct service port instead of NGINX gateway_
    - _Expected_Behavior: all API calls route through NGINX on port 80_
    - _Preservation: Auth headers and CORS handling unchanged_
    - _Requirements: 2.8_

- [x] 10. Verify fix — Re-run bug condition exploration tests

  - [x] 10.1 Re-run Property 1: Bug Condition tests after all fixes
    - **Property 1: Expected Behavior** - Submission Pipeline Bug Surface Tests
    - **IMPORTANT**: Re-run the SAME tests from task 1 — do NOT write new tests
    - Run `backend/services/judge_service/tests/test_bug_exploration.py` on FIXED code
    - **EXPECTED OUTCOME**: All tests PASS (confirms all 6 bugs are fixed)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

  - [x] 10.2 Re-run Property 2: Preservation tests after all fixes
    - **Property 2: Preservation** - Non-Buggy Input Behavior Baseline
    - **IMPORTANT**: Re-run the SAME tests from task 2 — do NOT write new tests
    - Run `backend/services/judge_service/tests/test_preservation.py` on FIXED code
    - **EXPECTED OUTCOME**: All tests PASS (confirms no regressions)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

- [x] 11. Checkpoint — Ensure all tests pass
  - Run full test suite: `pytest backend/services/judge_service/tests/ -v`
  - Confirm both exploration and preservation test files pass
  - Confirm no import errors from the new DatabaseService and OutputNormalizer wiring
  - Ask the user if any questions arise before closing the spec
