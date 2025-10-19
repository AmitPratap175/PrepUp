from langchain_core.tools import tool
from django.contrib.auth import get_user_model
from auth_server.api.models import TestSession
from asgiref.sync import sync_to_async
import pandas as pd

User = get_user_model()

@tool
async def get_user_performance_summary(user_id: str) -> str:
    """
    Retrieves a summary of a user's performance from the database.

    Args:
        user_id: The ID of the user to retrieve performance data for.

    Returns:
        A string containing a summary of the user's performance,
        or an error message if the user is not found or has no test sessions.
    """
    try:
        user = await sync_to_async(User.objects.get)(id=user_id)
        sessions = await sync_to_async(list)(TestSession.objects.filter(user=user))

        if not sessions:
            return "No test sessions found for this user."

        data = {
            "Subject": [s.subject for s in sessions],
            "Score": [s.score for s in sessions],
            "Correct Answers": [s.correct_answers for s in sessions],
            "Total Questions": [s.total_questions for s in sessions],
            "Start Time": [s.start_time for s in sessions],
        }
        df = pd.DataFrame(data)

        if df.empty:
            return "No performance data available for this user."

        summary = (
            df.groupby("Subject")
            .agg(
                average_score=("Score", "mean"),
                total_correct=("Correct Answers", "sum"),
                total_questions=("Total Questions", "sum"),
                tests_taken=("Score", "size"),
            )
            .reset_index()
        )
        summary["accuracy"] = (
            summary["total_correct"] / summary["total_questions"]
        ) * 100

        return summary.to_string()

    except User.DoesNotExist:
        return f"User with id {user_id} not found."
    except Exception as e:
        return f"An error occurred: {e}"
