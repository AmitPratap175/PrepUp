import json
import os
import asyncio
import uuid
import argparse
import random
from typing import List, Dict, Set
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.environ.get("GEMINI_API_KEY")
if not API_KEY:
    print("Error: GEMINI_API_KEY not found in environment variables.")
    exit(1)

client = genai.Client(api_key=API_KEY)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
STATIC_FILE = os.path.join(BASE_DIR, "data", "xat", "static_gk.json")
CURRENT_AFFAIRS_FILE = os.path.join(BASE_DIR, "data", "xat", "current_affairs_gk.json")

def load_existing_questions(filepath: str) -> Set[str]:
    if not os.path.exists(filepath):
        return set()
    try:
        with open(filepath, 'r') as f:
            data = json.load(f)
        return {q["question_text"].strip().lower() for q in data.get("questions", [])}
    except Exception as e:
        print(f"Error loading {filepath}: {e}")
        return set()

def save_questions(filepath: str, new_questions: List[Dict]):
    data = {"questions": []}
    if os.path.exists(filepath):
        try:
            with open(filepath, 'r') as f:
                data = json.load(f)
        except Exception as e:
            print(f"Error reading {filepath}, starting fresh: {e}")
    
    data["questions"].extend(new_questions)
    
    with open(filepath, 'w') as f:
        json.dump(data, f, indent=2)
    print(f"Appended {len(new_questions)} questions to {filepath}")

async def generate_batch(category: str, count: int, existing_texts: Set[str]) -> List[Dict]:
    print(f"Generating {count} {category} questions...", flush=True)
    
    topic_desc = ""
    if category == "static":
        topic_desc = "History, Geography, Indian Constitution, Science, Awards (Historical), Books & Authors, Art & Culture, Business History."
    else:
        topic_desc = "Recent events (last 12-18 months), Recent Awards (Nobel, Oscars, etc.), Sports winners (recent), New Government Schemes, Business News (Mergers, CEOs), International Summits."

    prompt = f"""
    Generate {count} unique, high-quality General Knowledge questions for the XAT (Xavier Aptitude Test) exam.
    Category: {category} ({topic_desc})
    
    Format requirements:
    - Multiple Choice Questions (5 options: A, B, C, D, E).
    - One correct answer.
    - JSON format.
    
    Output JSON structure:
    [
      {{
        "question_text": "The question string",
        "options": [
          {{ "label": "A", "option_text": "Option 1", "is_correct": false }},
          {{ "label": "B", "option_text": "Option 2", "is_correct": true }},
          ... (5 options total)
        ],
        "correct_option_data": "2",  // The data_option value of the correct answer (1-based index)
        "tag": "{category}"
      }}
    ]
    
    Ensure the questions are difficult and relevant to MBA entrance exams.
    Do NOT include markdown formatting (like ```json). Just the raw JSON array.
    """

    retries = 5
    base_delay = 20

    for attempt in range(retries):
        try:
            response = await client.aio.models.generate_content(
                model="gemini-2.5-flash-lite",
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.4
                )
            )
            
            if not response.text:
                print("Empty response from Gemini.")
                return []

            text = response.text.strip()
            if text.startswith("```json"):
                text = text[7:]
            if text.startswith("```"):
                text = text[3:]
            if text.endswith("```"):
                text = text[:-3]
                
            questions_data = json.loads(text)
            
            valid_questions = []
            for q in questions_data:
                # Basic validation
                if "question_text" not in q or "options" not in q:
                    continue
                    
                # Check duplicate
                q_text_norm = q["question_text"].strip().lower()
                if q_text_norm in existing_texts:
                    print(f"Duplicate skipped: {q['question_text'][:30]}...")
                    continue
                
                # Add missing fields
                q["qid"] = str(uuid.uuid4())
                q["passage_text"] = None
                q["image_url"] = None
                q["solution_text"] = None
                q["solution_image_url"] = None
                q["full_markdown"] = f"### Question (qid: {q['qid']})"
                
                # Ensure options have data_option
                for idx, opt in enumerate(q["options"]):
                    opt["data_option"] = str(idx + 1)
                    if "label" not in opt:
                        opt["label"] = chr(65 + idx) # A, B, C...
                
                # Ensure correct_option_data matches is_correct
                correct_opt = next((o for o in q["options"] if o.get("is_correct")), None)
                if correct_opt:
                    q["correct_option_data"] = correct_opt["data_option"]
                
                valid_questions.append(q)
                existing_texts.add(q_text_norm)
                
            return valid_questions

        except Exception as e:
            print(f"Error generating batch (attempt {attempt+1}/{retries}): {e}")
            if "429" in str(e) or "ResourceExhausted" in str(e):
                wait_time = base_delay * (2 ** attempt)
                print(f"Rate limit hit. Retrying in {wait_time} seconds...", flush=True)
                await asyncio.sleep(wait_time)
            elif attempt < retries - 1:
                wait_time = base_delay
                print(f"Retrying in {wait_time} seconds...", flush=True)
                await asyncio.sleep(wait_time)
            else:
                print("Max retries reached. Giving up on this batch.")
                return []
    return []

async def main():
    parser = argparse.ArgumentParser(description="Generate XAT GK questions.")
    parser.add_argument("--type", choices=["static", "current-affairs", "both"], default="both", help="Type of GK questions")
    parser.add_argument("--count", type=int, default=5, help="Total number of questions to generate per type (ignored in infinite mode)")
    parser.add_argument("--batch-size", type=int, default=5, help="Number of questions per API call")
    parser.add_argument("--delay", type=int, default=10, help="Delay in seconds between batches")
    parser.add_argument("--infinite", action="store_true", help="Run indefinitely")
    args = parser.parse_args()

    # Load existing to avoid duplicates
    existing_static = load_existing_questions(STATIC_FILE)
    existing_current = load_existing_questions(CURRENT_AFFAIRS_FILE)

    if True:
        print("Starting infinite generation loop. Press Ctrl+C to stop.")
        try:
            while True:
                if args.type in ["static", "both"]:
                    new_questions = await generate_batch("static", args.batch_size, existing_static)
                    if new_questions:
                        save_questions(STATIC_FILE, new_questions)
                        for q in new_questions:
                            existing_static.add(q["question_text"].strip().lower())
                    print(f"Waiting {args.delay}s...", flush=True)
                    await asyncio.sleep(args.delay)

                if args.type in ["current-affairs", "both"]:
                    new_questions = await generate_batch("current-affairs", args.batch_size, existing_current)
                    if new_questions:
                        save_questions(CURRENT_AFFAIRS_FILE, new_questions)
                        for q in new_questions:
                            existing_current.add(q["question_text"].strip().lower())
                    print(f"Waiting {args.delay}s...", flush=True)
                    await asyncio.sleep(args.delay)
        except KeyboardInterrupt:
            print("\nStopped by user.")
            return

    # Process Static (Fixed Count)
    if args.type in ["static", "both"]:
        remaining = args.count
        while remaining > 0:
            current_batch_size = min(args.batch_size, remaining)
            new_questions = await generate_batch("static", current_batch_size, existing_static)
            
            if new_questions:
                save_questions(STATIC_FILE, new_questions)
                # Update existing set to avoid duplicates within the same run
                for q in new_questions:
                    existing_static.add(q["question_text"].strip().lower())
            
            remaining -= current_batch_size
            if remaining > 0:
                print(f"Waiting {args.delay}s before next static batch...", flush=True)
                await asyncio.sleep(args.delay)
        
        # Delay between types if doing both
        if args.type == "both":
             print(f"Waiting {args.delay}s before switching to current affairs...", flush=True)
             await asyncio.sleep(args.delay)

    # Process Current Affairs
    if args.type in ["current-affairs", "both"]:
        remaining = args.count
        while remaining > 0:
            current_batch_size = min(args.batch_size, remaining)
            new_questions = await generate_batch("current-affairs", current_batch_size, existing_current)
            
            if new_questions:
                save_questions(CURRENT_AFFAIRS_FILE, new_questions)
                for q in new_questions:
                    existing_current.add(q["question_text"].strip().lower())
            
            remaining -= current_batch_size
            if remaining > 0:
                print(f"Waiting {args.delay}s before next current-affairs batch...", flush=True)
                await asyncio.sleep(args.delay)

if __name__ == "__main__":
    asyncio.run(main())
