import os
import sys
import asyncio
import re
from pathlib import Path
from bs4 import BeautifulSoup
from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig, CacheMode

# --- HTML to Markdown Conversion Logic ---
def convert_html_to_md(html_content, output_md_path):
    """
    Parses iQuanta HTML content and extracts the PDF content to Markdown.
    """
    print("Parsing HTML content...")
    soup = BeautifulSoup(html_content, 'html.parser')
    
    markdown_content = "# GK Compendium - Economics\n\n"
    
    # Strategy 1: Look for .textLayer (common in PDF.js renderers)
    text_layers = soup.find_all(class_='textLayer')
    
    if text_layers:
        print(f"Found {len(text_layers)} text layers (pages).")
        for i, layer in enumerate(text_layers):
            markdown_content += f"\n## Page {i + 1}\n\n"
            
            # Extract spans and sort them by 'top' style to ensure reading order
            spans = layer.find_all('span')
            span_data = []
            
            for span in spans:
                style = span.get('style', '')
                top_value = 0.0
                # Parse style="top: 123.45px;"
                for part in style.split(';'):
                    if 'top' in part:
                        try:
                            top_value = float(part.split(':')[1].replace('px', '').strip())
                        except ValueError:
                            pass
                        break
                span_data.append({'text': span.get_text(strip=True), 'top': top_value})
            
            # Sort by vertical position
            span_data.sort(key=lambda x: x['top'])
            
            # Join text
            page_text = ' '.join([s['text'] for s in span_data])
            markdown_content += page_text + "\n\n---\n"
            
    else:
        print("No .textLayer found. Trying generic page detection...")
        # Strategy 2: Look for generic page containers
        pages = soup.find_all(lambda tag: tag.name == 'div' and ('page' in tag.get('class', []) or 'Page' in tag.get('class', [])))
        
        if pages:
             for i, page in enumerate(pages):
                text = page.get_text(strip=True)
                if len(text) > 50: # Filter out small nav elements
                    markdown_content += f"\n## Page {i + 1}\n\n"
                    markdown_content += text + "\n\n---\n"
        else:
            print("No specific pages found. Dumping body text.")
            markdown_content += soup.body.get_text(separator='\n\n', strip=True)

    print(f"Writing Markdown to {output_md_path}...")
    with open(output_md_path, 'w', encoding='utf-8') as f:
        f.write(markdown_content)
    print("Markdown conversion done!")

# --- Scraping Logic ---
async def scrape_iquanta_pdf():
    url = "https://www.iquanta.in/v1/dashboard/my-courses/file/GK%20Compendium%20-%20Economics/816/1072/32587"
    output_html_path = Path("auth_server/data/iquanta_economics.html")
    output_md_path = Path("GK_Compendium_Economics.md")

    # Use the same browser profile path as the reference script
    user_data_dir = str(Path.home() / "snap/chromium/common/chromium/Default")
    
    print(f"Starting scraper for: {url}")
    print(f"Using browser profile: {user_data_dir}")

    browser_config = BrowserConfig(
        verbose=True,
        headless=False, # Set to False so user can see what's happening (optional, but good for debugging)
        use_persistent_context=True,
        use_managed_browser=True,
        browser_type="chromium",
        user_data_dir=user_data_dir
    )
    
    run_config = CrawlerRunConfig(
        scan_full_page=True,
        js_code=[
            # Scroll to bottom to trigger lazy loading
            "window.scrollTo(0, document.body.scrollHeight);",
            # Wait a bit more for images/text to render
            "new Promise(r => setTimeout(r, 5000));" 
        ],
        delay_before_return_html=5.0, # Wait 5 seconds after scrolling
    )

    async with AsyncWebCrawler(config=browser_config) as crawler:
        result = await crawler.arun(url, config=run_config, magic=True)
        
        if result and result.html:
            print(f"Successfully crawled page. HTML length: {len(result.html)}")
            
            # Save HTML
            with open(output_html_path, "w", encoding="utf-8") as f:
                f.write(result.html)
            print(f"Saved HTML to {output_html_path}")
            
            # Convert to Markdown
            convert_html_to_md(result.html, output_md_path)
            
        else:
            print("Failed to retrieve HTML content.")

if __name__ == "__main__":
    asyncio.run(scrape_iquanta_pdf())
