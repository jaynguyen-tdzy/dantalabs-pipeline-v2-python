import os
import requests
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from supabase import create_client, Client
from apify_client import ApifyClient
from dotenv import load_dotenv

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
    except: pass
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
        
    except:
        return {"is_wordpress": False, "crm": None}

@router.post("/")
async def start_scan(payload: ScanRequest):
    print(f"🔍 Scan: {payload.keyword} in {payload.location}")
    
    # 1. Gọi Apify (Google Maps)
    run_input = {
        "searchStringsArray": [f"{payload.keyword} in {payload.location}"],
        "maxCrawledPlacesPerSearch": payload.limit,
        "language": "en", "maxImages": 0
    }
    
    try:
        run = apify_client.actor("compass/crawler-google-places").call(run_input=run_input)
        dataset = apify_client.dataset(run["defaultDatasetId"]).list_items()
        items = dataset.items
        
        if not items: return {"success": False, "message": "No results"}

        processed = []
        for item in items:
            website = item.get('website')
            if not website: continue # Bỏ qua nếu ko có web
            
            # --- FEATURE PARITY: Chạy đủ 3 luồng check ---
            speed = get_real_pagespeed(website)
            tech = detect_tech_stack(website) # <-- Đã thêm lại logic này
            has_ssl = website.startswith("https")
            
            # Logic: Web chậm, ko SSL hoặc dùng Wordpress là tiềm năng
            is_qualified = speed < 50 or not has_ssl or tech['is_wordpress']
            
            processed.append({
                "name": item.get('title'),
                "website_url": website,
                "google_maps_url": item.get('url'),
                "industry": item.get('categoryName', 'Unknown'),
                "address": item.get('address'),
                "phone": item.get('phone'),
                "has_ssl": has_ssl,
                "pagespeed_score": speed,
                "is_wordpress": tech['is_wordpress'],
                "crm_system": tech['crm'], # <-- Trường này DB cần có
                "status": "QUALIFIED" if is_qualified else "DISQUALIFIED",
                "disqualify_reason": None if is_qualified else "High Performance Site",
                "search_keyword": f"{payload.keyword} - {payload.location}"
            })
            
        if processed:
            data = supabase.table("companies").insert(processed).execute()
            return {"success": True, "count": len(processed), "data": data.data}
            
        return {"success": True, "message": "No valid targets found"}

    except Exception as e:
        print(f"🔥 Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))