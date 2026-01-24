
import os
import re
import shutil
from pathlib import Path
from datetime import datetime

# Configuration
SOURCE_DIR = Path("/home/dspratap/Downloads/PrepUp/UPSC/CA")

# Regex patterns for different date formats
# 1. "Current Affairs - The Indian Express - 13 December, 2025.pdf" -> "%d %B, %Y"
# 2. "Current Affairs - The Indian Express - 10 October 2025.pdf" -> "%d %B %Y"
# 3. "CURRENT AFFAIRS - 19 Oct 2025.pdf" -> "%d %b %Y"
# 4. "CURRENT AFFAIRS – TH – 10 Nov 2025.pdf" -> "%d %b %Y" (handled by generic search)

DATE_PATTERNS = [
    (r"(\d{1,2})\s+([A-Za-z]+),\s+(\d{4})", "%d %B, %Y"),  # 13 December, 2025
    (r"(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})", "%d %B %Y"),     # 10 October 2025
    (r"(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})", "%d %b %Y"),   # 19 Oct 2025
]

def parse_date(filename):
    """Attempt to parse date from filename using multiple patterns."""
    for pattern, date_fmt in DATE_PATTERNS:
        match = re.search(pattern, filename)
        if match:
            date_str = match.group(0)
            try:
                # Special handling for "Oct" vs "October" if regex is too greedy
                # The patterns above separate %B (full) and %b (abbr)
                # But Python's %b matches "Oct", %B matches "October"
                return datetime.strptime(date_str, date_fmt)
            except ValueError:
                continue
    return None

def main():
    if not SOURCE_DIR.exists():
        print(f"❌ Source directory not found: {SOURCE_DIR}")
        return

    print(f"📂 Scanning {SOURCE_DIR}...")
    
    files = [f for f in SOURCE_DIR.iterdir() if f.is_file() and f.suffix.lower() == '.pdf']
    
    moved_count = 0
    skipped_count = 0

    for file_path in files:
        filename = file_path.name
        date_obj = parse_date(filename)
        
        if date_obj:
            year = date_obj.strftime("%Y")
            month = date_obj.strftime("%B")  # Full month name e.g., "December"
            day = date_obj.strftime("%d")    # Zero-padded day e.g., "01"
            
            # Destination: UPSC/CA/{Year}/{Month}/{Day}
            # Note: User asked for "months and dates in separate folders"
            # Interpreting as Year -> Month -> Date gives granular sorting.
            # Or maybe just Month folder?
            # User said: "sort ... according to months and dates in fseparate folders"
            # Usually implies Year/Month hierarchy. Let's do Year/Month. 
            # If they want Day folders too, that might be too nested for 1 file per day.
            # Let's stick to Year/Month for now as it's cleaner. 
            # Wait, user said "months AND dates". 
            # Let's do Year/Month/Date to be safe with specific request "dates in separate folders".
            
            dest_dir = SOURCE_DIR / year / month / day
            dest_dir.mkdir(parents=True, exist_ok=True)
            
            dest_path = dest_dir / filename
            
            if dest_path.exists():
                print(f"⏩ Skipping {filename} (already in destination)")
                skipped_count += 1
            else:
                shutil.move(str(file_path), str(dest_path))
                print(f"✅ Moved {filename} -> {dest_dir.relative_to(SOURCE_DIR)}")
                moved_count += 1
        else:
            print(f"⚠️ Could not parse date for: {filename}")
            skipped_count += 1

    print(f"\n🎉 Sorting complete!")
    print(f"Moved: {moved_count}")
    print(f"Skipped/Failed: {skipped_count}")

    # Remove empty directories if any (optional cleanup)

if __name__ == "__main__":
    main()
