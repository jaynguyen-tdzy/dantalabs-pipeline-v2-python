# backend/services/gemini.py
import os
import requests
import json
from dotenv import load_dotenv

load_dotenv()

class GeminiClient:
    def __init__(self):
        self.api_key = os.getenv("GOOGLE_API_KEY")
        # Sử dụng model từ env hoặc mặc định ổn định
        self.model = os.getenv("GEMINI_MODEL", "gemini-2.5-flash") 
        self.base_url = "https://generativelanguage.googleapis.com/v1beta/models"

    def clean_and_parse_json(self, text: str):
        """Helper để làm sạch và parse JSON từ AI response"""
        if not text: return None
        
        try:
            # 1. Remove markdown
            clean_text = text.replace("```json", "").replace("```", "").strip()
            
            # 2. Extract JSON part if mixed with text
            start_idx = clean_text.find("{")
            start_arr_idx = clean_text.find("[")
            
            # Ưu tiên object hoặc array tùy cái nào xuất hiện trước
            if start_idx != -1 and (start_arr_idx == -1 or start_idx < start_arr_idx):
                end_idx = clean_text.rfind("}")
                if end_idx != -1:
                    clean_text = clean_text[start_idx:end_idx+1]
            elif start_arr_idx != -1:
                end_idx = clean_text.rfind("]")
                if end_idx != -1:
                    clean_text = clean_text[start_arr_idx:end_idx+1]
            
            return json.loads(clean_text)
        except Exception as e:
            print(f"❌ JSON Parse Error: {e}")
            print(f"Raw text was: {text}")
            return None

    def generate_with_search(self, prompt: str, use_grounding: bool = True):
        headers = {"Content-Type": "application/json"}
        
        # Cấu trúc payload chuẩn
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.3, # Nhiệt độ thấp để AI tập trung vào sự thật
            }
        }

        # JSON mode is not supported with tools/grounding on some models
        if not use_grounding:
            payload["generationConfig"]["response_mime_type"] = "application/json"

        # Kích hoạt Google Search Grounding (công cụ tìm kiếm)
        if use_grounding:
            # Note: Gemini 2.5 requires 'google_search' instead of 'google_search_retrieval'
            payload["tools"] = [{
                "google_search": {}
            }]

        # Retry logic for 429 Errors
        max_retries = 3
        retry_delay = 2 # seconds

        for attempt in range(max_retries):
            try:
                # Xây dựng URL động chuẩn xác
                url = f"{self.base_url}/{self.model}:generateContent?key={self.api_key}"
                print(f"📡 Sending request to Gemini ({self.model})... Attempt {attempt + 1}/{max_retries}")
                
                response = requests.post(url, headers=headers, json=payload, timeout=60)
                
                # Handle 429 explicitly
                if response.status_code == 429:
                    print(f"⚠️ Quota Exceeded (429). Retrying in {retry_delay}s...")
                    import time
                    time.sleep(retry_delay)
                    retry_delay *= 2 # Exponential backoff
                    continue

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
        
        print("❌ Max retries exceeded for Gemini API.")
        return None

    def optimize_search_term(self, user_prompt: str, location_context: str):
        """
        Extracts a clean Google Maps search query from a complex user prompt.
        """
        prompt = f"""
        You are a Search Query Optimizer for Google Maps.
        
        The user wants to find businesses based on this description:
        "{user_prompt}"
        
        The default location is: "{location_context}"
        
        YOUR TASK:
        Formulate the BEST precise Google Maps search query.
        1. KEEP specific niche keywords (e.g., "SEO", "Italian", "Dental", "English speaking").
        2. REMOVE operational constraints that Google Maps Search DOES NOT index (e.g., "1-5 people", "turnover > 1M", "founded 5 years ago").
        3. Ensure the location is included.
        
        Example Input: "Marketing Agency. 1-5 people, english speaking only, specialized in SEO, located in Ho Chi Minh City"
        Example Output: "SEO Marketing Agency English speaking Ho Chi Minh City"
        
        OUTPUT JSON ONLY:
        {{
            "q": "The optimized query string"
        }}
        """
        
        max_retries = 3
        retry_delay = 2
        
        for attempt in range(max_retries):
            try:
                url = f"{self.base_url}/{self.model}:generateContent?key={self.api_key}"
                headers = {"Content-Type": "application/json"}
                payload = {
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {
                        "temperature": 0.1,
                        "response_mime_type": "application/json"
                    }
                }
                
                response = requests.post(url, headers=headers, json=payload, timeout=30)
                
                if response.status_code == 429:
                    print(f"⚠️ Quota Exceeded (429) in optimize_search. Retrying in {retry_delay}s...")
                    import time
                    time.sleep(retry_delay)
                    retry_delay *= 2
                    continue
                
                if response.status_code == 200:
                    data = response.json()
                    text = data['candidates'][0]['content']['parts'][0]['text']
                    return self.clean_and_parse_json(text)
                else:
                    print(f"⚠️ Gemini Opt Error: {response.text}")
                    return None
            except Exception as e:
                print(f"⚠️ Gemini Opt Exception: {e}")
                return None
        return None

    def suggest_better_query(self, user_prompt: str, location_context: str) -> str:
        """
        Suggests a better, more general search query when the specific one fails.
        """
        prompt = f"""
        The user searched for: "{user_prompt}" in "{location_context}" but NO results were found in that location.
        
        This might be because the search was too specific (too many constraints).
        
        YOUR TASK:
        Suggest a MORE GENERAL, broader search query that is likely to find valid results in Google Maps.
        Focus on the main category.
        
        Example Input: "Marketing Agency 1-5 people English speaking SEO ops"
        Example Suggestion: Marketing Agency
        
        OUTPUT ONLY THE SUGGESTED KEYWORD (No JSON, No quotes, No markdown).
        """
        
        max_retries = 3
        retry_delay = 2
        
        for attempt in range(max_retries):
            try:
                url = f"{self.base_url}/{self.model}:generateContent?key={self.api_key}"
                headers = {"Content-Type": "application/json"}
                payload = {
                    "contents": [{"parts": [{"text": prompt}]}],
                    "generationConfig": {
                        "temperature": 0.2,
                        "response_mime_type": "text/plain"
                    }
                }
                
                response = requests.post(url, headers=headers, json=payload, timeout=30)
                
                if response.status_code == 429:
                    print(f"⚠️ Quota Exceeded (429) in suggest_query. Retrying in {retry_delay}s...")
                    import time
                    time.sleep(retry_delay)
                    retry_delay *= 2
                    continue
                
                if response.status_code == 200:
                    data = response.json()
                    text = data['candidates'][0]['content']['parts'][0]['text']
                    print(f"DEBUG: Gemini Suggestion Response: {text}")
                    # Simple cleanup: remove quotes, newlines, extra spaces
                    suggestion = text.strip().replace('"', '').replace("'", "")
                    return suggestion if suggestion else None
                else:
                    print(f"❌ Gemini Suggestion Error: {response.text}")
                    return None
            except Exception as e:
                print(f"❌ suggest_better_query Exception: {e}")
                return None
        return None