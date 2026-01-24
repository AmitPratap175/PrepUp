import os
import json
import asyncio
from datetime import datetime
from pathlib import Path
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from adrf.views import APIView as AsyncAPIView
from notebooklm import NotebookLMClient, QuizQuantity, QuizDifficulty
from django.conf import settings

# Prompt from test_notebooklm.py
UPSC_PROMPT = """
Act as a strict Union Public Service Commission (UPSC) paper setter. Your goal is to exhaustively test my knowledge of the uploaded document by generating a high-volume Question Bank (at least 50 questions).
Using ONLY the information provided in this document, generate questions in the following specific UPSC formats:

**1. The 'Statement-Based' Trap (20 Questions):**

Create questions with 2-3 statements (e.g., 'Consider the following statements regarding [Topic]...').
Intentionally include common UPSC traps: swap dates, change 'Constitutional' to 'Statutory', or use extreme words like 'only', 'always', or 'mandatorily' to test precision.
Options must be: (a) 1 only, (b) 2 only, (c) Both 1 and 2, (d) Neither 1 nor 2.

**2. Chronology & Sequencing (10 Questions):**

Select 4 events, acts, or steps mentioned in the text and ask to arrange them in correct chronological order.

**3. Match the Following (10 Questions):**

Create pairs matching specific terms, personalities, committees, or articles with their correct descriptions or years.

**4. Assertion-Reasoning (5 Questions):**

Provide two statements: an Assertion (A) and a Reason (R). Ask if both are true and if R is the correct explanation of A.

**5. Rapid Fire Fact-Check (15 Questions):**

Direct questions focusing on specific numbers, data points, 'First' occurrences, and definitions mentioned in the text.

**Output Rules:**

Do not summarize. Go straight to the questions.
Cover the entire document from the first page to the last, ensuring no small fact or footnote is ignored.
Answer Key: Provide a separate Answer Key at the very end. For every answer, provide a brief 'Explanation' citing the specific logic or fact from the text.
"""

class QuizGeneratorView(AsyncAPIView):
    parser_classes = (MultiPartParser, FormParser)

    async def post(self, request, *args, **kwargs):
        uploaded_file = request.FILES.get('file')
        if not uploaded_file:
            return Response({"error": "No file uploaded"}, status=status.HTTP_400_BAD_REQUEST)

        # Save the file temporarily
        temp_dir = Path(settings.BASE_DIR) / "data" / "temp_uploads"
        temp_dir.mkdir(parents=True, exist_ok=True)
        file_path = temp_dir / uploaded_file.name

        try:
            with open(file_path, 'wb+') as destination:
                for chunk in uploaded_file.chunks():
                    destination.write(chunk)
            
            # NotebookLM Logic
            # TODO: Make the storage path configurable or consistent with Dockerfile
            storage_path = Path("/app/storage_state.json")
            if not storage_path.exists():
                # Fallback to local dev path if not in container/mapped
                storage_path = Path("/home/dspratap/.notebooklm/storage_state.json")

            if not storage_path.exists():
                 return Response({"error": "NotebookLM storage state not found. Auth required."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            quiz_data = None
            async with await NotebookLMClient.from_storage(str(storage_path)) as client:
                # Create a new notebook for this session
                # Timestamp to make it unique or just "Quiz Gen"
                nb_title = f"QuizGen_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
                nb = await client.notebooks.create(nb_title)
                
                # Upload source
                await client.sources.add_file(nb.id, file_path, wait=True)

                # Generate Quiz
                quiz_status = await client.artifacts.generate_quiz(
                    nb.id,
                    instructions=UPSC_PROMPT,
                    quantity=QuizQuantity.MORE,
                    difficulty=QuizDifficulty.HARD
                )
                await client.artifacts.wait_for_completion(nb.id, quiz_status.task_id)
                
                # Download Quiz
                # We can download to a string or temp file. library saves to file.
                output_json_path = temp_dir / f"quiz_{nb.id}.json"
                await client.artifacts.download_quiz(nb.id, str(output_json_path), output_format="json")

                # Read the generated JSON
                if output_json_path.exists():
                    with open(output_json_path, 'r') as f:
                        quiz_content = json.load(f)
                    quiz_data = quiz_content
                    
                    # Clean up the specific quiz file
                    output_json_path.unlink()
                
                # Cleanup Notebook? (Optional, maybe keep for history or delete to save space)
                # await client.notebooks.delete(nb.id) 

            if not quiz_data:
                return Response({"error": "Failed to generate quiz data"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

            # Persist to generated_quizzes.json
            persistence_path = Path(settings.BASE_DIR) / "data" / "generated_quizzes.json"
            all_quizzes = []
            if persistence_path.exists():
                try:
                    with open(persistence_path, 'r') as f:
                        all_quizzes = json.load(f)
                except json.JSONDecodeError:
                    all_quizzes = []
            
            new_entry = {
                "source": uploaded_file.name,
                "generated_at": datetime.now().isoformat(),
                "notebook_id": nb.id, # Keep ID ref
                "quiz_data": quiz_data
            }
            all_quizzes.append(new_entry)

            with open(persistence_path, 'w') as f:
                json.dump(all_quizzes, f, indent=2)

            # Cleanup Uploaded File
            file_path.unlink()

            return Response(new_entry, status=status.HTTP_201_CREATED)

        except Exception as e:
            # Cleanup on error
            if file_path.exists():
                file_path.unlink()
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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
            # The 'notebook_id' was saved in the POST method as 'nb.id'
            found_quiz = next((q for q in all_quizzes if q.get('notebook_id') == quiz_id), None)
            
            if found_quiz:
                return Response(found_quiz)
            else:
                return Response({"error": "Quiz not found"}, status=status.HTTP_404_NOT_FOUND)
                
        except json.JSONDecodeError:
            return Response({"error": "Error reading quiz data"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
