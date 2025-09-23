from django.http import JsonResponse
from .storage import storage
import json
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required
import uuid

def courses(request):
    exam_type = request.GET.get('examType')
    if exam_type:
        data = storage.get_courses_by_exam_type(exam_type)
    else:
        data = storage.get_courses()
    return JsonResponse(data, safe=False)

def course_detail(request, course_id):
    data = storage.get_course(course_id)
    if data:
        return JsonResponse(data)
    else:
        return JsonResponse({"error": "Course not found"}, status=404)

def study_materials(request):
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
    data = storage.get_study_material(material_id)
    if data:
        return JsonResponse(data)
    else:
        return JsonResponse({"error": "Study material not found"}, status=404)

def practice_tests(request):
    exam_type = request.GET.get('examType')
    if exam_type:
        data = storage.get_practice_tests_by_exam_type(exam_type)
    else:
        data = storage.get_practice_tests()
    return JsonResponse(data, safe=False)

def practice_test_detail(request, test_id):
    data = storage.get_practice_test(test_id)
    if data:
        return JsonResponse(data)
    else:
        return JsonResponse({"error": "Practice test not found"}, status=404)

def mock_tests(request):
    data = storage.get_mock_tests()
    return JsonResponse(data, safe=False)

def mock_test_detail(request, test_id):
    data = storage.get_mock_test(test_id)
    if data:
        return JsonResponse(data)
    else:
        return JsonResponse({"error": "Mock test not found"}, status=404)

def sectional_tests(request):
    data = storage.get_sectional_tests()
    return JsonResponse(data, safe=False)

def sectional_test_detail(request, test_id):
    data = storage.get_sectional_test(test_id)
    if data:
        return JsonResponse(data)
    else:
        return JsonResponse({"error": "Sectional test not found"}, status=404)

def sectional_test_section(request, test_id, section):
    # The logic for getting a section of a sectional test might need to be adjusted
    # based on how the data is structured and identified.
    data = storage.get_sectional_test_section(test_id, section)
    if data:
        return JsonResponse(data)
    else:
        return JsonResponse({"error": "Sectional test section not found"}, status=404)

@csrf_exempt
def test_sessions(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        session = storage.create_test_session(data)
        return JsonResponse(session, status=201)
    else:
        return JsonResponse({"error": "Method not allowed"}, status=405)

@csrf_exempt
def test_session_detail(request, session_id):
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
    sessions = storage.get_test_sessions_by_user(user_id)
    return JsonResponse(sessions, safe=False)

def user_progress(request, user_id):
    progress = storage.get_user_progress(user_id)
    return JsonResponse(progress, safe=False)

def user_progress_by_course(request, user_id, course_id):
    progress = storage.get_user_progress_by_course(user_id, course_id)
    if progress:
        return JsonResponse(progress)
    else:
        return JsonResponse({"error": "Progress not found"}, status=404)

@csrf_exempt
def add_question_view(request):
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
