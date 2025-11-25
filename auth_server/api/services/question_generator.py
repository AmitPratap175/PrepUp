import json
import os
from typing import List, Dict, Any
from google import genai
from google.genai import types

class QuestionGenerator:
    """
    Service to generate practice questions using Google Gemini.
    """
    def __init__(self):
        self.api_key = os.environ.get("GEMINI_API_KEY")
        if not self.api_key:
            # Fallback or log warning - for now we assume it's there or handled by caller
            pass
        self.client = genai.Client(api_key=self.api_key)

    async def generate_questions(self, exam_type: str, subject: str, topic: str, difficulty: str, count: int = 5) -> List[Dict[str, Any]]:
        """
        Generates a list of practice questions based on the given parameters.

        Args:
            exam_type: The exam type (e.g., 'CAT', 'GATE').
            subject: The subject (e.g., 'Quantitative Aptitude').
            topic: The specific topic (e.g., 'Algebra').
            difficulty: The difficulty level (e.g., 'Medium').
            count: Number of questions to generate.

        Returns:
            A list of question dictionaries matching the application's schema.
        """
        
        prompt = f"""
        Generate {count} multiple-choice practice questions for the {exam_type} exam.
        Subject: {subject}
        Topic: {topic}
        Difficulty: {difficulty}

        The output must be a valid JSON array of objects. Each object should have the following structure:
        {{
            "qid": "unique_string",
            "text": "Question text here",
            "options": [
                {{ "id": "a", "text": "Option A text", "data_option": "a", "is_correct": false }},
                {{ "id": "b", "text": "Option B text", "data_option": "b", "is_correct": true }},
                {{ "id": "c", "text": "Option C text", "data_option": "c", "is_correct": false }},
                {{ "id": "d", "text": "Option D text", "data_option": "d", "is_correct": false }}
            ],
            "explanation": "Detailed explanation of the correct answer."
        }}

        Ensure the 'qid' is unique for each question (you can use a random string).
        Ensure exactly one option has "is_correct": true.
        Return ONLY the JSON array, no markdown formatting or other text.
        """

        try:
            response = await self.client.aio.models.generate_content(
                model="gemini-2.0-flash-exp",
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.7
                )
            )
            
            if response.text:
                questions = json.loads(response.text)
                # Ensure basic validation or cleanup if needed
                return questions
            else:
                print("Empty response from Gemini")
                return []

        except Exception as e:
            print(f"Error generating questions: {e}")
            return []
