import os
import requests
import json
from dotenv import load_dotenv

load_dotenv()

class GeminiClient:
    def __init__(self):
        self.api_key = os.getenv("GOOGLE_API_KEY")
        # Dùng model ổn định hơn cho grounding
        self.base_url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"
        
    def generate_with_search(self, prompt: str, use_grounding: bool = True):
        headers = {"Content-Type": "application/json"}
        
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.5, # Giảm nhiệt độ để AI trả lời chính xác hơn
                "response_mime_type": "application/json"
            }
        }

        if use_grounding:
            payload["tools"] = [{
                "google_search_retrieval": {
                    "dynamic_retrieval_config": {
                        "mode": "MODE_DYNAMIC",
                        "dynamic_threshold": 0.6
                    }
                }
            }]

        try:
            url = f"{self.base_url}?key={self.api_key}"
            # Tăng timeout lên 60s vì Search tốn thời gian
            response = requests.post(url, headers=headers, json=payload, timeout=60)
            
            if response.status_code != 200:
                print(f"❌ Gemini API Error {response.status_code}: {response.text}")
                return None

            data = response.json()
            
            # Logic trích xuất text an toàn
            try:
                candidates = data.get("candidates", [])
                if not candidates:
                    print("❌ No candidates in Gemini response")
                    return None
                    
                content = candidates[0].get("content", {})
                parts = content.get("parts", [])
                
                if not parts:
                    print("❌ No parts in Gemini content")
                    return None
                    
                # Trường hợp có Grounding, text thường nằm ở part cuối cùng hoặc part có chứa text
                for part in parts:
                    if "text" in part:
                        return part["text"]
                        
                print("❌ Could not find text in response parts")
                return None

            except KeyError as e:
                print(f"❌ JSON Parse Error: {e}")
                return None
                
        except Exception as e:
            print(f"❌ Connection Error: {e}")
            return None