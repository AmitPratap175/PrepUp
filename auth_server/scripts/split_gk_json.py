import json
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOURCE_FILE = os.path.join(BASE_DIR, "data", "xat", "general_knowledge.json")
STATIC_FILE = os.path.join(BASE_DIR, "data", "xat", "static_gk.json")
CURRENT_AFFAIRS_FILE = os.path.join(BASE_DIR, "data", "xat", "current_affairs_gk.json")

def main():
    if not os.path.exists(SOURCE_FILE):
        print(f"Source file not found: {SOURCE_FILE}")
        return

    with open(SOURCE_FILE, 'r') as f:
        data = json.load(f)

    questions = data.get("questions", [])
    static_questions = []
    current_affairs_questions = []

    for q in questions:
        tag = q.get("tag")
        if tag == "static":
            static_questions.append(q)
        elif tag == "current-affairs":
            current_affairs_questions.append(q)
        else:
            print(f"Warning: Question {q.get('qid')} has unknown or missing tag: {tag}")
            # Optional: Decide where to put untagged questions. For now, maybe skip or put in current affairs?
            # Let's put them in current affairs for now as a fallback, or just log.
            pass

    print(f"Total questions: {len(questions)}")
    print(f"Static questions: {len(static_questions)}")
    print(f"Current Affairs questions: {len(current_affairs_questions)}")

    # Save Static GK
    with open(STATIC_FILE, 'w') as f:
        json.dump({"questions": static_questions}, f, indent=2)
    print(f"Saved {STATIC_FILE}")

    # Save Current Affairs GK
    with open(CURRENT_AFFAIRS_FILE, 'w') as f:
        json.dump({"questions": current_affairs_questions}, f, indent=2)
    print(f"Saved {CURRENT_AFFAIRS_FILE}")

if __name__ == "__main__":
    main()
