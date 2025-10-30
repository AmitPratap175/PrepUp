import json
import os
from pathlib import Path
import re

def organize_mocks():
    script_dir = Path(__file__).parent
    
    mocks_dir = script_dir / "mocks"
    docs_dir = script_dir / "docs"
    os.makedirs(docs_dir, exist_ok=True)

    questions_by_type = {
        "varc": [],
        "dilr": [],
        "quant": [],
        "quants": []
    }

    mock_files = mocks_dir.glob("mock-test-*.json")

    for mock_file in mock_files:
        with open(mock_file, "r", encoding="utf-8") as f:
            try:
                data = json.load(f)
                questions = data.get("questions", [])
                for q in questions:
                    q_type = q.get("type")
                    if q_type in questions_by_type:
                        questions_by_type[q_type].append(q)
            except json.JSONDecodeError:
                print(f"Warning: Could not decode JSON from {mock_file}")
                continue
    
    # Consolidate quants questions
    questions_by_type["quant"].extend(questions_by_type.pop("quants", []))

    # Mapping from 'type' to filename in docs
    docs_mapping = {
        "varc": "verbal-ability.json",
        "dilr": "data-interpretation.json",
        "quant": "quantitative-aptitude.json"
    }

    for q_type, questions in questions_by_type.items():
        if not questions or q_type not in docs_mapping:
            continue

        doc_file_path = docs_dir / docs_mapping[q_type]
        
        existing_questions = []
        seen_q_texts = set()

        if doc_file_path.exists():
            with open(doc_file_path, "r", encoding="utf-8") as f:
                try:
                    existing_data = json.load(f)
                    # The structure could be a list or a dict with a "questions" key
                    if isinstance(existing_data, dict):
                        existing_questions = existing_data.get("questions", [])
                    elif isinstance(existing_data, list):
                         existing_questions = existing_data
                    
                    for q in existing_questions:
                        # Use a tuple of key fields to uniquely identify a question
                        seen_q_texts.add(q.get("question_text"))

                except (json.JSONDecodeError, IOError):
                    print(f"Warning: Could not decode existing JSON from {doc_file_path}. Overwriting.")

        # Add new unique questions
        for q in questions:
            if q.get("question_text") not in seen_q_texts:
                existing_questions.append(q)
                seen_q_texts.add(q.get("question_text"))
        
        # The files in docs are a list of questions in a "questions" key.
        final_data = {"questions": existing_questions}

        with open(doc_file_path, "w", encoding="utf-8") as f:
            json.dump(final_data, f, ensure_ascii=False, indent=2)
        
        print(f"Wrote {len(existing_questions)} questions to {doc_file_path}")

if __name__ == "__main__":
    organize_mocks()
