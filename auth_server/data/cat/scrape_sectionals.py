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
from typing import List, Dict, Optional, Tuple, Any
import shutil
import asyncio
import time
from pathlib import Path
# Import the main function from the sibling script to clean question IDs.
from file_clean_qid import main as clean_qid_main

# --- QID Cleaning Logic ---
def get_questions_container(data: Any) -> List[Dict[str, Any]]:
    if isinstance(data, dict) and isinstance(data.get("questions"), list):
        return data["questions"]
    if isinstance(data, list):
        return data
    raise ValueError('Input JSON must be either a dict with a "questions" list or a top-level list of questions.')

def clean_qids_in_output_files(json_folder: Path, type_curr: str) -> None:
    """
    Finds all JSON files in the output directory, reads each one, replaces the 'qid'
    values, and then overwrites the original file with the updated data.
    """
    if not json_folder.is_dir():
        print(f"Info: Output directory not found at {json_folder}. Nothing to clean.")
        return
        
    json_files = list(json_folder.glob("*.json"))
    print(f"--- Found {len(json_files)} JSON files to clean in {json_folder} ---")

    for file_path in json_files:
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
        except (json.JSONDecodeError, IOError) as e:
            print(f"Error reading {file_path}: {e}", file=sys.stderr)
            continue

        if type_curr == "quants":
            name = 'quant'
        elif type_curr == "dilr":
            name = 'dilr'
        else: # varc
            name = 'varc'

        try:
            questions = get_questions_container(data)
        except ValueError as e:
            print(f"Error processing {file_path}: {e}", file=sys.stderr)
            continue

        counter = 0
        for item in questions:
            if isinstance(item, dict):
                counter += 1
                item["qid"] = f"{name}-{file_path.stem}-{counter}"

        try:
            with open(file_path, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
        except IOError as e:
            print(f"Error writing to {file_path}: {e}", file=sys.stderr)

        print(f"Processed {counter} qids in {file_path.name}")

# Import third-party libraries for web crawling and HTML parsing.
from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig, CacheMode

try:
    from bs4 import BeautifulSoup  # type: ignore
except Exception as e:
    sys.stderr.write("ERROR: BeautifulSoup4 is required. Install with: pip install beautifulsoup4\n")
    raise

async def test_news_crawl(urls) -> Dict[str, List[str]]:
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
            "Array.from(document.querySelectorAll('a')).find(a => a.textContent.includes('Switch to old version'))?.click()",
            "window.scrollTo(0, document.body.scrollHeight);",
            "Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Show Correct Answer'))?.click()",
        ],
        delay_before_return_html=2.0,
    )
    
    categorized_html: Dict[str, List[str]] = {"quant": [], "verbal": [], "reasoning": []}

    script_dir = Path(__file__).parent
    html_dir = script_dir / "html"
    os.makedirs(html_dir, exist_ok=True)

    async with AsyncWebCrawler(config=browser_config) as crawler:
        # URLs are now formatted with the dynamically updated numbers.
        # urls = [
        #         f"https://cracku.in/cat/quant-sectional-tests/quant-free-sectional-test/result"
        #         ]
        
        for i, url in enumerate(urls):
            result = await crawler.arun(url, config=run_config, magic=True)
            if i == 0:
                continue
            if result and result.html:
                # Sanitize URL to create a valid filename
                # filename = re.sub(r'https?://', '', url)
                filename = url.split("/")[-2] + url.split("=")[-1] + ".html"
                filepath = html_dir / filename
                # with open(filepath, "w", encoding="utf-8") as f:
                #     f.write(result.html)
                # print(f"Saved HTML to {filepath}")

                if "quant" in url:
                    categorized_html["quant"].append(result.html)
                elif "verbal" in url:
                    categorized_html["verbal"].append(result.html)
                elif "reasoning" in url or "lrdi" in url:
                    categorized_html["reasoning"].append(result.html)
    return categorized_html

# Helper functions for parsing HTML content with BeautifulSoup.

def _norm_ws(s: str) -> str:
    """Normalize whitespace, replacing multiple spaces/newlines with a single space."""
    return re.sub(r"\s+", " ", s).strip()


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
            q_text_div = qroot.find("div", class_=re.compile(r"\bquestion-text\b"))
            if q_text_div:
                question_text = _norm_ws(q_text_div.get_text(" ", strip=True))
    return passage_text, question_text

def _extract_correct_answer(qroot) -> Optional[str]:
    """Extracts all options and identifies the correct one from the HTML."""
    options = []
    buttons = qroot.select("div.options-box button.option-button")
    correct_answer_index = None
    if buttons:
        correct_answer_index = buttons[0].get("data-answer")
    for i, btn in enumerate(buttons, start=1):
        label_tag = btn.select_one(".opt-no span")
        label = label_tag.get_text(strip=True) if label_tag else None
        content_div = btn.select_one(".option-content")
        text = _collect_paragraph_text(content_div) if content_div else None
        if label and text:
            options.append({"data_option": str(i), "label": label, "option_text": text, "is_correct": (str(i) == correct_answer_index)})
    correct_answer_tag = qroot.find("p", id="correct-answer")
    if correct_answer_tag:
        text = correct_answer_tag.get_text(" ", strip=True)
        m = re.search(r"Correct Answer\s*:\s*(.+)", text, flags=re.I)
        if m:
            return options, m.group(1).strip()
    return options, None

def _extract_solution_text(qroot) -> Optional[str]:
    # First try inside qroot
    solution_div = qroot.find("div", id="solution-content")
    # If not found, look in the whole page (covers your case)
    if not solution_div:
        solution_div = qroot.find_parent().find("div", id="solution-content")
        if not solution_div:
            solution_div = qroot.find_next("div", id="solution-content")

    if not solution_div:
        return None

    sol_soup = BeautifulSoup(str(solution_div), 'html.parser')

    # Convert katex spans to LaTeX inline math
    for span in sol_soup.find_all('span', class_='katex'):
        annotation = span.find('annotation', encoding='application/x-tex')
        if annotation:
            span.replace_with(f'${annotation.get_text()}$')
        else:
            span.replace_with(span.get_text())

    for br in sol_soup.find_all('br'):
        br.replace_with('\n')

    text = sol_soup.get_text().strip()
    text = re.sub(r'[ \t]+', ' ', text)
    text = re.sub(r'\n[ \n\t]*', '\n', text)
    return text

def _build_full_markdown(qid: str, passage_text: str, question_text: str, options: List[Dict], correct_option_data: Optional[str], solution_text: Optional[str]) -> str:
    """Constructs a markdown string for a given question for easy review."""
    lines = [f"### Question (qid: {qid})", "", "**Passage:**", passage_text or "", "", question_text or "", "", "**Options:**"]
    for opt in options:
        mark = " ✅" if opt.get("is_correct") else ""
        lines.append(f"- **{opt.get('label', '')}**. {opt.get('option_text', '')}{mark}")
    lines.extend(["", f"**Correct Answer:** {correct_option_data if correct_option_data is not None else 'null'}"])
    if solution_text:
        lines.extend(["", "**Solution:**", solution_text])
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
        solution_text = _extract_solution_text(qroot)
        qid = str(qroot.get("data-qno") or qroot.get("id") or "").strip()
        if qid.lower().startswith("q"):
            digits = re.findall(r"\d+", qid)
            if digits: qid = digits[0]
        if not qid: continue
        
        passage_text, question_text = _find_passage_and_question_blocks(qroot, qid)

        # Override with more specific selectors if available
        question_text_div = qroot.find("div", class_="question-text pl-1 pr-1")
        if question_text_div:
            question_text = _collect_paragraph_text(question_text_div)
        elif not question_text:
            # Fallback to the generic question-text class
            q_text_div = qroot.find("div", class_=re.compile(r"\bquestion-text\b"))
            if q_text_div: question_text = _norm_ws(q_text_div.get_text(" ", strip=True))

        
        # print("\n\n\nSolution_text: ",solution_text)

        img_tag = qroot.find("img", class_="img-responsive")
        if img_tag and img_tag.has_attr("src"): image_url = img_tag["src"].strip()
        options, correct_option_data = _extract_correct_answer(qroot)
        if question_text is None: continue
        if question_text:
            results.append({
                "qid": str(qid),
                "passage_text": passage_text if passage_text and question_text not in passage_text else "", 
                "question_text": question_text or "", 
                "options": options, 
                "correct_option_data": str(correct_option_data) if correct_option_data is not None else None, 
                "solution_text": solution_text, 
                "image_url": image_url or "", 
                "full_markdown": _build_full_markdown(str(qid), passage_text or "", question_text or "", options, correct_option_data, solution_text)
            })
    return {"questions": results}

def main(categorized_html: Dict[str, List[str]], type_curr: str):
    """Main function orchestrating the data processing workflow."""
    strings = {"quant":"quantitative-aptitude", "verbal":"verbal-ability", "reasoning":"data-interpretation"}
    # final_destination_dir = project_root / "auth_server/data/cat"
    # os.makedirs(final_destination_dir, exist_ok=True)
    
    script_dir = Path(__file__).parent
    project_root = script_dir.parent.parent.parent
    
    intermediate_dir = script_dir.parent / "temp_json"
    final_destination_dir = project_root / "auth_server/data/cat/docs"
    sectionals_dir = project_root / f"auth_server/data/cat/sectionals/{type_curr}"
    os.makedirs(intermediate_dir, exist_ok=True)
    os.makedirs(final_destination_dir, exist_ok=True)
    os.makedirs(sectionals_dir, exist_ok=True)

    for category, subject_alias in strings.items():
        html_docs = categorized_html.get(category, [])
        if not html_docs: continue

        all_questions: List[Dict] = []
        sectional_questions: List[Dict] = []
        seen_questions = set()
        for i, html in enumerate(html_docs):
            try:
                name = f"crawled_{category}_{i}"
                parsed = parse_html_to_questions(html)
                if parsed is None:
                    sys.stderr.write(f"WARNING: No questions parsed from {name}\n")
                    continue
                
                for question in parsed.get("questions", []):
                    q_text = question.get("question_text")
                    if q_text and q_text not in seen_questions:
                        all_questions.append(question)
                        sectional_questions.append(question)
                        seen_questions.add(q_text)

            except Exception as e:
                sys.stderr.write(f"ERROR parsing {name}: {e}\n")

        output_obj = {"questions": all_questions}
        output_obj_sectional = {"questions": sectional_questions}
        intermediate_path = intermediate_dir / f"{subject_alias}.json"
        number = 1
        for dir in os.listdir(sectionals_dir):
            if dir.startswith("sectionals-") and dir.endswith(".json"):
                number += 1
        sectionals_dir_path = sectionals_dir / f"sectionals-{number}.json"
        final_path_file = final_destination_dir / f"{subject_alias}.json"

        if final_path_file.exists():
            with open(final_path_file, "r", encoding="utf-8") as file:
                data = json.load(file)
            final_data = {"questions": data.get("questions", []) + output_obj.get("questions")}
        else:
            final_data = output_obj

        with open(intermediate_path, "w", encoding="utf-8") as f:
            json.dump(final_data, f, ensure_ascii=False, indent=2)

        with open(sectionals_dir_path, "w", encoding="utf-8") as f:
            json.dump(output_obj_sectional, f, ensure_ascii=False, indent=2)
        print(f"Wrote intermediate {len(all_questions)} question(s) to: {intermediate_path}")
    
    print("--- Running qid cleaning script ---")
    # clean_qids_in_output_files(intermediate_dir, type_curr)
    clean_qids_in_output_files(sectionals_dir, type_curr)
    print("--- Finished qid cleaning script ---")
    
    
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
    with open(Path(__file__).parent /"urls_cracku_sectionals.txt", "r") as f:
        urls_raw = [line.strip() for line in f if line.strip()]
        urls = []
        for url_curr in urls_raw:
            if "quant" in url_curr:
                type_curr = "quants"
                # urls = [url_curr.split("=")[0]+f"={num}" for num in range(1, 23)]
                urls = [url_curr.split("=")[0]+f"={num}&old=true" for num in range(1, 23)]
                urls.insert(0, urls[0])

                # Step 2: Crawl the web pages to get HTML content.
                categorized_html = asyncio.run(test_news_crawl(urls))
                print(f"Crawled {len(categorized_html['quant'])+len(categorized_html['verbal'])+len(categorized_html['reasoning'])} pages successfully.")
                
                # Step 3: Pass the crawled data to the main processing function.
                main(categorized_html, type_curr)
    print("---" + " Running qid cleaning script ---")
    script_dir = Path(__file__).parent
    project_root = script_dir.parent.parent.parent
    
    intermediate_dir = script_dir.parent / "temp_json"
    final_destination_dir = project_root / "auth_server/data/cat/docs"
    clean_qid_main(final_destination_dir)
    print("---" + " Finished qid cleaning script ---")


    # script_dir = Path(__file__).parent
    # project_root = script_dir.parent.parent.parent
    
    # intermediate_dir = script_dir.parent / "temp_json"
    # final_destination_dir = project_root / "auth_server/data/cat/docs"
    # sectionals_dir = project_root / f"auth_server/data/cat/sectionals/quants"
    # clean_qids_in_output_files(sectionals_dir, "quants")
