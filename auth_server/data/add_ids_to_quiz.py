
import json
import os
import uuid

def add_ids_to_quiz_json():
    # Define file path
    base_dir = os.path.dirname(os.path.abspath(__file__))
    file_path = os.path.join(base_dir, 'quiz.json')
    
    if not os.path.exists(file_path):
        print(f"Error: {file_path} not found.")
        return

    try:
        with open(file_path, 'r') as f:
            chapters = json.load(f)
            
        updated_count = 0
        
        for ch_idx, chapter in enumerate(chapters):
            questions = chapter.get('questions', [])
            for q_idx, q in enumerate(questions):
                # Check if 'qid' or 'id' exists, if not, create one
                if 'qid' not in q and 'id' not in q:
                    # Create a deterministic but unique string ID
                    # Format: cw-{chapter_index}-{question_index}-{short_uuid}
                    # Adding a short uuid part to prevent collision if re-ordered but keep some readability
                    unique_part = str(uuid.uuid4())[:8]
                    new_id = f"cw-{ch_idx}-{q_idx}-{unique_part}"
                    
                    q['qid'] = new_id
                    q['id'] = new_id # Add both for compatibility
                    updated_count += 1
                elif 'qid' not in q and 'id' in q:
                     q['qid'] = q['id']
                elif 'id' not in q and 'qid' in q:
                     q['id'] = q['qid']

        if updated_count > 0:
            with open(file_path, 'w') as f:
                json.dump(chapters, f, indent=2)
            print(f"Successfully added IDs to {updated_count} questions in {file_path}")
        else:
            print("No questions needed updating (IDs already present).")

    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    add_ids_to_quiz_json()
