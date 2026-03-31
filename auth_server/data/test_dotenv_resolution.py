import os
from dotenv import load_dotenv

print("ENV BEFORE LOAD_DOTENV:", os.environ.get("GEMINI_API_KEY_1"))
load_dotenv()
print("ENV AFTER LOAD_DOTENV:", os.environ.get("GEMINI_API_KEY_1"))
