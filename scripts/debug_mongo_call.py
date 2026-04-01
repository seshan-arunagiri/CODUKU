import json
import urllib.request


def main() -> None:
    url = "http://localhost:8000/debug/mongo"
    with urllib.request.urlopen(url) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    print(json.dumps(data, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()

