import json
from pathlib import Path

QUIZ_FILE = Path("/home/dspratap/Downloads/PrepUp/auth_server/data/quiz.json")

def indentify_subject(title):
    title_lower = title.lower()
    if any(k in title_lower for k in ["president", "parliament", "polity", "constitution", "rights", "dpsp"]):
        return "Polity"
    if any(k in title_lower for k in ["geography", "earth", "climate", "monsoon"]):
        return "Geography"
    if any(k in title_lower for k in ["history", "ancient", "medieval", "modern", "freedom"]):
        return "History"
    if any(k in title_lower for k in ["economy", "economics", "budget", "gdp"]):
        return "Economy"
    if any(k in title_lower for k in ["environment", "ecology", "biodiversity"]):
        return "Environment"
    if any(k in title_lower for k in ["science", "tech", "physics", "chemistry", "biology"]):
        return "Science"
    return "General Studies"

def main():
    if not QUIZ_FILE.exists():
        print("Quiz file not found.")
        return

    with open(QUIZ_FILE, 'r') as f:
        try:
            data = json.load(f)
        except json.JSONDecodeError:
            print("Invalid JSON.")
            return

    if isinstance(data, dict):
        data = [data]
    
    updated = False
    for quiz in data:
        if "subject" not in quiz:
            quiz["subject"] = indentify_subject(quiz.get("title", ""))
            updated = True
            print(f"Updated '{quiz.get('title')}' -> {quiz['subject']}")
        else:
            print(f"Skipping '{quiz.get('title')}' (already has subject: {quiz['subject']})")

    if updated:
        with open(QUIZ_FILE, 'w') as f:
            json.dump(data, f, indent=2)
        print("Saved updates to quiz.json")
    else:
        print("No updates needed.")

if __name__ == "__main__":
    main()
