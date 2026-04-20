import os
import json
import base64
import asyncio
import re
import time
from pathlib import Path
from enum import Enum

# Third-party imports
from google import genai
from google.genai import types
from dotenv import load_dotenv
from notebooklm import NotebookLMClient

# Load environment variables
env_path = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

# --- Config & Constants ---
DATA_DIR = Path("/home/dspratap/Downloads/PrepUp/UPSC/NCERT") # Assume NCERT pdfs are here
DATA_OUT_DIR = Path("/home/dspratap/Downloads/PrepUp/auth_server/data")
PROCESSED_LOG_PATH = DATA_OUT_DIR / "processed_ncert_files.json"
QUIZ_FILE = DATA_OUT_DIR / "ncert_combined_quiz.json"
STORAGE_PATH = "/home/dspratap/.notebooklm/storage_state.json"

# --- Gemini API Setup ---
KEYS = [
    os.environ.get("GEMINI_API_KEY"),
    os.environ.get("GEMINI_API_KEY_1"),
    os.environ.get("GEMINI_API_KEY_2")
]
VALID_KEYS = [k for k in KEYS if k]

# Unset env vars to avoid conflicts
for k in ["GOOGLE_API_KEY", "GEMINI_API_KEY", "GEMINI_API_KEY_1", "GEMINI_API_KEY_2"]:
    if k in os.environ:
        del os.environ[k]

if not VALID_KEYS:
    print("Error: No GEMINI_API_KEYs found.")

CURRENT_KEY_INDEX = 0
if VALID_KEYS:
    gemini_client = genai.Client(api_key=VALID_KEYS[0])
else:
    gemini_client = None

# --- NotebookLM Constants ---
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

GEMINI_PROMPT_TEMPLATE = """
Act as a strict Union Public Service Commission (UPSC) paper setter and expert educator. Your goal is to EXHAUSTIVELY test the user on the uploaded NCERT document.

**MANDATORY REQUIREMENTS:**
1. **QUANTITY:** You must generate a MINIMUM of 20 questions and a maximum of any number of questions until every concept fact and idea is tested.
2. **FACT RECALL (Min. 20 Questions):** Direct 'Fact-Recall' questions.
3. **UPSC FORMATS (Remaining Questions):** Statement-Based Traps, Chronology, Match the Following.

**Output Rules:**
1. **EXHAUSTIVE COVERAGE:** Do not leave out a single relevant fact.
2. **RATIONALE:** Provide a deep, pedagogical explanation.
3. **ID GENERATION:** Use placeholder IDs, we will renumber them.
4. **FORMAT:** Return ONLY a JSON object matching the provided schema.
"""

# --- Helper Functions ---

def switch_gemini_key():
    global gemini_client, CURRENT_KEY_INDEX
    if len(VALID_KEYS) <= 1:
        print("\n[System] Quota exceeded, but only one key is available. Waiting 60s...")
        return False
        
    CURRENT_KEY_INDEX = (CURRENT_KEY_INDEX + 1) % len(VALID_KEYS)
    new_key = VALID_KEYS[CURRENT_KEY_INDEX]
    print(f"\n[System] Quota exceeded. Switching to API Key #{CURRENT_KEY_INDEX + 1}...")
    gemini_client = genai.Client(api_key=new_key)
    return True

async def call_gemini_with_retry(model, contents, client, config=None):
    max_retries = len(VALID_KEYS) * 2
    for attempt in range(max_retries):
        try:
            response = await client.aio.models.generate_content(
                model=model,
                contents=contents,
                config=config
            )
            return response
        except Exception as e:
            if "429" in str(e) or "RESOURCE_EXHAUSTED" in str(e):
                switched = switch_gemini_key()
                if not switched:
                     await asyncio.sleep(60)
                else:
                    await asyncio.sleep(2)
                continue
            if "404" in str(e) and "Thinking" in str(e):
                 raise e
            raise e
    raise Exception("Max retries exceeded with all available keys.")


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

# --- Generators ---

async def generate_via_gemini(file_base64, mime_type, filename, subject):
    """Generates ~50 questions using Gemini Flash/Thinking."""
    if not gemini_client:
        print("Skipping Gemini generation (No Client)")
        return []

    print("  - [Gemini] Generating questions...")
    try:
        try:
            response = await call_gemini_with_retry(
                model='gemini-2.0-flash-thinking-exp-01-21',
                client=gemini_client,
                contents={'parts': [{'inline_data': {'data': file_base64, 'mime_type': mime_type}}, {'text': GEMINI_PROMPT_TEMPLATE}]},
                config=types.GenerateContentConfig(
                    thinking_config={"thinking_budget": 1024},
                    response_mime_type="application/json",
                    response_schema={
                        "type": "OBJECT",
                        "properties": {
                            "questions": {
                                "type": "ARRAY",
                                "items": {
                                    "type": "OBJECT",
                                    "properties": {
                                        "question": {"type": "STRING"},
                                        "answerOptions": {
                                            "type": "ARRAY",
                                            "items": {"type": "OBJECT", "properties": {"text": {"type": "STRING"}, "isCorrect": {"type": "BOOLEAN"}, "rationale": {"type": "STRING"}}, "required": ["text", "isCorrect"]}
                                        },
                                        "hint": {"type": "STRING"}
                                    },
                                    "required": ["question", "answerOptions"]
                                }
                            }
                        }
                    }
                )
            )
            data = json.loads(response.text or "{}")
            qs = data.get("questions", [])
            print(f"  - [Gemini] Thinking model generated {len(qs)} questions.")
            return qs
        except Exception as e:
            print(f"  - [Gemini] Thinking model failed: {e}. Falling back to Flash.")
            response = await call_gemini_with_retry(
                model='gemini-2.5-flash',
                client=gemini_client,
                contents={'parts': [{'inline_data': {'data': file_base64, 'mime_type': mime_type}}, {'text': GEMINI_PROMPT_TEMPLATE}]},
                config=types.GenerateContentConfig(response_mime_type="application/json", response_schema={"type": "OBJECT", "properties": {"questions": {"type": "ARRAY", "items": {"type": "OBJECT", "properties": {"question": {"type": "STRING"}, "answerOptions": {"type": "ARRAY", "items": {"type": "OBJECT", "properties": {"text": {"type": "STRING"}, "isCorrect": {"type": "BOOLEAN"}, "rationale": {"type": "STRING"}}, "required": ["text", "isCorrect"]}}, "hint": {"type": "STRING"}}, "required": ["question", "answerOptions"]}}}})
            )
            data = json.loads(response.text or "{}")
            qs = data.get("questions", [])
            print(f"  - [Gemini] Flash model generated {len(qs)} questions.")
            return qs

    except Exception as e:
        print(f"  - [Gemini] Generation failed: {e}")
        raise

async def generate_via_notebooklm(nb_client, pdf_path):
    """Generates ~20 questions using NotebookLM."""
    print("  - [NotebookLM] Generating questions...")
    nb_title = f"NCERT Quiz: {pdf_path.stem}"
    nb = None
    try:
        nb = await nb_client.notebooks.create(nb_title)
        await nb_client.sources.add_file(nb.id, pdf_path, wait=True, wait_timeout=600.0)
        
        status = await nb_client.artifacts.generate_quiz(
            nb.id,
            instructions=NB_PROMPT,
            quantity=QuizQuantity.MORE,
            difficulty=QuizDifficulty.HARD
        )
        await nb_client.artifacts.wait_for_completion(nb.id, status.task_id)
        
        temp_file = DATA_OUT_DIR / f"temp_nb_{pdf_path.stem}.json"
        await nb_client.artifacts.download_quiz(nb.id, str(temp_file), output_format="json")
        
        if temp_file.exists():
            with open(temp_file, 'r') as f:
                data = json.load(f)
            temp_file.unlink()
            qs = data.get("questions", [])
            print(f"  - [NotebookLM] Generated {len(qs)} questions.")
            return qs
        return []

    except Exception as e:
        if "SourceTimeoutError" in type(e).__name__ or "Timeout" in type(e).__name__:
            print(f"  - [NotebookLM] Source processing timed out. Skipping NotebookLM questions for this file.")
            return []
        print(f"  - [NotebookLM] Generation failed: {e}")
        raise
    finally:
        if nb:
            try:
                await nb_client.notebooks.delete(nb.id)
            except:
                pass


def parse_class_and_subject(pdf_path, root_dir):
    try:
        relative_path = pdf_path.relative_to(root_dir)
        parts = relative_path.parts
        
        if len(parts) >= 2:
            class_name = parts[0]
            if len(parts) == 2:
                # E.g. Class_6/file.pdf
                subject_name = "General"
            else:
                subject_name = parts[1]
        else:
            class_name = "Unknown Class"
            subject_name = "General"
            
        return class_name.replace("_", " "), subject_name.replace("_", " ")
    except ValueError:
        return "Unknown Class", "General"

# --- Main Logic ---

async def main():
    if not DATA_DIR.exists():
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        print(f"Created {DATA_DIR}. Please place NCERT PDFs there.")
        # return # uncomment to stop execution if dir was missing

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
    
    # Check existing quizzes for redundancy across all subjects
    existing_quizzes = load_master_quiz_list()
    existing_titles = set(q.get("title", "") for q in existing_quizzes)

    async with await NotebookLMClient.from_storage(STORAGE_PATH) as nb_client:
        for i, pdf in enumerate(pdfs):
            is_processed = pdf.name in processed_files
            if not is_processed:
                for title in existing_titles:
                     if pdf.stem in title:
                         is_processed = True
                         break
            
            if is_processed:
                print(f"Skipping ({i+1}/{len(pdfs)}): {pdf.name} (Already Processed)")
                continue

            print(f"Processing ({i+1}/{len(pdfs)}): {pdf.name} (Path: {pdf.relative_to(DATA_DIR)})")
            
            class_name, subject = parse_class_and_subject(pdf, DATA_DIR)

            with open(pdf, "rb") as f:
                content = f.read()
            file_base64 = base64.b64encode(content).decode('utf-8')
            mime_type = "application/pdf"

            print(f"  - Document classified as: Class: {class_name}, Subject: {subject}")
            
            # gemini_qs = await generate_via_gemini(file_base64, mime_type, pdf.name, subject)
            nb_qs = await generate_via_notebooklm(nb_client, pdf)
            
            # combined_qs = gemini_qs + nb_qs
            combined_qs = nb_qs
            
            if not combined_qs:
                print("  - Failed to generate questions from both sources. Skipping.")
                continue

            pdf_title = pdf.stem.replace("_", " ").title()
            title = f"{class_name} - {pdf_title}"
            
            raw_stem = pdf.stem.lower()
            prefix = re.sub(r'[^a-z0-9]+', '-', raw_stem).strip('-')
            
            for q_idx, q in enumerate(combined_qs, 1):
                unique_id = f"ncert-{prefix}-{q_idx}"
                q['id'] = unique_id
                q['qid'] = unique_id
                q['type'] = 'mcq'
            
            # Format subject name neatly 
            display_subject = " ".join([word.capitalize() for word in subject.split()])
            
            quiz_data = {
                "title": title,
                "subject": display_subject,
                "questions": combined_qs
            }
            
            append_to_master(quiz_data)
            
            processed_files.add(pdf.name)
            with open(PROCESSED_LOG_PATH, 'w') as f:
                 json.dump(list(processed_files), f, indent=2)
            
            # print(f"  - Saved {len(combined_qs)} questions (Gemini: {len(gemini_qs)}, NotebookLM: {len(nb_qs)}).")
            print(f"  - Saved {len(combined_qs)} questions (NotebookLM: {len(nb_qs)}).")
            
            if i < len(pdfs) - 1:
                print("  - Cooling down for 60 seconds...")
                await asyncio.sleep(60)

if __name__ == "__main__":
    asyncio.run(main())
