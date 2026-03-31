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
                subject_name = "General"
            else:
                subject_name = parts[1]
        else:
            class_name = "Unknown Class"
            subject_name = "General"
            
        return class_name.replace("_", " "), subject_name.replace("_", " ")
    except ValueError:
        return "Unknown Class", "General"

async def process_pdf_concurrently(client, nb_id, pdf, source_id, class_name, subject_name):
    # Determine output filename
    pdf_title = pdf.stem.replace("_", " ").title()
    safe_title = f"{class_name} - {subject_name} - {pdf_title}"
    output_filename = f"{safe_title}.pdf"
    
    # Save to a dedicated folder
    output_dir = SLIDES_OUT_DIR / class_name / subject_name
    output_dir.mkdir(parents=True, exist_ok=True)
    
    output_path = output_dir / output_filename

    if output_path.exists():
        print(f"  - ⏩ Skipping target {pdf.name} (already exists at {output_path})")
        return True, pdf.name

    print(f"  - [⚙️ generating] {pdf.name}")
    try:
        # Generate slides for this specific source
        status = await client.artifacts.generate_slide_deck(
            nb_id,
            source_ids=[source_id],
            slide_format=SlideDeckFormat.DETAILED_DECK,
            slide_length=SlideDeckLength.DEFAULT
        )
        
        # Wait for completion
        await client.artifacts.wait_for_completion(nb_id, status.task_id, timeout=12000)

        # Download Slide Deck
        await client.artifacts.download_slide_deck(nb_id, str(output_path), artifact_id=status.task_id)
        
        print(f"  - ✅ [💾 Saved] slides to {output_path}")
        return True, pdf.name
        
    except Exception as e:
        if "SourceTimeoutError" in type(e).__name__ or "Timeout" in type(e).__name__:
            print(f"  - ❌ [Timeout] Processing timed out for {pdf.name}")
        else:
            print(f"  - ❌ [Error] Processing {pdf.name}: {e}")
        return False, pdf.name

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

    pdfs_to_process = [pdf for pdf in pdfs if pdf.name not in processed_files]
    if not pdfs_to_process:
        print("No new files to process.")
        return

    print(f"Processing {len(pdfs_to_process)} unprocessed files.")

    async with await NotebookLMClient.from_storage(STORAGE_PATH) as client:
        nb_title = f"NCERT Slide Gen Batch {int(time.time())}"
        print(f"Creating single notebook: {nb_title}")
        nb = await client.notebooks.create(nb_title)
        
        try:
            print("Uploading documents concurrently...")
            # Limit concurrent uploads to prevent overwhelming the API / name resolution errors
            sem_upload = asyncio.Semaphore(5)
            
            async def bound_upload(pdf):
                async with sem_upload:
                    print(f"  - [Uploading] {pdf.name}...")
                    try:
                        source = await client.sources.add_file(nb.id, pdf, wait=True, wait_timeout=600.0)
                        class_name, subject = parse_class_and_subject(pdf, DATA_DIR)
                        print(f"  - [✅ Uploaded] {pdf.name}")
                        return (pdf, source.id, class_name, subject)
                    except Exception as e:
                        print(f"  - [❌ Upload Failed] {pdf.name}: {e}")
                        return None
            
            upload_coroutines = [bound_upload(pdf) for pdf in pdfs_to_process]
            upload_results = await asyncio.gather(*upload_coroutines)
            tasks = [r for r in upload_results if r is not None]
            
            if not tasks:
                print("No documents were successfully uploaded. Exiting.")
                return

            print(f"\nStarting concurrent slide generation for {len(tasks)} documents...")
            # Limit concurrent generation to prevent rate limiting errors
            sem_gen = asyncio.Semaphore(3)
            
            async def bound_generate(pdf, source_id, class_name, subject_name):
                async with sem_gen:
                    return await process_pdf_concurrently(client, nb.id, pdf, source_id, class_name, subject_name)
            
            gen_coroutines = [
                bound_generate(pdf, source_id, c_name, s_name) 
                for pdf, source_id, c_name, s_name in tasks
            ]
            
            gen_results = await asyncio.gather(*gen_coroutines)
            
            # Update processed files list
            for success, pdf_name in gen_results:
                # Even if NotebookLM failed, we attempt it. If we want to retry failed ones later, 
                # we only add success to processed.
                if success:
                     processed_files.add(pdf_name)
            
            with open(PROCESSED_LOG_PATH, 'w') as f:
                 json.dump(list(processed_files), f, indent=2)
                 
            print("\nBatch processing complete.")

        except Exception as e:
            print(f"Fatal error during batch execution: {e}")
        finally:
            try:
                print("Deleting temporary notebook...")
                await client.notebooks.delete(nb.id)
                print("Notebook deleted.")
            except:
                pass

if __name__ == "__main__":
    asyncio.run(main())
