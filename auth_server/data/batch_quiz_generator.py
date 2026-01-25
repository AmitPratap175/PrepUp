import asyncio
import json
import time
from pathlib import Path
from notebooklm import NotebookLMClient
from enum import Enum

class QuizQuantity(Enum):
    FEWER = 1
    STANDARD = 2
    MORE = 3

class QuizDifficulty(Enum):
    EASY = 1
    MEDIUM = 2
    HARD = 3

DATA_DIR = Path("/home/dspratap/Downloads/PrepUp/UPSC/CA_Mag")
QUIZ_FILE = Path("/home/dspratap/Downloads/PrepUp/auth_server/data/quiz_mag.json")
STORAGE_PATH = "/home/dspratap/.notebooklm/storage_state.json"

PROMPT = """
Act as a strict Union Public Service Commission (UPSC) paper setter. Your goal is to exhaustively test my knowledge of the uploaded document by generating a high-volume Question Bank (at least 20 questions).
Using ONLY the information provided in this document, generate questions in the following specific UPSC formats:

**1. The 'Statement-Based' Trap:**
Create questions with 2-3 statements (e.g., 'Consider the following statements regarding [Topic]...').
Intentionally include common UPSC traps: swap dates, change 'Constitutional' to 'Statutory', or use extreme words like 'only', 'always', or 'mandatorily' to test precision.
Options: (a) 1 only, (b) 2 only, (c) Both 1 and 2, (d) Neither 1 nor 2.

**2. Chronology & Sequencing:**
Select 4 events mentioned in the text and ask to arrange them in correct chronological order.

**3. Match the Following:**
Create pairs matching specific terms/personalities with descriptions.

**Output Rules:**
Cover the entire document.
Provide a separate Answer Key at the end. For every answer, provide a brief 'Explanation'.
"""

async def generate_quiz_from_pdf(client, pdf_path):
    print(f"Processing {pdf_path.name}...")
    
    # Create notebook
    nb_title = f"Quiz Gen: {pdf_path.stem}"
    nb = await client.notebooks.create(nb_title)
    print(f"Created notebook: {nb.title} ({nb.id})")

    try:
        # Add source
        print("Uploading source...")
        await client.sources.add_file(nb.id, pdf_path, wait=True)
        
        # Generate Quiz
        print("Generating quiz...")
        status = await client.artifacts.generate_quiz(
            nb.id,
            instructions=PROMPT,
            quantity=QuizQuantity.MORE,
            difficulty=QuizDifficulty.HARD
        )
        await client.artifacts.wait_for_completion(nb.id, status.task_id)
        
        # Download to temp file
        temp_file = DATA_DIR / f"temp_{pdf_path.stem}.json"
        await client.artifacts.download_quiz(nb.id, str(temp_file), output_format="json")
        print(f"Quiz saved to {temp_file}")
        
        return temp_file
        
    except Exception as e:
        print(f"Error processing {pdf_path.name}: {e}")
        return None
    finally:
        # Cleanup notebook if needed, or leave it for history. 
        # Deleting might be safer to avoid clutter if run frequently.
        await client.notebooks.delete(nb.id)
        print("Notebook deleted.")

def load_master_quiz_list():
    if not QUIZ_FILE.exists():
        return []
    
    try:
        with open(QUIZ_FILE, 'r') as f:
            data = json.load(f)
            if isinstance(data, list):
                return data
            elif isinstance(data, dict):
                # Convert legacy single object to list
                return [data]
            else:
                return []
    except json.JSONDecodeError:
        return []

def append_to_master(quiz_data):
    master_list = load_master_quiz_list()
    
    # Check if duplicate title to avoid infinite append on re-runs?
    # Or just append. User said "append". 
    # Let's simple append.
    
    master_list.append(quiz_data)
    
    with open(QUIZ_FILE, 'w') as f:
        json.dump(master_list, f, indent=2)
    print(f"Appended to {QUIZ_FILE}. Total quizzes: {len(master_list)}")

import re

# ... existing code ...

async def main():
    pdfs = list(DATA_DIR.glob("*.pdf"))
    if not pdfs:
        print("No PDFs found in data directory.")
        return

    print(f"Found {len(pdfs)} PDFs. Starting batch generation...")

    async with await NotebookLMClient.from_storage(STORAGE_PATH) as client:
        for i, pdf in enumerate(pdfs):
            temp_file = await generate_quiz_from_pdf(client, pdf)
            
            if temp_file and temp_file.exists():
                try:
                    with open(temp_file, 'r') as f:
                        quiz_content = json.load(f)
                    
                    # Ensure title matches PDF if generic
                    if "title" not in quiz_content or not quiz_content["title"]:
                        quiz_content["title"] = pdf.stem.replace("_", " ").title()
                    else:
                        quiz_content["title"] = f"{quiz_content['title']} ({pdf.stem})"

                    # Generate Sequential Unique IDs
                    # Clean filename to create a prefix (e.g., "Polity_Class 11" -> "polity-class-11")
                    raw_stem = pdf.stem.lower()
                    prefix = re.sub(r'[^a-z0-9]+', '-', raw_stem).strip('-')
                    if not prefix: prefix = f"quiz-{i+1}" # Fallback

                    questions = quiz_content.get('questions', [])
                    for q_idx, q in enumerate(questions, 1):
                        unique_id = f"cw-{prefix}-{q_idx}"
                        q['id'] = unique_id
                        q['qid'] = unique_id
                        q['type'] = 'mcq'
                        
                        # Ensure options structure is standard if needed? 
                        # The PDF output format is controlled by prompt, but usually reliable.
                    
                    print(f"Assigned IDs: {prefix}-1 to {prefix}-{len(questions)}")

                    append_to_master(quiz_content)
                    
                    # Clean up temp
                    temp_file.unlink()
                    
                except Exception as e:
                    print(f"Failed to read/append quiz for {pdf.name}: {e}")

            if i < len(pdfs) - 1:
                print("Waiting 60 seconds before next file...")
                time.sleep(60)

if __name__ == "__main__":
    asyncio.run(main())
