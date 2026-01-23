import os
import requests
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from supabase import create_client, Client
from apify_client import ApifyClient
from dotenv import load_dotenv
from utils.scraper import scrape_company_website
from services.gemini import GeminiClient
from utils.tech_detector import TechStackDetector

# Load env variables from multiple potential sources
if os.path.exists(".env.local"):
    load_dotenv(".env.local")
if os.path.exists("backend/.env"):
    load_dotenv("backend/.env")
load_dotenv() # Fallback to standard .env

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
    if not url or not google_api_key: return None
    try:
        api_url = f"https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url={url}&strategy=mobile&key={google_api_key}"
        res = requests.get(api_url, timeout=30)
        if res.status_code == 200:
            score = res.json()['lighthouseResult']['categories']['performance']['score']
            return int(score * 100)
        else:
            try:
                error_msg = res.json().get('error', {}).get('message', res.text)
            except:
                error_msg = res.text[:200]
            print(f"⚠️ PageSpeed API Error: {res.status_code} - {error_msg}")
    except Exception as e:
        print(f"⚠️ PageSpeed Error for {url}: {e}")
    return None

# (Empty - removed old detect_tech_stack function)

@router.post("/")
async def start_scan(payload: ScanRequest):
    print(f"🔍 Scan: {payload.keyword} in {payload.location}")
    
    # ... (Optimization logic remains same) ...
    # 0. Tối ưu từ khóa tìm kiếm bằng Gemini
    gemini_client = GeminiClient()
    tech_detector = TechStackDetector()
    optimized_data = gemini_client.optimize_search_term(payload.keyword, payload.location)
    
    search_query = f"{payload.keyword} in {payload.location}" # Fallback
    if optimized_data and optimized_data.get("q"):
        search_query = optimized_data["q"]
        print(f"✨ Optimized Scan Query: {search_query} (Original: {payload.keyword})")

    def normalize_text(text: str):
        import unicodedata
        return "".join(c for c in unicodedata.normalize("NFD", text) if unicodedata.category(c) != "Mn").lower()

    async def perform_search(query: str, strict_mode: bool = True):
        # ... (Search logic remains same) ...
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
                tech = tech_detector.detect(website)
                scraped_data = scrape_company_website(website)
                has_ssl = website.startswith("https")
                
                # QUALIFICATION LOGIC MATCHING USER REQUEST:
                # 1. PageSpeed < 50 (Only if speed is successfully fetched)
                # 2. No SSL
                # 3. Is WordPress
                # 4. No Agents Detected (If they don't have an agent, they are a lead)
                
                has_agent = len(tech.get('agents', [])) > 0
                
                # Check speed qualification only if we have a valid score
                is_slow = (speed is not None) and (speed < 50)
                
                is_qualified = is_slow or not has_ssl or tech['is_wordpress'] or not has_agent
                
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
                    "crm_system": ", ".join(tech['crm']) if tech['crm'] else None,
                    "tech_stack": {
                        "cms": tech['cms'],
                        "frontend": tech['frontend'],
                        "ecommerce": tech['ecommerce'],
                        "agents": tech.get('agents', [])
                    },
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