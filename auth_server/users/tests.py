from unittest.mock import patch
from django.contrib.auth import get_user_model
from django.urls import reverse
from allauth.socialaccount.models import SocialApp, SocialAccount
from allauth.socialaccount.helpers import complete_social_login
from allauth.socialaccount.adapter import DefaultSocialAccountAdapter
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework.authtoken.models import Token

User = get_user_model()

class AuthTests(APITestCase):
    """
    Test cases for the authentication views (Signup, Login, Logout).
    """

    def setUp(self):
        """
        Set up the test data.
        """
        self.user_data = {
            'name': 'Test User',
            'email': 'test@example.com',
            'password': 'testpassword123',
            'exam_type': 'cat',
        }
        self.user = User.objects.create_user(**self.user_data)

    def test_signup(self):
        """
        Test the signup view to ensure a new user can be created.
        """
        url = reverse('signup')
        data = {
            'name': 'New User',
            'email': 'newuser@example.com',
            'password': 'newpassword123',
            'exam_type': 'gate',
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(User.objects.count(), 2)
        self.assertEqual(User.objects.latest('date_joined').email, 'newuser@example.com')

    def test_login(self):
        """
        Test the login view to ensure a user can log in and get a token.
        """
        url = reverse('rest_login')
        data = {
            'email': self.user_data['email'],
            'password': self.user_data['password'],
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)

    def test_logout(self):
        """
        Test the logout view to ensure a user can log out.
        """
        # First, log in the user
        self.client.login(email=self.user_data['email'], password=self.user_data['password'])

        # Now, log out
        url = reverse('rest_logout')
        response = self.client.post(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class GoogleLoginTests(APITestCase):
    """
    Test cases for the dj-rest-auth Google login view.
    """

    def setUp(self):
        """
        Set up the test data.
        """
        self.app = SocialApp.objects.create(provider='google', name='Google', client_id='123', secret='456')

    @patch('allauth.socialaccount.providers.oauth2.client.OAuth2Client.get_access_token')
    @patch('requests.get')
    def test_google_login(self, mock_requests_get, mock_get_access_token):
        """
        Test the Google login view with a mocked get_access_token call.
        """
        # Mock the access token and user info responses
        mock_get_access_token.return_value = {
            'access_token': 'fake_access_token',
            'expires_in': 3600,
        }
        mock_response = mock_requests_get.return_value
        mock_response.raise_for_status.return_value = None
        mock_response.json.return_value = {
            'email': 'googleuser@example.com',
            'name': 'Google User',
            'sub': '1234567890',
        }

        url = reverse('google_login')
        data = {'access_token': 'fake_google_token'}
        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('key', response.data)

        # Check that a new user and social account were created
        self.assertTrue(User.objects.filter(email='googleuser@example.com').exists())
        user = User.objects.get(email='googleuser@example.com')
        self.assertTrue(SocialAccount.objects.filter(user=user, provider='google').exists())
