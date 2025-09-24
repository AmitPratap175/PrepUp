from django.test import TestCase, Client
from django.contrib.auth import get_user_model
import json
import os

class AddQuestionAPITest(TestCase):
    """
    Test suite for the 'add question' API endpoint.

    This class tests the functionality of the endpoint responsible for adding
    new questions to the data files, including success scenarios for
    authenticated users and failure scenarios for unauthenticated requests.
    """
    def setUp(self):
        """
        Sets up the test environment before each test.

        This method creates a test user, logs them in, and prepares a
        temporary data file for the test questions.
        """
        self.client = Client()
        self.user = get_user_model().objects.create_user(
            email='testuser@example.com',
            password='testpassword'
        )
        self.client.login(email='testuser@example.com', password='testpassword')
        self.test_file_path = 'auth_server/data/cat/test-subject.json'

        # Ensure the directory exists
        os.makedirs(os.path.dirname(self.test_file_path), exist_ok=True)

        # Create a dummy file for testing
        with open(self.test_file_path, 'w') as f:
            json.dump({"questions": []}, f)

    def tearDown(self):
        """
        Cleans up the test environment after each test.

        This method removes the temporary data file created during setup.
        """
        # Clean up the dummy file
        if os.path.exists(self.test_file_path):
            os.remove(self.test_file_path)

    def test_add_question_success(self):
        """
        Tests successful question creation by an authenticated user.

        Verifies that a POST request with valid data to the 'add' endpoint
        returns a 201 status code and correctly adds the question to the
        data file.
        """
        question_data = {
            "passage_text": "This is a test passage.",
            "question_text": "This is a test question?",
            "options": [
                {"option_text": "A", "is_correct": True},
                {"option_text": "B", "is_correct": False},
            ],
            "solution_text": "This is the solution."
        }

        response = self.client.post('/api/questions/add/', json.dumps({
            "examType": "cat",
            "subject": "test-subject",
            "question": question_data
        }), content_type='application/json')

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()['message'], 'Question added successfully')

        # Verify the file content
        with open(self.test_file_path, 'r') as f:
            data = json.load(f)
            self.assertEqual(len(data['questions']), 1)
            self.assertEqual(data['questions'][0]['question_text'], "This is a test question?")

    def test_add_question_unauthenticated(self):
        """
        Tests that an unauthenticated user cannot add a question.

        Verifies that a POST request from a logged-out client is redirected
        (returns a 302 status code), preventing unauthorized access.
        """
        self.client.logout()
        response = self.client.post('/api/questions/add/', '{}', content_type='application/json')
        # Expecting a redirect to login page, so 302
        self.assertEqual(response.status_code, 302)
