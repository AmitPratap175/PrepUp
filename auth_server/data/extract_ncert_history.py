#!/usr/bin/env python3
"""
NCERT MCQs Indian History Extractor
=====================================
Extracts MCQs from pages 7-107 (PDF indices 6-106) of
"NCERT MCQs Indian History Class 6-12 for UPSC" by Arihant.

Covers: Ancient History chapters 1-9 (~100 pages).

Format per question:
  N.
  Question text
  (Chap X, Class-Y, Old/New NCERT) [optional exam tag]
  [sub-statements 1. 2. 3. …]   ← statement-based questions
  [Codes / (a)…(b)…]            ← options
  Ans. (x)
  j
  Exp. Explanation text…

Usage:
    python extract_ncert_history.py \
        --input "NCERT_MCQs_...pdf" \
        --output ncert_history.json

Requirements:
    pip install pdfplumber
"""

import re, json, argparse
from pathlib import Path
import pdfplumber


# ─── Page range to extract ────────────────────────────────────────────────────
# PDF pages are 0-indexed. Pages 7-107 (1-indexed) = indices 6-106.
PAGE_START = 6    # inclusive, 0-indexed
PAGE_END   = 9999 # will be clamped to actual last page automatically


# ─── Column extractor ──────────────────────────────────────────────────────────

def words_to_text(word_list: list) -> str:
    lines: dict[int, list] = {}
    for w in word_list:
        y_key = round(w['top'] / 3) * 3
        lines.setdefault(y_key, []).append(w)
    return '\n'.join(
        ' '.join(w['text'] for w in sorted(v, key=lambda x: x['x0']))
        for _, v in sorted(lines.items())
    )


def extract_columns(page) -> tuple[str, str]:
    mid   = page.width / 2
    words = page.extract_words(x_tolerance=1, y_tolerance=3)
    left  = words_to_text([w for w in words if w['x0'] < mid])
    right = words_to_text([w for w in words if w['x0'] >= mid])
    return left, right


# ─── Noise stripping ──────────────────────────────────────────────────────────

# Page headers: "NCERT MCQs • Sources of Ancient History  09"  or  "03\nof Ancient History"
PAGE_HDR_RE = re.compile(
    r'(?m)^(?:'
    r'•\s*\n?NCERT\s*\nMCQs.*'           # bullet + NCERT MCQs header
    r'|NCERT\s+MCQs\s*•\s*[A-Za-z ,]+\s*\d+'  # "NCERT MCQs • Chapter Name  N"
    r'|\d{2}\s*\nof\s+[A-Za-z ]+History'  # "03\nof Ancient History"
    r'|\d{2,3}\s*$'                        # standalone page numbers
    r')$',
    re.MULTILINE
)

def strip_noise(text: str) -> str:
    # Remove the "j" separator lines (just a decorative "j" between Ans and Exp)
    text = re.sub(r'(?m)^j\s*$', '', text)
    # Remove page headers
    text = PAGE_HDR_RE.sub('', text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()


# ─── Question splitter ────────────────────────────────────────────────────────

# A question starts with "N." on its own line (1-3 digit number)
Q_START_RE = re.compile(r'(?m)^(\d{1,3})\.\s*$')

def split_into_questions(text: str) -> list[tuple[int, str]]:
    """Split column text into (q_num, body) pairs."""
    matches = [(int(m.group(1) or m.group(2)), m.start(), m.end())
               for m in Q_START_RE.finditer(text)]
    results = []
    for i, (q_num, m_start, body_start) in enumerate(matches):
        body_end = matches[i+1][1] if i+1 < len(matches) else len(text)
        body = text[body_start:body_end].strip()
        results.append((q_num, body))
    return results


# ─── Single question parser ───────────────────────────────────────────────────

def clean(text: str) -> str:
    return re.sub(r'\s+', ' ', text).strip()

def parse_options(raw: str) -> list[tuple[str, str]]:
    """Parse '(a) text (b) text …' — handles both inline and one-per-line."""
    opts = []
    parts = re.split(r'\(([a-d])\)\s*', raw, flags=re.IGNORECASE)
    it = iter(parts[1:])
    for label, text in zip(it, it):
        v = clean(text)
        if v:
            opts.append((label.lower(), v))
    return opts

def parse_question(q_num: int, body: str) -> dict | None:
    """
    Parse a single question body into a structured dict.
    Returns None if body is too short/malformed.
    """
    # Split at "Ans." line
    ans_m = re.search(r'\nAns\.\s*\(([a-d])\)', body, re.IGNORECASE)
    if not ans_m:
        return None

    pre_ans    = body[:ans_m.start()].strip()
    correct    = ans_m.group(1).lower()
    post_ans   = body[ans_m.end():].strip()

    # Extract explanation (after "Exp.")
    exp_m = re.search(r'^Exp\.\s*', post_ans, re.IGNORECASE)
    solution_text = post_ans[exp_m.end():].strip() if exp_m else None

    # Extract NCERT source tag: "(Chap X, Class-Y, Old/New NCERT)"
    src_m = re.search(r'\(Chap[^)]*NCERT[^)]*\)', pre_ans, re.IGNORECASE)
    ncert_source = src_m.group(0) if src_m else None

    # Extract optional exam tag: "(UPSC Pre 2020)" etc.
    exam_m = re.search(r'\((?:UPSC|UPPSC|BPSC|SSC|IAS|CDS|NDA)[^)]*\)', pre_ans, re.IGNORECASE)
    exam_tag = exam_m.group(0) if exam_m else None

    # Remove source/exam tags from pre_ans to get clean question body
    q_pre = pre_ans
    if src_m:
        q_pre = q_pre.replace(src_m.group(0), '')
    if exam_m:
        q_pre = q_pre.replace(exam_m.group(0), '')
    q_pre = q_pre.strip()

    # Split question text from options
    # Options start at "(a)" in the cleaned body
    opt_m = re.search(r'\([a-d]\)', q_pre, re.IGNORECASE)
    if opt_m:
        q_text_raw = q_pre[:opt_m.start()].strip()
        opts_raw   = q_pre[opt_m.start():]
    else:
        q_text_raw = q_pre
        opts_raw   = ''

    # Clean question text (collapse soft wraps but keep statement numbers)
    q_text = _clean_question_text(q_text_raw)

    options = parse_options(opts_raw)
    if not options:
        return None  # skip if we can't parse options

    return {
        'q_num':        q_num,
        'question':     q_text,
        'ncert_source': ncert_source,
        'exam_tag':     exam_tag,
        'options':      options,   # [('a','text'), ('b','text'), …]
        'correct':      correct,   # 'a'/'b'/'c'/'d'
        'solution':     solution_text,
    }


def _clean_question_text(text: str) -> str:
    """Collapse soft-wrapped lines but preserve numbered statement lines."""
    text = re.sub(r'\n{2,}', '\n', text)
    stem = r'(?:\d+\.|Codes|Which|Select|How|What|Consider|With reference|Match|Choose)'
    soft = re.compile(r'\n(?!' + stem + r')', re.IGNORECASE)
    prev = None
    while prev != text:
        prev = text
        text = soft.sub(' ', text)
    return re.sub(r'  +', ' ', text).strip()


# ─── Chapter detection ────────────────────────────────────────────────────────

CHAPTER_MAP = {
    7:   ('01', 'Sources of Ancient History'),
    16:  ('02', 'Pre-History of India'),
    27:  ('03', 'The Indus Valley Civilisation'),
    40:  ('04', 'Vedic Age'),
    57:  ('06', 'Buddhism and Jainism'),
    69:  ('07', 'Mauryan Age'),
    81:  ('08', 'Post-Mauryan Age'),
    96:  ('09', 'Gupta Age'),
    113: ('11', 'History of South India'),
    129: ('12', 'Miscellaneous Aspects of Ancient History'),
    # Medieval History
    139: ('13', 'Medieval History Overview'),
    143: ('14', 'Delhi Sultanate'),
    156: ('15', 'Vijayanagara and Bahmani'),
    168: ('16', 'Mughal Empire'),
    185: ('17', 'Bhakti and Sufi Movement'),
    196: ('18', 'Decline of Mughal Empire'),
    201: ('19', 'Maratha Empire'),
    # Modern History
    214: ('21', 'Advent of European Power'),
    224: ('22', 'Administrative and Economic Policies'),
    236: ('23', 'Major Revolts'),
    242: ('24', 'Socio-Religious Movements'),
    286: ('29', 'Governor-Generals and Viceroys'),
}  # keys = 1-indexed PDF page where chapter starts

def get_chapter(page_1idx: int) -> tuple[str, str]:
    """Return (chapter_num, chapter_name) for a given 1-indexed page."""
    chapter = ('01', 'Sources of Ancient History')
    for pg in sorted(CHAPTER_MAP):
        if pg <= page_1idx:
            chapter = CHAPTER_MAP[pg]
    return chapter


# ─── JSON builder ─────────────────────────────────────────────────────────────

def slugify(text: str) -> str:
    return re.sub(r'[^a-z0-9]+', '-', text.lower()).strip('-')

def build_entry(parsed: dict, chapter_num: str, chapter_name: str, global_idx: int) -> dict:
    opts = parsed['options']
    correct_letter = parsed['correct']
    label_to_num   = {'a':'1','b':'2','c':'3','d':'4'}

    correct_data = None
    options_out  = []
    for label, text in opts:
        num = label_to_num.get(label, str(len(options_out)+1))
        is_correct = (label == correct_letter)
        if is_correct:
            correct_data = num
        options_out.append({
            'data_option': num,
            'label':       label.upper(),
            'option_text': text,
            'is_correct':  is_correct,
        })

    ch_slug = slugify(chapter_name)
    qid = f"ncert-hist-ch{chapter_num}-q{parsed['q_num']}"

    # Build passage text from NCERT source + optional exam tag
    tags = [t for t in [parsed['ncert_source'], parsed['exam_tag']] if t]
    passage = '  '.join(tags) if tags else None

    return {
        'qid':                 qid,
        'passage_text':        passage,
        'question_text':       parsed['question'],
        'image_url':           None,
        'options':             options_out,
        'correct_option_data': correct_data,
        'solution_text':       parsed['solution'],
        'solution_image_url':  None,
        'full_markdown':       f"### Question (qid: {qid})",
        'chapter':             chapter_name,
        'chapter_num':         chapter_num,
    }


# ─── Main ──────────────────────────────────────────────────────────────────────

def process_pdf(pdf_path: Path) -> list[dict]:
    print(f"Processing: {pdf_path.name}")
    print(f"Pages: {PAGE_START+1} – {PAGE_END+1} (0-indexed {PAGE_START}–{PAGE_END})")

    all_entries = []
    global_idx  = 0

    with pdfplumber.open(str(pdf_path)) as pdf:
        for pg_idx in range(PAGE_START, min(PAGE_END + 1, len(pdf.pages))):
            page  = pdf.pages[pg_idx]
            left, right = extract_columns(page)

            # Determine chapter for this page
            ch_num, ch_name = get_chapter(pg_idx + 1)

            for col_text in [left, right]:
                cleaned = strip_noise(col_text)
                q_bodies = split_into_questions(cleaned)

                for q_num, body in q_bodies:
                    parsed = parse_question(q_num, body)
                    if parsed is None:
                        continue
                    entry = build_entry(parsed, ch_num, ch_name, global_idx)
                    all_entries.append(entry)
                    global_idx += 1

    # Deduplicate by qid (same question can appear in left/right across page boundary)
    seen = {}
    for e in all_entries:
        qid = e['qid']
        if qid not in seen:
            seen[qid] = e
    deduped = list(seen.values())

    print(f"\n✓ Extracted {len(deduped)} unique questions")

    # Summary by chapter
    ch_counts: dict[str, int] = {}
    for e in deduped:
        ch_counts[e['chapter']] = ch_counts.get(e['chapter'], 0) + 1
    for ch, cnt in sorted(ch_counts.items()):
        print(f"  {ch}: {cnt} questions")

    return deduped


def main():
    parser = argparse.ArgumentParser(
        description="Extract ~100 pages of NCERT History MCQs"
    )
    parser.add_argument('--input',  default="/media/dspratap/Maxtor/UPSC/Books/NCERT MCQs Indian History Class 6-12 (Old+New) for UPSC , -- Amibh Ranjan, Janmejay Sahani -- S_l, 2022 -- Arihant Publications India limited -- isbn13 9789326191081 -- 2b65631e72595ca40e1deb3bf57df27c -- Anna’s Archive.pdf", help='PDF path')
    parser.add_argument('--output', default='ncert_history_mcqs.json')
    args = parser.parse_args()

    entries = process_pdf(Path(args.input))

    with open(args.output, 'w', encoding='utf-8') as f:
        json.dump(entries, f, ensure_ascii=False, indent=2)

    print(f"\n✅ Saved {len(entries)} questions → {args.output}")


if __name__ == '__main__':
    main()
