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

class ChatbotView(APIView):
    """
    Handles chatbot interactions for authenticated users.
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

        print(f"\n\nMessage received: {message}\n\n")

        # Call the synchronous invoke_agent function directly
        reply = invoke_agent(session_id=session_id, message=message)

        return Response({"reply": reply})
