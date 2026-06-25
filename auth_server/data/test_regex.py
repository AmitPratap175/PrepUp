import re

def clean_question(text: str) -> str:
    text = text.strip()
    stem_starts = (
        r'(?:\d{1,2}\.|Which of|Select the|How many|What is|Consider|'
        r'With reference|Match|Choose|Identify|Arrange)'
    )
    soft = re.compile(r'\n(?!\s*' + stem_starts + r')', re.IGNORECASE)
    prev = None
    while prev != text:
        prev = text
        text = soft.sub(' ', text)
    return re.sub(r'  +', ' ', text).strip()

def parse_qp_text(qp_text):
    questions = {}
    
    qp_text = re.sub(r'www\.visionias\.in.*?(?:\n|$)', '\n', qp_text, flags=re.IGNORECASE)
    qp_text = re.sub(r'©Vision IAS.*?(?:\n|$)', '\n', qp_text, flags=re.IGNORECASE)
    qp_text = re.sub(r'\n\s*\d+\s*\n', '\n', qp_text)
    
    pattern = re.compile(
        r'(?:^|\n|\s)(\d{1,3})\.\s+'
        r'(.*?)'
        r'\([aA]\)\s+(.*?)'
        r'\([bB]\)\s+(.*?)'
        r'\([cC]\)\s+(.*?)'
        r'\([dD]\)\s+(.*?)'
        r'(?=(?:^|\n|\s)\d{1,3}\.\s+[A-Z]|$)',
        re.DOTALL
    )
    
    matches = pattern.finditer("\n" + qp_text)
    
    for m in matches:
        q_num = int(m.group(1))
        q_text = m.group(2).strip()
        
        questions[q_num] = {
            "qid": f"q-{q_num}",
            "question_text": clean_question(q_text),
            "options": [
                {"label": "A", "text": clean_question(m.group(3))},
                {"label": "B", "text": clean_question(m.group(4))},
                {"label": "C", "text": clean_question(m.group(5))},
                {"label": "D", "text": clean_question(m.group(6))}
            ]
        }
    return questions

if __name__ == "__main__":
    import pdfplumber
    import sys
    
    def words_to_text(word_list):
        lines = {}
        for w in word_list:
            y_key = round(w['top'] / 3) * 3
            lines.setdefault(y_key, []).append(w)
        result = []
        for y in sorted(lines):
            line = ' '.join(w['text'] for w in sorted(lines[y], key=lambda w: w['x0']))
            result.append(line)
        return '\n'.join(result)

    def extract_columns(page):
        mid = page.width / 2
        words = page.extract_words(x_tolerance=1, y_tolerance=3)
        left = words_to_text([w for w in words if w['x0'] < mid])
        right = words_to_text([w for w in words if w['x0'] >= mid])
        return left, right

    pdf_path = sys.argv[1]
    qp_text = ""
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages[1:3]:
            left, right = extract_columns(page)
            qp_text += left + "\n" + right + "\n"
            
    questions = parse_qp_text(qp_text)
    for q_num in sorted(questions.keys())[:5]:
        print(f"Q{q_num}: {repr(questions[q_num]['question_text'])}")
