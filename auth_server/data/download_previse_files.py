
import asyncio
import os
import argparse
from datetime import datetime, timedelta, timezone
from telethon import TelegramClient
from dotenv import load_dotenv
from pathlib import Path

load_dotenv()

# Configuration
CHANNEL_ID_DEFAULT = 1222956564  # UPSCPrep.com
FILE_PREFIX = "Previse"
OUTPUT_DIR_DEFAULT = Path("/home/dspratap/Downloads/PrepUp/UPSC/Previse")
DEFAULT_DAYS = 30 # Default to last 30 days if no arguments provided.

api_id = os.getenv("TELEGRAM_API_ID")
api_hash = os.getenv("TELEGRAM_API_HASH")
phone_number = os.getenv("TELEGRAM_PHONE_NUMBER")

if not api_id or not api_hash:
    raise ValueError("TELEGRAM_API_ID and TELEGRAM_API_HASH must be set in .env")

# Reusing session_name
client = TelegramClient("session_name", api_id, api_hash)

async def main(args):
    await client.start(phone=phone_number)
    
    # Ensure output directory exists
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    print(f"📂 Output directory: {output_dir.resolve()}")

    # Determine cutoff date
    if args.start_date:
        try:
            cutoff_date = datetime.strptime(args.start_date, "%Y-%m-%d").replace(tzinfo=timezone.utc)
        except ValueError:
            print("❌ Invalid date format. Please use YYYY-MM-DD.")
            return
    else:
        # Default to args.days (or default) days ago
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=args.days)
    
    # Handle channel_id argument: if it's all digits, convert to int, otherwise keep as string (username)
    channel_identifier = args.channel_id
    if channel_identifier.isdigit() or (channel_identifier.startswith("-") and channel_identifier[1:].isdigit()):
        channel_identifier = int(channel_identifier)

    print(f"🔍 Searching for files starting with '{FILE_PREFIX}' since {cutoff_date.date()} in channel {channel_identifier}...")

    count = 0
    # Search messages
    async for message in client.iter_messages(channel_identifier, limit=None):
        # Check date limit
        if message.date < cutoff_date:
            print(f"🛑 Reached messages older than {cutoff_date.date()} ({message.date.date()}). Stopping.")
            break

        if message.media:
            # Determine filename
            filename = None
            if hasattr(message.media, "document") and message.media.document.attributes:
                for attr in message.media.document.attributes:
                    if hasattr(attr, "file_name"):
                        filename = attr.file_name
                        break
            
            # Check if filename starts with "Previse"
            if filename and filename.startswith(FILE_PREFIX):
                output_path = output_dir / filename
                
                if output_path.exists():
                    print(f"⏩ Skipping {filename} (already exists)")
                    continue

                print(f"⬇️ Downloading: {filename}...")
                await client.download_media(message, str(output_path))
                print(f"✅ Saved to: {output_path}")
                count += 1
                
                # Sleep to be nice to the API
                await asyncio.sleep(1)
            
    print(f"\n🎉 Download complete! Total files downloaded: {count}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Download files starting with 'Previse' from Telegram within a time limit.")
    parser.add_argument("--days", type=int, default=DEFAULT_DAYS, help="Number of days to look back (default: 30).")
    parser.add_argument("--start-date", type=str, help="Start date in YYYY-MM-DD format (overrides --days).")
    parser.add_argument("--channel-id", type=str, default="UPSCprepIAS", help="Telegram Channel ID or Username (default: UPSCprepIAS).")
    parser.add_argument("--output-dir", type=str, default=str(OUTPUT_DIR_DEFAULT), help=f"Output directory (default: {OUTPUT_DIR_DEFAULT}).")

    args = parser.parse_args()

    with client:
        client.loop.run_until_complete(main(args))
