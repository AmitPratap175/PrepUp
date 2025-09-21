from django.test import TestCase, Client
from django.urls import reverse

class APITestCase(TestCase):
    def setUp(self):
        self.client = Client()

    def test_get_courses(self):
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
        url = '/api/study-materials/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIsInstance(data, list)
        self.assertGreater(len(data), 0)

    def test_get_study_material_detail(self):
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
        url = '/api/practice-tests/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIsInstance(data, list)
        self.assertGreater(len(data), 0)

    def test_get_practice_test_detail(self):
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
        url = '/api/mock-tests/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIsInstance(data, list)
        self.assertGreater(len(data), 0)

    def test_get_mock_test_detail(self):
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
        url = '/api/sectional-tests/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIsInstance(data, list)
        self.assertGreater(len(data), 0)

    def test_get_sectional_test_detail(self):
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
