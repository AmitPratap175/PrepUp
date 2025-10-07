# scrape_questions_textonly.py
# pip install crawl4ai beautifulsoup4

import asyncio
import json
import re
import sys
from typing import List, Dict, Optional, Any
from pathlib import Path

from bs4 import BeautifulSoup, NavigableString, Tag
from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig, CacheMode


# --- Helpers -----------------------------------------------------------------
def _html_to_text_with_latex(container) -> str:
    """Extracts and concatenates text from a BeautifulSoup container, converting katex spans to LaTeX."""
    if container is None:
        return ""

    # Create a new soup from the container to avoid modifying the original
    soup = BeautifulSoup(str(container), 'html.parser')

    for span in soup.find_all('span', class_='katex'):
        annotation = span.find('annotation', encoding='application/x-tex')
        if annotation:
            span.replace_with(f'${annotation.get_text()}$')
        else:
            # Fallback if no annotation is found
            span.replace_with(span.get_text())

    for br in soup.find_all('br'):
        br.replace_with('\n')

    # Extract text and clean up whitespace
    text = soup.get_text()
    text = re.sub(r'[ \t]+', ' ', text)
    text = re.sub(r'(\n\s*){2,}', '\n\n', text)
    return text.strip()


def _label_for_number(n: int) -> str:
    return chr(ord('A') + n - 1) if n and n > 0 else str(n)


# --- Core parser -------------------------------------------------------------
def parse_card(card: Tag, soup: BeautifulSoup, passage: Optional[str] = None,
               passage_images: Optional[str] = None) -> Optional[Dict]:
    qdiv = card.select_one(".question-text")
    if not qdiv:
        return None

    question_text = _html_to_text_with_latex(qdiv.decode_contents())

    # --- Image Aggregation ---
    all_image_urls = []
    if passage_images:
        all_image_urls.extend(passage_images.split(','))

    question_imgs = card.find_all("img", class_="img-responsive")
    for img in question_imgs:
        if img.has_attr("src"):
            all_image_urls.append(img["src"].strip())

    # Consolidate and format image URLs
    image_url = ",".join(sorted(list(set(all_image_urls)))) if all_image_urls else None

    options_box = card.select_one(".options-box")
    options_list: List[Dict] = []
    correct_answer_data = None
    data_qid = None

    if options_box:
        correct_answer_data = options_box.get("data-answer")
        data_qid = options_box.get("data-qid")

        for btn in options_box.select("button[data-option]"):
            opt_num = btn.get("data-option")
            try:
                opt_num_int = int(opt_num)
            except (ValueError, TypeError):
                opt_num_int = None

            label = _label_for_number(opt_num_int) if opt_num_int else opt_num
            opt_content = btn.select_one(".option-content")

            opt_text = _html_to_text_with_latex(
                opt_content.decode_contents()) if opt_content else _html_to_text_with_latex(btn.decode_contents())

            options_list.append({
                "data_option": opt_num,
                "label": label,
                "option_text": opt_text,
                "is_correct": (opt_num == correct_answer_data)
            })
    else:
        # Handle TITA (Type In The Answer) questions or other formats
        correct_data_class = card.select_one(".answer-box input[data-answer], .answer-box a[data-answer]")
        if correct_data_class:
            correct_answer_data = correct_data_class.get("data-answer")

    # --- Extract Solution ---
    solution = None
    solution_image_url = None
    if data_qid:
        explanation_id = f"explanation{data_qid}"
        solution_card = soup.select_one(f"div#{explanation_id}")
        if solution_card:
            solution_body = solution_card.select_one(".card-body")
            if solution_body:
                solution = _html_to_text_with_latex(solution_body.decode_contents())

                sol_imgs = solution_body.find_all("img")
                sol_img_urls = [img["src"].strip() for img in sol_imgs if img.has_attr("src")]
                if sol_img_urls:
                    solution_image_url = ",".join(sorted(list(set(sol_img_urls))))

    # --- Markdown output (no HTML) ---
    md_lines = []
    md_lines.append(f"### Question (qid: {data_qid})")

    return {
        "qid": data_qid,
        "passage_text": passage,
        "question_text": question_text,
        "image_url": image_url,
        "options": options_list,
        "correct_option_data": correct_answer_data,
        "solution_text": solution,
        "solution_image_url": solution_image_url,
        "full_markdown": "\n".join(md_lines)
    }


# --- Main crawler ------------------------------------------------------------
async def scrape_url_and_parse(url: str) -> Optional[List[Dict]]:
    """
    Scrapes a single URL and returns a list of parsed question dictionaries, or None on crawl failure.
    """
    run_config = CrawlerRunConfig(cache_mode=CacheMode.BYPASS)
    
    async with AsyncWebCrawler(config=BrowserConfig()) as crawler:
        result = await crawler.arun(url=url, config=run_config)

        if not result.success:
            print(f"Crawl failed for {url}: {result.error_message}", file=sys.stderr)
            return None  # Return None on crawl failure

        # # Save the raw HTML for debugging - COMMENTED OUT
        # out_basename = "docs/" + url.split("/")[-1]
        # html_filename = f"{out_basename}.html"
        # with open(html_filename, "w", encoding="utf-8") as f:
        #     f.write(result.html)
        # print(f"Saved raw HTML for debugging -> {html_filename}")

        soup = BeautifulSoup(result.html, "html.parser")
        all_cards = soup.select(".card")

        parsed_questions = []
        current_passage_text = None
        current_passage_images = None

        for card in all_cards:
            card_classes = card.get('class', [])

            # Handle passage cards
            if 'card-info' in card_classes:
                passage_body = card.select_one(".card-body")
                if passage_body:
                    current_passage_text = _html_to_text_with_latex(passage_body.decode_contents())

                    passage_imgs = passage_body.find_all("img")
                    img_urls = [img["src"].strip() for img in passage_imgs if img.has_attr("src")]
                    if img_urls:
                        current_passage_images = ",".join(sorted(list(set(img_urls))))
                continue  # Skip to next card

            # Ignore solution cards in this main loop
            if 'card-success' in card_classes:
                continue  # Skip to next card

            # If it's not a passage or solution, treat it as a question card
            parsed = parse_card(card, soup=soup, passage=current_passage_text,
                                passage_images=current_passage_images)
            if parsed:
                parsed_questions.append(parsed)

        # # Save Markdown - COMMENTED OUT
        # with open(f"{out_basename}.md", "w", encoding="utf-8") as f:
        #     for q in parsed_questions:
        #         f.write(q["full_markdown"])
        #         f.write("\n\n---\n\n")
        # print(f"Saved Markdown -> {out_basename}.md")

        return parsed_questions


def read_urls_from_file(filepath="urls.txt"):
    urls = []
    try:
        with open(filepath, "r") as f:
            for line in f:
                url = line.strip()
                if url and not url.startswith('#'):  # Add only non-empty, non-commented lines
                    urls.append(url)
    except FileNotFoundError:
        print(f"Error: {filepath} not found.", file=sys.stderr)
        sys.exit(1)
    return urls

# --- QID Cleaning Logic ---
def get_questions_container(data: Any) -> List[Dict[str, Any]]:
    if isinstance(data, dict) and isinstance(data.get("questions"), list):
        return data["questions"]
    if isinstance(data, list):
        return data
    raise ValueError('Input JSON must be either a dict with a "questions" list or a top-level list of questions.')

def clean_qids_in_output_files() -> None:
    """
    Finds all JSON files in the output directory, reads each one, replaces the 'qid'
    values, and then overwrites the original file with the updated data.
    """
    json_folder = Path(__file__).parent / "docs"
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

        name = file_path.stem.split('-')[0]
        if name.startswith("quant"):
            name = 'quant'
        elif name.startswith("data"):
            name = 'dilr'
        else:
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
                item["qid"] = f"{name}-{counter}"

        try:
            with open(file_path, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
        except IOError as e:
            print(f"Error writing to {file_path}: {e}", file=sys.stderr)

        print(f"Processed {counter} qids in {file_path.name}")


async def main():
    """
    Main function to read URLs, categorize them, scrape, and append to JSON files.
    """
    output_dir = Path("docs")
    output_dir.mkdir(exist_ok=True)

    category_map = {
        "quantitative-aptitude": ["quant"],
        "verbal-ability": ["varc", "verbal"],
        "data-interpretation": ["lrdi", "dilr"],
    }

    keyword_to_filename = {}
    for filename, keywords in category_map.items():
        for keyword in keywords:
            keyword_to_filename[keyword] = output_dir / f"{filename}.json"

    urls = read_urls_from_file("urls.txt")
    
    for url in urls:
        print(f"Processing URL: {url}")
        
        output_filename = None
        for keyword, filename in keyword_to_filename.items():
            if keyword in url:
                output_filename = filename
                break
        
        if not output_filename:
            print(f"  [!] Skipping URL: No category keyword found in URL.", file=sys.stderr)
            continue

        new_questions = await scrape_url_and_parse(url)

        if new_questions is None or not new_questions:
            reason = "Crawl failed" if new_questions is None else "No questions found"
            print(f"  [!] {reason} for URL: {url}", file=sys.stderr)
            with open("failed_urls.txt", "a", encoding="utf-8") as f:
                f.write(url + "\n")
            continue

        try:
            with open(output_filename, 'r', encoding='utf-8') as f:
                existing_data = json.load(f)
        except (FileNotFoundError, json.JSONDecodeError):
            existing_data = {"questions": []}
            
        existing_data["questions"].extend(new_questions)
        
        with open(output_filename, 'w', encoding='utf-8') as f:
            json.dump(existing_data, f, indent=2, ensure_ascii=False)
            
        print(f"  -> Appended {len(new_questions)} questions to {output_filename}")

    print("\n--- Starting QID cleaning process ---")
    clean_qids_in_output_files()
    print("--- Finished QID cleaning process ---")


if __name__ == "__main__":
    asyncio.run(main())