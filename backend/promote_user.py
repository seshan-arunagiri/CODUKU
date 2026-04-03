import sys
import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/coding_platform")
client = MongoClient(MONGO_URI)
db = client.get_default_database() if "coding_platform" not in MONGO_URI.split("/")[-1].split("?")[0] else client["coding_platform"]

if len(sys.argv) < 3:
    print("Usage: python promote_user.py <email> <role>")
    print("Roles: teacher, admin, student")
    sys.exit(1)

email = sys.argv[1].lower()
role = sys.argv[2].lower()

result = db.users.update_one({"email": email}, {"$set": {"role": role}})
if result.matched_count:
    print(f"Success! Updated user '{email}' to role '{role}'.")
else:
    print(f"Error: User '{email}' not found. Make sure they have registered first.")
