# get_urls.py
import asyncio
import re
from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig, CacheMode
from bs4 import BeautifulSoup

async def generate_urls():
    url = "https://cracku.in/ssc-cgl-previous-papers"
    print(f"Crawling index page: {url} ...")
    
    async with AsyncWebCrawler(config=BrowserConfig()) as crawler:
        run_config = CrawlerRunConfig(cache_mode=CacheMode.BYPASS)
        result = await crawler.arun(url=url, config=run_config)
        
        if not result.success:
            print(f"Failed to crawl the page: {result.error_message}")
            return
            
        soup = BeautifulSoup(result.html, 'html.parser')
        
        base_url = "https://cracku.in"
        links = set()
        
        # Find all anchor tags
        for a in soup.find_all('a', href=True):
            href = a['href']
            # Filter for links that look like actual question paper pages
            if "ssc-cgl" in href and "shift" in href and "question-paper-solved" in href:
                # Ensure it's a full URL
                if not href.startswith("http"):
                    full_url = base_url + href if href.startswith("/") else f"{base_url}/{href}"
                else:
                    full_url = href
                links.add(full_url)
        
        # Save to the text file
        with open("urls_ssc.txt", "w", encoding="utf-8") as f:
            for link in sorted(links):
                f.write(link + "\n")
                
        print(f"Success! Saved {len(links)} URLs to urls_ssc.txt")

if __name__ == "__main__":
    asyncio.run(generate_urls())