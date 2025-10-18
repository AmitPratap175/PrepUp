from rest_framework.test import APITestCase
from django.urls import reverse
from unittest.mock import patch
from django.contrib.auth import get_user_model
from rest_framework.authtoken.models import Token
import os

os.environ['GEMINI_API_KEY'] = 'AIzaSyBSn6AmIf1OH1eTH5iuFpdPuXbd9FA_ZRo'

class ChatbotAPITestCase(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            email='test@example.com',
            password='testpassword',
            name='Test User'
        )
        self.token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.token.key)

    def test_chatbot_view_post(self):
        """
        Tests the chatbot endpoint with a POST request.
        """
        url = reverse('chatbot')

        data = {'message': 'Hello, chatbot!'}
        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, 200)
        response_data = response.json()
        self.assertIn('reply', response_data)
        self.assertIsInstance(response_data['reply'], str)

    def test_chatbot_view_get(self):
        """
        Tests that the chatbot endpoint does not accept GET requests.
        """
        url = reverse('chatbot')
        response = self.client.get(url)
        self.assertEqual(response.status_code, 405)

    def test_chatbot_view_invalid_json(self):
        """
        Tests the chatbot endpoint with invalid JSON.
        """
        url = reverse('chatbot')
        response = self.client.post(url, 'invalid json', content_type='application/json')
        self.assertEqual(response.status_code, 400)