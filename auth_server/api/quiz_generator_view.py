import os
import json
import base64
import asyncio
import uuid
import re
from datetime import datetime
from pathlib import Path
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from adrf.views import APIView as AsyncAPIView
from django.conf import settings
from google import genai
from google.genai import types

class QuizGeneratorView(AsyncAPIView):
    parser_classes = (MultiPartParser, FormParser)

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        self.api_key = os.environ.get("GEMINI_API_KEY")
        if not self.api_key:
             print("GEMINI_API_KEY not found in environment")
        self.client = genai.Client(api_key=self.api_key)

    async def post(self, request, *args, **kwargs):
        uploaded_file = request.FILES.get('file')
        if not uploaded_file:
            return Response({"error": "No file uploaded"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Read file content
            file_content = uploaded_file.read()
            # Encode to base64
            file_base64 = base64.b64encode(file_content).decode('utf-8')
            mime_type = uploaded_file.content_type or "application/pdf"

            # 1. Identify Subject
            subject = await self.identify_subject(file_base64, mime_type)
            
            # 2. Generate Quiz
            quiz_data = await self.generate_exhaustive_quiz(file_base64, mime_type, uploaded_file.name, subject)

            # Persist to generated_quizzes.json
            persistence_path = Path(settings.BASE_DIR) / "data" / "generated_quizzes.json"
            all_quizzes = []
            if persistence_path.exists():
                try:
                    with open(persistence_path, 'r') as f:
                        all_quizzes = json.load(f)
                except json.JSONDecodeError:
                    all_quizzes = []
            
            # Generate a unique notebook_id (using UUID as we are not using NotebookLM anymore)
            notebook_id = str(uuid.uuid4())

            new_entry = {
                "source": uploaded_file.name,
                "generated_at": datetime.now().isoformat(),
                "notebook_id": notebook_id,
                "quiz_data": quiz_data
            }
            all_quizzes.append(new_entry)

            with open(persistence_path, 'w') as f:
                json.dump(all_quizzes, f, indent=2)

            return Response(new_entry, status=status.HTTP_201_CREATED)

        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    async def identify_subject(self, file_base64, mime_type):
        try:
            response = await self.client.aio.models.generate_content(
                model='gemini-2.5-flash',
                contents={
                    'parts': [
                        {'inline_data': {'data': file_base64, 'mime_type': mime_type}},
                        {'text': "Classify this document into one of the following subjects: Polity, Geography, History, Economy, Environment, Science, Current Affairs, or Others. Return ONLY the subject name in all lower case."}
                    ]
                }
            )
            return response.text.strip() if response.text else "others"
        except Exception as e:
            print(f"Error identifying subject: {e}")
            return "others"

    async def generate_exhaustive_quiz(self, file_base64, mime_type, filename, subject):
        safe_filename = re.sub(r'[^a-z0-9]', '-', filename.lower())
        prompt = f"""
Act as a strict Union Public Service Commission (UPSC) paper setter and expert educator. Your goal is to EXHAUSTIVELY test the user on the uploaded document.

**MANDATORY REQUIREMENTS:**
1. **QUANTITY:** You must generate a MINIMUM of 50 questions. There is NO upper limit—if the document contains 100 facts, generate 100 questions.
2. **FACT RECALL (Min. 20 Questions):** At least 20 questions must be direct 'Fact-Recall' questions. These are one-liners or simple identification questions designed to ensure the user remembers specific names, dates, articles, places, or data points exactly as they appear.
3. **UPSC FORMATS (Remaining Questions):** The rest should be high-difficulty UPSC formats:
    - **'Statement-Based' Traps:** 2-3 statements with traps (swapping dates, swapping 'Constitutional' vs 'Statutory', using 'only/always'). Options: (a) 1 only, (b) 2 only, (c) Both 1 and 2, (d) Neither 1 nor 2.
    - **Chronology & Sequencing:** Arrange 4+ events in order.
    - **Match the Following:** Terms/Personalities matched with descriptions.

**Output Rules:**
1. **EXHAUSTIVE COVERAGE:** Do not leave out a single relevant fact. If a minor committee or a specific sub-clause is mentioned, create a question for it.
2. **RATIONALE:** Provide a deep, pedagogical explanation for every answer.
3. **ID GENERATION:** Use prefix "cw-{safe_filename}-" with sequential numbers.
4. **FORMAT:** Return ONLY a JSON object matching the provided schema.
"""

        # Try using the Thinking model first as per original logic
        try:
            # Note: The original logic used 'gemini-3-pro-preview' which likely maps
            # to the latest thinking experimental model available.
            # We try 'gemini-2.0-flash-thinking-exp-01-21' which supports thinking config.
            response = await self.client.aio.models.generate_content(
                model='gemini-2.0-flash-thinking-exp-01-21',
                contents={
                    'parts': [
                        {'inline_data': {'data': file_base64, 'mime_type': mime_type}},
                        {'text': prompt}
                    ]
                },
                config=types.GenerateContentConfig(
                    thinking_config={"thinking_budget": 1024}, # Adjusted budget for safety, source had 32k
                    response_mime_type="application/json",
                    response_schema={
                        "type": "OBJECT",
                        "properties": {
                            "title": {"type": "STRING"},
                            "subject": {"type": "STRING"},
                            "questions": {
                                "type": "ARRAY",
                                "items": {
                                    "type": "OBJECT",
                                    "properties": {
                                        "question": {"type": "STRING"},
                                        "answerOptions": {
                                            "type": "ARRAY",
                                            "items": {
                                                "type": "OBJECT",
                                                "properties": {
                                                    "text": {"type": "STRING"},
                                                    "isCorrect": {"type": "BOOLEAN"},
                                                    "rationale": {"type": "STRING"}
                                                },
                                                "required": ["text", "isCorrect", "rationale"]
                                            }
                                        },
                                        "hint": {"type": "STRING"},
                                        "qid": {"type": "STRING"},
                                        "id": {"type": "STRING"}
                                    },
                                    "required": ["question", "answerOptions", "hint", "qid", "id"]
                                }
                            }
                        },
                        "required": ["title", "subject", "questions"]
                    }
                )
            )
            
            text_response = response.text or "{}"
            parsed = json.loads(text_response)
        except Exception as e:
            print(f"Thinking model failed: {e}. Falling back to standard Flash model.")
            # Fallback to standard Flash model without thinking config
            response = await self.client.aio.models.generate_content(
                model='gemini-2.5-flash',
                contents={
                    'parts': [
                        {'inline_data': {'data': file_base64, 'mime_type': mime_type}},
                        {'text': prompt}
                    ]
                },
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema={
                        "type": "OBJECT",
                        "properties": {
                            "title": {"type": "STRING"},
                            "subject": {"type": "STRING"},
                            "questions": {
                                "type": "ARRAY",
                                "items": {
                                    "type": "OBJECT",
                                    "properties": {
                                        "question": {"type": "STRING"},
                                        "answerOptions": {
                                            "type": "ARRAY",
                                            "items": {
                                                "type": "OBJECT",
                                                "properties": {
                                                    "text": {"type": "STRING"},
                                                    "isCorrect": {"type": "BOOLEAN"},
                                                    "rationale": {"type": "STRING"}
                                                },
                                                "required": ["text", "isCorrect", "rationale"]
                                            }
                                        },
                                        "hint": {"type": "STRING"},
                                        "qid": {"type": "STRING"},
                                        "id": {"type": "STRING"}
                                    },
                                    "required": ["question", "answerOptions", "hint", "qid", "id"]
                                }
                            }
                        },
                        "required": ["title", "subject", "questions"]
                    }
                )
            )
            text_response = response.text or "{}"
            parsed = json.loads(text_response)

        try:
            if not parsed.get("subject") or parsed["subject"].lower() == "others":
                parsed["subject"] = subject.title()
            return parsed
        except Exception as e:
             print(f"Failed to generate/parse quiz: {e}")
             raise e

    async def get(self, request, *args, **kwargs):
        """
        Retrieve a generated quiz by notebook_id (from query param or URL).
        Example: /api/generate-quiz/?id=xyz
        """
        quiz_id = request.query_params.get('id')
        if not quiz_id:
            return Response({"error": "Missing 'id' parameter"}, status=status.HTTP_400_BAD_REQUEST)

        persistence_path = Path(settings.BASE_DIR) / "data" / "generated_quizzes.json"
        if not persistence_path.exists():
            return Response({"error": "No quizzes found"}, status=status.HTTP_404_NOT_FOUND)

        try:
            with open(persistence_path, 'r') as f:
                all_quizzes = json.load(f)
            
            # Find the quiz with the matching notebook_id
            found_quiz = next((q for q in all_quizzes if q.get('notebook_id') == quiz_id), None)
            
            if found_quiz:
                return Response(found_quiz)
            else:
                return Response({"error": "Quiz not found"}, status=status.HTTP_404_NOT_FOUND)
                
        except json.JSONDecodeError:
            return Response({"error": "Error reading quiz data"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
