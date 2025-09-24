from django.test import TestCase, Client
from django.urls import reverse

class APITestCase(TestCase):
    """
    Test suite for the main API endpoints.

    This class contains tests for verifying the functionality of the various
    'GET' endpoints that serve course, study material, and test data.
    """
    def setUp(self):
        """Initializes the test client before each test."""
        self.client = Client()

    def test_get_courses(self):
        """Tests the endpoint for retrieving all courses."""
        # Since the API is now under /api/, we need to make sure the reverse function
        # generates the correct URL. The name 'courses' is defined in api/urls.py.
        # The full path will be /api/courses/.
        # We need to make sure the test runner can resolve this.
        # The ROOT_URLCONF is 'auth_project.urls', which includes 'api.urls' under 'api/'.
        # So, we should be able to reverse the url name.
        # However, the urls are not namespaced, so we can just use the name.
        # Let's try to reverse it. If it fails, we'll hardcode the path.
        try:
            url = reverse('courses')
        except:
            url = '/api/courses/'

        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIsInstance(data, list)
        self.assertGreater(len(data), 0)

    def test_get_course_detail(self):
        """Tests the endpoint for retrieving a single course's details."""
        # First, get all courses to have a valid id
        try:
            url = reverse('courses')
        except:
            url = '/api/courses/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        courses = response.json()
        self.assertGreater(len(courses), 0)

        course_id = courses[0]['id']
        try:
            url = reverse('course_detail', args=[course_id])
        except:
            url = f'/api/courses/{course_id}/'

        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['id'], course_id)

    def test_get_study_materials(self):
        """Tests the endpoint for retrieving all study materials."""
        url = '/api/study-materials/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIsInstance(data, list)
        self.assertGreater(len(data), 0)

    def test_get_study_material_detail(self):
        """Tests the endpoint for retrieving a single study material's details."""
        response = self.client.get('/api/study-materials/')
        self.assertEqual(response.status_code, 200)
        materials = response.json()
        self.assertGreater(len(materials), 0)

        material_id = materials[0]['id']
        url = f'/api/study-materials/{material_id}/'

        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['id'], material_id)

    def test_get_practice_tests(self):
        """Tests the endpoint for retrieving all practice tests."""
        url = '/api/practice-tests/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIsInstance(data, list)
        self.assertGreater(len(data), 0)

    def test_get_practice_test_detail(self):
        """Tests the endpoint for retrieving a single practice test's details."""
        response = self.client.get('/api/practice-tests/')
        self.assertEqual(response.status_code, 200)
        tests = response.json()
        self.assertGreater(len(tests), 0)

        test_id = tests[0]['id']
        url = f'/api/practice-tests/{test_id}/'

        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['id'], test_id)

    def test_get_mock_tests(self):
        """Tests the endpoint for retrieving all mock tests."""
        url = '/api/mock-tests/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIsInstance(data, list)
        self.assertGreater(len(data), 0)

    def test_get_mock_test_detail(self):
        """Tests the endpoint for retrieving a single mock test's details."""
        response = self.client.get('/api/mock-tests/')
        self.assertEqual(response.status_code, 200)
        tests = response.json()
        self.assertGreater(len(tests), 0)

        test_id = tests[0]['id']
        url = f'/api/mock-tests/{test_id}/'

        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['id'], test_id)

    def test_get_sectional_tests(self):
        """Tests the endpoint for retrieving all sectional tests."""
        url = '/api/sectional-tests/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIsInstance(data, list)
        self.assertGreater(len(data), 0)

    def test_get_sectional_test_detail(self):
        """Tests the endpoint for retrieving a single sectional test's details."""
        response = self.client.get('/api/sectional-tests/')
        self.assertEqual(response.status_code, 200)
        tests = response.json()
        self.assertGreater(len(tests), 0)

        test_id = tests[0]['id']
        url = f'/api/sectional-tests/{test_id}/'

        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['id'], test_id)
