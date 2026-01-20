import asyncio
import json
import os
import re
from datetime import datetime
from typing import List, Dict
from bs4 import BeautifulSoup
from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig, CacheMode

async def scrape_upsc_quiz(url: str, page_index: int):
    print(f"Scraping UPSC Quiz: {url}")
    
    browser_config = BrowserConfig(
        verbose=True,
        headless=False,
    )
    
    run_config = CrawlerRunConfig(
        js_code=[
            # Smart wait: Check for 404 or Submit Button
            "const checkFor404 = () => {"
            "  if (document.title.includes('404') || document.body.innerText.includes('Page not found')) return true;"
            "  if (document.querySelector('.error-link, h1.error-code')) return true;"
            "  return false;"
            "};"
            
            "if (checkFor404()) return;" # Exit JS if 404 immediately
            
            # Poll for submit button (wait up to 5s)
            "const findBtn = () => Array.from(document.querySelectorAll('button')).find(btn => btn.textContent.toLowerCase().includes('submit test'));"
            "let submitBtn = findBtn();"
            "let attempts = 0;"
            "while (!submitBtn && attempts < 10) {"
            "  await new Promise(r => setTimeout(r, 500));"
            "  submitBtn = findBtn();"
            "  attempts++;"
            "  if (checkFor404()) return;" # Check if it resolved to 404 while loading
            "}"
            
            "if (submitBtn) { submitBtn.click(); }"
            "await new Promise(r => setTimeout(r, 2500));" # Wait for results/answers to appear
        ],
        wait_for="body", # Wait for body only, handle specific element wait in JS to avoid timeout on 404
        cache_mode=CacheMode.BYPASS
    )

    async with AsyncWebCrawler(config=browser_config) as crawler:
        try:
            result = await crawler.arun(url=url, config=run_config)
        except Exception as e:
            print(f"Crawler error for {url}: {e}")
            return None

        if not result:
            print(f"No result returned for {url}")
            return None

        # Detect 404 via Status Code or HTML Content
        if result.status_code == 404:
            print(f"HTTP 404 detected for {url}")
            return "404"

        if not result.html:
            print(f"Failed to retrieve HTML content for {url}")
            # If status code wasn't 404 but no HTML, treat as failure
            return None

        soup = BeautifulSoup(result.html, 'html.parser')
        
        # Check specific markers again in parsed HTML to be sure
        is_404 = False
        page_title = soup.title.string if soup.title else ""
        error_link = soup.find('a', class_='error-link')
        error_h1 = soup.find('h1', string=re.compile(r'404', re.I))
        
        if "404" in page_title or error_link or error_h1:
            is_404 = True
        elif "page not found" in result.html.lower()[:2000]:
            is_404 = True
            
        if is_404:
             print(f"Confirmed 404 Not Found for {url}")
             return "404"

        q_cards = soup.find_all('div', class_='q-card')
        if not q_cards:
            # Re-check text one last time
            text_content = soup.get_text().lower()
            if "not found" in text_content or "404" in text_content:
                print(f"Page not found (404 - text match) for {url}")
                return "404"
            print(f"No questions found for {url}, but not explicitly a 404.")
            return []

        questions = []
        for i, card in enumerate(q_cards):
            try:
                # Question Text
                q_text_element = card.find(['p', 'div'], class_=re.compile(r'question|text'))
                if not q_text_element:
                    q_text = card.get_text(separator="\n", strip=True).split('\n')[0]
                else:
                    q_text = q_text_element.get_text(strip=True)

                # Options
                labels = card.find_all('label', class_='opt-label')
                options = []
                correct_answer = None
                
                for label in labels:
                    label_text = label.get_text(strip=True)
                    match = re.match(r'^([A-D])\.(.*)', label_text)
                    if match:
                        opt_label = match.group(1)
                        opt_text = match.group(2).strip()
                    else:
                        opt_label = label_text[0] if len(label_text) > 0 else "?"
                        opt_text = label_text[2:].strip() if len(label_text) > 2 else label_text

                    is_correct = 'correct' in label.get('class', []) or 'missed-correct' in label.get('class', [])
                    data_option = opt_label
                    
                    options.append({
                        "label": opt_label,
                        "option_text": opt_text,
                        "data_option": data_option,
                        "is_correct": is_correct
                    })
                    
                    if is_correct:
                        correct_answer = data_option

                # Explanation/Solution
                sol_box = card.find('div', class_='solution-box')
                explanation = sol_box.get_text(strip=True).replace('Solution:', '').strip() if sol_box else ""

                unique_id = f"upsc-{page_index}-{i+1}"
                questions.append({
                    "id": unique_id,
                    "qid": unique_id,
                    "question_text": q_text,
                    "options": options,
                    "correct_answer": correct_answer,
                    "explanation": explanation,
                    "type": "mcq"
                })
            except Exception as e:
                print(f"Error parsing question {i+1} on page {page_index}: {e}")

        return questions

async def main():
    output_dir = "auth_server/data/upsc"
    output_file = os.path.join(output_dir, "daily-mcqs.json")
    failed_file = os.path.join(output_dir, "failed_scrapes.json")
    
    existing_data = {
        "title": "UPSC Daily Current Affairs MCQs Master List",
        "examType": "upsc",
        "subject": "Current Affairs",
        "duration": 270,
        "questions": []
    }
    current_max_index = 0
    
    if os.path.exists(output_file):
        try:
            with open(output_file, 'r', encoding='utf-8') as f:
                loaded_data = json.load(f)
                if isinstance(loaded_data, dict) and "questions" in loaded_data:
                    existing_data = loaded_data
                    for q in existing_data.get("questions", []):
                        qid = q.get("qid", "")
                        parts = qid.split('-')
                        if len(parts) >= 2 and parts[1].isdigit():
                            current_max_index = max(current_max_index, int(parts[1]))
        except (json.JSONDecodeError, IOError) as e:
            print(f"Error reading existing file: {e}. Starting fresh.")
    
    today = datetime.now().date()
    reference_date = datetime(2026, 1, 18).date()
    reference_index = 18
    
    days_diff = (today - reference_date).days
    target_index = reference_index + days_diff
    
    print(f"Current max index in file: {current_max_index}")
    print(f"Target index for today ({today}): {target_index}")
    
    failed_urls = []
    if os.path.exists(failed_file):
        try:
            with open(failed_file, 'r', encoding='utf-8') as f:
                failed_urls = json.load(f)
        except:
            pass

    if current_max_index >= target_index:
        print("Data is already up to date.")
        # We might still want to retry failed ones here? For now, just exit.
        return

    new_questions = []
    for i in range(current_max_index + 1, target_index + 1):
        url = f"https://www.upscprep.com/daily-current-affairs-mcq-{i}/"
        if i == 1:
            url = url.replace("mcq-1", "mcq")
        elif i == 9:
            url = url.replace("mcq-9", "mcq-8-2")
            
        result = await scrape_upsc_quiz(url, i)
        
        if result == "404":
            print(f"Skipping {url} due to 404.")
            if url not in failed_urls:
                failed_urls.append({"url": url, "index": i, "date": str(today), "reason": "404"})
            continue
        elif result is None or (isinstance(result, list) and len(result) == 0):
             # Other failure (network or no questions)
             print(f"Failed to scrape {url}.")
             if url not in [f.get("url") for f in failed_urls]:
                failed_urls.append({"url": url, "index": i, "date": str(today), "reason": "failed/empty"})
             continue

        if isinstance(result, list) and len(result) > 0:
            new_questions.extend(result)
            print(f"Added {len(result)} questions from page {i}. Total new: {len(new_questions)}")

    # Save failed URLs
    if failed_urls:
        with open(failed_file, 'w', encoding='utf-8') as f:
            json.dump(failed_urls, f, indent=2)
        print(f"Logged {len(failed_urls)} failed/404 attempts to {failed_file}")

    if new_questions:
        existing_data["questions"].extend(new_questions)
        existing_data["duration"] = len(existing_data["questions"]) // 5 * 15 
        
        os.makedirs(output_dir, exist_ok=True)
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(existing_data, f, indent=2)
            
        print(f"Successfully appended {len(new_questions)} questions. Total questions now: {len(existing_data['questions'])}")
    else:
        print("No new questions were successfully scraped.")

if __name__ == "__main__":
    asyncio.run(main())
