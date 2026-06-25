import json

def convert_to_prepup_format(input_file, output_file, subject, source_file):
    with open(input_file, 'r', encoding='utf-8') as f:
        raw_data = json.load(f)

    chapters = {}
    for item in raw_data:
        chap = item.get("chapter", "Unknown Chapter")
        if chap not in chapters:
            chapters[chap] = []
        
        # Build passage/question text
        q_text = item.get("question_text", "")
        if item.get("passage_text"):
            q_text = item["passage_text"] + "\n\n" + q_text

        q_obj = {
            "id": item["qid"],
            "qid": item["qid"],
            "type": "mcq",
            "question": q_text,
            "answerOptions": []
        }

        # Add options
        solution_text = item.get("solution_text")
        for opt in item.get("options", []):
            opt_obj = {
                "text": opt["option_text"],
                "isCorrect": opt["is_correct"]
            }
            if opt["is_correct"] and solution_text:
                opt_obj["rationale"] = solution_text
            q_obj["answerOptions"].append(opt_obj)

        chapters[chap].append(q_obj)

    final_data = []
    for chap, questions in chapters.items():
        # Using a fixed ID format based on chapter name slug
        chap_slug = chap.lower().replace(' ', '-').replace('&', 'and')
        final_data.append({
            "id": f"arihant-{chap_slug}",
            "title": chap,
            "subject": subject,
            "source_file": source_file,
            "questions": questions,
            "totalQuestions": len(questions),
            "duration": len(questions) * 2  # Assuming 2 min per question as a default
        })

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(final_data, f, indent=2, ensure_ascii=False)

# Convert and place them directly in the auth_server/data directory!
convert_to_prepup_format(
    "ncert_history_mcqs.json",
    "auth_server/data/ncert_arihant_history_quiz.json",
    "Arihant NCERT Quiz - History",
    "Arihant NCERT MCQs Indian History"
)
convert_to_prepup_format(
    "ncert_geography_mcqs.json",
    "auth_server/data/ncert_arihant_geography_quiz.json",
    "Arihant NCERT Quiz - Geography",
    "Arihant NCERT MCQs India & World Geography"
)
