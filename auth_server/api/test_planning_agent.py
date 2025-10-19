import pytest
from unittest.mock import patch
from auth_server.api.supervisor import supervisor_graph
from langchain_core.messages import HumanMessage

@pytest.mark.django_db
@pytest.mark.asyncio
async def test_supervisor_routes_to_planning_agent():
    """
    Tests that the supervisor correctly routes to the planning agent.
    """
    with patch(
        "auth_server.api.planning_agent.planning_tool"
    ) as mock_tool:
        mock_tool.return_value = "Response from PlanningAgent"

        session_id = "test_session_planning"
        message = "Test message for PlanningAgent"

        final_state = await supervisor_graph.ainvoke(
            {"messages": [HumanMessage(content=message)]},
            {"configurable": {"thread_id": session_id, "user_id": "test_user"}},
        )

        assert "Response from PlanningAgent" in final_state["messages"][-1].content
