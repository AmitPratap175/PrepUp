import json
import random
import os

def create_mock_tests():
    """
    Reads questions from the data-interpretation.json, verbal-ability.json, and quantitative-aptitude.json files,
    and creates new mock tests with a specified number of questions from each category until all questions are exhausted.
    """

    # Load the questions from the JSON files
    with open('/home/dspratap/Downloads/PrepUp/data/cat/data-interpretation.json', 'r') as f:
        dilr_data = json.load(f)
        dilr_questions = dilr_data.get('questions', [])

    with open('/home/dspratap/Downloads/PrepUp/data/cat/verbal-ability.json', 'r') as f:
        varc_data = json.load(f)
        varc_questions = varc_data.get('questions', [])

    with open('/home/dspratap/Downloads/PrepUp/data/cat/quantitative-aptitude.json', 'r') as f:
        quants_data = json.load(f)
        quants_questions = quants_data.get('questions', [])

    mock_test_number = 2
    while True:
        # Check if there are enough questions to create a new mock test

        # Select the required number of questions
        selected_varc = varc_questions[0:24]
        selected_dilr = dilr_questions[0:22]
        selected_quants = quants_questions[0:22]

        # Remove the selected questions from the original lists
        varc_questions = varc_questions[24:]
        dilr_questions = dilr_questions[22:]
        quants_questions = selected_quants[22:]

        # Add type to each question
        for q in selected_varc:
            q['type'] = 'varc'

        for q in selected_dilr:
            q['type'] = 'dilr'

        for q in selected_quants:
            q['type'] = 'quants'

        # Create the new mock test JSON
        mock_test = {
            "id": f"mock-test-{mock_test_number}",
            "title": f"CAT Mock Test {mock_test_number}",
            "subject": "General",
            "duration": 120,
            "totalQuestions": 68,
            "examType": "CAT",
            "questions": selected_varc + selected_dilr + selected_quants
        }

        # Write the new mock test to a file
        file_path = f'/home/dspratap/Downloads/PrepUp/data/cat/mocks/mock-test-{mock_test_number}.json'
        with open(file_path, 'w') as f:
            json.dump(mock_test, f, indent=2)

        print(f"Successfully created {file_path}")
        mock_test_number += 1

        if len(varc_questions) < 24 or len(dilr_questions) < 22 or len(quants_questions) < 22:
            break


questions_number ={
    "varc": 24,
    "dilr": 22,
    "quants": 22
}

type_string = {
    "varc": "verbal-ability",
    "dilr": "data-interpretation",
    "quants": "quantitative-aptitude"
}


def create_mock_sectional_tests(type):
    """
    Reads questions from the data-interpretation.json, verbal-ability.json, and quantitative-aptitude.json files,
    and creates new mock tests with a specified number of questions from each category until all questions are exhausted.
    """

    # Load the questions from the JSON files
    with open(f'/home/dspratap/Downloads/PrepUp/data/cat/{type_string[type]}.json', 'r') as f:
        dilr_data = json.load(f)
        dilr_questions = dilr_data.get('questions', [])


    mock_test_number = 1
    while True:
        # Check if there are enough questions to create a new mock test
        

        # Select the required number of questions
        selected_dilr = dilr_questions[0:questions_number[type]]

        # Remove the selected questions from the original lists
        dilr_questions = dilr_questions[questions_number[type]:]

        # Add type to each question
        for q in selected_dilr:
            q['type'] = type

        # Create the new mock test JSON
        mock_test = {
            "id": f"mock-test-{mock_test_number}",
            "title": f"CAT Mock Test {mock_test_number}",
            "subject": "General",
            "duration": 120,
            "totalQuestions": 68,
            "examType": "CAT",
            "questions": selected_dilr 
        }

        # Write the new mock test to a file
        file_path = f'/home/dspratap/Downloads/PrepUp/data/cat/sectionals/{type}/sectionals-{mock_test_number}.json'
        with open(file_path, 'w') as f:
            json.dump(mock_test, f, indent=2)

        print(f"Successfully created {file_path}")
        mock_test_number += 1
        if len(dilr_questions)< questions_number["dilr"]:
            break

if __name__ == '__main__':
    create_mock_tests()
    for i in ["quants", "dilr", "varc"]:
        create_mock_sectional_tests(i)
    print("Mock tests created successfully!")