import pytest
from unittest.mock import patch
from auth_server.api.supervisor import supervisor_graph
from langchain_core.messages import HumanMessage

@pytest.mark.django_db
@pytest.mark.asyncio
async def test_supervisor_routes_to_gamification_agent():
    """
    Tests that the supervisor correctly routes to the gamification agent.
    """
    with patch(
        "auth_server.api.gamification_agent.gamification_tool"
    ) as mock_tool:
        mock_tool.return_value = "Response from GamificationAgent"

        session_id = "test_session_gamification"
        message = "Test message for GamificationAgent"

        final_state = await supervisor_graph.ainvoke(
            {"messages": [HumanMessage(content=message)]},
            {"configurable": {"thread_id": session_id, "user_id": "test_user"}},
        )

        assert "Response from GamificationAgent" in final_state["messages"][-1].content
