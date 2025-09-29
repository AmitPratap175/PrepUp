from langchain_core.messages import AIMessage, HumanMessage, RemoveMessage
from langchain_core.runnables import RunnableConfig
from .state import AICompanionState
from uuid import uuid4
import os
from .utils.chains import (
    get_character_response_chain,
    get_router_chain,
)
from .utils.helpers import (
    get_chat_model,
)
from ..settings import settings

from langchain_core.messages import ToolMessage
from langchain_core.runnables import RunnableLambda

from langgraph.prebuilt import ToolNode, tools_condition
from langgraph.graph import END


from langchain_core.runnables import Runnable, RunnableConfig

class Assistant:
    def __init__(self, runnable: Runnable):
        self.runnable = runnable

    def __call__(self, state, **kwargs):
        while True:
            result = self.runnable.invoke(state, **kwargs)
            # If the LLM happens to return an empty response, we will re-prompt it
            # for an actual response.
            if not result.tool_calls and (
                not result.content
                or isinstance(result.content, list)
                and not result.content[0].get("text")
            ):
                messages = state["messages"] + [("user", "Respond with a real output.")]
                state = {**state, "messages": messages}
            else:
                break
        return {"messages": result}

def handle_tool_error(state) -> dict:
    error = state.get("error")
    tool_calls = state["messages"][-1].tool_calls
    return {
        "messages": [
            ToolMessage(
                content=f"Error: {repr(error)}\n please fix your mistakes.",
                tool_call_id=tc["id"],
            )
            for tc in tool_calls
        ]
    }

def route_tools(state):
    next_node = tools_condition(state)
    # If no tools are invoked, return to the user
    if next_node == END:
        return END
    ai_message = state["messages"][-1]
    # This assumes single tool calls. To handle parallel tool calling, you'd want to
    # use an ANY condition
    first_tool_call = ai_message.tool_calls[0]
    return "safe_tools"


def create_tool_node_with_fallback(tools: list) -> dict:
    return ToolNode(tools).with_fallbacks(
        [RunnableLambda(handle_tool_error)], exception_key="error"
    )


def conversation_node(state: dict, config: RunnableConfig):
    """
    Conversation node that ensures the model gives a valid response.
    """
    
    chain = get_character_response_chain(state.get("summary", ""))
    assistant = Assistant(chain)
    
    # Get the response from the assistant
    response = assistant(
        {
            "messages": state['messages'], 
            'memory_context': state.get('memory_context', ''),
        }, 
        config=config
    )
    
    return response
