from django.test import TestCase, Client
from django.urls import reverse
import json
from unittest.mock import patch

class ChatbotAPITestCase(TestCase):
    """
    Test suite for the chatbot API endpoint.
    """
    def setUp(self):
        """Initializes the test client before each test."""
        self.client = Client()

    @patch('auth_server.api.views.chatbot_instance')
    def test_chatbot_view_post(self, mock_chatbot_instance):
        """
        Tests the chatbot endpoint with a POST request.
        """
        # Configure the mock
        mock_chatbot_instance.get_answer.return_value = "This is a mock reply."

        url = reverse('chatbot')

        data = {'message': 'How do I create an account?'}
        response = self.client.post(url, json.dumps(data), content_type='application/json')

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
        self.assertIn('error', response_data)
        self.assertEqual(response_data['error'], 'Invalid JSON')