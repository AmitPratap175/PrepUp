
import os
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage
from django.conf import settings
from users.models import Bookmark
from .storage import storage

load_dotenv()

class SimpleChatbot:
    """
    A Gemini-powered chatbot that answers questions based on a user's bookmarks.
    """
    def __init__(self):
        """
        Initializes the chatbot and configures the Gemini API.
        """
        # Per user request, setting the API key directly.
        # WARNING: This is not a recommended security practice.
        os.environ["GOOGLE_API_KEY"] = os.getenv("GOOGLE_API_KEY")
        try:
            # Corrected model name to gemini-1.5-flash
            self.model = ChatGoogleGenerativeAI(model="gemini-1.5-flash")
        except Exception as e:
            print(f"Error initializing Gemini (API key or model name may be invalid): {e}")
            self.model = None

    def get_answer(self, user_question: str, user) -> str:
        """
        Generates a direct conversational response to the user's question.

        Args:
            user_question: The question asked by the user.
            user: The authenticated user object (currently unused).

        Returns:
            A string containing the generated answer.
        """
        if not self.model:
            return "Sorry, the chatbot is not configured correctly. Please check the API key."

        if not user_question:
            return "Please ask a question."

        prompt = f"""
        You are a helpful study assistant. Answer the following question clearly and concisely.

        Question: "{user_question}"
        Answer:
        """

        try:
            message = HumanMessage(content=prompt)
            response = self.model.invoke([message])
            return response.content
        except Exception as e:
            print(f"Error generating content with Gemini: {e}")
            return "Sorry, I encountered an error while trying to generate an answer. Please try again."

    def _get_question_by_id(self, qid: str):
        """
        Finds a question by its ID by searching through all test types.

        Args:
            qid: The unique ID of the question to find.

        Returns:
            A dictionary containing the question data if found, otherwise None.
        """
        all_tests = (
            list(storage.practice_tests.values()) +
            list(storage.mock_tests.values()) +
            list(storage.sectional_tests.values())
        )
        for test in all_tests:
            for question in test.get('questions', []):
                if question.get('qid') == qid:
                    return question
        return None

    def get_answer_with_bookmarks(self, user_question: str, user) -> str:
        """
        Generates an answer to the user's question based on their bookmarks.

        Args:
            user_question: The question asked by the user.
            user: The authenticated user object.

        Returns:
            A string containing the generated answer.
        """
        if not self.model:
            return "Sorry, the chatbot is not configured correctly. Please check the API key."

        bookmarks = Bookmark.objects.filter(user=user)
        if not bookmarks.exists():
            return "You don't have any bookmarks yet. Add some questions to your bookmarks to get started!"

        context = ""
        for bookmark in bookmarks:
            question_data = self._get_question_by_id(bookmark.question_id)
            if question_data:
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
                context += "\n---\n"

        if not context:
            return "I couldn't find the content for your bookmarked questions. They may have been removed or changed."

        prompt = f"""
        You are a helpful study assistant. A user has a question, and you must answer it based ONLY on the context provided below, which is from their bookmarked questions. Do not use any other knowledge.

        **Context from Bookmarked Questions:**
        {context}

        **User's Question:**
        "{user_question}"

        **Your Answer:**
        """

        try:
            message = HumanMessage(content=prompt)
            response = self.model.invoke([message])
            return response.content
        except Exception as e:
            print(f"Error generating content with Gemini: {e}")
            return "Sorry, I encountered an error while trying to generate an answer. Please try again."
