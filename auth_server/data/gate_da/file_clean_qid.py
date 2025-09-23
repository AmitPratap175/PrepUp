#!/usr/bin/env python3
"""
Rename all 'qid' fields to incremental strings 'varc-n' (n starts at 1),
preserving everything else. Reads from JSON files in a specified directory.
"""

import json
import sys
from typing import List, Dict, Any
from pathlib import Path

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


def main(json_folder: Path) -> None:
    """
    Reads all .json files in json_folder, replaces 'qid' with an
    incrementing ID based on the filename, and saves the files in-place.
    """
    if not json_folder.is_dir():
        print(f"Error: Directory not found at {json_folder}", file=sys.stderr)
        return
        
    json_files = list(json_folder.glob("*.json"))
    print(f"Found {len(json_files)} JSON files to process in {json_folder}.")

    for file_path in json_files:
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
        except (json.JSONDecodeError, IOError) as e:
            print(f"Error reading {file_path}: {e}", file=sys.stderr)
            continue

        name = file_path.stem.split("_")[-1]

        try:
            questions = get_questions_container(data)
        except ValueError as e:
            print(f"Error processing {file_path}: {e}", file=sys.stderr)
            continue

        counter = 0
        for item in questions:
            if isinstance(item, dict) and "qid" in item:
                counter += 1
                item["qid"] = f"{name}-{counter}"

        try:
            with open(file_path, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
        except IOError as e:
            print(f"Error writing to {file_path}: {e}", file=sys.stderr)

        print(f"Processed {counter} qids in {file_path.name}")


if __name__ == "__main__":
    # Example of how to run this script directly
    # You need to provide a path to a directory with JSON files.
    if len(sys.argv) > 1:
        target_dir = Path(sys.argv[1])
        main(target_dir)
    else:
        print("Usage: python file_clean_qid.py <path_to_json_directory>", file=sys.stderr)