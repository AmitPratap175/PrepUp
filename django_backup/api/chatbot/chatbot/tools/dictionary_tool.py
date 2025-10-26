from langchain.tools import tool
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage
import os
from ...chatbot.settings import settings

@tool
async def get_word_definition(word: str, context: str) -> str:
    """
    Gets the definition of a word based on its context.

    Args:
        word: The word to define.
        context: The context in which the word appears.
    """
    print(f"---Tool: get_word_definition activated for word '{word}'---")

    try:
        model = ChatGoogleGenerativeAI(model="gemini-2.5-flash",api_key=settings.GOOGLE_API_KEY)
    except Exception as e:
        return f"Error initializing Gemini: {e}"

    prompt = f"""
    You are a helpful study assistant. Please provide a clear and concise definition for the word "{word}" based on the following context.

    **Context:**
    "{context}"

    **Definition of "{word}":**
    """

    try:
        message = HumanMessage(content=prompt)
        response = await model.ainvoke([message])
        return response.content
    except Exception as e:
        return f"Error generating definition: {e}"

dictionary_tools_list = [get_word_definition]