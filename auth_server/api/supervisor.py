
import operator
import os
from typing import Annotated, Sequence, TypedDict
import google.generativeai as genai

from langchain_core.messages import BaseMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langgraph.graph import END, StateGraph

from .agent.graph import graph as research_graph
from .analytics_agent import graph as analytics_graph
from .chatbot.graph.agent import \
    graph_builder as chatbot_graph_builder
from .goal_setting_agent import graph as goal_setting_graph
from .content_agent import graph as content_graph
from .forum_agent import graph as forum_graph
from .motivation_agent import graph as motivation_graph
from .strategy_agent import graph as strategy_graph
from .vocabulary_agent import graph as vocabulary_graph
from .news_agent import graph as news_graph
from .support_agent import graph as support_graph
from .planning_agent import graph as planning_graph
from .error_analysis_agent import graph as error_analysis_graph
from .comparison_agent import graph as comparison_graph
from .mindset_agent import graph as mindset_graph
from .gamification_agent import graph as gamification_graph
from .admissions_agent import graph as admissions_graph


class SupervisorState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], operator.add]


chatbot_agent = chatbot_graph_builder.compile()
research_agent = research_graph
analytics_agent = analytics_graph
goal_setting_agent = goal_setting_graph
content_agent = content_graph
forum_agent = forum_graph
motivation_agent = motivation_graph
strategy_agent = strategy_graph
vocabulary_agent = vocabulary_graph
news_agent = news_graph
support_agent = support_graph
planning_agent = planning_graph
error_analysis_agent = error_analysis_graph
comparison_agent = comparison_graph
mindset_agent = mindset_graph
gamification_agent = gamification_graph
admissions_agent = admissions_graph


class Agent:

    def __init__(self, runnable, name):
        self.runnable = runnable
        self.name = name

    async def __call__(self, state: SupervisorState):
        result = await self.runnable.ainvoke(state)
        return {"messages": result["messages"]}


chatbot_worker = Agent(chatbot_agent, "chatbot")
research_worker = Agent(research_agent, "researcher")
analytics_worker = Agent(analytics_agent, "analytics")
goal_setting_worker = Agent(goal_setting_agent, "goal_setting")
content_worker = Agent(content_agent, "content")
forum_worker = Agent(forum_agent, "forum")
motivation_worker = Agent(motivation_agent, "motivation")
strategy_worker = Agent(strategy_agent, "strategy")
vocabulary_worker = Agent(vocabulary_agent, "vocabulary")
news_worker = Agent(news_agent, "news")
support_worker = Agent(support_agent, "support")
planning_worker = Agent(planning_agent, "planning")
error_analysis_worker = Agent(error_analysis_agent, "error_analysis")
comparison_worker = Agent(comparison_agent, "comparison")
mindset_worker = Agent(mindset_agent, "mindset")
gamification_worker = Agent(gamification_agent, "gamification")
admissions_worker = Agent(admissions_agent, "admissions")

members = [
    "chatbot",
    "researcher",
    "analytics",
    "goal_setting",
    "content",
    "forum",
    "motivation",
    "strategy",
    "vocabulary",
    "news",
    "support",
    "planning",
    "error_analysis",
    "comparison",
    "mindset",
    "gamification",
    "admissions",
]
system_prompt = (
    "You are a supervisor tasked with managing a conversation between a user and a team of assistants. "
    "Each assistant is specialized in a specific area. "
    "Given the user's request, decide which agent should handle it. "
    'Each agent will respond with a summary of their work. When the user is satisfied, respond with "FINISH".'
)
options = ["FINISH"] + members
function_def = {
    "name": "route",
    "description": "Select the next agent to act.",
    "parameters": {
        "type": "OBJECT",
        "properties": {
            "next": {
                "type": "STRING",
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

genai.configure(api_key=os.environ["GEMINI_API_KEY"])
llm = genai.GenerativeModel(
    "gemini-1.5-pro-latest",
)

def _format_messages(messages: list) -> list:
    formatted_messages = []
    for msg in messages:
        if msg.type == "human":
            formatted_messages.append({"role": "user", "parts": [msg.content]})
        elif msg.type == "ai":
            formatted_messages.append({"role": "model", "parts": [msg.content]})
    return formatted_messages

def supervisor_chain(state: SupervisorState):
    messages = _format_messages(state["messages"])
    response = llm.generate_content(
        messages,
        tools=[function_def],
        tool_config={"function_calling_config": "ANY"},
    )
    tool_calls = response.candidates[0].content.parts[0].function_call
    return {"messages": [BaseMessage(type="ai", content="", tool_calls=[tool_calls])]}

workflow = StateGraph(SupervisorState)
workflow.add_node("supervisor", supervisor_chain)
workflow.add_node("chatbot", chatbot_worker)
workflow.add_node("researcher", research_worker)
workflow.add_node("analytics", analytics_worker)
workflow.add_node("goal_setting", goal_setting_worker)
workflow.add_node("content", content_worker)
workflow.add_node("forum", forum_worker)
workflow.add_node("motivation", motivation_worker)
workflow.add_node("strategy", strategy_worker)
workflow.add_node("vocabulary", vocabulary_worker)
workflow.add_node("news", news_worker)
workflow.add_node("support", support_worker)
workflow.add_node("planning", planning_worker)
workflow.add_node("error_analysis", error_analysis_worker)
workflow.add_node("comparison", comparison_worker)
workflow.add_node("mindset", mindset_worker)
workflow.add_node("gamification", gamification_worker)
workflow.add_node("admissions", admissions_worker)

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
        "analytics": "analytics",
        "goal_setting": "goal_setting",
        "content": "content",
        "forum": "forum",
        "motivation": "motivation",
        "strategy": "strategy",
        "vocabulary": "vocabulary",
        "news": "news",
        "support": "support",
        "planning": "planning",
        "error_analysis": "error_analysis",
        "comparison": "comparison",
        "mindset": "mindset",
        "gamification": "gamification",
        "admissions": "admissions",
        "FINISH": END
    },
)
workflow.add_edge("chatbot", "supervisor")
workflow.add_edge("researcher", "supervisor")
workflow.add_edge("analytics", "supervisor")
workflow.add_edge("goal_setting", "supervisor")
workflow.add_edge("content", "supervisor")
workflow.add_edge("forum", "supervisor")
workflow.add_edge("motivation", "supervisor")
workflow.add_edge("strategy", "supervisor")
workflow.add_edge("vocabulary", "supervisor")
workflow.add_edge("news", "supervisor")
workflow.add_edge("support", "supervisor")
workflow.add_edge("planning", "supervisor")
workflow.add_edge("error_analysis", "supervisor")
workflow.add_edge("comparison", "supervisor")
workflow.add_edge("mindset", "supervisor")
workflow.add_edge("gamification", "supervisor")
workflow.add_edge("admissions", "supervisor")

workflow.set_entry_point("supervisor")

supervisor_graph = workflow.compile()
