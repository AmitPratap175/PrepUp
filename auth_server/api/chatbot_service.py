
import asyncio
from langchain_core.messages import HumanMessage
from langgraph.checkpoint.sqlite.aio import AsyncSqliteSaver

# from .chatbot.graph import graph_builder
from .chatbot.settings import settings
from langchain_google_genai import ChatGoogleGenerativeAI

llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    temperature=0,
    max_tokens=None,
    timeout=None,
    max_retries=2,
    api_key=settings.GOOGLE_API_KEY,
    # other params...
)
def invoke_agent(session_id: str, message: str) -> str:
    """Invokes the LangGraph agent with the user's message and returns the response."""
    print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
    print("!!! ASYNC CHATBOT SERVICE (invoke_agent) WAS CALLED !!!")
    print(f"!!! Session: {session_id}, Message: {message} !!!")
    print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")

    if not message:
        return "Please provide a message."

    config = {"configurable": {"thread_id": session_id}}

    # async with AsyncSqliteSaver.from_conn_string(settings.SHORT_TERM_MEMORY_DB_PATH) as memory:

    messages = [
        (
            "system",
            "You are a helpful assistant that finds words and their meaning by understanding the context of the message.",
        ),
        ("human", message),
    ]
    # invoke the graph to process the message
    ai_msg = llm.invoke(
        messages
    )

    
    return ai_msg.content
