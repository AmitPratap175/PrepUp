import asyncio
import os
import re
import json
from pathlib import Path
from telethon import TelegramClient
from dotenv import load_dotenv
import pdfplumber

# Load env variables
load_dotenv()
api_id = os.getenv("TELEGRAM_API_ID")
api_hash = os.getenv("TELEGRAM_API_HASH")
phone_number = os.getenv("TELEGRAM_PHONE_NUMBER")

# Target group ID
TARGET_GROUP_ID = 2128466118

# Base directory for saving tests
BASE_DIR = Path("/media/dspratap/Maxtor/UPSC 2027")

client = TelegramClient("session_name", api_id, api_hash)

def get_subdirectory(filename, text):
    combined = (filename + " " + text).lower()
    if "vision" in combined:
        return "Vision IAS"
    elif "forum" in combined:
        return "Forum IAS"
    elif "vajiram" in combined:
        return "Vajiram and Ravi"
    elif "insight" in combined:
        return "Insights IAS"
    elif "next" in combined and "ias" in combined:
        return "Next IAS"
    elif "drishti" in combined:
        return "Drishti IAS"
    elif "sunya" in combined:
        return "Sunya IAS"
    else:
        return "Other"

def words_to_text(word_list):
    lines = {}
    for w in word_list:
        y_key = round(w['top'] / 3) * 3
        lines.setdefault(y_key, []).append(w)
    result = []
    for y in sorted(lines):
        line = ' '.join(w['text'] for w in sorted(lines[y], key=lambda w: w['x0']))
        result.append(line)
    return '\n'.join(result)

def clean_question(text: str) -> str:
    text = text.strip()
    stem_starts = (
        r'(?:\d{1,2}\.|Which of|Select the|How many|What is|Consider|'
        r'With reference|Match|Choose|Identify|Arrange)'
    )
    # Removing re.IGNORECASE so that mid-sentence lowercase words like "consider" 
    # don't trigger a hard newline preservation.
    soft = re.compile(r'\n(?!\s*' + stem_starts + r')')
    prev = None
    while prev != text:
        prev = text
        text = soft.sub(' ', text)
    return re.sub(r'  +', ' ', text).strip()

def extract_columns(page):
    mid = page.width / 2
    words = page.extract_words(x_tolerance=1, y_tolerance=3)
    left = words_to_text([w for w in words if w['x0'] < mid])
    right = words_to_text([w for w in words if w['x0'] >= mid])
    return left, right

def parse_qp_text(qp_text):
    questions = {}
    
    qp_text = re.sub(r'www\.visionias\.in.*?(?:\n|$)', '\n', qp_text, flags=re.IGNORECASE)
    qp_text = re.sub(r'©Vision IAS.*?(?:\n|$)', '\n', qp_text, flags=re.IGNORECASE)
    # Remove standalone numbers that might be page numbers (e.g. "\n 2 \n")
    qp_text = re.sub(r'\n\s*\d+\s*\n', '\n', qp_text)
    
    pattern = re.compile(
        r'(?:^|\n|\s)(\d{1,3})\.\s+' # Question number
        r'(.*?)'                     # Question text
        r'\([aA]\)\s+(.*?)'          # Option A
        r'\([bB]\)\s+(.*?)'          # Option B
        r'\([cC]\)\s+(.*?)'          # Option C
        r'\([dD]\)\s+(.*?)'          # Option D
        r'(?=(?:^|\n|\s)\d{1,3}\.\s+|$)', # Lookahead for next question
        re.DOTALL
    )
    
    matches = pattern.finditer("\n" + qp_text)
    
    for m in matches:
        q_num = int(m.group(1))
        q_text = m.group(2).strip()
        
        questions[q_num] = {
            "qid": f"q-{q_num}",
            "question_text": clean_question(q_text),
            "options": [
                {"data_option": "1", "label": "A", "option_text": clean_question(m.group(3)), "is_correct": False},
                {"data_option": "2", "label": "B", "option_text": clean_question(m.group(4)), "is_correct": False},
                {"data_option": "3", "label": "C", "option_text": clean_question(m.group(5)), "is_correct": False},
                {"data_option": "4", "label": "D", "option_text": clean_question(m.group(6)), "is_correct": False}
            ],
            "correct_option_data": None,
            "solution_text": ""
        }
    return questions

def parse_sol_text(sol_text):
    solutions = {}
    matches = re.findall(r'(?m)^Q\s*(\d+)\.\s+([A-D])\s+(.*?)(?=\nQ\s*\d+\.\s+[A-D]|\Z)', sol_text, re.DOTALL)
    for q_num, ans, exp in matches:
        solutions[int(q_num)] = {
            "answer": ans.upper(),
            "explanation": exp.strip().replace('\n', ' ')
        }
    return solutions

def process_test_pairs(base_dir):
    print("\nProcessing downloaded PDFs to generate merged JSONs...")
    pdfs = list(Path(base_dir).rglob("*.pdf"))
    
    # Group by test identifier, e.g., "Test 01 (15601) Eng"
    groups = {}
    for p in pdfs:
        # Looking for pattern like "Test 01 (15601) Eng"
        match = re.search(r'(Test \d+ \(\d+\) Eng)', p.name)
        if match:
            test_id = match.group(1)
            groups.setdefault(test_id, {})
            if " QP " in p.name:
                groups[test_id]['QP'] = p
            elif " Sol " in p.name:
                groups[test_id]['Sol'] = p
                
    for test_id, files in groups.items():
        if 'QP' in files and 'Sol' in files:
            qp_path = files['QP']
            sol_path = files['Sol']
            prepup_upsc_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'upsc', '2027_tests')
            json_path = Path(prepup_upsc_dir) / f"{test_id}.json"
            
            if json_path.exists():
                print(f"  [~] {json_path.name} already exists. Skipping extraction.")
                continue
                
            print(f"  -> Merging QP and Sol for {test_id}...")
            
            qp_text = ""
            try:
                with pdfplumber.open(qp_path) as pdf:
                    for page in pdf.pages[1:]:
                        left, right = extract_columns(page)
                        qp_text += left + "\n" + right + "\n"
            except Exception as e:
                print(f"Error reading QP: {e}")
                continue
                
            questions = parse_qp_text(qp_text)
            
            sol_text = ""
            try:
                with pdfplumber.open(sol_path) as pdf:
                    for page in pdf.pages:
                        extracted = page.extract_text()
                        if extracted:
                            sol_text += extracted + "\n"
            except Exception as e:
                print(f"Error reading Sol: {e}")
                continue
                
            solutions = parse_sol_text(sol_text)
            
            merged = []
            for q_num in sorted(questions.keys()):
                q_data = questions[q_num]
                if q_num in solutions:
                    sol_data = solutions[q_num]
                    q_data["correct_option_data"] = sol_data["answer"]
                    q_data["solution_text"] = sol_data["explanation"]
                    for o in q_data["options"]:
                        if o["label"] == sol_data["answer"]:
                            o["is_correct"] = True
                merged.append(q_data)
                
            if merged:
                prepup_upsc_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'upsc', '2027_tests')
                os.makedirs(prepup_upsc_dir, exist_ok=True)
                json_filepath = os.path.join(prepup_upsc_dir, test_id + '.json')
                with open(json_filepath, 'w', encoding='utf-8') as f:
                    json.dump({"questions": merged}, f, indent=2, ensure_ascii=False)
                print(f"  [✓] Extracted {len(merged)} combined questions to {json_filepath}")

async def main():
    await client.start(phone=phone_number)
    print(f"Connected. Fetching messages from {TARGET_GROUP_ID}...")
    
    downloaded_count = 0
    skipped_count = 0

    async for message in client.iter_messages(TARGET_GROUP_ID, limit=None):
        if not message.media or not hasattr(message.media, 'document'):
            continue
            
        doc = message.media.document
        filename = None
        for attr in doc.attributes:
            if hasattr(attr, 'file_name'):
                filename = attr.file_name
                break
                
        if not filename:
            mime = getattr(doc, "mime_type", "") or ""
            if "pdf" in mime.lower():
                filename = f"message_{message.id}.pdf"
            else:
                continue

        text = message.text or ""
        
        if "2027" not in filename and "2027" not in text:
            continue
            
        # Skip Hindi versions
        if "hindi" in filename.lower() or "hindi" in text.lower():
            continue
            
        # Skip schedules
        if "schedule" in filename.lower() or "schedule" in text.lower():
            continue
            
        subdir_name = get_subdirectory(filename, text)
        save_dir = BASE_DIR / subdir_name
        save_dir.mkdir(parents=True, exist_ok=True)
        
        save_path = save_dir / filename
        
        if save_path.exists():
            print(f"Skipping already downloaded PDF: {filename}")
            skipped_count += 1
            continue
            
        print(f"Downloading {filename} to {save_dir}...")
        try:
            await client.download_media(message, str(save_path))
            downloaded_count += 1
            print(f"Successfully downloaded: {filename}")
        except Exception as e:
            print(f"Failed to download or process {filename}: {e}")

    print(f"\nDone! Downloaded: {downloaded_count}, Skipped: {skipped_count}")
    
    # Process the downloaded PDFs to generate merged JSONs
    process_test_pairs(BASE_DIR)

if __name__ == "__main__":
    with client:
        client.loop.run_until_complete(main())
