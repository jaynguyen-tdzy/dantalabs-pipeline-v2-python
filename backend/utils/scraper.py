import requests
from bs4 import BeautifulSoup
import re
from urllib.parse import urljoin

def scrape_company_website(url: str):
    """
    Scrapes the given URL to extract:
    - Emails (mailto:)
    - Social Media Links (LinkedIn, Facebook, Instagram, Twitter/X, Youtube)
    - Meta Description
    """
    if not url:
        return {"emails": [], "socials": {}, "description": ""}

    # Add protocol if missing
    if not url.startswith("http"):
        url = "https://" + url

    try:
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}
        response = requests.get(url, headers=headers, timeout=10)
        
        if response.status_code != 200:
            return {"emails": [], "socials": {}, "description": ""}

        soup = BeautifulSoup(response.text, 'html.parser')
        
        # 1. Extract Meta Description
        description = ""
        meta_desc = soup.find("meta", attrs={"name": "description"}) or soup.find("meta", attrs={"property": "og:description"})
        if meta_desc:
            description = meta_desc.get("content", "").strip()

        # 2. Extract Emails
        emails = set()
        # Regex for simple email finding in text
        text_emails = re.findall(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', response.text)
        for email in text_emails:
            # Basic filtering to avoid junk
            if not email.endswith(('.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp')):
                emails.add(email)
        
        # Also check mailto links specifically
        for a in soup.find_all('a', href=True):
            href = a['href']
            if href.startswith('mailto:'):
                email = href.replace('mailto:', '').split('?')[0]
                if email:
                    emails.add(email)

        # 3. Extract Socials
        socials = {}
        social_patterns = {
            "linkedin": r"linkedin\.com/(?:company|in)/",
            "facebook": r"facebook\.com/",
            "instagram": r"instagram\.com/",
            "twitter": r"(?:twitter\.com|x\.com)/",
            "youtube": r"youtube\.com/"
        }

        for a in soup.find_all('a', href=True):
            href = a['href']
            full_url = urljoin(url, href)
            
            for platform, pattern in social_patterns.items():
                if re.search(pattern, full_url):
                    # Keep the first finding per platform usually or list them
                    if platform not in socials:
                        socials[platform] = full_url

        return {
            "emails": list(emails),
            "socials": socials,
            "description": description
        }

    except Exception as e:
        print(f"⚠️ Scraper Error for {url}: {e}")
        return {"emails": [], "socials": {}, "description": ""}
