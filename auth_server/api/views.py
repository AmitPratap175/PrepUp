from django.http import JsonResponse
from .storage import storage
import json
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
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
from adrf.views import APIView as AsyncAPIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .chatbot_service import invoke_agent
from rest_framework import status
from .models import TestSession, UserQuizState, UserQuizGoal, UserQuizProgress
from datetime import datetime, timezone
from .models import TestSession, UserQuizState, UserQuizGoal, UserQuizProgress
from datetime import datetime, timezone
from .storage import storage
from .services.question_generator import QuestionGenerator

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

        goals_qs = UserQuizGoal.objects.filter(user=user)
        goals_dict = {goal.subject: goal.goal for goal in goals_qs}

        progress_qs = UserQuizProgress.objects.filter(user=user, date=today)
        progress_dict = {p.subject: p.questions_attempted for p in progress_qs}

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

class PerformanceAnalyticsView(AsyncAPIView):
    """
    Returns detailed performance analytics for the authenticated user.
    """
    permission_classes = [IsAuthenticated]

    async def get(self, request):
        """
        Get detailed analytics including:
        - Topic-wise performance
        - Accuracy over time
        - Streak history
        - Recent activity
        """
        user = request.user
        
        # Get all test sessions for the user
        test_sessions = TestSession.objects.filter(user=user).order_by('-created_at')[:30]
        
        # Calculate topic-wise performance
        topic_performance = {}
        accuracy_over_time = []
        
        for session in test_sessions:
            # Topic performance (simplified - would need actual question data)
            test_type = session.test_type
            if test_type not in topic_performance:
                topic_performance[test_type] = {
                    'total_questions': 0,
                    'correct_answers': 0,
                    'accuracy': 0
                }
            
            topic_performance[test_type]['total_questions'] += session.total_questions
            topic_performance[test_type]['correct_answers'] += session.correct_answers
            
            # Accuracy over time
            accuracy = (session.correct_answers / session.total_questions * 100) if session.total_questions > 0 else 0
            accuracy_over_time.append({
                'date': session.created_at.strftime('%Y-%m-%d'),
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
                'minutes_studied': day.minutes_studied
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
            session = TestSession.objects.get(id=session_id, user=request.user)
        except TestSession.DoesNotExist:
            return Response(
                {'error': 'Session not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get all user answers for this session
        user_answers = UserAnswer.objects.filter(session=session).order_by('id')
        
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
    permission_classes = [IsAuthenticated]

    async def post(self, request):
        """
        Generate essay topics for a specific domain.
        """
        from api.services.essay_topic_generator import EssayTopicGenerator
        from api.models import EssayTopic
        
        domain = request.data.get('domain')
        count = request.data.get('count', 3)
        
        if not domain:
            return Response(
                {'error': 'domain is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        generator = EssayTopicGenerator()
        topics_data = await generator.research_current_topics(domain, count)
        
        # Save topics to database
        created_topics = []
        for topic_data in topics_data:
            topic = EssayTopic.objects.create(
                title=topic_data.get('title', ''),
                description=topic_data.get('description', ''),
                domain=domain,
                difficulty=topic_data.get('difficulty', 'medium'),
                context=topic_data.get('context', ''),
                key_points=topic_data.get('key_points', [])
            )
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
    permission_classes = [IsAuthenticated]

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


class EssayListCreateView(APIView):
    """
    List user's essays or create new essay.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Get user's essays.
        """
        from api.models import Essay
        
        status_filter = request.query_params.get('status')
        
        essays = Essay.objects.filter(user=request.user)
        
        if status_filter:
            essays = essays.filter(status=status_filter)
        
        essays = essays[:50]
        
        essays_data = []
        for essay in essays:
            essays_data.append({
                'id': str(essay.id),
                'title': essay.title,
                'topic_id': str(essay.topic.id) if essay.topic else None,
                'topic_title': essay.topic.title if essay.topic else None,
                'word_count': essay.word_count,
                'time_spent': essay.time_spent,
                'status': essay.status,
                'created_at': essay.created_at.isoformat(),
                'updated_at': essay.updated_at.isoformat(),
                'submitted_at': essay.submitted_at.isoformat() if essay.submitted_at else None
            })
        
        return Response({'essays': essays_data})

    def post(self, request):
        """
        Create new essay.
        """
        from api.models import Essay, EssayTopic
        
        title = request.data.get('title')
        topic_id = request.data.get('topic_id')
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
        
        essay = Essay.objects.create(
            user=request.user,
            topic=topic,
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
    permission_classes = [IsAuthenticated]

    def get(self, request, essay_id):
        """
        Get essay details.
        """
        from api.models import Essay
        
        try:
            essay = Essay.objects.get(id=essay_id, user=request.user)
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
            essay = Essay.objects.get(id=essay_id, user=request.user)
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
    permission_classes = [IsAuthenticated]

    async def post(self, request, essay_id):
        """
        Submit essay and trigger LLM review.
        """
        from api.models import Essay
        from api.tasks import review_essay
        from django.utils import timezone
        
        try:
            essay = Essay.objects.get(id=essay_id, user=request.user)
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
        essay.save()
        
        # Trigger async review
        review_essay.delay(str(essay.id))
        
        return Response({
            'message': 'Essay submitted for review',
            'essay_id': str(essay.id)
        })


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
