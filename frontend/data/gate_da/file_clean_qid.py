#!/usr/bin/env python3
"""
Rename all 'qid' fields to incremental strings 'varc-n' (n starts at 1),
preserving everything else. Reads from a hardcoded input file and writes
to an output file named exactly 'final_varc_changed' (no extension).
"""

import json
from typing import List, Dict, Any
import os

# ---- Hardcoded filenames ----
INPUT_FOLDER = "."    # Change this to your actual input filename
OUTPUT_FOLDER = "" # Required exact output filename per instructions


def get_questions_container(data: Any) -> List[Dict[str, Any]]:
    """
    Accepts either:
      - a dict with key 'questions' that is a list, or
      - a top-level list of question dicts.
    Returns the list of questions. Raises ValueError if not found.
    """
    if isinstance(data, dict) and isinstance(data.get("questions"), list):
        return data["questions"]
    if isinstance(data, list):
        return data
    raise ValueError('Input JSON must be either a dict with a "questions" list '
                     "or a top-level list of questions.")


def main() -> None:
    json_files = [os.path.join(INPUT_FOLDER,f) for f in os.listdir(INPUT_FOLDER) if f.endswith(".json")]
    print(f"Found {json_files} JSON files to process.")
    for file in json_files:
        # Load input JSON
        with open(file, "r", encoding="utf-8") as f:
            data = json.load(f)

        name = file.split("_")[-1].split(".")[0]  
        # print(name)

        questions = get_questions_container(data)

        # Replace qid fields in the order encountered
        counter = 0
        for item in questions:
            if isinstance(item, dict) and "qid" in item:
                counter += 1
                item["qid"] = f"{name}-{counter}"

        # Save to the required output filename (no extension)
        with open(file, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        # Optional console feedback
        # print(f"Replaced {counter} qid field(s). Wrote output to '{OUTPUT_FILE}'.")


if __name__ == "__main__":
    main()
