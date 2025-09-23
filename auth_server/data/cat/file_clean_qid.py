#!/usr/bin/env python3
"""
This script standardizes the 'qid' (question ID) field in a series of JSON files.

It reads all .json files from a hardcoded 'temp_json' directory, which is expected
to be a sibling of this script's parent directory. For each file, it iterates through
the questions and replaces the existing 'qid' with a new, unique ID.

The new ID is a combination of the question's subject (derived from the filename,
e.g., 'quant', 'varc') and an incrementing number (e.g., 'varc-1', 'varc-2').

The script modifies the JSON files in-place.
"""

import json
import sys
from typing import List, Dict, Any
from pathlib import Path

# --- Hardcoded Relative Path ---
# This script is designed to be self-contained and portable within the project.
# It looks for a 'temp_json' directory located one level above its own directory
# (e.g., auth_server/data/temp_json).
# Path(__file__).parent -> auth_server/data/cat
# .parent -> auth_server/data
# / "temp_json" -> auth_server/data/temp_json
INPUT_FOLDER = Path(__file__).parent.parent / "temp_json"

def get_questions_container(data: Any) -> List[Dict[str, Any]]:
    """
    Safely extracts the list of question objects from the loaded JSON data.

    The JSON structure can be either a dictionary with a 'questions' key
    (e.g., {"questions": [...]}) or a simple list of questions at the top level.
    This function handles both cases.

    Args:
        data: The loaded JSON data (can be a dict or a list).

    Returns:
        A list of question dictionaries.

    Raises:
        ValueError: If the 'questions' list cannot be found in the data.
    """
    # Case 1: JSON is a dictionary containing a "questions" list.
    if isinstance(data, dict) and isinstance(data.get("questions"), list):
        return data["questions"]
    # Case 2: JSON is a list at the top level.
    if isinstance(data, list):
        return data
    # If neither case matches, the structure is unexpected.
    raise ValueError('Input JSON must be either a dict with a "questions" list '
                     "or a top-level list of questions.")


def main() -> None:
    """
    Main function to execute the qid cleaning process.
    
    It finds all JSON files in the INPUT_FOLDER, reads each one, replaces the 'qid'
    values, and then overwrites the original file with the updated data.
    """
    json_folder = INPUT_FOLDER
    # Check if the target directory exists. It's not an error if it doesn't;
    # it just means there's nothing to process.
    if not json_folder.is_dir():
        print(f"Info: Directory not found at {json_folder}. Nothing to clean.")
        return
        
    # Find all files ending with .json in the directory.
    json_files = list(json_folder.glob("*.json"))
    print(f"Found {len(json_files)} JSON files to process in {json_folder}.")

    # Process each file individually.
    for file_path in json_files:
        try:
            # Open and load the JSON content of the file.
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
        except (json.JSONDecodeError, IOError) as e:
            # If the file is corrupted or unreadable, skip it and report the error.
            print(f"Error reading {file_path}: {e}", file=sys.stderr)
            continue

        # Extract the subject name (e.g., 'quant', 'varc') from the filename.
        # Assumes filename format like 'final_quant.json'.
        name = file_path.stem.split("_")[-1]

        try:
            # Get the list of questions from the loaded data.
            questions = get_questions_container(data)
        except ValueError as e:
            # If the JSON structure is invalid, skip the file.
            print(f"Error processing {file_path}: {e}", file=sys.stderr)
            continue

        # Reset a counter for each file to number the questions.
        counter = 0
        for item in questions:
            # Check if the item is a dictionary and has a 'qid' to replace.
            if isinstance(item, dict) and "qid" in item:
                counter += 1
                # Assign the new, standardized qid.
                item["qid"] = f"{name}-{counter}"

        try:
            # Write the modified data back to the original file.
            with open(file_path, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
        except IOError as e:
            print(f"Error writing to {file_path}: {e}", file=sys.stderr)

        print(f"Processed {counter} qids in {file_path.name}")


if __name__ == "__main__":
    # This allows the script to be run directly from the command line.
    main()