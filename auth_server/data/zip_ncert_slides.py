import shutil
from pathlib import Path

# Paths
BASE_DIR = Path("/home/dspratap/Downloads/PrepUp/auth_server/data/")
MERGED_DIR = BASE_DIR / "NCERTSlides_Merged"
ZIP_OUTPUT = BASE_DIR / "NCERTSlides_Merged"

def main():
    if not MERGED_DIR.exists():
        print(f"Error: The directory {MERGED_DIR} does not exist.")
        return

    print(f"Zipping {MERGED_DIR} into {ZIP_OUTPUT}.zip ...")
    
    # Create the zip archive
    zip_path = shutil.make_archive(
        base_name=str(ZIP_OUTPUT),
        format="zip",
        root_dir=str(MERGED_DIR)
    )
    
    print(f"✅ Successfully created zip file at: {zip_path}")

if __name__ == "__main__":
    main()
