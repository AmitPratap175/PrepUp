"""
extract_pyq.py  v6
==================
Extracts UPSC Prelims PYQ questions + answers + explanations from a
Trishna/Unacademy topic-wise solved paper PDF.

Key improvements over v5:
  - Tabs and mid-sentence newlines are cleaned before parsing
  - Enumerated items (I.\t\nPapaya\t\nII.\t\nPineapple) are joined properly
  - Sub-numbered items in explanations are preserved with newlines in rationale
  - Trailing whitespace/tab noise removed from all text fields

Output format:
[
  {
    "title":   "The Beginning of Gandhian Era",
    "subject": "Modern India",
    "questions": [
      {
        "question": "...",
        "answerOptions": [
          {"text": "...", "isCorrect": false},
          {"text": "...", "isCorrect": true, "rationale": "..."}
        ],
        "id":   "pyq-modern-india-gandhian-era-1",
        "qid":  "pyq-modern-india-gandhian-era-1",
        "type": "mcq"
      }
    ]
  }
]

Usage:
    pip install pymupdf
    python extract_pyq.py --pdf book.pdf --out questions.json
"""

import re, json, sys, argparse
from pathlib import Path

try:
    import fitz
except ImportError:
    sys.exit("[ERROR] Install pymupdf:  pip install pymupdf")


# ─────────────────────────────────────────────────────────────────────────────
# 1.  Subject → chapter mapping
# ─────────────────────────────────────────────────────────────────────────────

SUBJECT_MAP: dict[str, str] = {}

def _add(subject: str, *chapters: str):
    for ch in chapters:
        SUBJECT_MAP[ch.lower().strip()] = subject

_add("Modern India",
     "India in the 18th Century",
     "Indian Renaissance and Reform Movements",
     "Early Uprising Against the British and Revolt of 1857",
     "Rise of Indian National Movement: Moderate and Extremists Phase",
     "Phases of Revolutionary Nationalism",
     "The Beginning of Gandhian Era",
     "The National Movement in the 1940s",
     "Development of Press, Education and Civil Services",
     "Independence to Partition")
_add("Ancient India",
     "Prehistoric Period and Indus Valley Civilisation",
     "Vedic and Later Vedic Age",
     "Mauryan and Post-Mauryan Age",
     "Gupta and Post- Gupta Age",
     "Sangam Age")
_add("Medieval India",
     "Delhi Sultanate (1206 AD to 1526 AD)",
     "Mughal Empire (1526 AD to 1761 AD)",
     "Provincial Kingdoms in Medieval India",
     "Religious movement during medieval period",
     "Religious Movement During Medieval Period")
_add("Art & Culture",
     "Architecture and Sculpture",
     "Literature: Religious and Scientific",
     "Performing Arts: Dance, Theatre and Music",
     "Visual Arts: Painting, ceramics and drawing",
     "Indian Philosophy and Bhakti & Sufi Movements",
     "Indian Traditions, Festivals, and Calendars",
     "Miscellaneous")
_add("World Geography",
     "The Earth and the Universe", "Geomorphology", "Climatology",
     "Oceanography", "World Climatic Regions", "Human and Economic Geography", "World Map")
_add("Indian Geography",
     "Physiography of India", "Drainage System of India", "Indian Climate", "Soils",
     "Natural Vegetation in India", "Mineral and Industries", "Agriculture in India", "Indian Map")
_add("Environment & Ecology",
     "Protected Area Network: NP, WS, BR, etc.", "Ecosystem and Ecology",
     "Environmental Pollution", "Biodiversity", "Global Conservation Efforts",
     "National Conservation Efforts", "Climate Change: Causes and Implications",
     "Environment, Sustainable Development and General Issues", "Agriculture")
_add("Indian Polity",
     "Historical Background & Making of Indian Constitution",
     "Features of the Indian Constitution", "Legislature", "Executive", "Judiciary",
     "Local Self Government", "Governance", "Constitutional and Non-constitutional Bodies",
     "Judicial & Quasi-Judicial Bodies")
_add("International Relations",
     "India's Foreign Policy", "India & Its Neighbors",
     "International Groups and Political Organizations", "Places in news")
_add("Indian Economy",
     "1A1: Money: Barter to Bitcoins", "1B1: Bank Classification",
     "1B2: NPA, Bad-Loans, BASEL", "1C: Sharemarket, Companies Act",
     "1D1: Insurance, Pension, Financial inclusion", "2A1: Budget Direct Taxes",
     "2A2: Budget Indirect Taxes GST", "2BC: Finance Commission, BlackMoney, Subsidies",
     "3A: BoP, CAD Currency Exchange",
     "3B: WTO, IMF & other International Organisations & Agreeements",
     "4A: Sectors of Economy- Agriculture",
     "4B: Sectors- MFG, Services, Ease of Doing Biz, IPR, Startup, MSME",
     "4C: NITI, Planning Commission, FYP, Unemployment", "4D: GDP, GNP", "4E: Inflation",
     "5A: Infra: Energy",
     "5B: Infra: Transport, Urban Rural, Communication, Investment, PPP",
     "6A: HRD: Census, Health Hunger", "6B: HRD: Education and Skill",
     "6C: HRD: Poverty", "6D: HRD: Weaker Section,  HDI, SDG", "7: Microeconomics")
_add("Science & Technology",
     "Biotechnology", "Defence Technology", "Space Science", "Communication Technology",
     "Energy", "Physics", "Chemistry", "Biology")
_add("Current Affairs",
     "Current Affairs: India", "Current Affairs: World", "GK/Persons in News", "Miscellaneous")

def get_subject(chapter: str) -> str:
    return SUBJECT_MAP.get(chapter.lower().strip(), "General Studies")


# ─────────────────────────────────────────────────────────────────────────────
# 2.  Raw page text → clean normalised text
# ─────────────────────────────────────────────────────────────────────────────
# PyMuPDF outputs lines like:
#   "I.\t\nPapaya\t\nII.\t\nPineapple\nIII.\t Guava"
# We need to convert that to:
#   "I. Papaya  II. Pineapple  III. Guava"
# while keeping REAL paragraph breaks (blank lines between Q1 and Q2 etc.)

def normalise_page(raw: str) -> str:
    """
    Clean one page of raw PyMuPDF text:
      1. Replace tab characters with a single space everywhere.
      2. Join lines that are continuations (no blank line between them,
         previous line doesn't end a sentence/item naturally).
      3. Collapse multiple spaces to one.
      4. Strip leading/trailing whitespace from each resulting line.
    """
    # Step 1: replace all tabs with space
    text = raw.replace('\t', ' ')

    # Step 2: split into lines; mark which are blank
    lines = text.split('\n')

    # Step 3: smart-join continuation lines
    # A line is a "hard break" (keep as separate line) if:
    #   - it is blank
    #   - it starts a question number:    r"^\d+\. "
    #   - it starts an option:            r"^\([a-d]\) "
    #   - it starts a Roman numeral item: r"^(I|II|III|IV|V|VI|VII|VIII|IX|X)\. "
    #   - it starts a numbered sub-item:  r"^\d+\. "  (same as question — we rely
    #                                      on context to distinguish)
    # Everything else is joined to the previous line with a space.

    HARD_BREAK = re.compile(
        r"^("
        r"\s*$"                          # blank line
        r"|(?:\d+\.)\s"                  # "1. " question or sub-item
        r"|\([a-d]\)\s"                  # "(a) " option
        r"|(?:I{1,3}|IV|VI{0,3}|IX|X{1,3}(?:I{1,3}|IV|VI{0,3}|IX)?)\.\s"  # Roman
        r")",
        re.IGNORECASE
    )

    joined: list[str] = []
    for line in lines:
        stripped = line.strip()
        if not joined:
            joined.append(stripped)
            continue
        # Decide: join to previous or start new?
        if HARD_BREAK.match(line) or not stripped:
            joined.append(stripped)
        else:
            # Previous line ended without terminal punctuation → continuation
            prev = joined[-1]
            if prev:
                joined[-1] = prev + ' ' + stripped
            else:
                joined.append(stripped)

    # Step 4: collapse runs of spaces, strip each line
    result_lines = []
    for ln in joined:
        ln = re.sub(r'  +', ' ', ln).strip()
        result_lines.append(ln)

    return '\n'.join(result_lines)


# ─────────────────────────────────────────────────────────────────────────────
# 3.  Page classification helpers
# ─────────────────────────────────────────────────────────────────────────────

TOC_PAGE_RE = re.compile(r'\s\d{1,3}-\d{1,3}\s*$', re.M)   # "73-75" at line end
DIVIDER_RE  = re.compile(
    r"^(MODERN INDIA|ANCIENT INDIA|MEDIEVAL\s+INDIA|ART\s*&?\s*CULTURE"
    r"|WORLD\s+GEOGRAPHY|INDIAN\s+GEOGRAPHY|ENVIRONMENT"
    r"|INDIAN\s+POLITY|INTERNATIONAL\s+RELATIONS|ECONOMY"
    r"|SCIENCE\s*&\s*TECH|CURRENT\s+AFFAIRS)", re.M | re.I)

def is_skip_page(raw: str) -> bool:
    if TOC_PAGE_RE.search(raw):
        return True
    content = [l.strip() for l in raw.split('\n') if l.strip()]
    if len(content) < 8 and DIVIDER_RE.search(raw):
        return True
    return False

def get_chapter_title(txt: str) -> str:
    """First non-trivial non-numeric line = chapter title (strip -Explanation)."""
    for line in txt.split('\n')[:6]:
        s = line.strip()
        if not s or s.isdigit() or len(s) < 5:
            continue
        if re.match(r'^\d+\.', s):
            break
        title = re.sub(r'\s*[-–_]\s*Explanation.*$', '', s, flags=re.I).strip()
        if title:
            return title
    return ''

def is_explanation_page(txt: str) -> bool:
    return bool(re.search(r'Explanation', '\n'.join(txt.split('\n')[:5]), re.I))


# ─────────────────────────────────────────────────────────────────────────────
# 4.  Explanation parser
# ─────────────────────────────────────────────────────────────────────────────
# After normalisation, entries look like:
#   "1. Answer: (c)"        ← answer line  (number+dot on SAME line as Answer:)
#   "Explanation:"          ← optional label
#   "Rationale text..."
#   "1. Alexander Rea: ..." ← sub-item within rationale
#
# We detect a TOP-LEVEL entry by: line matches r"^\d+\. Answer:"

ANS_ENTRY_RE = re.compile(r'^(\d+)\.\s+Answer\s*:\s*\(?([a-dx\*])\)?', re.I)

def parse_explanations(text: str) -> dict[str, dict]:
    """Returns {q_num: {"answer": letter|None, "rationale": str}}"""
    lines   = text.split('\n')
    result  : dict[str, dict] = {}
    cur_num : str | None = None
    cur_ans : str | None = None
    rat_buf : list[str]  = []

    def save():
        if cur_num is not None:
            result[cur_num] = {
                'answer':    cur_ans,
                'rationale': '\n'.join(rat_buf).strip(),
            }

    for raw in lines:
        s = raw.strip()
        if not s:
            continue

        # Top-level answer entry: "N. Answer: (x)"
        m = ANS_ENTRY_RE.match(s)
        if m:
            save()
            cur_num = m.group(1)
            raw_ans = m.group(2)
            cur_ans = None if raw_ans.upper() == 'X' else raw_ans.strip('()').lower()
            rat_buf = []
            # Inline text after "N. Answer: (x) <something>"
            rest = s[m.end():].strip()
            if rest and not re.match(r'^Explanation\s*:', rest, re.I):
                rat_buf.append(rest)
            continue

        if cur_num is None:
            continue

        # Skip "Explanation:" label
        if re.match(r'^Explanation\s*:\s*$', s, re.I):
            continue

        # Skip page numbers and header echoes
        if s.isdigit() and len(s) <= 2:
            continue
        if re.search(r'Explanation$', s, re.I) and len(s) < 80:
            continue
        if re.match(r'^Note\s*:', s, re.I):
            continue
        if re.match(r'^Answer\s*:', s, re.I):
            # stray "Answer:" without a number — skip
            continue

        rat_buf.append(s)

    save()
    return result


# ─────────────────────────────────────────────────────────────────────────────
# 5.  Question parser
# ─────────────────────────────────────────────────────────────────────────────
# After normalisation, lines look like:
#   "1. Consider the following fruits:"          ← Q with inline stem
#   "I. Papaya  II. Pineapple  III. Guava"       ← enumerated items (joined)
#   "How many of the above..."                   ← continuation
#   "(2025)"                                      ← year
#   "(a) Only one"                                ← option
#
# A "new question" starts on a line matching r"^\d+\. \S" where:
#   - no current question exists  OR
#   - current question already has options  (body collection is done)

YEAR_RE = re.compile(r'^\((\d{4}(?:[-–]\d{4})?)\)$')
OPT_RE  = re.compile(r'^\(([a-d])\)\s+(.*)', re.I)
QNUM_RE = re.compile(r'^(\d+)\.\s+(.*)')

def parse_questions(text: str) -> list[dict]:
    """Returns [{num, question, year, options:{a..d}, option_order:[]}]"""
    lines        = text.split('\n')
    out          : list[dict]  = []
    cur          : dict | None = None
    cur_opt      : str | None  = None

    def save():
        if cur and cur.get('question') and cur.get('options'):
            out.append(cur)

    for raw in lines:
        s = raw.strip()

        # ── Question-number line ─────────────────────────────────────────────
        m_q = QNUM_RE.match(s)
        if m_q:
            num    = m_q.group(1)
            inline = m_q.group(2).strip()
            can_start = (cur is None) or bool(cur.get('options'))
            if can_start:
                save()
                cur     = {'num': num, 'question': inline,
                           'year': '', 'options': {}, 'option_order': []}
                cur_opt = None
            else:
                # Sub-item inside question body
                part = f'{num}. {inline}' if inline else f'{num}.'
                if cur_opt:
                    cur['options'][cur_opt] += '\n' + part
                else:
                    cur['question'] += '\n' + part
            continue

        if cur is None:
            continue

        # ── Year ─────────────────────────────────────────────────────────────
        ym = YEAR_RE.match(s)
        if ym:
            if not cur['year']:
                cur['year'] = ym.group(1)
            continue

        # ── Option ───────────────────────────────────────────────────────────
        om = OPT_RE.match(s)
        if om:
            lbl  = om.group(1).lower()
            body = om.group(2).strip()
            cur['options'][lbl] = body
            if lbl not in cur['option_order']:
                cur['option_order'].append(lbl)
            cur_opt = lbl
            continue

        # ── Skip blanks, page numbers, header lines ───────────────────────────
        if not s:
            continue
        if s.isdigit() and len(s) <= 3:
            continue

        # ── Continuation ──────────────────────────────────────────────────────
        if cur_opt and cur['options'].get(cur_opt) is not None:
            cur['options'][cur_opt] += ' ' + s
        elif cur.get('question'):
            cur['question'] += ' ' + s
        else:
            cur['question'] = s

    save()
    return out


# ─────────────────────────────────────────────────────────────────────────────
# 6.  Utilities
# ─────────────────────────────────────────────────────────────────────────────

def slugify(text: str) -> str:
    t = re.sub(r'[^a-z0-9\s]', ' ', text.lower())
    t = re.sub(r'\s+', '-', t.strip())
    return t[:60].strip('-')

def clean_field(s: str) -> str:
    """Remove stray whitespace from a text field."""
    # Collapse multiple spaces (but preserve intentional newlines)
    lines = [re.sub(r'  +', ' ', l).strip() for l in s.split('\n')]
    # Drop leading/trailing blank lines
    while lines and not lines[0]:  lines.pop(0)
    while lines and not lines[-1]: lines.pop()
    return '\n'.join(lines)


# ─────────────────────────────────────────────────────────────────────────────
# 7.  Main pipeline
# ─────────────────────────────────────────────────────────────────────────────

def extract_all(pdf_path: str) -> list[dict]:
    doc   = fitz.open(pdf_path)
    total = len(doc)
    chapter_pages: dict[str, dict] = {}

    print(f'  Processing {total} pages …')
    for i in range(total):
        if i % 100 == 0:
            print(f'    Page {i+1}/{total} …', flush=True)

        raw = doc[i].get_text()

        if is_skip_page(raw):
            continue

        title = get_chapter_title(raw)
        if not title or len(title) < 5:
            continue

        # Normalise AFTER classification (classification uses raw)
        txt = normalise_page(raw)

        if title not in chapter_pages:
            chapter_pages[title] = {'q_texts': [], 'expl_texts': []}

        if is_explanation_page(raw):
            chapter_pages[title]['expl_texts'].append(txt)
        else:
            chapter_pages[title]['q_texts'].append(txt)

    doc.close()

    output: list[dict] = []
    for title, data in chapter_pages.items():
        subject  = get_subject(title)
        slug     = slugify(title)
        q_text   = '\n\n'.join(data['q_texts'])
        expl_txt = '\n\n'.join(data['expl_texts'])

        raw_qs  = parse_questions(q_text)
        explans = parse_explanations(expl_txt)

        if not raw_qs:
            continue

        questions_out: list[dict] = []
        for rq in raw_qs:
            num       = rq['num']
            stem      = clean_field(rq['question'])
            opts      = rq['options']
            year      = rq['year']
            order     = rq['option_order'] or ['a','b','c','d']
            expl      = explans.get(num, {})
            correct   = expl.get('answer')
            rationale = clean_field(expl.get('rationale', ''))

            if year:
                stem = f'{stem} ({year})'

            if len(opts) < 2:
                continue

            answer_options = []
            for lbl in order:
                if lbl not in opts:
                    continue
                is_correct = (lbl == correct)
                opt: dict  = {'text': clean_field(opts[lbl]), 'isCorrect': is_correct}
                if is_correct and rationale:
                    opt['rationale'] = rationale
                answer_options.append(opt)

            if not answer_options:
                continue

            qid = f'pyq-{slug}-{num}'
            questions_out.append({
                'question':      stem,
                'answerOptions': answer_options,
                'id':            qid,
                'qid':           qid,
                'type':          'mcq',
            })

        if questions_out:
            output.append({
                'title':     title,
                'subject':   subject,
                'questions': questions_out,
            })

    return output


# ─────────────────────────────────────────────────────────────────────────────
# 8.  Entry point
# ─────────────────────────────────────────────────────────────────────────────

def main():
    ap = argparse.ArgumentParser(
        description='Extract UPSC PYQ MCQs from a Trishna/Unacademy topic-wise PDF.')
    ap.add_argument('--pdf', required=True, help='Path to source PDF.')
    ap.add_argument('--out', default='pyq_questions.json', help='Output JSON path.')
    args = ap.parse_args()

    if not Path(args.pdf).exists():
        sys.exit(f'[ERROR] File not found: {args.pdf}')

    print(f'[1/2] Extracting from {args.pdf} …')
    result = extract_all(args.pdf)

    print(f'[2/2] Writing {args.out} …')
    with open(args.out, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    total_q  = sum(len(ch['questions']) for ch in result)
    with_ans = sum(
        sum(1 for q in ch['questions'] if any(o['isCorrect'] for o in q['answerOptions']))
        for ch in result)
    with_rat = sum(
        sum(1 for q in ch['questions'] if any(o.get('rationale') for o in q['answerOptions']))
        for ch in result)

    print(f'\n  Chapters       : {len(result)}')
    print(f'  Questions      : {total_q}')
    print(f'  With answer    : {with_ans}/{total_q}  ({100*with_ans//max(1,total_q)}%)')
    print(f'  With rationale : {with_rat}/{total_q}  ({100*with_rat//max(1,total_q)}%)')
    print()
    for ch in result:
        n = len(ch['questions'])
        a = sum(1 for q in ch['questions'] if any(o['isCorrect'] for o in q['answerOptions']))
        print(f"  [{ch['subject']}] {ch['title']}: {n} Qs  ({a} answered)")

if __name__ == '__main__':
    main()
