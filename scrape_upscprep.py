import asyncio
import json
import os
import re
from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig, CacheMode
from bs4 import BeautifulSoup

# Configuration
# List of (URL, Output Filename) tuples
# User can fill in the URLs for the remaining subjects
SCRAPE_CONFIG = [
    # 1. Indian Polity
    # ("https://courses.upscprep.com/exams/review/34512/answers/", "auth_server/data/upsc/upsc_polity_pyqs.json"),
    
    # 2. Ancient, Medieval, Art and Culture
    # ("https://courses.upscprep.com/exams/review/34523/answers/", "auth_server/data/upsc/upsc_ancient_medieval_history_pyqs.json"),

    # 3. Modern Indian History
    ("https://courses.upscprep.com/exams/review/34524/answers/", "auth_server/data/upsc/upsc_modern_history_pyqs.json"),

    # 4. Geography
    ("https://courses.upscprep.com/exams/review/34525/answers/", "auth_server/data/upsc/upsc_geography_pyqs.json"),

    # 5. Economy
    ("https://courses.upscprep.com/exams/review/34526/answers/", "auth_server/data/upsc/upsc_economy_pyqs.json"),

    # 6. Environment and Ecology
    ("https://courses.upscprep.com/exams/review/34527/answers/", "auth_server/data/upsc/upsc_environment_pyqs.json"),

    # 7. Science and Technology
    ("https://courses.upscprep.com/exams/review/34528/answers/", "auth_server/data/upsc/upsc_science_tech_pyqs.json"),

    # 8. Miscellaneous & Current Affairs
    ("https://courses.upscprep.com/exams/review/34529/answers/", "auth_server/data/upsc/upsc_misc_current_affairs_pyqs.json"),
]


def build_full_markdown(qid, question_text, options, correct_option_data, solution_text):
    md = f"### Question (qid: {qid})\n\n"
    if question_text:
        md += f"{question_text}\n\n"
    
    md += "**Options:**\n"
    for opt in options:
        mark = " ✅" if opt.get("is_correct") else ""
        md += f"- **{opt.get('label')}**. {opt.get('option_text')}{mark}\n"
    
    md += f"\n**Correct Answer:** {correct_option_data}\n\n"
    if solution_text:
        md += f"**Solution:**\n{solution_text}\n"
    
    return md

async def scrape_upsc_review(target_url, output_file_path):
    print(f"Scraping URL: {target_url}")
    
    # Extract ID from URL
    match = re.search(r"exams/review/(\d+)", target_url)
    if not match:
        print(f"Could not extract Exam ID from {target_url}")
        return
    exam_id = match.group(1)
    print(f"Detected Exam ID: {exam_id}")

    # Persistent context to use saved login
    user_data_dir = os.path.join(os.getcwd(), "browser_data")
    
    browser_config = BrowserConfig(
        verbose=True,
        headless=False,
        user_data_dir=user_data_dir,
        use_persistent_context=True,
        browser_type="chromium"
    )

    # Run config to handle dynamic content
    run_config = CrawlerRunConfig(
        js_code=[
            # Login if needed (keep existing logic)
            """
            const url = window.location.href;
            if (url.includes('login')) {
                console.log("On login page. Logging in...");
                const emailInput = document.querySelector('input[type="email"]');
                const passInput = document.querySelector('input[type="password"]');
                const btn = document.querySelector('button[type="submit"]');
                if (emailInput && passInput) {
                    emailInput.value = "sipunpratap987@gmail.com";
                    passInput.value = "hay94van@Amit";
                    emailInput.dispatchEvent(new Event('input', {bubbles: true}));
                    passInput.dispatchEvent(new Event('input', {bubbles: true}));
                    setTimeout(() => btn.click(), 500);
                }
                await new Promise(r => setTimeout(r, 5000));
            }
            """,
            # Fetch API Data
            f"""
            const fetchAllData = async () => {{
                let allResults = [];
                let nextUrl = '/api/v2.2/attempts/{exam_id}/review/?state=all&page=1';
                
                try {{
                    while (nextUrl) {{
                        const res = await fetch(nextUrl);
                        if (!res.ok) break;
                        const data = await res.json();
                        allResults.push(...data.results);
                        nextUrl = data.next;
                    }}
                }} catch (e) {{
                    console.error("API Fetch Error", e);
                }}
                
                // Inject into DOM for Python to read
                const div = document.createElement('div');
                div.id = 'scraped-json-data';
                div.textContent = JSON.stringify(allResults);
                document.body.appendChild(div);
            }};
            await fetchAllData();
            """
        ],
        delay_before_return_html=15.0, # Wait for API fetch loop
        cache_mode=CacheMode.BYPASS
    )

    async with AsyncWebCrawler(config=browser_config) as crawler:
        print(f"Navigating to {target_url}...")
        result = await crawler.arun(url=target_url, config=run_config)
        
        soup = BeautifulSoup(result.html, 'html.parser')
        data_div = soup.find('div', id='scraped-json-data')
        
        all_questions = []
        
        if data_div and data_div.get_text():
            raw_data = json.loads(data_div.get_text())
            print(f"Fetched {len(raw_data)} items from API.")
            
            for idx, item in enumerate(raw_data):
                # Map API structure to Target Schema
                # Inspection needed for item structure, assuming based on standard Django DRF pattern
                # Usually: item['question']['question_html'], item['question']['answers']...
                
                q_obj = item.get('question', {})
                q_id = q_obj.get('id', f"upsc-{idx}")
                q_text = q_obj.get('question_html', '') or q_obj.get('text', '')
                q_text = BeautifulSoup(q_text, 'html.parser').get_text(separator="\n", strip=True)
                
                # Options
                options = []
                correct_opt_label = None
                
                answers = q_obj.get('answers', [])
                # If answers not in question, maybe in top level item based on user selection?
                # User's script dump showed `getAnswers(usa)` trying translation then `usa.question.answers`
                
                for a_idx, ans in enumerate(answers):
                    label = chr(65 + a_idx)
                    text = ans.get('text_html', '') or ans.get('text', '')
                    text = BeautifulSoup(text, 'html.parser').get_text(strip=True)
                    is_correct = ans.get('is_correct', False)
                    
                    if is_correct:
                        correct_opt_label = label
                    
                    options.append({
                        "data_option": str(a_idx + 1),
                        "label": label,
                        "option_text": text,
                        "is_correct": is_correct
                    })
                
                # Explanation
                expl_html = q_obj.get('explanation', '') or q_obj.get('explanation_html', '')
                solution_text = BeautifulSoup(expl_html, 'html.parser').get_text(separator="\n", strip=True)
                
                entry = {
                    "qid": f"upsc-{exam_id}-{q_id}",
                    "passage_text": None, # Handle passage if type is 'M' (Mock/Passage based)?
                    "question_text": q_text,
                    "image_url": None,
                    "options": options,
                    "correct_option_data": correct_opt_label, # Uses label (A/B) or ID? Target schema used "1" "2" (data_option) or "A" (label). 
                                                              # In 'verbal-ability.json', correct_option_data was "1" (the data_option).
                                                              # Let's use the Index string.
                    "solution_text": solution_text,
                    "solution_image_url": None,
                    "full_markdown": build_full_markdown(q_id, q_text, options, correct_opt_label, solution_text)
                }
                
                # Fix correct_option_data to match data_option
                for opt in options:
                    if opt['is_correct']:
                        entry['correct_option_data'] = opt['data_option']
                
                all_questions.append(entry)
        else:
            print("Failed to find injected JSON data.")
            # Fallback or debug
            # print(soup.prettify()[:1000])

        # Save
        final_data = {"questions": all_questions}
        os.makedirs(os.path.dirname(output_file_path), exist_ok=True)
        
        with open(output_file_path, "w", encoding='utf-8') as f:
            json.dump(final_data, f, indent=2, ensure_ascii=False)
            
        print(f"Success! Scraped {len(all_questions)} questions to {output_file_path}")

async def main_batch():
    for url, output_file in SCRAPE_CONFIG:
        print(f"\nExample: Starting scrape for {output_file}...")
        # Update global target for the scraper function (or pass it as arg if refactored, 
        # but for minimal change we can set the global if the function uses it, 
        # however, it's better to modify scrape_upsc_review to accept arguments)
        
        # Since scrape_upsc_review uses global constants, we need to pass them or refactor.
        # Let's refactor the call slightly to pass these as arguments to a wrapper or modify the logic.
        
        # Actually, looking at the code, `TARGET_URL` and `OUTPUT_FILE` are global.
        # We should modify the `scrape_upsc_review` signature.
        await scrape_upsc_review(url, output_file)
        print(f"Finished {output_file}")

if __name__ == "__main__":
    asyncio.run(main_batch())
