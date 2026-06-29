#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
UPSC Mains Telegram Scraper & Database Seeder
Scrapes posts from the 'Mains Excel Program 2026' Telegram group, extracts questions and 
model answer links, fetches model answers (from HTML/PDF), partitions them by question, 
and seeds the Django database to integrate with the frontend Mains Answer Evaluator.
"""

import asyncio
import os
import sys
import re
import json
import requests
from datetime import datetime
from bs4 import BeautifulSoup
from dotenv import load_dotenv

# Try to import pdfplumber for PDF scraping
try:
    import pdfplumber
    PDF_SCRAPER_AVAILABLE = True
except ImportError:
    PDF_SCRAPER_AVAILABLE = False

# Try to initialize Django environment to support ORM seeding
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "auth_project.settings")

try:
    import django
    django.setup()
    from api.models import MainsQuestion
    DJANGO_AVAILABLE = True
    print("[✓] Django environment initialized. Database seeding is enabled.")
except Exception as e:
    DJANGO_AVAILABLE = False
    print(f"[!] Standalone mode enabled. Django environment not found: {e}")

# Load environment variables
DATA_DIR = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(os.path.dirname(DATA_DIR), ".env")
load_dotenv(dotenv_path=env_path)

TELEGRAM_API_ID = os.getenv("TELEGRAM_API_ID")
TELEGRAM_API_HASH = os.getenv("TELEGRAM_API_HASH")
TELEGRAM_PHONE_NUMBER = os.getenv("TELEGRAM_PHONE_NUMBER")

# Browser User Agent for web scraping
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
}

# Output file path
QUESTIONS_JSON_PATH = os.path.join(DATA_DIR, "mains_questions_by_topic.json")

# ==========================================
# 1. Parsing & Web Scraping Engine
# ==========================================

def parse_mains_post(text: str) -> dict:
    """
    Parses a Telegram message containing UPSC Mains Answer Writing questions.
    Returns a structured dict with metadata and questions list, or None.
    Supports clean bold stripping and flexible marks/word limit parsing.
    """
    if not text:
        return None
        
    # Match pattern: UPSC Mains Answer Writing (GS 1 - Day 11)
    header_match = re.search(
        r"UPSC Mains Answer Writing\s*\(\s*(GS\s*[-–]?\s*[1-4I|i|v|V]+)\s*-\s*Day\s*(\d+)\s*\)", 
        text, 
        re.IGNORECASE
    )
    if not header_match:
        return None
        
    paper_str = header_match.group(1).strip()
    day_num = int(header_match.group(2))
    
    # Map paper string to integer 1-4
    gs_paper = 1
    if "2" in paper_str or "II" in paper_str.upper():
        gs_paper = 2
    elif "3" in paper_str or "III" in paper_str.upper():
        gs_paper = 3
    elif "4" in paper_str or "IV" in paper_str.upper():
        gs_paper = 4
        
    # Search for Topic
    topic_match = re.search(r"(?:Syllabus\s+)?Topic:\s*(.*)", text, re.IGNORECASE)
    topic = topic_match.group(1).strip() if topic_match else "General Studies"
    # Clean topic string from markdown bold asterisks
    topic = topic.replace("**", "").replace("__", "").strip()
    
    # Clean the text from markdown bold and underline formatting to make parsing extremely reliable
    clean_text = text.replace("**", "").replace("__", "").strip()
    
    # Locate all questions by finding Q1., Q 1), Case Study 1: etc.
    q_positions = []
    for m in re.finditer(r"(?:^|\n)\s*(?:-\s*)?(?:Case\s*Study|Q)?\s*(\d+)\s*[\.\):-]\s*", clean_text, re.IGNORECASE):
        q_num = int(m.group(1))
        start_pos = m.end()
        # Find start of the actual match to crop next questions accurately
        q_positions.append((q_num, start_pos, m.start()))
        
    # If no questions found, try scanning for "1.", "2." at start of lines
    if not q_positions:
        for m in re.finditer(r"(?:^|\n)\s*(\d+)\s*[\.\)]\s+", clean_text, re.IGNORECASE):
            q_num = int(m.group(1))
            start_pos = m.end()
            q_positions.append((q_num, start_pos, m.start()))
            
    # Sort positions by start index
    q_positions = sorted(q_positions, key=lambda x: x[1])
    
    questions = []
    for i, (q_num, start_pos, match_start) in enumerate(q_positions):
        # Determine the end of the question text
        if i + 1 < len(q_positions):
            # Slices up to the match start of the next question
            end_pos = q_positions[i+1][2]
        else:
            # Last question: ends at the model answer link/disclaimer or end of text
            end_match = re.search(
                r"(?:Click here|Model Answer|Link:|https?://|Note:)", 
                clean_text[start_pos:], 
                re.IGNORECASE
            )
            if end_match:
                end_pos = start_pos + end_match.start()
            else:
                end_pos = len(clean_text)
                
        q_body = clean_text[start_pos:end_pos].strip()
        
        # Parse Marks and Word Limit
        marks = 10
        word_limit = 150
        
        # Look for "(10 Marks, 150 Words)", "(10 M)" or similar
        metadata_match = re.search(
            r"[\(\[]\s*(\d+)\s*(?:Marks?|M)\s*(?:,\s*(\d+)\s*Words?)?\s*[\)\]]", 
            q_body, 
            re.IGNORECASE
        )
        if metadata_match:
            marks = int(metadata_match.group(1))
            if metadata_match.group(2):
                word_limit = int(metadata_match.group(2))
            else:
                # standard UPSC mappings
                if marks == 10:
                    word_limit = 150
                elif marks == 15:
                    word_limit = 250
                elif marks >= 20:
                    word_limit = 250
            q_body = q_body.replace(metadata_match.group(0), "").strip()
        else:
            # Fallback separate checks
            marks_match = re.search(r"(\d+)\s*(?:Marks?|M)\b", q_body, re.IGNORECASE)
            if marks_match:
                marks = int(marks_match.group(1))
                q_body = re.sub(r"[\(\[]?\s*" + re.escape(marks_match.group(0)) + r"\s*[\)\]]?", "", q_body).strip()
                if marks == 10:
                    word_limit = 150
                elif marks == 15:
                    word_limit = 250
                elif marks >= 20:
                    word_limit = 250
                    
            words_match = re.search(r"(\d+)\s*Words?", q_body, re.IGNORECASE)
            if words_match:
                word_limit = int(words_match.group(1))
                q_body = re.sub(r"[\(\[]?\s*" + re.escape(words_match.group(0)) + r"\s*[\)\]]?", "", q_body).strip()

        # Final string cleanups
        q_body = re.sub(r"\s+", " ", q_body).strip()
        q_body = q_body.rstrip(".")
        q_body = q_body.strip("()*[]-– ")
        
        if q_body:
            questions.append({
                "q_num": q_num,
                "question_text": q_body,
                "marks": marks,
                "word_limit": word_limit
            })
            
    return {
        "day_id": f"GS {gs_paper} - Day {day_num}",
        "gs_paper": gs_paper,
        "day": day_num,
        "topic": topic,
        "questions": questions
    }


def extract_questions_from_text(text: str) -> list:
    """
    Attempts to extract questions from a larger document (like a scraped model answer page)
    if the Telegram post didn't contain the question text directly.
    """
    if not text:
        return []
        
    clean_text = text.replace("**", "").replace("__", "").strip()
    
    # Match patterns for Q1., Q1), Q 1), Case Study 1:, 1., etc.
    q_positions = []
    for m in re.finditer(r"(?:^|\n)\s*(?:-\s*)?(?:Case\s*Study|Q)?\s*(\d+)\s*[\.\):-]\s*", clean_text, re.IGNORECASE):
        q_num = int(m.group(1))
        q_positions.append((q_num, m.end(), m.start()))
        
    if not q_positions:
        # Try finding standard numerical lists at start of lines "1.", "2."
        for m in re.finditer(r"(?:^|\n)\s*(\d+)\s*[\.\)]\s+", clean_text):
            q_num = int(m.group(1))
            q_positions.append((q_num, m.end(), m.start()))
            
    q_positions = sorted(q_positions, key=lambda x: x[1])
    
    questions = []
    for i, (q_num, start_pos, match_start) in enumerate(q_positions):
        if i + 1 < len(q_positions):
            # Ends at the start of the next question
            end_pos = q_positions[i+1][2]
        else:
            # Ends at model answer / model structure / etc. or end of text
            end_match = re.search(
                r"(?:Model Structure|Model Answer|Answer:|Introduction|Way Forward|Conclusion|Subscribe)", 
                clean_text[start_pos:], 
                re.IGNORECASE
            )
            if end_match:
                end_pos = start_pos + end_match.start()
            else:
                end_pos = len(clean_text)
                
        # Sliced text can contain model structures, let's make sure we only grab the question part
        q_slice = clean_text[start_pos:end_pos].strip()
        
        # Look for model structure keyword within the slice to crop early
        crop_match = re.search(
            r"(?:Model Structure|Model Answer|Answer:|Introduction|Way Forward|Conclusion)", 
            q_slice, 
            re.IGNORECASE
        )
        if crop_match:
            q_slice = q_slice[:crop_match.start()].strip()
            
        # Parse Marks
        marks = 10
        word_limit = 150
        metadata_match = re.search(
            r"[\(\[]\s*(\d+)\s*(?:Marks?|M)\s*(?:,\s*(\d+)\s*Words?)?\s*[\)\]]", 
            q_slice, 
            re.IGNORECASE
        )
        if metadata_match:
            marks = int(metadata_match.group(1))
            if metadata_match.group(2):
                word_limit = int(metadata_match.group(2))
            else:
                if marks == 10:
                    word_limit = 150
                elif marks == 15:
                    word_limit = 250
                elif marks >= 20:
                    word_limit = 250
            q_slice = q_slice.replace(metadata_match.group(0), "").strip()
        else:
            # Fallback separate checks
            marks_match = re.search(r"(\d+)\s*(?:Marks?|M)\b", q_slice, re.IGNORECASE)
            if marks_match:
                marks = int(marks_match.group(1))
                q_slice = re.sub(r"[\(\[]?\s*" + re.escape(marks_match.group(0)) + r"\s*[\)\]]?", "", q_slice).strip()
                if marks == 10:
                    word_limit = 150
                elif marks == 15:
                    word_limit = 250
                elif marks >= 20:
                    word_limit = 250
                    
        q_slice = re.sub(r"\s+", " ", q_slice).strip()
        q_slice = q_slice.rstrip(".")
        q_slice = q_slice.strip("()*[]-– ")
        
        # Avoid adding empty questions or blocks that are actually answers
        # Case studies can be quite long, so we support up to 2500 characters
        if q_slice and len(q_slice) < 2500:
            questions.append({
                "q_num": q_num,
                "question_text": q_slice,
                "marks": marks,
                "word_limit": word_limit
            })
            
    return questions


def extract_model_answer_url(text: str) -> str:
    """
    Extracts the model answer link from the Telegram message text.
    """
    urls = re.findall(r'https?://[^\s\)]+', text)
    if not urls:
        return ""
        
    cleaned_urls = [url.rstrip('.)],;') for url in urls]
    
    # Prioritize URLs matching relevant keywords
    keywords = ["answer", "model", "drive", "pdf", "solution", "upscprep", "excel", "key"]
    for url in cleaned_urls:
        if any(kw in url.lower() for kw in keywords):
            return url
            
    return cleaned_urls[0]


def scrape_model_answers(url: str) -> dict:
    """
    Downloads and extracts text content from HTML or PDF model answer links.
    """
    result = {
        "source_url": url,
        "scraped_at": datetime.now().isoformat(),
        "content_type": "unknown",
        "text": ""
    }
    
    if not url:
        return result
        
    print(f"  [~] Scraping model answer content from: {url}")
    try:
        response = requests.get(url, headers=HEADERS, timeout=15)
        response.raise_for_status()
        
        content_type = response.headers.get("Content-Type", "").lower()
        result["content_type"] = content_type
        
        if "application/pdf" in content_type or url.lower().endswith(".pdf"):
            if not PDF_SCRAPER_AVAILABLE:
                result["text"] = "PDF scraper (pdfplumber) is not installed. PDF Content cannot be extracted."
                print("  [!] PDF scraper not installed. Skip parsing.")
                return result
                
            import io
            with pdfplumber.open(io.BytesIO(response.content)) as pdf:
                pdf_text = []
                for i, page in enumerate(pdf.pages):
                    page_text = page.extract_text()
                    if page_text:
                        pdf_text.append(f"--- Page {i+1} ---\n{page_text}")
                result["text"] = "\n".join(pdf_text)
                print(f"  [✓] Scraped PDF successfully: {len(pdf.pages)} pages extracted.")
                
        else:
            soup = BeautifulSoup(response.text, "html.parser")
            
            # Clean up the HTML
            for element in soup(["script", "style", "nav", "footer", "header", "aside", "iframe"]):
                element.decompose()
                
            body_text = []
            title = soup.find("title")
            if title:
                body_text.append(f"# {title.get_text().strip()}\n")
                
            for el in soup.find_all(['h1', 'h2', 'h3', 'h4', 'p', 'li']):
                text = el.get_text().strip()
                if not text:
                    continue
                if el.name.startswith('h'):
                    level = el.name[1]
                    body_text.append(f"\n{'#' * int(level)} {text}\n")
                elif el.name == 'li':
                    body_text.append(f"- {text}")
                else:
                    body_text.append(text)
                    
            extracted_text = "\n".join(body_text).strip()
            if not extracted_text:
                # Fallback for plain text or unstructured pages
                extracted_text = response.text.strip()
                
            result["text"] = extracted_text
            print(f"  [✓] Scraped HTML page successfully: {len(result['text'])} chars extracted.")
            
    except Exception as e:
        print(f"  [!] Error scraping URL {url}: {e}")
        result["text"] = f"Failed to retrieve model answer content due to error: {str(e)}"
        
    return result


def clean_model_answer(text: str) -> str:
    """
    Cleans up any promotional texts, social media links, course ads,
    or HTML leftovers from the final model answer.
    """
    if not text:
        return ""
        
    # Crop at common promotional footers
    promo_patterns = [
        r"(?:^|\n)\s*####?\s+.*?(?:Optional|Mentorship|Essay|Focus Group|Essential|Course|Subscribe|Next Post|Sir\b|Ma'am\b)",
        r"(?:^|\n)\s*##\s+💌\s*Subscribe",
        r"(?:^|\n)\s*💌\s*Subscribe\s+to\s+UPSCprep\.com",
        r"(?:^|\n)\s*Actionable insights for improving",
        r"(?:^|\n)\s*Thank you for joining!",
        r"(?:^|\n)\s*-\s*Team\s*-\s*Discounts",
        r"(?:^|\n)\s*Next\s*Post",
        r"(?:^|\n)\s*Click here for Model Answers",
        r"(?:^|\n)\s*UPSCprep\.com\s*$"
    ]
    
    cleaned = text
    for pat in promo_patterns:
        match = re.search(pat, cleaned, re.IGNORECASE)
        if match:
            cleaned = cleaned[:match.start()].strip()
            
    # Remove header markers if they are at the very beginning of the sliced answer
    cleaned = re.sub(
        r"^(?:Model Structure|Model Answer|Model Answers|Answer:|Introduction|Model Structure Introduction:?)\s*", 
        "", 
        cleaned, 
        flags=re.IGNORECASE
    ).strip()
    
    # Remove any leading/trailing lines with "upscprep.com"
    lines = cleaned.split("\n")
    filtered_lines = []
    for line in lines:
        l_strip = line.strip()
        if l_strip.lower() == "upscprep.com":
            continue
        if "subscribe to" in l_strip.lower() and "upscprep" in l_strip.lower():
            continue
        filtered_lines.append(line)
        
    cleaned = "\n".join(filtered_lines).strip()
    return cleaned


def extract_single_model_answer(scraped_text: str, q_num: int, questions: list) -> str:
    """
    Slices the scraped model answers document to extract only the answer
    corresponding to a specific question number (e.g. Q1, Q2).
    Uses fuzzy/substring search for the actual question text to find boundaries.
    """
    if not scraped_text or "Failed to retrieve" in scraped_text:
        return scraped_text
        
    clean_text = scraped_text.replace("**", "").replace("__", "")
    
    # Map out the start position of each question in clean_text
    positions = {}
    for q in questions:
        num = q["q_num"]
        q_text = q["question_text"]
        
        # Build fuzzy pattern from the first 15 words, allowing any punctuation/whitespace in between
        words = re.findall(r"\b\w+\b", q_text)
        sample_words = words[:15]
        if sample_words:
            escaped_words = [re.escape(w) for w in sample_words]
            fuzzy_pat = r"\s*[^\w]*\s*".join(escaped_words)
            
            match = re.search(fuzzy_pat, clean_text, re.IGNORECASE)
            if match:
                positions[num] = match.start()
            
    # If we couldn't resolve positions using question text, fallback to searching Q1, Q2 headers
    if not positions:
        case_study_matches = list(re.finditer(r"(?:^|\n)\s*(?:-\s*)?Case\s*Study\s*(\d+)\s*[\.\):-]\s*", clean_text, re.IGNORECASE))
        if len(case_study_matches) >= 2:
            for m in case_study_matches:
                num = int(m.group(1))
                positions[num] = m.start()
        else:
            for m in re.finditer(r"(?:^|\n)\s*(?:-\s*)?(?:Case\s*Study|Q)?\s*(\d+)\s*[\.\):-]\s*", clean_text, re.IGNORECASE):
                num = int(m.group(1))
                if num not in positions:
                    positions[num] = m.start()
                    
    # Slicing the text
    if q_num in positions:
        start_pos = positions[q_num]
        
        # Determine the end position (the start of the next question)
        end_pos = len(clean_text)
        next_num = q_num + 1
        while next_num <= max(positions.keys()) + 1:
            if next_num in positions:
                end_pos = positions[next_num]
                break
            next_num += 1
            
        q_slice = clean_text[start_pos:end_pos].strip()
        
        # Strip question text from start of slice
        q_text = next((q["question_text"] for q in questions if q["q_num"] == q_num), "")
        if q_text:
            words = re.findall(r"\b\w+\b", q_text)
            sample_words = words[:10]
            if sample_words:
                escaped_words = [re.escape(w) for w in sample_words]
                prefix_pat = r"\s*[^\w]*\s*".join(escaped_words)
                prefix_match = re.search(prefix_pat, q_slice, re.IGNORECASE)
                if prefix_match:
                    q_end = prefix_match.end()
                    q_tail = re.search(r"[\?\.]", q_slice[q_end:q_end+300])
                    if q_tail:
                        ans_start_idx = q_end + q_tail.end()
                    else:
                        ans_start_idx = q_end
                    ans_text = q_slice[ans_start_idx:].strip()
                else:
                    ans_text = q_slice
            else:
                ans_text = q_slice
        else:
            ans_text = q_slice
            
        return clean_model_answer(ans_text)
        
    return clean_model_answer(clean_text)

# ==========================================
# 2. Telegram Scraper Orchestrator
# ==========================================

async def run_telegram_scraper():
    """
    Connects to Telegram via Telethon and extracts questions from group 'Mains Excel Program 2026'.
    """
    if not TELEGRAM_API_ID or not TELEGRAM_API_HASH or not TELEGRAM_PHONE_NUMBER:
        print("\n[!] ERROR: Telegram configuration missing in .env file.")
        print("Please configure: TELEGRAM_API_ID, TELEGRAM_API_HASH, TELEGRAM_PHONE_NUMBER")
        return
        
    from telethon import TelegramClient
    
    session_path = os.path.join(DATA_DIR, "session_name")
    client = TelegramClient(session_path, int(TELEGRAM_API_ID), TELEGRAM_API_HASH)
    
    print("\n[~] Connecting to Telegram...")
    await client.start(phone=TELEGRAM_PHONE_NUMBER)
    
    target_group_name = "Mains Excel Program 2026"
    target_entity = None
    
    print(f"[~] Resolving dialogs to find group: '{target_group_name}'...")
    async for dialog in client.iter_dialogs():
        if hasattr(dialog.entity, 'title') and dialog.entity.title:
            if target_group_name.lower() in dialog.entity.title.lower():
                target_entity = dialog.entity
                print(f"  [✓] Found Group: {dialog.entity.title} (ID: {dialog.entity.id})")
                break
                
    if not target_entity:
        print(f"\n[!] Group '{target_group_name}' not found in active chats.")
        print("Here are your active chats (please join the group or check the name):")
        async for dialog in client.iter_dialogs():
            if hasattr(dialog.entity, 'title') and dialog.entity.title:
                print(f" - {dialog.entity.title} (ID: {dialog.entity.id})")
        return
        
    # Read questions database
    if os.path.exists(QUESTIONS_JSON_PATH):
        with open(QUESTIONS_JSON_PATH, "r", encoding="utf-8") as f:
            database = json.load(f)
    else:
        database = {}
        
    print(f"\n[~] Fetching messages from '{target_entity.title}'...")
    count = 0
    scraped_days = 0
    
    async for message in client.iter_messages(target_entity, limit=None):
        text = message.text or ""
        parsed = parse_mains_post(text)
        if not parsed:
            continue
            
        topic = parsed["topic"]
        day_id = parsed["day_id"]
        
        # Verify duplicate and get index to update if it exists
        topic_entries = database.setdefault(topic, [])
        existing_idx = -1
        for idx, entry in enumerate(topic_entries):
            if entry["day_id"] == day_id:
                existing_idx = idx
                break
            
        print(f"\n[+] Processing: {day_id} | Topic: {topic}")
        
        # Extract model answer URL
        url = extract_model_answer_url(text)
        parsed["model_answer_link"] = url
        
        full_text = ""
        if url:
            scraped = scrape_model_answers(url)
            parsed["scraped_model_answers"] = scraped
            full_text = scraped.get("text", "")
        else:
            parsed["scraped_model_answers"] = {
                "source_url": "",
                "scraped_at": datetime.now().isoformat(),
                "content_type": "none",
                "text": "No model answer link was included in the Telegram message."
            }
            
        # If no questions were found in the Telegram message text, try to extract them from the crawled webpage!
        if not parsed["questions"] and full_text:
            parsed["questions"] = extract_questions_from_text(full_text)
            print(f"  [~] Extracted {len(parsed['questions'])} questions directly from the crawled model answer page.")
            
        # Partition model answers and save inside each question separately
        for q in parsed["questions"]:
            part_ans = extract_single_model_answer(full_text, q["q_num"], parsed["questions"])
            if not part_ans.strip() or "Failed to retrieve" in part_ans:
                part_ans = f"Model answers reference link: {url}"
            q["model_answer"] = part_ans
            
        if existing_idx >= 0:
            topic_entries[existing_idx] = parsed
            print(f"  [~] Updated existing day: {day_id}")
        else:
            topic_entries.append(parsed)
            print(f"  [+] Appended new day: {day_id}")
            scraped_days += 1
            
        count += len(parsed["questions"])
        
    with open(QUESTIONS_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(database, f, indent=2, ensure_ascii=False)
        
    print(f"\n[✓] Finished Telegram Scraping!")
    print(f"  - Day updates scraped: {scraped_days}")
    print(f"  - Total questions collected: {count}")
    print(f"  - Saved to: {QUESTIONS_JSON_PATH}")

# ==========================================
# 3. Mock Data Generator
# ==========================================

def run_mock_scraper():
    """
    Saves a mock entry representing UPSC Mains Answer Writing (GS 1 - Day 11)
    and crawls reference content to local JSON.
    """
    print("\n[~] Running Mock Scraper...")
    
    mock_post_text = """
UPSC Mains Answer Writing (GS 1 - Day 11)

Topic: Art & Culture 

Q1. Mughal art and architecture represent the composite architectural features employed by them by borrowing elements from various Indian as well as  foreign entities. Discuss. (10 Marks, 150 Words)

Q2. What measures have been taken by the government of India for the protection and preservation of historic monuments and relics? What are the responsibilities of the Archaeological Survey of India in this regard? (10 Marks, 150 Words)

Q3. Compare the architectural contributions of the Pallavas and Chalukyas. How did they shape the evolution of temple architecture in India? (10 Marks, 150 Words)

Q4. Discuss the administrative system of the Cholas and examine their foreign relations. (15 Marks, 250 Words)

Q5. Sangam literature is an important source for reconstructing the history and culture of early South India. Discuss. (15 Marks, 250 Words)

Model Answers Link: https://www.upscprep.com/upsc-mains-answer-writing-gs-1-day-11/
    """
    
    parsed = parse_mains_post(mock_post_text)
    if not parsed:
        print("[!] Parse failed. Verify parser regex rules.")
        return
        
    url = extract_model_answer_url(mock_post_text)
    parsed["model_answer_link"] = url
    
    print(f"[~] Crawling mock model answers URL: {url}")
    scraped = scrape_model_answers(url)
    parsed["scraped_model_answers"] = scraped
    full_text = scraped.get("text", "")
    
    # If no questions were found in the Telegram message text, try to extract them from the crawled webpage!
    if not parsed["questions"] and full_text:
        parsed["questions"] = extract_questions_from_text(full_text)
        
    # Partition model answers and save inside each question separately
    for q in parsed["questions"]:
        part_ans = extract_single_model_answer(full_text, q["q_num"], parsed["questions"])
        if not part_ans.strip() or "Failed to retrieve" in part_ans:
            part_ans = f"Model answers reference link: {url}"
        q["model_answer"] = part_ans
    
    # Load or initialize database
    if os.path.exists(QUESTIONS_JSON_PATH):
        with open(QUESTIONS_JSON_PATH, "r", encoding="utf-8") as f:
            database = json.load(f)
    else:
        database = {}
        
    topic = parsed["topic"]
    topic_entries = database.setdefault(topic, [])
    
    existing_idx = -1
    for idx, entry in enumerate(topic_entries):
        if entry["day_id"] == parsed["day_id"]:
            existing_idx = idx
            break
            
    if existing_idx >= 0:
        topic_entries[existing_idx] = parsed
        print(f"  [~] Updated existing day '{parsed['day_id']}' in JSON.")
    else:
        topic_entries.append(parsed)
        print(f"  [+] Appended new day '{parsed['day_id']}' to JSON.")
        
    with open(QUESTIONS_JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(database, f, indent=2, ensure_ascii=False)
        
    print("\n[✓] Mock Scraper execution complete!")
    print(f"  - Saved to: {QUESTIONS_JSON_PATH}")

# ==========================================
# 4. Django DB Sync & Seeding Engine
# ==========================================

def sync_questions_to_django():
    """
    Syncs the scraped questions and partitioned model answers from JSON directly into Django DB.
    Allows the frontend Evaluator to load these questions.
    """
    if not DJANGO_AVAILABLE:
        print("\n[!] Django is not available. Please verify settings and environment.")
        return
        
    if not os.path.exists(QUESTIONS_JSON_PATH):
        print(f"\n[!] JSON file '{QUESTIONS_JSON_PATH}' not found. Run Scraper or Mock Scraper first.")
        return
        
    with open(QUESTIONS_JSON_PATH, "r", encoding="utf-8") as f:
        database = json.load(f)
        
    print("\n[~] Seeding scraped questions and answers into Django Database...")
    inserted_count = 0
    skipped_count = 0
    
    for topic, day_lists in database.items():
        for day_data in day_lists:
            gs_paper = day_data["gs_paper"]
            full_scraped_text = day_data.get("scraped_model_answers", {}).get("text", "")
            questions = day_data.get("questions", [])
            total_qs = len(questions)
            
            for q in questions:
                q_text = q["question_text"]
                q_num = q["q_num"]
                
                # Retrieve partitioned model answer directly from question object in JSON
                partitioned_answer = q.get("model_answer", "")
                
                # If partitioning fails or raw text was unavailable, fall back to showing model link
                if not partitioned_answer.strip() or "Failed to retrieve" in partitioned_answer:
                    partitioned_answer = f"Model answers reference link: {day_data.get('model_answer_link', '')}"
                
                # Check for duplicate
                existing_q = MainsQuestion.objects.filter(question_text=q_text).first()
                if existing_q:
                    existing_q.model_answer = partitioned_answer
                    existing_q.save()
                    skipped_count += 1
                else:
                    # Seed into MainsQuestion Django table
                    MainsQuestion.objects.create(
                        gs_paper=gs_paper,
                        syllabus_topic=topic,
                        question_text=q_text,
                        model_answer=partitioned_answer,
                        key_points=[kw.strip() for kw in topic.split("&")] # Seed basic keywords from topic
                    )
                    inserted_count += 1
                
    print(f"\n[✓] Seeding completed successfully!")
    print(f"  - Questions synced: {inserted_count}")
    print(f"  - Questions skipped (already existed): {skipped_count}")

# ==========================================
# 5. CLI Presentation & Menu
# ==========================================

def view_questions():
    if not os.path.exists(QUESTIONS_JSON_PATH):
        print("\n[!] JSON questions file not found. Run Scraper or Mock Scraper first.")
        return
        
    with open(QUESTIONS_JSON_PATH, "r", encoding="utf-8") as f:
        database = json.load(f)
        
    print("\n================ SCRAPED TOPICS & QUESTIONS ================")
    for topic, day_lists in database.items():
        print(f"\n📚 Topic: {topic.upper()}")
        for day_data in day_lists:
            print(f"  [{day_data['day_id']}] (Model Link: {day_data.get('model_answer_link', 'None')})")
            for q in day_data["questions"]:
                print(f"    Q{q['q_num']}. {q['question_text'][:85]}...")
                print(f"        └─ [{q['marks']} Marks, {q['word_limit']} Words]")
    print("\n============================================================")
    input("\nPress Enter to return to menu...")


def interactive_menu():
    while True:
        print("\n" + "=" * 60)
        print("      PrepUp UPSC Mains Scraper & DB Seeding Manager")
        print("=" * 60)
        print("1. Scrape Telegram Group ('Mains Excel Program 2026')")
        print("2. Run Mock Scraper (Generates Example Day 11 Questions & Scrapes Answers)")
        print("3. View Scraped JSON Question Bank by Topic")
        
        last_num = 4
        if DJANGO_AVAILABLE:
            print("4. Sync Scraped Questions to Django Database (Seeder)")
            print("5. Exit")
            last_num = 5
        else:
            print("4. Exit")
            
        choice = input(f"\nEnter choice (1-{last_num}): ").strip()
        
        if choice == "1":
            asyncio.run(run_telegram_scraper())
        elif choice == "2":
            run_mock_scraper()
        elif choice == "3":
            view_questions()
        elif choice == "4":
            if DJANGO_AVAILABLE:
                sync_questions_to_django()
            else:
                print("Goodbye!")
                break
        elif choice == "5" and DJANGO_AVAILABLE:
            print("Goodbye!")
            break
        else:
            print("Invalid choice, please try again.")


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="UPSC Mains Telegram Scraper & Database Seeder")
    parser.add_argument("--scrape", action="store_true", help="Scrape Telegram group 'Mains Excel Program 2026' directly.")
    parser.add_argument("--mock-scrape", action="store_true", help="Initialize JSON with mock UPSC Mains Day 11 questions.")
    parser.add_argument("--sync", action="store_true", help="Sync scraped JSON questions to the Django Database.")
    args = parser.parse_args()
    
    if args.scrape:
        asyncio.run(run_telegram_scraper())
    elif args.mock_scrape:
        run_mock_scraper()
    elif args.sync:
        sync_questions_to_django()
    else:
        try:
            interactive_menu()
        except KeyboardInterrupt:
            print("\nGoodbye!")
