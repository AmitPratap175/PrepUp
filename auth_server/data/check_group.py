import asyncio
import os
from telethon import TelegramClient
from pathlib import Path
from dotenv import load_dotenv
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

TELEGRAM_API_ID = os.getenv("TELEGRAM_API_ID")
TELEGRAM_API_HASH = os.getenv("TELEGRAM_API_HASH")
TELEGRAM_PHONE_NUMBER = os.getenv("TELEGRAM_PHONE_NUMBER")

async def main():
    client = TelegramClient("/home/dspratap/Downloads/PrepUp/auth_server/data/session_name", TELEGRAM_API_ID, TELEGRAM_API_HASH)
    await client.start(phone=TELEGRAM_PHONE_NUMBER)
    
    group_id = -1001826937774
    try:
        entity = await client.get_entity(group_id)
        print(f"Group name: {entity.title}")
    except Exception as e:
        print(f"Error getting group by ID: {e}")
        
    print("\nLooking for group 'English Editorials PDF Hindi Editorials pdf'...")
    async for dialog in client.iter_dialogs():
        if "English" in dialog.title and "Editorial" in dialog.title:
            print(f"Found: {dialog.title} -> {dialog.id}")

asyncio.run(main())
