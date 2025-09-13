import json
from pathlib import Path
from typing import List, Dict, Optional
import uuid

from . import schemas

class Storage:
    def __init__(self, data_path: Path):
        self.data_path = data_path
        self._courses: Dict[str, schemas.Course] = {}
        self._study_materials: Dict[str, schemas.StudyMaterial] = {}
        self._practice_tests: Dict[str, schemas.PracticeTest] = {}
        self._mock_tests: Dict[str, schemas.PracticeTest] = {}
        self._sectional_tests: Dict[str, schemas.PracticeTest] = {}
        self._seed_data()

    def _load_questions_from_file(self, file_path: str) -> List[schemas.Question]:
        try:
            full_path = self.data_path.parent / file_path
            with open(full_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            return [schemas.Question(**q) for q in data.get("questions", [])]
        except (IOError, json.JSONDecodeError) as e:
            print(f"Failed to load questions from {file_path}: {e}")
            return []

    def _seed_data(self):
        # Seed courses
        cat_course = schemas.Course(
            id=str(uuid.uuid4()),
            title="CAT Preparation Course",
            description="Complete preparation for Common Admission Test with quantitative aptitude, verbal ability, and data interpretation.",
            examType="cat",
            duration="6 months comprehensive program",
            price=15999,
            originalPrice=25999,
            features=["200+ practice tests", "Expert mentorship", "Comprehensive study materials", "Mock interviews"],
            imageUrl="https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=400",
            isPopular=True
        )
        gate_course = schemas.Course(
            id=str(uuid.uuid4()),
            title="GATE Preparation Course",
            description="Comprehensive preparation for Graduate Aptitude Test in Engineering across all major branches.",
            examType="gate",
            duration="8 months intensive program",
            price=18999,
            originalPrice=28999,
            features=["300+ practice tests", "All engineering branches", "Expert guidance", "Live doubt sessions"],
            imageUrl="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&h=400",
            isPopular=False
        )
        self._courses = {cat_course.id: cat_course, gate_course.id: gate_course}

        # Seed study materials
        materials_data = [
            { "id": str(uuid.uuid4()), "title": "Advanced Data Interpretation", "description": "Comprehensive guide covering all types of DI questions with detailed solutions and shortcuts.", "examType": "cat", "subject": "Quantitative", "type": "pdf", "pages": 120, "rating": 5, "reviewCount": 324, "isPremium": True, "downloadUrl": "#", "imageUrl": "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&h=300" },
            { "id": str(uuid.uuid4()), "title": "Digital Electronics Fundamentals", "description": "Essential concepts in digital electronics with practice problems and solutions.", "examType": "gate", "subject": "Electronics", "type": "pdf", "pages": 95, "rating": 5, "reviewCount": 198, "isPremium": False, "downloadUrl": "#", "imageUrl": "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&h=300" },
            { "id": str(uuid.uuid4()), "title": "Quick Math Formula Handbook", "description": "Essential formulas and shortcuts for quantitative aptitude section.", "examType": "cat", "subject": "Mathematics", "type": "pdf", "pages": 45, "rating": 5, "reviewCount": 512, "isPremium": True, "downloadUrl": "#", "imageUrl": "https://images.unsplash.com/photo-1635372722656-389f87a941b7?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&h=300" }
        ]
        for data in materials_data:
            material = schemas.StudyMaterial(**data)
            self._study_materials[material.id] = material

        # Seed practice tests from JSON
        practice_tests_data = [
            {"title": "CAT Quantitative Aptitude Test", "examType": "cat", "subject": "Quantitative Aptitude", "duration": 90, "filePath": "data/cat/quantitative-aptitude.json"},
            {"title": "CAT Verbal Ability Test", "examType": "cat", "subject": "Verbal Ability", "duration": 60, "filePath": "data/cat/verbal-ability.json"},
            {"title": "CAT Data Interpretation Test", "examType": "cat", "subject": "Data Interpretation", "duration": 60, "filePath": "data/cat/data-interpretation.json"},
            {"title": "GATE Mathematics Test", "examType": "gate", "subject": "Mathematics", "duration": 90, "filePath": "data/gate/mathematics.json"},
            {"title": "GATE General Aptitude Test", "examType": "gate", "subject": "General Aptitude", "duration": 60, "filePath": "data/gate/general-aptitude.json"},
            {"title": "GATE Computer Science Test", "examType": "gate", "subject": "Computer Science", "duration": 120, "filePath": "data/gate/computer-science.json"}
        ]
        for test_data in practice_tests_data:
            questions = self._load_questions_from_file(test_data["filePath"])
            if questions:
                test = schemas.PracticeTest(
                    id=str(uuid.uuid4()),
                    title=test_data["title"],
                    examType=test_data["examType"],
                    subject=test_data["subject"],
                    duration=test_data["duration"],
                    totalQuestions=len(questions),
                    questions=questions
                )
                self._practice_tests[test.id] = test

        # Seed mock tests from JSON
        mock_test_dir = self.data_path.parent / 'data' / 'cat' / 'mocks'
        for file_path in mock_test_dir.glob('mock-test-*.json'):
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                questions = [schemas.Question(**q) for q in data.get("questions", [])]
                if questions:
                    test = schemas.PracticeTest(
                        id=data["id"],
                        title=data["title"],
                        examType=data["examType"],
                        subject=data["subject"],
                        duration=data["duration"],
                        totalQuestions=len(questions),
                        questions=questions
                    )
                    self._mock_tests[test.id] = test

    # Methods to get data
    def get_courses(self) -> List[schemas.Course]:
        return list(self._courses.values())

    def get_course(self, course_id: str) -> Optional[schemas.Course]:
        return self._courses.get(course_id)

    def get_mock_tests(self) -> List[schemas.PracticeTest]:
        return list(self._mock_tests.values())

    def get_mock_test(self, test_id: str) -> Optional[schemas.PracticeTest]:
        return self._mock_tests.get(test_id)

# Instantiate storage
storage_instance = Storage(data_path=Path(__file__).parent)
