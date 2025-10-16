import os
import json
from rapidfuzz import fuzz

CAT_DIR = "."
DOCS_DIR = "docs/"

def sample_json_lines(filepath, num_lines=100):
    """Read and print a sample of lines from a large JSON file for inspection."""
    with open(filepath, 'r', encoding='utf-8') as f:
        for i, line in enumerate(f):
            if i >= num_lines:
                break
            print(line.strip())

def load_json(filepath):
    """Load JSON file (assumes list of dicts or dict)."""
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)        # ...existing code...
        
def update_solution_text(cat_file, docs_file):
    cat_data = load_json(cat_file)
    docs_data = load_json(docs_file)

    print(f"Loaded {len(cat_data.get("questions"))} entries from {os.path.basename(cat_file)}")
    print()
    updated = 0
    for cat_q in cat_data.get("questions", []):
        # print(cat_q)
        # input("Press Enter to continue...")
        # if not isinstance(cat_q, dict):
        #     continue  # Skip if not a dict
        for docs_q in docs_data.get("questions", []):
            # if not isinstance(docs_q, dict):
            #     continue  # Skip if not a dict
            if match_question(cat_q, docs_q):
                cat_q['solution_text'] = docs_q.get('solution_text', cat_q.get('solution_text'))
                updated += 1
                break

    with open(cat_file, 'w', encoding='utf-8') as f:
        json.dump(cat_data, f, ensure_ascii=False, indent=2)
    print(f"Updated {updated} solution_texts in {os.path.basename(cat_file)}")

# ...existing code...

import difflib
# ...existing code...

def match_question(q1, q2, threshold=0.9):
    """Return True if question_text fields are highly similar."""
    qt1 = q1.get('question_text', '').strip()
    qt2 = q2.get('question_text', '').strip()
    match_passage(q1, q2)
    if not qt1 or not qt2:
        return False
    elif qt1 == qt2:
        if match_passage(q1, q2):
            # print(f"Comparing:\nQ1: {qt1}\nQ2: {qt2}")
            # input("Press Enter to continue...")
            return True
        else:
            return False
        
def match_passage(p1, p2, threshold=0.9):
    """Return True if question_text fields are highly similar."""
    try:
        qt1 = p1.get('passage_text', '').strip().replace('\n', '').replace(' ', '')
        qt2 = p2.get('passage_text', '').strip().replace('\n', '').replace(' ', '')
        score = fuzz.token_sort_ratio(qt1, qt2)
        print(f"Fuzz score: {score}")
        if qt2 in qt1 or qt1 in qt2:
            # print(f"Comparing:\nQ1: {qt1}\nQ2: {qt2}")
            print("Text match found.","\n************")
            return True
        else:
            return False
    except Exception as e:
        print(f"Error in match_passage: {e}")
        return False

# ...existing code...
def main():
    # List all files in docs dir
    for docs_filename in os.listdir(DOCS_DIR):
        docs_file = os.path.join(DOCS_DIR, docs_filename)
        cat_file = os.path.join(CAT_DIR, docs_filename)
        if os.path.exists(cat_file):
            print(f"Processing {docs_filename}...")
            update_solution_text(cat_file, docs_file)
        else:
            print(f"Skipping {docs_filename}: no matching file in cat dir.")

if __name__ == "__main__":
    # Optional: sample lines for inspection
    # sample_json_lines(os.path.join(CAT_DIR, os.listdir(CAT_DIR)[0]))
    # sample_json_lines(os.path.join(DOCS_DIR, os.listdir(DOCS_DIR)[0]))
    main()