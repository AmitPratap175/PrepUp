import os
from google import genai

api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
client = genai.Client(api_key=api_key)

try:
    for m in client.models.list():
        print(f"Model: {m.name}")
        try:
            print(f"Supported generation methods: {m.supported_generation_methods}")
        except:
            pass
except Exception as e:
    print(f"Error listing models: {e}")
