import os
import django
from django.conf import settings

if not settings.configured:
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "auth_project.settings")
    django.setup()

from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from users.models import User
from api.chatbot.tools.safe_tools import safe_tools_list

from rest_framework.authtoken.models import Token

class ChatbotToolsTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(email='test@example.com', password='password')
        self.token = Token.objects.create(user=self.user)
        self.client = APIClient()
        self.client.force_authenticate(user=self.user, token=self.token)

    def test_get_tools(self):
        response = self.client.get('/api/chatbot/tools/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('tools', response.data)
        self.assertTrue(len(response.data['tools']) > 0)
        
        # Check structure of a tool
        tool = response.data['tools'][0]
        self.assertIn('name', tool)
        self.assertIn('description', tool)
        self.assertIn('parameters', tool)

    def test_execute_tool_datetime(self):
        # Find the datetime tool name
        dt_tool = next(t for t in safe_tools_list if 'datetime' in t.name.lower())
        
        data = {
            "name": dt_tool.name,
            "arguments": {}
        }
        
        response = self.client.post('/api/chatbot/execute-tool/', data, format='json')
        if response.status_code != status.HTTP_200_OK:
            print(f"Error response: {response.data}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('result', response.data)
        # Result should be a date string
        self.assertIn('T', response.data['result'])

    def test_execute_tool_not_found(self):
        data = {
            "name": "non_existent_tool",
            "arguments": {}
        }
        response = self.client.post('/api/chatbot/execute-tool/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
