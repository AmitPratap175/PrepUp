from langchain_core.messages import AIMessage, HumanMessage, RemoveMessage
from langchain_core.runnables import RunnableConfig
from .state import AICompanionState
from uuid import uuid4
import os
import re
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

from ..tools.safe_tools import safe_tools_list
from ..tools.dynamic_tools import dynamic_tools_list

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

def extract_question_context_node(state: AICompanionState):
    """
    Extracts question context from the user's message and updates the state.
    """
    if not state['messages']:
        return {}

    last_message = state['messages'][-1]
    content = last_message.content

    subject_match = re.search(r"\*\*Subject:\*\*(.*?)\n", content)
    question_id_match = re.search(r"\*\*qid:\*\*(.*?)\n", content)
    passage_match = re.search(r"\*\*Passage:\*\*\n(.*?)\n\n", content, re.DOTALL)
    question_match = re.search(r"\*\*Question:\*\*\n(.*?)\n\n", content, re.DOTALL)
    options_match = re.search(r"\*\*Options:\*\*\n(.*)", content, re.DOTALL)

    subject = subject_match.group(1).strip() if subject_match else None
    question_id = question_id_match.group(1).strip() if question_id_match else None
    passage_text = passage_match.group(1).strip() if passage_match else None
    question_text = question_match.group(1).strip() if question_match else None
    options_text = options_match.group(1).strip() if options_match else None

    # Update state only if new context is found
    if subject or question_id or passage_text or question_text or options_text:
        return {
            "subject": subject or state.get("subject"),
            "question_id": question_id or state.get("question_id"),
            "passage_text": passage_text or state.get("passage_text"),
            "question_text": question_text or state.get("question_text"),
            "options_text": options_text or state.get("options_text"),
        }
    return {}



def conversation_node(state: dict, config: RunnableConfig):
    """
    Conversation node that ensures the model gives a valid response.
    """

    chain = get_character_response_chain(state.get("summary", ""))
    assistant = Assistant(chain)

    all_tools = safe_tools_list + dynamic_tools_list
    tools_description = "\n".join([f"- **{tool.name}** → {tool.description}" for tool in all_tools])

    # Get the response from the assistant
    response = assistant(
        {
            "messages": state['messages'],
            'memory_context': state.get('memory_context', ''),
            'subject': state.get('subject', ''),
            'question_id': state.get('question_id', ''),
            'passage_text': state.get('passage_text', ''),
            'question_text': state.get('question_text', ''),
            'options_text': state.get('options_text', ''),
            'tools_description': tools_description,
        },
        config=config
    )

    return response
