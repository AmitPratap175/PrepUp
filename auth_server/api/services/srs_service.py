import os
import json
import asyncio
from datetime import datetime, timedelta
from google import genai
from google.genai import types
from api.models import RevisionSchedule

def get_gemini_client():
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("GEMINI_API_KEY not found in environment")
    return genai.Client(api_key=api_key)

async def generate_upsc_flashcard(question_data, user_answer):
    """
    Generates a high-quality UPSC-focused AI flashcard using Gemini.
    """
    client = get_gemini_client()
    
    prompt = f"""
    Act as an expert UPSC educator. A student just answered a question incorrectly.
    
    Question Context:
    {json.dumps(question_data, indent=2)}
    
    Student's Incorrect Answer: {user_answer}
    
    Create a Spaced Repetition Flashcard to help the student memorize the core concept.
    The flashcard should be strictly focused on the UPSC exam.
    
    Output a JSON object with the following schema:
    {{
        "front": "A short, engaging prompt or question focusing on the core fact/concept they missed.",
        "back": "The direct answer to the front.",
        "mnemonic": "A clever mnemonic or memory hook to remember this fact (crucial for UPSC).",
        "explanation": "A concise explanation of why the correct answer is right and why the student's choice was wrong."
    }}
    """
    
    try:
        response = await client.aio.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema={
                    "type": "OBJECT",
                    "properties": {
                        "front": {"type": "STRING"},
                        "back": {"type": "STRING"},
                        "mnemonic": {"type": "STRING"},
                        "explanation": {"type": "STRING"}
                    },
                    "required": ["front", "back", "mnemonic", "explanation"]
                }
            )
        )
        
        text_response = response.text or "{}"
        return json.loads(text_response)
    except Exception as e:
        print(f"Error generating AI flashcard: {e}")
        return None

def schedule_revision(user, question_id, question_data, subject, user_answer):
    """
    Schedules a question for revision and generates an AI flashcard asynchronously.
    """
    # Create or update the revision schedule
    revision, created = RevisionSchedule.objects.get_or_create(
        user=user,
        question_id=question_id,
        defaults={
            'question_data': question_data,
            'subject': subject,
            'next_review_date': datetime.now().date() + timedelta(days=2),
            'review_interval': 2,
            'exam_target': 'upsc'
        }
    )
    
    if not created:
        # Reset interval on multiple mistakes
        revision.review_interval = 2
        revision.next_review_date = datetime.now().date() + timedelta(days=2)
        revision.save()
        
    # We could dispatch this to a Celery task or run async. For now, running sync wrap or just returning the object.
    # In a real Django view, we'd trigger a celery task: generate_flashcard_task.delay(revision.id, question_data, user_answer)
    return revision
