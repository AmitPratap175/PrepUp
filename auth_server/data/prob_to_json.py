import os
import re
import json
import pypdf

def parse_solutions(text):
    """
    Parses the Instructor's Manual section to extract solutions.
    Returns a dict: {chapter_num: {problem_num: solution_text}}
    """
    solutions = {}
    current_chapter = None
    
    lines = text.split('\n')
    
    # Regex for Chapter header in Manual: "Chapter X"
    chapter_re = re.compile(r'^\s*Chapter\s+(\d+)\s*$', re.IGNORECASE)
    
    # Regex for Solution item: "1. Solution text..."
    sol_start_re = re.compile(r'^\s*(\d+)\.\s+(.*)')
    
    current_sol_num = None
    current_sol_text = []
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        # Check for Chapter
        match = chapter_re.match(line)
        if match:
            current_chapter = int(match.group(1))
            solutions[current_chapter] = {}
            current_sol_num = None
            current_sol_text = []
            continue
            
        if current_chapter is None:
            continue
            
        # Check for Solution start
        match = sol_start_re.match(line)
        if match:
            # Save previous solution
            if current_sol_num is not None:
                solutions[current_chapter][current_sol_num] = " ".join(current_sol_text).strip()
            
            current_sol_num = int(match.group(1))
            current_sol_text = [match.group(2)]
        else:
            # Append to current solution
            if current_sol_num is not None:
                current_sol_text.append(line)
                
    # Save last solution
    if current_chapter is not None and current_sol_num is not None:
        solutions[current_chapter][current_sol_num] = " ".join(current_sol_text).strip()
        
    return solutions

def parse_questions(text):
    """
    Parses the Textbook section to extract questions from "Problems" sections.
    Returns a list of dicts: [{'chapter': ch, 'number': num, 'text': text}]
    """
    questions = []
    current_chapter = None
    in_problems_section = False
    
    lines = text.split('\n')
    
    # Regex for Chapter header in Book: "Chapter 1: Introduction..."
    # We match "Chapter X" at the start of the line.
    chapter_re = re.compile(r'^\s*Chapter\s+(\d+)', re.IGNORECASE)
    
    # Regex for "Problems" section header
    problems_re = re.compile(r'^\s*Problems\s*$', re.IGNORECASE)
    
    # Regex for Question item: "1. Question text..."
    q_start_re = re.compile(r'^\s*(\d+)\.\s+(.*)')
    
    current_q_num = None
    current_q_text = []
    
    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue
            
        # Check for Chapter
        # We assume chapter headers are short (< 100 chars) to avoid matching text references
        if chapter_re.match(stripped) and len(stripped) < 100:
            match = chapter_re.match(stripped)
            new_chapter = int(match.group(1))
            
            if new_chapter != current_chapter:
                current_chapter = new_chapter
                in_problems_section = False
                current_q_num = None
                current_q_text = []
            continue
            
        # Check for "Problems" section
        if problems_re.match(stripped):
            in_problems_section = True
            current_q_num = None
            current_q_text = []
            continue
            
        if not in_problems_section or current_chapter is None:
            continue
            
        # Check for Question start
        match = q_start_re.match(line)
        if match:
            # Save previous question
            if current_q_num is not None:
                questions.append({
                    "chapter": current_chapter,
                    "number": current_q_num,
                    "text": " ".join(current_q_text).strip()
                })
            
            current_q_num = int(match.group(1))
            current_q_text = [match.group(2)]
        else:
            # Append to current question
            if current_q_num is not None:
                current_q_text.append(stripped)
                
    # Save last question
    if current_q_num is not None:
        questions.append({
            "chapter": current_chapter,
            "number": current_q_num,
            "text": " ".join(current_q_text).strip()
        })
        
    return questions

def parse_examples(text):
    """
    Parses the text to extract "Example ... Solution" pairs.
    """
    # Regex:
    #   - Match "EXAMPLE" (case-sensitive) followed by ID (e.g., "2.3c")
    #   - Capture question text until "SOLUTION"
    #   - Capture solution text until "■"
    pattern = re.compile(
        r'EXAMPLE\s+([A-Za-z0-9\.]+)\s+(.*?)\s+SOLUTION\s+(.*?)\s+■',
        re.DOTALL
    )
    matches = pattern.findall(text)

    examples = []
    for i, (ex_id, q_text, s_text) in enumerate(matches):
        try:
            question_text = q_text.strip()
            solution_text = s_text.strip()

            examples.append({
                "qid": f"example-{ex_id}",
                "passage_text": "",
                "question_text": question_text,
                "options": [],
                "correct_option_data": "",
                "solution_text": solution_text,
            })
        except Exception as e:
            print(f"Could not parse example match {i+1}: {e}")
            
    return examples

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

    # 1. Parse Examples (from full text)
    print("Extracting Examples...")
    final_questions = parse_examples(full_text)
    print(f"Found {len(final_questions)} examples.")

    # Split into Manual and Book
    # The Manual is at the beginning. The Book starts with "Chapter 1" followed by "INTRODUCTION TO STATISTICS".
    # We find "INTRODUCTION TO STATISTICS" and then look backwards for the "Chapter 1" header.
    split_marker = "INTRODUCTION TO STATISTICS"
    split_idx = full_text.find(split_marker)
    
    questions = []
    solutions = {}

    if split_idx != -1:
        # Search backwards for "Chapter 1"
        # We look for the last occurrence of "Chapter 1" before the split_marker
        pre_text = full_text[:split_idx]
        chapter_header = "Chapter 1"
        chapter_idx = pre_text.rfind(chapter_header)
        
        if chapter_idx != -1:
            manual_text = full_text[:chapter_idx]
            book_text = full_text[chapter_idx:]
            print(f"Split PDF at index {chapter_idx} (found '{chapter_header}' before '{split_marker}')")
        else:
            print(f"Could not find '{chapter_header}' before '{split_marker}'. Using split_marker directly.")
            manual_text = full_text[:split_idx]
            book_text = full_text[split_idx:]
            
        print(f"Manual text length: {len(manual_text)}")
        print(f"Book text length: {len(book_text)}")

        print("Extracting Problems and Solutions...")
        
        # Parse Solutions from Manual
        solutions = parse_solutions(manual_text)
        print(f"Found solutions for {len(solutions)} chapters.")
        
        # Parse Questions from Book
        questions = parse_questions(book_text)
        print(f"Found {len(questions)} problems.")
        
        # Combine
        matched_count = 0
        for q in questions:
            ch = q['chapter']
            num = q['number']
            sol = solutions.get(ch, {}).get(num, "")
            
            if sol:
                matched_count += 1
                
            final_questions.append({
                "qid": f"prob-{ch}.{num}",
                "passage_text": "",
                "question_text": q['text'],
                "options": [],
                "correct_option_data": "",
                "solution_text": sol,
            })
        print(f"Matched {matched_count} solutions to problems.")
    else:
        print("Could not find split point between Manual and Book. Skipping Problems extraction.")

    output_data = {"questions": final_questions}

    output_dir = os.path.dirname(json_path)
    if output_dir and not os.path.exists(output_dir):
        os.makedirs(output_dir)

    with open(json_path, 'w') as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)
        
    print(f"Successfully converted {pdf_path} to {json_path}")

if __name__ == '__main__':
    # Use relative paths
    pdf_path = 'auth_server/data/Prob.pdf'
    json_path = 'auth_server/data/prob_questions.json'
    
    if os.path.exists(pdf_path):
        pdf_to_json(pdf_path, json_path)
    else:
        print(f"File not found: {pdf_path}")
