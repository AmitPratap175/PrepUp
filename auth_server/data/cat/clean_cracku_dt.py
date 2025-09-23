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
from datetime import datetime
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

async def test_news_crawl() -> Dict[str, List[str]]:
    """
    Crawls a predefined list of URLs to fetch quiz pages.

    It uses a headless browser to render JavaScript and loads the full page content.
    The fetched HTML for each page is stored in memory and returned in a dictionary,
    categorized by the subject found in the URL (quant, verbal, or reasoning).

    Returns:
        A dictionary where keys are subjects ('quant', 'verbal', 'reasoning') and
        values are lists of HTML content strings for each crawled page.
    """
    # Configure the browser for crawling. Using a persistent context can help with
    # sessions and logins if needed in the future.
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
    # Configure the crawler's behavior on each page.
    run_config = CrawlerRunConfig(
        scan_full_page=True, # Ensure the entire page is processed
        js_code=[
            "window.scrollTo(0, document.body.scrollHeight);", # Scroll to load lazy-loaded content
        ],
        delay_before_return_html=2.0, # Wait for JS to execute
    )
    
    # This dictionary will hold the raw HTML, sorted by category.
    categorized_html: Dict[str, List[str]] = {"quant": [], "verbal": [], "reasoning": []}

    async with AsyncWebCrawler(config=browser_config) as crawler:
        # Hardcoded list of URLs to be crawled.
        dt_num = 187
        daily_num = 205
        urls = [
                f"https://cracku.in/dt-verbal-test-{dt_num}",
                f"https://cracku.in/dt-quant-dailytest-{dt_num}",
                f"https://cracku.in/dt-reasoning-dailytest-{dt_num}",
                f"https://gmatpoint.com/gmat-daily-target/verbal-daily-test-{daily_num}",
                f"https://gmatpoint.com/gmat-daily-target/quant-daily-test-{daily_num}"
                ]
        
        # Process each URL.
        for url in urls:
            result = await crawler.arun(url, config=run_config, magic=True)
            if result and result.html:
                # Categorize the HTML based on keywords in the URL.
                if "quant" in url:
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


def _collect_paragraph_text(container) -> str:
    """Extracts and concatenates text from all <p> tags within a given element."""
    if container is None: return ""
    ps = [t.get_text(" ", strip=True) for t in container.find_all("p")]
    ps = [_norm_ws(x) for x in ps if _norm_ws(x)]
    if ps: return "\n\n".join(ps)
    # Fallback to getting all text if no <p> tags are found.
    return _norm_ws(container.get_text(" ", strip=True))


def _find_passage_and_question_blocks(qroot, qid: str) -> Tuple[Optional[str], Optional[str]]:
    """Heuristically finds the passage and question text within a question's HTML block."""
    passage_text = None
    question_text = None
    en_class = f"en{qid}" # The class used to identify question-related blocks.
    blocks = qroot.find_all("div", class_=en_class)
    if blocks:
        # Heuristic: The first block is the passage, the last is the question.
        p_block = blocks[0]
        p_body = p_block.find("div", class_=re.compile(r"\bcard-body\b"))
        passage_text = _collect_paragraph_text(p_body if p_body else p_block)
        
        q_block = blocks[-1]
        q_text_div = q_block.find("div", class_=re.compile(r"\bquestion-text\b"))
        if q_text_div:
            qps = q_text_div.find_all("p")
            if qps:
                question_text = _norm_ws(" ".join(p.get_text(" ", strip=True) for p in qps))
            else:
                question_text = _norm_ws(q_text_div.get_text(" ", strip=True))
        else:
            # Fallback search if the structure is unexpected.
            q_text_div = qroot.find("div", class_=re.compile(r"\bquestion-text\b"))
            if q_text_div:
                question_text = _norm_ws(q_text_div.get_text(" ", strip=True))
    return passage_text, question_text

def _extract_correct_answer(qroot) -> Optional[str]:
    """Extracts all options and identifies the correct one from the HTML."""
    options = []
    buttons = qroot.select("div.options-box button.option-button")
    correct_answer_index = None
    # The correct answer index is stored in the 'data-answer' attribute of the buttons.
    if buttons:
        correct_answer_index = buttons[0].get("data-answer")
    for i, btn in enumerate(buttons, start=1):
        label_tag = btn.select_one(".opt-no span")
        label = label_tag.get_text(strip=True) if label_tag else None
        content_div = btn.select_one(".option-content")
        text = " ".join(p.get_text(strip=True) for p in content_div.find_all("p")) if content_div else None
        if label and text:
            options.append({"data_option": str(i), "label": label, "option_text": text, "is_correct": (str(i) == correct_answer_index)})
    
    # As a fallback, try to find the text of the correct answer if available.
    correct_answer_tag = qroot.find("p", id="correct-answer")
    if correct_answer_tag:
        text = correct_answer_tag.get_text(" ", strip=True)
        m = re.search(r"Correct Answer\s*:\s*(.+)", text, flags=re.I)
        if m:
            return options, m.group(1).strip()
    return options, None

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
    # Find all question container elements.
    q_roots = soup.find_all(attrs={"data-qno": True})
    if not q_roots:
        q_roots = [d for d in soup.find_all("div") if d.get("id", "").startswith("q")]
    
    for qroot in q_roots:
        # Extract all relevant data points for a single question.
        qid = str(qroot.get("data-qno") or qroot.get("id") or "").strip()
        if qid.lower().startswith("q"): # Clean the qid if it's like 'q6'
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
        
        # Assemble the final question object.
        if question_text:
            results.append({"qid": str(qid), "passage_text": passage_text if question_text not in passage_text else "", "question_text": question_text or "", "options": options, "correct_option_data": str(correct_option_data) if correct_option_data is not None else None, "solution_text": None, "image_url": image_url or "", "full_markdown": _build_full_markdown(str(qid), passage_text or "", question_text or "", options, correct_option_data)})
    return {"questions": results}

def main(categorized_html: Dict[str, List[str]]):
    """Main function orchestrating the data processing workflow."""
    strings = {"quant":"quantitative-aptitude", "verbal":"verbal-ability", "reasoning":"data-interpretation"}
    
    # --- Path Definitions ---
    # Define paths relative to this script's location for portability.
    script_dir = Path(__file__).parent
    project_root = script_dir.parent.parent.parent
    
    # Directory for storing intermediate JSON files before they are cleaned.
    intermediate_dir = script_dir.parent / "temp_json"
    # Final destination for the cleaned JSON files for the frontend.
    final_destination_dir = project_root / "auth_server/data/cat"
    os.makedirs(intermediate_dir, exist_ok=True)

    # --- Step 1: Parse HTML and Save Intermediate JSON ---
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

        # Append new questions to existing intermediate file if it exists.
        if final_path_file.exists():
            with open(final_path_file, "r", encoding="utf-8") as file:
                data = json.load(file)
            final_data = {"questions": data.get("questions", []) + output_obj.get("questions")}
        else:
            final_data = output_obj

        with open(intermediate_path, "w", encoding="utf-8") as f:
            json.dump(final_data, f, ensure_ascii=False, indent=2)

        print(f"Wrote intermediate {len(all_questions)} question(s) to: {intermediate_path}")
    
    # --- Step 2: Clean the QIDs in the Intermediate Files ---
    print("---" + " Running qid cleaning script ---")
    clean_qid_main() # This function reads from and writes to the intermediate_dir.
    print("---" + " Finished qid cleaning script ---")

    # --- Step 3: Copy Cleaned Files to Final Destination ---
    os.makedirs(final_destination_dir, exist_ok=True)
    for filename in os.listdir(intermediate_dir):
        if filename.endswith(".json"):
            source_file = intermediate_dir / filename
            destination_file = final_destination_dir / filename
            shutil.copy(source_file, destination_file)
            print(f"Copied cleaned file: {source_file} -> {destination_file}")

    print("Processing complete.")

    # --- Step 4: Clean up the intermediate directory ---
    try:
        shutil.rmtree(intermediate_dir)
        print(f"Successfully removed temporary directory: {intermediate_dir}")
    except OSError as e:
        print(f"Error removing temporary directory {intermediate_dir}: {e}", file=sys.stderr)

if __name__ == "__main__":
    # This block is the entry point when the script is executed directly.
    
    # Step 1: Crawl the web pages to get HTML content.
    categorized_html = asyncio.run(test_news_crawl())
    print(f"Crawled {len(categorized_html['quant'])+len(categorized_html['verbal'])+len(categorized_html['reasoning'])} pages successfully.")
    
    # Step 2: Pass the crawled data to the main processing function.
    main(categorized_html)