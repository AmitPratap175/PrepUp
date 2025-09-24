from django.test import TestCase, Client, override_settings
from django.http import JsonResponse
from django.contrib.auth import get_user_model
from api.decorators import token_required
import jwt
from django.conf import settings
from unittest.mock import patch
import time

# A dummy view to be protected by the decorator
@token_required
def dummy_view(request):
    return JsonResponse({"message": "success"})

@override_settings(ROOT_URLCONF='api.test_urls')
class TokenRequiredDecoratorTest(TestCase):
    def setUp(self):
        self.client = Client()
        self.user = get_user_model().objects.create_user(
            email='testuser@example.com',
            password='testpassword'
        )

    def test_missing_authorization_header(self):
        response = self.client.get('/dummy-url/')
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.json()['error'], 'Authorization header missing')

    def test_expired_token(self):
        # Create an expired token
        payload = {
            'user_id': self.user.id,
            'exp': int(time.time()) - 1
        }
        token = jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')
        headers = {'HTTP_AUTHORIZATION': f'Bearer {token}'}
        response = self.client.get('/dummy-url/', **headers)
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.json()['error'], 'Token has expired')

    def test_invalid_token(self):
        headers = {'HTTP_AUTHORIZATION': 'Bearer invalidtoken'}
        response = self.client.get('/dummy-url/', **headers)
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.json()['error'], 'Invalid token')

    @patch('users.models.User.objects.get')
    def test_user_not_found(self, mock_get):
        mock_get.side_effect = get_user_model().DoesNotExist
        payload = {
            'user_id': 999,  # A user that does not exist
            'exp': int(time.time()) + 3600
        }
        token = jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')
        headers = {'HTTP_AUTHORIZATION': f'Bearer {token}'}
        response = self.client.get('/dummy-url/', **headers)
        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.json()['error'], 'User not found')

    def test_valid_token(self):
        payload = {
            'user_id': self.user.id,
            'exp': int(time.time()) + 3600
        }
        token = jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')
        headers = {'HTTP_AUTHORIZATION': f'Bearer {token}'}
        response = self.client.get('/dummy-url/', **headers)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['message'], 'success')