from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from rest_framework.authtoken.models import Token
from django.urls import reverse
import json
from unittest.mock import patch, AsyncMock, MagicMock
from asgiref.sync import async_to_sync

from langchain_core.messages import AIMessage

User = get_user_model()

class ChatbotAPITestCase(APITestCase):
    """
    Test suite for the chatbot API endpoint.
    """
    def setUp(self):
        """Initializes the test client and authenticates a user."""
        self.user = User.objects.create_user(email='test@example.com', password='testpassword', name='Test User', exam_type='cat')
        self.token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.token.key)

    @patch('api.chatbot.graph.utils.chains.get_chat_model')
    def test_chatbot_view_post(self, mock_get_chat_model):
        """
        Tests the chatbot endpoint with a POST request.
        """
        # Configure the mock
        mock_model = MagicMock()
        aimsg = AIMessage(content="This is a mock reply.")
        mock_model.bind_tools.return_value = mock_model
        mock_model.invoke.return_value = aimsg
        mock_model.return_value = aimsg
        mock_get_chat_model.return_value = mock_model

        url = reverse('chatbot')

        data = {'message': 'How do I create an account?'}
        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, 200)
        response_data = response.json()
        self.assertIn('reply', response_data)
        self.assertEqual(response_data['reply'], "This is a mock reply.")

    def test_chatbot_view_get(self):
        """
        Tests that the chatbot endpoint only accepts POST requests.
        """
        url = reverse('chatbot')

        response = self.client.get(url)
        self.assertEqual(response.status_code, 405)

    def test_chatbot_view_invalid_json(self):
        """
        Tests the chatbot endpoint with invalid JSON.
        """
        url = reverse('chatbot')

        data = 'not a valid json'
        response = self.client.post(url, data, content_type='application/json')
        self.assertEqual(response.status_code, 400)
        response_data = response.json()
        self.assertIn('detail', response_data)
        self.assertIn('JSON parse error', response_data['detail'])