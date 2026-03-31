import json
from pathlib import Path
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings
from rest_framework.permissions import AllowAny

class NcertTopicwiseQuizView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    
    """
    Serves the static ncert topicwise quiz data from auth_server/data/ncert_*_quiz.json.
    Reads all available ncert subject files and combines them into one array.
    """
    def get(self, request):
        data_dir = Path(settings.BASE_DIR) / "data"
        combined_data = []

        try:
            # Find all json files starting with ncert_ and ending with _quiz.json
            ncert_files = list(data_dir.glob("ncert_*_quiz.json"))
            
            for file_path in ncert_files:
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        file_data = json.load(f)
                        if isinstance(file_data, list):
                            combined_data.extend(file_data)
                        elif isinstance(file_data, dict):
                            combined_data.append(file_data)
                except json.JSONDecodeError as e:
                    print(f"JSON Error in {file_path}: {e}")
                    # Continue loading other files even if one fails
                except Exception as e:
                    print(f"Error loading {file_path}: {e}")
            
            return Response(combined_data)
                
        except Exception as e:
            print(f"Error aggregating NCERT quizzes: {e}")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
