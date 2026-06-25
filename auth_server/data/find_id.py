import asyncio
import os
from telethon import TelegramClient
from dotenv import load_dotenv

load_dotenv()

api_id = os.getenv("TELEGRAM_API_ID")
api_hash = os.getenv("TELEGRAM_API_HASH")
phone_number = os.getenv("TELEGRAM_PHONE_NUMBER")

client = TelegramClient("session_name", api_id, api_hash)

async def main():
    await client.start(phone=phone_number)
    print("📋 Fetching all dialogs...")
    async for dialog in client.iter_dialogs():
        if hasattr(dialog.entity, 'title') and dialog.entity.title:
            if "UPSC PRELIMS STUFF" in dialog.entity.title or "2026 /2027" in dialog.entity.title:
                print(f"FOUND: {dialog.entity.title} -> {dialog.entity.id}")

with client:
    client.loop.run_until_complete(main())
