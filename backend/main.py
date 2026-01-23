import os
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# --- FIX: Load biến môi trường NGAY LẬP TỨC ---
load_dotenv()

# --- FIX: Add current directory to sys.path for Vercel ---
import sys
from pathlib import Path

# Thêm thư mục chứa main.py vào sys.path để Python tìm thấy module 'routers'
ROOT_DIR = Path(__file__).resolve().parent
if str(ROOT_DIR) not in sys.path:
    sys.path.append(str(ROOT_DIR))

# Import routers sau khi đã load env và fix path
from routers import scan, enrich, draft, contacts

app = FastAPI(
    title="DantaLabs Pipeline API",
    description="Python Backend Service (FastAPI)",
    version="1.0.0"
)

# Cấu hình CORS (Để Frontend Next.js gọi được)
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Kết nối Router
app.include_router(scan.router)
app.include_router(enrich.router)
app.include_router(draft.router)
app.include_router(contacts.router)

@app.get("/")
def health_check():
    return {"status": "active", "service": "DantaLabs Backend Running 🚀"}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)