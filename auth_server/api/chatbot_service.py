import asyncio
from langchain_core.messages import HumanMessage
from langgraph.checkpoint.sqlite.aio import AsyncSqliteSaver
from .chatbot.graph import graph_builder
from .chatbot.settings import settings

async def _invoke_agent_async(session_id: str, message: str):
    if not message:
        return "Please provide a message."

    async with AsyncSqliteSaver.from_conn_string(settings.SHORT_TERM_MEMORY_DB_PATH) as memory:
        app = graph_builder.compile(checkpointer=memory)

        config = {"configurable": {"thread_id": session_id}}
        messages = [HumanMessage(content=message)]
        
        final_state = await app.ainvoke({"messages": messages}, config=config)

        if final_state and 'messages' in final_state and final_state['messages']:
            # The last message is the response from the AI
            last_message = final_state['messages'][-1]
            return last_message.content
        return "Sorry, I couldn't process your request."

def invoke_agent(session_id: str, message: str) -> str:
    """Invokes the LangGraph agent with the user's message and returns the response."""
    return asyncio.run(_invoke_agent_async(session_id, message))