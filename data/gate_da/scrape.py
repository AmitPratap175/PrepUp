#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Convert Cracku-style quiz HTML into the strict JSON template required.

Usage examples:
1) Read a saved HTML file and write JSON:
   python convert_html_to_json.py /path/to/page.html -o output.json

2) Read all .html files under 'crawled_html_new' and write a single merged JSON:
   python convert_html_to_json.py -i crawled_html_new -o extracted_questions.json

3) Pipe HTML from stdin:
   cat page.html | python convert_html_to_json.py -o output.json

Notes:
- This script does NOT change or perform any crawling. It only parses/cleans the HTML string.
- It strictly follows the JSON field names/structure from your template.
- If a correct option cannot be identified from the HTML, all options are marked is_correct=false
  and "correct_option_data" is set to null.
"""
import argparse
import json
import os
import re
import sys
from datetime import datetime
from typing import List, Dict, Optional, Tuple
from file_clean_qid import main as clean_qid_main
import shutil
try:
    from bs4 import BeautifulSoup  # type: ignore
except Exception as e:
    sys.stderr.write("ERROR: BeautifulSoup4 is required. Install with: pip install beautifulsoup4\n")
    raise

import os, sys
from pathlib import Path
import asyncio, time
from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig, CacheMode

SCRIPT_DIR = os.path.dirname(os.path.realpath(__file__))

async def test_news_crawl():
    # Create a persistent user data directory
    user_data_dir = os.path.join(SCRIPT_DIR, ".crawl4ai", "browser_profile")
    os.makedirs(user_data_dir, exist_ok=True)

    browser_config = BrowserConfig(
        verbose=True,
        headless=False,
        # user_data_dir=user_data_dir,
        use_persistent_context=True,
        use_managed_browser=True,
        browser_type="chromium",
        user_data_dir=os.path.join(SCRIPT_DIR, "chromium_profile")  # update with your actual path
    )
    run_config = CrawlerRunConfig(
        # cache_mode=CacheMode.BYPASS,
        scan_full_page=True,
        # js_only=True,  # continue interacting with the SAME open tab
        # Scroll further to trigger lazy loading
        js_code=[
            "window.scrollTo(0, document.body.scrollHeight);",
        ],
        delay_before_return_html=2.0,  # Give more time for content to load
    )
    
    async with AsyncWebCrawler(config=browser_config) as crawler:
        # url = "https://www.geeksforgeeks.org/quizzes/gate-da-2025"
        urls = ["https://www.geeksforgeeks.org/quizzes/gate-da-2025/",
                "https://www.geeksforgeeks.org/quizzes/gate-da-2024"]
        # urls = ["https://seek.nptel.ac.in/courses/ns_gate_cs?tab=courses&type=assignment&id=355&unitId=349"]
        # with open("urls_cracku_sectionals.txt", "r") as f:
        #     urls = [line.strip() for line in f if line.strip()]
        # urls = [
        #         "https://cracku.in/dt-verbal-test-169",
        #         "https://cracku.in/dt-quant-dailytest-169",
        #         "https://cracku.in/dt-reasoning-dailytest-169",
        #         "https://gmatpoint.com/gmat-daily-target/verbal-daily-test-187",
        #         "https://gmatpoint.com/gmat-daily-target/quant-daily-test-187"
        #         ]
        for url in urls:
        
            result = await crawler.arun(
                url,
                config=run_config,
                magic=False,
            )
            
            # print(f"Successfully crawled {url}")
            # print(f"Content length: {result.html}")

            output_dir = SCRIPT_DIR #+ url.split("/")[-1].split("-")[0]
            print(f"Saving to directory: {output_dir}")
            # input()
            os.makedirs(output_dir , exist_ok=True)

            filename = "".join([c if c.isalnum() else "_" for c in url]) + ".md"
            filename_html = "".join([c if c.isalnum() else "_" for c in url]) + ".html"
            filepath = os.path.join(output_dir, filename)
            filepath_html = os.path.join(output_dir, filename_html)

            with open(filepath, "w", encoding="utf-8") as f:
                f.write(result.markdown) # Write HTML content
            
            with open(filepath_html, "w", encoding="utf-8") as f:
                f.write(result.html) # Write HTML content

            # print(f"Successfully crawled {url} and saved to {filepath}")
            # print(f"Content length: {result.markdown}")

ABC = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"


def _norm_ws(s: str) -> str:
    """Normalize whitespace inside a single paragraph."""
    return re.sub(r"\s+", " ", s).strip()


def _collect_paragraph_text(container) -> str:
    """
    Collect text from <p> tags (preferring them), falling back to all text,
    and return as paragraphs separated by a blank line.
    """
    if container is None:
        return ""

    # Prefer <p> tags if they exist
    ps = [t.get_text(" ", strip=True) for t in container.find_all("p")]
    ps = [_norm_ws(x) for x in ps if _norm_ws(x)]
    if ps:
        return "\n\n".join(ps)

    # Fallback: any text
    txt = container.get_text(" ", strip=True)
    return _norm_ws(txt)


def _find_passage_and_question_blocks(qroot, qid: str) -> Tuple[Optional[str], Optional[str]]:
    """
    The Cracku page often has two .en{qid} sections within the question root:
    - the first contains the passage (inside a .card .card-body)
    - the second contains the question text (.question-text)
    """
    passage_text = None
    question_text = None

    # All blocks with class "en{qid}" within the question root
    en_class = f"en{qid}"
    blocks = qroot.find_all("div", class_=en_class)

    # Heuristic: first such block → passage (prefer .card-body), second block → question
    if blocks:
        # Passage: first block
        p_block = blocks[0]
        # Prefer .card-body if present
        p_body = p_block.find("div", class_=re.compile(r"\bcard-body\b"))
        passage_text = _collect_paragraph_text(p_body if p_body else p_block)

        # Question: try to use the last block (many pages repeat en{qid})
        q_block = blocks[-1]
        q_text_div = q_block.find("div", class_=re.compile(r"\bquestion-text\b"))
        if q_text_div:
            # Prefer direct <p> under question-text
            qps = q_text_div.find_all("p")
            if qps:
                question_text = _norm_ws(" ".join(p.get_text(" ", strip=True) for p in qps))
            else:
                question_text = _norm_ws(q_text_div.get_text(" ", strip=True))
        else:
            # Fallback: search for question text anywhere in qroot
            q_text_div = qroot.find("div", class_=re.compile(r"\bquestion-text\b"))
            if q_text_div:
                question_text = _norm_ws(q_text_div.get_text(" ", strip=True))

    return passage_text, question_text

def _extract_correct_answer(qroot) -> Optional[str]:
    """
    Extract the correct answer text from the 'Correct Answer' element if present.
    Example:
    <p id="correct-answer" class="hidden"><b> Correct Answer:</b> 6</p>
    Returns '6' or None if not found.
    """
    options = []
    buttons = qroot.select("div.options-box button.option-button")

    # Get the correct answer from data-answer attribute (same for all buttons)
    correct_answer_index = None
    if buttons:
        correct_answer_index = buttons[0].get("data-answer")

    for i, btn in enumerate(buttons, start=1):
        # Extract label (A, B, C...)
        label_tag = btn.select_one(".opt-no span")
        label = label_tag.get_text(strip=True) if label_tag else None

        # Extract text inside option-content
        content_div = btn.select_one(".option-content")
        text = " ".join(p.get_text(strip=True) for p in content_div.find_all("p")) if content_div else None

        if label and text:
            options.append({
                "data_option": str(i),
                "label": label,
                "option_text": text,
                "is_correct": (str(i) == correct_answer_index)
            })
    # print(f"Extracted options: {options}")
    correct_answer_tag = qroot.find("p", id="correct-answer")
    if correct_answer_tag:
        text = correct_answer_tag.get_text(" ", strip=True)
        # Remove label part and return only the number or text after colon
        m = re.search(r"Correct Answer\s*:\s*(.+)", text, flags=re.I)
        if m:
            # print(f"Extracted correct answer text: {m.group(1).strip()}")
            return options, m.group(1).strip()
    return options, None

def _extract_data_answer(qroot) -> Optional[str]:
    """
    Extract the 'data-answer' attribute from any option button inside the question root.
    All option buttons in Cracku pages typically share the same data-answer value.
    Returns the value as a string or None if not found.
    """
    option_button = qroot.find("button", attrs={"data-answer": True})
    if option_button:
        # print(f"Extracted data-answer attribute: {option_button.get('data-answer').strip()}")
        return option_button.get("data-answer").strip()
    return None


def _build_full_markdown(qid: str, passage_text: str, question_text: str,
                         options: List[Dict], correct_option_data: Optional[str]) -> str:
    lines = []
    lines.append(f"### Question (qid: {qid})")
    lines.append("")
    lines.append("**Passage:**")
    lines.append(passage_text or "")
    lines.append("")
    lines.append(question_text or "")
    lines.append("")
    lines.append("**Options:**")
    for opt in options:
        mark = " ✅" if opt.get("is_correct") else ""
        lines.append(f"- **{opt.get('label', '')}**. {opt.get('option_text', '')}{mark}")
    lines.append("")
    lines.append(f"**Correct Answer:** {correct_option_data if correct_option_data is not None else 'null'}")
    return "\n".join(lines)


def parse_html_to_questions(html: str) -> Dict:
    """
    Parse a Cracku-like page HTML and return the strict JSON structure.
    {
      "questions": [ {qid, passage_text, question_text, options: [...], correct_option_data, solution_text, full_markdown}, ... ]
    }
    """
    soup = BeautifulSoup(html, "html.parser")
    image_url = None

    results: List[Dict] = []

    # Each question root typically has a container with attribute data-qno
    q_roots = soup.find_all(attrs={"data-qno": True})
    # Fallback in case attribute differs: look for ids like "q6" with a numeric child class
    if not q_roots:
        q_roots = [d for d in soup.find_all("div") if d.get("id", "").startswith("q")]

    # print(q_roots)
    for qroot in q_roots:
        # print(f"Processing question root: {str(qroot)}")
        qid = str(qroot.get("data-qno") or qroot.get("id") or "").strip()
        # Try to extract only digits from something like 'q6'
        if qid.lower().startswith("q"):
            digits = re.findall(r"\d+", qid)
            if digits:
                qid = digits[0]

        if not qid:
            # Skip if we cannot determine an id
            continue

        passage_text, question_text = _find_passage_and_question_blocks(qroot, qid)
        

        # If either passage or question is missing, try additional fallbacks
        if not question_text:
            q_text_div = qroot.find("div", class_=re.compile(r"\bquestion-text\b"))
            if q_text_div:
                question_text = _norm_ws(q_text_div.get_text(" ", strip=True))

        # if not passage_text:
        #     # Try the first card-body inside this root as passage
        #     p_body = qroot.find("div", class_=re.compile(r"\bcard-body\b"))
        #     passage_text = _collect_paragraph_text(p_body if p_body else qroot)
        
        # print(f"passage_text: {passage_text} |\n\n question_text: {question_text}")

        # _extract_data_answer(qroot)

        img_tag = qroot.find("img", class_="img-responsive")
        if img_tag and img_tag.has_attr("src"):
            image_url = img_tag["src"].strip()
        # return None

        options, correct_option_data = _extract_correct_answer(qroot)
        # options, correct_option_data = _extract_options(qroot, qid)

        if question_text is None:
            continue
        # Normalize types/fields strictly to the required schema
        if question_text:
            question_obj = {
                "qid": str(qid),
                "passage_text": passage_text if question_text not in passage_text else "",
                "question_text": question_text or "",
                "options": options,
                "correct_option_data": str(correct_option_data) if correct_option_data is not None else None,
                "solution_text": None,
                "image_url": image_url or "",
                "full_markdown": _build_full_markdown(str(qid), passage_text or "", question_text or "", options, correct_option_data)
            }
            results.append(question_obj)

    return {"questions": results}


def _read_input_sources(string: str) -> List[Tuple[str, str]]:
    """
    Return list of (source_name, html_string) pairs.
    If stdin has data, that's used as one source named "<stdin>".
    If files are provided via args.inputs, read each file.
    If a directory is provided, read all *.html files within it.
    """
    sources: List[Tuple[str, str]] = []

    # If no inputs and no stdin, try default directory crawled_html_new
    crawled_dir = SCRIPT_DIR
    if not sources and os.path.isdir(crawled_dir):
        for fn in os.listdir(crawled_dir):
            if fn.lower().endswith((".html", ".htm")):
                full = os.path.join(crawled_dir, fn)
                if string in full:
                    try:
                        with open(full, "r", encoding="utf-8") as f:
                            sources.append((full, f.read()))
                    except Exception as e:
                        sys.stderr.write(f"WARNING: Failed to read {full}: {e}\n")

    if not sources:
        sys.stderr.write("No HTML input provided. Provide file(s), a directory, or pipe HTML via stdin.\n")

    return sources


def main():
    parser = argparse.ArgumentParser(description="Convert Cracku-style quiz HTML to strict JSON template.")
    parser.add_argument("--inputs", nargs="*", default=[],
                        help="HTML file(s) or directory containing HTML files. If omitted, tries 'crawled_html_new'.")
    
    parser.add_argument("--indent", type=int, default=2, help="JSON indent (default: 2).")

    args = parser.parse_args()

    strings = {"quant":"quant", "verbal":"varc", "reasoning":"dilr"}
    data_dir = os.path.join(SCRIPT_DIR, "data")
    os.makedirs(data_dir, exist_ok=True)

    for string in ["quant", "verbal", "reasoning"]:
        sources = _read_input_sources(string)
        # print(sources)
        crawled_dir = SCRIPT_DIR
        output = os.path.join(crawled_dir, f"final_{strings[string]}.json")
        # if not sources:
        #     sys.exit(1)

        all_questions: List[Dict] = []
        for name, html in sources:
            try:
                # print(f"Processing source: {name}")
                parsed = parse_html_to_questions(html)
                if parsed is None:
                    sys.stderr.write(f"WARNING: No questions parsed from {name}\n")
                    continue
                all_questions.extend(parsed.get("questions", []))
            except Exception as e:
                sys.stderr.write(f"ERROR parsing {name}: {e}\n")

        output_obj = {"questions": all_questions}

        # Decide output path
        out_path = output
        if not out_path:
            ts = datetime.now().strftime("%Y%m%d_%H%M%S")
            out_path = f"extracted_questions_{ts}.json"

        # File path
        file_path = os.path.join(data_dir, f"final_{strings[string]}.json")
        print(f"Reading from: {file_path}")

        # # Read JSON file
        if os.path.exists(file_path):
            with open(file_path, "r", encoding="utf-8") as file:
                data = json.load(file)
        else:
            data = {"questions": []}

        # Print the data
        final_data = {"questions": data.get("questions", []) + output_obj.get("questions", [])}

        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(final_data, f, ensure_ascii=False, indent=2)

        # Write JSON
        # with open(out_path, "w", encoding="utf-8") as f:
        #     json.dump(output_obj, f, ensure_ascii=False, indent=args.indent)

        print(f"Wrote {len(all_questions)} question(s) to: {out_path}")
    
    clean_qid_main()

    # # Source and destination directories
    # source_dir = os.path.join(SCRIPT_DIR, "crawled_html_new", "dt")
    # destination_dir = os.path.join(SCRIPT_DIR, "data")

    # # Create destination directory if it doesn't exist
    # os.makedirs(destination_dir, exist_ok=True)

    # # Iterate through files in the source directory
    # for filename in os.listdir(source_dir):
    #     if filename.endswith(".json"):  # Check if the file is a .json file
    #         source_file = os.path.join(source_dir, filename)
    #         destination_file = os.path.join(destination_dir, filename)
            
    #         # Copy the file
    #         shutil.copy(source_file, destination_file)
    #         print(f"Copied: {source_file} -> {destination_file}")

    # print("All JSON files have been copied successfully.")

    # print(f"Files in {output_dir}: {files.endswith('.html') or files.endswith('.md')}")
    # used_dir = os.path.join(source_dir, "used")
    # gmat_dir = os.path.join(source_dir, "gmat")
    # os.makedirs(used_dir, exist_ok=True)
    # os.makedirs(gmat_dir, exist_ok=True)
    # for filename in os.listdir(source_dir):
    #     if filename.endswith(".html") or filename.endswith(".md"):
    #         source_file = os.path.join(source_dir, filename)
    #         destination_file = None
    #         if "cracku" in filename:
    #             destination_file = os.path.join(used_dir, filename)
    #         elif "gmatpoint" in filename:
    #             destination_file = os.path.join(gmat_dir, filename)
            
    #         if destination_file:
    #             shutil.move(source_file, destination_file)
    #             print(f"Moved: {source_file} -> {destination_file}")

if __name__ == "__main__":
    asyncio.run(test_news_crawl())
    print("Crawl completed successfully, now cleaning HTML to JSON...")
    main()
