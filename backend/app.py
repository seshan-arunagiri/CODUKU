"""
CodeHouses - Competitive Coding Platform Backend
Flask + MongoDB + JWT Authentication
"""

import os
import random
import time
import subprocess
import tempfile
import json
from datetime import datetime, timezone
from functools import wraps

from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager, create_access_token, jwt_required, get_jwt_identity
)
from werkzeug.security import generate_password_hash, check_password_hash
from pymongo import MongoClient, DESCENDING, ASCENDING
from bson import ObjectId
from bson.errors import InvalidId
from dotenv import load_dotenv

load_dotenv()

# ─── App Setup ───────────────────────────────────────────────────────────────
app = Flask(__name__)
CORS(app)

app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "codehouse-secret-key-change-in-prod")
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = False   # 30-day tokens handled by client

jwt = JWTManager(app)

# ─── Database ────────────────────────────────────────────────────────────────
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/coding_platform")
client = MongoClient(MONGO_URI)
db = client.get_default_database() if "coding_platform" not in MONGO_URI.split("/")[-1].split("?")[0] else client["coding_platform"]

# Collections
users_col       = db["users"]
questions_col   = db["questions"]
submissions_col = db["submissions"]
settings_col    = db["settings"]

# Ensure indexes
users_col.create_index("email", unique=True)
questions_col.create_index("difficulty")
submissions_col.create_index([("user_id", ASCENDING), ("submitted_at", DESCENDING)])
submissions_col.create_index("question_id")

# ─── Constants ───────────────────────────────────────────────────────────────
HOUSES = ["Gryffindor", "Hufflepuff", "Ravenclaw", "Slytherin"]
DIFFICULTY_FACTORS = {"Easy": 1.0, "Medium": 1.5, "Hard": 2.5}

# ─── Helpers ─────────────────────────────────────────────────────────────────

def serialize(doc):
    """Convert MongoDB ObjectId fields to strings recursively."""
    if doc is None:
        return None
    if isinstance(doc, list):
        return [serialize(d) for d in doc]
    if isinstance(doc, dict):
        result = {}
        for k, v in doc.items():
            if isinstance(v, ObjectId):
                result[k] = str(v)
            elif isinstance(v, datetime):
                result[k] = v.isoformat()
            elif isinstance(v, (dict, list)):
                result[k] = serialize(v)
            else:
                result[k] = v
        return result
    return doc


def admin_required(fn):
    """Decorator: only allow users with role='admin' or 'teacher'."""
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        uid = get_jwt_identity()
        user = users_col.find_one({"_id": ObjectId(uid)})
        if not user or user.get("role") not in ["admin", "teacher"]:
            return jsonify({"error": "Admin or Teacher access required"}), 403
        return fn(*args, **kwargs)
    return wrapper


def calculate_score(difficulty: str, passed: int, total: int, time_taken: float) -> float:
    """
    Score = Base × Difficulty Factor × Accuracy Bonus × Speed Bonus
    """
    if total == 0:
        return 0.0
    base = 100.0
    diff_factor = DIFFICULTY_FACTORS.get(difficulty, 1.0)
    accuracy = passed / total
    speed_bonus = min(1.2, 1.0 + max(0, (300 - time_taken)) / 1500)
    score = base * diff_factor * accuracy * speed_bonus
    return round(score, 2)


import requests
import concurrent.futures

def run_single_testcase(code, language, inp, expected, func_name, time_limit):
    """Executes a single test case LOCALLY on the server machine."""
    import subprocess
    import tempfile
    import json
    import time
    
    # Supported languages locally
    output = ""
    error = ""
    start_time = time.time()
    
    try:
        with tempfile.TemporaryDirectory() as tmp_dir:
            file_path = ""
            run_cmd = []
            
            if language == "python":
                file_path = os.path.join(tmp_dir, "solution.py")
                # Wrap for functional testing
                wrapped_code = f"""
import json, sys
{code}
try:
    inp = {repr(inp)}
    if isinstance(inp, list):
        res = {func_name}(*inp)
    elif isinstance(inp, dict):
        res = {func_name}(**inp)
    else:
        res = {func_name}(inp)
    print(json.dumps(res))
except Exception as e:
    print(str(e), file=sys.stderr)
    sys.exit(1)
"""
                with open(file_path, "w", encoding="utf-8") as f:
                    f.write(wrapped_code)
                run_cmd = ["python", file_path]
                
            elif language == "javascript":
                file_path = os.path.join(tmp_dir, "solution.js")
                # Wrap for node functional testing
                wrapped_code = f"""
{code}
try {{
    const inp = {json.dumps(inp)};
    const res = solution(...(Array.isArray(inp) ? inp : [inp]));
    process.stdout.write(JSON.stringify(res));
}} catch (e) {{
    process.stderr.write(e.message);
    process.exit(1);
}}
"""
                with open(file_path, "w", encoding="utf-8") as f:
                    f.write(wrapped_code)
                run_cmd = ["node", file_path]
                
            elif language == "java":
                # Java requires class name to match file name
                file_path = os.path.join(tmp_dir, "Solution.java")
                with open(file_path, "w", encoding="utf-8") as f:
                    f.write(code)
                # Compile
                compile_res = subprocess.run(["javac", "Solution.java"], cwd=tmp_dir, capture_output=True, text=True)
                if compile_res.returncode != 0:
                    return {"input": inp, "expected": str(expected).strip(), "actual": "", "passed": False, "error": "Compilation Error: " + compile_res.stderr}
                
                run_cmd = ["java", "Solution"]
                stdin_input = json.dumps(inp) if isinstance(inp, (list, dict)) else str(inp)
                
            else:
                return {"input": inp, "expected": str(expected).strip(), "actual": "", "passed": False, "error": f"Language '{language}' not installed for local execution."}

            # Execute
            try:
                # Pass stdin if it's not handled by the wrapper
                stdin_data = stdin_input if language == "java" else None
                
                proc = subprocess.run(
                    run_cmd,
                    input=stdin_data,
                    cwd=tmp_dir,
                    capture_output=True,
                    text=True,
                    timeout=time_limit
                )
                output = proc.stdout.strip()
                error = proc.stderr.strip()
                
                passed = False
                if proc.returncode == 0:
                    if output == str(expected).strip():
                        passed = True
                    else:
                        error = "Wrong Answer"
                else:
                    error = "Runtime Error: " + error
                
                return {
                    "input": inp,
                    "expected": str(expected).strip(),
                    "actual": output,
                    "passed": passed,
                    "error": error if not passed else None
                }
            except subprocess.TimeoutExpired:
                return {"input": inp, "expected": str(expected).strip(), "actual": "", "passed": False, "error": "Time Limit Exceeded"}

    except Exception as e:
        return {"input": inp, "expected": str(expected).strip(), "actual": None, "passed": False, "error": f"Local executor error: {str(e)}"}



def execute_code_external(code: str, language: str, test_cases: list, time_limit: int = 5) -> dict:
    """Execute code against test cases via an external Compiler API concurrently."""
    results = []
    total = len(test_cases)
    passed = 0

    # We use a ThreadPoolExecutor to run all test cases in parallel via the API
    with concurrent.futures.ThreadPoolExecutor(max_workers=min(total, 10)) as executor:
        futures = []
        for tc in test_cases:
            inp = tc.get("input", "")
            expected = tc.get("output", "")
            func_name = tc.get("function_name", "solution")
            futures.append(executor.submit(run_single_testcase, code, language, inp, expected, func_name, time_limit))
        
        for future in concurrent.futures.as_completed(futures):
            res = future.result()
            results.append(res)
            if res["passed"]:
                passed += 1

    return {"passed": passed, "total": total, "results": results}


# ─── Auth Routes ─────────────────────────────────────────────────────────────

@app.route("/api/auth/register", methods=["POST"])
def register():
    data = request.get_json()
    name     = (data.get("name") or "").strip()
    email    = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    role_req = (data.get("role") or "student").strip().lower()
    secret   = (data.get("teacher_secret") or "").strip()

    if not name or not email or not password:
        return jsonify({"error": "Name, email and password are required"}), 400
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400

    # Validate teacher registration
    role = "student"
    if role_req == "teacher":
        expected_secret = os.getenv("TEACHER_SECRET", "pranesh")
        if secret != expected_secret:
            return jsonify({"error": "Invalid teacher access code"}), 403
        role = "teacher"

    if users_col.find_one({"email": email}):
        return jsonify({"error": "Email already registered"}), 409

    house = random.choice(HOUSES)
    hashed = generate_password_hash(password)
    user_doc = {
        "name": name,
        "email": email,
        "password": hashed,
        "house": house,
        "role": role,
        "problems_solved": 0,
        "total_submissions": 0,
        "average_score": 0.0,
        "total_score": 0.0,
        "created_at": datetime.now(timezone.utc)
    }
    result = users_col.insert_one(user_doc)
    uid = str(result.inserted_id)
    token = create_access_token(identity=uid)

    return jsonify({
        "message": "User registered successfully",
        "access_token": token,
        "user": {
            "id": uid,
            "name": name,
            "email": email,
            "house": house,
            "role": "student"
        }
    }), 201


@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.get_json()
    email    = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not email or not password:
        return jsonify({"error": "Email and password required"}), 400

    user = users_col.find_one({"email": email})
    if not user or not check_password_hash(user["password"], password):
        return jsonify({"error": "Invalid email or password"}), 401

    uid = str(user["_id"])
    token = create_access_token(identity=uid)

    return jsonify({
        "message": "Login successful",
        "access_token": token,
        "user": {
            "id": uid,
            "name": user["name"],
            "email": user["email"],
            "house": user["house"],
            "role": user.get("role", "student")
        }
    })


# ─── User Routes ─────────────────────────────────────────────────────────────

@app.route("/api/user/profile", methods=["GET"])
@app.route("/api/user/profile/<target_uid>", methods=["GET"])
@jwt_required()
def get_profile(target_uid=None):
    uid = target_uid if target_uid else get_jwt_identity()
    user = users_col.find_one({"_id": ObjectId(uid)}, {"password": 0})
    if not user:
        return jsonify({"error": "User not found"}), 404
        
    subs = list(submissions_col.find({"user_id": uid}, sort=[("submitted_at", DESCENDING)]))
    dates = []
    from datetime import datetime, timezone, timedelta
    for s in subs:
        if "submitted_at" in s:
            date_val = s["submitted_at"]
            if isinstance(date_val, datetime):
                dates.append(date_val.strftime("%Y-%m-%d"))
            else:
                dates.append(str(date_val)[:10])
                
    unique_dates = sorted(list(set(dates)), reverse=True)
    streak = 0
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    yesterday = (datetime.now(timezone.utc) - timedelta(days=1)).strftime("%Y-%m-%d")
    
    if unique_dates:
        if unique_dates[0] in [today, yesterday]:
            streak = 1
            current_date = datetime.strptime(unique_dates[0], "%Y-%m-%d")
            for i in range(1, len(unique_dates)):
                d = datetime.strptime(unique_dates[i], "%Y-%m-%d")
                if (current_date - d).days == 1:
                    streak += 1
                    current_date = d
                else:
                    break

    badges = []
    
    if streak >= 7:
        badges.append({"id": "week", "name": "Seeker's Spark", "icon": "⚡", "desc": "7 Day Streak"})
    if streak >= 30:
        badges.append({"id": "month", "name": "Marauder's Map", "icon": "🗺️", "desc": "30 Day Streak"})
    if streak >= 365:
        badges.append({"id": "year", "name": "Elder Wand Mastery", "icon": "🪄", "desc": "365 Day Streak"})
        
    top_user = list(users_col.find({"role": "student"}, sort=[("average_score", DESCENDING)], limit=1))
    if top_user and str(top_user[0]["_id"]) == uid and top_user[0].get("average_score", 0) > 0:
        badges.append({"id": "top", "name": "Triwizard Champion", "icon": "🏆", "desc": "Current #1 Global Leader"})
        
    badges.append({"id": "join", "name": "Sorting Hat", "icon": "🎩", "desc": f"Sorted into {user.get('house', 'Hogwarts')}"})

    user["streak"] = streak
    user["badges"] = badges
    
    return jsonify(serialize(user))


@app.route("/api/user/submissions", methods=["GET"])
@jwt_required()
def get_user_submissions():
    uid = get_jwt_identity()
    subs = list(submissions_col.find(
        {"user_id": uid},
        sort=[("submitted_at", DESCENDING)],
        limit=50
    ))
    # Attach question title
    for s in subs:
        try:
            q = questions_col.find_one({"_id": ObjectId(s["question_id"])}, {"title": 1, "difficulty": 1})
            s["question_title"] = q["title"] if q else "Unknown"
            s["difficulty"] = q["difficulty"] if q else "Unknown"
        except Exception:
            s["question_title"] = "Unknown"
            s["difficulty"] = "Unknown"
    return jsonify(serialize(subs))


# ─── Question Routes ──────────────────────────────────────────────────────────

@app.route("/api/questions", methods=["GET"])
@jwt_required()
def get_questions():
    filt = {}
    difficulty = request.args.get("difficulty")
    if difficulty:
        filt["difficulty"] = difficulty

    # Security check: students shouldn't see the competition question 
    # unless they are explicitly assigned to it during the time window
    uid = get_jwt_identity()
    user = users_col.find_one({"_id": ObjectId(uid)})
    is_teacher = user and user.get("role") in ["admin", "teacher"]
    
    # Check if a competition is currently set up
    now = datetime.now()
    setting = settings_col.find_one({"key": "competition_question"})
    comp_window_active = False

    if setting and setting.get("value") and not is_teacher:
        comp_id = setting.get("value")
        start_hour = setting.get("start_hour", 17)
        end_hour = setting.get("end_hour", 22)
        comp_window_active = start_hour <= now.hour < end_hour
        
        # Hide it by default from normal fetching if window is NOT active
        if not comp_window_active:
            if "_id" not in filt:
                filt["_id"] = {"$ne": ObjectId(comp_id)}
    questions = list(questions_col.find(filt, {"test_cases": 0, "solution": 0}))
    return jsonify(serialize(questions))


@app.route("/api/questions/<question_id>", methods=["GET"])
@jwt_required()
def get_question(question_id):
    try:
        q = questions_col.find_one({"_id": ObjectId(question_id)}, {"solution": 0})
    except InvalidId:
        return jsonify({"error": "Invalid question ID"}), 400
    if not q:
        return jsonify({"error": "Question not found"}), 404

    # Time-gate competition question
    uid = get_jwt_identity()
    user = users_col.find_one({"_id": ObjectId(uid)})
    is_teacher = user and user.get("role") in ["admin", "teacher"]
    
    if not is_teacher:
        setting = settings_col.find_one({"key": "competition_question"})
        if setting and setting.get("value") == question_id:
            now = datetime.now()
            start_hour = setting.get("start_hour", 17)
            end_hour = setting.get("end_hour", 22)
            if not (start_hour <= now.hour < end_hour):
                return jsonify({"error": f"This trial is only available between {start_hour}:00 and {end_hour}:00."}), 403

    # Hide expected output from test cases shown to user
    q_out = serialize(q)
    visible_cases = []
    for tc in q_out.get("test_cases", []):
        visible_cases.append({
            "input": tc.get("input"),
            "function_name": tc.get("function_name", "solution")
        })
    q_out["sample_test_cases"] = visible_cases[:2]   # show first 2
    return jsonify(q_out)


# ─── Submission Routes ────────────────────────────────────────────────────────

@app.route("/api/submit", methods=["POST"])
@jwt_required()
def submit_code():
    uid = get_jwt_identity()
    data = request.get_json()
    question_id = data.get("question_id")
    code        = data.get("code", "")
    language    = data.get("language", "python").lower()

    if not question_id or not code:
        return jsonify({"error": "question_id and code are required"}), 400

    try:
        q = questions_col.find_one({"_id": ObjectId(question_id)})
    except InvalidId:
        return jsonify({"error": "Invalid question ID"}), 400
    if not q:
        return jsonify({"error": "Question not found"}), 404

    if language not in ["c", "cpp", "java", "javascript", "python", "go", "rust", "ruby", "csharp"]:
        return jsonify({"error": f"{language} is not supported at this time"}), 400

    start = time.time()
    exec_result = execute_code_external(code, language, q.get("test_cases", []), q.get("time_limit", 5))
    elapsed = round(time.time() - start, 3)

    passed = exec_result["passed"]
    total  = exec_result["total"]
    score  = calculate_score(q["difficulty"], passed, total, elapsed)

    # Save submission
    sub_doc = {
        "user_id":        uid,
        "question_id":    str(q["_id"]),
        "code":           code,
        "language":       language,
        "score":          score,
        "passed_tests":   passed,
        "total_tests":    total,
        "execution_time": elapsed,
        "exec_results":   exec_result["results"],
        "submitted_at":   datetime.now(timezone.utc)
    }
    sub_result = submissions_col.insert_one(sub_doc)

    # Update user stats
    user = users_col.find_one({"_id": ObjectId(uid)})
    if user:
        total_subs    = user.get("total_submissions", 0) + 1
        total_score   = user.get("total_score", 0.0) + score
        avg_score     = round(total_score / total_subs, 2)
        # Count unique solved questions (passed all tests)
        solved = submissions_col.count_documents({
            "user_id": uid,
            "passed_tests": {"$gt": 0},
            "total_tests": {"$gt": 0},
        })
        users_col.update_one(
            {"_id": ObjectId(uid)},
            {"$set": {
                "total_submissions": total_subs,
                "total_score": total_score,
                "average_score": avg_score,
                "problems_solved": solved
            }}
        )

    return jsonify({
        "submission_id":  str(sub_result.inserted_id),
        "score":          score,
        "passed_tests":   passed,
        "total_tests":    total,
        "execution_time": elapsed,
        "execution_result": exec_result["results"]
    })


@app.route("/api/execute", methods=["POST"])
@jwt_required()
def execute_standalone():
    """Runs a single piece of code without checking against a question's tests (for frontend testing)."""
    data     = request.get_json()
    code     = data.get("code", "")
    language = data.get("language", "python").lower()
    stdin    = data.get("stdin", "")
    
    import subprocess, tempfile, os
    
    with tempfile.TemporaryDirectory() as tmp_dir:
        file_path = ""
        run_cmd = []
        
        if language == "python":
            file_path = os.path.join(tmp_dir, "solution.py")
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(code)
            run_cmd = ["python", file_path]
        elif language == "javascript":
            file_path = os.path.join(tmp_dir, "solution.js")
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(code)
            run_cmd = ["node", file_path]
        elif language == "java":
            file_path = os.path.join(tmp_dir, "Solution.java")
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(code)
            compile_res = subprocess.run(["javac", "Solution.java"], cwd=tmp_dir, capture_output=True, text=True)
            if compile_res.returncode != 0:
                return jsonify({"stdout": "", "stderr": compile_res.stderr, "error": "Compilation Error"}), 200
            run_cmd = ["java", "Solution"]
        else:
            return jsonify({"error": f"Language '{language}' not supported locally."}), 400

        try:
            proc = subprocess.run(
                run_cmd,
                input=stdin,
                cwd=tmp_dir,
                capture_output=True,
                text=True,
                timeout=10
            )
            return jsonify({
                "stdout": proc.stdout,
                "stderr": proc.stderr,
                "error": None if proc.returncode == 0 else "Runtime Error"
            })
        except subprocess.TimeoutExpired:
            return jsonify({"stdout": "", "stderr": "Time Limit Exceeded", "error": "Timeout"}), 200
        except Exception as e:
            return jsonify({"stdout": "", "stderr": str(e), "error": "System Error"}), 200


# ─── Leaderboard Routes ───────────────────────────────────────────────────────

@app.route("/api/leaderboards/global", methods=["GET"])
@jwt_required()
def global_leaderboard():
    # Check if competition mode is active
    now = datetime.now()
    setting = settings_col.find_one({"key": "competition_question"})
    
    comp_active = False
    comp_q_id = None
    if setting:
        start_hour = setting.get("start_hour", 17)
        end_hour = setting.get("end_hour", 22)
        comp_active = start_hour <= now.hour < end_hour
        comp_q_id = setting.get("value")

    if comp_active and comp_q_id:
        # Calculate ranks based ONLY on the competition question
        pipeline = [
            {"$match": {"question_id": comp_q_id}},
            {"$group": {
                "_id": "$user_id",
                "max_score": {"$max": "$score"},
                "solved": {"$first": 1}
            }},
            {"$sort": {"max_score": DESCENDING}}
        ]
        comp_results = list(submissions_col.aggregate(pipeline))
        comp_map = {res["_id"]: res["max_score"] for res in comp_results}
        
        students = list(users_col.find({"role": "student"}, {"password": 0}))
        result = []
        for s in students:
            uid = str(s["_id"])
            if uid in comp_map:
                result.append({
                    "id": uid,
                    "name": s["name"],
                    "house": s.get("house", ""),
                    "average_score": comp_map[uid],
                    "problems_solved": 1,
                    "submissions": 1
                })
        # Sort and rank
        result.sort(key=lambda x: x["average_score"], reverse=True)
        for i, r in enumerate(result, 1):
            r["rank"] = i
        return jsonify(result)

    # Standard global leaderboard
    students = list(users_col.find(
        {"role": "student"},
        {"password": 0},
        sort=[("average_score", DESCENDING)],
        limit=100
    ))
    result = []
    for i, s in enumerate(students, 1):
        result.append({
            "rank": i,
            "id": str(s["_id"]),
            "name": s["name"],
            "house": s.get("house", ""),
            "average_score": s.get("average_score", 0.0),
            "problems_solved": s.get("problems_solved", 0),
            "submissions": s.get("total_submissions", 0)
        })
    return jsonify(result)


@app.route("/api/leaderboards/houses", methods=["GET"])
@jwt_required()
def house_leaderboard():
    # Check if competition mode is active
    now = datetime.now()
    setting = settings_col.find_one({"key": "competition_question"})
    
    comp_active = False
    comp_q_id = None
    if setting:
        start_hour = setting.get("start_hour", 17)
        end_hour = setting.get("end_hour", 22)
        comp_active = start_hour <= now.hour < end_hour
        comp_q_id = setting.get("value")

    house_data = {}
    for house in HOUSES:
        members = list(users_col.find({"house": house, "role": "student"}))
        if not members:
            avg = 0.0
        else:
            if comp_active and comp_q_id:
                # Average only for the competition question
                m_ids = [str(m["_id"]) for m in members]
                pipeline = [
                    {"$match": {"user_id": {"$in": m_ids}, "question_id": comp_q_id}},
                    {"$group": {"_id": "$user_id", "best": {"$max": "$score"}}}
                ]
                scores = list(submissions_col.aggregate(pipeline))
                if not scores:
                    avg = 0.0
                else:
                    avg = round(sum(s["best"] for s in scores) / len(members), 2)
            else:
                total = sum(m.get("average_score", 0.0) for m in members)
                avg = round(total / len(members), 2)
        
        house_data[house] = {
            "house": house,
            "average_score": avg,
            "members": len(members),
            "total_score": round(avg * len(members), 2) # simplified
        }

    sorted_houses = sorted(house_data.values(), key=lambda x: x["average_score"], reverse=True)
    for i, h in enumerate(sorted_houses, 1):
        h["rank"] = i
    return jsonify(sorted_houses)


@app.route("/api/leaderboards/house/<house_name>", methods=["GET"])
@jwt_required()
def house_members_leaderboard(house_name):
    if house_name not in HOUSES:
        return jsonify({"error": f"Unknown house: {house_name}"}), 400
    members = list(users_col.find(
        {"house": house_name, "role": "student"},
        {"password": 0},
        sort=[("average_score", DESCENDING)]
    ))
    result = []
    for i, m in enumerate(members, 1):
        result.append({
            "rank": i,
            "id": str(m["_id"]),
            "name": m["name"],
            "average_score": m.get("average_score", 0.0),
            "problems_solved": m.get("problems_solved", 0),
            "submissions": m.get("total_submissions", 0)
        })
    return jsonify(result)


# ─── Houses Route ─────────────────────────────────────────────────────────────

@app.route("/api/houses", methods=["GET"])
@jwt_required()
def get_houses():
    result = []
    for house in HOUSES:
        members = list(users_col.find({"house": house, "role": "student"}))
        avg = 0.0
        if members:
            total = sum(m.get("average_score", 0.0) for m in members)
            avg = round(total / len(members), 2)
        result.append({
            "name": house,
            "members": len(members),
            "average_score": avg
        })
    return jsonify(result)


# ─── Admin Routes ─────────────────────────────────────────────────────────────

@app.route("/api/admin/questions", methods=["POST"])
@admin_required
def create_question():
    data = request.get_json()
    title       = (data.get("title") or "").strip()
    description = (data.get("description") or "").strip()
    difficulty  = data.get("difficulty", "Easy")
    test_cases  = data.get("test_cases", [])
    solution    = data.get("solution", "")
    time_limit  = int(data.get("time_limit", 5))
    memory_limit = int(data.get("memory_limit", 256))

    if not title or not description:
        return jsonify({"error": "Title and description are required"}), 400
    if difficulty not in DIFFICULTY_FACTORS:
        return jsonify({"error": f"Difficulty must be one of {list(DIFFICULTY_FACTORS.keys())}"}), 400
    if not test_cases:
        return jsonify({"error": "At least one test case is required"}), 400

    q_doc = {
        "title": title,
        "description": description,
        "difficulty": difficulty,
        "test_cases": test_cases,
        "solution": solution,
        "time_limit": time_limit,
        "memory_limit": memory_limit,
        "created_at": datetime.now(timezone.utc)
    }
    result = questions_col.insert_one(q_doc)
    q_doc["_id"] = str(result.inserted_id)
    return jsonify(serialize(q_doc)), 201


@app.route("/api/admin/questions/<question_id>", methods=["PUT"])
@admin_required
def update_question(question_id):
    try:
        q = questions_col.find_one({"_id": ObjectId(question_id)})
    except InvalidId:
        return jsonify({"error": "Invalid question ID"}), 400
    if not q:
        return jsonify({"error": "Question not found"}), 404

    data = request.get_json()
    update_fields = {}
    for field in ["title", "description", "difficulty", "test_cases", "solution", "time_limit", "memory_limit"]:
        if field in data:
            update_fields[field] = data[field]

    if "difficulty" in update_fields and update_fields["difficulty"] not in DIFFICULTY_FACTORS:
        return jsonify({"error": "Invalid difficulty"}), 400

    questions_col.update_one({"_id": ObjectId(question_id)}, {"$set": update_fields})
    updated = questions_col.find_one({"_id": ObjectId(question_id)}, {"solution": 0})
    return jsonify(serialize(updated))


@app.route("/api/admin/submissions", methods=["GET"])
@admin_required
def admin_submissions():
    page  = int(request.args.get("page", 1))
    limit = int(request.args.get("limit", 20))
    skip  = (page - 1) * limit

    subs = list(submissions_col.find(
        {},
        sort=[("submitted_at", DESCENDING)],
        skip=skip, limit=limit
    ))
    for s in subs:
        try:
            user = users_col.find_one({"_id": ObjectId(s["user_id"])}, {"name": 1, "house": 1})
            s["user_name"]  = user["name"] if user else "Unknown"
            s["user_house"] = user.get("house", "") if user else ""
        except Exception:
            s["user_name"] = "Unknown"
            s["user_house"] = ""
        try:
            q = questions_col.find_one({"_id": ObjectId(s["question_id"])}, {"title": 1, "difficulty": 1})
            s["question_title"] = q["title"] if q else "Unknown"
            s["question_diff"]  = q["difficulty"] if q else "Unknown"
        except Exception:
            s["question_title"] = "Unknown"
            s["question_diff"]  = "Unknown"

    total = submissions_col.count_documents({})
    return jsonify({
        "submissions": serialize(subs),
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit
    })


@app.route("/api/admin/users", methods=["GET"])
@admin_required
def admin_users():
    result = list(users_col.find({}, {"password": 0}, sort=[("created_at", DESCENDING)]))
    return jsonify(serialize(result))


@app.route("/api/admin/competition", methods=["GET", "POST"])
@admin_required
def manage_competition():
    if request.method == "POST":
        data = request.get_json()
        q_id = data.get("question_id")
        start_h = int(data.get("start_hour", 17))
        end_h = int(data.get("end_hour", 22))
        settings_col.update_one(
            {"key": "competition_question"},
            {"$set": {"value": q_id, "start_hour": start_h, "end_hour": end_h}},
            upsert=True
        )
        return jsonify({"message": "Competition question updated successfully"})
    
    res = settings_col.find_one({"key": "competition_question"})
    return jsonify({"question_id": res["value"] if res else None})


@app.route("/api/competition/status", methods=["GET"])
def competition_status():
    now = datetime.now()
    res = settings_col.find_one({"key": "competition_question"})
    start_hour = res.get("start_hour", 17) if res else 17
    end_hour = res.get("end_hour", 22) if res else 22
    active = start_hour <= now.hour < end_hour
    return jsonify({
        "active": active,
        "question_id": res["value"] if res else None,
        "current_hour": now.hour,
        "start_hour": start_hour,
        "end_hour": end_hour
    })


# ─── Health Check ─────────────────────────────────────────────────────────────

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "service": "CodeHouses API",
        "timestamp": datetime.now(timezone.utc).isoformat()
    })


# ─── Entry Point ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    debug = os.getenv("FLASK_DEBUG", "true").lower() == "true"
    port  = int(os.getenv("PORT", 5000))
    print(f"🚀 CodeHouses API starting on port {port}")
    app.run(host="0.0.0.0", port=port, debug=debug)
