import os
import json
import requests
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from supabase import create_client, Client
from services.gemini import GeminiClient
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/enrich", tags=["Enrichment"])

supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)

gemini_client = GeminiClient()

class EnrichRequest(BaseModel):
    companyId: str
    companyName: str

@router.post("")
async def enrich_company(payload: EnrichRequest):
    print(f"🕵️‍♂️ AI Enriching Decision Makers for: {payload.companyName}")
    
    # 1. Prompt Logic (Sử dụng Grounding - AI tự Search)
    prompt = f"""
    Find 1 to 5 key decision makers (CEO, Founder, CTO, Marketing Director) for the company "{payload.companyName}".
    
    TASK:
    - Search for their real names and LinkedIn profiles on the web.
    - Verify they are currently working there.
    - If found, extract details. If not found, do NOT invent names.

    OUTPUT JSON FORMAT (Array):
    [
      {{
        "full_name": "Name",
        "position": "Role",
        "linkedin_url": "URL or null",
        "email": "null"
      }}
    ]
    """

    # 2. Gọi Gemini với công cụ Search
    try:
        response_text = gemini_client.generate_with_search(prompt)
        
        if not response_text:
            return {"success": False, "message": "AI could not find information."}

        if not response_text:
            return {"success": False, "message": "AI could not find information."}

        # 3. Clean & Parse JSON (Sử dụng Helper mới)
        parsed_contacts = gemini_client.clean_and_parse_json(response_text)

        if not parsed_contacts:
             return {"success": False, "message": "No contacts found."}

        # 4. Lưu vào Supabase
        contacts_to_save = []
        for c in parsed_contacts:
            contacts_to_save.append({
                "company_id": payload.companyId,
                "full_name": c.get("full_name"),
                "position": c.get("position"),
                "linkedin_url": c.get("linkedin_url"),
                "email": c.get("email"),
                "is_primary_decision_maker": True # Tạm coi AI tìm ra là quan trọng
            })
            
        if contacts_to_save:
            supabase.table("contacts").insert(contacts_to_save).execute()
            print(f"✅ Saved {len(contacts_to_save)} contacts.")
            return {"success": True, "data": contacts_to_save}
            
        return {"success": True, "message": "AI analysis complete but no valid contacts extracted."}

    except Exception as e:
        print(f"❌ Enrich Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))