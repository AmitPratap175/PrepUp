import re
import json
import pypdf
import os

def pdf_to_json(pdf_path, json_path):
    full_text = ""
    try:
        with open(pdf_path, 'rb') as f:
            reader = pypdf.PdfReader(f)
            for page in reader.pages:
                page_text = page.extract_text()
                if page_text:
                    full_text += page_text + "\n\n"
    except Exception as e:
        print(f"Error reading PDF {pdf_path}: {e}")
        return

    # Regex:
    #   - Match "EXAMPLE" (case-insensitive) and optional label/number (e.g., "2.5a")
    #   - Capture question text until "SOLUTION"
    #   - Capture solution text until "■"
    pattern = re.compile(
        r'EXAMPLE[\s\d\w\.\-]*\s*(.*?)(?:SOLUTION\s*)(.*?)(?:■)',
        re.DOTALL | re.IGNORECASE
    )
    matches = pattern.findall(full_text)

    questions = []
    for i, (q_text, s_text) in enumerate(matches):
        try:
            question_text = q_text.strip()
            solution_text = s_text.strip()

            questions.append({
                "qid": f"prob-{i+1}",
                "passage_text": "",
                "question_text": question_text,
                "options": [],
                "correct_option_data": "",
                "solution_text": solution_text,
            })
        except Exception as e:
            print(f"Could not parse match {i+1}: {e}")

    output_data = {"questions": questions}

    output_dir = os.path.dirname(json_path)
    if output_dir and not os.path.exists(output_dir):
        os.makedirs(output_dir)

    with open(json_path, 'w') as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)

if __name__ == '__main__':
    pdf_path = '/home/dspratap/Downloads/PrepUp/data/Prob.pdf'
    json_path = '/home/dspratap/Downloads/PrepUp/data/prob_questions.json'
    pdf_to_json(pdf_path, json_path)
    print(f"Successfully converted {pdf_path} to {json_path}")
