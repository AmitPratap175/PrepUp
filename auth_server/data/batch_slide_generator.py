import asyncio
import time
from pathlib import Path
from notebooklm import NotebookLMClient, SlideDeckFormat, SlideDeckLength

DATA_DIR = Path("/home/dspratap/Downloads/PrepUp/UPSC/Slides")
STORAGE_PATH = "/home/dspratap/.notebooklm/storage_state.json"

async def generate_slide_from_pdf(client, pdf_path):
    print(f"Processing {pdf_path.name}...")
    
    # Determine output filename matching quiz generator naming convention
    # Logic: pdf.stem.replace("_", " ").title()
    safe_title = pdf_path.stem.replace("_", " ").title()
    output_filename = f"{safe_title}.pdf"
    
    # Save to a dedicated folder
    output_dir = DATA_DIR / "GeneratedSlides"
    output_dir.mkdir(exist_ok=True)
    
    output_path = output_dir / output_filename

    if output_path.exists():
        print(f"⏩ Skipping {pdf_path.name} (already exists at {output_path})")
        return False

    # Create notebook
    nb_title = f"Slide Gen: {pdf_path.stem}"
    nb = await client.notebooks.create(nb_title)
    print(f"Created notebook: {nb.title} ({nb.id})")

    try:
        # Add source
        print("Uploading source...")
        await client.sources.add_file(nb.id, pdf_path, wait=True)

        
        # Generate Slides
        print("Generating slides...")
        status = await client.artifacts.generate_slide_deck(
            nb.id,
            slide_format=SlideDeckFormat.DETAILED_DECK,
            slide_length=SlideDeckLength.DEFAULT
        )
        await client.artifacts.wait_for_completion(nb.id, status.task_id, timeout=12000)

        # Download Slide Deck
        print(f"Downloading slides to {output_path}...")
        await client.artifacts.download_slide_deck(nb.id, str(output_path))
        
        print(f"Slides saved to {output_path}")
        return True
        
    except Exception as e:
        print(f"Error processing {pdf_path.name}: {e}")
        return True
    finally:
        await client.notebooks.delete(nb.id)
        print("Notebook deleted.")

async def main():
    pdfs = list(DATA_DIR.glob("*.pdf"))
    if not pdfs:
        print("No PDFs found in data directory.")
        return

    print(f"Found {len(pdfs)} PDFs. Starting batch generation...")

    async with await NotebookLMClient.from_storage(STORAGE_PATH) as client:
        for i, pdf in enumerate(pdfs):
            did_work = await generate_slide_from_pdf(client, pdf)

            if did_work and i < len(pdfs) - 1:
                print("Waiting 10 seconds before next file...")
                print(100*"-")
                time.sleep(120)

if __name__ == "__main__":
    asyncio.run(main())
