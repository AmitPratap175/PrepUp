from django.contrib.auth import get_user_model, authenticate
from rest_framework import generics, status
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from .serializers import UserSerializer, BookmarkSerializer, WordSerializer, StudyHeartbeatSerializer
from .models import Bookmark, Word, StudyDay
from datetime import date, timedelta
import subprocess
import tempfile
import os
import shutil
import re
import requests
import uuid
from django.http import FileResponse
from api.storage import storage

User = get_user_model()

class SignupView(generics.CreateAPIView):
    """
    Handles the registration of new users.

    This view uses a `CreateAPIView` to simplify the creation of new User
    instances. It expects the user's name, email, password, and exam type
    in the request data.
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer

class LoginView(APIView):
    """
    Authenticates users and provides an auth token.

    This view handles POST requests with 'email' and 'password'. On successful
    authentication, it returns a new or existing auth token for the user.
    """
    def post(self, request, *args, **kwargs):
        """
        Handles the login request.

        Args:
            request: The HttpRequest object, containing login credentials.

        Returns:
            A Response object with the auth token on success, or an error
            message on failure.
        """
        email = request.data.get('email')
        password = request.data.get('password')

        user = authenticate(request, email=email, password=password)

        if user:
            token, created = Token.objects.get_or_create(user=user)
            return Response({'token': token.key})
        else:
            return Response(
                {'error': 'Invalid Credentials'},
                status=status.HTTP_400_BAD_REQUEST
            )

class LogoutView(APIView):
    """
    Logs out an authenticated user by deleting their auth token.

    This view requires the user to be authenticated. It invalidates the
    user's session by removing their token from the database.
    """
    def post(self, request, *args, **kwargs):
        """
        Handles the logout request.

        Args:
            request: The HttpRequest object.

        Returns:
            A Response with a 204 No Content status on successful logout,
            or an error if the user is not authenticated.
        """
        if request.user.is_authenticated:
            request.user.auth_token.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        else:
            return Response(
                {'error': 'You are not logged in.'},
                status=status.HTTP_400_BAD_REQUEST
            )

class UserDetailsView(APIView):
    """
    Retrieves and updates the details for the currently authenticated user.

    This view is protected and requires a valid auth token. It returns
    the serialized data of the user making the request, and allows for
    updates to the user's information.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        """
        Handles the GET request to fetch user details.

        Args:
            request: The HttpRequest object.

        Returns:
            A Response containing the serialized user data.
        """
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def put(self, request, *args, **kwargs):
        """
        Handles the PUT request to update user details.

        Args:
            request: The HttpRequest object.

        Returns:
            A Response containing the updated user data.
        """
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class BookmarkListView(generics.ListAPIView):
    """
    Lists the bookmarks for the authenticated user.

    This view can optionally filter bookmarks by subject using a query
    parameter.

    **How to use:**
    To get the list of saved bookmarks, the LLM should send a `GET` request to the following URL:
    `GET /api/auth/bookmarks/`

    To filter bookmarks by subject, the `subject` can be added as a query parameter:
    `GET /api/auth/bookmarks/?subject={subject}`

    **Example:**
    If the user asks, "show me my bookmarks for the verbal ability section", the LLM should:
    1. Send a `GET` request to `/api/auth/bookmarks/?subject=Verbal%20Ability`.
    2. The API will return a JSON response like the following:
       ```json
       [
         {
           "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
           "user": "user@example.com",
           "subject": "Verbal Ability",
           "question_id": "some-question-id"
         }
       ]
       ```

    **Parameters:**
    - `subject` (query parameter, optional): The subject to filter the bookmarks by.

    **Responses:**
    - `200 OK`: A JSON array of the user's bookmarks.
    - `401 Unauthorized`: The user is not authenticated.

    **Note to the LLM:** When the user wants to see their bookmarks, you must call this API endpoint.
    """
    serializer_class = BookmarkSerializer
    permission_classes = [IsAuthenticated]

    def list(self, request, *args, **kwargs):
        """
        Lists bookmarks, enriching them with question data for Chapterwise quizzes.
        """
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        data = serializer.data

        # Enrich data with question details
        # We need to fetch all practice tests once to avoid repeated IO
        practice_tests = storage.get_practice_tests()
        
        # Create a lookup map for faster access: test_id -> question_id -> question_obj
        # Note: Chapterwise IDs are like "cw_0_President..."
        
        enriched_data = []
        for item in data:
            question_id = item['question_id']
            subject = item['subject']
            
            # Simple logic: Try to find the question in the loaded practice tests
            question_details = None
            
            # This search is O(N*M) but N(tests) and M(questions) are relatively small for now.
            # Optimization: If performance becomes an issue, index questions on startup.
            for test in practice_tests:
                # Basic filter by subject if available to narrow down
                # if test.get('subject') != subject: continue 
                
                if test.get('questions'):
                    for q in test['questions']:
                        q_id = str(q.get('qid') or q.get('id'))
                        if q_id == question_id:
                            question_details = q
                            break
                if question_details: break
            
            if question_details:
                # Add necessary fields for rendering
                item['question_data'] = {
                    'question': question_details.get('question') or question_details.get('question_text'),
                    'options': question_details.get('options') or question_details.get('answerOptions'),
                    'correct_answer': question_details.get('correct_answer') or question_details.get('correctAnswer') or question_details.get('correct_option_data'),
                    'explanation': question_details.get('explanation') or question_details.get('rationale') or question_details.get('answerOptions', [{}])[0].get('rationale') # Fallback
                }
            
            enriched_data.append(item)

        return Response(enriched_data)

    def get_queryset(self):
        """
        Returns the queryset of bookmarks for the current user.

        If a 'subject' query parameter is provided, the bookmarks are
        filtered by that subject.

        Returns:
            A queryset of Bookmark objects.
        """
        user = self.request.user
        subject = self.request.query_params.get('subject')
        if subject:
            return Bookmark.objects.filter(user=user, subject=subject)
        return Bookmark.objects.filter(user=user)

class BookmarkCreateView(generics.CreateAPIView):
    """
    Handles the creation of a new bookmark.

    This view allows an authenticated user to bookmark a question. The user
    is automatically associated with the created bookmark.

    **How to use:**
    To create a bookmark, the LLM should send a `POST` request to the following URL with the bookmark's details in the request body:
    `POST /api/auth/bookmarks/create/`

    The request body must be a JSON object containing the `subject` and `question_id`.

    **Example:**
    If the user wants to bookmark a question with `question_id` "varc-1" in the "VARC" subject, the LLM should construct a JSON payload and send it to the API:
    ```json
    {
      "subject": "VARC",
      "question_id": "varc-1"
    }
    ```

    **Parameters:**
    - `subject` (string, required): The subject of the quiz the question belongs to.
    - `question_id` (string, required): The ID of the question to be bookmarked.

    **Responses:**
    - `201 Created`: The bookmark was successfully created.
    - `400 Bad Request`: The request was malformed (e.g., missing required fields).
    - `401 Unauthorized`: The user is not authenticated.

    **Note to the LLM:** When the user wants to create a bookmark, you must call this API endpoint.
    """
    queryset = Bookmark.objects.all()
    serializer_class = BookmarkSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        """
        Associates the bookmark with the current user before saving.

        Args:
            serializer: The serializer instance for the bookmark.
        """
        print(serializer)
        serializer.save(user=self.request.user)

class BookmarkDeleteView(generics.DestroyAPIView):
    """
    Handles the deletion of a specific bookmark.

    This view allows an authenticated user to remove one of their bookmarks,
    identified by the question ID and subject.

    **How to use:**
    To delete a bookmark, the LLM must provide the `question_id` in the URL path and the `subject` as a query parameter. The `question_id` and `subject` can be obtained from the context of the current quiz or by listing the bookmarks.

    The LLM should send a `DELETE` request to the following URL:
    `DELETE /api/auth/bookmarks/delete/{question_id}/?subject={subject}`

    **Example:**
    If the user wants to delete a bookmark for a question with `question_id` "varc-1" in the "VARC" subject, the LLM should:
    1. Send a `DELETE` request to `/api/auth/bookmarks/delete/varc-1/?subject=VARC`.

    **Parameters:**
    - `question_id` (path parameter, required): The ID of the question associated with the bookmark.
    - `subject` (query parameter, required): The subject of the quiz the question belongs to.

    **Responses:**
    - `204 No Content`: The bookmark was successfully deleted.
    - `401 Unauthorized`: The user is not authenticated.
    - `404 Not Found`: The bookmark was not found.

    **Note to the LLM:** When the user wants to delete a bookmark, you must call this API endpoint.
    """
    queryset = Bookmark.objects.all()
    serializer_class = BookmarkSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        """
        Retrieves the bookmark object to be deleted.

        The bookmark is identified by the `question_id` from the URL and
        the `subject` from the query parameters, ensuring it belongs to the
        current user.

        Returns:
            The Bookmark object to be deleted.
        """
        queryset = self.get_queryset()
        obj = generics.get_object_or_404(
            queryset,
            question_id=self.kwargs["question_id"],
            subject=self.request.query_params.get('subject'),
            user=self.request.user
        )
        return obj


class WordListView(generics.ListAPIView):
    """
    Lists the words for the authenticated user.

    This endpoint retrieves all words that have been saved by the currently authenticated user. The LLM can use this endpoint to get the necessary information to perform other operations, such as deleting a word.

    **How to use:**
    To get the list of saved words, the LLM should send a `GET` request to the following URL:
    `GET /api/auth/words/`

    The response will be a JSON array of word objects, each containing the word, its meaning, the context in which it was saved, and its unique ID.

    **Example:**
    If the user asks, "what are my saved words?", the LLM should:
    1. Send a `GET` request to `/api/auth/words/`.
    2. The API will return a JSON response like the following:
       ```json
       [
         {
           "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
           "word": "ephemeral",
           "meaning": "lasting for a very short time.",
           "context": "The ephemeral beauty of the cherry blossoms is a reminder of the transient nature of life.",
           "question_id": "some-question-id"
         },
         {
           "id": "fedcba98-7654-3210-fedc-ba9876543210",
           "word": "ubiquitous",
           "meaning": "present, appearing, or found everywhere.",
           "context": "In today's world, smartphones have become ubiquitous.",
           "question_id": "another-question-id"
         }
       ]
       ```

    **Parameters:**
    - None

    **Responses:**
    - `200 OK`: A JSON array of the user's saved words.
    - `401 Unauthorized`: The user is not authenticated.

    **Note to the LLM:** When the user wants to see their saved words, you must call this API endpoint.
    """
    serializer_class = WordSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Returns the queryset of words for the current user.
        """
        user = self.request.user
        return Word.objects.filter(user=user)


class WordCreateView(generics.CreateAPIView):
    """
    Handles the creation of a new word.

    This view allows an authenticated user to save a new word. The user
    is automatically associated with the created word.

    **How to use:**
    To save a new word, the LLM should send a `POST` request to the following URL with the word's details in the request body:
    `POST /api/auth/words/create/`

    The request body must be a JSON object containing the `word`, `meaning`, `context`, and `question_id`.

    **Example:**
    If the user wants to save a new word, the LLM should construct a JSON payload and send it to the API.
    For example, to save the word "prolific":
    ```json
    {
      "word": "prolific",
      "meaning": "producing a great number or amount of something.",
      "context": "She was a prolific writer, with over 50 novels to her name.",
      "question_id": "varc-1"
    }
    ```

    **Parameters:**
    - `word` (string, required): The word to be saved.
    - `meaning` (string, required): The definition of the word.
    - `context` (string, required): The context in which the word was found.
    - `question_id` (string, required): The ID of the question where the word was found.

    **Responses:**
    - `201 Created`: The word was successfully saved.
    - `400 Bad Request`: The request was malformed (e.g., missing required fields).
    - `401 Unauthorized`: The user is not authenticated.

    **Note to the LLM:** When the user wants to save a new word, you must call this API endpoint.
    """
    queryset = Word.objects.all()
    serializer_class = WordSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        """
        Associates the word with the current user before saving.

        Args:
            serializer: The serializer instance for the word.
        """
        serializer.save(user=self.request.user)

class WordDeleteView(generics.DestroyAPIView):
    """
    Handles the deletion of a saved word.

    This endpoint allows an authenticated user to delete one of their saved words using the word's unique ID.

    **How to use:**
    To use this endpoint, the Large Language Model (LLM) must first obtain the unique ID of the word to be deleted. This can be done by calling the `GET /api/auth/words/` endpoint to list all saved words and their IDs.

    Once the ID is obtained, the LLM can construct a `DELETE` request to the following URL, including the word's ID in the path:
    `DELETE /api/auth/words/{id}/delete/`

    **Example:**
    If the user says, "delete the word 'ephemeral'", the LLM should:
    1. Call the `GET /api/auth/words/` endpoint to retrieve the list of saved words.
    2. Find the word "ephemeral" in the list and extract its ID (e.g., `a69c14db-512f-40b9-856a-d61f71e5947e`).
    3. Send a `DELETE` request to `/api/auth/words/a69c14db-512f-40b9-856a-d61f71e5947e/delete/`.

    **Parameters:**
    - `id` (path parameter): The unique identifier (UUID) of the word to be deleted.

    **Responses:**
    - `204 No Content`: The word was successfully deleted.
    - `401 Unauthorized`: The user is not authenticated.
    - `404 Not Found`: The word with the specified ID was not found.

    **Note to the LLM:** When the user wants to delete a saved word, you must call this API endpoint.
    """
    serializer_class = WordSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Ensures that users can only delete their own words.
        """
        return Word.objects.filter(user=self.request.user)


class StudyHeartbeatView(APIView):
    """
    Records a study heartbeat, updating the user's study duration for the day.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = StudyHeartbeatSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():
            duration = serializer.validated_data['duration']
            today = date.today()
            study_day, created = StudyDay.objects.get_or_create(
                user=request.user,
                date=today,
                defaults={'duration_seconds': duration}
            )
            if not created:
                study_day.duration_seconds += duration
                study_day.save()
            return Response(status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class StudySummaryView(APIView):
    """
    Provides a summary of the user's study hours.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        today = date.today()
        seven_days_ago = today - timedelta(days=6)

        # Get today's study hours
        try:
            today_study_day = StudyDay.objects.get(user=request.user, date=today)
            today_hours = today_study_day.duration_seconds / 3600
        except StudyDay.DoesNotExist:
            today_hours = 0

        # Get week summary
        week_summary_qs = StudyDay.objects.filter(
            user=request.user,
            date__gte=seven_days_ago,
            date__lte=today
        ).order_by('date')

        # Create a dictionary with all dates in the last 7 days initialized to 0 hours
        summary_dict = {
            (today - timedelta(days=i)): 0
            for i in range(7)
        }
        for study_day in week_summary_qs:
            summary_dict[study_day.date] = study_day.duration_seconds / 3600

        # Convert to list of objects
        week_summary = [
            {'date': dt.isoformat(), 'hours': hours}
            for dt, hours in summary_dict.items()
        ]
        week_summary.sort(key=lambda x: x['date'])


        return Response({
            'today_hours': round(today_hours, 2),
            'week_summary': week_summary
        })

class BookmarkPDFExportView(APIView):
    """
    Generates and returns a PDF of bookmarked questions for a specific subject.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        subject = request.data.get('subject')
        if not subject:
            return Response({'error': 'Subject is required'}, status=status.HTTP_400_BAD_REQUEST)

        user = request.user
        bookmarks = Bookmark.objects.filter(user=user, subject=subject)
        
        if not bookmarks.exists():
             return Response({'error': 'No bookmarks found for this subject'}, status=status.HTTP_404_NOT_FOUND)

        questions = []
        practice_tests = storage.get_practice_tests()
        
        for bookmark in bookmarks:
            found = False
            for test in practice_tests:
                if test.get('questions'):
                    for q in test['questions']:
                        q_id = q.get('qid') or q.get('id')
                        if str(q_id) == str(bookmark.question_id):
                             questions.append(q)
                             found = True
                             break
                if found: break
        
        if not questions:
             return Response({'error': 'Could not retrieve question data'}, status=status.HTTP_404_NOT_FOUND)

        try:
            with tempfile.TemporaryDirectory() as temp_dir:
                latex_content = self._generate_latex(subject, questions, temp_dir)
                pdf_path = self._compile_latex(latex_content, temp_dir)
                
                # Copy PDF to a safe location before temp_dir is deleted
                fd, safe_pdf_path = tempfile.mkstemp(suffix='.pdf')
                with os.fdopen(fd, 'wb') as tmp:
                    with open(pdf_path, 'rb') as src:
                        shutil.copyfileobj(src, tmp)

            pdf_file = open(safe_pdf_path, 'rb')
            response = FileResponse(pdf_file, content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="{subject}_bookmarks.pdf"'
            return response
        except Exception as e:
            print(f"PDF Generation Error: {e}")
            return Response({'error': 'Failed to generate PDF. Please ensure backend has texlive installed.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def _download_image(self, image_url, temp_dir):
        """
        Downloads an image from a URL to the temp directory.
        Returns the filename if successful, None otherwise.
        """
        try:
            # Generate unique filename
            ext = os.path.splitext(image_url)[1] or '.png'
            # Clean extension
            ext = ext.split('?')[0]
            if ext.lower() not in ['.png', '.jpg', '.jpeg', '.pdf']:
                ext = '.png'
            
            filename = f"img_{uuid.uuid4().hex}{ext}"
            filepath = os.path.join(temp_dir, filename)
            
            # Download image
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
            response = requests.get(image_url, headers=headers, timeout=10, verify=False)
            if response.status_code == 200:
                with open(filepath, 'wb') as f:
                    f.write(response.content)
                return filename
            else:
                print(f"Image download failed: {image_url} - Status: {response.status_code}")
                return None
        except Exception as e:
            print(f"Failed to process image {image_url}: {e}")
            return None

    def _process_text_with_images(self, text, temp_dir):
        """
        Converts markdown text to LaTeX and handles image downloading.
        """
        if not text: return ""

        # Function to replace image matches
        def replace_image(match):
            alt_text = match.group(1)
            image_url = match.group(2)
            
            filename = self._download_image(image_url, temp_dir)
            if filename:
                return f'\\begin{{figure}}[H] \\centering \\includegraphics[width=0.8\\linewidth]{{{filename}}} \\caption{{{self._markdown_to_latex(alt_text)}}} \\end{{figure}}'
            else:
                return ""

        # Regex for markdown images: ![alt](url)
        # We split the text by image patterns to process text and images separately
        
        pattern = r'!\[(.*?)\]\((.*?)\)'
        parts = re.split(pattern, text)
        
        # parts will be: [text, alt, url, text, alt, url, text...]
        
        result = []
        i = 0
        while i < len(parts):
            # Process text part
            result.append(self._markdown_to_latex(parts[i]))
            
            # If there are more parts, it means we hit an image
            if i + 2 < len(parts):
                alt = parts[i+1]
                url = parts[i+2]
                
                # Create a mock match object for our replacer
                class Match:
                    def group(self, n):
                        return alt if n == 1 else url
                
                result.append(replace_image(Match()))
                i += 3
            else:
                i += 1
                
        return ''.join(result)

    def _markdown_to_latex(self, text):
        if not text: return ""
        
        # Basic markdown to latex, preserving math
        parts = re.split(r'(\$[^$]+\$)', text)
        
        processed_parts = []
        for part in parts:
            if part.startswith('$') and part.endswith('$'):
                processed_parts.append(part)
            else:
                part = part.replace('\\', '\\textbackslash{}') \
                           .replace('{', '\\{').replace('}', '\\}') \
                           .replace('&', '\\&').replace('#', '\\#') \
                           .replace('^', '\\textasciicircum{}') \
                           .replace('_', '\\_').replace('~', '\\textasciitilde{}') \
                           .replace('%', '\\%')
                part = re.sub(r'\*\*(.*?)\*\*', r'\\textbf{\1}', part)
                part = re.sub(r'\*(.*?)\*', r'\\textit{\1}', part)
                part = re.sub(r'\n+', r' \\par \n', part)
                processed_parts.append(part)
        
        return ''.join(processed_parts)

    def _generate_latex(self, subject, questions, temp_dir):
        content = [
            r'\documentclass[12pt]{article}',
            r'\usepackage[utf8]{inputenc}',
            r'\usepackage{amsmath}',
            r'\usepackage{amssymb}',
            r'\usepackage{geometry}',
            r'\usepackage{enumitem}',
            r'\usepackage{fancyhdr}',
            r'\usepackage{graphicx}',
            r'\usepackage{float}',
            r'\usepackage{longtable}',
            r'\geometry{a4paper, margin=1in}',
            r'\setlength{\headheight}{15pt}',  # Fix fancyhdr warning
            r'\pagestyle{fancy}',
            r'\fancyhf{}',
            f'\\rhead{{PrepUp - {subject}}}',
            r'\lhead{Bookmarked Questions}',
            r'\rfoot{Page \thepage}',
            r'\begin{document}',
            r'\section*{Questions}',
            r'\begin{enumerate}'
        ]

        # Prepare solutions list
        solutions_list = []

        for i, q in enumerate(questions):
            # ... existing question processing ...
            item_content = ""
            passage = q.get('passage_text')
            if passage:
                passage_text = self._process_text_with_images(passage, temp_dir)
                item_content += f'\\textbf{{Passage:}} {passage_text} \\\\ \\vspace{{0.2cm}}\n'
            
            q_text = self._process_text_with_images(q.get('question', '') or q.get('question_text', ''), temp_dir)
            item_content += f"{{\\bfseries {q_text}}}"
            
            # Handle explicit image_url field
            image_url_raw = q.get('image_url')
            if image_url_raw:
                # Handle comma-separated URLs
                urls = [url.strip() for url in image_url_raw.split(',') if url.strip()]
                
                for url in urls:
                    print(f"Processing image URL: {url}") # Debug log
                    filename = self._download_image(url, temp_dir)
                    if filename:
                        image_latex = f'\\begin{{figure}}[H] \\centering \\includegraphics[width=0.8\\linewidth]{{{filename}}} \\caption{{Question Image}} \\end{{figure}}'
                        item_content += f" \\\\ {image_latex}"
                    else:
                        print(f"Failed to download image: {url}")

            content.append(f'  \\item {item_content}')
            content.append(r'  \begin{enumerate}[label=(\Alph*)]')
            
            options = q.get('options', [])
            for opt in options:
                # Handle various option formats
                opt_text_raw = ""
                if isinstance(opt, dict):
                    opt_text_raw = opt.get('option_text') or opt.get('text') or ""
                else:
                    opt_text_raw = str(opt)
                
                opt_text = self._process_text_with_images(opt_text_raw, temp_dir)
                content.append(f'    \\item {opt_text}')
            content.append(r'  \end{enumerate}')
            
            # Collect solution if available
            solution = q.get('solution_text') or q.get('explanation') or q.get('rationale')
            if solution:
                 sol_text = self._process_text_with_images(solution, temp_dir)
                 solutions_list.append(f'\\textbf{{Q.{i+1}:}} {sol_text} \\\\ \\vspace{{0.5cm}}')
            
            content.append(r'  \vspace{0.5cm}')

        content.append(r'\end{enumerate}')
        content.append(r'\newpage')
        content.append(r'\section*{Answer Key}')
        
        # Use longtable for multi-page support
        content.append(r'\begin{longtable}{|c|c|}')
        content.append(r'\hline')
        content.append(r'\textbf{Q.No} & \textbf{Answer} \\')
        content.append(r'\hline')
        content.append(r'\endhead') # Header for every page
        
        for i, q in enumerate(questions):
            answer = q.get('correctAnswer') or q.get('correct_option_data') or ''
            options = q.get('options', [])
            
            # Try to determine the label (A, B, C, D)
            answer_label = "?"
            
            # Priority 1: Check for isCorrect flag in options (UPSC/quiz.json format)
            found_by_flag = False
            for idx, opt in enumerate(options):
                if isinstance(opt, dict) and opt.get('isCorrect') is True:
                    answer_label = chr(65 + idx)
                    found_by_flag = True
                    break
            
            if not found_by_flag:
                # Priority 2: If answer is an index (1-based string or int)
                if str(answer).isdigit():
                    idx = int(answer) - 1
                    if 0 <= idx < 26:
                        answer_label = chr(65 + idx)
                
                # Priority 3: Match answer text against option text
                else:
                     for idx, opt in enumerate(options):
                        opt_val = opt
                        if isinstance(opt, dict):
                            opt_val = opt.get('option_text') or opt.get('text') or ''
                        
                        # Loose matching (strip whitespace)
                        if str(opt_val).strip() == str(answer).strip():
                            answer_label = chr(65 + idx)
                            break

            content.append(f'{i + 1} & {answer_label} \\\\ \\hline')

        content.append(r'\end{longtable}')
        
        # Append Solutions Section
        if solutions_list:
            content.append(r'\newpage')
            content.append(r'\section*{Solutions}')
            for sol in solutions_list:
                content.append(sol)

        content.append(r'\end{document}')

        return '\n'.join(content)

    def _compile_latex(self, latex_content, temp_dir):
        tex_file = os.path.join(temp_dir, 'document.tex')
        with open(tex_file, 'w') as f:
            f.write(latex_content)
        
        # Run pdflatex twice to ensure references/layout are correct
        for _ in range(2):
            process = subprocess.run(
                ['pdflatex', '-interaction=nonstopmode', 'document.tex'],
                cwd=temp_dir,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
        
        if process.returncode != 0:
            print("LaTeX Compilation Warning/Error:")
            # Use errors='replace' to avoid UnicodeDecodeError on non-utf8 output
            print(process.stdout.decode('utf-8', errors='replace'))
            print(process.stderr.decode('utf-8', errors='replace'))
            # Don't raise exception immediately, check if PDF was generated

        pdf_file = os.path.join(temp_dir, 'document.pdf')
        if not os.path.exists(pdf_file):
            raise Exception("PDF file was not generated")
        
        return pdf_file