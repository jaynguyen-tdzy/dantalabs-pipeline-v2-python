# backend/services/gemini.py

import os
import requests
import json
from dotenv import load_dotenv

load_dotenv()

class GeminiClient:
    def __init__(self):
        self.api_key = os.getenv("GOOGLE_API_KEY")
        # Dùng model 1.5 Flash cho ổn định
        self.base_url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"

    def generate_with_search(self, prompt: str, use_grounding: bool = True):
        headers = {"Content-Type": "application/json"}
        
        # Cấu trúc payload chuẩn
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.3, # Nhiệt độ thấp để AI ít "chém gió"
                "response_mime_type": "application/json" 
            }
        }

        # Kích hoạt Google Search Grounding
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
            url = f"{self.base_url}?key={self.api_key}"
            print(f"📡 Sending request to Gemini...")
            
            response = requests.post(url, headers=headers, json=payload, timeout=60)
            response.raise_for_status() # Báo lỗi nếu HTTP status != 200
            
            data = response.json()
            
            # Trích xuất text an toàn
            try:
                text_content = data['candidates'][0]['content']['parts'][0]['text']
                return text_content
            except (KeyError, IndexError):
                # Trường hợp có grounding, đôi khi text nằm ở part thứ 2
                try:
                    text_content = data['candidates'][0]['content']['parts'][1]['text']
                    return text_content
                except:
                    print("❌ Gemini response parsing failed:", data)
                    return None

        except Exception as e:
            print(f"❌ API Error: {str(e)}")
            return None