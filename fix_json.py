import sys, os, json, time
from pathlib import Path
from dotenv import load_dotenv

env_path = Path('.env').resolve()
load_dotenv(dotenv_path=env_path)

sys.path.append('auth_server')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'auth_project.settings')

from langchain_google_genai import ChatGoogleGenerativeAI
from pydantic import BaseModel, Field

path = 'auth_server/data/pib_combined_data.json'
with open(path, 'r') as f:
    data = json.load(f)

class MainsQuestion(BaseModel):
    question: str = Field(description="The UPSC Mains question")
    answer: str = Field(description="The model answer structure in markdown")

class TagsOutput(BaseModel):
    tags: list[str] = Field(description='List of UPSC GS Paper Tags (e.g. GS-1: History, GS-2: Polity, GS-3: Economy, GS-3: Environment)')
    mains_questions: list[MainsQuestion] = Field(description='List of exactly 2 UPSC Mains questions with model answers')

model = ChatGoogleGenerativeAI(model='gemini-1.5-flash', temperature=0.1).with_structured_output(TagsOutput)

for item in data:
    needs_update = False
    if 'tags' not in item or not item['tags']:
        needs_update = True
    if 'mains_questions' not in item or not item['mains_questions']:
        needs_update = True
        
    if needs_update:
        print(f'Generating missing data for {item.get("prid")}')
        content = item.get('content', '')
        if not content: continue
        try:
            prompt = f'Task 1: Categorize this PIB release with up to 3 relevant UPSC General Studies tags (e.g. GS-2: Governance, GS-3: Economy, GS-3: Environment).\nTask 2: Generate 2 UPSC Mains questions (General Studies) relevant to this release, with a model answer structure.\nHere is the content:\n\n{content[:4000]}'
            res = model.invoke(prompt)
            if res:
                item['tags'] = res.tags
                item['mains_questions'] = [q.model_dump() if hasattr(q, 'model_dump') else q.dict() for q in res.mains_questions]
                print(f'Successfully generated for {item.get("prid")}')
            else:
                item['tags'] = []
                item['mains_questions'] = []
            
            with open(path, 'w') as f:
                json.dump(data, f, indent=2)
                
            time.sleep(5)  # Sleep 5 seconds to avoid exceeding RPM limit
        except Exception as e:
            print(f'Error: {e}')
            time.sleep(5)

