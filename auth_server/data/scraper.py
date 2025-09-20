import asyncio
import os
from datetime import datetime
from crawl4ai import AsyncWebCrawler

def get_todays_links(file_path):
    """Parses the markdown file to get the links for today's date."""
    today_str = datetime.now().strftime('%Y-%m-%d')
    links = []
    in_todays_section = False
    with open(file_path, 'r') as f:
        for line in f:
            line = line.strip()
            if line.startswith('## '):
                in_todays_section = (line == f'## {today_str}')
            elif in_todays_section and line.startswith('- '):
                links.append(line[2:])
    return links

async def main():
    """Main function to scrape and save articles."""
    links_file = 'hindu_epaper_links.md'
    todays_links = get_todays_links(links_file)

    if not todays_links:
        print("No links found for today.")
        return

    today_str = datetime.now().strftime('%Y-%m-%d')
    output_dir = os.path.join(os.path.dirname(__file__), today_str)
    os.makedirs(output_dir, exist_ok=True)

    print(f"Found {len(todays_links)} links for today. Scraping...")

    async with AsyncWebCrawler() as crawler:
        for i, link in enumerate(todays_links):
            print(f"Scraping {link}...")
            try:
                result = await crawler.arun(url=link, output_format="markdown")
                
                if result and hasattr(result, "markdown") and result.markdown:
                    file_name = f"{i + 1}.md"
                    file_path = os.path.join(output_dir, file_name)
                    with open(file_path, 'w', encoding='utf-8') as f:
                        f.write(result.markdown)
                    print(f"Saved article to {file_path}")
                else:
                    print(f"No content extracted from {link}")

            except Exception as e:
                print(f"An error occurred while scraping {link}: {e}")

if __name__ == '__main__':
    try:
        import crawl4ai
    except ImportError:
        print("crawl4ai is not installed. Please install it using 'pip install -U crawl4ai'")
    else:
        asyncio.run(main())
