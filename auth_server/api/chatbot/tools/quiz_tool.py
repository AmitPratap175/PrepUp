from langchain.tools import tool
from api.storage import storage

def _get_question_by_id(qid: str, question_type: str):
    """Finds a question by its ID by searching through a specific test type."""
    test_collection = None
    if question_type == 'practice':
        test_collection = storage.practice_tests
    elif question_type == 'mock':
        test_collection = storage.mock_tests
    elif question_type == 'sectional':
        test_collection = storage.sectional_tests
    else:
        return None

    for test in test_collection.values():
        for question in test.get('questions', []):
            if question.get('qid') == qid:
                return question
    return None

@tool
def get_quiz_question(question_id: str, question_type: str) -> str:
    """
    Gets a quiz question by its ID and type.

    Args:
        question_id: The ID of the question to get.
        question_type: The type of test the question belongs to (e.g., 'practice', 'mock', 'sectional').
    """
    print(f"---Tool: get_quiz_question activated for question {question_id}---")

    question_data = _get_question_by_id(question_id, question_type)
    if not question_data:
        return f"Error: Could not find the question data for ID {question_id} in {question_type} tests."

    # Build the context for the LLM
    context = f"Here is the full question data:\n"
    context += f"Question: {question_data.get('question', '')}\n"
    if 'options' in question_data:
        options_data = question_data['options']
        if isinstance(options_data, dict):
            options = ", ".join(options_data.values())
        elif isinstance(options_data, list):
            options = ", ".join(options_data)
        else:
            options = str(options_data)
        context += f"Options: {options}\n"
    if 'solution' in question_data:
        context += f"Solution: {question_data.get('solution', '')}\n"
        
    return context

quiz_tools_list = [get_quiz_question]
