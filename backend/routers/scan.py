import os
import requests
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from supabase import create_client, Client
from apify_client import ApifyClient
from dotenv import load_dotenv
from dotenv import load_dotenv
from utils.scraper import scrape_company_website
from services.gemini import GeminiClient

# Load env ngay lập tức để tránh lỗi Supabase URL missing
load_dotenv()

router = APIRouter(prefix="/scan", tags=["Scanning"])

# Kiểm tra an toàn trước khi khởi tạo
url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")
if not url or not key:
    print("⚠️ WARNING: SUPABASE_URL or KEY is missing in scan.py")

supabase: Client = create_client(url, key)
apify_client = ApifyClient(os.getenv("APIFY_API_TOKEN"))
google_api_key = os.getenv("GOOGLE_API_KEY")

class ScanRequest(BaseModel):
    keyword: str
    location: str = "Ho Chi Minh City"
    limit: int = 5

def get_real_pagespeed(url: str):
    """Lấy điểm PageSpeed thật từ Google"""
    if not url or not google_api_key: return 0
    try:
        api_url = f"https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url={url}&strategy=mobile&key={google_api_key}"
        res = requests.get(api_url, timeout=10)
        if res.status_code == 200:
            score = res.json()['lighthouseResult']['categories']['performance']['score']
            return int(score * 100)
            score = res.json()['lighthouseResult']['categories']['performance']['score']
            return int(score * 100)
    except Exception as e:
        print(f"⚠️ PageSpeed Error for {url}: {e}")
    return 0

def detect_tech_stack(url: str):
    """
    KIỂM TRA CÔNG NGHỆ (Giống file JS cũ)
    Check: WordPress, HubSpot, Salesforce, Zoho, Bitrix24
    """
    if not url: return {"is_wordpress": False, "crm": None}
    
    try:
        # Giả lập trình duyệt để không bị chặn
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'}
        res = requests.get(url, headers=headers, timeout=5)
        
        if res.status_code != 200: return {"is_wordpress": False, "crm": None}
        
        html = res.text.lower()
        
        # 1. Check WordPress
        is_wordpress = 'wp-content' in html or 'wp-includes' in html
        
        # 2. Check CRM
        crm = None
        if 'js.hs-scripts.com' in html or 'hubspot' in html: crm = "HubSpot"
        elif 'salesforce' in html or 'pardot' in html: crm = "Salesforce"
        elif 'zoho' in html: crm = "Zoho CRM"
        elif 'bitrix24' in html: crm = "Bitrix24"
        
        return {"is_wordpress": is_wordpress, "crm": crm}
        
        return {"is_wordpress": is_wordpress, "crm": crm}
        
    except Exception as e:
        print(f"⚠️ Tech Detect Error for {url}: {e}")
        return {"is_wordpress": False, "crm": None}

@router.post("/")
async def start_scan(payload: ScanRequest):
    print(f"🔍 Scan: {payload.keyword} in {payload.location}")
    
    # 0. Tối ưu từ khóa tìm kiếm bằng Gemini
    gemini_client = GeminiClient()
    optimized_data = gemini_client.optimize_search_term(payload.keyword, payload.location)
    
    search_query = f"{payload.keyword} in {payload.location}" # Fallback
    if optimized_data and optimized_data.get("q"):
        search_query = optimized_data["q"]
        print(f"✨ Optimized Scan Query: {search_query} (Original: {payload.keyword})")

    def normalize_text(text: str):
        import unicodedata
        return "".join(c for c in unicodedata.normalize("NFD", text) if unicodedata.category(c) != "Mn").lower()

    async def perform_search(query: str, strict_mode: bool = True):
        print(f"🚀 Running Scan with Query: {query} (Strict: {strict_mode})")
        run_input = {
            "searchStringsArray": [query],
            "maxCrawledPlacesPerSearch": payload.limit,
            "language": "en", "maxImages": 0
        }
        
        try:
            run = apify_client.actor("compass/crawler-google-places").call(run_input=run_input)
            dataset = apify_client.dataset(run["defaultDatasetId"]).list_items()
            items = dataset.items
            
            if not items: return []

            processed_items = []
            
            # Normalize location key safely
            raw_loc = payload.location.lower()
            norm_loc = normalize_text(raw_loc)
            
            # Define aliases
            valid_locs = [raw_loc, norm_loc]
            
            # 1. Handle "City" stripped version (e.g. "Ho Chi Minh City" -> "Ho Chi Minh")
            if "city" in norm_loc:
                valid_locs.append(norm_loc.replace("city", "").strip())
                
            # 2. Specific aliases for HCMC
            if "ho chi minh" in norm_loc or "hcm" in norm_loc:
                valid_locs.extend(["hcm", "hc", "saigon", "sai gon", "tp.hcm", "tphcm", "thanh pho ho chi minh"])
                
            print(f"DEBUG: Valid Locations: {valid_locs}")

            for item in items:
                # --- STRICT LOCATION CHECK (Only if strict_mode is True) ---
                if strict_mode:
                    address = item.get('address')
                    if not address: continue

                    address_norm = normalize_text(address)
                    
                    # Check if ANY valid location string is in the address
                    is_valid_loc = any(loc in address_norm for loc in valid_locs)
                    
                    if not is_valid_loc:
                        print(f"⚠️ Skipping result outside {payload.location}: {item.get('title')} ({address})")
                        continue

                website = item.get('website')
                if not website: continue 
                
                # --- PROCESSING ---
                speed = get_real_pagespeed(website)
                tech = detect_tech_stack(website) 
                scraped_data = scrape_company_website(website)
                has_ssl = website.startswith("https")
                is_qualified = speed < 50 or not has_ssl or tech['is_wordpress']
                
                processed_items.append({
                    "name": item.get('title'),
                    "website_url": website,
                    "google_maps_url": item.get('url'),
                    "industry": item.get('categoryName', 'Unknown'),
                    "address": item.get('address'),
                    "phone": item.get('phone'),
                    "has_ssl": has_ssl,
                    "pagespeed_score": speed,
                    "is_wordpress": tech['is_wordpress'],
                    "crm_system": tech['crm'], 
                    "emails": scraped_data['emails'],
                    "socials": scraped_data['socials'],
                    "description": scraped_data['description'],
                    "status": "QUALIFIED" if is_qualified else "DISQUALIFIED",
                    "disqualify_reason": None if is_qualified else "High Performance Site",
                    "search_keyword": query
                })
            return processed_items
        except Exception as e:
            print(f"🔥 Apify/Processing Error: {e}")
            return []

    # 1. First Attempt
    processed = await perform_search(search_query)
    
    # 2. Fallback if no results
    is_fallback = False
    suggestion = None
    
    if not processed:
        print("⚠️ No valid results found. Attempting fallback...")
        suggestion = gemini_client.suggest_better_query(payload.keyword, payload.location)
        
        if suggestion:
            print(f"💡 Fallback Query Suggestion: {suggestion}")
            # Relax strict check for fallback to ensure we get results
            processed = await perform_search(f"{suggestion} in {payload.location}", strict_mode=False)
            if processed:
                is_fallback = True

    # 3. Save & Return
    if processed:
        data = supabase.table("companies").insert(processed).execute()
        response = {
            "success": True, 
            "count": len(processed), 
            "data": data.data,
            "is_fallback": is_fallback,
            "fallback_keyword": suggestion if is_fallback else None
        }
        print(f"✅ returning success: {response.keys()}")
        return response
        
    response = {
        "success": False, 
        "message": f"No valid results found in {payload.location} even after fallback.",
        "suggestion": suggestion
    }
    print(f"❌ returning failure: {response}")
    return response