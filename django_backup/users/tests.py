from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework.authtoken.models import Token

User = get_user_model()

class AuthTests(APITestCase):
    """
    Test suite for the authentication-related views.

    This class contains tests for the signup, login, and logout
    functionalities, ensuring that user registration, session management,
    and token handling work as expected.
    """

    def setUp(self):
        """
        Prepares the necessary data for the authentication tests.

        This method creates a standard user instance that can be used for
        testing login and logout scenarios.
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
        Ensures that a new user can successfully register.

        This test sends a POST request to the signup endpoint with valid
        new user data and verifies that the user is created in the database
        and a 201 Created response is returned.
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
        Verifies that a registered user can log in and receive an auth token.

        This test sends a POST request with correct credentials to the login
        endpoint and checks for a 200 OK response containing an auth token.
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
        Checks that an authenticated user can log out successfully.

        This test authenticates a user, then sends a POST request to the
        logout endpoint. It verifies that the user's auth token is deleted
        and a 204 No Content response is returned.
        """
        # First, log in the user to get a token
        token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + token.key)

        # Now, log out
        url = reverse('logout')
        response = self.client.post(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Token.objects.filter(user=self.user).exists())
