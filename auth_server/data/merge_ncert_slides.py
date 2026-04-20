import os
import re
from pathlib import Path
from pypdf import PdfWriter

# Config
BASE_DIR = Path("/home/dspratap/Downloads/PrepUp/auth_server/data/NCERTSlides")
OUT_DIR = Path("/home/dspratap/Downloads/PrepUp/auth_server/data/NCERTSlides_Merged")

def natural_key(path):
    # Sort logically so "Ch 2" comes before "Ch 10"
    return [int(text) if text.isdigit() else text.lower() for text in re.split(r'(\d+)', path.name)]

def main():
    if not BASE_DIR.exists():
        print(f"Directory {BASE_DIR} does not exist.")
        return

    # Create output dir
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    print(f"Output folder created at {OUT_DIR}")

    # Iterate over classes
    for class_dir in BASE_DIR.iterdir():
        if not class_dir.is_dir():
            continue
        class_name = class_dir.name

        # Iterate over subjects
        for subject_dir in class_dir.iterdir():
            if not subject_dir.is_dir():
                continue
            subject_name = subject_dir.name

            # Find PDFs
            pdfs = list(subject_dir.glob("*.pdf"))
            if not pdfs:
                print(f"No PDFs found in {class_name}/{subject_name}")
                continue

            # Sort sequentially
            pdfs.sort(key=natural_key)

            print(f"\nMerging {len(pdfs)} PDFs for {class_name} - {subject_name}...")
            merger = PdfWriter()

            for pdf in pdfs:
                print(f"  - Adding {pdf.name}")
                merger.append(pdf)

            # Output path: save directly in merged dir
            output_file = OUT_DIR / f"{class_name}_{subject_name}_Merged.pdf"

            with open(output_file, "wb") as f_out:
                merger.write(f_out)
            
            merger.close()
            print(f"  ✅ Saved merged PDF to: {output_file}")

if __name__ == "__main__":
    main()
