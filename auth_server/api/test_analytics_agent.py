import pytest
from unittest.mock import patch, MagicMock
from auth_server.api.supervisor import supervisor_graph
from langchain_core.messages import HumanMessage, ToolCall

@pytest.mark.django_db
@pytest.mark.asyncio
async def test_supervisor_routes_to_analytics_agent():
    """
    Tests that the supervisor correctly routes to the analytics agent
    when the user asks a question about their performance.
    """
    with patch(
        "auth_server.api.analytics_agent.get_user_performance_summary"
    ) as mock_tool:
        mock_tool.return_value = "Subject: Quant, Average Score: 85"

        session_id = "test_session_analytics"
        message = "How am I doing in Quant?"

        final_state = await supervisor_graph.ainvoke(
            {"messages": [HumanMessage(content=message)]},
            {"configurable": {"thread_id": session_id, "user_id": "test_user"}},
        )

        # The supervisor should have routed to the analytics agent
        # and the analytics agent should have called the tool.
        # The final response should be from the analytics agent.
        assert "Subject: Quant, Average Score: 85" in final_state["messages"][-1].content
