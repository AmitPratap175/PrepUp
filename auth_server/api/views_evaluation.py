import json
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .models import OptionalEvaluationSession, OptionalEvaluationQuestion
from .tasks import process_math_evaluation_task

class MathEvaluationUploadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        file = request.FILES.get('file')
        if not file:
            return Response({'error': 'No file uploaded'}, status=status.HTTP_400_BAD_REQUEST)

        # Create session
        session = OptionalEvaluationSession.objects.create(
            user=request.user,
            subject='mathematics',
            uploaded_file=file,
            status='pending'
        )

        # Trigger async celery task
        process_math_evaluation_task.delay(str(session.id))

        return Response({
            'message': 'File uploaded successfully. Evaluation is in progress.',
            'session_id': str(session.id)
        }, status=status.HTTP_201_CREATED)

class MathEvaluationDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, session_id):
        try:
            session = OptionalEvaluationSession.objects.get(id=session_id, user=request.user)
            questions = session.evaluated_questions.all()
            
            questions_data = [
                {
                    'question_number': q.question_number,
                    'extracted_question_text': q.extracted_question_text,
                    'topic': q.topic,
                    'marks_obtained': q.marks_obtained,
                    'max_marks': q.max_marks,
                    'feedback': q.feedback
                } for q in questions
            ]

            return Response({
                'id': str(session.id),
                'status': session.status,
                'total_score': session.total_score,
                'max_score': session.max_score,
                'overall_feedback': session.overall_feedback,
                'gemini_insights': session.gemini_insights,
                'questions': questions_data,
                'file_url': session.uploaded_file.url if session.uploaded_file else None,
                'created_at': session.created_at
            })
        except OptionalEvaluationSession.DoesNotExist:
            return Response({'error': 'Evaluation session not found'}, status=status.HTTP_404_NOT_FOUND)

class MathEvaluationsListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        sessions = OptionalEvaluationSession.objects.filter(user=request.user).order_by('-created_at')
        data = [
            {
                'id': str(s.id),
                'status': s.status,
                'total_score': s.total_score,
                'max_score': s.max_score,
                'created_at': s.created_at
            } for s in sessions
        ]
        return Response({'evaluations': data})
