import os
import re
from pathlib import Path
from pypdf import PdfWriter

# Config
BASE_DIR = Path("/home/dspratap/Downloads/PrepUp/auth_server/data/NCERTSlides")

def main():
    if not BASE_DIR.exists():
        print(f"Directory {BASE_DIR} does not exist.")
        return

    # Regex to extract the base name and the part number.
    # Matches: "Some Title Here (Part 1 Of 3).pdf" or "Some Title (Part 2 of 10).pdf"
    part_regex = re.compile(r"^(.*?)\s*\(Part\s+(\d+)\s+[oO]f\s+(\d+)\)\.pdf$")

    groups = {}

    # Traverse all directories in NCERTSlides
    for class_dir in BASE_DIR.iterdir():
        if not class_dir.is_dir():
            continue
        for subject_dir in class_dir.iterdir():
            if not subject_dir.is_dir():
                continue
            
            for pdf_path in subject_dir.glob("*.pdf"):
                match = part_regex.match(pdf_path.name)
                if match:
                    base_name = match.group(1)
                    part_num = int(match.group(2))
                    
                    key = (subject_dir, base_name)
                    if key not in groups:
                        groups[key] = []
                    groups[key].append((part_num, pdf_path))

    if not groups:
        print("No multi-part PDFs found to merge.")
        return

    for (subject_dir, base_name), parts in groups.items():
        # Sort by part number to ensure proper sequential ordering
        parts.sort(key=lambda x: x[0])
        
        output_file = subject_dir / f"{base_name}.pdf"
        print(f"\nMerging {len(parts)} parts for: {base_name}")
        
        merger = PdfWriter()
        for part_num, pdf_path in parts:
            print(f"  - Adding part {part_num}: {pdf_path.name}")
            try:
                merger.append(pdf_path)
            except Exception as e:
                print(f"    ❌ Error appending {pdf_path.name}: {e}")
            
        with open(output_file, "wb") as f_out:
            merger.write(f_out)
        
        merger.close()
        print(f"  ✅ Saved sequentially merged PDF to: {output_file}")
        
        # Optional: remove original parts after successful merge
        for _, pdf_path in parts:
            try:
                pdf_path.unlink()
                print(f"     Deleted original part: {pdf_path.name}")
            except Exception as e:
                pass

    print("\n✅ Successfully combined all multipart slide chapters across the dataset!")

if __name__ == "__main__":
    main()
