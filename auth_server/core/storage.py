import json
import os
from typing import Dict, List, Optional
import uuid

class MemStorage:
    def __init__(self):
        self.base_dir = os.path.dirname(os.path.abspath(__file__))
        self.courses: Dict[str, Dict] = {}
        self.study_materials: Dict[str, Dict] = {}
        self.practice_tests: Dict[str, Dict] = {}
        self.mock_tests: Dict[str, Dict] = {}
        self.sectional_tests: Dict[str, Dict] = {}
        self.seed_data()

    def seed_data(self):
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
            {"title": "CAT Quantitative Aptitude Test", "examType": "cat", "subject": "Quantitative Aptitude", "duration": 90, "filePath": "data/cat/quantitative-aptitude.json"},
            {"title": "CAT Verbal Ability Test", "examType": "cat", "subject": "Verbal Ability", "duration": 60, "filePath": "data/cat/verbal-ability.json"},
            {"title": "CAT Data Interpretation Test", "examType": "cat", "subject": "Data Interpretation", "duration": 60, "filePath": "data/cat/data-interpretation.json"},
            {"title": "Quants CAT PYQs Test", "examType": "cat", "subject": "Quants", "duration": 90, "filePath": "data/cat/docs/quantitative-aptitude.json"},
            {"title": "VARC  CAT PYQs Test", "examType": "cat", "subject": "VARC", "duration": 60, "filePath": "data/cat/docs/verbal-ability.json"},
            {"title": "DILR CAT PYQs Test", "examType": "cat", "subject": "DILR", "duration": 120, "filePath": "data/cat/docs/data-interpretation.json"}
        ]
        for test_data in practice_tests_data:
            questions = self._load_questions_from_file(os.path.join(self.base_dir, '..', test_data["filePath"]))
            if questions:
                practice_test = {
                    "id": str(uuid.uuid4()), "title": test_data["title"], "examType": test_data["examType"], "subject": test_data["subject"],
                    "duration": test_data["duration"], "totalQuestions": len(questions), "questions": questions
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
                                    "id": data["id"], "title": data["title"], "examType": data["examType"], "subject": data["subject"],
                                    "duration": data["duration"], "totalQuestions": len(questions), "questions": questions
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
                                            "id": test_id, "title": f"CAT Sectional Test {test_number} - {test_type.upper()}",
                                            "examType": 'cat', "subject": test_type.upper(), "duration": 40,
                                            "totalQuestions": len(questions), "questions": questions
                                        }
                                        self.sectional_tests[sectional_test["id"]] = sectional_test
                            except (IOError, json.JSONDecodeError) as e:
                                print(f"Failed to load sectional test from {file_path}: {e}")

    def _load_questions_from_file(self, file_path: str) -> List[Dict]:
        try:
            with open(file_path, 'r') as f:
                data = json.load(f)
                return data.get("questions", [])
        except (IOError, json.JSONDecodeError) as e:
            print(f"Failed to load questions from {file_path}: {e}")
            return []

    def get_subjects(self) -> List[str]:
        subjects = set()
        for test in self.practice_tests.values(): subjects.add(test["subject"])
        for test in self.mock_tests.values(): subjects.add(test["subject"])
        for test in self.sectional_tests.values(): subjects.add(test["subject"])
        return list(subjects)

    def get_courses(self) -> List[Dict]: return list(self.courses.values())
    def get_course(self, course_id: str) -> Optional[Dict]: return self.courses.get(course_id)
    def get_courses_by_exam_type(self, exam_type: str) -> List[Dict]: return [c for c in self.courses.values() if c["examType"] == exam_type]
    def get_study_materials(self) -> List[Dict]: return list(self.study_materials.values())
    def get_study_material(self, material_id: str) -> Optional[Dict]: return self.study_materials.get(material_id)
    def get_study_materials_by_exam_type(self, exam_type: str) -> List[Dict]: return [m for m in self.study_materials.values() if m["examType"] == exam_type]
    def get_study_materials_by_subject(self, subject: str) -> List[Dict]: return [m for m in self.study_materials.values() if m["subject"] == subject]
    def get_practice_tests(self) -> List[Dict]: return list(self.practice_tests.values())
    def get_practice_test(self, test_id: str) -> Optional[Dict]: return self.practice_tests.get(test_id)
    def get_practice_tests_by_exam_type(self, exam_type: str) -> List[Dict]: return [t for t in self.practice_tests.values() if t["examType"] == exam_type]
    def get_mock_tests(self) -> List[Dict]: return list(self.mock_tests.values())
    def get_mock_test(self, test_id: str) -> Optional[Dict]: return self.mock_tests.get(test_id)
    def get_sectional_tests(self) -> List[Dict]: return list(self.sectional_tests.values())
    def get_sectional_test(self, test_id: str) -> Optional[Dict]: return self.sectional_tests.get(test_id)
    def get_sectional_test_section(self, test_id: str, section: str) -> Optional[Dict]: return self.sectional_tests.get(test_id)

storage = MemStorage()
