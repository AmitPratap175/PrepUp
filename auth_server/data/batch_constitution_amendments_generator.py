import os
import json
import asyncio
import re
from pathlib import Path
from enum import Enum

# Third-party imports
from notebooklm import NotebookLMClient
from pypdf import PdfReader, PdfWriter

# --- Config & Constants ---
DATA_OUT_DIR = Path("/home/dspratap/Downloads/PrepUp/auth_server/data")
QUIZ_FILE = DATA_OUT_DIR / "ncert_combined_quiz.json"
INPUT_PDF = Path("/home/dspratap/Downloads/PrepUp/UPSC/NCERT/Constitutional Ammendments/constitutional_amendments.pdf")
PROCESSED_LOG_PATH = DATA_OUT_DIR / "processed_constitution_amendments_pages.json"
STORAGE_PATH = "/home/dspratap/.notebooklm/storage_state.json"

class QuizQuantity(Enum):
    FEWER = 1
    STANDARD = 2
    MORE = 3

class QuizDifficulty(Enum):
    EASY = 1
    MEDIUM = 2
    HARD = 3

# --- Prompts ---
PROMPT_REMEMBERING = """
Act as an expert educator. Your goal is to help me revise and memorize the specific facts in the uploaded constitution amendments document page.

**MANDATORY REQUIREMENTS:**
1. **FOCUS:** Generate direct, factual questions testing memory of Amendment numbers, their specific enactment years, the precise constitutional changes made, and key terms mentioned *exactly* as they appear on this page.
2. **QUANTITY:** Exhaustively cover all facts on this page. Do not leave a single amendment detail untested.
3. **RATIONALE:** Provide brief explanations reinforcing the factual memory.
4. **FORMAT:** Return your output ONLY as a valid and structured array of JSON MCQ objects directly aligned with this style. No markdown.
"""

PROMPT_UPSC = """
Act as a strict Union Public Service Commission (UPSC) paper setter. Your goal is to EXHAUSTIVELY test my conceptual and analytical knowledge of the uploaded document page.

**MANDATORY REQUIREMENTS:**
1. **UPSC FORMATS:** Generate Statement-Based Traps, Chronology (e.g., sequence of amendments), and Match the Following style questions.
2. **TRAPS:** Intentionally include common UPSC traps: swap dates, change 'Constitutional' to 'Statutory', or use extreme words like 'only', 'always', or 'mandatorily' to test precision.
3. **QUANTITY:** Generate diverse, hard difficulty questions covering the nuances of the amendments on this page.
4. **RATIONALE:** Provide a deep, pedagogical explanation for why statements are correct or incorrect.
5. **FORMAT:** Return your output ONLY as a valid and structured array of JSON MCQ objects directly aligned with this style. No markdown.
"""

# --- Helper Functions ---
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

# --- Generation Logic ---
async def generate_questions(nb_client, nb_id, prompt_text, prompt_type, temp_prefix):
    print(f"    - Running NotebookLM generation for [{prompt_type}] prompt...")
    try:
        status = await nb_client.artifacts.generate_quiz(
            nb_id,
            instructions=prompt_text,
            quantity=QuizQuantity.MORE,
            difficulty=QuizDifficulty.HARD
        )
        await nb_client.artifacts.wait_for_completion(nb_id, status.task_id)
        
        temp_file = DATA_OUT_DIR / f"{temp_prefix}.json"
        
        # Download quiz will write to file
        await nb_client.artifacts.download_quiz(nb_id, str(temp_file), output_format="json")
        
        qs = []
        if temp_file.exists():
            with open(temp_file, 'r') as f:
                data = json.load(f)
            qs = data.get("questions", [])
            print(f"    - [{prompt_type}] Generated {len(qs)} questions.")
            
            temp_file.unlink()
            
        return qs
    except Exception as e:
        if "Timeout" in str(type(e).__name__) or "SourceTimeoutError" in str(type(e).__name__):
             print(f"    - [{prompt_type}] Generation timed out.")
        else:
             print(f"    - [{prompt_type}] Generation failed: {e}")
        return []

# --- Main Logic ---
async def main():
    if not INPUT_PDF.exists():
        print(f"Error: PDF not found at {INPUT_PDF}")
        return

    processed_pages = set()
    if PROCESSED_LOG_PATH.exists():
        try:
            with open(PROCESSED_LOG_PATH, 'r') as f:
                processed_pages = set(json.load(f))
        except: pass

    reader = PdfReader(INPUT_PDF)
    total_pages = len(reader.pages)
    
    print(f"Loaded '{INPUT_PDF.name}' with {total_pages} pages.")

    async with await NotebookLMClient.from_storage(STORAGE_PATH) as nb_client:
        for i in range(total_pages):
            page_num = i + 1
            page_key = f"{INPUT_PDF.name}_page_{page_num}"
            
            if page_key in processed_pages:
                print(f"Skipping Page {page_num}/{total_pages} (Already Processed)")
                continue

            print(f"Processing Page {page_num}/{total_pages}...")
            
            writer = PdfWriter()
            writer.add_page(reader.pages[i])
            
            temp_pdf_path = DATA_OUT_DIR / f"temp_amend_{page_num}.pdf"
            with open(temp_pdf_path, 'wb') as f:
                writer.write(f)
            
            nb = None
            try:
                nb_title = f"Amendments Page {page_num}"
                print(f"  - Creating Notebook '{nb_title}'")
                nb = await nb_client.notebooks.create(nb_title)
                
                print(f"  - Uploading single-page PDF to NotebookLM...")
                await nb_client.sources.add_file(nb.id, temp_pdf_path, wait=True, wait_timeout=600.0)
                
                remembering_qs = await generate_questions(
                    nb_client, nb.id, PROMPT_REMEMBERING, "Remembering", f"temp_rmb_amend_{page_num}"
                )
                upsc_qs = await generate_questions(
                    nb_client, nb.id, PROMPT_UPSC, "UPSC-Style", f"temp_upsc_amend_{page_num}"
                )
                
                combined_qs = remembering_qs + upsc_qs
                
                if not combined_qs:
                    print(f"  - No questions generated for Page {page_num}. Skipping.")
                    continue

                title = f"Constitution of India - Amendments (Page {page_num})"
                subject = "Constitutional Amendments"
                
                for q_idx, q in enumerate(combined_qs, 1):
                    unique_id = f"const-amend-pg{page_num}-{q_idx}"
                    q['id'] = unique_id
                    q['qid'] = unique_id
                    q['type'] = 'mcq'
                
                quiz_data = {
                    "title": title,
                    "subject": subject,
                    "questions": combined_qs
                }
                
                append_to_master(quiz_data)
                
                processed_pages.add(page_key)
                with open(PROCESSED_LOG_PATH, 'w') as f:
                     json.dump(list(processed_pages), f, indent=2)
                     
            except Exception as e:
                print(f"  - Error processing page {page_num}: {e}")
            finally:
                if temp_pdf_path.exists():
                    temp_pdf_path.unlink()
                if nb:
                    try:
                        await nb_client.notebooks.delete(nb.id)
                    except:
                        pass
                
if __name__ == "__main__":
    asyncio.run(main())
