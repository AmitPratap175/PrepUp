import json
import os
from typing import Dict, List, Optional
import uuid
from .models import TestSession
from users.models import User

# Define data models as dictionaries or dataclasses
# These would be the Python equivalents of the TypeScript types

class MemStorage:
    """
    An in-memory storage solution for the application's data.

    This class simulates a database by loading data from JSON files into memory
    at startup. It provides methods for accessing and manipulating this data,
    covering courses, study materials, tests, user sessions, and progress.
    All data is reset on application restart.

    Attributes:
        base_dir (str): The base directory of the current file.
        users (Dict[str, Dict]): A dictionary to store user data.
        courses (Dict[str, Dict]): A dictionary to store course data.
        study_materials (Dict[str, Dict]): A dictionary for study materials.
        practice_tests (Dict[str, Dict]): A dictionary for practice tests.
        mock_tests (Dict[str, Dict]): A dictionary for mock tests.
        sectional_tests (Dict[str, Dict]): A dictionary for sectional tests.
        user_progress (Dict[str, Dict]): A dictionary for user progress.
    """
    def __init__(self):
        """Initializes the MemStorage instance and seeds it with initial data."""
        self.base_dir = os.path.dirname(os.path.abspath(__file__))
        self.users: Dict[str, Dict] = {}
        self.courses: Dict[str, Dict] = {}
        self.study_materials: Dict[str, Dict] = {}
        self.practice_tests: Dict[str, Dict] = {}
        self.mock_tests: Dict[str, Dict] = {}
        self.sectional_tests: Dict[str, Dict] = {}
        self.user_progress: Dict[str, Dict] = {}

        self.seed_data()

    def seed_data(self):
        """
        Loads initial data into the storage from predefined sources.

        This method populates the storage with course information, study
        materials, and various types of tests (practice, mock, sectional)
        by reading from hardcoded data and JSON files.
        """
        # Seed courses
        cat_course = {
            "id": str(uuid.uuid4()),
            "title": "CAT Preparation Course",
            "description": "Complete preparation for Common Admission Test with quantitative aptitude, verbal ability, and data interpretation.",
            "examType": "cat",
            "duration": "6 months comprehensive program",
            "price": 15999,
            "originalPrice": 25999,
            "features": ["200+ practice tests", "Expert mentorship", "Comprehensive study materials", "Mock interviews"],
            "imageUrl": "https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=400",
            "isPopular": True
        }

        gate_course = {
            "id": str(uuid.uuid4()),
            "title": "GATE Preparation Course",
            "description": "Comprehensive preparation for Graduate Aptitude Test in Engineering across all major branches.",
            "examType": "gate",
            "duration": "8 months intensive program",
            "price": 18999,
            "originalPrice": 28999,
            "features": ["300+ practice tests", "All engineering branches", "Expert guidance", "Live doubt sessions"],
            "imageUrl": "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=400",
            "isPopular": False
        }

        self.courses[cat_course["id"]] = cat_course
        self.courses[gate_course["id"]] = gate_course

        xat_course = {
            "id": str(uuid.uuid4()),
            "title": "XAT Preparation Course",
            "description": "Complete preparation for Xavier Aptitude Test with decision making, quantitative aptitude, and verbal ability.",
            "examType": "xat",
            "duration": "6 months comprehensive program",
            "price": 16999,
            "originalPrice": 26999,
            "features": ["150+ practice tests", "Decision Making special focus", "Essay writing evaluation", "Mock interviews"],
            "imageUrl": "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=400",
            "isPopular": False
        }
        self.courses[xat_course["id"]] = xat_course

        # Seed study materials
        materials = [
            {
                "id": str(uuid.uuid4()),
                "title": "Advanced Data Interpretation",
                "description": "Comprehensive guide covering all types of DI questions with detailed solutions and shortcuts.",
                "examType": "cat",
                "subject": "Quantitative",
                "type": "pdf",
                "pages": 120,
                "rating": 5,
                "reviewCount": 324,
                "isPremium": True,
                "downloadUrl": "https://github.com/AmitPratap175/CAT-Prep/raw/main/DILR.pdf",
                "imageUrl": "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&h=300"
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Digital Electronics Fundamentals",
                "description": "Essential concepts in digital electronics with practice problems and solutions.",
                "examType": "gate",
                "subject": "Electronics",
                "type": "pdf",
                "pages": 95,
                "rating": 5,
                "reviewCount": 198,
                "isPremium": False,
                "downloadUrl": "#",
                "imageUrl": "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&h=300"
            },
            {
                "id": str(uuid.uuid4()),
                "title": "Quick Math Formula Handbook",
                "description": "Essential formulas and shortcuts for quantitative aptitude section.",
                "examType": "cat",
                "subject": "Mathematics",
                "type": "pdf",
                "pages": 45,
                "rating": 5,
                "reviewCount": 512,
                "isPremium": True,
                "downloadUrl": "https://github.com/AmitPratap175/CAT-Prep/raw/main/Quants.pdf",
                "imageUrl": "https://images.unsplash.com/photo-1635372722656-389f87a941b7?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&h=300"
            }
        ]

        for material in materials:
            self.study_materials[material["id"]] = material

        # Seed practice tests from JSON files
        practice_tests_data = [
            {
                "title": "CAT Quantitative Aptitude Test",
                "examType": "cat",
                "subject": "Quantitative Aptitude",
                "duration": 90,
                "filePath": "data/cat/quantitative-aptitude.json"
            },
            {
                "title": "CAT Verbal Ability Test",
                "examType": "cat",
                "subject": "Verbal Ability",
                "duration": 60,
                "filePath": "data/cat/verbal-ability.json"
            },
            {
                "title": "CAT Data Interpretation Test",
                "examType": "cat",
                "subject": "Data Interpretation",
                "duration": 60,
                "filePath": "data/cat/data-interpretation.json"
            },
            {
                "title": "Quants CAT PYQs Test",
                "examType": "cat",
                "subject": "Quants",
                "duration": 90,
                "filePath": "data/cat/docs/quantitative-aptitude.json"
            },
            {
                "title": "VARC  CAT PYQs Test",
                "examType": "cat",
                "subject": "VARC",
                "duration": 60,
                "filePath": "data/cat/docs/verbal-ability.json"
            },
            {
                "title": "DILR CAT PYQs Test",
                "examType": "cat",
                "subject": "DILR",
                "duration": 120,
                "filePath": "data/cat/docs/data-interpretation.json"
            },
            {
                "title": "Vocabulary Test",
                "examType": "cat",
                "subject": "Vocabulary",
                "duration": 120,
                "filePath": "data/cat/docs/vocab.json"
            },
            {
                "title": "XAT Quantitative Aptitude Test",
                "examType": "xat",
                "subject": "Quantitative Aptitude",
                "duration": 90,
                "filePath": "data/xat/quant.json"
            },
            {
                "title": "XAT Verbal & Logical Reasoning Test",
                "examType": "xat",
                "subject": "Verbal & Logical Reasoning",
                "duration": 60,
                "filePath": "data/xat/valr.json"
            },
            {
                "title": "XAT Decision Making Test",
                "examType": "xat",
                "subject": "Decision Making",
                "duration": 60,
                "filePath": "data/xat/decision_making.json"
            },
            {
                "title": "XAT Essay Writing",
                "examType": "xat",
                "subject": "Essay",
                "duration": 30,
                "filePath": "data/xat/essay.json"
            },
            {
                "title": "XAT Static GK",
                "examType": "xat",
                "subject": "General Knowledge",
                "duration": 30,
                "filePath": "data/xat/static_gk.json"
            },
            {
                "title": "XAT Current Affairs",
                "examType": "xat",
                "subject": "General Knowledge",
                "duration": 30,
                "filePath": "data/xat/current_affairs_gk.json"
            }
        ]

        for test_data in practice_tests_data:
            questions = self._load_questions_from_file(os.path.join(self.base_dir, '..', test_data["filePath"]))
            if questions:
                practice_test = {
                    "id": str(uuid.uuid4()),
                    "title": test_data["title"],
                    "examType": test_data["examType"],
                    "subject": test_data["subject"],
                    "duration": test_data["duration"],
                    "totalQuestions": len(questions),
                    "questions": questions
                }
                self.practice_tests[practice_test["id"]] = practice_test

        # Seed UPSC Daily MCQs (split into sets)
        upsc_file_path = os.path.join(self.base_dir, '..', 'data/upsc/daily-mcqs.json')
        if os.path.exists(upsc_file_path):
            upsc_questions = self._load_questions_from_file(upsc_file_path)
            
            # 1. Master Quiz (All Questions)
            master_quiz = {
                "id": "upsc-master-quiz",
                "title": "UPSC Master Question Bank (All)",
                "examType": "upsc",
                "subject": "Current Affairs",
                "duration": len(upsc_questions) * 2, # 2 mins per question
                "totalQuestions": len(upsc_questions),
                "questions": upsc_questions
            }
            self.practice_tests[master_quiz["id"]] = master_quiz

            # 2. Daily Quizzes (Split by Set ID)
            upsc_sets = {}
            for q in upsc_questions:
                # Assuming id format 'upsc-SET-QNO' e.g. 'upsc-1-1'
                parts = q['id'].split('-')
                if len(parts) >= 2:
                    set_id = parts[1] # '1'
                    if set_id not in upsc_sets:
                        upsc_sets[set_id] = []
                    upsc_sets[set_id].append(q)

            # Sort sets by ID (assuming numeric)
            sorted_set_ids = sorted(upsc_sets.keys(), key=lambda x: int(x) if x.isdigit() else x)

            for set_id in sorted_set_ids:
                questions = upsc_sets[set_id]
                practice_test = {
                    "id": str(uuid.uuid4()),
                    "title": f"UPSC Daily Quiz #{set_id}",
                    "examType": "upsc",
                    "subject": "Current Affairs",
                    "duration": 10, # 2 mins per question approx
                    "totalQuestions": len(questions),
                    "questions": questions
                }
                self.practice_tests[practice_test["id"]] = practice_test

        # Seed mock tests from JSON files
        mock_test_dir = os.path.join(self.base_dir, '..', 'data/cat/mocks')
        if os.path.exists(mock_test_dir):
            for file_name in os.listdir(mock_test_dir):
                if file_name.startswith('mock-test-') and file_name.endswith('.json'):
                    file_path = os.path.join(mock_test_dir, file_name)
                    try:
                        with open(file_path, 'r') as f:
                            data = json.load(f)
                            questions = data.get("questions", [])
                            if questions:
                                mock_test = {
                                    "id": data["id"],
                                    "title": data["title"],
                                    "examType": data["examType"],
                                    "subject": data["subject"],
                                    "duration": data["duration"],
                                    "totalQuestions": len(questions),
                                    "questions": questions
                                }
                                self.mock_tests[mock_test["id"]] = mock_test
                    except (IOError, json.JSONDecodeError) as e:
                        print(f"Failed to load mock test from {file_path}: {e}")

        # Seed sectional tests from JSON files
        sectional_test_dir = os.path.join(self.base_dir, '..', 'data/cat/sectionals')
        sectional_test_types = ['varc', 'dilr', 'quants']
        if os.path.exists(sectional_test_dir):
            for test_type in sectional_test_types:
                type_dir = os.path.join(sectional_test_dir, test_type)
                if os.path.exists(type_dir):
                    for file_name in os.listdir(type_dir):
                        if file_name.startswith('sectionals-') and file_name.endswith('.json'):
                            file_path = os.path.join(type_dir, file_name)
                            try:
                                with open(file_path, 'r') as f:
                                    data = json.load(f)
                                    questions = data.get("questions", [])
                                    if questions:
                                        test_number = file_name.split('-')[1].split('.')[0]
                                        test_id = f"sectional-test-{test_number}-{test_type}"
                                        sectional_test = {
                                            "id": test_id,
                                            "title": f"CAT Sectional Test {test_number} - {test_type.upper()}",
                                            "examType": 'cat',
                                            "subject": test_type.upper(),
                                            "duration": 40,
                                            "totalQuestions": len(questions),
                                            "questions": questions
                                        }
                                        self.sectional_tests[sectional_test["id"]] = sectional_test
                            except (IOError, json.JSONDecodeError) as e:
                                print(f"Failed to load sectional test from {file_path}: {e}")

    def _load_questions_from_file(self, file_path: str) -> List[Dict]:
        """
        Loads questions from a specified JSON file.

        Args:
            file_path: The absolute path to the JSON file.

        Returns:
            A list of question dictionaries, or an empty list if loading fails.
        """
        try:
            with open(file_path, 'r') as f:
                data = json.load(f)
                return data.get("questions", [])
        except (IOError, json.JSONDecodeError) as e:
            print(f"Failed to load questions from {file_path}: {e}")
            return []

    # Accessor methods
    def get_courses(self) -> List[Dict]:
        """
        Retrieves all courses from the storage.

        Returns:
            A list of all course dictionaries.
        """
        return list(self.courses.values())

    def get_course(self, course_id: str) -> Optional[Dict]:
        """
        Retrieves a single course by its ID.

        Args:
            course_id: The UUID of the course.

        Returns:
            A course dictionary if found, otherwise None.
        """
        return self.courses.get(course_id)

    def get_courses_by_exam_type(self, exam_type: str) -> List[Dict]:
        """
        Filters courses by the specified exam type.

        Args:
            exam_type: The type of exam (e.g., 'cat', 'gate').

        Returns:
            A list of course dictionaries matching the exam type.
        """
        return [c for c in self.courses.values() if c["examType"] == exam_type]

    def get_study_materials(self) -> List[Dict]:
        """
        Retrieves all study materials from the storage.

        Returns:
            A list of all study material dictionaries.
        """
        return list(self.study_materials.values())

    def get_study_material(self, material_id: str) -> Optional[Dict]:
        """
        Retrieves a single study material by its ID.

        Args:
            material_id: The UUID of the study material.

        Returns:
            A study material dictionary if found, otherwise None.
        """
        return self.study_materials.get(material_id)

    def get_study_materials_by_exam_type(self, exam_type: str) -> List[Dict]:
        """
        Filters study materials by the specified exam type.

        Args:
            exam_type: The type of exam (e.g., 'cat', 'gate').

        Returns:
            A list of study material dictionaries matching the exam type.
        """
        return [m for m in self.study_materials.values() if m["examType"] == exam_type]

    def get_study_materials_by_subject(self, subject: str) -> List[Dict]:
        """
        Filters study materials by the specified subject.

        Args:
            subject: The subject of the study material.

        Returns:
            A list of study material dictionaries matching the subject.
        """
        return [m for m in self.study_materials.values() if m["subject"] == subject]

    def get_subjects(self) -> List[str]:
        """
        Retrieves a list of all unique subjects from the storage.

        Returns:
            A list of unique subject names.
        """
        subjects = set()
        for test in self.practice_tests.values():
            subjects.add(test["subject"])
        for test in self.mock_tests.values():
            subjects.add(test["subject"])
        for test in self.sectional_tests.values():
            subjects.add(test["subject"])
        return list(subjects)

    def get_practice_tests(self) -> List[Dict]:
        """
        Retrieves all practice tests from the storage.

        Returns:
            A list of all practice test dictionaries.
        """
        return list(self.practice_tests.values())

    def get_practice_test(self, test_id: str) -> Optional[Dict]:
        """
        Retrieves a single practice test by its ID.

        Args:
            test_id: The UUID of the practice test.

        Returns:
            A practice test dictionary if found, otherwise None.
        """
        return self.practice_tests.get(test_id)

    def get_practice_tests_by_exam_type(self, exam_type: str) -> List[Dict]:
        """
        Filters practice tests by the specified exam type.

        Args:
            exam_type: The type of exam (e.g., 'cat', 'gate').

        Returns:
            A list of practice test dictionaries matching the exam type.
        """
        return [t for t in self.practice_tests.values() if t["examType"] == exam_type]

    def get_mock_tests(self) -> List[Dict]:
        """
        Retrieves all mock tests from the storage.

        Returns:
            A list of all mock test dictionaries.
        """
        return list(self.mock_tests.values())

    def get_mock_test(self, test_id: str) -> Optional[Dict]:
        """
        Retrieves a single mock test by its ID.

        Args:
            test_id: The ID of the mock test.

        Returns:
            A mock test dictionary if found, otherwise None.
        """
        return self.mock_tests.get(test_id)

    def get_mock_tests_by_exam_type(self, exam_type: str) -> List[Dict]:
        """
        Retrieves mock tests filtered by exam type.

        Args:
            exam_type: The exam type to filter by (e.g., 'cat', 'gate').

        Returns:
            A list of mock test dictionaries matching the exam type.
        """
        return [test for test in self.mock_tests.values() if test.get('examType') == exam_type]

    def get_sectional_tests(self) -> List[Dict]:
        """
        Retrieves all sectional tests from the storage.

        Returns:
            A list of all sectional test dictionaries.
        """
        return list(self.sectional_tests.values())

    def get_sectional_tests_by_exam_type(self, exam_type: str) -> List[Dict]:
        """
        Retrieves sectional tests filtered by exam type.

        Args:
            exam_type: The exam type to filter by (e.g., 'cat', 'gate').

        Returns:
            A list of sectional test dictionaries matching the exam type.
        """
        return [test for test in self.sectional_tests.values() if test.get('examType') == exam_type]

    def get_sectional_test(self, test_id: str) -> Optional[Dict]:
        """
        Retrieves a single sectional test by its ID.

        Args:
            test_id: The ID of the sectional test.

        Returns:
            A sectional test dictionary if found, otherwise None.
        """
        return self.sectional_tests.get(test_id)

    def get_sectional_test_section(self, test_id: str, section: str) -> Optional[Dict]:
        """
        Retrieves a specific section of a sectional test.

        Note:
            The current implementation returns the entire test if the ID matches,
            as section logic is embedded within the test ID itself.

        Args:
            test_id: The ID of the sectional test.
            section: The specific section to retrieve (currently unused).

        Returns:
            A sectional test dictionary if the test_id is found, otherwise None.
        """
        # In the original implementation, section is part of the test id for sectional tests.
        # This method might need adjustment based on how sectional tests are identified.
        return self.sectional_tests.get(test_id)

    def create_test_session(self, session_data: Dict) -> Dict:
        """
        Creates a new test session and stores it in the database.

        Args:
            session_data: A dictionary containing initial data for the session,
                          such as user ID and test ID.

        Returns:
            The newly created test session dictionary.
        """
        user_id = session_data.pop('userId', None)
        if not user_id:
            raise ValueError("userId is required to create a test session")

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            raise ValueError(f"User with id {user_id} not found")

        session = TestSession.objects.create(
            user=user,
            test_id=session_data.get('testId'),
            start_time=session_data.get('startTime'),
            end_time=session_data.get('endTime'),
            score=session_data.get('score'),
            total_questions=session_data.get('totalQuestions'),
            correct_answers=session_data.get('correctAnswers'),
            answers=session_data.get('answers'),
            is_completed=session_data.get('isCompleted'),
            subject=session_data.get('subject'),
            max_score=session_data.get('maxScore'),
        )
        return {
            "id": str(session.id),
            "userId": session.user.id,
            "testId": session.test_id,
            "startTime": session.start_time.isoformat(),
            "endTime": session.end_time.isoformat() if session.end_time else None,
            "score": session.score,
            "totalQuestions": session.total_questions,
            "correctAnswers": session.correct_answers,
            "answers": session.answers,
            "isCompleted": session.is_completed,
            "subject": session.subject,
            "maxScore": session.max_score,
        }

    def update_test_session(self, session_id: str, updates: Dict) -> Optional[Dict]:
        """
        Updates an existing test session in the database.

        Args:
            session_id: The ID of the session to update.
            updates: A dictionary of fields to update.

        Returns:
            The updated session dictionary, or None if the session was not found.
        """
        try:
            session = TestSession.objects.get(id=session_id)
            for key, value in updates.items():
                setattr(session, key, value)
            session.save()
            return {
                "id": str(session.id),
                "userId": session.user.id,
                "testId": session.test_id,
                "startTime": session.start_time.isoformat(),
                "endTime": session.end_time.isoformat() if session.end_time else None,
                "score": session.score,
                "totalQuestions": session.total_questions,
                "correctAnswers": session.correct_answers,
                "answers": session.answers,
                "isCompleted": session.is_completed,
                "subject": session.subject,
                "maxScore": session.max_score,
            }
        except TestSession.DoesNotExist:
            return None

    def get_test_session(self, session_id: str) -> Optional[Dict]:
        """
        Retrieves a single test session by its ID from the database.

        Args:
            session_id: The ID of the test session.

        Returns:
            A test session dictionary if found, otherwise None.
        """
        try:
            session = TestSession.objects.get(id=session_id)
            return {
                "id": str(session.id),
                "userId": session.user.id,
                "testId": session.test_id,
                "startTime": session.start_time.isoformat(),
                "endTime": session.end_time.isoformat() if session.end_time else None,
                "score": session.score,
                "totalQuestions": session.total_questions,
                "correctAnswers": session.correct_answers,
                "answers": session.answers,
                "isCompleted": session.is_completed,
                "subject": session.subject,
                "maxScore": session.max_score,
            }
        except TestSession.DoesNotExist:
            return None

    def get_test_sessions_by_user(self, user_id: str) -> List[Dict]:
        """
        Retrieves all test sessions for a specific user from the database.

        Args:
            user_id: The ID of the user.

        Returns:
            A list of test session dictionaries for the user.
        """
        sessions = TestSession.objects.filter(user__id=user_id)
        return [
            {
                "id": str(session.id),
                "userId": session.user.id,
                "testId": session.test_id,
                "startTime": session.start_time.isoformat(),
                "endTime": session.end_time.isoformat() if session.end_time else None,
                "score": session.score,
                "totalQuestions": session.total_questions,
                "correctAnswers": session.correct_answers,
                "answers": session.answers,
                "isCompleted": session.status == 'completed',
                "subject": session.subject,
                "maxScore": session.max_score,
            }
            for session in sessions
        ]

    def get_user_progress(self, user_id: str) -> List[Dict]:
        """
        Retrieves all progress records for a specific user.

        Args:
            user_id: The ID of the user.

        Returns:
            A list of user progress dictionaries.
        """
        return [p for p in self.user_progress.values() if p["userId"] == user_id]

    def get_user_progress_by_course(self, user_id: str, course_id: str) -> Optional[Dict]:
        """
        Retrieves a user's progress for a specific course.

        Args:
            user_id: The ID of the user.
            course_id: The ID of the course.

        Returns:
            A user progress dictionary if found, otherwise None.
        """
        for p in self.user_progress.values():
            if p["userId"] == user_id and p["courseId"] == course_id:
                return p
        return None

    def add_question(self, exam_type: str, subject: str, question_data: Dict) -> bool:
        """
        Adds a new question to the appropriate JSON file and reloads the data.

        This function finds the correct JSON file based on exam type and subject,
        appends the new question, and then re-seeds the in-memory storage to
        reflect the changes.

        Args:
            exam_type: The type of exam (e.g., 'cat', 'gate').
            subject: The subject of the question.
            question_data: A dictionary containing the new question's details.

        Returns:
            True if the question was added successfully, otherwise False.
        """
        file_path = os.path.join(self.base_dir, '..', f"data/{exam_type}/{subject.lower().replace(' ', '-')}.json")
        if not os.path.exists(os.path.dirname(file_path)):
            os.makedirs(os.path.dirname(file_path))

        try:
            if os.path.exists(file_path):
                with open(file_path, 'r+') as f:
                    data = json.load(f)
                    questions = data.get("questions", [])
            else:
                data = {}
                questions = []

            questions.append(question_data)
            data["questions"] = questions

            with open(file_path, 'w') as f:
                json.dump(data, f, indent=2)

            # Reload the practice tests to reflect the new question
            self.practice_tests = {}
            self.seed_data() # This is a simple way to reload, might be inefficient

            return True
        except (IOError, json.JSONDecodeError) as e:
            print(f"Failed to add question to {file_path}: {e}")
            return False

storage = MemStorage()