from django.contrib.auth import get_user_model
from django.urls import reverse
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
        url = reverse('login')
        data = {
            'email': self.user_data['email'],
            'password': self.user_data['password'],
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('token', response.data)
        self.assertTrue(Token.objects.filter(user=self.user).exists())

    def test_logout(self):
        """
        Test the logout view to ensure a user can log out and their token is deleted.
        """
        # First, log in the user to get a token
        token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + token.key)

        # Now, log out
        url = reverse('logout')
        response = self.client.post(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Token.objects.filter(user=self.user).exists())
