import pytest
from unittest.mock import patch
from auth_server.api.supervisor import supervisor_graph
from langchain_core.messages import HumanMessage

@pytest.mark.django_db
@pytest.mark.asyncio
async def test_supervisor_routes_to_goal_setting_agent():
    """
    Tests that the supervisor correctly routes to the goal setting agent.
    """
    with patch(
        "auth_server.api.goal_setting_agent.create_study_plan"
    ) as mock_tool:
        mock_tool.return_value = "Study plan created"

        session_id = "test_session_goal_setting"
        message = "Help me create a study plan."

        final_state = await supervisor_graph.ainvoke(
            {"messages": [HumanMessage(content=message)]},
            {"configurable": {"thread_id": session_id, "user_id": "test_user"}},
        )

        assert "Study plan created" in final_state["messages"][-1].content
