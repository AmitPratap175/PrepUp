import os
import json
from google import genai
from google.genai import types

def get_gemini_client():
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("GEMINI_API_KEY not found in environment")
    return genai.Client(api_key=api_key)

def evaluate_math_pdf(file_path):
    """
    Evaluates a PDF/Image of a Mathematics optional answer sheet using Gemini.
    """
    client = get_gemini_client()
    
    # Upload the file to Gemini for processing
    print(f"Uploading {file_path} to Gemini...")
    uploaded_file = client.files.upload(file=file_path)
    
    prompt = """
    You are an expert UPSC Mathematics optional examiner.
    Evaluate the provided handwritten mathematics answer sheet STRICTLY using the following UPSC marking rubric:
    
    CRITERIA 1: Step-Marking (Crucial). Award marks for correct methodology and intermediate steps. If the methodology is 100% correct but the final answer has a minor calculation error, award 70-80% of the max marks.
    CRITERIA 2: Theorems & Formulas. Penalize severely (deduct 2-3 marks) if a standard theorem/formula is applied without explicitly naming it or verifying its conditions (e.g., Cauchy's Integral Formula, Stokes' Theorem).
    CRITERIA 3: Boundary Conditions. For ODEs/PDEs or Mechanics, deduct 1-2 marks if initial boundary conditions or constants of integration are not explicitly stated.
    CRITERIA 4: Presentation. Deduct 1-2 marks if the final answer is not clearly boxed/stated or if the logic is scattered and hard to follow.
    CRITERIA 5: Alternative Methods. Award full marks for elegant alternative methods provided they are mathematically rigorous and fully proven.

    For each question attempted in the answer sheet:
    1. Identify the Question Number.
    2. Extract the actual text of the mathematical problem from the image (extracted_question_text).
    3. Identify the core mathematical topic (e.g., Calculus, Linear Algebra, Real Analysis).
    4. Evaluate the step-by-step solution against the 5 criteria above. Check for logical correctness, calculation errors, and presentation.
    5. Provide detailed feedback explicitly mentioning which of the 5 criteria were met or missed.
    6. Assign marks out of a standard UPSC 15 or 20 marker (or estimate if not specified). Provide `marks_obtained` and `max_marks`.
    
    Also, provide an overall analysis of the student's performance:
    - total_score: sum of all marks obtained
    - max_score: sum of all max marks
    - overall_feedback: general comments on presentation, accuracy, and speed
    - gemini_insights: recommendations based on past UPSC Mathematics trends, highlighting weak topics and suggesting which topics to focus on more.
    
    Return the response as a JSON object strictly matching the schema.
    """
    
    try:
        print("Generating evaluation from Gemini...")
        response = client.models.generate_content(
            model='gemini-2.5-pro',
            contents=[uploaded_file, prompt],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema={
                    "type": "OBJECT",
                    "properties": {
                        "total_score": {"type": "NUMBER"},
                        "max_score": {"type": "NUMBER"},
                        "overall_feedback": {"type": "STRING"},
                        "gemini_insights": {
                            "type": "OBJECT",
                            "properties": {
                                "weak_topics": {
                                    "type": "ARRAY",
                                    "items": {"type": "STRING"}
                                },
                                "suggestions": {"type": "STRING"}
                            }
                        },
                        "questions": {
                            "type": "ARRAY",
                            "items": {
                                "type": "OBJECT",
                                "properties": {
                                    "question_number": {"type": "STRING"},
                                    "extracted_question_text": {"type": "STRING"},
                                    "topic": {"type": "STRING"},
                                    "marks_obtained": {"type": "NUMBER"},
                                    "max_marks": {"type": "NUMBER"},
                                    "feedback": {"type": "STRING"}
                                },
                                "required": ["question_number", "extracted_question_text", "topic", "marks_obtained", "max_marks", "feedback"]
                            }
                        }
                    },
                    "required": ["total_score", "max_score", "overall_feedback", "gemini_insights", "questions"]
                }
            )
        )
        
        text_response = response.text or "{}"
        result = json.loads(text_response)
    except Exception as e:
        print(f"Error during Gemini evaluation: {e}")
        result = None
    finally:
        # Always clean up the file from Gemini servers
        try:
            client.files.delete(name=uploaded_file.name)
        except Exception as e:
            print(f"Failed to delete file from Gemini: {e}")
            
    return result
