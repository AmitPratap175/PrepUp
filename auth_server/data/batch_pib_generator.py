import os
import json
import asyncio
import re
import requests
from pathlib import Path
from datetime import datetime
from urllib.parse import urljoin, urlparse, parse_qs
from bs4 import BeautifulSoup
from dotenv import load_dotenv
from notebooklm import NotebookLMClient, QuizQuantity, QuizDifficulty

# Load environment variables
env_path = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

# --- Config & Constants ---
DATA_OUT_DIR = Path(__file__).resolve().parent
PROCESSED_LOG_PATH = DATA_OUT_DIR / "processed_pib_releases.json"
OUTPUT_FILE = DATA_OUT_DIR / "pib_combined_data.json"
STORAGE_PATH = "/home/dspratap/.notebooklm/storage_state.json"

BASE_URL = "https://www.pib.gov.in/allRel.aspx?reg=3&lang=1"

PIB_NB_PROMPT = """
Act as a strict Union Public Service Commission (UPSC) paper setter and expert educator. 
Analyze the following PIB (Press Information Bureau) release and create study material for UPSC aspirants.

Tasks:
1. Provide a comprehensive, detailed summary of the release. It should cover all key facts, schemes, data points, and policy decisions mentioned. Organize with clear markdown headings and bullet points.
2. Generate 5 high-quality Prelims MCQs in the UPSC style (including statement-based questions). Provide detailed explanations.
3. Generate 2 UPSC Mains questions (General Studies) relevant to this release, with a model answer structure.

Output Rules:
- Cover the entire document.
- Provide a separate Answer Key at the end. Use markdown.
"""

# --- Scraper Logic ---

def fetch_pib_links(limit=10, day=None, month=None, year=None):
    """
    Fetches PIB release links. If date params are provided, it tries to fetch for that date.
    Otherwise, it fetches the current day's releases.
    PIB URL for specific date: allRel.aspx?col=1&day=24&month=4&year=2024
    """
    url = BASE_URL
    if day and month and year:
        url = f"https://www.pib.gov.in/allRel.aspx?reg=3&lang=1&day={day}&month={month}&year={year}"
    
    try:
        print(f"Fetching release list from {url}...")
        # Use headers to look like a browser
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        soup = BeautifulSoup(response.content, 'html.parser')

        # The links are usually in <ul> <li> <a> structure after Ministry headings
        links = soup.select('a[href*="PressReleasePage.aspx"]')
        print(f"Found {len(links)} potential links.")

        unique_links = []
        seen_prids = set()
        for link in links:
            href = link.get('href')
            full_url = urljoin(BASE_URL, href)
            parsed = urlparse(full_url)
            qs = parse_qs(parsed.query)
            prid = qs.get('PRID', [None])[0]

            if not prid or prid in seen_prids:
                continue
            seen_prids.add(prid)
            unique_links.append({
                "prid": prid,
                "url": full_url,
                "title": link.get_text(strip=True)
            })
            if len(unique_links) >= limit:
                break
        
        return unique_links
    except Exception as e:
        print(f"Scrape error (links): {e}")
        return []

def fetch_release_content(url):
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Try different content selectors
        content_div = (
            soup.select_one('.ReleaseText') or 
            soup.select_one('div.innner-page-main-about-us-content-right-part') or
            soup.select_one('#ctl00_ContentPlaceHolder1_divReleaseText')
        )
        
        if content_div:
            return content_div.get_text(separator="\n\n", strip=True)
        
        # Fallback to general text extraction
        text = soup.get_text(separator="\n\n", strip=True)
        # Clean up if needed
        return text
    except Exception as e:
        print(f"Error fetching content from {url}: {e}")
        return None

# --- NotebookLM Generator ---

async def generate_via_notebooklm(nb_client, title, content):
    """Generates study material using NotebookLM."""
    print(f"  - [NotebookLM] Generating study material for: {title}...")
    nb_title = f"PIB Study: {title[:50]}"
    nb = None
    try:
        # Save content to a temporary file
        temp_txt = DATA_OUT_DIR / f"temp_pib_{datetime.now().timestamp()}.txt"
        with open(temp_txt, "w", encoding="utf-8") as f:
            f.write(content)

        nb = await nb_client.notebooks.create(nb_title)
        await nb_client.sources.add_file(nb.id, temp_txt, wait=True, wait_timeout=600.0)
        temp_txt.unlink()
        
        # We use generate_quiz but with custom instructions for summary + quiz + mains
        status = await nb_client.artifacts.generate_quiz(
            nb.id,
            instructions=PIB_NB_PROMPT,
            quantity=QuizQuantity.STANDARD,
            difficulty=QuizDifficulty.HARD
        )
        await nb_client.artifacts.wait_for_completion(nb.id, status.task_id)
        
        temp_json = DATA_OUT_DIR / f"temp_nb_pib_{datetime.now().timestamp()}.json"
        await nb_client.artifacts.download_quiz(nb.id, str(temp_json), output_format="json")
        
        if temp_json.exists():
            with open(temp_json, 'r') as f:
                data = json.load(f)
            temp_json.unlink()
            return data
        return None

    except Exception as e:
        print(f"  - [NotebookLM] Generation failed: {e}")
        return None
    finally:
        if nb:
            try:
                await nb_client.notebooks.delete(nb.id)
            except:
                pass

# --- Main logic ---

async def main():
    # Set these to specific values if you want to scrape a historical date
    # Example for April 24, 2024: test_day, test_month, test_year = 24, 4, 2024
    test_day, test_month, test_year = None, None, None
    
    limit = 10 # Number of recent releases to fetch
    links = fetch_pib_links(limit=limit, day=test_day, month=test_month, year=test_year)
    
    if not links:
        print("No links found for the selected date. This is common if no releases have been published yet today.")
        return

    processed_prids = []
    if PROCESSED_LOG_PATH.exists():
        try:
            with open(PROCESSED_LOG_PATH, 'r') as f:
                processed_prids = json.load(f)
        except: pass
    
    final_data = []
    if OUTPUT_FILE.exists():
        try:
            with open(OUTPUT_FILE, 'r') as f:
                final_data = json.load(f)
        except: pass

    async with await NotebookLMClient.from_storage(STORAGE_PATH) as nb_client:
        for item in links:
            prid = item["prid"]
            if prid in processed_prids:
                print(f"Skipping PRID {prid} (Already processed)")
                continue
            
            print(f"Processing PRID {prid}: {item['title']}")
            content = fetch_release_content(item["url"])
            if not content:
                print(f"  - Failed to fetch content for {prid}. Skipping.")
                continue
            
            nb_data = await generate_via_notebooklm(nb_client, item["title"], content)
            
            if nb_data:
                entry = {
                    "prid": prid,
                    "title": item["title"],
                    "url": item["url"],
                    "date": datetime.now().strftime("%Y-%m-%d") if not test_day else f"{test_year}-{test_month}-{test_day}",
                    "ai_content": nb_data
                }
                final_data.append(entry)
                
                # Save progress
                processed_prids.append(prid)
                with open(PROCESSED_LOG_PATH, 'w') as f:
                    json.dump(processed_prids, f, indent=2)
                
                with open(OUTPUT_FILE, 'w') as f:
                    json.dump(final_data, f, indent=2)
                
                print(f"  - Successfully processed and saved {prid}")
            else:
                print(f"  - Failed to generate content for {prid}")
            
            # Cooldown to avoid rate limits
            await asyncio.sleep(5)

if __name__ == "__main__":
    asyncio.run(main())
