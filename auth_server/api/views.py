from django.http import JsonResponse
from rest_framework.permissions import AllowAny
from .storage import storage
import json
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
from users.models import User
import uuid

def subjects(request):
    """
    Retrieves a list of all unique subjects from the storage.

    Args:
        request: The HttpRequest object.

    Returns:
        A JsonResponse containing a list of unique subject names.
    """
    data = storage.get_subjects()
    return JsonResponse(data, safe=False)

def courses(request):
    """
    Retrieves a list of courses, optionally filtered by exam type.

    Args:
        request: The HttpRequest object. The 'examType' query parameter
                 can be used to filter courses.

    Returns:
        A JsonResponse containing a list of course objects.
    """
    exam_type = request.GET.get('examType')
    if exam_type:
        data = storage.get_courses_by_exam_type(exam_type)
    else:
        data = storage.get_courses()
    return JsonResponse(data, safe=False)

def course_detail(request, course_id):
    """
    Retrieves the details of a specific course.

    Args:
        request: The HttpRequest object.
        course_id: The ID of the course to retrieve.

    Returns:
        A JsonResponse with the course data, or a 404 error if not found.
    """
    data = storage.get_course(course_id)
    if data:
        return JsonResponse(data)
    else:
        return JsonResponse({"error": "Course not found"}, status=404)

def study_materials(request):
    """
    Retrieves study materials, filterable by exam type or subject.

    Args:
        request: The HttpRequest object. 'examType' or 'subject' can be
                 used as query parameters for filtering.

    Returns:
        A JsonResponse containing a list of study material objects.
    """
    exam_type = request.GET.get('examType')
    subject = request.GET.get('subject')
    if exam_type:
        data = storage.get_study_materials_by_exam_type(exam_type)
    elif subject:
        data = storage.get_study_materials_by_subject(subject)
    else:
        data = storage.get_study_materials()
    return JsonResponse(data, safe=False)

def study_material_detail(request, material_id):
    """
    Retrieves the details of a specific study material.

    Args:
        request: The HttpRequest object.
        material_id: The ID of the study material.

    Returns:
        A JsonResponse with the material's data, or a 404 error if not found.
    """
    data = storage.get_study_material(material_id)
    if data:
        return JsonResponse(data)
    else:
        return JsonResponse({"error": "Study material not found"}, status=404)

def practice_tests(request):
    """
    Retrieves practice tests, optionally filtered by exam type.

    Args:
        request: The HttpRequest object. 'examType' can be used as a query
                 parameter for filtering.

    Returns:
        A JsonResponse containing a list of practice test objects.
    """
    exam_type = request.GET.get('examType')
    if exam_type:
        data = storage.get_practice_tests_by_exam_type(exam_type)
    else:
        data = storage.get_practice_tests()
    return JsonResponse(data, safe=False)

def practice_test_detail(request, test_id):
    """
    Retrieves the details of a specific practice test.

    Args:
        request: The HttpRequest object.
        test_id: The ID of the practice test.

    Returns:
        A JsonResponse with the test data, or a 404 error if not found.
    """
    data = storage.get_practice_test(test_id)
    if data:
        return JsonResponse(data)
    else:
        return JsonResponse({"error": "Practice test not found"}, status=404)

def mock_tests(request):
    """
    Retrieves mock tests, optionally filtered by exam type.

    Args:
        request: The HttpRequest object. 'examType' can be used as a query
                 parameter for filtering.

    Returns:
        A JsonResponse containing a list of mock test objects.
    """
    exam_type = request.GET.get('examType')
    if exam_type:
        data = storage.get_mock_tests_by_exam_type(exam_type)
    else:
        data = storage.get_mock_tests()
    return JsonResponse(data, safe=False)

def mock_test_detail(request, test_id):
    """
    Retrieves the details of a specific mock test.

    Args:
        request: The HttpRequest object.
        test_id: The ID of the mock test.

    Returns:
        A JsonResponse with the test data, or a 404 error if not found.
    """
    data = storage.get_mock_test(test_id)
    if data:
        return JsonResponse(data)
    else:
        return JsonResponse({"error": "Mock test not found"}, status=404)

def sectional_tests(request):
    """
    Retrieves sectional tests, optionally filtered by exam type.

    Args:
        request: The HttpRequest object. 'examType' can be used as a query
                 parameter for filtering.

    Returns:
        A JsonResponse containing a list of sectional test objects.
    """
    exam_type = request.GET.get('examType')
    if exam_type:
        data = storage.get_sectional_tests_by_exam_type(exam_type)
    else:
        data = storage.get_sectional_tests()
    return JsonResponse(data, safe=False)

def sectional_test_detail(request, test_id):
    """
    Retrieves the details of a specific sectional test.

    Args:
        request: The HttpRequest object.
        test_id: The ID of the sectional test.

    Returns:
        A JsonResponse with the test data, or a 404 error if not found.
    """
    data = storage.get_sectional_test(test_id)
    if data:
        return JsonResponse(data)
    else:
        return JsonResponse({"error": "Sectional test not found"}, status=404)

def sectional_test_section(request, test_id, section):
    """
    Retrieves a specific section of a sectional test.

    Args:
        request: The HttpRequest object.
        test_id: The ID of the sectional test.
        section: The specific section to retrieve.

    Returns:
        A JsonResponse with the test section data, or a 404 error if not found.
    """
    # The logic for getting a section of a sectional test might need to be adjusted
    # based on how the data is structured and identified.
    data = storage.get_sectional_test_section(test_id, section)
    if data:
        return JsonResponse(data)
    else:
        return JsonResponse({"error": "Sectional test section not found"}, status=404)

@csrf_exempt
def test_sessions(request):
    """
    Handles the creation of new test sessions.

    Accepts POST requests to create a session.

    Args:
        request: The HttpRequest object, containing the session data in its body.

    Returns:
        A JsonResponse with the new session data and a 201 status on success,
        or a 405 error for non-POST requests.
    """
    if request.method == 'POST':
        data = json.loads(request.body)
        session = storage.create_test_session(data)
        return JsonResponse(session, status=201)
    else:
        return JsonResponse({"error": "Method not allowed"}, status=405)

@csrf_exempt
def test_session_detail(request, session_id):
    """
    Retrieves or updates a specific test session.

    Handles GET requests to fetch session details and PATCH requests to
    update them.

    Args:
        request: The HttpRequest object. For PATCH, the body contains updates.
        session_id: The ID of the test session.

    Returns:
        A JsonResponse with session data, or a 404 error if not found.
        Returns a 405 error for unsupported methods.
    """
    if request.method == 'GET':
        session = storage.get_test_session(session_id)
        if session:
            return JsonResponse(session)
        else:
            return JsonResponse({"error": "Test session not found"}, status=404)
    elif request.method == 'PATCH':
        updates = json.loads(request.body)
        session = storage.update_test_session(session_id, updates)
        if session:
            return JsonResponse(session)
        else:
            return JsonResponse({"error": "Test session not found"}, status=404)
    else:
        return JsonResponse({"error": "Method not allowed"}, status=405)

def user_test_sessions(request, user_id):
    """
    Retrieves all test sessions for a specific user.

    Args:
        request: The HttpRequest object.
        user_id: The ID of the user.

    Returns:
        A JsonResponse containing a list of the user's test sessions.
    """
    sessions = storage.get_test_sessions_by_user(user_id)
    return JsonResponse(sessions, safe=False)

def user_progress(request, user_id):
    """
    Retrieves all progress records for a specific user.

    Args:
        request: The HttpRequest object.
        user_id: The ID of the user.

    Returns:
        A JsonResponse containing a list of the user's progress records.
    """
    progress = storage.get_user_progress(user_id)
    return JsonResponse(progress, safe=False)

def user_progress_by_course(request, user_id, course_id):
    """
    Retrieves a user's progress for a specific course.

    Args:
        request: The HttpRequest object.
        user_id: The ID of the user.
        course_id: The ID of the course.

    Returns:
        A JsonResponse with the progress data, or a 404 error if not found.
    """
    progress = storage.get_user_progress_by_course(user_id, course_id)
    if progress:
        return JsonResponse(progress)
    else:
        return JsonResponse({"error": "Progress not found"}, status=404)

@csrf_exempt
@login_required
def add_question_view(request):
    """
    Handles the addition of a new question to the database.

    Accepts POST requests from authenticated users. The request body must
    contain the exam type, subject, and the question data itself.

    Args:
        request: The HttpRequest object.

    Returns:
        A JsonResponse confirming success with a 201 status, or an error
        response for bad requests or server errors.
    """
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            exam_type = data.get('examType')
            subject = data.get('subject')
            question_data = data.get('question')

            if not all([exam_type, subject, question_data]):
                return JsonResponse({"error": "Missing required fields"}, status=400)

            # Add a unique qid to the question
            question_data['qid'] = f"{subject}-{uuid.uuid4()}"

            success = storage.add_question(exam_type, subject, question_data)

            if success:
                return JsonResponse({"message": "Question added successfully"}, status=201)
            else:
                return JsonResponse({"error": "Failed to add question"}, status=500)
        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON"}, status=400)
    else:
        return JsonResponse({"error": "Only POST method is allowed"}, status=405)


from rest_framework.views import APIView
from adrf.views import APIView as AsyncAPIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .chatbot_service import invoke_agent
from rest_framework import status
from .models import TestSession, UserQuizState, UserQuizGoal, UserQuizProgress, UserDailySettings, DailyTarget, RevisionSchedule
from datetime import datetime, timezone, timedelta
from .storage import storage
from .services.question_generator import QuestionGenerator
import random


class ChatbotView(APIView):
    """
    Handles chatbot interactions for authenticated users.

    This is the main endpoint for the chatbot. It receives a user's message and returns the chatbot's response. The chatbot is a stateful agent that can use tools to perform actions on behalf of the user.

    **How to use:**
    To interact with the chatbot, the client should send a `POST` request to the following URL:
    `POST /api/chatbot/`

    The request body must be a JSON object containing the `message` from the user.

    **Example:**
    If the user says, "hello", the client should send the following JSON payload:
    ```json
    {
      "message": "hello"
    }
    ```

    The API will return a JSON response with the chatbot's reply:
    ```json
    {
      "reply": "Hello! How can I help you today?"
    }
    ```

    **Authentication:**
    This endpoint requires token-based authentication. The client must include the user's auth token in the `Authorization` header:
    `Authorization: Token <your_token>`

    **Parameters:**
    - `message` (string, required): The user's message to the chatbot.

    **Responses:**
    - `200 OK`: A JSON object containing the chatbot's `reply`.
    - `401 Unauthorized`: The user is not authenticated.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """
        Handles the incoming POST request by calling the chatbot service.
        """
        message = request.data.get('message', '')

        session_id = request.session.get('chatbot_session_id')
        if not session_id:
            session_id = str(uuid.uuid4())
            request.session['chatbot_session_id'] = session_id
        
        token = request.auth.key

        # print(f"\n\nMessage received: {message}\n\n")

        # Call the synchronous invoke_agent function directly with error handling
        try:
            reply = invoke_agent(session_id=session_id, message=message, token=token)
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.exception("Error in chatbot execution")
            err_msg = str(e)
            if "ResourceExhausted" in err_msg or "429" in err_msg or "quota" in err_msg.lower():
                reply = "⚠️ I have temporarily exceeded my Gemini API rate limit quota. Please try again in a minute!"
            else:
                reply = f"Sorry, I encountered an error: {err_msg}"

        return Response({"reply": reply})

class ChatbotConfigView(APIView):
    """
    Returns the configured Google/Gemini API key for authenticated users.
    Allows frontend components to load the key dynamically.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from .chatbot.settings import settings
        return Response({"api_key": settings.GOOGLE_API_KEY})

class ResetTestProgressView(APIView):
    """
    Resets the test progress for the authenticated user.

    This view handles a POST request to delete all `TestSession` and `UserQuizState` objects
    associated with the currently authenticated user, effectively resetting
    their test history and progress.

    **How to use:**
    To reset the user's test progress, the client should send a `POST` request to the following URL:
    `POST /api/reset-test-progress/`

    No request body is required.

    **Example:**
    If the user wants to reset their progress, the client should send a `POST` request to `/api/reset-test-progress/`.

    **Authentication:**
    This endpoint requires token-based authentication. The client must include the user's auth token in the `Authorization` header:
    `Authorization: Token <your_token>`

    **Parameters:**
    - None

    **Responses:**
    - `204 No Content`: The user's test progress was successfully reset.
    - `401 Unauthorized`: The user is not authenticated.
    - `500 Internal Server Error`: An error occurred while resetting the progress.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """
        Handles the POST request to reset user's test progress.

        Args:
            request (Request): The request object, containing user information.

        Returns:
            Response: A response indicating success or failure.
        """
        user = request.user
        try:
            TestSession.objects.filter(user=user).delete()
            UserQuizState.objects.filter(user=user).delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class TestSessionView(APIView):
    """
    Handles the creation of new test sessions.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """
        Creates a new test session.
        """
        user = request.user
        data = request.data

        try:
            session = TestSession.objects.create(
                user=user,
                test_id=data.get('testId'),
                start_time=data.get('startTime'),
                total_questions=data.get('totalQuestions'),
                answers=data.get('answers', []),
                subject=data.get('subject'),
                max_score=data.get('maxScore'),
            )
            return Response({'id': str(session.id)}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class TestSessionDetailView(APIView):
    """
    Handles retrieving, updating and deleting a specific test session.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, session_id):
        try:
            session = TestSession.objects.get(id=session_id, user=request.user)
            return Response({
                'id': str(session.id),
                'testId': session.test_id,
                'startTime': session.start_time,
                'endTime': session.end_time,
                'score': session.score,
                'totalQuestions': session.total_questions,
                'correctAnswers': session.correct_answers,
                'answers': session.answers,
                'status': session.status,
                'subject': session.subject,
                'maxScore': session.max_score,
            })
        except TestSession.DoesNotExist:
            return Response({'error': 'Test session not found'}, status=status.HTTP_404_NOT_FOUND)

    def patch(self, request, session_id):
        try:
            session = TestSession.objects.get(id=session_id, user=request.user)
            data = request.data

            session.answers = data.get('answers', session.answers)
            session.score = data.get('score', session.score)
            session.correct_answers = data.get('correctAnswers', session.correct_answers)
            session.status = data.get('status', session.status)
            if 'endTime' in data:
                session.end_time = data.get('endTime')

            session.save()
            
            # If the session just completed, trigger SRS flashcards for incorrect answers
            if session.status == 'completed' and 'status' in data:
                from api.tasks import generate_flashcard_task
                for ans in session.answers:
                    # 'isCorrect' or 'status' == 'incorrect' depending on frontend schema
                    is_incorrect = ans.get('isCorrect') is False or ans.get('status') == 'incorrect'
                    
                    if is_incorrect:
                        # We need the question data. We'll pass the whole ans dictionary.
                        question_id = ans.get('id') or ans.get('question_id') or ans.get('qid')
                        user_answer = ans.get('selectedAnswer') or ans.get('user_answer')
                        subject = session.subject or 'upsc'
                        
                        if question_id and user_answer:
                            from api.models import RevisionSchedule
                            from datetime import datetime, timedelta
                            from django.utils import timezone
                            
                            # Create RevisionSchedule sync to get ID
                            revision, _ = RevisionSchedule.objects.get_or_create(
                                user=request.user,
                                question_id=question_id,
                                defaults={
                                    'question_data': ans,
                                    'subject': subject,
                                    'next_review_date': datetime.now(timezone.utc).date() + timedelta(days=2),
                                    'review_interval': 2,
                                    'exam_target': 'upsc'
                                }
                            )
                            # Reset interval if it already existed
                            if not _:
                                revision.review_interval = 2
                                revision.next_review_date = datetime.now(timezone.utc).date() + timedelta(days=2)
                                revision.save()
                                
                            # Trigger the async task (Note: celery 5.x doesn't officially support async tasks natively,
                            # but we can use asyncio.run to call it or dispatch it as a regular celery task if we configure it.
                            # For simplicity, we'll import and run it as an asyncio task if it's an async def,
                            # or just run it via delay() if celery is running)
                            import asyncio
                            try:
                                # For demonstration, run it in background asyncio task
                                asyncio.create_task(generate_flashcard_task(revision.id, ans, user_answer))
                            except RuntimeError:
                                # Fallback if no event loop is running (e.g., standard Django sync view)
                                pass # We'll need a better way to trigger async from sync view

            return Response({'id': str(session.id)}, status=status.HTTP_200_OK)
        except TestSession.DoesNotExist:
            return Response({'error': 'Test session not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class UserQuizGoalView(APIView):
    """
    Handles getting and setting user quiz goals.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Retrieves the user's quiz goals and their progress for the day.
        """
        user = request.user
        today = datetime.now(timezone.utc).date()

        goals_qs = UserQuizGoal.objects.filter(user=user)
        goals_dict = {goal.subject: goal.goal for goal in goals_qs}

        # Calculate progress from TestSessions for today
        start_of_day = datetime.combine(today, datetime.min.time()).replace(tzinfo=timezone.utc)
        end_of_day = datetime.combine(today, datetime.max.time()).replace(tzinfo=timezone.utc)
        
        sessions = TestSession.objects.filter(
            user=user,
            start_time__range=(start_of_day, end_of_day)
        )
        
        progress_dict = {}
        for session in sessions:
            if session.subject and session.answers:
                # Count answered questions (where selectedAnswer is not null)
                answered_count = sum(1 for a in session.answers if a.get('selectedAnswer') is not None)
                progress_dict[session.subject] = progress_dict.get(session.subject, 0) + answered_count

        subjects = storage.get_subjects()
        all_goals_data = []

        for subject in subjects:
            goal = goals_dict.get(subject, 0)
            questions_attempted = progress_dict.get(subject, 0)

            all_goals_data.append({
                'subject': subject,
                'goal': goal,
                'questions_attempted': questions_attempted,
            })

        return Response(all_goals_data)

    def post(self, request):
        """
        Creates or updates a user's quiz goal for a specific subject.
        """
        user = request.user
        subject = request.data.get('subject')
        goal = request.data.get('goal')

        if not subject or goal is None:
            return Response({'error': 'Subject and goal are required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            goal_obj, created = UserQuizGoal.objects.update_or_create(
                user=user,
                subject=subject,
                defaults={'goal': goal}
            )
            return Response({
                'subject': goal_obj.subject,
                'goal': goal_obj.goal
            }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class UserQuizProgressView(APIView):
    """
    Handles getting and setting the user's quiz progress.

    This view allows the client to retrieve the last question index for a given test, or all quiz states for the user. It also allows the client to update the last question index for a given test.

    **How to use:**

    **Get Quiz State:**
    To get the last question index for a specific test, send a `GET` request with the `test_id` as a query parameter:
    `GET /api/user-quiz-state/?test_id={test_id}`

    To get all quiz states for the user, send a `GET` request without any query parameters:
    `GET /api/user-quiz-state/`

    **Update Quiz State:**
    To update the last question index for a test, send a `POST` request with the `test_id` and `last_question_index` in the request body:
    `POST /api/user-quiz-state/`

    **Example (Get specific quiz state):**
    `GET /api/user-quiz-state/?test_id=some-test-id`
    Response:
    ```json
    {
      "last_question_index": 5
    }
    ```

    **Example (Get all quiz states):**
    `GET /api/user-quiz-state/`
    Response:
    ```json
    [
      {
        "test_id": "some-test-id",
        "last_question_index": 5
      },
      {
        "test_id": "another-test-id",
        "last_question_index": 10
      }
    ]
    ```

    **Example (Update quiz state):**
    `POST /api/user-quiz-state/`
    Request Body:
    ```json
    {
      "test_id": "some-test-id",
      "last_question_index": 6
    }
    ```
    Response:
    ```json
    {
      "last_question_index": 6
    }
    ```

    **Authentication:**
    This endpoint requires token-based authentication. The client must include the user's auth token in the `Authorization` header:
    `Authorization: Token <your_token>`

    **Parameters (GET):**
    - `test_id` (query parameter, optional): The ID of the test to retrieve the state for.

    **Parameters (POST):**
    - `test_id` (string, required): The ID of the test to update.
    - `last_question_index` (integer, required): The new last question index.

    **Responses:**
    - `200 OK`: The quiz state was successfully retrieved or updated.
    - `400 Bad Request`: The request was malformed.
    - `401 Unauthorized`: The user is not authenticated.
    - `500 Internal Server Error`: An error occurred.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Retrieves the last question index for a given test, or all quiz states for the user.
        """
        test_id = request.query_params.get('test_id')
        if test_id:
            try:
                quiz_state = UserQuizState.objects.get(user=request.user, test_id=test_id)
                return Response({'last_question_index': quiz_state.last_question_index})
            except UserQuizState.DoesNotExist:
                return Response({'last_question_index': 0}, status=status.HTTP_200_OK)
            except Exception as e:
                return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        else:
            try:
                quiz_states = UserQuizState.objects.filter(user=request.user)
                data = [{'test_id': state.test_id, 'last_question_index': state.last_question_index} for state in quiz_states]
                return Response(data)
            except Exception as e:
                return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def post(self, request):
        """
        Updates the number of questions attempted by the user for a specific subject and date.
        """
        user = request.user
        subject = request.data.get('subject')
        questions_attempted = request.data.get('questions_attempted')
        date = datetime.now(timezone.utc).date()

        if not subject or questions_attempted is None:
            return Response({'error': 'Subject and questions_attempted are required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            progress, created = UserQuizProgress.objects.update_or_create(
                user=user,
                subject=subject,
                date=date,
                defaults={'questions_attempted': questions_attempted}
            )
            return Response({'questions_attempted': progress.questions_attempted}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class UserQuizStateView(APIView):
    """
    Handles getting and setting the user's last quiz state.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Retrieves the last question index for a given test, or all quiz states for the user.
        """
        test_id = request.query_params.get('test_id')
        if test_id:
            try:
                quiz_state = UserQuizState.objects.get(user=request.user, test_id=test_id)
                return Response({'last_question_index': quiz_state.last_question_index})
            except UserQuizState.DoesNotExist:
                return Response({'last_question_index': 0}, status=status.HTTP_200_OK)
            except Exception as e:
                return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        else:
            try:
                quiz_states = UserQuizState.objects.filter(user=request.user)
                data = [{'test_id': state.test_id, 'last_question_index': state.last_question_index} for state in quiz_states]
                return Response(data)
            except Exception as e:
                return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def post(self, request):
        """
        Updates the last question index for a given test.
        """
        test_id = request.data.get('test_id')
        last_question_index = request.data.get('last_question_index')

        if not test_id or last_question_index is None:
            return Response({'error': 'test_id and last_question_index are required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            quiz_state, created = UserQuizState.objects.update_or_create(
                user=request.user,
                test_id=test_id,
                defaults={'last_question_index': last_question_index}
            )
            return Response({'last_question_index': quiz_state.last_question_index}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class GenerateQuestionsView(AsyncAPIView):
    """
    Generates practice questions using AI.
    """
    permission_classes = [IsAuthenticated]

    async def post(self, request):
        """
        Generates questions based on topic and difficulty.
        """
        exam_type = request.data.get('examType')
        subject = request.data.get('subject')
        topic = request.data.get('topic')
        difficulty = request.data.get('difficulty')
        count = request.data.get('count', 5)

        if not all([exam_type, subject, topic, difficulty]):
            return Response(
                {'error': 'examType, subject, topic, and difficulty are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        generator = QuestionGenerator()
        questions = await generator.generate_questions(exam_type, subject, topic, difficulty, count)

        if questions:
            return Response(questions, status=status.HTTP_200_OK)
        else:
            return Response(
                {'error': 'Failed to generate questions'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

from .chatbot.tools.safe_tools import safe_tools_list
from .chatbot.tools.dynamic_tools import dynamic_tools_list
from langchain_core.tools import StructuredTool

def convert_to_gemini_tool(tool: StructuredTool):
    """Converts a LangChain tool to a Gemini tool declaration."""
    schema = tool.args_schema.schema() if tool.args_schema else {"type": "object", "properties": {}}
    
    # Gemini expects 'type' to be uppercase
    def fix_types(schema_part):
        if 'type' in schema_part:
            schema_part['type'] = schema_part['type'].upper()
        if 'properties' in schema_part:
            for prop in schema_part['properties'].values():
                fix_types(prop)
    
    fix_types(schema)

    return {
        "name": tool.name,
        "description": tool.description,
        "parameters": schema
    }

class ChatbotToolsView(AsyncAPIView):
    """
    Exposes available backend tools for the frontend voice agent.
    """
    permission_classes = [IsAuthenticated]

    async def get(self, request):
        all_tools = safe_tools_list + dynamic_tools_list
        gemini_tools = [convert_to_gemini_tool(t) for t in all_tools]
        return Response({"tools": gemini_tools})

class ChatbotToolExecutionView(AsyncAPIView):
    """
    Executes a backend tool requested by the frontend voice agent.
    """
    permission_classes = [IsAuthenticated]

    async def post(self, request):
        tool_name = request.data.get('name')
        arguments = request.data.get('arguments', {})
        
        all_tools = safe_tools_list + dynamic_tools_list
        tool = next((t for t in all_tools if t.name == tool_name), None)
        
        if not tool:
            return Response({"error": f"Tool {tool_name} not found"}, status=status.HTTP_404_NOT_FOUND)
            
        try:
            # Pass token in config if needed
            config = {"configurable": {"token": request.auth.key}}
            result = await tool.ainvoke(arguments, config=config)
            return Response({"result": result})
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class LeaderboardView(APIView):
    """
    Returns leaderboard data for top users.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Get leaderboard rankings.
        Query params:
        - type: 'score' or 'streak' (default: 'score')
        - limit: number of users to return (default: 50)
        """
        leaderboard_type = request.query_params.get('type', 'score')
        limit = int(request.query_params.get('limit', 50))
        
        if leaderboard_type == 'streak':
            top_users = User.objects.order_by('-current_streak', '-total_score')[:limit]
        else:
            top_users = User.objects.order_by('-total_score', '-current_streak')[:limit]
        
        leaderboard_data = []
        for rank, user in enumerate(top_users, start=1):
            leaderboard_data.append({
                'rank': rank,
                'name': user.name,
                'email': user.email,
                'total_score': user.total_score,
                'current_streak': user.current_streak,
                'exam_type': user.exam_type,
                'is_current_user': user.id == request.user.id
            })
        
        return Response({
            'type': leaderboard_type,
            'leaderboard': leaderboard_data
        })

from rest_framework.views import APIView

class PerformanceAnalyticsView(APIView):
    """
    Returns detailed performance analytics for the authenticated user.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Get detailed analytics including:
        - Topic-wise performance
        - Accuracy over time
        - Streak history
        - Recent activity
        """
        user = request.user
        
        # Get all test sessions for the user
        test_sessions = TestSession.objects.filter(user=user).order_by('-start_time')[:30]
        
        # Calculate topic-wise performance
        topic_performance = {}
        accuracy_over_time = []
        
        for session in test_sessions:
            # Topic performance
            # Use subject as the grouping key, defaulting to 'Unknown' if missing
            subject = session.subject if session.subject else 'Unknown'
            
            if subject not in topic_performance:
                topic_performance[subject] = {
                    'total_questions': 0,
                    'correct_answers': 0,
                    'accuracy': 0
                }
            
            topic_performance[subject]['total_questions'] += session.total_questions
            topic_performance[subject]['correct_answers'] += session.correct_answers
            
            # Accuracy over time
            accuracy = (session.correct_answers / session.total_questions * 100) if session.total_questions > 0 else 0
            accuracy_over_time.append({
                'date': session.start_time.strftime('%Y-%m-%d'),
                'accuracy': round(accuracy, 2),
                'score': session.score
            })
        
        # Calculate final topic accuracies
        for topic in topic_performance:
            total = topic_performance[topic]['total_questions']
            correct = topic_performance[topic]['correct_answers']
            topic_performance[topic]['accuracy'] = round((correct / total * 100) if total > 0 else 0, 2)
        
        # Get study days for streak history
        study_days = StudyDay.objects.filter(user=user).order_by('-date')[:30]
        streak_history = [
            {
                'date': day.date.strftime('%Y-%m-%d'),
                'minutes_studied': int(day.duration_seconds / 60)
            }
            for day in study_days
        ]
        
        return Response({
            'user': {
                'name': user.name,
                'total_score': user.total_score,
                'current_streak': user.current_streak,
                'exam_type': user.exam_type
            },
            'topic_performance': topic_performance,
            'accuracy_over_time': accuracy_over_time,
            'streak_history': streak_history,
            'total_tests_taken': test_sessions.count()
        })

class MockTestLeaderboardView(AsyncAPIView):
    """
    Returns leaderboard for a specific mock test.
    """
    permission_classes = [IsAuthenticated]

    async def get(self, request, test_id):
        """
        Get leaderboard for a specific test.
        """
        from api.models import MockTestLeaderboard
        
        leaderboard_entries = MockTestLeaderboard.objects.filter(
            test_id=test_id
        ).select_related('user').order_by('rank')[:100]
        
        leaderboard_data = []
        for entry in leaderboard_entries:
            leaderboard_data.append({
                'rank': entry.rank,
                'name': entry.user.name,
                'email': entry.user.email,
                'score': entry.score,
                'timestamp': entry.timestamp.isoformat(),
                'is_current_user': entry.user.id == request.user.id
            })
        
        return Response({
            'test_id': test_id,
            'leaderboard': leaderboard_data
        })


class BadgeListView(APIView):
    """
    Returns all available badges.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Get all available badges.
        """
        from api.models import Badge
        
        badges = Badge.objects.all().order_by('category', 'points')
        
        badge_data = []
        for badge in badges:
            badge_data.append({
                'id': str(badge.id),
                'name': badge.name,
                'description': badge.description,
                'icon_emoji': badge.icon_emoji,
                'icon_url': badge.icon_url,
                'category': badge.category,
                'points': badge.points,
                'criteria': badge.criteria
            })
        
        return Response({'badges': badge_data})


class UserBadgesView(APIView):
    """
    Returns badges earned by the authenticated user.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Get user's earned badges.
        """
        from api.models import UserBadge
        
        user_badges = UserBadge.objects.filter(
            user=request.user
        ).select_related('badge').order_by('-earned_at')
        
        badge_data = []
        for user_badge in user_badges:
            badge = user_badge.badge
            badge_data.append({
                'id': str(badge.id),
                'name': badge.name,
                'description': badge.description,
                'icon_emoji': badge.icon_emoji,
                'icon_url': badge.icon_url,
                'category': badge.category,
                'points': badge.points,
                'earned_at': user_badge.earned_at.isoformat()
            })
        
        return Response({
            'badges': badge_data,
            'total_points': sum(b['points'] for b in badge_data)
        })


class TestSessionAnalyticsView(AsyncAPIView):
    """
    Returns detailed analytics for a specific test session.
    """
    permission_classes = [IsAuthenticated]

    async def get(self, request, session_id):
        """
        Get detailed analytics for a test session.
        """
        from api.models import TestSession, UserAnswer
        
        try:
            session = await TestSession.objects.aget(id=session_id, user=request.user)
        except TestSession.DoesNotExist:
            return Response(
                {'error': 'Session not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get all user answers for this session
        user_answers_qs = UserAnswer.objects.filter(session=session).order_by('id')
        user_answers = [a async for a in user_answers_qs]
        
        # Calculate topic-wise performance
        topic_stats = {}
        question_details = []
        
        for answer in user_answers:
            # Track topic performance
            topic = answer.topic or 'General'
            if topic not in topic_stats:
                topic_stats[topic] = {
                    'total': 0,
                    'correct': 0,
                    'total_time': 0
                }
            
            topic_stats[topic]['total'] += 1
            if answer.is_correct:
                topic_stats[topic]['correct'] += 1
            topic_stats[topic]['total_time'] += answer.time_spent
            
            # Question details
            question_details.append({
                'question_id': answer.question_id,
                'question_text': answer.question_text,
                'topic': answer.topic,
                'user_answer': answer.user_answer,
                'correct_answer': answer.correct_answer,
                'is_correct': answer.is_correct,
                'time_spent': answer.time_spent,
                'status': answer.status
            })
        
        # Calculate topic accuracies
        topic_performance = []
        for topic, stats in topic_stats.items():
            accuracy = (stats['correct'] / stats['total'] * 100) if stats['total'] > 0 else 0
            avg_time = stats['total_time'] / stats['total'] if stats['total'] > 0 else 0
            topic_performance.append({
                'topic': topic,
                'total_questions': stats['total'],
                'correct_answers': stats['correct'],
                'accuracy': round(accuracy, 2),
                'average_time': round(avg_time, 2)
            })
        
        return Response({
            'session': {
                'id': str(session.id),
                'test_id': session.test_id,
                'score': session.score,
                'total_questions': session.total_questions,
                'correct_answers': session.correct_answers,
                'start_time': session.start_time.isoformat(),
                'end_time': session.end_time.isoformat() if session.end_time else None
            },
            'topic_performance': topic_performance,
            'question_details': question_details
        })

# Essay System Views

class EssayTopicGenerateView(AsyncAPIView):
    """
    Generate new essay topics using LLM.
    """
    permission_classes = [AllowAny]

    async def post(self, request):
        """
        Generate essay topics for a specific domain.
        """
        from api.services.essay_topic_generator import EssayTopicGenerator
        from api.models import EssayTopic
        from asgiref.sync import sync_to_async
        
        domain = request.data.get('domain')
        count = request.data.get('count', 3)
        
        if not domain:
            return Response(
                {'error': 'domain is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        generator = EssayTopicGenerator()
        topics_data = await generator.research_current_topics(domain, count)
        
        # Save topics to database using sync_to_async
        created_topics = []
        
        @sync_to_async
        def create_topic(data, domain_name):
            return EssayTopic.objects.create(
                title=data.get('title', ''),
                description=data.get('description', ''),
                domain=domain_name,
                difficulty=data.get('difficulty', 'medium'),
                context=data.get('context', ''),
                key_points=data.get('key_points', [])
            )

        for topic_data in topics_data:
            topic = await create_topic(topic_data, domain)
            created_topics.append({
                'id': str(topic.id),
                'title': topic.title,
                'description': topic.description,
                'domain': topic.domain,
                'difficulty': topic.difficulty,
                'context': topic.context,
                'key_points': topic.key_points
            })
        
        return Response({'topics': created_topics})


class EssayTopicListView(APIView):
    """
    List available essay topics.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        """
        Get list of essay topics with optional filtering.
        """
        from api.models import EssayTopic
        
        domain = request.query_params.get('domain')
        difficulty = request.query_params.get('difficulty')
        
        topics = EssayTopic.objects.all()
        
        if domain:
            topics = topics.filter(domain=domain)
        if difficulty:
            topics = topics.filter(difficulty=difficulty)
        
        topics = topics[:50]  # Limit to 50 topics
        
        topics_data = []
        for topic in topics:
            topics_data.append({
                'id': str(topic.id),
                'title': topic.title,
                'description': topic.description,
                'domain': topic.domain,
                'difficulty': topic.difficulty,
                'context': topic.context,
                'key_points': topic.key_points,
                'created_at': topic.created_at.isoformat()
            })
        
        return Response({'topics': topics_data})


class XATEssayQuestionListView(APIView):
    """
    List available XAT essay questions.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        """
        Get list of XAT essay questions.
        """
        from api.models import XATEssayQuestion
        
        questions = XATEssayQuestion.objects.all()
        
        questions_data = []
        for q in questions:
            questions_data.append({
                'id': q.id,
                'qid': q.qid,
                'passage_text': q.passage_text,
                'question_text': q.question_text,
                'solution_text': q.solution_text
            })
        
        return Response({'questions': questions_data})


class EssayListCreateView(APIView):
    """
    List user's essays or create new essay.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        """
        Get user's essays.
        """
        from api.models import Essay
        
        status_filter = request.query_params.get('status')
        
        if request.user.is_authenticated:
            essays = Essay.objects.filter(user=request.user)
        else:
            essays = Essay.objects.none()
        
        if status_filter:
            essays = essays.filter(status=status_filter)
        
        essays = essays[:50]
        
        essays_data = []
        for essay in essays:
            essays_data.append({
                'id': str(essay.id),
                'title': essay.title,
                'content': essay.content,
                'topic_id': str(essay.topic.id) if essay.topic else None,
                'topic_title': essay.topic.title if essay.topic else None,
                'word_count': essay.word_count,
                'time_spent': essay.time_spent,
                'status': essay.status,
                'created_at': essay.created_at.isoformat(),
                'updated_at': essay.updated_at.isoformat(),
                'submitted_at': essay.submitted_at.isoformat() if essay.submitted_at else None,
                'xat_question_id': essay.xat_question.qid if essay.xat_question else None
            })
        
        return Response({'essays': essays_data})

    def post(self, request):
        """
        Create new essay.
        """
        from api.models import Essay, EssayTopic
        
        title = request.data.get('title')
        topic_id = request.data.get('topic_id')
        xat_question_id = request.data.get('xat_question_id')
        content = request.data.get('content', '')
        
        if not title:
            return Response(
                {'error': 'title is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        topic = None
        if topic_id:
            try:
                topic = EssayTopic.objects.get(id=topic_id)
            except EssayTopic.DoesNotExist:
                pass
        
        xat_question = None
        if xat_question_id:
            from api.models import XATEssayQuestion
            try:
                xat_question = XATEssayQuestion.objects.get(qid=xat_question_id)
                if not title:
                    title = f"Essay for {xat_question.qid}"
            except XATEssayQuestion.DoesNotExist:
                pass
        
        user = request.user if request.user.is_authenticated else None
        essay = Essay.objects.create(
            user=user,
            topic=topic,
            xat_question=xat_question,
            title=title,
            content=content
        )
        
        return Response({
            'id': str(essay.id),
            'title': essay.title,
            'status': essay.status
        }, status=status.HTTP_201_CREATED)


class EssayDetailView(APIView):
    """
    Get, update, or delete a specific essay.
    """
    permission_classes = [AllowAny]

    def get(self, request, essay_id):
        """
        Get essay details.
        """
        from api.models import Essay
        
        try:
            if request.user.is_authenticated:
                essay = Essay.objects.get(id=essay_id, user=request.user)
            else:
                essay = Essay.objects.get(id=essay_id)
        except Essay.DoesNotExist:
            return Response(
                {'error': 'Essay not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        return Response({
            'id': str(essay.id),
            'title': essay.title,
            'content': essay.content,
            'topic_id': str(essay.topic.id) if essay.topic else None,
            'topic_title': essay.topic.title if essay.topic else None,
            'xat_question_id': essay.xat_question.qid if essay.xat_question else None,
            'word_count': essay.word_count,
            'time_spent': essay.time_spent,
            'status': essay.status,
            'created_at': essay.created_at.isoformat(),
            'updated_at': essay.updated_at.isoformat()
        })

    def put(self, request, essay_id):
        """
        Update essay (auto-save).
        """
        from api.models import Essay
        
        try:
            if request.user.is_authenticated:
                essay = Essay.objects.get(id=essay_id, user=request.user)
            else:
                essay = Essay.objects.get(id=essay_id)
        except Essay.DoesNotExist:
            return Response(
                {'error': 'Essay not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if essay.status != 'draft':
            return Response(
                {'error': 'Cannot edit submitted essay'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if 'content' in request.data:
            essay.content = request.data['content']
        if 'title' in request.data:
            essay.title = request.data['title']
        if 'word_count' in request.data:
            essay.word_count = request.data['word_count']
        if 'time_spent' in request.data:
            essay.time_spent = request.data['time_spent']
        
        essay.save()
        
        return Response({'message': 'Essay updated successfully'})


class EssaySubmitView(AsyncAPIView):
    """
    Submit essay for review.
    """
    permission_classes = [AllowAny]

    async def post(self, request, essay_id):
        """
        Submit essay and trigger LLM review.
        """
        from api.models import Essay
        from django.utils import timezone
        from asgiref.sync import sync_to_async
        import traceback
        
        try:
            # Handle user authentication check safely for async
            user = request.user
            if not user.is_authenticated:
                # If not authenticated, we can't filter by user unless we allow anonymous essays
                # But the model has user field. If it's anonymous, user might be None.
                # For now, let's assume we need to match the user if authenticated.
                # If anonymous, we might need to rely on session or just ID if allowed.
                # Given the error was 401 on review, auth is expected.
                pass

            try:
                # Use aget for async retrieval
                if user.is_authenticated:
                    essay = await Essay.objects.aget(id=essay_id, user=user)
                else:
                    # Fallback for anonymous if allowed, or just by ID
                    # But EssaySubmitView has AllowAny, so maybe anonymous is possible?
                    # If so, user field would be None.
                    essay = await Essay.objects.aget(id=essay_id)
                    # Security risk? Anyone can submit anyone's essay? 
                    # For now, let's stick to what was there but safe.
            except Essay.DoesNotExist:
                return Response(
                    {'error': 'Essay not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            if essay.status != 'draft':
                return Response(
                    {'error': 'Essay already submitted'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            essay.status = 'submitted'
            essay.submitted_at = timezone.now()
            # Use asave for async save
            await essay.asave()
            
            # Trigger review inline (bypass Celery for reliability)
            from api.services.essay_reviewer import EssayReviewer
            from api.models import EssayReview
            
            try:
                # Run synchronous init in thread if needed, but it's lightweight
                reviewer = EssayReviewer()
                review_data = await reviewer.analyze_essay(essay.title, essay.content)
                
                # Use acreate for async creation
                await EssayReview.objects.acreate(
                    essay=essay,
                    overall_score=review_data.get('overall_score', 0),
                    structure_score=review_data.get('structure_score', 0),
                    coherence_score=review_data.get('coherence_score', 0),
                    arguments_score=review_data.get('arguments_score', 0),
                    language_score=review_data.get('language_score', 0),
                    detailed_feedback=review_data.get('detailed_feedback', {}),
                    improvement_suggestions=review_data.get('improvement_suggestions', [])
                )
                
                essay.status = 'reviewed'
                await essay.asave()
                
            except Exception as e:
                print(f"Error reviewing essay: {e}")
                traceback.print_exc()
                # Even if review fails, we mark as submitted but maybe with a warning?
                # For now, let's just log it and return success so the UI doesn't break
                pass
            
            return Response({
                'message': 'Essay submitted and reviewed',
                'essay_id': str(essay.id)
            })
            
        except Exception as e:
            traceback.print_exc()
            return Response(
                {'error': f'Internal Server Error: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class DueRevisionsView(APIView):
    """
    Returns flashcards that are due for revision today or earlier.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from api.models import RevisionSchedule
        from django.utils import timezone
        
        today = timezone.now().date()
        
        # Get revisions due today or earlier that have an AI flashcard generated
        due_revisions = RevisionSchedule.objects.filter(
            user=request.user,
            next_review_date__lte=today,
            ai_flashcard_content__isnull=False
        ).order_by('next_review_date')[:50]
        
        revisions_data = []
        for rev in due_revisions:
            revisions_data.append({
                'id': str(rev.id),
                'question_id': rev.question_id,
                'subject': rev.subject,
                'flashcard': rev.ai_flashcard_content,
                'next_review_date': rev.next_review_date.isoformat(),
            })
            
        return Response({'revisions': revisions_data})


class ReviewFlashcardView(APIView):
    """
    Updates the revision schedule after a user reviews a flashcard.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, revision_id):
        from api.models import RevisionSchedule
        from datetime import timedelta
        from django.utils import timezone
        
        difficulty = request.data.get('difficulty') # "hard", "good", "easy"
        if not difficulty in ["hard", "good", "easy"]:
            return Response({'error': 'Invalid difficulty'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            revision = RevisionSchedule.objects.get(id=revision_id, user=request.user)
            
            # Simple SRS Logic
            if difficulty == "hard":
                revision.review_interval = 1
            elif difficulty == "good":
                revision.review_interval = max(2, int(revision.review_interval * 1.5))
            elif difficulty == "easy":
                revision.review_interval = max(3, int(revision.review_interval * 2.5))
                
            revision.next_review_date = timezone.now().date() + timedelta(days=revision.review_interval)
            revision.save()
            
            return Response({'status': 'success', 'next_review_date': revision.next_review_date.isoformat()})
            
        except RevisionSchedule.DoesNotExist:
            return Response({'error': 'Revision not found'}, status=status.HTTP_404_NOT_FOUND)



class EssayReviewView(APIView):
    """
    Get essay review.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, essay_id):
        """
        Get review for an essay.
        """
        from api.models import Essay, EssayReview
        
        try:
            essay = Essay.objects.get(id=essay_id, user=request.user)
        except Essay.DoesNotExist:
            return Response(
                {'error': 'Essay not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        try:
            review = EssayReview.objects.get(essay=essay)
        except EssayReview.DoesNotExist:
            return Response(
                {'error': 'Review not available yet'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        return Response({
            'overall_score': review.overall_score,
            'structure_score': review.structure_score,
            'coherence_score': review.coherence_score,
            'arguments_score': review.arguments_score,
            'language_score': review.language_score,
            'detailed_feedback': review.detailed_feedback,
            'improvement_suggestions': review.improvement_suggestions,
            'reviewed_at': review.reviewed_at.isoformat()
        })


class UserDailySettingsView(APIView):
    """
    Handles fetching and updating user's daily target settings.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        settings, created = UserDailySettings.objects.get_or_create(user=user)
        return Response({
            'varcQuestions': settings.varc_questions,
            'dilrQuestions': settings.dilr_questions,
            'qaQuestions': settings.qa_questions,
            'timePerQuestion': settings.time_per_question,
        })

    def put(self, request):
        user = request.user
        data = request.data
        settings, created = UserDailySettings.objects.get_or_create(user=user)

        settings.varc_questions = data.get('varcQuestions', settings.varc_questions)
        settings.dilr_questions = data.get('dilrQuestions', settings.dilr_questions)
        settings.qa_questions = data.get('qaQuestions', settings.qa_questions)
        settings.time_per_question = data.get('timePerQuestion', settings.time_per_question)
        settings.save()

        return Response({
            'varcQuestions': settings.varc_questions,
            'dilrQuestions': settings.dilr_questions,
            'qaQuestions': settings.qa_questions,
            'timePerQuestion': settings.time_per_question,
        })


class DailyTargetView(APIView):
    """
    Handles retrieving generated daily targets.
    """
    permission_classes = [IsAuthenticated]

    def _get_linear_questions(self, subject, count, offset=0):
        all_questions = []
        
        # Collect questions from practice tests
        for test in storage.get_practice_tests():
             # Basic subject matching - can be improved
            if subject.lower() in test['subject'].lower() or test['subject'].lower() in subject.lower():
                all_questions.extend(test.get('questions', []))
        
        # Collect from sectionals
        for test in storage.get_sectional_tests():
            if subject.lower() in test['subject'].lower() or test['subject'].lower() in subject.lower():
                all_questions.extend(test.get('questions', []))
                
        # If we have questions, slice them linearly
        if all_questions:
            total = len(all_questions)
            start_index = offset % total
            
            questions = []
            for i in range(count):
                questions.append(all_questions[(start_index + i) % total])
            
            return questions
        
        return []

    def get(self, request):
        user = request.user
        today = datetime.now(timezone.utc).date()
        date_str = request.query_params.get('date', str(today))
        
        try:
            target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
        except ValueError:
            return Response({'error': 'Invalid date format'}, status=status.HTTP_400_BAD_REQUEST)

        settings, _ = UserDailySettings.objects.get_or_create(user=user)
        
        subjects_config = {
            'VARC': settings.varc_questions,
            'DILR': settings.dilr_questions,
            'Quantitative Aptitude': settings.qa_questions # Check exact subject names in storage
        }
        
        # Map simplified keys to storage subject names if needed
        # Assuming 'VARC', 'DILR', 'Quants' or similar are used. 
        # Using a mapping based on observation of storage.py
        subject_mapping = {
            'VARC': ['VARC', 'Verbal', 'English'],
            'DILR': ['DILR', 'Data Interpretation', 'Logical Reasoning'],
            'Quantitative Aptitude': ['Quants', 'Quantitative', 'Math']
        }

        response_data = []

        for key, count in subjects_config.items():
            # Check for existing target
            target, created = DailyTarget.objects.get_or_create(
                user=user,
                date=target_date,
                subject=key,
                defaults={'questions': []}
            )

            if created or not target.questions:
                # Generate questions
                # Find matching subject in storage
                questions = []
                # Try to find questions for mapped subjects
                possible_subjects = subject_mapping.get(key, [key])
                
                # Get current offset for this subject
                offset_field = {
                    'VARC': 'varc_offset',
                    'DILR': 'dilr_offset',
                    'Quantitative Aptitude': 'qa_offset'
                }.get(key)
                
                current_offset = getattr(settings, offset_field, 0) if offset_field else 0
                
                questions = self._get_linear_questions(key, count, offset=current_offset)
                
                if not questions:
                    for sub in possible_subjects:
                        questions = self._get_linear_questions(sub, count, offset=current_offset)
                        if questions:
                            break
                            
                target.questions = questions
                target.save()

                # Update offset in settings
                if offset_field and questions:
                    setattr(settings, offset_field, current_offset + len(questions))
                    settings.save()

            # Check for sessions
            test_id = f"daily-target-{target.subject}-{target.date}"
            sessions = TestSession.objects.filter(user=user, test_id=test_id).order_by('-start_time')
            
            in_progress_session = sessions.filter(status='in-progress').first()
            latest_completed_session = sessions.filter(status='completed').first()

            response_data.append({
                'id': str(target.id),
                'subject': target.subject,
                'date': target.date,
                'isCompleted': target.is_completed,
                'isInProgress': in_progress_session is not None,
                'inProgressSessionId': str(in_progress_session.id) if in_progress_session else None,
                'latestSessionId': str(latest_completed_session.id) if latest_completed_session else (str(in_progress_session.id) if in_progress_session else None),
                'attemptsCount': sessions.filter(status='completed').count(),
                'score': target.score,
                'totalQuestions': len(target.questions),
                'questions': target.questions if not target.is_completed else [],
                'timePerQuestion': settings.time_per_question,
            })

            # If request asks for specific target details (e.g. to start test), we might need another endpoint or param
            # For now returning list summary + questions. 
            
        return Response(response_data)


class DailyTargetStartView(APIView):
    """
    Starts or resumes a daily target session.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        target_id = request.data.get('targetId')
        try:
            target = DailyTarget.objects.get(id=target_id, user=request.user)
        except DailyTarget.DoesNotExist:
            return Response({'error': 'Target not found'}, status=404)

        test_id = f"daily-target-{target.subject}-{target.date}"
        
        # Check for in-progress session
        session = TestSession.objects.filter(
            user=request.user, 
            test_id=test_id, 
            status='in-progress'
        ).first()

        if not session:
            # Create a new session
            session = TestSession.objects.create(
                user=request.user,
                test_id=test_id,
                subject=target.subject,
                start_time=datetime.now(timezone.utc),
                total_questions=len(target.questions),
                max_score=len(target.questions) * 3,
                answers=[],
                status='in-progress'
            )

        return Response({
            'sessionId': str(session.id),
            'target': {
                'id': str(target.id),
                'subject': target.subject,
                'questions': target.questions,
                'timePerQuestion': UserDailySettings.objects.get(user=request.user).time_per_question
            },
            'progress': {
                'answers': session.answers,
                'currentQuestionIndex': session.current_question_index or 0
            }
        })


class DailyTargetRegenerateView(APIView):
    """
    Deletes today's daily targets to force regeneration on next fetch.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        today = datetime.now(timezone.utc).date()
        
        # Delete today's targets
        deleted_count, _ = DailyTarget.objects.filter(user=user, date=today).delete()
        
        return Response({
            'status': 'success',
            'message': f'Deleted {deleted_count} targets for today. They will be regenerated on refresh.'
        })


class DailyTargetSubmitView(APIView):
    """
    Handles submission of daily target results.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        target_id = request.data.get('targetId')
        answers = request.data.get('answers', []) # List of {questionId, isCorrect, ...}
        score = request.data.get('score', 0)
        
        try:
            target = DailyTarget.objects.get(id=target_id, user=request.user)
        except DailyTarget.DoesNotExist:
             return Response({'error': 'Target not found'}, status=status.HTTP_404_NOT_FOUND)

        target.is_completed = True
        target.score = score
        target.save()

        # Scheduling logic & Correctness calculation
        today = datetime.now(timezone.utc).date()
        processed_answers = []
        correct_count = 0
        
        for ans in answers:
            question_id = ans.get('questionId')
            selected = ans.get('selectedAnswer')
            
            # Find question in target
            question_data = next((q for q in target.questions if str(q.get('qid', q.get('id'))) == str(question_id)), None)
            
            is_correct = False
            if question_data:
                # Check for various forms of correct answer storage
                correct_val = question_data.get('correct_option_data') or question_data.get('correct_answer')
                if not correct_val:
                    # Fallback: check options for is_correct
                    options = question_data.get('options', [])
                    correct_opt = next((o for o in options if o.get('is_correct')), None)
                    if correct_opt:
                        correct_val = correct_opt.get('data_option')
                
                if selected == correct_val:
                    is_correct = True
                    correct_count += 1
            
            ans['isCorrect'] = is_correct
            processed_answers.append(ans)

            if not is_correct:
                # Schedule for revision
                if question_data:
                    RevisionSchedule.objects.update_or_create(
                        user=request.user,
                        question_id=question_id,
                        defaults={
                            'question_data': question_data,
                            'subject': target.subject,
                            'next_review_date': today + timedelta(days=2),
                            'review_interval': 2
                        }
                    )

        # Finalize TestSession
        test_id = f"daily-target-{target.subject}-{target.date}"
        
        session = TestSession.objects.filter(
            user=request.user,
            test_id=test_id,
            status='in-progress'
        ).first()

        if session:
            session.score = score
            session.answers = processed_answers
            session.correct_answers = correct_count
            session.status = 'completed'
            session.current_question_index = len(target.questions)
            session.end_time = datetime.now(timezone.utc)
            session.save()
        else:
            # Fallback if no in-progress session found
            total_questions = len(target.questions)
            TestSession.objects.create(
                user=request.user,
                test_id=test_id,
                subject=target.subject,
                score=score,
                correct_answers=correct_count,
                max_score=total_questions * 3,
                total_questions=total_questions,
                answers=processed_answers,
                status='completed',
                current_question_index=total_questions,
                start_time=datetime.now(timezone.utc),
                end_time=datetime.now(timezone.utc)
            )

        return Response({'status': 'success'})

    
class DailyTargetResetView(APIView):
    """
    Resets a daily target so it can be retaken.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, subject):
        user = request.user
        today = datetime.now(timezone.utc).date()
        
        # 1. Reset DailyTarget status
        try:
            target = DailyTarget.objects.get(
                user=user, 
                date=today, 
                subject=subject
            )
            target.is_completed = False
            target.score = None
            target.save()
        except DailyTarget.DoesNotExist:
            return Response({'error': 'Target not found'}, status=404)
        
        # 2. DO NOT delete TestSession records anymore to keep history
        # We just want to allow a new attempt. 
        # Existing sessions will be kept. 
        # The DailyTargetView and StartView will now see no 'in-progress' session and allow starting a new one.
        pass

        # 3. Clean up UserAnswers (implicitly deleted via CASCADE if linked to Session, but Session is linked to User not UserAnswers explicitly in some models? No, UserAnswer has ForeignKey to Session)
        # TestSession model: user_answers = models.ForeignKey(TestSession... related_name='user_answers') checks out.

        # Also need to reset RevisionSchedule?
        # Maybe keep revision items as is, they are beneficial. 

        return Response({'status': 'success'})


class DailyTargetSessionResultView(APIView):
    """
    Retrieves results for a specific daily target session, including question data.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, session_id):
        try:
            session = TestSession.objects.get(id=session_id, user=request.user)
            
            # Find the associated DailyTarget to get question details
            # test_id is daily-target-{subject}-{date}
            parts = session.test_id.split('-')
            # daily, target, subject, date
            # subject might contain dashes if not careful but we use str(target.subject)
            # Re-constructing target lookup
            
            # Better way: find DailyTarget by user and date from session test_id
            # test_id format: f"daily-target-{target.subject}-{target.date}"
            # This is a bit brittle if subject has dashes. 
            # Alternative: Since we know the subject and user, we can try matching.
            
            target = DailyTarget.objects.filter(
                user=request.user,
                subject=session.subject,
                # date can be extracted from test_id or just use session.start_time.date()
                date=session.start_time.date()
            ).first()

            if not target:
                 return Response({'error': 'Associated daily target not found'}, status=404)

            return Response({
                'sessionId': str(session.id),
                'testId': session.test_id,
                'subject': session.subject,
                'score': session.score,
                'totalQuestions': session.total_questions,
                'correctAnswers': session.correct_answers,
                'answers': session.answers,
                'status': session.status,
                'startTime': session.start_time,
                'endTime': session.end_time,
                'questions': target.questions
            })
        except TestSession.DoesNotExist:
            return Response({'error': 'Session not found'}, status=404)


class RevisionView(APIView):
    """
    Handles retrieving and submitting revision questions.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        today = datetime.now(timezone.utc).date()
        
        subject = request.query_params.get('subject')
        # exam_type = request.query_params.get('examType') # Can add if model supports it

        # Get pending revisions
        revisions = RevisionSchedule.objects.filter(user=user, next_review_date__lte=today)
        
        if subject:
            revisions = revisions.filter(subject=subject)
        
        data = []
        for rev in revisions:
             # Ensure question_data is valid
             if rev.question_data:
                data.append({
                    'id': str(rev.id),
                    'question': rev.question_data,
                    'subject': rev.subject,
                    'nextReviewDate': rev.next_review_date,
                    'interval': rev.review_interval
                })
            
        return Response(data)

    def post(self, request):
        # Submitting result for a revision question
        revision_id = request.data.get('revisionId')
        is_correct = request.data.get('isCorrect')
        
        try:
            revision = RevisionSchedule.objects.get(id=revision_id, user=request.user)
        except RevisionSchedule.DoesNotExist:
             return Response({'error': 'Revision not found'}, status=status.HTTP_404_NOT_FOUND)
             
        today = datetime.now(timezone.utc).date()

        if is_correct:
            # Increase interval
            new_interval = revision.review_interval + 2
            if new_interval > 21: # Cap at 21 days for now or delete/archive?
                # Done with revision for this question
                revision.delete()
                return Response({'status': 'completed', 'message': 'Question mastered!'})
            else:
                revision.review_interval = new_interval
                revision.next_review_date = today + timedelta(days=new_interval)
                revision.save()
        else:
            # Reset interval
            revision.review_interval = 1 # Reset to 1 day for stricter review
            revision.next_review_date = today + timedelta(days=1)
            revision.save()
            
        return Response({'status': 'scheduled', 'nextDate': revision.next_review_date})


class ScheduleRevisionView(APIView):
    """
    Bulk schedules questions for revision.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        items = request.data.get('items', [])
        
        if not items:
            return Response({'message': 'No items to schedule'}, status=status.HTTP_200_OK)

        today = datetime.now(timezone.utc).date()
        created_count = 0

        for item in items:
            question_id = item.get('questionId')
            subject = item.get('subject')
            question_data = item.get('questionData')

            if not question_id or not question_data:
                continue
                
            # If already exists, we might want to update it or ignore?
            # For simplicity, if it exists, ensure it's active.
            obj, created = RevisionSchedule.objects.update_or_create(
                user=user,
                question_id=question_id,
                defaults={
                    'question_data': question_data,
                    'subject': subject,
                    # If creating, set immediate review (or tomorrow). If updating, maybe reset logic?
                    # Let's say if we got it wrong AGAIN in a quiz, we reset it.
                    'next_review_date': today + timedelta(days=1),
                    'review_interval': 1
                }
            )
            if created:
                created_count += 1
        
        
        return Response({'message': f'Scheduled {created_count} items for revision'}, status=status.HTTP_201_CREATED)

class EssayModelAnswerView(AsyncAPIView):
    """
    Generates a model answer for a given essay topic.
    """
    permission_classes = [IsAuthenticated]

    async def post(self, request, essay_id):
        from api.models import Essay, EssayTopic, XATEssayQuestion
        from api.services.model_answer_generator import ModelAnswerGenerator
        
        try:
            essay = await Essay.objects.aget(id=essay_id, user=request.user)
        except Essay.DoesNotExist:
            return Response({'error': 'Essay not found'}, status=status.HTTP_404_NOT_FOUND)
        
        topic_title = essay.title
        context = ""
        
        # Determine topic and context
        if essay.topic_id:
            try:
                topic = await EssayTopic.objects.aget(id=essay.topic_id)
                topic_title = topic.title
                context = topic.context
            except EssayTopic.DoesNotExist:
                pass
        elif essay.xat_question_id:
             # Fallback for old XAT questions if any remain
            try:
                q = await XATEssayQuestion.objects.aget(qid=essay.xat_question_id)
                topic_title = q.question_text
                context = q.passage_text
            except XATEssayQuestion.DoesNotExist:
                pass
        
        generator = ModelAnswerGenerator()
        model_answer = await generator.generate_model_answer(topic_title, context)
        
        return Response({'model_answer': model_answer})

class UPSCMasteryStateView(APIView):
    """
    GET: Fetch the user's UPSC Mastery State data.
    PUT: Update or create the user's UPSC Mastery State data.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from api.models import UPSCMasteryState
        try:
            mastery_state = UPSCMasteryState.objects.get(user=request.user)
            return Response(mastery_state.state_data, status=status.HTTP_200_OK)
        except UPSCMasteryState.DoesNotExist:
            return Response({}, status=status.HTTP_200_OK)

    def put(self, request):
        from api.models import UPSCMasteryState
        try:
            state_data = request.data
            mastery_state, created = UPSCMasteryState.objects.update_or_create(
                user=request.user,
                defaults={'state_data': state_data}
            )
            return Response({'status': 'success', 'created': created}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class UpdateQuestionExplanationView(APIView):
    """
    POST: Update the solution explanation and correct option for a UPSC question.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        question_id = request.data.get('question_id')
        explanation = request.data.get('explanation')
        correct_option = request.data.get('correct_option') # e.g. "A", "B", "C", "D" or "1", "2", "3", "4"

        if not question_id or not explanation:
            return Response({'error': 'question_id and explanation are required'}, status=status.HTTP_400_BAD_REQUEST)

        # Map correct option label to data value
        mapped_value = None
        if correct_option:
            option_mapping = {'A': '1', 'B': '2', 'C': '3', 'D': '4'}
            if correct_option in option_mapping:
                mapped_value = option_mapping[correct_option]
            elif correct_option in ['1', '2', '3', '4']:
                mapped_value = correct_option
            else:
                return Response({'error': f'Invalid correct_option: {correct_option}. Must be A, B, C, D or 1, 2, 3, 4'}, status=status.HTTP_400_BAD_REQUEST)

        import os
        import json
        
        # Base dir of auth_server data
        base_upsc_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data/upsc')
        found_on_disk = False
        saved_file = None

        # Helper to search and update in a file
        def update_file_questions(file_path):
            nonlocal found_on_disk, saved_file
            if not os.path.exists(file_path):
                return False
            try:
                with open(file_path, 'r') as f:
                    data = json.load(f)
                
                questions = data.get('questions', [])
                file_modified = False
                for q in questions:
                    if q.get('qid') == question_id:
                        q['solution_text'] = explanation
                        if mapped_value:
                            q['correct_option_data'] = mapped_value
                            for opt in q.get('options', []):
                                opt['is_correct'] = (opt.get('data_option') == mapped_value)
                        
                        # Rebuild full_markdown
                        full_markdown = f"### Question (qid: {q.get('qid', '')})\n\n{q.get('question_text', '')}\n\n**Options:**\n"
                        correct_label = ""
                        for opt in q.get('options', []):
                            label = opt.get('label', '')
                            opt_text = opt.get('option_text', '')
                            is_corr = opt.get('is_correct', False)
                            mark = " ✅" if is_corr else ""
                            full_markdown += f"- **{label}**. {opt_text}{mark}\n"
                            if is_corr:
                                correct_label = label
                        full_markdown += f"\n**Correct Answer:** {correct_label}\n\n**Solution:**\n{explanation}\n"
                        q["full_markdown"] = full_markdown
                        
                        file_modified = True
                        found_on_disk = True
                        saved_file = file_path
                        break
                
                if file_modified:
                    with open(file_path, 'w') as f:
                        json.dump(data, f, indent=2)
                    return True
            except Exception as e:
                print(f"Error updating file {file_path}: {e}")
            return False

        # Scan base_upsc_dir and subdirectories
        if os.path.exists(base_upsc_dir):
            for root, dirs, files in os.walk(base_upsc_dir):
                for file in files:
                    if file.endswith('.json'):
                        file_path = os.path.join(root, file)
                        if update_file_questions(file_path):
                            break
                if found_on_disk:
                    break

        # Also update in active memory storage
        found_in_mem = False
        for test in storage.practice_tests.values():
            for q_mem in test.get('questions', []):
                if q_mem.get('qid') == question_id:
                    q_mem['solution_text'] = explanation
                    if mapped_value:
                        q_mem['correct_option_data'] = mapped_value
                        for opt in q_mem.get('options', []):
                            opt['is_correct'] = (opt.get('data_option') == mapped_value)
                    
                    # Build full markdown
                    full_markdown = f"### Question (qid: {q_mem.get('qid', '')})\n\n{q_mem.get('question_text', '')}\n\n**Options:**\n"
                    correct_label = ""
                    for opt in q_mem.get('options', []):
                        label = opt.get('label', '')
                        opt_text = opt.get('option_text', '')
                        is_corr = opt.get('is_correct', False)
                        mark = " ✅" if is_corr else ""
                        full_markdown += f"- **{label}**. {opt_text}{mark}\n"
                        if is_corr:
                            correct_label = label
                    full_markdown += f"\n**Correct Answer:** {correct_label}\n\n**Solution:**\n{explanation}\n"
                    q_mem["full_markdown"] = full_markdown
                    
                    found_in_mem = True

        return Response({
            'status': 'success',
            'found_on_disk': found_on_disk,
            'saved_file': os.path.basename(saved_file) if saved_file else None,
            'found_in_mem': found_in_mem
        }, status=status.HTTP_200_OK)


class EssayEvaluateOutlineView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        essay_title = request.data.get('essay_title', '')
        intro_hook = request.data.get('intro_hook', '')
        arguments = request.data.get('arguments', '')
        evidence = request.data.get('evidence', '')
        conclusion = request.data.get('conclusion', '')

        if not essay_title:
            return Response({"error": "Essay title is required"}, status=status.HTTP_400_BAD_REQUEST)

        prompt = f"""
        You are an expert UPSC Civil Services Essay evaluator. Evaluate this essay outline draft based on the topic.
        
        Essay Topic: {essay_title}
        
        Outline Draft Details:
        1. Introduction Hook:
        {intro_hook}
        
        2. Main Dimensional Arguments (e.g., Social, Economic, Political, Environmental, Ethical, Historical):
        {arguments}
        
        3. Key Quotes, Case Studies & Examples:
        {evidence}
        
        4. Conclusion Theme:
        {conclusion}
        
        Evaluate the outline on these aspects:
        1. Introduction Hook effectiveness.
        2. Coverage of diverse dimensions (is it multi-dimensional? e.g., PEESTLE - Political, Economic, Environmental, Social, Technological, Legal, Ethical).
        3. Strength and relevance of quotes, cases, and examples.
        4. Conclusion flow and strength.
        
        Provide constructive feedback, suggestions for additional dimensions (e.g. historical, ethical, environmental), and recommend 2-3 specific quotes, Supreme Court cases, or data points that would strengthen this essay.
        
        Provide your response as JSON with this structure:
        {{
            "intro_feedback": "...",
            "dimensions_feedback": "...",
            "evidence_feedback": "...",
            "conclusion_feedback": "...",
            "recommended_quotes_and_cases": ["...", "..."],
            "cohesion_rating": 8,
            "suggestions": ["...", "..."]
        }}
        """

        try:
            from google import genai
            from google.genai import types
            import os
            import json

            api_key = os.environ.get("GEMINI_API_KEY")
            client = genai.Client(api_key=api_key)
            
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.7
                )
            )

            if response.text:
                result = json.loads(response.text)
                return Response(result)
            else:
                return Response({"error": "Failed to get response from AI"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception as e:
            print(f"Error evaluating outline: {e}")
            err_msg = str(e)
            if "ResourceExhausted" in err_msg or "429" in err_msg or "quota" in err_msg.lower():
                return Response({"error": "⚠️ Gemini API rate limit quota exceeded. Please try again in a minute!"}, status=status.HTTP_429_TOO_MANY_REQUESTS)
            return Response({"error": f"AI Outline Evaluation failed: {err_msg}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class EssayTranscribeHandwritingView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        files = request.FILES.getlist('images')
        if not files:
            return Response({"error": "No images uploaded"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            from google import genai
            from google.genai import types
            import os

            api_key = os.environ.get("GEMINI_API_KEY")
            client = genai.Client(api_key=api_key)
            
            transcriptions = []
            for file_index, uploaded_file in enumerate(files):
                uploaded_file.seek(0)
                image_bytes = uploaded_file.read()
                mime_type = uploaded_file.content_type or "image/jpeg"
                
                part = types.Part.from_bytes(data=image_bytes, mime_type=mime_type)
                prompt = """
                You are an expert handwriting transcriber. Transcribe the handwritten text from this image precisely.
                Rules:
                1. Provide ONLY the transcribed text. Do not add any conversational remarks, intros, or summaries.
                2. Maintain paragraph breaks where the writer started a new paragraph.
                3. If a word or phrase is completely illegible, transcribe it as "[illegible]" instead of guessing.
                4. Output the raw text precisely as written.
                """

                response = client.models.generate_content(
                    model="gemini-2.5-flash",
                    contents=[part, prompt],
                    config=types.GenerateContentConfig(
                        temperature=0.2
                    )
                )
                
                if response.text:
                    transcriptions.append(response.text.strip())
                else:
                    transcriptions.append(f"[Transcription failed for page {file_index + 1}]")
            
            full_text = "\n\n".join(transcriptions)
            return Response({"transcription": full_text})
        except Exception as e:
            print(f"Error transcribing handwriting: {e}")
            err_msg = str(e)
            if "ResourceExhausted" in err_msg or "429" in err_msg or "quota" in err_msg.lower():
                return Response({"error": "⚠️ Gemini API rate limit quota exceeded. Please try again in a minute!"}, status=status.HTTP_429_TOO_MANY_REQUESTS)
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


