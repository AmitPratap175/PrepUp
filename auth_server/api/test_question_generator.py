import os
import django
from django.conf import settings

if not settings.configured:
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "auth_project.settings")
    django.setup()

from django.test import TestCase
from unittest.mock import patch, MagicMock
from rest_framework.test import APIClient
from rest_framework import status
from users.models import User
from api.services.question_generator import QuestionGenerator


class QuestionGeneratorTests(TestCase):
    @patch('api.services.question_generator.genai.Client')
    def test_generate_questions_service(self, mock_client_class):
        # Mock the Gemini client and response
        mock_client = mock_client_class.return_value
        mock_response = MagicMock()
        mock_response.text = '''
        [
            {
                "qid": "q1",
                "text": "What is 2+2?",
                "options": [
                    { "id": "a", "text": "3", "data_option": "a", "is_correct": false },
                    { "id": "b", "text": "4", "data_option": "b", "is_correct": true }
                ],
                "explanation": "Math."
            }
        ]
        '''
        mock_client.models.generate_content.return_value = mock_response

        generator = QuestionGenerator()
        questions = generator.generate_questions("CAT", "Quant", "Algebra", "Easy", 1)

        self.assertEqual(len(questions), 1)
        self.assertEqual(questions[0]['qid'], 'q1')
        self.assertEqual(questions[0]['text'], 'What is 2+2?')

    @patch('api.services.question_generator.genai.Client')
    def test_generate_questions_api(self, mock_client_class):
        # Setup user and client
        user = User.objects.create_user(email='test@example.com', password='password')
        client = APIClient()
        client.force_authenticate(user=user)

        # Mock the Gemini client and response
        mock_client = mock_client_class.return_value
        mock_response = MagicMock()
        mock_response.text = '''
        [
            {
                "qid": "q1",
                "text": "Generated Question",
                "options": [],
                "explanation": "Exp"
            }
        ]
        '''
        mock_client.models.generate_content.return_value = mock_response

        data = {
            "examType": "CAT",
            "subject": "Quant",
            "topic": "Algebra",
            "difficulty": "Easy",
            "count": 1
        }

        response = client.post('/api/generate-questions/', data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['text'], 'Generated Question')

    def test_generate_questions_api_missing_fields(self):
        user = User.objects.create_user(email='test2@example.com', password='password')
        client = APIClient()
        client.force_authenticate(user=user)

        data = {
            "examType": "CAT"
            # Missing other fields
        }

        response = client.post('/api/generate-questions/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
