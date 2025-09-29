
import asyncio
from langchain_core.messages import HumanMessage
from langgraph.checkpoint.sqlite import SqliteSaver

from .chatbot.graph import graph_builder
from .chatbot.settings import settings

def invoke_agent(session_id: str, message: str) -> str:
    """Invokes the LangGraph agent with the user's message and returns the response."""
    print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
    print("!!! CHATBOT SERVICE (invoke_agent) WAS CALLED !!!")
    print(f"!!! Session: {session_id}, Message: {message} !!!")
    print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")

    if not message:
        return "Please provide a message."

    config = {"configurable": {"thread_id": session_id}}

    with SqliteSaver.from_conn_string(settings.SHORT_TERM_MEMORY_DB_PATH) as memory:
        graph = graph_builder.compile(checkpointer=memory)

        # invoke the graph to process the message
        graph.invoke(
            {"messages": [HumanMessage(content=message)]},
            config,
        )

        # Get the final state to extract the last message
        output_state = graph.get_state(config=config)
        
        # The response is the content of the last message in the state
        response_message = output_state.values["messages"][-1].content

        return response_message
