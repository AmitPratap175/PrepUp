import json
from pathlib import Path
import sys

# Mimic the path logic
BASE_DIR = Path("/home/dspratap/Downloads/PrepUp/auth_server")
file_path = BASE_DIR / "data" / "quiz.json"

print(f"Checking file: {file_path}")

if not file_path.exists():
    print("File not found")
    sys.exit(1)

try:
    with open(file_path, 'r') as f:
        data = json.load(f)
    print("SUCCESS: JSON loaded.")
    print(f"Type: {type(data)}")
    if isinstance(data, list):
         print(f"List length: {len(data)}")
         if len(data) > 0:
             print("First item keys:", data[0].keys())
             if "subject" in data[0]:
                 print(f"First subject: '{data[0]['subject']}'")
             else:
                 print("WARNING: 'subject' key missing in first item")
    else:
         print("WARNING: Data is not a list")

except json.JSONDecodeError as e:
    print(f"ERROR: JSONDecodeError: {e}")
    sys.exit(1)
except Exception as e:
    print(f"ERROR: Exception: {e}")
    sys.exit(1)
