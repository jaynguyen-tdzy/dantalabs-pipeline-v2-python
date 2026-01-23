
import os
import requests
from dotenv import load_dotenv
import sys
sys.path.append(os.path.join(os.getcwd(), 'backend'))
from backend.utils.tech_detector import TechStackDetector

# Load env
if os.path.exists(".env.local"):
    load_dotenv(".env.local")
load_dotenv("backend/.env")

def test_agent_detection():
    detector = TechStackDetector()
    
    # List of test sites (some known to have agents, some not)
    # Using some generic tech sites or placeholders. 
    # Since I cannot easily browse to check, I will try a few major ones.
    
    sites = [
        "https://intercom.com", # Should detect Intercom
        "https://www.drift.com",  # Should detect Drift
        "https://www.zendesk.com", # Should detect Zendesk
        "https://example.com"    # Probably no agents
    ]

    print("Starting Agent Detection Test...\n")

    for url in sites:
        print(f"Testing {url}...")
        try:
            result = detector.detect(url)
            agents = result.get('agents', [])
            print(f"Agents Found: {agents}")
            print(f"Full Stack: {result.keys()}") 
            print("-" * 30)
        except Exception as e:
            print(f"Error testing {url}: {e}")

if __name__ == "__main__":
    test_agent_detection()
