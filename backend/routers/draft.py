import os
import json
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.gemini import GeminiClient
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/draft", tags=["Drafting"])
gemini_client = GeminiClient()

class DraftRequest(BaseModel):
    contactName: str
    position: str
    companyName: str
    website: str = ""
    industry: str = "Unknown"
    hasSSL: bool = True
    pageSpeed: int = 0

# Profile Danta Labs (Giữ nguyên từ code cũ)
DANTA_PROFILE = """
  - COMPANY: Danta Labs
  - MISSION: Build, Scale & Deploy Enterprise AI Agents.
  - PRODUCTS: Maestro (Orchestration), Quack (Sales Agent), Colectia (Debt Collection).
  - FOUNDERS: Samuel & Santiago.
"""

@router.post("/")
async def generate_draft(payload: DraftRequest):
    print(f"✍️ Drafting email for: {payload.contactName} at {payload.companyName}")
    
    prompt = f"""
      ROLE: You are "Sam", CEO at Danta Labs.
      YOUR PROFILE: {DANTA_PROFILE}

      TARGET:
      - Name: {payload.contactName} ({payload.position})
      - Company: {payload.companyName} ({payload.industry})
      - Web: {payload.website} (SSL: {payload.hasSSL}, Speed: {payload.pageSpeed}/100)

      TASK: 
      Write a B2B Cold Email.
      - If Finance/Retail -> Pitch "Colectia".
      - If Agency/Consulting -> Pitch "Quack".
      - If Tech -> Pitch "Maestro".
      
      TONE: Insightful, Direct. No fluff.
      OUTPUT JSON: {{ "subject": "...", "body": "..." }}
    """

    try:
        # Gọi Gemini thường (không cần Search)
        # Note: Hàm generate_with_search của chúng ta mặc định có search, 
        # nhưng vẫn dùng tốt cho task này vì nó sẽ dùng kiến thức nội tại.
        response_text = gemini_client.generate_with_search(prompt)
        
        if not response_text:
             raise Exception("AI returned empty response")

        clean_text = response_text.replace("```json", "").replace("```", "").strip()
        start = clean_text.find("{")
        end = clean_text.rfind("}")
        if start != -1 and end != -1:
            clean_text = clean_text[start:end+1]

        draft_data = json.loads(clean_text)
        return {"success": True, "data": draft_data}

    except Exception as e:
        print(f"❌ Draft Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))