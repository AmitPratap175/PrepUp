import asyncio
from langchain_core.messages import HumanMessage
from .chatbot.graph import agent as graph_agent
import os

async def _invoke_agent_async(session_id: str, message: str, token: str):
    app = graph_agent.graph_builder.compile()

    config = {
        "configurable": {
            "thread_id": session_id,
            "token": token,
        }
    }

    messages = [HumanMessage(content=message)]

    final_state = await app.ainvoke({"messages": messages}, config=config)

    return final_state['messages'][-1].content

def invoke_agent(session_id: str, message: str, token: str):
    return asyncio.run(_invoke_agent_async(session_id, message, token))