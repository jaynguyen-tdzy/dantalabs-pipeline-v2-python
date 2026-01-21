# backend/check_models.py
import os
import requests
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GOOGLE_API_KEY")

if not api_key:
    print("❌ Lỗi: Chưa tìm thấy GOOGLE_API_KEY trong file .env")
else:
    url = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"
    response = requests.get(url)
    
    if response.status_code == 200:
        print("✅ Các model khả dụng cho Key của bạn:")
        models = response.json().get('models', [])
        for m in models:
            # Chỉ in ra các model tạo nội dung (generateContent)
            if "generateContent" in m['supportedGenerationMethods']:
                print(f" - {m['name']}") # Ví dụ: models/gemini-pro
    else:
        print(f"❌ Lỗi API: {response.status_code}")
        print(response.text)