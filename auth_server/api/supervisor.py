
import operator
from typing import Annotated, Sequence, TypedDict

from langchain_core.messages import BaseMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.graph import END, StateGraph

from .agent.graph import graph as research_graph
from .chatbot.graph.agent import \
    graph_builder as chatbot_graph_builder


class SupervisorState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], operator.add]


chatbot_agent = chatbot_graph_builder.compile()
research_agent = research_graph


class Agent:

    def __init__(self, runnable, name):
        self.runnable = runnable
        self.name = name

    def __call__(self, state: SupervisorState):
        result = self.runnable.invoke(state)
        return {"messages": result["messages"]}


chatbot_worker = Agent(chatbot_agent, "chatbot")
research_worker = Agent(research_agent, "researcher")

members = ["chatbot", "researcher"]
system_prompt = (
    "You are a supervisor tasked with managing a conversation between a user and two assistants: a chatbot and a research agent. "
    "The chatbot is for general conversation and can access user-specific data. "
    "The research agent can search the web to answer questions. "
    "Given the user's request, decide which agent should handle it. "
    'Each agent will respond with a summary of their work. When the user is satisfied, respond with "FINISH".'
)
options = ["FINISH"] + members
function_def = {
    "name": "route",
    "description": "Select the next agent to act.",
    "parameters": {
        "title": "routeSchema",
        "type": "object",
        "properties": {
            "next": {
                "title": "Next",
                "type": "string",
                "enum": options,
            }
        },
        "required": ["next"],
    },
}
prompt = ChatPromptTemplate.from_messages([
    ("system", system_prompt),
    MessagesPlaceholder(variable_name="messages"),
    (
        "system",
        "Given the conversation above, who should act next?"
        " Or should we FINISH? Select one of: {options}",
    ),
]).partial(options=str(options), members=", ".join(members))

llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash")

supervisor_chain = (
    prompt | llm.bind_tools(tools=[function_def], tool_choice="route")
)

workflow = StateGraph(SupervisorState)
workflow.add_node("supervisor", supervisor_chain)
workflow.add_node("chatbot", chatbot_worker)
workflow.add_node("researcher", research_worker)

def router(state):
    if "tool_calls" in state["messages"][-1].additional_kwargs:
        return state["messages"][-1].additional_kwargs["tool_calls"][0][
            "function"]["arguments"]["next"]
    else:
        return "FINISH"


workflow.add_conditional_edges(
    "supervisor",
    router,
    {
        "chatbot": "chatbot",
        "researcher": "researcher",
        "FINISH": END
    },
)
workflow.add_edge("chatbot", "supervisor")
workflow.add_edge("researcher", "supervisor")

workflow.set_entry_point("supervisor")

supervisor_graph = workflow.compile()
