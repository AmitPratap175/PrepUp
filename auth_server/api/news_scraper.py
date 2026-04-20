import os
from datetime import datetime, timedelta, timezone as dt_timezone
import hashlib
import requests
from bs4 import BeautifulSoup
from newsapi import NewsApiClient
from django.utils import timezone
from .models import NewsArticle

def extract_full_article_content(url, fallback_content):
    """
    Attempts to fetch the full article content natively since NewsAPI truncates.
    """
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
    try:
        response = requests.get(url, headers=headers, timeout=10)
        soup = BeautifulSoup(response.content, 'html.parser')
        paragraphs = soup.find_all('p')
        text = '\n\n'.join([p.get_text().strip() for p in paragraphs if len(p.get_text().strip()) > 30])
        
        if len(text) > len(fallback_content):
            return text
        return fallback_content
    except Exception as e:
        print(f"Extraction failed for {url}: {e}")
        return fallback_content

def fetch_the_hindu_upsc_news():
    """
    Fetches UPSC relevant news from The Hindu via NewsAPI.
    """
    api_key = os.environ.get('NEWSAPI_KEY')
    if not api_key:
        print("NEWSAPI_KEY is not set in environment variables.")
        return []

    try:
        newsapi = NewsApiClient(api_key=api_key)
        
        # Calculate date range (strictly today and yesterday)
        today = datetime.now()
        yesterday = today - timedelta(days=1)
        today_str = today.strftime('%Y-%m-%d')
        yesterday_str = yesterday.strftime('%Y-%m-%d')
        
        # Query parameters specifically targeted for UPSC Preparation from The Hindu
        query = 'UPSC OR "Civil Services" OR "Supreme Court" OR Parliament OR Economy OR Environment OR "International Relations" OR Governance'
        
        print(f"Fetching from NewsAPI for domains=thehindu.com, from {yesterday_str} to {today_str}...")
        all_articles = newsapi.get_everything(
            q=query,
            domains='thehindu.com',
            from_param=yesterday_str,
            to=today_str,
            language='en',
            sort_by='relevancy',
            page_size=10  # Cap the fetching
        )
        
        print("Fetching top headlines for The Hindu...")
        top_headlines_res = newsapi.get_top_headlines(
            sources='the-hindu',
            language='en',
            page_size=15
        )
        
        articles = all_articles.get('articles', [])
        top_articles = top_headlines_res.get('articles', [])
        
        print(f"Found {len(articles)} everything articles and {len(top_articles)} top headlines.")
        
        # Combine and deduplicate articles list (in case of overlap)
        combined_articles = []
        seen_urls = set()
        for item in articles + top_articles:
            if item.get('url') and item['url'] not in seen_urls:
                seen_urls.add(item['url'])
                combined_articles.append(item)
                
        saved_articles = []
        added_count = 0
        
        for item in combined_articles:
            url = item.get('url')
            if not url:
                continue
                
            # Create a unique ID using the URL
            article_id = hashlib.md5(url.encode('utf-8')).hexdigest()
            
            article = NewsArticle.objects.filter(article_id=article_id).first()
            if article:
                # Self heal already scraped truncated articles
                if "[+" in article.content or len(article.content) < 500:
                    base_content = item.get('content', '') or item.get('description', '')
                    new_content = extract_full_article_content(url, base_content)
                    if len(new_content) > len(article.content) and "[+" not in new_content:
                        article.content = new_content
                        article.save()
                        print(f"Healed truncated article: {article.title[:30]}")
                continue
                
            title = item.get('title', 'Unknown Title')
            author = item.get('author', 'Unknown Author')
            source = item.get('source', {}).get('name', 'The Hindu')
            published_at = item.get('publishedAt')
            
            # Content parsing. 
            base_content = item.get('content', '') or item.get('description', '')
            
            if not base_content:
                continue
                
            print(f"Processing: {title[:50]}...")
            content = extract_full_article_content(url, base_content)
            
            # Generate summary, quiz, mains questions using Gemini
            # Done on demand now.
            
            # Parse date string to datetime if available
            date_obj = timezone.now()
            if published_at:
                try:
                     date_obj = datetime.strptime(published_at, '%Y-%m-%dT%H:%M:%SZ')
                     # Make timezone aware
                     date_obj = timezone.make_aware(date_obj, dt_timezone.utc)
                except ValueError:
                     pass
                     
            news_article = NewsArticle.objects.create(
                article_id=article_id,
                title=title[:500],
                source=source,
                author=author[:255] if author else None,
                date=date_obj,
                content=content,
                summary=None,
                quiz_data=None,
                mains_questions=None,
                original_url=url
            )
            saved_articles.append(news_article)
            added_count += 1
            
        print(f"Added {added_count} new news articles.")
        return saved_articles
        
    except Exception as e:
        print(f"NewsAPI fetch error: {e}")
        return []

if __name__ == "__main__":
    fetch_the_hindu_upsc_news()
