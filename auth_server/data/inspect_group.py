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
    target_id = None
    async for dialog in client.iter_dialogs():
        if hasattr(dialog.entity, 'title') and dialog.entity.title:
            if "UPSC PRELIMS STUFF & TEST SERIES 2026 /2027" in dialog.entity.title:
                target_id = dialog.entity.id
                break
    
    if not target_id:
        print("Group not found!")
        return

    print(f"Checking messages in group {target_id}")
    count = 0
    async for message in client.iter_messages(target_id, limit=200):
        if message.media and hasattr(message.media, 'document'):
            doc = message.media.document
            filename = None
            for attr in doc.attributes:
                if hasattr(attr, 'file_name'):
                    filename = attr.file_name
                    break
            
            # Print text and filename
            text = message.text or ""
            text = text.replace('\n', ' ')[:100]
            print(f"DOC: {filename} | TEXT: {text}")
            count += 1
            if count >= 20:
                break

with client:
    client.loop.run_until_complete(main())
