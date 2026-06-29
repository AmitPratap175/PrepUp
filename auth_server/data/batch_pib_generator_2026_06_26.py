import os
import json
import asyncio
import sys
import requests
from pathlib import Path
from datetime import datetime, timedelta
from urllib.parse import urljoin, urlparse, parse_qs
from bs4 import BeautifulSoup
from dotenv import load_dotenv

# crawl4ai imports
from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig, CacheMode

# NotebookLM imports
from notebooklm import NotebookLMClient, QuizQuantity, QuizDifficulty

# Load environment variables
env_path = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

# --- Config & Constants ---
DATA_OUT_DIR = Path(__file__).resolve().parent
PROCESSED_LOG_PATH = DATA_OUT_DIR / "processed_pib_releases.json"
OUTPUT_FILE = DATA_OUT_DIR / "pib_combined_data.json"
STORAGE_PATH = "/home/dspratap/.notebooklm/storage_state.json"

PIB_ALL_REL = "https://www.pib.gov.in/allRel.aspx?reg=3&lang=1"

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

def fetch_release_content(url):
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()
        soup = BeautifulSoup(response.content, 'html.parser')
        
        content_div = (
            soup.select_one('.ReleaseText') or 
            soup.select_one('div.innner-page-main-about-us-content-right-part') or
            soup.select_one('#ctl00_ContentPlaceHolder1_divReleaseText')
        )
        
        if content_div:
            return content_div.get_text(separator="\n\n", strip=True)
        
        text = soup.get_text(separator="\n\n", strip=True)
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
        temp_txt = DATA_OUT_DIR / f"temp_pib_{datetime.now().timestamp()}.txt"
        with open(temp_txt, "w", encoding="utf-8") as f:
            f.write(content)

        nb = await nb_client.notebooks.create(nb_title)
        await nb_client.sources.add_file(nb.id, temp_txt, wait=True, wait_timeout=600.0)
        temp_txt.unlink()
        
        status = await nb_client.artifacts.generate_quiz(
            nb.id,
            instructions=PIB_NB_PROMPT,
            quantity=QuizQuantity.STANDARD,
            difficulty=QuizDifficulty.HARD
        )
        await nb_client.artifacts.wait_for_completion(nb.id, status.task_id)
        
        temp_json = DATA_OUT_DIR / f"temp_nb_pib_{datetime.now().timestamp()}.json"
        await nb_client.artifacts.download_quiz(nb.id, str(temp_json), output_format="json")
        
        from notebooklm.rpc.types import ReportFormat
        status_report = await nb_client.artifacts.generate_report(
            nb.id,
            report_format=ReportFormat.BRIEFING_DOC
        )
        await nb_client.artifacts.wait_for_completion(nb.id, status_report.task_id)
        
        temp_txt = DATA_OUT_DIR / f"temp_nb_pib_report_{datetime.now().timestamp()}.md"
        await nb_client.artifacts.download_report(nb.id, str(temp_txt), artifact_id=status_report.task_id)
        
        await nb_client.notebooks.delete(nb.id)
        
        data = None
        if temp_json.exists():
            try:
                with open(temp_json, 'r') as f:
                    data = json.load(f)
                temp_json.unlink()
                
                if temp_txt.exists():
                    with open(temp_txt, 'r') as f:
                        data["summary"] = f.read()
                    temp_txt.unlink()
            except Exception as e:
                print(f"Failed to parse quiz JSON: {e}")
                
        return data

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
    date_target = datetime(2026, 6, 26)
    date_str = date_target.strftime("%Y-%m-%d")
    day_str = str(date_target.day)
    month_str = "June"
    year_str = str(date_target.year)

    print(f"Targeting PIB releases for date: {date_str}")
    
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

    browser_config = BrowserConfig(
        headless=True,
        verbose=True,
        use_managed_browser=True,
        browser_type="chromium",
        extra_args=["--disable-blink-features=AutomationControlled"],
        user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    )

    async with AsyncWebCrawler(config=browser_config) as crawler:
        session_id = f"pib_{date_str}"

        async def select_and_step(selector_id, text, wait_time=3.0):
            js = f"""
            (async () => {{
                const el = document.getElementById("{selector_id}");
                if (el) {{
                    const opt = Array.from(el.options).find(o => o.text.trim() === "{text}");
                    if (opt) {{
                        el.value = opt.value;
                        el.dispatchEvent(new Event('input', {{ bubbles: true }}));
                        el.dispatchEvent(new Event('change', {{ bubbles: true }}));
                        if (typeof __doPostBack !== 'undefined') {{
                            __doPostBack(el.name || el.id.replace(/_/g, '$'), '');
                        }}
                    }}
                }}
            }})();
            """
            return await crawler.arun(
                PIB_ALL_REL,
                config=CrawlerRunConfig(js_code=js, session_id=session_id, wait_for="body", delay_before_return_html=wait_time, cache_mode=CacheMode.BYPASS),
                magic=True
            )

        # Select Year
        print(f"Selecting Year {year_str}...")
        await select_and_step("ContentPlaceHolder1_ddlYear", year_str)
        
        # Select Month
        print(f"Selecting Month {month_str}...")
        await select_and_step("ContentPlaceHolder1_ddlMonth", month_str)
        
        # Select Day
        print(f"Selecting Day {day_str}...")
        result = await select_and_step("ContentPlaceHolder1_ddlday", day_str, wait_time=5.0)

        if not result.success:
            print(f"Failed to crawl date selection: {result.error_message}")
            return

        if "Access Denied" in result.html:
            print("Access Denied on the page.")
            return

        soup = BeautifulSoup(result.html, "html.parser")
        links = soup.select('a[href*="PressReleasePage.aspx"]')
        print(f"Found {len(links)} potential links on page.")

        unique_links = []
        seen_prids = set()
        for link in links:
            href = link.get('href')
            full_url = urljoin(PIB_ALL_REL, href)
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

        print(f"Found {len(unique_links)} unique releases to process.")
        if not unique_links:
            return

        async with await NotebookLMClient.from_storage(STORAGE_PATH) as nb_client:
            for item in unique_links:
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
                    # Generate Tags and Mains Questions using standard Gemini model
                    tags = []
                    mains_questions = []
                    try:
                        from langchain_google_genai import ChatGoogleGenerativeAI
                        from pydantic import BaseModel, Field
                        class MainsQuestion(BaseModel):
                            question: str = Field(description="The UPSC Mains question")
                            answer: str = Field(description="The model answer structure in markdown")
                        class TagsOutput(BaseModel):
                            tags: list[str] = Field(description='List of UPSC GS Paper Tags (e.g. GS-1: History, GS-2: Polity, GS-3: Economy, GS-3: Environment)')
                            mains_questions: list[MainsQuestion] = Field(description='List of exactly 2 UPSC Mains questions with model answers')
                            
                        model = ChatGoogleGenerativeAI(model='gemini-2.5-flash', temperature=0.1).with_structured_output(TagsOutput)
                        prompt = f'Task 1: Categorize this PIB release with up to 3 relevant UPSC General Studies tags.\nTask 2: Generate 2 UPSC Mains questions relevant to this release, with a model answer structure.\nHere is the content:\n\n{content[:4000]}'
                        res = model.invoke(prompt)
                        if res:
                            if hasattr(res, 'tags'): tags = res.tags
                            if hasattr(res, 'mains_questions'): mains_questions = [q.dict() for q in res.mains_questions]
                            print(f"  - Generated Tags: {tags}")
                    except Exception as e:
                        print(f"  - Failed to generate tags/mains: {e}")

                    entry = {
                        "prid": prid,
                        "title": item["title"],
                        "url": item["url"],
                        "date": date_str,
                        "content": content,
                        "ai_content": nb_data,
                        "tags": tags,
                        "mains_questions": mains_questions
                    }
                    final_data.append(entry)
                    
                    # Save progress
                    processed_prids.append(prid)
                    with open(PROCESSED_LOG_PATH, 'w') as f:
                        json.dump(processed_prids, f, indent=2)
                    
                    with open(OUTPUT_FILE, 'w') as f:
                        json.dump(final_data, f, indent=2)
                    
                    print(f"  - Successfully processed and saved {prid} to JSON")
                else:
                    print(f"  - Failed to generate content for {prid}")
                
                # Cooldown to avoid rate limits
                await asyncio.sleep(5)

if __name__ == "__main__":
    asyncio.run(main())
