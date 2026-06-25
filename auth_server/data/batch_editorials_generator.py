import os
import json
import asyncio
from datetime import datetime, timedelta
from pathlib import Path
from telethon import TelegramClient
import pdfplumber
from notebooklm import NotebookLMClient, QuizQuantity, QuizDifficulty
from dotenv import load_dotenv

# Load environment variables
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

DATA_OUT_DIR = Path(__file__).resolve().parent
OUTPUT_FILE = DATA_OUT_DIR / "editorials_combined_data.json"
STORAGE_PATH = "/home/dspratap/.notebooklm/storage_state.json"

TELEGRAM_API_ID = os.getenv("TELEGRAM_API_ID")
TELEGRAM_API_HASH = os.getenv("TELEGRAM_API_HASH")
TELEGRAM_PHONE_NUMBER = os.getenv("TELEGRAM_PHONE_NUMBER")

GROUP_ID = -1001826937774

EDITORIAL_NB_PROMPT = """
Act as a strict Union Public Service Commission (UPSC) paper setter and expert educator. 
Analyze the following English Editorials for today and create study material for UPSC aspirants.

Tasks:
1. Provide a comprehensive, detailed summary of the editorials. Organize with clear markdown headings and bullet points.
2. Generate 5 high-quality Prelims MCQs in the UPSC style. Provide detailed explanations.
3. Generate 2 UPSC Mains questions (General Studies) relevant to these editorials, with a model answer structure.

Output Rules:
- Cover the most important aspects.
- Provide a separate Answer Key at the end. Use markdown.
"""

async def extract_text_from_pdf(pdf_path):
    text = ""
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
    except Exception as e:
        print(f"Error extracting PDF: {e}")
    return text

async def generate_via_notebooklm(nb_client, title, content):
    print(f"  - [NotebookLM] Generating study material for: {title}...")
    nb_title = f"Editorial Study: {title[:50]}"
    nb = None
    try:
        temp_txt = DATA_OUT_DIR / f"temp_ed_{datetime.now().timestamp()}.txt"
        with open(temp_txt, "w", encoding="utf-8") as f:
            f.write(content)

        nb = await nb_client.notebooks.create(nb_title)
        await nb_client.sources.add_file(nb.id, temp_txt, wait=True, wait_timeout=600.0)
        temp_txt.unlink()
        
        status = await nb_client.artifacts.generate_quiz(
            nb.id,
            instructions=EDITORIAL_NB_PROMPT,
            quantity=QuizQuantity.STANDARD,
            difficulty=QuizDifficulty.HARD
        )
        await nb_client.artifacts.wait_for_completion(nb.id, status.task_id)
        
        temp_json = DATA_OUT_DIR / f"temp_nb_ed_{datetime.now().timestamp()}.json"
        await nb_client.artifacts.download_quiz(nb.id, str(temp_json), output_format="json")
        
        from notebooklm.rpc.types import ReportFormat
        status_report = await nb_client.artifacts.generate_report(
            nb.id,
            report_format=ReportFormat.BRIEFING_DOC
        )
        await nb_client.artifacts.wait_for_completion(nb.id, status_report.task_id)
        
        temp_txt = DATA_OUT_DIR / f"temp_nb_ed_report_{datetime.now().timestamp()}.md"
        await nb_client.artifacts.download_report(nb.id, str(temp_txt), artifact_id=status_report.task_id)
        
        await nb_client.notebooks.delete(nb.id)
        
        data = None
        if temp_json.exists():
            try:
                with open(temp_json, 'r') as f:
                    data = json.load(f)
                temp_json.unlink()
                
                if temp_txt.exists():
                    with open(temp_txt, 'r') as f:
                        data["summary"] = f.read()
                    temp_txt.unlink()
            except Exception as e:
                print(f"Failed to parse quiz JSON: {e}")
                
        return data

    except Exception as e:
        print(f"  - [NotebookLM] Generation failed: {e}")
        return None
    finally:
        if nb:
            try:
                await nb_client.notebooks.delete(nb.id)
            except:
                pass

async def main():
    client = TelegramClient(str(DATA_OUT_DIR / 'session_name'), TELEGRAM_API_ID, TELEGRAM_API_HASH)
    await client.start(phone=TELEGRAM_PHONE_NUMBER)

    today = datetime.now()
    day = today.day
    month = today.month
    target_names = [f"All English Editorials {day}--{month}.pdf", f"All English Editorials {day}-{month}.pdf", f"All English Editorials {day:02d}--{month:02d}.pdf", f"All English Editorials {day:02d}-{month:02d}.pdf"]

    found_msg = None
    async for message in client.iter_messages(GROUP_ID, limit=50):
        if message.document:
            for attr in message.document.attributes:
                if hasattr(attr, 'file_name'):
                    if any(target in attr.file_name for target in target_names):
                        found_msg = message
                        break
        if found_msg:
            break

    if not found_msg:
        print(f"Could not find any English Editorials PDF for {day}/{month}.")
        return

    file_name = "latest_editorials.pdf"
    for attr in found_msg.document.attributes:
        if hasattr(attr, 'file_name'):
            file_name = attr.file_name
    
    print(f"Found PDF: {file_name}")

    final_data = []
    if OUTPUT_FILE.exists():
        with open(OUTPUT_FILE, 'r') as f:
            try:
                final_data = json.load(f)
            except:
                final_data = []
            
    prid = f"ed_{found_msg.id}"
    if any(item['prid'] == prid for item in final_data):
        print(f"Already processed this editorial (PRID: {prid}). Exiting.")
        return

    print("Downloading PDF...")
    pdf_path = await client.download_media(found_msg.document, file=str(DATA_OUT_DIR / file_name))
    
    print("Extracting text...")
    content = await extract_text_from_pdf(pdf_path)
    os.remove(pdf_path)
    
    if not content.strip():
        print("Failed to extract any text from PDF.")
        return
        
    print(f"Extracted {len(content)} characters. Generating AI content via NotebookLM...")
    
    async with await NotebookLMClient.from_storage(STORAGE_PATH) as nb_client:
        nb_data = await generate_via_notebooklm(nb_client, file_name, content)
        
        if nb_data:
            # Generate Tags and Mains Questions using standard Gemini model
            tags = []
            mains_questions = []
            try:
                from langchain_google_genai import ChatGoogleGenerativeAI
                from pydantic import BaseModel, Field
                class MainsQuestion(BaseModel):
                    question: str = Field(description="The UPSC Mains question")
                    answer: str = Field(description="The model answer structure in markdown")
                class TagsOutput(BaseModel):
                    tags: list[str] = Field(description='List of UPSC GS Paper Tags (e.g. GS-1: History, GS-2: Polity, GS-3: Economy, GS-3: Environment)')
                    mains_questions: list[MainsQuestion] = Field(description='List of exactly 2 UPSC Mains questions with model answers')
                    
                model = ChatGoogleGenerativeAI(model='gemini-2.5-flash', temperature=0.1).with_structured_output(TagsOutput)
                prompt = f'Task 1: Categorize these English Editorials with up to 3 relevant UPSC General Studies tags.\nTask 2: Generate 2 UPSC Mains questions relevant to these editorials, with a model answer structure.\nHere is the content:\n\n{content[:4000]}'
                res = model.invoke(prompt)
                if res:
                    if hasattr(res, 'tags'): tags = res.tags
                    if hasattr(res, 'mains_questions'): mains_questions = [q.dict() for q in res.mains_questions]
                    print(f"  - Generated Tags: {tags}")
            except Exception as e:
                print(f"  - Failed to generate tags/mains: {e}")

            entry = {
                "prid": prid,
                "title": file_name.replace('.pdf', ''),
                "url": f"https://t.me/c/{str(GROUP_ID).replace('-100', '')}/{found_msg.id}",
                "date": found_msg.date.strftime("%Y-%m-%d"),
                "content": content,
                "ai_content": nb_data,
                "tags": tags,
                "mains_questions": mains_questions
            }
            
            final_data.insert(0, entry)
            with open(OUTPUT_FILE, 'w') as f:
                json.dump(final_data, f, indent=2)
                
            print(f"Successfully generated and saved {file_name}!")
        else:
            print("Failed to generate AI content.")

if __name__ == "__main__":
    asyncio.run(main())
