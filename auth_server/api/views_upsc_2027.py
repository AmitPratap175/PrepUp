import os
import json
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

class UPSC2027TestsListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        include_questions = request.GET.get('include_questions', 'false').lower() == 'true'
        test_dir = os.path.join(settings.BASE_DIR, 'data', 'upsc', '2027_tests')
        tests = []
        if os.path.exists(test_dir):
            for filename in os.listdir(test_dir):
                if filename.endswith('.json'):
                    test_id = filename.replace('.json', '')
                    test_data = {
                        'id': test_id,
                        'title': test_id,
                        'subject': 'UPSC 2027 Prelims',
                        'duration': 120, # 120 minutes standard
                    }
                    if include_questions:
                        filepath = os.path.join(test_dir, filename)
                        with open(filepath, 'r', encoding='utf-8') as f:
                            data = json.load(f)
                            test_data['questions'] = data.get('questions', [])
                            test_data['totalQuestions'] = len(test_data['questions'])
                    tests.append(test_data)
        return Response(tests)

class UPSC2027TestDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, test_id):
        test_dir = os.path.join(settings.BASE_DIR, 'data', 'upsc', '2027_tests')
        filepath = os.path.join(test_dir, f"{test_id}.json")
        
        # Security check to prevent directory traversal
        if not os.path.abspath(filepath).startswith(os.path.abspath(test_dir)):
             return Response({"error": "Invalid test ID"}, status=400)
             
        if not os.path.exists(filepath):
            return Response({"error": "Test not found"}, status=404)
        
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        return Response({
            'id': test_id,
            'title': test_id,
            'subject': 'UPSC 2027 Prelims',
            'duration': 120,
            'questions': data.get('questions', [])
        })
