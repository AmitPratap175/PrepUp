from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from ...core.prompts import (
    CHARACTER_CARD_PROMPT,
    ROUTER_PROMPT,

)
from .helpers import AsteriskRemovalParser, get_chat_model
from .schemas import RouterResponse
from ...tools.safe_tools import safe_tools_list
from ...tools.dynamic_tools import dynamic_tools_list

from datetime import datetime


def get_router_chain():
    model = get_chat_model(temperature=0.3).with_structured_output(RouterResponse)

    prompt = ChatPromptTemplate.from_messages(
        [('system', ROUTER_PROMPT), MessagesPlaceholder(variable_name='messages')]
    )

    return prompt | model


def get_character_response_chain(summary: str = ''):
    model = get_chat_model()
    system_message = CHARACTER_CARD_PROMPT

    if summary:
        system_message += f'\n\nSummary of conversation earlier between Chatbot and the user: {summary}'

    prompt = ChatPromptTemplate.from_messages(
        [
            ('system', system_message),
            MessagesPlaceholder(variable_name='messages'),
        ]
    )

    all_tools = safe_tools_list + dynamic_tools_list

    return prompt | model.bind_tools(all_tools)
