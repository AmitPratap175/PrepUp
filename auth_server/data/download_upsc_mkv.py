"""
Telegram MKV Downloader — UPSC Mathematics Optional Lectures
─────────────────────────────────────────────────────────────
Source   : Telegram Saved Messages ("me")
Output   : /media/dspratap/Maxtor/MathOptionalLectures/
Registry : <output>/registry.json  (auto-created, resume-safe)
Reads every message in Saved Messages, filters for video files whose
caption matches the FD4 lecture format, parses the Vid Id and Video
Title, maps them to UPSC Maths Optional chapter codes, and downloads
them with a live progress bar.
NOTE: Although the caption says ".mkv", the actual files are .mp4.
      The downloader saves them with the correct .mp4 extension.
Expected caption format:
    [🎥]Vid Id : 247
    Video Title : Dynamics 06 [1280x720p] .mkv
    Batch Name : Foundation Course (FD4) for Mathematics for UPSC CSE Mains 2025
    Extracted by MAVERICK
Output filename: {CHAPTER_CODE} - {Clean Title}.mp4
    e.g.  DY06 - Dynamics 06.mp4
          FD11 - Fluid dynamics 11.mp4
          ME09 - Mechanics 09.mp4
Chapter codes used:
    RAC  Real Analysis & Calculus     LA   Linear Algebra
    CA   Complex Analysis             MA   Matrices & Analysis
    ODE  Ordinary Differential Eqs.   PDE  Partial Differential Eqs.
    VA   Vector Analysis              AG   Abstract Algebra
    ME   Mechanics                    FD   Fluid Dynamics
    DY   Dynamics                     ST   Statics
    LPP  Linear Programming           NA   Numerical Analysis
    CP   Calculus (Paper I)
Duplicate / resume logic:
    • Vid Id already "done" in registry  → skipped forever
    • File already on disk               → skipped (no overwrite)
    • "failed" / "in_progress"          → retried next run
    • Partial file from crash           → deleted, retried clean
.env (place beside this script):
    TELEGRAM_API_ID=...
    TELEGRAM_API_HASH=...
    TELEGRAM_PHONE_NUMBER=+91...
Usage:
    uv run download_upsc_mkv.py                        # download all
    uv run download_upsc_mkv.py --dry-run              # scan + print, no save
    uv run download_upsc_mkv.py --limit 20             # test: first 20 msgs
    uv run download_upsc_mkv.py status                 # print registry table
    uv run download_upsc_mkv.py --output-dir /alt/dir  # override output dir
Dependencies:
    pip install telethon python-dotenv
"""
import asyncio
import json
import os
import re
import shutil
import sys
import argparse
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from telethon import TelegramClient
from telethon.tl.types import DocumentAttributeFilename
from dotenv import load_dotenv
# ─── Hardcoded defaults ───────────────────────────────────────────────────────
DEFAULT_ENTITY     = "me"           # Telegram Saved Messages
DEFAULT_OUTPUT_DIR = "/media/dspratap/Maxtor/MathOptionalLectures"
# ─── Credentials ──────────────────────────────────────────────────────────────
load_dotenv()
SCRIPT_DIR   = Path(__file__).parent
SESSION_FILE = SCRIPT_DIR / "session_upsc_maths"
API_ID   = os.getenv("TELEGRAM_API_ID", "")
API_HASH = os.getenv("TELEGRAM_API_HASH", "")
PHONE    = os.getenv("TELEGRAM_PHONE_NUMBER", "")
if not API_ID or not API_HASH:
    print("❌  TELEGRAM_API_ID and TELEGRAM_API_HASH must be set in .env")
    sys.exit(1)
client = TelegramClient(str(SESSION_FILE), int(API_ID), API_HASH)
# ─── Chapter-code detection ───────────────────────────────────────────────────
# Ordered most-specific → least-specific; first match wins.
CHAPTER_PATTERNS: list[tuple[str, re.Pattern]] = [
    # RAC beats bare "Calculus" and bare "Real Analysis"
    ("RAC", re.compile(r'Real\s+Analysis\s*(?:&|and)\s*[Cc]alculus',  re.IGNORECASE)),
    ("RAC", re.compile(r'Real\s+Analysis\s*\d',                        re.IGNORECASE)),
    ("RAC", re.compile(r'Real\s+Analysis',                             re.IGNORECASE)),
    ("CA",  re.compile(r'Complex\s+Analysis',                          re.IGNORECASE)),
    ("LA",  re.compile(r'Linear\s+Algebra',                            re.IGNORECASE)),
    ("MA",  re.compile(r'Matri(?:x|ces)',                              re.IGNORECASE)),
    ("ODE", re.compile(r'Ordinary\s+Differential|O\.?D\.?E\b',        re.IGNORECASE)),
    ("PDE", re.compile(r'Partial\s+Differential|P\.?D\.?E\b',         re.IGNORECASE)),
    ("VA",  re.compile(r'Vector\s+(?:Analysis|Calculus)',              re.IGNORECASE)),
    ("AG",  re.compile(r'Abstract\s+Algebra|Group\s+Theory',          re.IGNORECASE)),
    ("FD",  re.compile(r'Fluid\s+[Dd]ynamics',                        re.IGNORECASE)),
    ("ME",  re.compile(r'\bMech(?:anics)?\b',                          re.IGNORECASE)),
    ("DY",  re.compile(r'\bDynamics\b',                                re.IGNORECASE)),
    ("ST",  re.compile(r'\bStatics\b',                                 re.IGNORECASE)),
    ("LPP", re.compile(r'Linear\s+Programming|L\.?P\.?P\b',           re.IGNORECASE)),
    ("NA",  re.compile(r'Numerical\s+Analysis',                        re.IGNORECASE)),
    ("CP",  re.compile(r'\bCalculus\b',                                re.IGNORECASE)),
]
# Caption field regexes — flexible enough for [🎥], [🎬], spacing variants
_VID_ID_RE = re.compile(r'Vid\s*Id\s*:\s*(\d+)',     re.IGNORECASE)
_TITLE_RE  = re.compile(r'Video\s*Title\s*:\s*(.+)', re.IGNORECASE)
_BATCH_RE  = re.compile(r'Batch\s*Name\s*:\s*(.+)',  re.IGNORECASE)
# Batch marker so we only pick up FD4 UPSC maths lectures
_BATCH_FILTER_RE = re.compile(r'Foundation Course.*FD4.*Mathematics.*UPSC', re.IGNORECASE)
# ─── Helpers ──────────────────────────────────────────────────────────────────
def parse_caption(text: str) -> dict | None:
    """
    Parse an FD4 lecture caption.
    Returns {vid_id, raw_title, batch_name} or None if no match.
    """
    if not text:
        return None
    # Must be an FD4 UPSC Maths batch message
    if not _BATCH_FILTER_RE.search(text):
        return None
    vm = _VID_ID_RE.search(text)
    tm = _TITLE_RE.search(text)
    if not vm or not tm:
        return None
    bm = _BATCH_RE.search(text)
    return {
        "vid_id":     vm.group(1).zfill(3),
        "raw_title":  tm.group(1).strip(),
        "batch_name": bm.group(1).strip() if bm else "",
    }
def detect_chapter(raw_title: str) -> tuple[str, str]:
    """
    Detect chapter code and lecture number from a raw Video Title.
    'Dynamics 06 [1280x720p] .mkv'  →  ('DY', '06')
    'Mech 9 [1280x720p] .mkv'       →  ('ME', '09')
    Falls back to ('UNKNOWN', '000').
    """
    # Strip resolution tag and pseudo-extension
    clean = re.sub(r'\s*\[.*?\]\s*', ' ', raw_title)
    clean = re.sub(r'\.mkv\s*$', '',  clean, flags=re.IGNORECASE).strip()
    chapter = "UNKNOWN"
    for code, pat in CHAPTER_PATTERNS:
        if pat.search(clean):
            chapter = code
            break
    m = re.search(r'(\d+)\s*$', clean)
    num = m.group(1).zfill(2) if m else "00"
    return chapter, num
def make_filename(chapter: str, num: str, raw_title: str) -> str:
    """
    Build a safe filesystem filename.
    'DY', '06', 'Dynamics 06 [1280x720p] .mkv'
        → 'DY06 - Dynamics 06.mp4'
    """
    title = re.sub(r'\s*\[.*?\]\s*', ' ', raw_title)
    title = re.sub(r'\.mkv\s*$', '',  title, flags=re.IGNORECASE)
    title = re.sub(r'[\\/*?:"<>|]',  '',  title).strip()
    # Normalise multiple spaces
    title = re.sub(r'\s+', ' ', title)
    return f"{chapter}{num} - {title}.mp4"
def is_video_doc(doc) -> bool:
    """
    Accept any document that is an mp4/mkv video.
    (The actual files are mp4 even though the caption says .mkv.)
    """
    mime = (getattr(doc, 'mime_type', '') or '').lower()
    if 'mp4' in mime or 'matroska' in mime or 'video' in mime:
        return True
    for attr in (getattr(doc, 'attributes', None) or []):
        if isinstance(attr, DocumentAttributeFilename):
            ext = attr.file_name.lower()
            if ext.endswith('.mp4') or ext.endswith('.mkv'):
                return True
    return False
# ─── Registry ─────────────────────────────────────────────────────────────────
class Registry:
    """
    Persistent JSON registry  {vid_id → record}.
    Status values
    ─────────────
    done         never re-downloaded
    failed       retried next run
    in_progress  script was killed mid-download; retried next run
    """
    def __init__(self, path: Path):
        self.path  = path
        self._data: dict[str, dict] = {}
        if path.exists():
            try:
                self._data = json.loads(path.read_text(encoding="utf-8"))
            except json.JSONDecodeError:
                print("⚠️  registry.json is corrupt — starting fresh.")
        done = sum(1 for v in self._data.values() if v.get("status") == "done")
        print(f"📋 Registry : {path}  ({len(self._data)} entries, {done} done)")
    def is_done(self, vid_id: str) -> bool:
        return self._data.get(vid_id, {}).get("status") == "done"
    def start(self, vid_id: str, meta: dict):
        self._data[vid_id] = {**meta, "status": "in_progress", "started_at": _ts()}
        self._flush()
    def finish(self, vid_id: str, filename: str, size_mb: float):
        if vid_id in self._data:
            self._data[vid_id].update(
                status="done", filename=filename,
                size_mb=round(size_mb, 2), finished_at=_ts(),
            )
            self._flush()
    def fail(self, vid_id: str, reason: str):
        if vid_id in self._data:
            self._data[vid_id].update(status="failed", error=str(reason))
            self._flush()
    def summary(self) -> dict[str, int]:
        counts: dict[str, int] = {"done": 0, "failed": 0, "in_progress": 0}
        for v in self._data.values():
            s = v.get("status", "")
            if s in counts:
                counts[s] += 1
        return counts
    def print_table(self):
        if not self._data:
            print("  (empty registry)")
            return
        fmt = "{:>5}  {:<9}  {:<13}  {:>8}  {}"
        hdr = fmt.format("VidId", "Code", "Status", "MB", "Filename")
        print(hdr)
        print("─" * len(hdr))
        for vid_id in sorted(self._data):
            r = self._data[vid_id]
            print(fmt.format(
                vid_id,
                r.get("chapter_code", "?"),
                r.get("status", "?"),
                f"{r.get('size_mb', 0):.1f}",
                r.get("filename", "—"),
            ))
        sm = self.summary()
        print(f"\n  Done: {sm['done']}  Failed: {sm['failed']}  "
              f"In-progress: {sm['in_progress']}")
    def _flush(self):
        self.path.write_text(
            json.dumps(self._data, indent=2, ensure_ascii=False),
            encoding="utf-8",
        )
def _ts() -> str:
    return datetime.now(timezone.utc).isoformat()
# ─── Progress bar ─────────────────────────────────────────────────────────────
def make_progress(label: str):
    last = [-1]
    def cb(cur: int, total: int):
        if not total:
            return
        pct = min(cur * 100 // total, 100)
        if pct == last[0]:
            return
        last[0] = pct
        bar = "█" * (pct // 5) + "░" * (20 - pct // 5)
        print(
            f"\r   ⬇  [{bar}] {pct:3d}%"
            f"  {cur/1_048_576:.1f}/{total/1_048_576:.1f} MB"
            f"  {label}",
            end="", flush=True,
        )
    return cb
# ─── Main ─────────────────────────────────────────────────────────────────────
async def run(args):
    output_dir = Path(args.output_dir).expanduser().resolve()
    output_dir.mkdir(parents=True, exist_ok=True)

    # Temporary landing folder on the fast internal disk (/tmp).
    # Downloads land here first; only a quick move to the external drive
    # happens once the file is fully written.
    tmp_dir = Path(tempfile.gettempdir()) / "upsc_mkv_tmp"
    tmp_dir.mkdir(exist_ok=True)

    registry = Registry(output_dir / "registry.json")
    if args.command == "status":
        registry.print_table()
        return
    await client.start(phone=PHONE)
    me = await client.get_me()
    print(f"\n✅ Logged in as {me.first_name} (@{me.username or '—'})")
    print(f"📡 Source  : Saved Messages (me)")
    print(f"📂 Output  : {output_dir}")
    if args.dry_run:
        print("🔎 DRY RUN — nothing will be saved")
    print()
    stats = dict(downloaded=0, skipped_done=0, skipped_dup=0,
                 skipped_no_cap=0, errors=0)
    scan_limit = args.limit or None
    print(f"🔍 Scanning Saved Messages (limit={scan_limit or 'all'}) …\n")
    async for message in client.iter_messages("me", limit=scan_limit):
        # ── must have a document ───────────────────────────────────────────
        doc = getattr(message.media, "document", None)
        if doc is None:
            continue
        # ── must be a video file ───────────────────────────────────────────
        if not is_video_doc(doc):
            continue
        # ── must be an FD4 UPSC maths lecture ─────────────────────────────
        meta = parse_caption(message.message or "")
        if meta is None:
            stats["skipped_no_cap"] += 1
            continue
        vid_id    = meta["vid_id"]
        raw_title = meta["raw_title"]
        # ── already done ───────────────────────────────────────────────────
        if registry.is_done(vid_id):
            stats["skipped_done"] += 1
            continue
        # ── build output filename ──────────────────────────────────────────
        chapter, num = detect_chapter(raw_title)
        filename     = make_filename(chapter, num, raw_title)
        dest         = output_dir / filename
        size_mb      = (doc.size or 0) / 1_048_576
        # ── already on disk (different vid_id) ────────────────────────────
        if dest.exists():
            print(f"⚠️  [{vid_id}] '{filename}' already on disk — skipping.")
            stats["skipped_dup"] += 1
            continue
        # ── print what we found ────────────────────────────────────────────
        print(f"─── Vid {vid_id}  │  {chapter}{num}")
        print(f"    Title  : {raw_title}")
        print(f"    File   : {filename}")
        print(f"    Size   : {size_mb:.1f} MB  │  msg_id={message.id}")
        if args.dry_run:
            print("    ✔ (dry-run)\n")
            continue
        # ── register as in-progress ────────────────────────────────────────
        registry.start(vid_id, {
            "vid_id":       vid_id,
            "chapter_code": f"{chapter}{num}",
            "raw_title":    raw_title,
            "batch_name":   meta["batch_name"],
            "message_id":   message.id,
        })
        # ── download to tmp, move to final dest, then register ─────────────
        tmp_dest = tmp_dir / filename
        try:
            # 1. Download into the temporary folder
            await client.download_media(
                message,
                file=str(tmp_dest),
                progress_callback=make_progress(f"vid {vid_id}"),
            )
            print()   # newline after progress bar

            # 2. Move completed file to the final destination
            shutil.move(str(tmp_dest), str(dest))

            # 3. Only now mark as done in the registry
            actual_mb = dest.stat().st_size / 1_048_576
            registry.finish(vid_id, filename, actual_mb)
            print(f"    ✅ Saved → {filename}  ({actual_mb:.1f} MB)\n")
            stats["downloaded"] += 1
        except Exception as exc:
            print(f"\n    ❌ Error: {exc}\n")
            registry.fail(vid_id, str(exc))
            # Clean up whichever partial file exists
            for stale in (tmp_dest, dest):
                if stale.exists():
                    stale.unlink()
            stats["errors"] += 1
            continue
        await asyncio.sleep(args.delay)
    # ── summary ────────────────────────────────────────────────────────────────
    sm = registry.summary()
    print("═" * 55)
    print("🎉 Run complete!")
    print(f"   Downloaded this run   : {stats['downloaded']}")
    print(f"   Skipped (done)        : {stats['skipped_done']}")
    print(f"   Skipped (dup on disk) : {stats['skipped_dup']}")
    print(f"   Skipped (no caption)  : {stats['skipped_no_cap']}")
    print(f"   Errors (will retry)   : {stats['errors']}")
    print(f"   ── Registry ──────────────────────────")
    print(f"   Total done            : {sm['done']}")
    print(f"   Failed (retry next)   : {sm['failed']}")
    print(f"   In-progress (stale)   : {sm['in_progress']}")
    print("═" * 55)
# ─── CLI ──────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Download UPSC Maths Optional lectures from Telegram Saved Messages.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    sub = parser.add_subparsers(dest="command")
    # download (default) ───────────────────────────────────────────────────────
    dl = sub.add_parser("download", help="Download lectures (default).")
    dl.add_argument(
        "--output-dir", "-o",
        default=DEFAULT_OUTPUT_DIR,
        help=f"Local folder for video files + registry.json "
             f"(default: {DEFAULT_OUTPUT_DIR!r}).",
    )
    dl.add_argument(
        "--limit", "-n", type=int, default=0,
        help="Max messages to scan (0 = all). Use a small number for testing.",
    )
    dl.add_argument(
        "--delay", "-d", type=float, default=1.5,
        help="Seconds to wait between downloads (default: 1.5).",
    )
    dl.add_argument(
        "--dry-run", action="store_true",
        help="Scan and print what would be downloaded, without saving anything.",
    )
    # status ───────────────────────────────────────────────────────────────────
    st = sub.add_parser("status", help="Print registry table and exit.")
    st.add_argument(
        "--output-dir", "-o",
        default=DEFAULT_OUTPUT_DIR,
        help=f"Folder containing registry.json "
             f"(default: {DEFAULT_OUTPUT_DIR!r}).",
    )
    args = parser.parse_args()
    # No sub-command typed → treat everything as "download"
    if args.command is None:
        args = parser.parse_args(["download"] + sys.argv[1:])
    # Patch status so run() doesn't KeyError
    if args.command == "status":
        args.limit   = 0
        args.delay   = 0.0
        args.dry_run = False
    with client:
        client.loop.run_until_complete(run(args))