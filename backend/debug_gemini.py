from services.gemini import GeminiClient
import os

# Mock env if needed, but the service uses os.getenv
# Assuming the environment is already set up or .env is present
from dotenv import load_dotenv
load_dotenv()

client = GeminiClient()
prompt = "Marketing Agency. 1-5 people, english speaking only, specislized in SEO, more than 5 years ops, located between d1,d2, binh thanh, d7, d4 in Ho Chi Minh City"
location = "Ho Chi Minh City"

print(f"Input: {prompt}")
result = client.optimize_search_term(prompt, location)
print(f"Output: {result}")
