import json
import os
import asyncio
from typing import List, Dict
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.environ.get("GEMINI_API_KEY")
if not API_KEY:
    print("Error: GEMINI_API_KEY not found in environment variables.")
    exit(1)

client = genai.Client(api_key=API_KEY)

# Resolve path relative to this script
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_FILE = os.path.join(BASE_DIR, "data", "xat", "general_knowledge.json")

async def classify_batch(questions: List[Dict]) -> Dict[str, str]:
    """Classifies a batch of questions using Gemini."""
    
    prompt = """
    Classify the following General Knowledge questions into exactly one of two categories: "static" or "current-affairs".
    
    "static": Questions about history, geography, science, standard facts, books/authors (unless very recent), etc. that do not change with time.
    "current-affairs": Questions about recent events (last 1-2 years), awards (specific years), appointments, sports winners (specific years), government schemes (recent), etc.

    Return a JSON object where keys are the question IDs ("qid") and values are the tags ("static" or "current-affairs").
    
    Example Output:
    {
        "123": "static",
        "124": "current-affairs"
    }

    Questions:
    """
    
    questions_subset = []
    for q in questions:
        questions_subset.append({
            "qid": q["qid"],
            "question_text": q["question_text"],
            "options": [o["option_text"] for o in q["options"]]
        })
    
    prompt += json.dumps(questions_subset, indent=2)

    retries = 3
    base_delay = 5

    for attempt in range(retries):
        try:
            response = await client.aio.models.generate_content(
                model="gemini-2.5-flash-lite",
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.1
                )
            )
            
            if response.text:
                text = response.text.strip()
                if text.startswith("```json"):
                    text = text[7:]
                if text.startswith("```"):
                    text = text[3:]
                if text.endswith("```"):
                    text = text[:-3]
                return json.loads(text)
            else:
                print(f"Warning: Empty response text. Response: {response}", flush=True)
                return {}
                
        except Exception as e:
            print(f"Error classifying batch (attempt {attempt+1}/{retries}): {e}", flush=True)
            if "429" in str(e) or "ResourceExhausted" in str(e):
                wait_time = base_delay * (2 ** attempt)
                print(f"Rate limit hit. Retrying in {wait_time} seconds...", flush=True)
                await asyncio.sleep(wait_time)
            elif attempt < retries - 1:
                 # Retry for other errors too, just in case
                wait_time = base_delay
                print(f"Retrying in {wait_time} seconds...", flush=True)
                await asyncio.sleep(wait_time)
            else:
                return {}
    return {}

async def main():
    if not os.path.exists(DATA_FILE):
        print(f"File not found: {DATA_FILE}")
        return

    with open(DATA_FILE, 'r') as f:
        data = json.load(f)
    
    questions = data.get("questions", [])
    print(f"Loaded {len(questions)} questions.")
    
    batch_size = 20
    updated_count = 0
    
    for i in range(0, len(questions), batch_size):
        batch = questions[i : i + batch_size]
        print(f"Processing batch {i // batch_size + 1} / {(len(questions) + batch_size - 1) // batch_size}...", flush=True)
        
        # Skip if already tagged
        batch_to_process = [q for q in batch if "tag" not in q]
        if not batch_to_process:
            continue
        
        # Rate limiting delay between batches
        await asyncio.sleep(2)

        classifications = await classify_batch(batch_to_process)
        
        if classifications is None:
            classifications = {}

        for q in batch_to_process:
            qid = q["qid"]
            if qid in classifications:
                q["tag"] = classifications[qid]
                updated_count += 1
            else:
                # print(f"Warning: Could not classify question {qid}")
                pass

        # Save periodically
        if (i // batch_size) % 5 == 0:
             with open(DATA_FILE, 'w') as f:
                json.dump(data, f, indent=2)

    data["questions"] = questions
    
    with open(DATA_FILE, 'w') as f:
        json.dump(data, f, indent=2)
        
    print(f"Finished! Updated {updated_count} questions.")

if __name__ == "__main__":
    asyncio.run(main())
