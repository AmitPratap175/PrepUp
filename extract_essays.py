import pymupdf4llm
import json
import re
import os

PDF_PATH = "/home/dspratap/Downloads/PrepUp/151_Essays_for_IAS_PCS_&_other_Competitive_Exams_3rd_Disha_Experts.pdf"
OUTPUT_PATH = "/home/dspratap/Downloads/PrepUp/frontend/client/public/data/151_essays.json"
INDEX_DUMP_PATH = "/tmp/index_dump.txt"

def parse_index():
    # ... existing index parsing logic ...
    # Wait, I shouldn't just comment it out. I'll keep it.
    with open(INDEX_DUMP_PATH, "r", encoding="utf-8") as f:
        lines = f.read().splitlines()

    essays = []
    current_number = 1
    current_title_parts = []
    current_pages = ""

    for line in lines:
        line = line.strip()
        if not line: continue
        if line.startswith("--- PAGE"): continue
        if line.startswith("SECTION"): continue
        
        match = re.search(r"^(" + str(current_number) + r")(?!\d)(.*?)$", line)
        if match:
            if current_number > 1:
                title = " ".join(current_title_parts).strip()
                if current_pages.endswith("-"):
                    current_pages = current_pages.strip("-")
                    
                if "-" in current_pages:
                    parts = current_pages.split("-")
                    s = parts[0]
                    e = parts[1] if len(parts)>1 and parts[1] else s
                    try:
                        start_page, end_page = int(s), int(e)
                    except ValueError:
                        start_page = end_page = 0
                else:
                    try:
                        start_page = end_page = int(current_pages) if current_pages else 0
                    except ValueError:
                        start_page = end_page = 0
                        
                essays.append({
                    "id": f"essay_{current_number - 1}",
                    "number": current_number - 1,
                    "title": title,
                    "start_page": start_page,
                    "end_page": end_page
                })
            
            text = match.group(2).strip()
            pages_match = re.search(r"(\d+-?\d*)$", text)
            if pages_match:
                candidate = pages_match.group(1)
                current_pages = candidate
                current_title_parts = [text[:pages_match.start()].strip()]
            else:
                current_pages = ""
                current_title_parts = [text]
                
            current_number += 1
        else:
            match_trailing_page = re.match(r"^(.*?)\s*(\d+)$", line)
            if match_trailing_page and not current_pages.endswith(match_trailing_page.group(2)):
                if match_trailing_page.group(1).strip():
                    current_title_parts.append(match_trailing_page.group(1).strip())
                if current_pages.endswith("-"):
                    current_pages += match_trailing_page.group(2)
            else:
                current_title_parts.append(line)

    if current_number == 152:
        title = " ".join(current_title_parts).strip()
        current_pages = current_pages.strip("-")
        if "-" in current_pages:
            parts = current_pages.split("-")
            s = parts[0]
            e = parts[1] if len(parts)>1 and parts[1] else s
            try:
                start_page, end_page = int(s), int(e)
            except ValueError:
                start_page = end_page = 0
        else:
            try:
                start_page = end_page = int(current_pages) if current_pages else 0
            except ValueError:
                start_page = end_page = 0
        essays.append({
            "id": f"essay_151",
            "number": 151,
            "title": title,
            "start_page": start_page,
            "end_page": end_page
        })

    return essays

def extract_essays():
    essays_meta = parse_index()
    print(f"Parsed {len(essays_meta)} entries from index.")

    results = []
    
    for essay in essays_meta:
        # Grab a wide buffer: Offset from 19 to 21
        # start_page in TOC corresponds to actual PDF page + 19/20
        # Example: Essay 1 is on TOC page 1, which is PDF page 20
        start_idx = essay["start_page"] + 19
        end_idx = essay["end_page"] + 19
        
        # We add a small buffer but not too much to avoid capturing parts of the previous/next essay
        # Usually one page is enough if the ranges are correct.
        # But TOC sometimes points to the very start.
        
        # We need 0-indexed list of pages for pymupdf4llm
        pages = list(range(start_idx, end_idx + 1))
        
        try:
            # extract_pages is 0-indexed.
            content = pymupdf4llm.to_markdown(PDF_PATH, pages=pages)
            
            # Clean up content a bit: remove things like page numbers if they are separated
            # or recurring headers. pymupdf4llm is usually pretty good though.
            
            results.append({
                "id": essay["id"],
                "number": essay["number"],
                "title": essay["title"],
                "content": content.strip()
            })
            print(f"Extracted Essay {essay['number']}: {essay['title'][:30]}...")
        except Exception as e:
            print(f"Error extracting essay {essay['number']}: {e}")

    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    print(f"Saved to {OUTPUT_PATH}")

if __name__ == "__main__":
    extract_essays()
