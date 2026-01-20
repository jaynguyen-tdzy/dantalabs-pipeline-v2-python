import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/contacts", tags=["Contacts"])

supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)

class UpdateStatusRequest(BaseModel):
    id: str
    status: str

@router.post("/update-status")
async def update_contact_status(payload: UpdateStatusRequest):
    try:
        data = supabase.table("contacts").update({"status": payload.status}).eq("id", payload.id).execute()
        return {"success": True, "data": data.data}
    except Exception as e:
        print(f"❌ Update Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))