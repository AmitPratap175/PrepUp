"""
Telegram → Google Drive  (stream-through, no local accumulation)
────────────────────────────────────────────────────────────────
For each PDF in the channel:
    1. Download to a temp file
    2. Upload to Google Drive  (folder structure: YYYY/MM/)
    3. Delete the temp file
    4. Move on to the next PDF

Only PDFs are processed.  All messages are scanned (no date / prefix filter).

Dependencies:
    pip install telethon python-dotenv \
                google-api-python-client google-auth-httplib2 google-auth-oauthlib

Google Cloud setup (one-time):
    1. Enable Drive API at https://console.cloud.google.com/
    2. Create OAuth 2.0 credentials (Desktop app) → save as credentials.json
       beside this script.
    3. First run: browser opens for consent → token.json saved for reuse.

.env keys expected:
    TELEGRAM_API_ID
    TELEGRAM_API_HASH
    TELEGRAM_PHONE_NUMBER
"""

import asyncio
import os
import argparse
import mimetypes
import tempfile
from datetime import datetime, timezone
from pathlib import Path

from telethon import TelegramClient
from dotenv import load_dotenv

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload

# ─── Configuration ────────────────────────────────────────────────────────────

load_dotenv()

CHANNEL_ID_DEFAULT = -1003714502360          # RBI GRADE B WARRIOR
SCOPES             = ["https://www.googleapis.com/auth/drive"]
SCRIPT_DIR         = Path(__file__).parent
GDRIVE_CREDS_FILE  = SCRIPT_DIR / "credentials.json"
GDRIVE_TOKEN_FILE  = SCRIPT_DIR / "token.json"

api_id       = os.getenv("TELEGRAM_API_ID")
api_hash     = os.getenv("TELEGRAM_API_HASH")
phone_number = os.getenv("TELEGRAM_PHONE_NUMBER")

if not api_id or not api_hash:
    raise ValueError("TELEGRAM_API_ID and TELEGRAM_API_HASH must be set in .env")

client = TelegramClient("session_rbi", api_id, api_hash)


# ─── Google Drive helpers ──────────────────────────────────────────────────────

def get_drive_service():
    creds = None
    if GDRIVE_TOKEN_FILE.exists():
        creds = Credentials.from_authorized_user_file(str(GDRIVE_TOKEN_FILE), SCOPES)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            if not GDRIVE_CREDS_FILE.exists():
                raise FileNotFoundError(
                    f"credentials.json not found at {GDRIVE_CREDS_FILE}.\n"
                    "Download it from Google Cloud Console → APIs & Services → Credentials."
                )
            flow  = InstalledAppFlow.from_client_secrets_file(str(GDRIVE_CREDS_FILE), SCOPES)
            creds = flow.run_local_server(port=0)
        GDRIVE_TOKEN_FILE.write_text(creds.to_json())
        print(f"✅ Drive token saved → {GDRIVE_TOKEN_FILE}")

    return build("drive", "v3", credentials=creds)


class DriveUploader:
    """Upload files to Drive, mirroring a sub-folder path under a root folder."""

    def __init__(self, service, root_folder_id: str):
        self.service        = service
        self.root_folder_id = root_folder_id
        self._cache: dict[str, str] = {}  # local path str → Drive folder ID

    # ── internal ──────────────────────────────────────────────────────────────

    def _find_folder(self, name: str, parent_id: str) -> str | None:
        q = (
            f"name='{name}' and '{parent_id}' in parents "
            f"and mimeType='application/vnd.google-apps.folder' and trashed=false"
        )
        res = self.service.files().list(q=q, fields="files(id)").execute()
        hits = res.get("files", [])
        return hits[0]["id"] if hits else None

    def _make_folder(self, name: str, parent_id: str) -> str:
        meta   = {"name": name, "mimeType": "application/vnd.google-apps.folder", "parents": [parent_id]}
        folder = self.service.files().create(body=meta, fields="id").execute()
        print(f"   📁 Created Drive folder: {name}")
        return folder["id"]

    def _get_or_create(self, name: str, parent_id: str) -> str:
        fid = self._find_folder(name, parent_id)
        return fid if fid else self._make_folder(name, parent_id)

    def _parent_id_for(self, year: str, month: str) -> str:
        """Return (creating if needed) the Drive folder ID for YYYY/MM."""
        year_key  = year
        month_key = f"{year}/{month}"

        if year_key not in self._cache:
            self._cache[year_key] = self._get_or_create(year, self.root_folder_id)

        if month_key not in self._cache:
            self._cache[month_key] = self._get_or_create(month, self._cache[year_key])

        return self._cache[month_key]

    def _already_on_drive(self, filename: str, parent_id: str) -> bool:
        q = f"name='{filename}' and '{parent_id}' in parents and trashed=false"
        res = self.service.files().list(q=q, fields="files(id)").execute()
        return bool(res.get("files"))

    # ── public ────────────────────────────────────────────────────────────────

    def upload(self, local_file: Path, msg_date: datetime) -> bool:
        """
        Upload local_file to Drive under YYYY/MM/ derived from msg_date.
        Returns True if uploaded, False if skipped (duplicate).
        """
        year      = str(msg_date.year)
        month     = f"{msg_date.month:02d}"
        parent_id = self._parent_id_for(year, month)
        filename  = local_file.name

        if self._already_on_drive(filename, parent_id):
            print(f"   ⏩ Drive: '{filename}' already exists — skipping upload")
            return False

        mime, _ = mimetypes.guess_type(str(local_file))
        mime    = mime or "application/pdf"
        media   = MediaFileUpload(str(local_file), mimetype=mime, resumable=True)

        self.service.files().create(
            body={"name": filename, "parents": [parent_id]},
            media_body=media,
            fields="id",
        ).execute()
        return True


# ─── Progress tracker (simple flat file) ──────────────────────────────────────

class ProgressLog:
    """
    Persists message IDs that have already been processed so the script
    can be safely interrupted and resumed.
    """

    def __init__(self, path: Path):
        self.path = path
        self._done: set[int] = set()
        if path.exists():
            for line in path.read_text().splitlines():
                line = line.strip()
                if line.isdigit():
                    self._done.add(int(line))
        print(f"📋 Progress log: {path} ({len(self._done)} messages already processed)")

    def seen(self, msg_id: int) -> bool:
        return msg_id in self._done

    def mark(self, msg_id: int):
        self._done.add(msg_id)
        with self.path.open("a") as f:
            f.write(f"{msg_id}\n")


# ─── Main ─────────────────────────────────────────────────────────────────────

async def main(args):
    await client.start(phone=phone_number)

    # Google Drive
    print("🔑 Authenticating with Google Drive …")
    service  = get_drive_service()
    uploader = DriveUploader(service, args.drive_folder_id)
    print(f"☁️  Drive root folder ID: {args.drive_folder_id}\n")

    # Progress log (for safe resume)
    progress = ProgressLog(SCRIPT_DIR / "progress_rbi.log")

    # Temp dir for the single-file-at-a-time download
    tmp_dir = Path(tempfile.mkdtemp(prefix="tg_rbi_"))
    print(f"🗂  Temp directory: {tmp_dir}\n")

    channel_id = args.channel_id
    if str(channel_id).lstrip("-").isdigit():
        channel_id = int(channel_id)

    downloaded = 0
    uploaded   = 0
    skipped    = 0
    errors     = 0

    print(f"🔍 Scanning ALL messages in channel {channel_id} for PDFs …\n")

    async for message in client.iter_messages(channel_id, limit=None):

        if not message.media:
            continue

        # ── Is there a document attached? ────────────────────────────────────
        doc = getattr(message.media, "document", None)
        if doc is None:
            continue

        # ── Extract filename ─────────────────────────────────────────────────
        filename = None
        for attr in doc.attributes:
            if hasattr(attr, "file_name"):
                filename = attr.file_name
                break

        if not filename:
            # Fall back: some PDFs come without a name attribute; use message id
            mime = getattr(doc, "mime_type", "") or ""
            if "pdf" in mime.lower():
                filename = f"message_{message.id}.pdf"
            else:
                continue

        # ── Only PDFs ─────────────────────────────────────────────────────────
        is_pdf = (
            filename.lower().endswith(".pdf")
            or (getattr(doc, "mime_type", "") or "").lower() == "application/pdf"
        )
        if not is_pdf:
            continue

        # ── Already processed? ───────────────────────────────────────────────
        if progress.seen(message.id):
            skipped += 1
            continue

        msg_date = message.date.astimezone(timezone.utc)
        tmp_path = tmp_dir / filename

        print(f"─── [{msg_date.date()}] {filename}")

        # 1. DOWNLOAD ─────────────────────────────────────────────────────────
        try:
            print(f"   ⬇️  Downloading …")
            await client.download_media(message, str(tmp_path))
            size_kb = tmp_path.stat().st_size // 1024
            print(f"   ✅ Downloaded ({size_kb:,} KB)")
            downloaded += 1
        except Exception as e:
            print(f"   ❌ Download failed: {e}")
            errors += 1
            if tmp_path.exists():
                tmp_path.unlink()
            continue

        # 2. UPLOAD to Drive ───────────────────────────────────────────────────
        try:
            print(f"   ☁️  Uploading to Drive (/{msg_date.year}/{msg_date.month:02d}/) …")
            ok = uploader.upload(tmp_path, msg_date)
            if ok:
                print(f"   ✅ Uploaded to Drive")
                uploaded += 1
            # (duplicate message printed inside uploader)
        except Exception as e:
            print(f"   ❌ Upload failed: {e}")
            errors += 1
            # Keep the local file so it can be retried; do NOT mark as done
            continue

        # 3. DELETE local temp file ────────────────────────────────────────────
        tmp_path.unlink()
        print(f"   🗑️  Local copy deleted")

        # 4. Mark as processed ─────────────────────────────────────────────────
        progress.mark(message.id)

        # Breathe between files
        await asyncio.sleep(1)

    # Cleanup temp dir if empty
    try:
        tmp_dir.rmdir()
    except OSError:
        pass  # not empty means some uploads failed; leave files for retry

    print(
        f"\n{'─'*50}\n"
        f"🎉 All done!\n"
        f"   Downloaded : {downloaded}\n"
        f"   Uploaded   : {uploaded}\n"
        f"   Skipped    : {skipped}\n"
        f"   Errors     : {errors}\n"
    )


# ─── Entry point ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Stream PDFs from a Telegram channel into Google Drive one at a time."
    )
    parser.add_argument(
        "--channel-id", type=str, default=str(CHANNEL_ID_DEFAULT),
        help=f"Telegram channel ID or username (default: {CHANNEL_ID_DEFAULT}).",
    )
    parser.add_argument(
        "--drive-folder-id", type=str, required=True,
        help=(
            "Google Drive root folder ID.  "
            "Find it in the URL: drive.google.com/drive/folders/<ID>"
        ),
    )

    args = parser.parse_args()
    with client:
        client.loop.run_until_complete(main(args))
