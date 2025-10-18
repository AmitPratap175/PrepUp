from rest_framework.test import APITestCase
from django.urls import reverse
from unittest.mock import patch
from django.contrib.auth import get_user_model
from rest_framework.authtoken.models import Token
import os
import json

os.environ['GEMINI_API_KEY'] = 'AIzaSyBSn6AmIf1OH1eTH5iuFpdPuXbd9FA_ZRo'

class DynamicToolsChatbotAPITestCase(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            email='test@example.com',
            password='testpassword',
            name='Test User'
        )
        self.token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.token.key)

    def test_get_bookmarks_tool(self):
        """
        Tests that the chatbot can use the get_bookmarks tool.
        """
        url = reverse('chatbot')
        data = {'message': 'What are my bookmarks?'}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, 200)

    def test_get_words_tool(self):
        """
        Tests that the chatbot can use the get_words tool.
        """
        url = reverse('chatbot')
        data = {'message': 'What are my saved words?'}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, 200)

    def test_create_bookmark_tool(self):
        """
        Tests that the chatbot can use the create_bookmark tool.
        """
        url = reverse('chatbot')
        message_data = {
            "tool": "create_bookmark",
            "subject": "test_subject",
            "question_id": "test_question_id"
        }
        data = {'message': json.dumps(message_data)}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, 200)