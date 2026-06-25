import os
import json
import asyncio
from datetime import datetime, timedelta
from pathlib import Path
from telethon import TelegramClient
import pdfplumber
from pypdf import PdfReader, PdfWriter
from notebooklm import NotebookLMClient, QuizQuantity, QuizDifficulty, SlideDeckFormat, SlideDeckLength
from dotenv import load_dotenv

# Load environment variables
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

DATA_OUT_DIR = Path(__file__).resolve().parent
OUTPUT_FILE = DATA_OUT_DIR / "editorials_yesterday_chunks.json"
SLIDES_OUT_DIR = DATA_OUT_DIR / "EditorialsSlides"
STORAGE_PATH = "/home/dspratap/.notebooklm/storage_state.json"

TELEGRAM_API_ID = os.getenv("TELEGRAM_API_ID")
TELEGRAM_API_HASH = os.getenv("TELEGRAM_API_HASH")
TELEGRAM_PHONE_NUMBER = os.getenv("TELEGRAM_PHONE_NUMBER")

GROUP_ID = -1001826937774

EDITORIAL_NB_PROMPT = """
Act as a strict Union Public Service Commission (UPSC) paper setter and expert educator. 
Analyze the following English Editorial text and create study material for UPSC aspirants.

Tasks:
1. Provide a comprehensive, detailed summary of the editorial. Organize with clear markdown headings and bullet points.
2. Generate 5 high-quality Prelims MCQs in the UPSC style. Provide detailed explanations.
3. Generate 2 UPSC Mains questions (General Studies) relevant to this editorial, with a model answer structure.

Output Rules:
- Cover the most important aspects.
- Provide a separate Answer Key at the end. Use markdown.
"""

async def generate_via_notebooklm(nb_client, title, file_path):
    print(f"  - [NotebookLM] Generating study material for: {title}...")
    nb_title = f"Ed Study: {title[:30]}"
    nb = None
    try:
        nb = await nb_client.notebooks.create(nb_title)
        await nb_client.sources.add_file(nb.id, file_path, wait=True, wait_timeout=600.0)
        
        status = await nb_client.artifacts.generate_quiz(
            nb.id,
            instructions=EDITORIAL_NB_PROMPT,
            quantity=QuizQuantity.STANDARD,
            difficulty=QuizDifficulty.HARD
        )
        await nb_client.artifacts.wait_for_completion(nb.id, status.task_id, timeout=1200.0)
        
        temp_json = DATA_OUT_DIR / f"temp_nb_ed_{datetime.now().timestamp()}.json"
        await nb_client.artifacts.download_quiz(nb.id, str(temp_json), output_format="json")
        
        from notebooklm.rpc.types import ReportFormat
        status_report = await nb_client.artifacts.generate_report(
            nb.id,
            report_format=ReportFormat.BRIEFING_DOC
        )
        await nb_client.artifacts.wait_for_completion(nb.id, status_report.task_id, timeout=1200.0)
        
        temp_txt = DATA_OUT_DIR / f"temp_nb_ed_report_{datetime.now().timestamp()}.md"
        await nb_client.artifacts.download_report(nb.id, str(temp_txt), artifact_id=status_report.task_id)

        # Generate Slides
        print(f"  - [NotebookLM] Generating slides for {title}...")
        SLIDES_OUT_DIR.mkdir(parents=True, exist_ok=True)
        safe_title = "".join([c if c.isalnum() or c in [' ', '-'] else "_" for c in title])
        slide_path = SLIDES_OUT_DIR / f"{safe_title}.pdf"

        s_status = await nb_client.artifacts.generate_slide_deck(
            nb.id,
            slide_format=SlideDeckFormat.DETAILED_DECK,
            slide_length=SlideDeckLength.DEFAULT
        )
        await nb_client.artifacts.wait_for_completion(nb.id, s_status.task_id, timeout=1200.0)
        await nb_client.artifacts.download_slide_deck(nb.id, str(slide_path))

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
                
                data["slide_path"] = str(slide_path) if slide_path.exists() else None

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

def create_pdf_chunk(source_pdf_path, start_page, end_page, output_path):
    reader = PdfReader(source_pdf_path)
    writer = PdfWriter()
    for i in range(start_page, end_page):
        if i < len(reader.pages):
            writer.add_page(reader.pages[i])
    with open(output_path, "wb") as f:
        writer.write(f)

def extract_text_range(pdf_path, start_page, end_page):
    text = ""
    with pdfplumber.open(pdf_path) as pdf:
        for i in range(start_page, end_page):
            if i < len(pdf.pages):
                page_text = pdf.pages[i].extract_text()
                if page_text:
                    text += page_text + "\n"
    return text

async def process_pdf_chunks(client, pdf_path, found_msg, file_name):
    final_data = []
    if OUTPUT_FILE.exists():
        with open(OUTPUT_FILE, 'r') as f:
            try:
                final_data = json.load(f)
            except:
                final_data = []

    async with await NotebookLMClient.from_storage(STORAGE_PATH) as nb_client:
        reader = PdfReader(pdf_path)
        total_pages = len(reader.pages)
        print(f"Found {total_pages} pages in {file_name}")

        chunk_size = 3
        max_pages = min(18, total_pages)
        
        for start_idx in range(0, max_pages, chunk_size):
            end_idx = min(start_idx + chunk_size, max_pages)
            pages_label = f"Pages {start_idx+1}-{end_idx}"
            
            prid = f"ed_{found_msg.id}_{start_idx+1}_{end_idx}"
            if any(item['prid'] == prid for item in final_data):
                print(f"Already processed {pages_label} (PRID: {prid}). Skipping.")
                continue
            
            print(f"\nProcessing {pages_label}...")
            title = f"{file_name.replace('.pdf', '')} - {pages_label}"
            
            # Extract Text for Gemini
            chunk_text = extract_text_range(pdf_path, start_idx, end_idx)
            if not chunk_text or len(chunk_text.strip()) < 100:
                print(f"Skipping {pages_label} (too little text).")
                continue
                
            # Create PDF Chunk for NotebookLM
            chunk_pdf_path = DATA_OUT_DIR / f"temp_chunk_{datetime.now().timestamp()}.pdf"
            create_pdf_chunk(pdf_path, start_idx, end_idx, chunk_pdf_path)

            nb_data = await generate_via_notebooklm(nb_client, title, chunk_pdf_path)
            
            if chunk_pdf_path.exists():
                chunk_pdf_path.unlink()
            
            if nb_data:
                tags = []
                mains_questions = []
                try:
                    from langchain_google_genai import ChatGoogleGenerativeAI
                    from pydantic import BaseModel, Field
                    class MainsQuestion(BaseModel):
                        question: str = Field(description="The UPSC Mains question")
                        answer: str = Field(description="The model answer structure in markdown")
                    class TagsOutput(BaseModel):
                        tags: list[str] = Field(description='List of UPSC GS Paper Tags')
                        mains_questions: list[MainsQuestion] = Field(description='List of exactly 2 UPSC Mains questions with model answers')
                        
                    model = ChatGoogleGenerativeAI(model='gemini-2.5-flash', temperature=0.1).with_structured_output(TagsOutput)
                    prompt = f'Task 1: Categorize this English Editorial with up to 3 relevant UPSC General Studies tags.\nTask 2: Generate 2 UPSC Mains questions relevant to this editorial, with a model answer structure.\nHere is the content:\n\n{chunk_text[:4000]}'
                    res = model.invoke(prompt)
                    if res:
                        if hasattr(res, 'tags'): tags = res.tags
                        if hasattr(res, 'mains_questions'): mains_questions = [q.model_dump() if hasattr(q, 'model_dump') else q.dict() for q in res.mains_questions]
                        print(f"  - Generated Tags: {tags}")
                except Exception as e:
                    print(f"  - Failed to generate tags/mains: {e}")

                entry = {
                    "prid": prid,
                    "title": title,
                    "url": f"https://t.me/c/{str(GROUP_ID).replace('-100', '')}/{found_msg.id}",
                    "date": found_msg.date.strftime("%Y-%m-%d"),
                    "content": chunk_text,
                    "ai_content": nb_data,
                    "tags": tags,
                    "mains_questions": mains_questions
                }
                
                final_data.append(entry)
                with open(OUTPUT_FILE, 'w') as f:
                    json.dump(final_data, f, indent=2)
                    
                print(f"Successfully generated and saved {title}!")
            else:
                print(f"Failed to generate AI content for {pages_label}.")

async def main():
    client = TelegramClient(str(DATA_OUT_DIR / 'session_name'), TELEGRAM_API_ID, TELEGRAM_API_HASH)
    await client.start(phone=TELEGRAM_PHONE_NUMBER)

    today = datetime.now()
    yesterday = today - timedelta(days=1)
    day = yesterday.day
    month = yesterday.month
    target_names = [
        f"All English Editorials {day}--{month}.pdf", 
        f"All English Editorials {day}-{month}.pdf", 
        f"All English Editorials {day:02d}--{month:02d}.pdf", 
        f"All English Editorials {day:02d}-{month:02d}.pdf"
    ]

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

    pdf_path = DATA_OUT_DIR / file_name
    if not pdf_path.exists():
        print("Downloading PDF...")
        await client.download_media(found_msg.document, file=str(pdf_path))
    
    print("Extracting text and processing pages...")
    await process_pdf_chunks(client, pdf_path, found_msg, file_name)

if __name__ == "__main__":
    asyncio.run(main())
