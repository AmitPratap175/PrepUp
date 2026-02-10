import json
from pathlib import Path

QUIZ_FILE = Path("/home/dspratap/Downloads/PrepUp/auth_server/data/quiz.json")

def fix_subjects():
    if not QUIZ_FILE.exists():
        print(f"File not found: {QUIZ_FILE}")
        return

    try:
        with open(QUIZ_FILE, 'r') as f:
            data = json.load(f)
        
        updated = False
        fixed_count = 0
        
        for quiz in data:
            if "subject" not in quiz or not quiz["subject"]:
                # Fallback to economy as requested/implied by context
                quiz["subject"] = "economy"
                updated = True
                fixed_count += 1
                
        if updated:
            with open(QUIZ_FILE, 'w') as f:
                json.dump(data, f, indent=2)
            print(f"Fixed {fixed_count} quizzes with missing subjects.")
        else:
            print("No missing subjects found.")

    except Exception as e:
        print(f"Error fixing subjects: {e}")

if __name__ == "__main__":
    fix_subjects()
