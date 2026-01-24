
import asyncio
import os
from datetime import datetime
from telethon import TelegramClient
from dotenv import load_dotenv
from pathlib import Path

load_dotenv()

# Configuration
CHANNEL_ID = 1222956564  # UPSCPrep.com
SEARCH_PATTERN = "Current Affairs - The Indian Express - "
OUTPUT_DIR = Path("/home/dspratap/Downloads/PrepUp/UPSC/CA")

api_id = os.getenv("TELEGRAM_API_ID")
api_hash = os.getenv("TELEGRAM_API_HASH")
phone_number = os.getenv("TELEGRAM_PHONE_NUMBER")

if not api_id or not api_hash:
    raise ValueError("TELEGRAM_API_ID and TELEGRAM_API_HASH must be set in .env")

client = TelegramClient("session_name", api_id, api_hash)

async def main():
    
    await client.start(phone=phone_number)
    
    # Ensure output directory exists
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    print(f"📂 Output directory: {OUTPUT_DIR.resolve()}")

    target_pattern = "The Indian Express"
    print(f"🔍 Searching for files matching '{target_pattern}' from January 2026 in channel {CHANNEL_ID}...")

    count = 0
    async for message in client.iter_messages(CHANNEL_ID, limit=None):
        # Filter for January 2026
        if message.date.year == 2026 and message.date.month == 1:
            if message.text and target_pattern.lower() in message.text.lower():
                if message.media:
                    # Determine filename
                    filename = None
                    if hasattr(message.media, "document") and message.media.document.attributes:
                        for attr in message.media.document.attributes:
                            if hasattr(attr, "file_name"):
                                filename = attr.file_name
                                break
                    
                    if not filename:
                        # Fallback filename using date and message ID
                        date_str = message.date.strftime("%Y%m%d")
                        filename = f"UPSC_Current_Affairs_{date_str}_{message.id}.pdf"

                    output_path = OUTPUT_DIR / filename
                    
                    if output_path.exists():
                        print(f"⏩ Skipping {filename} (already exists)")
                        continue

                    print(f"⬇️ Downloading: {filename}...")
                    await client.download_media(message, str(output_path))
                    print(f"✅ Saved to: {output_path}")
                    count += 1
                    
                    # Sleep to be nice to the API
                    await asyncio.sleep(1)
        
        # Optimization: If we've gone past January 2026 (into 2025), stop.
        elif message.date.year < 2026:
            print(f"🛑 Reached messages older than January 2026 ({message.date.date()}). Stopping.")
            break
            
    print(f"\n🎉 Download complete! Total files downloaded: {count}")

if __name__ == "__main__":
    with client:
        client.loop.run_until_complete(main())
