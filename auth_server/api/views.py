from django.http import JsonResponse
from .storage import storage
import json
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
import uuid

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
    Retrieves all mock tests.

    Args:
        request: The HttpRequest object.

    Returns:
        A JsonResponse containing a list of all mock test objects.
    """
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
    Retrieves all sectional tests.

    Args:
        request: The HttpRequest object.

    Returns:
        A JsonResponse containing a list of all sectional test objects.
    """
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
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .chatbot_service import invoke_agent
from rest_framework import status
from .models import TestSession, UserQuizState, UserQuizGoal
from datetime import datetime, timezone
from .storage import storage

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

        # Call the synchronous invoke_agent function directly
        reply = invoke_agent(session_id=session_id, message=message, token=token)

        return Response({"reply": reply})

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
            return Response({'id': str(session.id)}, status=status.HTTP_200_OK)
        except TestSession.DoesNotExist:
            return Response({'error': 'Test session not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
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

        goals = UserQuizGoal.objects.filter(user=user)

        subjects = storage.get_subjects()

        all_goals_data = []

        for subject in subjects:
            goal_obj = goals.filter(subject=subject).first()

            goal = goal_obj.goal if goal_obj else 0

            sessions_today = TestSession.objects.filter(
                user=user,
                subject=subject,
                start_time__date=today
            )

            questions_attempted = sum(sum(1 for answer in session.answers if answer.get('selectedAnswer') is not None) for session in sessions_today)
            print(f"Subject: {subject}, Goal: {goal}, Questions Attempted Today: {sessions_today.count()}")

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

class UserQuizStateView(APIView):
    """
    Handles getting and setting the user's last quiz state.

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
