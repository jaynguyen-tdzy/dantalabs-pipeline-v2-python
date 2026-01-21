# backend/services/gemini.py
import os
import requests
import json
from dotenv import load_dotenv

load_dotenv()

class GeminiClient:
    def __init__(self):
        self.api_key = os.getenv("GOOGLE_API_KEY")
        # Sử dụng model ổn định. Nếu vẫn lỗi 404, hãy thử đổi thành "gemini-pro"
        self.model = "gemini-1.5-turbo" 
        self.base_url = "https://generativelanguage.googleapis.com/v1beta/models"

    def generate_with_search(self, prompt: str, use_grounding: bool = True):
        headers = {"Content-Type": "application/json"}
        
        # Cấu trúc payload chuẩn
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.3, # Nhiệt độ thấp để AI tập trung vào sự thật
                "response_mime_type": "application/json" 
            }
        }

        # Kích hoạt Google Search Grounding (công cụ tìm kiếm)
        if use_grounding:
            payload["tools"] = [{
                "google_search_retrieval": {
                    "dynamic_retrieval_config": {
                        "mode": "MODE_DYNAMIC",
                        "dynamic_threshold": 0.3
                    }
                }
            }]

        try:
            # Xây dựng URL động chuẩn xác
            url = f"{self.base_url}/{self.model}:generateContent?key={self.api_key}"
            print(f"📡 Sending request to Gemini ({self.model})...")
            
            response = requests.post(url, headers=headers, json=payload, timeout=60)
            
            # Kiểm tra lỗi HTTP chi tiết
            if response.status_code != 200:
                print(f"❌ API Error Status: {response.status_code}")
                print(f"❌ API Error Body: {response.text}")
                return None
            
            data = response.json()
            
            # Trích xuất text an toàn (xử lý trường hợp Grounding trả về nhiều part)
            try:
                candidates = data.get('candidates', [])
                if not candidates:
                    print("⚠️ No candidates returned from Gemini.")
                    return None
                
                content = candidates[0].get('content', {})
                parts = content.get('parts', [])
                
                # Gom tất cả các phần text lại (bỏ qua phần functionCall nếu có)
                full_text = ""
                for part in parts:
                    if 'text' in part:
                        full_text += part['text']
                        
                if not full_text:
                    print("⚠️ Empty text returned from Gemini.")
                    return None

                return full_text

            except (KeyError, IndexError, TypeError) as parse_error:
                print(f"❌ Gemini response parsing failed: {parse_error}")
                print("Data received:", data)
                return None

        except Exception as e:
            print(f"❌ API Exception: {str(e)}")
            return None