
import os
import requests
from dotenv import load_dotenv

load_dotenv(".env.local")
load_dotenv("backend/.env")

print(f"CWD: {os.getcwd()}")
print(f"backend/.env exists: {os.path.exists('backend/.env')}")
print(f"full path backend/.env: {os.path.abspath('backend/.env')}")

google_api_key = os.getenv("GOOGLE_API_KEY")
print(f"Key loaded: {bool(google_api_key)}")
if google_api_key:
    print(f"Key start: {google_api_key[:5]}...")


def get_real_pagespeed(url: str):
    """Lấy điểm PageSpeed thật từ Google"""
    print(f"Testing URL: {url}")
    print(f"API Key present: {bool(google_api_key)}")
    
    if not url or not google_api_key: 
        print("Missing URL or API Key")
        return 0
    try:
        api_url = f"https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url={url}&strategy=mobile&key={google_api_key}"
        print(f"Requesting: {api_url.replace(google_api_key, 'HIDDEN_KEY')}")
        res = requests.get(api_url, timeout=30)
        print(f"Status Code: {res.status_code}")
        
        if res.status_code == 200:
            data = res.json()
            score = data['lighthouseResult']['categories']['performance']['score']
            print(f"Score: {score}")
            return int(score * 100)
        else:
            print(f"Error Response: {res.text}")
            
    except Exception as e:
        print(f"⚠️ PageSpeed Error for {url}: {e}")
    return 0

if __name__ == "__main__":
    # Test with a known site
    s = get_real_pagespeed("https://www.google.com")
    print(f"Final Score: {s}")
