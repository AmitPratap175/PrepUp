import json
from pathlib import Path
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings

from rest_framework.permissions import AllowAny

class ChapterwiseQuizView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    """
    Serves the static chapterwise quiz data from auth_server/data/quiz.json.
    """
    def get(self, request):
        file_path = Path(settings.BASE_DIR) / "data" / "quiz.json"
        
        if not file_path.exists():
            return Response({"error": "Chapterwise quiz data not found"}, status=status.HTTP_404_NOT_FOUND)

        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            return Response(data)
        except json.JSONDecodeError as e:
            print(f"JSON Error in {file_path}: {e}")
            return Response({"error": "Invalid JSON format in quiz file"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception as e:
            print(f"Error loading {file_path}: {e}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
