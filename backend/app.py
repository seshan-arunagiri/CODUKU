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


def execute_python(code: str, test_cases: list, time_limit: int = 5) -> dict:
    """Execute Python code against test cases using a temp file + subprocess."""
    results = []
    total = len(test_cases)
    passed = 0

    for tc in test_cases:
        inp = tc.get("input", "")
        expected = str(tc.get("output", "")).strip()
        func_name = tc.get("function_name", "solution")

        # Build runner script
        runner = f"""
import json, sys

{code}

try:
    inp = {repr(inp)}
    if isinstance(inp, list):
        result = {func_name}(*inp)
    elif isinstance(inp, dict):
        result = {func_name}(**inp)
    else:
        result = {func_name}(inp)
    print(json.dumps(result))
except Exception as e:
    print("ERROR: " + str(e), file=sys.stderr)
    sys.exit(1)
"""
        try:
            with tempfile.NamedTemporaryFile(mode="w", suffix=".py", delete=False) as f:
                f.write(runner)
                tmp_path = f.name

            proc = subprocess.run(
                ["python", tmp_path],
                capture_output=True, text=True,
                timeout=time_limit
            )
            os.unlink(tmp_path)

            if proc.returncode != 0:
                results.append({
                    "input": inp, "expected": expected,
                    "actual": None, "passed": False,
                    "error": proc.stderr.strip()
                })
            else:
                actual = proc.stdout.strip()
                # Flexible comparison: compare JSON or string representations
                try:
                    actual_val = json.loads(actual)
                    exp_val = json.loads(expected) if expected.startswith(("[", "{", '"')) else expected
                    ok = actual_val == exp_val
                except Exception:
                    ok = actual == expected

                if ok:
                    passed += 1
                results.append({
                    "input": inp, "expected": expected,
                    "actual": actual, "passed": ok, "error": None
                })
        except subprocess.TimeoutExpired:
            try:
                os.unlink(tmp_path)
            except Exception:
                pass
            results.append({
                "input": inp, "expected": expected,
                "actual": None, "passed": False,
                "error": "Time limit exceeded"
            })
        except Exception as e:
            results.append({
                "input": inp, "expected": expected,
                "actual": None, "passed": False,
                "error": str(e)
            })

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
        expected_secret = os.getenv("TEACHER_SECRET", "CODEHOUSES_TEACHER")
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
@jwt_required()
def get_profile():
    uid = get_jwt_identity()
    user = users_col.find_one({"_id": ObjectId(uid)}, {"password": 0})
    if not user:
        return jsonify({"error": "User not found"}), 404
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

    if language != "python":
        return jsonify({"error": "Only Python is supported at this time"}), 400

    start = time.time()
    exec_result = execute_python(code, q.get("test_cases", []), q.get("time_limit", 5))
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


# ─── Leaderboard Routes ───────────────────────────────────────────────────────

@app.route("/api/leaderboards/global", methods=["GET"])
@jwt_required()
def global_leaderboard():
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
    house_data = {}
    for house in HOUSES:
        members = list(users_col.find({"house": house, "role": "student"}))
        if not members:
            avg = 0.0
        else:
            total = sum(m.get("average_score", 0.0) for m in members)
            avg = round(total / len(members), 2)
        house_data[house] = {
            "house": house,
            "average_score": avg,
            "members": len(members),
            "total_score": round(sum(m.get("average_score", 0.0) for m in members), 2)
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
    users = list(users_col.find({}, {"password": 0}, sort=[("created_at", DESCENDING)]))
    return jsonify(serialize(users))


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
