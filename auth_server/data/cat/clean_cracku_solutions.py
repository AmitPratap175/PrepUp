#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
This script orchestrates a multi-step process to generate quiz question data.

Workflow:
1. Asynchronously crawls several quiz websites to fetch raw HTML content in memory.
2. Parses the HTML from each page to extract structured question data (passage, question
   text, options, correct answer).
3. Saves this structured data into intermediate JSON files, categorized by subject
   (e.g., 'quant', 'verbal'). These files are stored in a temporary directory.
4. Invokes a second script (`file_clean_qid.py`) to process these intermediate files,
   standardizing the Question IDs (`qid`) within them.
5. Copies the final, cleaned JSON files to the frontend application's data directory,
   making them available to the UI.

This script is self-contained and uses hardcoded relative paths for all file
operations, requiring no command-line arguments.
"""
import json
import os
import re
import sys
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple
import shutil
import asyncio
import time
from pathlib import Path

# Import the main function from the sibling script to clean question IDs.
from file_clean_qid import main as clean_qid_main

# Import third-party libraries for web crawling and HTML parsing.
from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig, CacheMode

try:
    from bs4 import BeautifulSoup  # type: ignore
except Exception as e:
    sys.stderr.write("ERROR: BeautifulSoup4 is required. Install with: pip install beautifulsoup4\n")
    raise

def get_updated_numbers() -> Tuple[int, int]:
    """
    Manages and updates the daily crawl numbers (dt_num, daily_num).

    Reads a state file ('number_state.json') to get the last updated numbers and date.
    If the script is run on a new weekday, it increments the numbers for each weekday
    that has passed since the last update. It skips updates for Saturdays and Sundays.

    Returns:
        A tuple containing the current (potentially updated) dt_num and daily_num.
    """
    state_file_path = Path(__file__).parent / "number_state.json"
    today = datetime.today()

    # Default state if the file doesn't exist, with the original hardcoded numbers.
    default_state = {
        "last_update_date": "2025-09-23", # A Monday before the first run
        "dt_num": 187,
        "daily_num": 205
    }

    # Read the current state from the JSON file, or use the default.
    if state_file_path.exists():
        with open(state_file_path, "r") as f:
            state = json.load(f)
    else:
        state = default_state

    last_update_date = datetime.strptime(state["last_update_date"], "%Y-%m-%d").date()

    # Check if it's a weekday and if an update is needed.
    if today.weekday() < 5 and today.date() > last_update_date:
        # Calculate how many weekdays have passed since the last update.
        weekdays_passed = 0
        current_date = last_update_date
        while current_date < today.date():
            current_date += timedelta(days=1)
            # Monday is 0, Friday is 4. Saturday is 5, Sunday is 6.
            if current_date.weekday() < 5:
                weekdays_passed += 1

        # If at least one weekday has passed, update the numbers and the state file.
        if weekdays_passed > 0:
            state["dt_num"] += weekdays_passed
            state["daily_num"] += weekdays_passed
            state["last_update_date"] = today.strftime("%Y-%m-%d")

            with open(state_file_path, "w") as f:
                json.dump(state, f, indent=4)
            
            print(f"Updated numbers for {today.date()}: dt_num={state['dt_num']}, daily_num={state['daily_num']}")

    return state["dt_num"], state["daily_num"]

async def test_news_crawl(dt_num: int, daily_num: int) -> Dict[str, List[str]]:
    """
    Crawls a predefined list of URLs to fetch quiz pages.
    """
    user_data_dir = os.path.join(Path.home(), ".crawl4ai", "browser_profile")
    os.makedirs(user_data_dir, exist_ok=True)

    browser_config = BrowserConfig(
        verbose=True,
        headless=False,
        use_persistent_context=True,
        use_managed_browser=True,
        browser_type="chromium",
        user_data_dir=str(Path.home() / "snap/chromium/common/chromium/Default")
    )
    run_config = CrawlerRunConfig(
        scan_full_page=True,
        js_code=[
            "window.scrollTo(0, document.body.scrollHeight);",
        ],
        delay_before_return_html=2.0,
    )
    
    categorized_html: Dict[str, List[str]] = {"quant": [], "verbal": [], "reasoning": []}

    async with AsyncWebCrawler(config=browser_config) as crawler:
        # URLs are now formatted with the dynamically updated numbers.
        urls = [
                f"https://cracku.in/dt-verbal-test-{dt_num}",
                f"https://cracku.in/dt-quant-dailytest-{dt_num}",
                f"https://cracku.in/dt-reasoning-dailytest-{dt_num}",
                # f"https://gmatpoint.com/gmat-daily-target/verbal-daily-test-{daily_num}",
                # f"https://gmatpoint.com/gmat-daily-target/quant-daily-test-{daily_num}"
                ]
        
        for url in urls:
            result = await crawler.arun(url, config=run_config, magic=True)
            if result and result.html:
                script_dir = Path(__file__).parent
                html_dir = script_dir / "html"
                os.makedirs(html_dir, exist_ok=True)

                if "quant" in url:
                    # with open(html_dir/"page.html", "w", encoding="utf-8") as f:
                    #     f.write(result.html)
                    categorized_html["quant"].append(result.html)
                elif "verbal" in url:
                    categorized_html["verbal"].append(result.html)
                elif "reasoning" in url:
                    categorized_html["reasoning"].append(result.html)
    return categorized_html

# Helper functions for parsing HTML content with BeautifulSoup.

def _norm_ws(s: str) -> str:
    """Normalize whitespace, replacing multiple spaces/newlines with a single space."""
    return re.sub(r"\s+", " ", s).strip()


def _collect_paragraph_text_simple(container) -> str:
    """Extracts and concatenates text from all <p> tags within a given element."""
    if container is None: return ""
    ps = [t.get_text(" ", strip=True) for t in container.find_all("p")]
    ps = [_norm_ws(x) for x in ps if _norm_ws(x)]
    if ps: return "\n\n".join(ps)
    return _norm_ws(container.get_text(" ", strip=True))

def _collect_paragraph_text(container) -> str:
    """Extracts and concatenates text from all <p> tags within a given element, converting katex to latex."""
    if container is None: return ""

    soup = BeautifulSoup(str(container), 'html.parser')

    for span in soup.find_all('span', class_='katex'):
        annotation = span.find('annotation', encoding='application/x-tex')
        if annotation:
            span.replace_with(f'${annotation.get_text()}$')
        else:
            span.replace_with(span.get_text())

    for br in soup.find_all('br'):
        br.replace_with('\n')

    # Now extract text
    ps = [p.get_text() for p in soup.find_all("p")]
    if ps:
        text = "\n\n".join(ps)
    else:
        text = soup.get_text()

    # Clean up whitespace
    text = re.sub(r'[ \t]+', ' ', text)
    text = re.sub(r'(\n\s*){2,}', '\n\n', text) # Collapse multiple newlines
    return text.strip()

def _find_passage_and_question_blocks(qroot, qid: str) -> Tuple[Optional[str], Optional[str]]:
    """Heuristically finds the passage and question text within a question's HTML block."""
    passage_text = None
    question_text = None
    en_class = f"en{qid}"
    blocks = qroot.find_all("div", class_=en_class)
    if blocks:
        p_block = blocks[0]
        p_body = p_block.find("div", class_=re.compile(r"\bcard-body\b"))
        passage_text = _collect_paragraph_text_simple(p_body if p_body else p_block)
        q_block = blocks[-1]
        q_text_div = q_block.find("div", class_=re.compile(r"\bquestion-text\b"))
        if q_text_div:
            question_text = _collect_paragraph_text(q_text_div)
        else:
            q_text_div = qroot.find("div", class_=re.compile(r"\bquestion-text\b"))
            if q_text_div:
                question_text = _collect_paragraph_text(q_text_div)
    return passage_text, question_text

def _extract_correct_answer(qroot) -> Tuple[List[Dict], Optional[str]]:
    """Extracts all options and identifies the correct one from the HTML."""
    options = []

    # Handle TITA (Type In The Answer) questions
    tita_btn = qroot.select_one("div.tita-answer-box a.tita-btn")
    if tita_btn and tita_btn.has_attr("data-answer"):
        correct_answer = tita_btn.get("data-answer")
        return [], correct_answer

    options_box = qroot.select_one("div.options-box")
    correct_answer_index = None
    if options_box:
        correct_answer_index = options_box.get("data-answer")

    buttons = qroot.select("div.options-box button.option-button")
    for i, btn in enumerate(buttons, start=1):
        label_tag = btn.select_one(".opt-no span")
        label = label_tag.get_text(strip=True) if label_tag else None
        content_div = btn.select_one(".option-content")
        text = _collect_paragraph_text(content_div) if content_div else None
        if label and text:
            option_val = btn.get('data-option', str(i)) # Use data-option, fallback to enumeration
            is_correct = (option_val == correct_answer_index)
            options.append({"data_option": option_val, "label": label, "option_text": text, "is_correct": is_correct})

    # Fallback for pages with a different structure
    correct_answer_tag = qroot.find("p", id="correct-answer")
    if correct_answer_tag:
        text = correct_answer_tag.get_text(" ", strip=True)
        m = re.search(r"Correct Answer\s*:\s*(.+)", text, flags=re.I)
        if m:
            return options, m.group(1).strip()

    # Determine the correct option text if found via data-answer
    correct_option_data = None
    if correct_answer_index:
        for opt in options:
            if opt.get("is_correct"):
                correct_option_data = opt.get("label")
                break
    
    return options, correct_option_data

def _build_full_markdown(qid: str, passage_text: str, question_text: str, options: List[Dict], correct_option_data: Optional[str]) -> str:
    """Constructs a markdown string for a given question for easy review."""
    lines = [f"### Question (qid: {qid})", "", "**Passage:**", passage_text or "", "", question_text or "", "", "**Options:**"]
    for opt in options:
        mark = " ✅" if opt.get("is_correct") else ""
        lines.append(f"- **{opt.get('label', '')}**. {opt.get('option_text', '')}{mark}")
    lines.extend(["", f"**Correct Answer:** {correct_option_data if correct_option_data is not None else 'null'}"])
    return "\n".join(lines)

def parse_html_to_questions(html: str) -> Dict:
    """Main parsing function to convert a single HTML page into structured question data."""
    soup = BeautifulSoup(html, "html.parser")
    image_url = None
    results: List[Dict] = []
    q_roots = soup.find_all(attrs={"data-qno": True})
    if not q_roots:
        q_roots = [d for d in soup.find_all("div") if d.get("id", "").startswith("q")]
    for qroot in q_roots:
        qid = str(qroot.get("data-qno") or qroot.get("id") or "").strip()
        if qid.lower().startswith("q"):
            digits = re.findall(r"\d+", qid)
            if digits: qid = digits[0]
        if not qid: continue
        passage_text, question_text = _find_passage_and_question_blocks(qroot, qid)
        if not question_text:
            q_text_div = qroot.find("div", class_=re.compile(r"\bquestion-text\b"))
            if q_text_div: question_text = _norm_ws(q_text_div.get_text(" ", strip=True))
        img_tag = qroot.find("img", class_="img-responsive")
        if img_tag and img_tag.has_attr("src"): image_url = img_tag["src"].strip()
        options, correct_option_data = _extract_correct_answer(qroot)
        if question_text is None: continue
        if question_text:
            results.append({"qid": str(qid), "passage_text": passage_text if question_text not in passage_text else "", "question_text": question_text or "", "options": options, "correct_option_data": str(correct_option_data) if correct_option_data is not None else None, "solution_text": None, "image_url": image_url or "", "full_markdown": _build_full_markdown(str(qid), passage_text or "", question_text or "", options, correct_option_data)})
    return {"questions": results}

def main(categorized_html: Dict[str, List[str]]):
    """Main function orchestrating the data processing workflow."""
    strings = {"quant":"quantitative-aptitude", "verbal":"verbal-ability", "reasoning":"data-interpretation"}
    
    script_dir = Path(__file__).parent
    project_root = script_dir.parent.parent.parent
    
    intermediate_dir = script_dir.parent / "temp_json"
    final_destination_dir = project_root / "auth_server/data/cat/docs"
    os.makedirs(intermediate_dir, exist_ok=True)

    for category, subject_alias in strings.items():
        html_docs = categorized_html.get(category, [])
        if not html_docs: continue

        all_questions: List[Dict] = []
        for i, html in enumerate(html_docs):
            try:
                name = f"crawled_{category}_{i}"
                parsed = parse_html_to_questions(html)
                if parsed is None:
                    sys.stderr.write(f"WARNING: No questions parsed from {name}\n")
                    continue
                all_questions.extend(parsed.get("questions", []))
            except Exception as e:
                sys.stderr.write(f"ERROR parsing {name}: {e}\n")

        output_obj = {"questions": all_questions}
        intermediate_path = intermediate_dir / f"{subject_alias}.json"
        final_path_file = final_destination_dir / f"{subject_alias}.json"

        if final_path_file.exists():
            with open(final_path_file, "r", encoding="utf-8") as file:
                data = json.load(file)
            final_data = {"questions": data.get("questions", [])}
            n = len(all_questions)
            for i in range(n):
                final_data["questions"][-n+i]["solution_text"] = all_questions[i].get("question_text")
                final_data["questions"][-n+i]["options"] = all_questions[i].get("options")
                final_data["questions"][-n+i]["correct_option_data"] = all_questions[i].get("correct_option_data")

            # if category == 'quant':
            #     print(all_questions[-1]["correct_option_data"], end="\n\n")
        else:
            final_data = output_obj

        with open(intermediate_path, "w", encoding="utf-8") as f:
            json.dump(final_data, f, ensure_ascii=False, indent=2)

        print(f"Wrote intermediate {len(all_questions)} question(s) to: {intermediate_path}")
    
    print("---" + " Running qid cleaning script ---")
    clean_qid_main()
    print("---" + " Finished qid cleaning script ---")

    os.makedirs(final_destination_dir, exist_ok=True)
    for filename in os.listdir(intermediate_dir):
        if filename.endswith(".json"):
            source_file = intermediate_dir / filename
            destination_file = final_destination_dir / filename
            shutil.copy(source_file, destination_file)
            print(f"Copied cleaned file: {source_file} -> {destination_file}")

    print("Processing complete.")

    try:
        shutil.rmtree(intermediate_dir)
        print(f"Successfully removed temporary directory: {intermediate_dir}")
    except OSError as e:
        print(f"Error removing temporary directory {intermediate_dir}: {e}", file=sys.stderr)

if __name__ == "__main__":
    print("--- Starting daily question processing ---")
    # Step 1: Get the updated daily numbers for crawling.
    dt_num, daily_num = get_updated_numbers()
    
    # Step 2: Crawl the web pages to get HTML content.
    categorized_html = asyncio.run(test_news_crawl(dt_num, daily_num))
    print(f"Crawled {len(categorized_html['quant'])+len(categorized_html['verbal'])+len(categorized_html['reasoning'])} pages successfully.")
    
    # Step 3: Pass the crawled data to the main processing function.
    main(categorized_html)
