import asyncio
import json
import os
import re
from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig, CacheMode
from bs4 import BeautifulSoup

# Configuration
# List of (URL, Output Filename) tuples
# User can fill in the URLs for the corresponding years
SCRAPE_CONFIG = [
    # Prelims 2025 (Attempt Online)
    ("https://courses.upscprep.com/exams/review/34553/answers/", "auth_server/data/upsc/years/upsc_prelims_2025.json"),

    # Prelims 2024 (Attempt Online)
    ("https://courses.upscprep.com/exams/review/34552/answers/", "auth_server/data/upsc/years/upsc_prelims_2024.json"),

    # Prelims 2023 (Attempt Online)
    ("https://courses.upscprep.com/exams/review/34551/answers/", "auth_server/data/upsc/years/upsc_prelims_2023.json"),

    # Prelims 2022 (Attempt Online)
    ("https://courses.upscprep.com/exams/review/34550/answers/", "auth_server/data/upsc/years/upsc_prelims_2022.json"),

    # Prelims 2021 (Attempt online)
    ("https://courses.upscprep.com/exams/review/34549/answers/", "auth_server/data/upsc/years/upsc_prelims_2021.json"),

    # Prelims 2020 (Attempt Online)
    ("https://courses.upscprep.com/exams/review/34548/answers/", "auth_server/data/upsc/years/upsc_prelims_2020.json"),

    # Prelims 2019 (Attempt Online)
    ("https://courses.upscprep.com/exams/review/34547/answers/", "auth_server/data/upsc/years/upsc_prelims_2019.json"),

    # Prelims 2018 (Attempt Online)
    ("https://courses.upscprep.com/exams/review/34546/answers/", "auth_server/data/upsc/years/upsc_prelims_2018.json"),

    # Prelims 2017 (Attempt Online)
    ("https://courses.upscprep.com/exams/review/34545/answers/", "auth_server/data/upsc/years/upsc_prelims_2017.json"),

    # Prelims 2016 (Attempt Online)
    ("https://courses.upscprep.com/exams/review/34542/answers/", "auth_server/data/upsc/years/upsc_prelims_2016.json"),

    # Prelims 2015 (Attempt online)
    ("https://courses.upscprep.com/exams/review/34531/answers/", "auth_server/data/upsc/years/upsc_prelims_2015.json"),
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
        delay_before_return_html=15000.0, # Wait for API fetch loop
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
                
                q_obj = item.get('question', {})
                q_id = q_obj.get('id', f"upsc-{idx}")
                q_text = q_obj.get('question_html', '') or q_obj.get('text', '')
                q_text = BeautifulSoup(q_text, 'html.parser').get_text(separator="\n", strip=True)
                
                # Options
                options = []
                correct_opt_label = None
                
                answers = q_obj.get('answers', [])
                
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
                    "passage_text": None, 
                    "question_text": q_text,
                    "image_url": None,
                    "options": options,
                    "correct_option_data": correct_opt_label, 
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
        await scrape_upsc_review(url, output_file)
        print(f"Finished {output_file}")

if __name__ == "__main__":
    asyncio.run(main_batch())
