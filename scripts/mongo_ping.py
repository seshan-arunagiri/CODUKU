from pymongo import MongoClient


def main():
    url = "mongodb://localhost:27017/coduku"
    try:
        client = MongoClient(url, serverSelectionTimeoutMS=2000)
        db = client.get_default_database()
        db.command("ping")
        print("mongo_ping_ok=True")
    except Exception as e:
        print("mongo_ping_ok=False")
        print(f"error_type={type(e).__name__}")
        print(f"error={e}")


if __name__ == "__main__":
    main()

