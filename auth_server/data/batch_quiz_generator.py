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

DATA_DIR = Path("/home/dspratap/Downloads/PrepUp/UPSC/Slides")
QUIZ_FILE = Path("/home/dspratap/Downloads/PrepUp/auth_server/data/quiz.json")
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

        # Identify Subject
        # Identify Subject with Retry
        print("Identifying subject...")
        subject = ""
        for attempt in range(3):
            try:
                subject_prompt = "Classify this document into one of the following subjects: Polity, Geography, History, Economy, Environment, Science, Current Affairs, or Others. Return ONLY the subject name in all lower case."
                chat_result = await client.chat.ask(nb.id, subject_prompt)
                subject = chat_result.answer.strip()
                if subject:
                    break
                print(f"Subject detection attempt {attempt+1} return empty. Retrying...")
                await asyncio.sleep(2)
            except Exception as e:
                print(f"Subject detection attempt {attempt+1} failed: {e}")
                await asyncio.sleep(2)
        
        if not subject:
            print("Failed to identify subject after retries. Defaulting to 'economy' (safe fallback).")
            subject = "economy"

        print(f"Identified subject: {subject}")
        
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
        
        return temp_file, subject
        
    except Exception as e:
        print(f"Error processing {pdf_path.name}: {e}")
        return None, None
    finally:
        # Cleanup notebook if needed, or leave it for history. 
        # Deleting might be safer to avoid clutter if run frequently.
        try:
             if 'nb' in locals():
                 await client.notebooks.delete(nb.id)
                 print("Notebook deleted.")
        except Exception as e:
             print(f"Failed to delete notebook (ignored): {e}")

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
        print(f"ERROR: {QUIZ_FILE} is invalid JSON. Cannot append.")
        raise

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

    print(f"Found {len(pdfs)} PDFs.")
    
    # Sort naturally (e.g., Chapter 2 comes before Chapter 10)
    def natural_key(path):
        import re
        return [int(text) if text.isdigit() else text.lower()
                for text in re.split(r'(\d+)', path.name)]
    
    pdfs.sort(key=natural_key)
    print("Starting batch generation in sorted order...")

    async with await NotebookLMClient.from_storage(STORAGE_PATH) as client:
        # Load existing quizzes once
        existing_quizzes = load_master_quiz_list()
        existing_titles = set()
        for q in existing_quizzes:
            if "title" in q:
                existing_titles.add(q["title"])

        for i, pdf in enumerate(pdfs):
            # Check if pdf.stem is in any existing title
            # The title format is usually "Generic Title (PDF Stem)" or just "PDF Stem"
            # We search if the stem is present in any existing title to be safe
            is_processed = False
            for title in existing_titles:
                if pdf.stem in title:
                    is_processed = True
                    break
            
            if is_processed:
                print(f"Skipping {pdf.name} (Already in quiz.json)")
                continue

            temp_file, subject = await generate_quiz_from_pdf(client, pdf)
            
            if temp_file and temp_file.exists():
                try:
                    with open(temp_file, 'r') as f:
                        quiz_content = json.load(f)
                    
                    # Inject identified subject
                    # Ensure subject is never empty
                    if subject:
                        quiz_content["subject"] = subject
                    elif "subject" not in quiz_content or not quiz_content["subject"]:
                         # Double safe fallback
                         quiz_content["subject"] = "economy"
                    
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
