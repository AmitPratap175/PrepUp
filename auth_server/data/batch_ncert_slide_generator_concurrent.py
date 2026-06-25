import os
import argparse
import asyncio
import re
import time
import socket
from functools import wraps
from pathlib import Path

# Third-party imports
from dotenv import load_dotenv
from notebooklm import (
    NotebookLMClient, 
    AudioFormat, 
    AudioLength, 
    SlideDeckFormat,
    SlideDeckLength,
    ArtifactNotReadyError
)

# Load environment variables
env_path = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

# --- Config & Constants ---
DATA_DIR = Path("/home/dspratap/Downloads/PrepUp/UPSC/NCERT") # Assume NCERT pdfs are here
DATA_OUT_DIR = Path("/home/dspratap/Downloads/PrepUp/auth_server/data")
AUDIO_OUT_DIR = DATA_OUT_DIR / "NCERTAudio"
SLIDES_OUT_DIR = DATA_OUT_DIR / "NCERTSlides"
STORAGE_PATH = "/home/dspratap/.notebooklm/storage_state.json"
NOTEBOOK_NAME = "Ethics"

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

def with_retry(retries=5, backoff=2):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            last_err = None
            for i in range(retries):
                try:
                    return await func(*args, **kwargs)
                except (socket.gaierror, Exception) as e:
                    # Don't catch asyncio TimeoutError or native TimeoutError
                    if isinstance(e, (TimeoutError, asyncio.TimeoutError)):
                        raise
                    last_err = e
                    err_msg = str(e)
                    print(f"      [Retry {i+1}/{retries}] Error calling {func.__name__}: {err_msg}")
                    if i < retries - 1:
                        sleep_time = backoff ** i
                        await asyncio.sleep(sleep_time)
            if last_err:
                raise last_err
        return wrapper
    return decorator

async def process_upload(client, nb_id, pdf, existing_sources, sem):
    async with sem:
        if pdf.name in existing_sources:
            return True, pdf.name, existing_sources[pdf.name]

        print(f"  - [Upload] {pdf.name} to notebook '{NOTEBOOK_NAME}'...")
        try:
            @with_retry()
            async def add_src():
                return await client.sources.add_file(nb_id, pdf, wait=True, wait_timeout=1200.0)
            
            source = await add_src()
            print(f"  - ✅ [Upload Complete] {pdf.name}")
            return True, pdf.name, source.id
        except Exception as e:
            print(f"  - ❌ [Upload Failed] {pdf.name}: {e}")
            return False, pdf.name, None

async def process_generation(client, nb_id, pdf, source_id, class_name, subject_name, gen_audio, gen_slides):
    pdf_title = pdf.stem.replace("_", " ").title()
    safe_title = f"{class_name} - {subject_name} - {pdf_title}"
    
    audio_dir = AUDIO_OUT_DIR / class_name / subject_name
    audio_dir.mkdir(parents=True, exist_ok=True)
    audio_path = audio_dir / f"{safe_title}.mp3"
    
    slide_dir = SLIDES_OUT_DIR / class_name / subject_name
    slide_dir.mkdir(parents=True, exist_ok=True)
    slide_path = slide_dir / f"{safe_title}.pdf"

    needs_audio = gen_audio and not audio_path.exists()
    needs_slides = gen_slides and not slide_path.exists()

    if not needs_audio and not needs_slides:
        return True

    print(f"  - [⚙️ Generating Artifacts] {pdf.name}")
    try:
        # === AUDIO ===
        if needs_audio:
            print(f"    ... Generating audio for {pdf.name} (This may take several minutes)...")
            @with_retry()
            async def do_gen_audio():
                return await client.artifacts.generate_audio(
                    nb_id,
                    source_ids=[source_id],
                    audio_format=AudioFormat.DEEP_DIVE,
                    audio_length=AudioLength.LONG
                )
            status = await do_gen_audio()
            
            if status.status == "failed":
                raise Exception(f"NotebookLM API Refusal: {status.error}")
                
            try:
                await client.artifacts.wait_for_completion(nb_id, status.task_id, timeout=2700.0)
            except TimeoutError:
                raise Exception(f"Audio generation timed out after 45 minutes")

            @with_retry()
            async def download_new_audio():
                return await client.artifacts.download_audio(nb_id, str(audio_path), artifact_id=status.task_id)
            await download_new_audio()
            print(f"    ... ✅ [💾 Saved] audio to {audio_path}")

        # === SLIDES ===
        if needs_slides:
            print(f"    ... Generating slides for {pdf.name}...")
            @with_retry()
            async def do_gen_slides():
                return await client.artifacts.generate_slide_deck(
                    nb_id,
                    source_ids=[source_id],
                    slide_format=SlideDeckFormat.DETAILED_DECK,
                    slide_length=SlideDeckLength.DEFAULT
                )
            status = await do_gen_slides()
            
            if status.status == "failed":
                raise Exception(f"NotebookLM API Refusal: {status.error}")
                
            try:
                await client.artifacts.wait_for_completion(nb_id, status.task_id, timeout=1800.0)
            except TimeoutError:
                raise Exception(f"Slide generation timed out after 30 minutes")

            @with_retry()
            async def download_new_slides():
                return await client.artifacts.download_slide_deck(nb_id, str(slide_path), artifact_id=status.task_id)
            await download_new_slides()
            print(f"    ... ✅ [💾 Saved] slides to {slide_path}")
            
        return True
    except Exception as e:
        print(f"  - ❌ [Generation Error] {pdf.name}: {e}")
        return False

def parse_args():
    parser = argparse.ArgumentParser(description="NCERT generator for NotebookLM.")
    parser.add_argument(
        "--generate",
        type=str,
        choices=["audio", "slides", "both"],
        default="both",
        help="What artifact to generate (audio, slides, both)"
    )
    return parser.parse_args()

# --- Main Logic ---

async def main():
    args = parse_args()
    gen_audio = args.generate in ["audio", "both"]
    gen_slides = args.generate in ["slides", "both"]

    if not DATA_DIR.exists():
        print(f"Error: {DATA_DIR} does not exist. Please place NCERT PDFs there.")
        return

    def natural_key(path):
        return [int(text) if text.isdigit() else text.lower() for text in re.split(r'(\d+)', path.name)]
    
    pdfs = sorted(list(DATA_DIR.rglob("*.pdf")), key=natural_key)
    print(f"Found {len(pdfs)} PDFs in {DATA_DIR} recursively (Sorted)")

    pdfs_to_process = []
    for pdf in pdfs:
        class_name, subject = parse_class_and_subject(pdf, DATA_DIR)
        pdf_title = pdf.stem.replace("_", " ").title()
        safe_title = f"{class_name} - {subject} - {pdf_title}"
        
        audio_path = AUDIO_OUT_DIR / class_name / subject / f"{safe_title}.mp3"
        slide_path = SLIDES_OUT_DIR / class_name / subject / f"{safe_title}.pdf"
        
        needs_audio = gen_audio and not audio_path.exists()
        needs_slides = gen_slides and not slide_path.exists()
        
        if needs_audio or needs_slides:
            pdfs_to_process.append(pdf)

    if not pdfs_to_process:
        print("No new files to process based on your current generation flag.")
        return

    print(f"Processing {len(pdfs_to_process)} unprocessed files for --generate {args.generate}...")

    async with await NotebookLMClient.from_storage(STORAGE_PATH) as client:
        try:
            print(f"\n[PHASE 0] Looking for or creating the '{NOTEBOOK_NAME}' notebook...")
            all_notebooks = await client.notebooks.list()
            nb_id = None
            for nb in all_notebooks:
                if nb.title == NOTEBOOK_NAME:
                    nb_id = nb.id
                    break
            
            if nb_id:
                print(f"Found existing '{NOTEBOOK_NAME}' notebook (ID: {nb_id}).")
            else:
                print(f"Creating new '{NOTEBOOK_NAME}' notebook...")
                nb = await client.notebooks.create(NOTEBOOK_NAME)
                nb_id = nb.id
                
            print("Fetching existing sources from the notebook...")
            sources = await client.sources.list(nb_id)
            existing_sources = {src.title: src.id for src in sources if src.title}
            print(f"Found {len(existing_sources)} existing sources in '{NOTEBOOK_NAME}'.")

            print(f"\n[PHASE 1] Uploading Missing Documents...")
            upload_sem = asyncio.Semaphore(5)
            upload_coroutines = []
            for pdf in pdfs_to_process:
                upload_coroutines.append(process_upload(client, nb_id, pdf, existing_sources, upload_sem))
            
            upload_results = await asyncio.gather(*upload_coroutines)
            
            # Map pdf.name back to source_ids
            source_map = {}
            for success, pdf_name, source_id in upload_results:
                if success and source_id:
                    source_map[pdf_name] = source_id

            print(f"\n[PHASE 2] Sequential Artifact Generation (Strictly 1 at a time per notebook rules)...")
            for pdf in pdfs_to_process:
                if pdf.name not in source_map:
                    print(f"  - ⏩ Skipping {pdf.name} due to upload failure.")
                    continue
                
                class_name, subject = parse_class_and_subject(pdf, DATA_DIR)
                source_id = source_map[pdf.name]
                
                # Run completely sequentially to avoid RPC CREATE_ARTIFACT failed on the same notebook
                await process_generation(client, nb_id, pdf, source_id, class_name, subject, gen_audio, gen_slides)
                 
            print("\nBatch processing complete.")

        except Exception as e:
            print(f"Fatal error during batch execution: {e}")

if __name__ == "__main__":
    asyncio.run(main())
