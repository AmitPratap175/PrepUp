import requests
from bs4 import BeautifulSoup
import re
from datetime import datetime
from urllib.parse import urljoin, urlparse, parse_qs
from .models import PIBRelease
# Import ai separately to avoid circular check if needed, but here structure is fine
from .pib_ai import generate_pib_content_ai

BASE_URL = "https://www.pib.gov.in/allRel.aspx?reg=3&lang=1"
RELEASE_BASE_URL = "https://www.pib.gov.in/PressReleasePage.aspx"

def fetch_pib_releases(limit=10):
    try:
        print(f"Fetching from {BASE_URL}...")
        response = requests.get(BASE_URL)
        response.raise_for_status()
        soup = BeautifulSoup(response.content, 'html.parser')

        # Extract Date - defaulting to today if parsing fails
        date_obj = datetime.now()
        try:
            day = soup.select_one('#ctl00_ContentPlaceHolder1_ddlday option[selected="selected"]')
            month = soup.select_one('#ctl00_ContentPlaceHolder1_ddlMonth option[selected="selected"]')
            year = soup.select_one('#ctl00_ContentPlaceHolder1_ddlYear option[selected="selected"]')
            
            if day and month and year:
                 date_str = f"{day.get_value()}-{month.get_text()}-{year.get_value()}" # Check if values are correct?
                 # Actually inspecting the HTML in browser tool showed values in select options. 
                 # Let's assume standard scraping.
                 pass
        except:
            pass
        
        releases = []
        links = soup.select('a[href*="PressReleasePage.aspx"]')
        
        print(f"Found {len(links)} links")
        
        count = 0
        added_count = 0
        
        unique_links = []
        seen_prids = set()
        
        for link in links:
            href = link.get('href')
            full_url = urljoin(BASE_URL, href)
            parsed = urlparse(full_url)
            qs = parse_qs(parsed.query)
            prid = qs.get('PRID', [None])[0]
            
            if not prid or prid in seen_prids:
                continue
            seen_prids.add(prid)
            unique_links.append((link, prid, full_url))

        for link, prid, full_url in unique_links:
            if count >= limit:
                break
                
            if PIBRelease.objects.filter(prid=prid).exists():
                continue
            
            title = link.get_text(strip=True)
            ministry = "Unknown"
            # Try to find ministry (previous header) - simplified for now
            
            print(f"Processing {prid}: {title}")
            
            # Fetch details
            try:
                # Need to be careful with requests vs browser simulation
                # Some ASPX pages require session state / viewstate. 
                # But typically direct GET to PressReleasePage.aspx?PRID=... works.
                det_resp = requests.get(full_url)
                det_resp.raise_for_status()
                det_soup = BeautifulSoup(det_resp.content, 'html.parser')
                
                # Extract content
                # browser subagent said: div.innner-page-main-about-us-content-right-part or just paragraphs
                # Also .ReleaseText
                content_div = det_soup.select_one('.ReleaseText') or det_soup.select_one('div.innner-page-main-about-us-content-right-part')
                
                content_text = ""
                if content_div:
                    content_text = content_div.get_text(separator="\n\n", strip=True)
                else:
                    # Fallback
                    content_text = det_soup.get_text(separator="\n\n", strip=True)
                
                 # Extract explicit Date if possible
                date_div = det_soup.select_one('.ReleaseDateSubHeaddateTime')
                if date_div:
                    # Parse date string "02 FEB 2026 5:00PM by PIB Delhi"
                    # Simplified: just use now() or parsed date from list
                    pass

                # Agent Generation
                summary, quiz, mains_questions = generate_pib_content_ai(content_text)
                
                release = PIBRelease.objects.create(
                    prid=prid,
                    title=title,
                    ministry=ministry, # TODO: improve ministry extraction
                    date=date_obj, 
                    content=content_text,
                    summary=summary,
                    quiz_data=quiz,
                    mains_questions=mains_questions,
                    original_url=full_url
                )
                releases.append(release)
                added_count += 1
                count += 1
                
            except Exception as e:
                print(f"Error fetching {prid}: {e}")
                continue
        
        print(f"Added {added_count} new releases.")
        return releases

    except Exception as e:
        print(f"Scrape error: {e}")
        return []
