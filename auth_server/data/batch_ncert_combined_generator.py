import os
import json
import asyncio
import re
import time
from pathlib import Path
from enum import Enum

# Third-party imports
from dotenv import load_dotenv
from notebooklm import NotebookLMClient, SlideDeckFormat, SlideDeckLength

# Load environment variables
env_path = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

# --- Config & Constants ---
DATA_DIR = Path("/home/dspratap/Downloads/PrepUp/UPSC/NCERT")
DATA_OUT_DIR = Path("/home/dspratap/Downloads/PrepUp/auth_server/data")
SLIDES_OUT_DIR = DATA_OUT_DIR / "NCERTSlides"

PROCESSED_LOG_PATH = DATA_OUT_DIR / "processed_ncert_combined.json"
QUIZ_FILE = DATA_OUT_DIR / "ncert_combined_quiz.json"
STORAGE_PATH = "/home/dspratap/.notebooklm/storage_state.json"

class QuizQuantity(Enum):
    FEWER = 1
    STANDARD = 2
    MORE = 3

class QuizDifficulty(Enum):
    EASY = 1
    MEDIUM = 2
    HARD = 3

NB_PROMPT = """
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

Also generate atleast 50 questions of hard type.
**Output Rules:**
Cover the entire document. Hve the quizzes cover every facts and idea in the document.
Provide a separate Answer Key at the end. For every answer, provide a detailed 'Explanation'.
"""

# Helper Functions
def parse_class_and_subject(pdf_path, root_dir):
    try:
        relative_path = pdf_path.relative_to(root_dir)
        parts = relative_path.parts
        
        if len(parts) >= 2:
            class_name = parts[0]
            if len(parts) == 2:
                subject_name = "General"
            else:
                subject_name = parts[1]
        else:
            class_name = "Unknown Class"
            subject_name = "General"
            
        return class_name.replace("_", " "), subject_name.replace("_", " ")
    except ValueError:
        return "Unknown Class", "General"

def load_master_quiz_list():
    if not QUIZ_FILE.exists(): return []
    try:
        with open(QUIZ_FILE, 'r') as f:
            data = json.load(f)
            return data if isinstance(data, list) else ([data] if isinstance(data, dict) else [])
    except:
        return []

def append_to_master(quiz_data):
    master_list = load_master_quiz_list()
    master_list.append(quiz_data)
    with open(QUIZ_FILE, 'w') as f:
        json.dump(master_list, f, indent=2)
    print(f"Appended to {QUIZ_FILE.name}. Total quizzes: {len(master_list)}")

# --- Main Logic ---

async def main():
    if not DATA_DIR.exists():
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        print(f"Created {DATA_DIR}. Please place NCERT PDFs there.")

    def natural_key(path):
        return [int(text) if text.isdigit() else text.lower() for text in re.split(r'(\d+)', path.name)]
    
    pdfs = sorted(list(DATA_DIR.rglob("*.pdf")), key=natural_key)
    print(f"Found {len(pdfs)} PDFs in {DATA_DIR} recursively (Sorted)")

    processed_files = set()
    if PROCESSED_LOG_PATH.exists():
        try:
            with open(PROCESSED_LOG_PATH, 'r') as f:
                processed_files = set(json.load(f))
        except: pass

    async with await NotebookLMClient.from_storage(STORAGE_PATH) as nb_client:
        existing_quizzes = load_master_quiz_list()
        existing_titles = set(q.get("title", "") for q in existing_quizzes)
        
        for i, pdf in enumerate(pdfs):
            class_name, subject = parse_class_and_subject(pdf, DATA_DIR)
            pdf_title = pdf.stem.replace("_", " ").title()
            safe_title = f"{class_name} - {subject} - {pdf_title}"
            
            output_slide_dir = SLIDES_OUT_DIR / class_name / subject
            output_slide_path = output_slide_dir / f"{safe_title}.pdf"
            
            quiz_exists = any(pdf.stem in ext_title for ext_title in existing_titles)
            slide_exists = output_slide_path.exists()
            
            if quiz_exists and slide_exists:
                print(f"Skipping ({i+1}/{len(pdfs)}): {pdf.name} (Both Slide and Quiz exist)")
                if pdf.name not in processed_files:
                    processed_files.add(pdf.name)
                    with open(PROCESSED_LOG_PATH, 'w') as f:
                         json.dump(list(processed_files), f, indent=2)
                continue

            print(f"Processing ({i+1}/{len(pdfs)}): {pdf.name} (Path: {pdf.relative_to(DATA_DIR)})")
            print(f"  - Document classified as: Class: {class_name}, Subject: {subject}")
            
            nb_title = f"NCERT Combined Gen: {pdf.stem}"
            nb = None
            slide_generated = False
            quiz_generated = False
            
            try:
                nb = await nb_client.notebooks.create(nb_title)
                print("  - Uploading source...")
                await nb_client.sources.add_file(nb.id, pdf, wait=True, wait_timeout=600.0)

                # 1. Slide Generation
                if not slide_exists:
                    print("  - [NotebookLM] Generating slides...")
                    output_slide_dir.mkdir(parents=True, exist_ok=True)
                    s_status = await nb_client.artifacts.generate_slide_deck(
                        nb.id,
                        slide_format=SlideDeckFormat.DETAILED_DECK,
                        slide_length=SlideDeckLength.DEFAULT
                    )
                    await nb_client.artifacts.wait_for_completion(nb.id, s_status.task_id, timeout=12000)
                    print(f"  - [NotebookLM] Downloading slides to {output_slide_path}...")
                    await nb_client.artifacts.download_slide_deck(nb.id, str(output_slide_path))
                    if output_slide_path.exists():
                        print(f"  - ✅ Slides saved to {output_slide_path}")
                        slide_generated = True
                    else:
                        print(f"  - ❌ Error: Slide file {output_slide_path} not found after generation.")
                else:
                    print(f"  - ⏩ Skipping Slides (already exists at {output_slide_path})")

                # 2. Quiz Generation
                if not quiz_exists:
                    print("  - [NotebookLM] Generating quiz questions...")
                    q_status = await nb_client.artifacts.generate_quiz(
                        nb.id,
                        instructions=NB_PROMPT,
                        quantity=QuizQuantity.MORE,
                        difficulty=QuizDifficulty.HARD
                    )
                    await nb_client.artifacts.wait_for_completion(nb.id, q_status.task_id)
                    temp_file = DATA_OUT_DIR / f"temp_nb_{pdf.stem}.json"
                    await nb_client.artifacts.download_quiz(nb.id, str(temp_file), output_format="json")
                    
                    if temp_file.exists():
                        with open(temp_file, 'r') as f:
                            data = json.load(f)
                        temp_file.unlink()
                        qs = data.get("questions", [])
                        
                        if qs:
                            print(f"  - [NotebookLM] Generated {len(qs)} quiz questions.")
                            
                            raw_stem = pdf.stem.lower()
                            prefix = re.sub(r'[^a-z0-9]+', '-', raw_stem).strip('-')
                            
                            for q_idx, q in enumerate(qs, 1):
                                unique_id = f"ncert-{prefix}-{q_idx}"
                                q['id'] = unique_id
                                q['qid'] = unique_id
                                q['type'] = 'mcq'
                                
                            display_subject = " ".join([word.capitalize() for word in subject.split()])
                            quiz_data = {
                                "title": f"{class_name} - {pdf_title}",
                                "subject": display_subject,
                                "questions": qs
                            }
                            
                            append_to_master(quiz_data)
                            existing_titles.add(quiz_data["title"])
                            quiz_generated = True
                        else:
                            print("  - ❌ Error: Quiz JSON didn't contain questions.")
                else:
                    print("  - ⏩ Skipping Quiz (already exists in master JSON)")

            except Exception as e:
                if "SourceTimeoutError" in type(e).__name__ or "Timeout" in type(e).__name__:
                    print(f"  - ❌ Source processing timed out. Skipping file.")
                else:
                    print(f"  - ❌ Error processing {pdf.name}: {e}")
            finally:
                if nb:
                    try:
                        await nb_client.notebooks.delete(nb.id)
                    except:
                        pass
                        
            if (slide_exists or slide_generated) and (quiz_exists or quiz_generated):
                processed_files.add(pdf.name)
                with open(PROCESSED_LOG_PATH, 'w') as f:
                     json.dump(list(processed_files), f, indent=2)

            if slide_generated or quiz_generated:
                if i < len(pdfs) - 1:
                    print("  - Cooling down for 120 seconds...")
                    await asyncio.sleep(120)

if __name__ == "__main__":
    asyncio.run(main())
