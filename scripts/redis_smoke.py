import os
from dotenv import load_dotenv


def main() -> None:
    load_dotenv("d:\\Projects\\coduku\\coduku-git-project\\backend\\.env", override=True)
    url = os.getenv("REDIS_URL")
    if not url:
        print("redis_config_ok=False")
        return

    import redis.asyncio as redis_async
    import asyncio

    async def _run():
        try:
            r = redis_async.from_url(url, decode_responses=True)
            pong = await r.ping()
            print("redis_ping_ok=True")
            print("ping=" + str(pong))
        except Exception as e:
            print("redis_ping_ok=False")
            print("error_type=" + type(e).__name__)
            print("error=" + str(e))

    asyncio.run(_run())


if __name__ == "__main__":
    main()

