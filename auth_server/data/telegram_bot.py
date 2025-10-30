"""
The Hindu: 1374600389
Backup channel for the Hindu: 2590600180
The Hindu Vocabulary Quizzes: 2362796551
One Piece Chapter 1164: 1467610705
The hindu epapers2: 2608082423
atomic habits [ books ]: 1645328529
"""

import asyncio
import os
from collections import defaultdict
from datetime import datetime
from telethon import TelegramClient
from telethon.tl.types import MessageMediaPoll
from dotenv import load_dotenv
import json
import uuid
import re

load_dotenv()

telegram_groups = {
    "The Hindu": 1374600389,
    "Backup channel for the Hindu": 2590600180,
    "The Hindu Vocabulary Quizzes": 2362796551,
    "One Piece Chapter 1164": 1467610705,
    "The hindu epapers2": 2608082423,
    "atomic habits [ books ]": 1645328529
}

api_id = os.getenv("TELEGRAM_API_ID")
api_hash = os.getenv("TELEGRAM_API_HASH")
phone_number = os.getenv("TELEGRAM_PHONE_NUMBER")
output_md = "hindu_epaper_links-new.md"

client = TelegramClient("session_name", api_id, api_hash)


async def main():
    await client.start(phone=phone_number)
    urls_by_date = defaultdict(list)
    group_id = telegram_groups["The hindu epapers2"]

    print("📋 Fetching all dialogs (groups, channels, and chats)...\n") 
    async for dialog in client.iter_dialogs(): 
        entity = dialog.entity 
        if hasattr(entity, 'title'): # groups/channels have titles 
            if entity.megagroup: 
                chat_type = "Group" 
            elif entity.broadcast: 
                chat_type = "Channel" 
            else: 
                chat_type = "Chat" 
            print(f"{chat_type}: {entity.title} -> {entity.id}") 
            
    print("\n✅ Done listing all groups and channels.")

    async for message in client.iter_messages(group_id, limit=500):
        if message.media and hasattr(message.media, "webpage") and message.media.webpage:
            url = message.media.webpage.url
            msg_date = message.date.strftime("%Y-%m-%d")
            urls_by_date[msg_date].append(url)

    with open(output_md, "w", encoding="utf-8") as f:
        for date, urls in sorted(urls_by_date.items()):
            f.write(f"## {date}\n\n")
            for url in urls:
                f.write(f"- {url}\n")
            f.write("\n")

    print(f"✅ Collected {sum(len(v) for v in urls_by_date.values())} URLs grouped by date")
    print(f"📄 Saved to {output_md}")


def pretty_message(msg):
    data = {
        "id": msg.id,
        "channel_id": getattr(msg.peer_id, "channel_id", None),
        "date": msg.date.isoformat(),
        "message": msg.message or "",
        "post": msg.post,
        "views": msg.views,
        "forwards": msg.forwards,
        "edited_at": msg.edit_date.isoformat() if msg.edit_date else None,
    }

    if isinstance(msg.media, MessageMediaPoll):
        poll = msg.media.poll
        data["media"] = {
            "type": "poll",
            "poll": {
                "id": poll.id,
                "question": poll.question.text,
                "answers": [{"text": ans.text.text} for ans in poll.answers],
                "quiz": poll.quiz,
                "closed": poll.closed,
            },
            "results": {
                "total_voters": getattr(msg.media.results, "total_voters", None)
            },
        }

    return data


def clean_question_text(text: str) -> str:
    """
    Removes prefixes like '(5)' or '5.' from question text.
    Example:
        '(5) What is AI?' → 'What is AI?'
        '12. Define ethics.' → 'Define ethics.'
    """
    return re.sub(r"^\(?\d+\)?[\.\)]?\s*", "", text).strip()


def clean_option_text(option: str) -> str:
    """
    Removes prefixes like '(a)', 'a)', 'A.', 'd)' etc.
    Example:
        '(a) Melodramatic' → 'Melodramatic'
    """
    return re.sub(r"^[\(\[]?[a-dA-D][\)\].-]?\s*", "", option).strip()


def convert_to_question_schema(data):
    """Convert Telegram poll messages to standardized question JSON schema."""
    cleaned = []
    counter = 1
    for msg in data:
        if "media" in msg and msg["media"]["type"] == "poll":
            poll = msg["media"]["poll"]
            question_text = clean_question_text(poll["question"])

            if question_text == "Is the level of quizzes good,\nOr should I make some changes?":
                continue  # skip feedback polls

            qid = f"quiz-{counter}"
            answers = poll.get("answers", [])

            options = []
            for i, ans in enumerate(answers):
                label = chr(65 + i)
                option_text = clean_option_text(ans["text"])
                options.append({
                    "data_option": str(i + 1),
                    "label": label,
                    "option_text": option_text,
                    "is_correct": False
                })

            entry = {
                "qid": qid,
                "passage_text": "",
                "question_text": question_text,
                "options": options,
                "correct_option_data": None,
                "solution_text": "",
                "image_url": "",
                "full_markdown": (
                    f"### Question ({qid})\n\n"
                    f"**Question:** {question_text}\n\n"
                    "**Options:**\n" +
                    "\n".join([f"- **{opt['label']}**. {opt['option_text']}" for opt in options])
                ),
            }

            cleaned.append(entry)
            counter += 1
    return cleaned


async def scrape_vocab():
    data = []
    output_json = "hindu_vocab_quizzes.json"
    group_id = telegram_groups["The Hindu Vocabulary Quizzes"]
    await client.start(phone=phone_number)

    async for message in client.iter_messages(group_id, limit=100):
        msg_data = pretty_message(message)
        data.append(msg_data)

    with open(output_json, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"✅ Saved raw data to {output_json}")


# Run async sections
with client:
    client.loop.run_until_complete(main())
    client.loop.run_until_complete(scrape_vocab())

# Convert to question JSON
input_file = "hindu_vocab_quizzes.json"
output_file = "cat/docs/vocab.json"

with open(input_file, "r", encoding="utf-8") as f:
    data = json.load(f)

questions = convert_to_question_schema(data)

with open(output_file, "w", encoding="utf-8") as f:
    json.dump({"questions": questions}, f, indent=2, ensure_ascii=False)

print(f"✅ Extracted {len(questions)} questions saved to {output_file}")