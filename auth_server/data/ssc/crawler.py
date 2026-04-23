# crawler.py
# pip install crawl4ai beautifulsoup4

import asyncio
import json
import re
import sys
from typing import List, Dict, Optional, Any
from pathlib import Path

from bs4 import BeautifulSoup, Tag
from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig, CacheMode

# --- Helpers -----------------------------------------------------------------
def _html_to_text_with_latex(container) -> str:
    if container is None:
        return ""

    soup = BeautifulSoup(str(container), 'html.parser')

    for span in soup.find_all('span', class_='katex'):
        annotation = span.find('annotation', encoding='application/x-tex')
        if annotation:
            span.replace_with(f'${annotation.get_text()}$')
        else:
            span.replace_with(span.get_text())

    for br in soup.find_all('br'):
        br.replace_with('\n')

    text = soup.get_text()
    text = re.sub(r'[ \t]+', ' ', text)
    text = re.sub(r'(\n\s*){2,}', '\n\n', text)
    return text.strip()


def _label_for_number(n: int) -> str:
    return chr(ord('A') + n - 1) if n and n > 0 else str(n)


def _extract_img_urls_from_tag(tag: Tag) -> List[str]:
    """Return a deduplicated list of src URLs from all <img> tags inside `tag`."""
    if tag is None:
        return []
    return list(dict.fromkeys(
        img["src"].strip()
        for img in tag.find_all("img")
        if img.has_attr("src")
    ))


# --- Core parser -------------------------------------------------------------
def parse_card(card: Tag, soup: BeautifulSoup, passage: Optional[str] = None,
               passage_images: Optional[str] = None) -> Optional[Dict]:
    qdiv = card.select_one(".question-text")
    if not qdiv:
        return None

    question_text = _html_to_text_with_latex(qdiv.decode_contents())

    # ---- Question-level image URLs (passage + question body, NOT option images) ----
    question_level_img_urls = []
    if passage_images:
        question_level_img_urls.extend(passage_images.split(','))

    # Only grab images directly inside the question-text div, not option buttons
    question_imgs = card.select(".question-text img.img-responsive")
    for img in question_imgs:
        if img.has_attr("src"):
            question_level_img_urls.append(img["src"].strip())

    image_url = (
        ",".join(sorted(set(filter(None, question_level_img_urls))))
        or None
    )

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

            # ---- option_image_url: images found inside this option button ----
            opt_img_urls = _extract_img_urls_from_tag(opt_content or btn)
            option_image_url = (
                ",".join(sorted(set(filter(None, opt_img_urls))))
                or None
            )

            # Strip img tags before extracting text so they don't leave blank lines
            opt_content_copy = BeautifulSoup(
                str(opt_content or btn), "html.parser"
            )
            for img in opt_content_copy.find_all("img"):
                img.decompose()
            opt_text = _html_to_text_with_latex(opt_content_copy.decode_contents())

            options_list.append({
                "data_option": opt_num,
                "label": label,
                "option_text": opt_text,
                "option_image_url": option_image_url,
                "is_correct": (opt_num == correct_answer_data),
            })
    else:
        tita_input = card.select_one(".answer-box input[data-qno]")
        if tita_input:
            correct_answer_data = tita_input.get("data-answer")
            data_qid = tita_input.get("data-qno")

    # --- Extract Solution ---
    solution = None
    solution_image_url = None
    if data_qid:
        explanation_id = f"explanation{data_qid}"
        solution_card = soup.select_one(f"div#{explanation_id}")

        if not solution_card:
            solution_card = card.find_next_sibling("div", id=explanation_id)

        if solution_card:
            solution_body = (
                solution_card.select_one(".card-body") or solution_card
            )

            temp_solution_body = BeautifulSoup(str(solution_body), 'html.parser')
            badge = temp_solution_body.find('span', class_='badge-success')
            if badge:
                badge.decompose()

            solution = _html_to_text_with_latex(temp_solution_body.decode_contents())

            sol_img_urls = _extract_img_urls_from_tag(solution_body)
            if sol_img_urls:
                solution_image_url = ",".join(sorted(set(filter(None, sol_img_urls))))

    md_lines = []
    md_lines.append(f"### Question (qid: {data_qid})")
    if not passage == "Instructions\n\nFor the following questions answer them individually":
        passage = passage.replace("Instructions\n\n", "") if passage else None
    else:
        passage = None

    return {
        "qid": data_qid,
        "passage_text": passage,
        "question_text": question_text,
        "image_url": image_url,
        "options": options_list,
        "correct_option_data": correct_answer_data,
        "solution_text": solution,
        "solution_image_url": solution_image_url,
        "full_markdown": "\n".join(md_lines),
    }


# --- Main crawler ------------------------------------------------------------
async def scrape_url_and_parse(base_url: str, crawler: AsyncWebCrawler) -> List[Dict]:
    all_parsed_questions = []

    js_click_solutions = """
    const buttons = Array.from(document.querySelectorAll('button, a'));
    const solutionBtns = buttons.filter(el => el.textContent && el.textContent.toLowerCase().includes('view solution'));
    solutionBtns.forEach(btn => btn.click());
    """

    for page in range(1, 15):
        paged_url = (
            f"{base_url}?page={page}"
            if "?" not in base_url
            else f"{base_url}&page={page}"
        )
        print(f"    -> Scraping {paged_url} ...")

        run_config = CrawlerRunConfig(
            cache_mode=CacheMode.BYPASS,
            js_code=js_click_solutions,
            delay_before_return_html=3.0,
        )

        result = await crawler.arun(url=paged_url, config=run_config)

        if not result.success:
            print(
                f"      [!] Crawl failed for page {page}: {result.error_message}",
                file=sys.stderr,
            )
            break

        soup = BeautifulSoup(result.html, "html.parser")
        all_cards = soup.select(".card")

        parsed_questions = []
        current_passage_text = None
        current_passage_images = None

        for card in all_cards:
            card_classes = card.get("class", [])

            if "card-info" in card_classes:
                passage_body = card.select_one(".card-body")
                if passage_body:
                    current_passage_text = _html_to_text_with_latex(
                        passage_body.decode_contents()
                    )
                    img_urls = _extract_img_urls_from_tag(passage_body)
                    if img_urls:
                        current_passage_images = ",".join(
                            sorted(set(filter(None, img_urls)))
                        )
                continue

            if "card-success" in card_classes and not card.has_attr("id"):
                continue

            if "question-text" in str(card):
                parsed = parse_card(
                    card,
                    soup=soup,
                    passage=current_passage_text,
                    passage_images=current_passage_images,
                )
                if parsed:
                    parsed_questions.append(parsed)

        if not parsed_questions:
            print(
                f"    -> No more questions found on page {page}. Moving to next URL."
            )
            break

        all_parsed_questions.extend(parsed_questions)
        print(f"      ✓ Extracted {len(parsed_questions)} questions from page {page}")

    return all_parsed_questions


def read_urls_from_file(filepath="urls_ssc.txt"):
    urls = []
    try:
        with open(filepath, "r") as f:
            for line in f:
                url = line.strip()
                if url and not url.startswith("#"):
                    url = re.sub(r"[\?&]page=\d+", "", url)
                    urls.append(url)
    except FileNotFoundError:
        print(f"Error: {filepath} not found.", file=sys.stderr)
        sys.exit(1)
    return set(urls)


def get_questions_container(data: Any) -> List[Dict[str, Any]]:
    if isinstance(data, dict) and isinstance(data.get("questions"), list):
        return data["questions"]
    if isinstance(data, list):
        return data
    raise ValueError(
        'Input JSON must be either a dict with a "questions" list or a top-level list of questions.'
    )


def clean_qids_in_output_files(output_dir: Path) -> None:
    if not output_dir.is_dir():
        print(f"Info: Output directory not found at {output_dir}. Nothing to clean.")
        return

    json_files = list(output_dir.rglob("*.json"))
    print(f"--- Found {len(json_files)} JSON files to clean in {output_dir} ---")

    for file_path in json_files:
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)
        except (json.JSONDecodeError, IOError) as e:
            print(f"Error reading {file_path}: {e}", file=sys.stderr)
            continue

        year = file_path.parent.name
        basename = file_path.stem

        try:
            questions = get_questions_container(data)
        except ValueError as e:
            print(f"Error processing {file_path}: {e}", file=sys.stderr)
            continue

        counter = 0
        for item in questions:
            if isinstance(item, dict):
                counter += 1
                item["qid"] = f"ssc-{year}-{basename}-{counter}"

        try:
            with open(file_path, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
        except IOError as e:
            print(f"Error writing to {file_path}: {e}", file=sys.stderr)

        print(f"Processed {counter} qids in {year}/{file_path.name}")


async def main():
    output_dir = Path("ssc_docs")
    output_dir.mkdir(exist_ok=True)

    urls = read_urls_from_file("urls_ssc.txt")

    async with AsyncWebCrawler(config=BrowserConfig()) as crawler:
        for url in urls:
            print(f"\nProcessing Main URL: {url}")

            match = re.search(r"ssc-cgl.*?-(.*?)-(\d{4})(?:-shift-(\d+))?", url)

            if not match:
                print(
                    f"  [!] Skipping URL: Could not extract date and year from URL format.",
                    file=sys.stderr,
                )
                continue

            date_str = match.group(1)
            year = match.group(2)
            shift = match.group(3) if match.group(3) else "all"

            year_dir = output_dir / year
            year_dir.mkdir(exist_ok=True)
            output_filename = year_dir / f"shift-{shift}_{date_str}.json"

            new_questions = await scrape_url_and_parse(url, crawler)

            if not new_questions:
                print(
                    f"  [!] No questions found across any pages for URL: {url}",
                    file=sys.stderr,
                )
                with open("failed_urls_ssc.txt", "a", encoding="utf-8") as f:
                    f.write(url + "\n")
                continue

            try:
                with open(output_filename, "r", encoding="utf-8") as f:
                    existing_data = json.load(f)
            except (FileNotFoundError, json.JSONDecodeError):
                existing_data = {"questions": []}

            existing_qids = {
                q.get("qid") for q in existing_data.get("questions", [])
            }
            unique_new_questions = [
                q for q in new_questions if q.get("qid") not in existing_qids
            ]

            existing_data["questions"].extend(unique_new_questions)

            with open(output_filename, "w", encoding="utf-8") as f:
                json.dump(existing_data, f, indent=2, ensure_ascii=False)

            print(
                f"  -> Appended {len(unique_new_questions)} new questions to {output_filename}"
            )

    print("\n--- Starting QID cleaning process ---")
    clean_qids_in_output_files(output_dir)
    print("--- Finished QID cleaning process ---")


if __name__ == "__main__":
    asyncio.run(main())