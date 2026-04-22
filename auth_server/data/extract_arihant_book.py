#!/usr/bin/env python3
"""
Arihant 'Know Your State' MCQ Extractor
========================================
Extracts all MCQs from 2-column chapter books like "Know Your State Odisha".

Key insight: PDF text extraction merges the 2 columns, corrupting questions.
Solution: use word bounding boxes to split each page into left/right columns,
reconstruct clean per-column text, then parse questions per column.

Critical fix: question numbers like "1", "2" etc. appear on their OWN LINE
before the question text. These must NOT be stripped as "page numbers".
We strip page header noise ONLY, not standalone numbers.

Usage:
    python extract_arihant_book.py --input book.pdf --output questions.json
    python extract_arihant_book.py --input-dir ./pdfs --output all.json

Requirements:
    pip install pdfplumber
"""

import re
import json
import argparse
from pathlib import Path

import pdfplumber


# ─── Chapter titles (Odisha book) ─────────────────────────────────────────────
CHAPTER_TITLES = {
    1:  "Ancient History of Odisha",
    2:  "Medieval History of Odisha",
    3:  "Modern History of Odisha",
    4:  "Freedom Struggle in Odisha",
    5:  "Geographical Features of Odisha",
    6:  "Climate and Soils of Odisha",
    7:  "Drainage System of Odisha",
    8:  "Agriculture and Irrigation in Odisha",
    9:  "Animal Husbandry in Odisha",
    10: "Forests of Odisha",
    11: "National Parks and Wildlife Sanctuaries in Odisha",
    12: "Mineral Resources of Odisha",
    13: "Industries of Odisha",
    14: "Energy Sector of Odisha",
    15: "Transport in Odisha",
    16: "Communication and Cinema in Odisha",
    17: "Formation of Odisha",
    18: "Administrative Set up of Odisha",
    19: "Odisha Judiciary",
    20: "Local Self-Government and Panchayati Raj in Odisha",
    21: "District Profile of Odisha",
    22: "Tourism in Odisha",
    23: "Language and Literature",
    24: "Folk Art, Craft and Culture of Odisha",
    25: "Music and Dance of Odisha",
    26: "Fairs, Festivals and Cuisines of Odisha",
    27: "Sports in Odisha",
    28: "Awards and Honours of Odisha",
    29: "Education and Health in Odisha",
    30: "Caste and Tribes of Odisha",
    31: "Historical and Other Famous Personalities of Odisha",
    32: "Demographic Profile of Odisha",
    33: "Social Welfare Schemes of Odisha",
}

# Strip ONLY the page header line — NOT standalone numbers (they are question numbers)
PAGE_HEADER_RE = re.compile(
    r'(?m)^(?:\d+\s*Know Your State\b.*|Know Your State ODISHA\b.*)$'
)


# ─── Column extractor ──────────────────────────────────────────────────────────

def words_to_text(word_list: list) -> str:
    """Reconstruct text from word bboxes, grouping by y-coordinate (3pt tolerance)."""
    lines: dict[int, list] = {}
    for w in word_list:
        y_key = round(w['top'] / 3) * 3
        lines.setdefault(y_key, []).append(w)
    result = []
    for y in sorted(lines):
        line = ' '.join(w['text'] for w in sorted(lines[y], key=lambda w: w['x0']))
        result.append(line)
    return '\n'.join(result)


def extract_columns(page) -> tuple[str, str]:
    """Return (left_col_text, right_col_text) using word x-positions."""
    mid   = page.width / 2
    words = page.extract_words(x_tolerance=1, y_tolerance=3)
    left  = words_to_text([w for w in words if w['x0'] < mid])
    right = words_to_text([w for w in words if w['x0'] >= mid])
    return left, right


def strip_page_headers(text: str) -> str:
    """Remove page header lines only; preserve standalone numbers (= question numbers)."""
    text = PAGE_HEADER_RE.sub('', text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()


# ─── Answer key parser ─────────────────────────────────────────────────────────

def parse_answer_key(text: str) -> dict[int, str]:
    """
    Parse answer keys in all formats produced by this PDF:

      Merged (old default):  "1.(d) 2.(c) 3.(c)"
      Inline spaced:         "1. (d) 2. (b) 3. (a)"
      Two-row split:
        "1. 2. 3. 4. 5."
        "(d) (c) (c) (a) (a)"

    Strategy: single pass — match "N." then look ahead for "(x)" on the
    same line OR on the very next non-empty line.
    """
    result: dict[int, str] = {}

    lines = [l.strip() for l in text.split('\n')]
    # Remove completely empty lines but track line indices
    non_empty = [(i, l) for i, l in enumerate(lines) if l]

    for li, (line_idx, line) in enumerate(non_empty):
        # Find all "N." occurrences on this line
        num_matches = list(re.finditer(r'(\d+)\.', line))
        if not num_matches:
            continue

        # Check if this line itself has "(x)" answers after each number
        # e.g. "1. (d) 2. (b) 3. (a)"
        inline_pairs = list(re.finditer(r'(\d+)\.\s*\(([a-e])\)', line))
        if inline_pairs:
            for m in inline_pairs:
                result[int(m.group(1))] = m.group(2)
            continue

        # Otherwise this is a numbers-only row — look at next non-empty line
        if li + 1 < len(non_empty):
            next_line = non_empty[li + 1][1]
            let_matches = list(re.finditer(r'\(([a-e])\)', next_line))
            if len(let_matches) == len(num_matches):
                for nm, lm in zip(num_matches, let_matches):
                    result[int(nm.group(1))] = lm.group(1)

    return result


# ─── Text cleaners ─────────────────────────────────────────────────────────────

def clean(text: str) -> str:
    return re.sub(r'\s+', ' ', text).strip()


def clean_question(text: str) -> str:
    """Preserve numbered sub-statements; collapse soft-wraps."""
    text = re.sub(r'\n{2,}', '\n', text)
    stem_starts = (
        r'(?:\d+\.|Which of|Select the|How many|What is|Consider|'
        r'With reference|Match|Choose|Identify|Arrange)'
    )
    soft = re.compile(r'\n(?!' + stem_starts + r')', re.IGNORECASE)
    prev = None
    while prev != text:
        prev = text
        text = soft.sub(' ', text)
    return re.sub(r'  +', ' ', text).strip()


# ─── Option parser ─────────────────────────────────────────────────────────────

def parse_options(raw: str) -> dict[str, str]:
    """Parse '(a) text (b) text ...' — handles inline and one-per-line formats."""
    opts: dict[str, str] = {}
    parts = re.split(r'\(([a-e])\)\s*', raw)
    it = iter(parts[1:])
    for letter, text in zip(it, it):
        v = clean(text)
        if v:
            opts[letter] = v
    return opts


# ─── Question number regex ────────────────────────────────────────────────────
#
# Matches a question number at the start of a line in two forms:
#   Form A:  "1\n"         — number on its own line (most common)
#   Form B:  "4 Which..."  — number + space + non-option text on same line
#
# Must NOT match numbers inside option text like "(b) 261BC" or "(c) 1 only"
#
Q_NUM_RE = re.compile(
    r'(?m)'
    r'^(\d{1,2})'                    # line-start digits
    r'(?:'
    r'(?=\n)'                        # Form A: followed by newline
    r'|'
    r'(?= (?!\([a-e]\))(?=[A-Z]))'   # Form B: space then capital letter (not option)
    r')'
)


def parse_column_questions(text: str) -> dict[int, dict]:
    """
    Parse questions from a clean single-column text stream.
    Returns {q_num: {'question': str, 'options': {letter: text}}}
    """
    questions: dict[int, dict] = {}

    # Collect all (q_num, match_start, body_start) sorted by position
    matches = [
        (int(m.group(1)), m.start(), m.end())
        for m in Q_NUM_RE.finditer(text)
    ]

    for i, (q_num, m_start, body_start) in enumerate(matches):
        # Body ends at the start of the next question marker
        body_end = matches[i + 1][0+1] if i + 1 < len(matches) else len(text)
        # Correct: use match_start of next question
        body_end = matches[i + 1][1] if i + 1 < len(matches) else len(text)
        body = text[body_start:body_end].strip()

        # Split at first option letter
        opt_m = re.search(r'\([a-e]\)', body)
        if opt_m:
            q_text = clean_question(body[:opt_m.start()])
            opts   = parse_options(body[opt_m.start():])
        else:
            q_text = clean_question(body)
            opts   = {}

        if q_text:
            questions[q_num] = {'question': q_text, 'options': opts}

    return questions


# ─── Main processor ────────────────────────────────────────────────────────────

def _extract_overflow_questions(ans_raw: str) -> dict[int, dict]:
    """
    After the answer key rows in ans_raw, remaining questions from the right
    column of the final page appear. Extract them by finding the first
    question-number marker that is followed by real question text (not just
    answer key number rows).

    Heuristic: a line that matches Q_NUM_RE and is followed by a line of
    actual text (not all digits/dots/parens) is a real question start.
    """
    # Skip past the answer key: find position of the first Q that has
    # a text body (not just a bare number or answer-key entry after it).
    lines = ans_raw.split('\n')
    overflow_start_line = None
    for i, line in enumerate(lines):
        m = re.match(r'^(\d{1,2})$', line.strip())  # bare number on own line
        if m:
            q_num = int(m.group(1))
            # Check if the next non-empty line looks like question text
            # (not answer-key row like "(a) (b) (c)")
            for j in range(i+1, min(i+4, len(lines))):
                nxt = lines[j].strip()
                if not nxt:
                    continue
                # If it starts with a capital letter or common question words
                # it's question text, not an answer key row
                if re.match(r'^[A-Z]', nxt) and not re.match(r'^\([a-e]\)', nxt):
                    overflow_start_line = i
                    break
            if overflow_start_line is not None:
                break
        # Also handle "N QuestionText" on same line
        m2 = re.match(r'^(\d{1,2}) (?!\([a-e]\))([A-Z])', line)
        if m2:
            q_num = int(m2.group(1))
            # Make sure this isn't inside an answer key section
            # by checking that a real word follows
            overflow_start_line = i
            break

    if overflow_start_line is None:
        return {}

    overflow_text = '\n'.join(lines[overflow_start_line:])
    return parse_column_questions(overflow_text)


def slugify(text: str) -> str:
    return re.sub(r'[^a-z0-9]+', '-', text.lower()).strip('-')


def process_pdf(pdf_path: Path) -> list[dict]:
    print(f"\nProcessing: {pdf_path.name}")

    # Step 1: extract column text per page
    col_pages: list[tuple[str, str]] = []
    with pdfplumber.open(str(pdf_path)) as pdf:
        print(f"  Pages: {len(pdf.pages)}")
        for page in pdf.pages:
            left, right = extract_columns(page)
            col_pages.append((left, right))

    # Step 2: build single column stream: left_p1, right_p1, left_p2, right_p2...
    full_col_text = ""
    for left, right in col_pages:
        full_col_text += strip_page_headers(left)  + "\n"
        full_col_text += strip_page_headers(right) + "\n"

    # Step 3: split into per-chapter MCQ blocks
    parts = re.split(r'MULTIPLE CHOICE\nQUESTIONS', full_col_text)
    mcq_blocks = parts[1:]   # parts[0] is preamble
    print(f"  MCQ blocks: {len(mcq_blocks)}")

    # Step 4: process each block
    entries = []
    for block_idx, block in enumerate(mcq_blocks):
        chapter_num  = block_idx + 1
        chapter_name = CHAPTER_TITLES.get(chapter_num, f"Chapter {chapter_num}")

        # Split at ANSWERS line
        ans_m = re.search(r'\nANSWERS\n', block)
        if ans_m:
            q_raw   = block[:ans_m.start()]
            ans_raw = block[ans_m.end():]
        else:
            q_raw   = block
            ans_raw = ""

        answer_key = parse_answer_key(ans_raw)
        questions  = parse_column_questions(q_raw)

        # Overflow questions: the last N questions of each chapter physically
        # appear in the RIGHT column of the page that holds ANSWERS in the LEFT
        # column. After the answer key rows, additional questions follow.
        # Cap at max answer key number to avoid pulling next chapter's content.
        max_ans_num = max(answer_key.keys()) if answer_key else 0
        overflow_qs = _extract_overflow_questions(ans_raw)
        # Only keep overflow questions that are within this chapter's answer key range
        for qn, qdata in overflow_qs.items():
            if qn <= max_ans_num:
                questions[qn] = qdata

        n_q = len(questions)
        n_a = len(answer_key)
        print(f"  [{chapter_name[:45]}] {n_q} Qs, {n_a} answers")

        if not questions:
            continue

        id_base  = slugify(f"{pdf_path.stem}-ch{chapter_num}")
        q_entries = []

        for q_num in sorted(questions):
            q = questions[q_num]
            correct_l = answer_key.get(q_num)

            if not q['options']:
                continue

            answer_options = []
            for letter in sorted(q['options']):
                opt: dict = {
                    'text':      q['options'][letter],
                    'isCorrect': letter == correct_l if correct_l else False,
                }
                answer_options.append(opt)

            qid = f"{id_base}-q{q_num}"
            q_entries.append({
                'id':            qid,
                'qid':           qid,
                'type':          'mcq',
                'question':      q['question'],
                'answerOptions': answer_options,
            })

        if q_entries:
            entries.append({
                'title':       f"{pdf_path.stem} — {chapter_name}",
                'subject':     chapter_name,
                'source_file': pdf_path.name,
                'questions':   q_entries,
            })

    total = sum(len(e['questions']) for e in entries)
    print(f"  ✓ {total} questions across {len(entries)} chapters")
    return entries


# ─── Entry point ──────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Extract MCQs from Arihant Know Your State books"
    )
    parser.add_argument('--input',     help='Single PDF file')
    parser.add_argument('--input-dir', help='Folder of PDFs')
    parser.add_argument('--output', default='arihant_questions.json')
    args = parser.parse_args()

    pdf_files: list[Path] = []
    if args.input:
        pdf_files = [Path(args.input)]
    elif args.input_dir:
        pdf_files = sorted(Path(args.input_dir).glob('*.pdf'))
    else:
        parser.error('Provide --input or --input-dir')

    all_entries: list[dict] = []
    for pdf_path in pdf_files:
        all_entries.extend(process_pdf(pdf_path))

    with open(args.output, 'w', encoding='utf-8') as f:
        json.dump(all_entries, f, ensure_ascii=False, indent=2)

    total_q = sum(len(e['questions']) for e in all_entries)
    print(f"\n✅ Done — {len(all_entries)} chapters, {total_q} questions → {args.output}")


if __name__ == '__main__':
    main()