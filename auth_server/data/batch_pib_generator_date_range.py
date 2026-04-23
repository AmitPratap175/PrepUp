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
DATA_OUT_DIR  = Path(__file__).resolve().parent
OUTPUT_FILE   = DATA_OUT_DIR / "pib_combined_data.json"
STATE_FILE    = DATA_OUT_DIR / "scrape_state.json"
STORAGE_PATH  = "/home/dspratap/.notebooklm/storage_state.json"

PIB_ALL_REL   = "https://www.pib.gov.in/allRel.aspx?reg=3&lang=1"

# --- Run Configuration ---
START_DATE          = datetime(2026, 4, 18)
END_DATE            = datetime(2026, 4, 24)
LIMIT_PER_DAY       = 100
SLEEP_BETWEEN_ITEMS = 10
SLEEP_BETWEEN_DATES = 5
HEADLESS            = False

MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
]

PIB_NB_PROMPT = """
Act as a strict UPSC paper setter and expert educator.
Analyze the following PIB release and create study material for UPSC aspirants.

Tasks:
1. Provide a comprehensive, detailed summary of the release. It should cover all key facts, schemes, data points, and policy decisions mentioned. Organize with clear markdown headings and bullet points.
2. Generate 5 high-quality Prelims MCQs in the UPSC style (including statement-based questions). Provide detailed explanations.
3. Generate 2 UPSC Mains questions (General Studies) relevant to this release, with a model answer structure.

Output Rules:
- Cover the entire document.
- Provide a separate Answer Key at the end. Use markdown.
"""

# --- State Management ---

def load_state() -> dict:
    if STATE_FILE.exists():
        try:
            with open(STATE_FILE, "r") as f:
                return json.load(f)
        except Exception as e:
            print(f"[State] Warning: could not read state file ({e}). Starting fresh.")
    return {"completed_dates": [], "in_progress": {}}

def save_state(state: dict):
    with open(STATE_FILE, "w") as f:
        json.dump(state, f, indent=2)

def register_date_prids(state: dict, date_str: str, all_prids: list[str]):
    if date_str not in state["in_progress"]:
        state["in_progress"][date_str] = {"all_prids": all_prids, "processed_prids": []}
    else:
        existing = set(state["in_progress"][date_str]["all_prids"])
        for p in all_prids:
            if p not in existing:
                state["in_progress"][date_str]["all_prids"].append(p)
    save_state(state)

def mark_prid_done(state: dict, date_str: str, prid: str):
    entry = state["in_progress"].setdefault(date_str, {"all_prids": [], "processed_prids": []})
    if prid not in entry["processed_prids"]:
        entry["processed_prids"].append(prid)
    save_state(state)

def get_pending_prids(state: dict, date_str: str) -> list[str]:
    entry = state["in_progress"].get(date_str, {})
    done = set(entry.get("processed_prids", []))
    return [p for p in entry.get("all_prids", []) if p not in done]

def check_and_finalise_date(state: dict, date_str: str):
    entry = state["in_progress"].get(date_str)
    if not entry:
        return
    if set(entry["all_prids"]) and set(entry["all_prids"]) == set(entry["processed_prids"]):
        state["completed_dates"].append(date_str)
        del state["in_progress"][date_str]
        save_state(state)
        print(f"[State] Date {date_str} fully completed.")

# --- Scraper Logic ---

def fetch_release_content(url):
    try:
        headers = {'User-Agent': 'Mozilla/5.0'}
        resp = requests.get(url, headers=headers, timeout=30)
        resp.raise_for_status()
        soup = BeautifulSoup(resp.content, "html.parser")
        div = (
            soup.select_one(".ReleaseText")
            or soup.select_one("div.innner-page-main-about-us-content-right-part")
        )
        return (div or soup).get_text(separator="\n\n", strip=True)
    except Exception as e:
        print(f"[Scraper] ERROR fetching content: {e}")
        return None

# --- NotebookLM Logic ---

async def generate_via_notebooklm(nb_client, title, content):
    print(f"  [NbLM] Generating for: {title[:70]}...")
    nb = None
    temp_txt = temp_json = None
    try:
        temp_txt = DATA_OUT_DIR / f"_tmp_pib_{datetime.now().timestamp()}.txt"
        temp_txt.write_text(content, encoding="utf-8")

        nb = await nb_client.notebooks.create(f"PIB Study: {title[:50]}")
        await nb_client.sources.add_file(nb.id, temp_txt, wait=True, wait_timeout=600.0)

        status = await nb_client.artifacts.generate_quiz(
            nb.id,
            instructions=PIB_NB_PROMPT,
            quantity=QuizQuantity.STANDARD,
            difficulty=QuizDifficulty.HARD
        )
        await nb_client.artifacts.wait_for_completion(nb.id, status.task_id)

        temp_json = DATA_OUT_DIR / f"_tmp_nb_{datetime.now().timestamp()}.json"
        await nb_client.artifacts.download_quiz(nb.id, str(temp_json), output_format="json")

        if temp_json.exists():
            return json.loads(temp_json.read_text())
        return None
    except Exception as e:
        print(f"  [NbLM] FAILED: {e}")
        return None
    finally:
        for tmp in (temp_txt, temp_json):
            if tmp and tmp.exists():
                try: tmp.unlink()
                except: pass
        if nb:
            try: await nb_client.notebooks.delete(nb.id)
            except: pass

# --- Main Logic ---

async def main():
    state = load_state()
    all_data = []
    if OUTPUT_FILE.exists():
        try:
            with open(OUTPUT_FILE, "r") as f:
                all_data = json.load(f)
        except: pass

    num_days = (END_DATE - START_DATE).days + 1
    dates = [START_DATE + timedelta(days=i) for i in range(num_days)]

    browser_config = BrowserConfig(
        headless=HEADLESS,
        verbose=True,
        use_managed_browser=True,
        browser_type="chromium",
        extra_args=["--disable-blink-features=AutomationControlled"],
        user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    )

    async with AsyncWebCrawler(config=browser_config) as crawler:
        async with await NotebookLMClient.from_storage(STORAGE_PATH) as nb_client:
            for date in dates:
                date_str = date.strftime("%Y-%m-%d")
                if date_str in state["completed_dates"]:
                    print(f"\n[Main] Skipping {date_str} (Already completed)")
                    continue

                day_str = str(date.day)
                month_str = MONTH_NAMES[date.month - 1]
                year_str = str(date.year)

                print(f"\n[Main] Processing date: {date_str}")

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

                # Step 1: Select Year
                print(f"  [Main] Step 1: Selecting Year {year_str}")
                await select_and_step("ContentPlaceHolder1_ddlYear", year_str)
                
                # Step 2: Select Month
                print(f"  [Main] Step 2: Selecting Month {month_str}")
                await select_and_step("ContentPlaceHolder1_ddlMonth", month_str)
                
                # Step 3: Select Day & Get Final Page
                print(f"  [Main] Step 3: Selecting Day {day_str}")
                result = await select_and_step("ContentPlaceHolder1_ddlday", day_str, wait_time=5.0)

                if not result.success:
                    print(f"  [Main] Failed to crawl {date_str}: {result.error_message}")
                    continue

                if result.screenshot:
                    ss_path = DATA_OUT_DIR / f"ss_{date_str}.png"
                    with open(ss_path, "wb") as f:
                        import base64
                        f.write(base64.b64decode(result.screenshot))

                if "Access Denied" in result.html:
                    print(f"  [Main] Access Denied on {date_str}. Dumping HTML to _pib_error.html")
                    Path("_pib_error.html").write_text(result.html, encoding="utf-8")
                    continue

                soup = BeautifulSoup(result.html, "html.parser")
                links = soup.select('a[href*="PressReleasePage.aspx"]')
                print(f"  [Main] Found {len(links)} release links for {date_str}")

                unique_links = []
                seen_prids = set()
                for link in links:
                    href = link.get("href", "")
                    full_url = urljoin(PIB_ALL_REL, href)
                    prid = parse_qs(urlparse(full_url).query).get("PRID", [None])[0]
                    if prid and prid not in seen_prids:
                        seen_prids.add(prid)
                        unique_links.append({"prid": prid, "url": full_url, "title": link.get_text(strip=True)})
                
                all_prids_today = [l["prid"] for l in unique_links]
                register_date_prids(state, date_str, all_prids_today)

                link_map = {l["prid"]: l for l in unique_links}
                pending = get_pending_prids(state, date_str)

                for prid in pending:
                    item = link_map.get(prid)
                    if not item: continue

                    content = fetch_release_content(item["url"])
                    if not content:
                        print(f"    [Main] Failed content fetch for {prid}")
                        continue

                    nb_data = await generate_via_notebooklm(nb_client, item["title"], content)
                    if nb_data:
                        all_data.append({
                            "prid": prid,
                            "title": item["title"],
                            "url": item["url"],
                            "date": date_str,
                            "ai_content": nb_data
                        })
                        with open(OUTPUT_FILE, "w") as f:
                            json.dump(all_data, f, indent=2, ensure_ascii=False)
                        mark_prid_done(state, date_str, prid)
                        print(f"    [Main] ✓ PRID {prid} saved.")
                    
                    await asyncio.sleep(SLEEP_BETWEEN_ITEMS)
                
                check_and_finalise_date(state, date_str)
                await asyncio.sleep(SLEEP_BETWEEN_DATES)

if __name__ == "__main__":
    asyncio.run(main())