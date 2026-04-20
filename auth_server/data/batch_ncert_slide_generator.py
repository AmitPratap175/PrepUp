import os
import asyncio
import re
import time
import json
from pathlib import Path

# Third-party imports
from dotenv import load_dotenv
from notebooklm import NotebookLMClient, SlideDeckFormat, SlideDeckLength

# Load environment variables
env_path = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

# --- Config & Constants ---
DATA_DIR = Path("/home/dspratap/Downloads/PrepUp/UPSC/NCERT") # Assume NCERT pdfs are here
DATA_OUT_DIR = Path("/home/dspratap/Downloads/PrepUp/auth_server/data")
SLIDES_OUT_DIR = DATA_OUT_DIR / "NCERTSlides"
PROCESSED_LOG_PATH = DATA_OUT_DIR / "processed_ncert_slides_files.json"
STORAGE_PATH = "/home/dspratap/.notebooklm/storage_state.json"

# --- Helper Functions ---

def parse_class_and_subject(pdf_path, root_dir):
    try:
        relative_path = pdf_path.relative_to(root_dir)
        parts = relative_path.parts
        
        if len(parts) >= 2:
            class_name = parts[0]
            if len(parts) == 2:
                # E.g. Class_6/file.pdf
                subject_name = "General"
            else:
                subject_name = parts[1]
        else:
            class_name = "Unknown Class"
            subject_name = "General"
            
        return class_name.replace("_", " "), subject_name.replace("_", " ")
    except ValueError:
        return "Unknown Class", "General"

async def generate_slide_from_pdf(client, pdf_path, class_name, subject_name):
    print(f"  - Generating slide for {pdf_path.name}...")
    
    # Determine output filename
    pdf_title = pdf_path.stem.replace("_", " ").title()
    safe_title = f"{class_name} - {subject_name} - {pdf_title}"
    output_filename = f"{safe_title}.pdf"
    
    # Save to a dedicated folder
    output_dir = SLIDES_OUT_DIR / class_name / subject_name
    output_dir.mkdir(parents=True, exist_ok=True)
    
    output_path = output_dir / output_filename

    if output_path.exists():
        print(f"  - ⏩ Skipping {pdf_path.name} (already exists at {output_path})")
        return "SKIPPED"

    # Create notebook
    nb_title = f"NCERT Slide Gen: {pdf_path.stem}"
    nb = await client.notebooks.create(nb_title)

    try:
        # Add source
        print("  - Uploading source...")
        await client.sources.add_file(nb.id, pdf_path, wait=True, wait_timeout=600.0)

        # Generate Slides
        print("  - Generating slides...")
        status = await client.artifacts.generate_slide_deck(
            nb.id,
            slide_format=SlideDeckFormat.DETAILED_DECK,
            slide_length=SlideDeckLength.DEFAULT
        )
        await client.artifacts.wait_for_completion(nb.id, status.task_id, timeout=12000)

        # Download Slide Deck
        print(f"  - Downloading slides to {output_path}...")
        await client.artifacts.download_slide_deck(nb.id, str(output_path))
        
        if output_path.exists():
            print(f"  - ✅ Slides saved to {output_path}")
            return "GENERATED"
        else:
            print(f"  - ❌ Error: Slide generation completed but file {output_path} not found.")
            return "ERROR"
        
    except Exception as e:
        if "SourceTimeoutError" in type(e).__name__ or "Timeout" in type(e).__name__:
            print(f"  - ❌ Source processing timed out. Skipping slides for this file.")
        else:
            print(f"  - ❌ Error processing {pdf_path.name}: {e}")
        return "ERROR"
    finally:
        try:
            await client.notebooks.delete(nb.id)
        except:
            pass

# --- Main Logic ---

async def main():
    if not DATA_DIR.exists():
        print(f"Error: {DATA_DIR} does not exist. Please place NCERT PDFs there.")
        return

    def natural_key(path):
        return [int(text) if text.isdigit() else text.lower() for text in re.split(r'(\d+)', path.name)]
    
    pdfs = sorted(list(DATA_DIR.rglob("*.pdf")), key=natural_key)
    print(f"Found {len(pdfs)} PDFs in {DATA_DIR} recursively (Sorted)")

    processed_files = set()
    if PROCESSED_LOG_PATH.exists():
        try:
            with open(PROCESSED_LOG_PATH, 'r') as f:
                processed_files = set(json.load(f))
        except: pass

    async with await NotebookLMClient.from_storage(STORAGE_PATH) as client:
        for i, pdf in enumerate(pdfs):
            class_name, subject = parse_class_and_subject(pdf, DATA_DIR)
            
            pdf_title = pdf.stem.replace("_", " ").title()
            safe_title = f"{class_name} - {subject} - {pdf_title}"
            expected_path = SLIDES_OUT_DIR / class_name / subject / f"{safe_title}.pdf"

            if pdf.name in processed_files:
                if expected_path.exists():
                    print(f"Skipping ({i+1}/{len(pdfs)}): {pdf.name} (Already Processed)")
                    continue
                else:
                    print(f"File {pdf.name} is marked processed but slide is missing. Retrying...")
                    processed_files.remove(pdf.name)
                    with open(PROCESSED_LOG_PATH, 'w') as f:
                         json.dump(list(processed_files), f, indent=2)

            print(f"Processing ({i+1}/{len(pdfs)}): {pdf.name} (Path: {pdf.relative_to(DATA_DIR)})")
            
            print(f"  - Document classified as: Class: {class_name}, Subject: {subject}")
            
            status = await generate_slide_from_pdf(client, pdf, class_name, subject)
            
            if status in ["GENERATED", "SKIPPED"]:
                processed_files.add(pdf.name)
                with open(PROCESSED_LOG_PATH, 'w') as f:
                     json.dump(list(processed_files), f, indent=2)
            
            if status == "GENERATED" and i < len(pdfs) - 1:
                print("  - Cooling down for 120 seconds...")
                await asyncio.sleep(120)

if __name__ == "__main__":
    asyncio.run(main())
