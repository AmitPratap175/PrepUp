# scrape_questions_textonly.py
# pip install crawl4ai beautifulsoup4

import asyncio
import json
import re
import sys
from typing import List, Dict, Optional
from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig, CacheMode
from bs4 import BeautifulSoup, NavigableString, Tag


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
def parse_card(card: Tag, soup: BeautifulSoup, passage: Optional[str] = None, passage_images: Optional[str] = None) -> Optional[Dict]:
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
            
            opt_text = _html_to_text_with_latex(opt_content.decode_contents()) if opt_content else _html_to_text_with_latex(btn.decode_contents())

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
    md_lines.append(f"### Question (qid: {data_qid})" if data_qid else "### Question")
    md_lines.append("")
    
    if passage:
        md_lines.append("**Passage:**")
        md_lines.append(passage)
        md_lines.append("")

    if image_url:
        # Add all images to markdown
        for url in image_url.split(','):
            md_lines.append(f"![Question Image]({url})")
        md_lines.append("")

    md_lines.append(question_text)
    md_lines.append("")

    if options_list:
        md_lines.append("**Options:**")
        for o in options_list:
            mark = " ✅" if o["is_correct"] else ""
            md_lines.append(f"- **{o['label']}**. {o['option_text']}{mark}")
    else:
        md_lines.append("**Options:** (TITA or no options provided)")

    if correct_answer_data:
        md_lines.append("")
        md_lines.append(f"**Correct Answer:** {correct_answer_data}")

    if solution:
        md_lines.append("")
        md_lines.append("**Solution:**")
        md_lines.append(solution)
        if solution_image_url:
            for url in solution_image_url.split(','):
                md_lines.append(f"![Solution Image]({url})")

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
async def scrape_url_textonly(url: str, out_basename: str = "output"):
    run_config = CrawlerRunConfig(cache_mode=CacheMode.BYPASS)

    async with AsyncWebCrawler(config=BrowserConfig()) as crawler:
        result = await crawler.arun(url=url, config=run_config)

        if not result.success:
            raise RuntimeError(f"crawl4ai failed: {result.error_message}")

        # Save the raw HTML for debugging
        html_filename = f"{out_basename}.html"
        with open(html_filename, "w", encoding="utf-8") as f:
            f.write(result.html)
        print(f"Saved raw HTML for debugging -> {html_filename}")

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
                continue # Skip to next card

            # Ignore solution cards in this main loop
            if 'card-success' in card_classes:
                continue # Skip to next card

            # If it's not a passage or solution, treat it as a question card
            parsed = parse_card(card, soup=soup, passage=current_passage_text, passage_images=current_passage_images)
            if parsed:
                parsed_questions.append(parsed)

        output = {
            "url": url,
            "num_questions_found": len(parsed_questions),
            "questions": parsed_questions
        }

        # Save JSON
        with open(f"{out_basename}.json", "w", encoding="utf-8") as f:
            json.dump(output, f, indent=2, ensure_ascii=False)

        # Save Markdown
        with open(f"{out_basename}.md", "w", encoding="utf-8") as f:
            for q in parsed_questions:
                f.write(q["full_markdown"])
                f.write("\n\n---\n\n")

        print(f"Saved JSON -> {out_basename}.json")
        print(f"Saved Markdown -> {out_basename}.md")
        return output


def read_urls_from_file(filepath="urls.txt"):
    urls = []
    try:
        with open(filepath, "r") as f:
            for line in f:
                url = line.strip()
                if url:  # Add only non-empty lines
                    urls.append(url)
    except FileNotFoundError:
        print(f"Error: {filepath} not found.")
        sys.exit(1)
    return urls


urls = read_urls_from_file()
# for url in urls:
url="https://cracku.in/cat-2024-slot-1-quant-question-paper-solved"
out ="docs/"+url.split("/")[-1]

# Run the async scraping
data = asyncio.run(scrape_url_textonly(url, out_basename=out))

# input()
