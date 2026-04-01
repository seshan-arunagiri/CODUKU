import inspect
import sys
from pathlib import Path

# Ensure we import the backend main module
BACKEND_DIR = Path(__file__).resolve().parent / "backend"
sys.path.insert(0, str(BACKEND_DIR))
import main


def main_fn():
    print("main_file=" + str(main.__file__))
    try:
        src = inspect.getsource(main.debug_mongo)
        print("debug_mongo_contains_judge0_mode=" + ("judge0_mode" in src).__str__())
    except Exception as e:
        print("debug_mongo_source_error=" + type(e).__name__)


if __name__ == "__main__":
    main_fn()

