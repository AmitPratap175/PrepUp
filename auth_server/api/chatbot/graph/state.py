from typing import List, Optional
from langgraph.graph import MessagesState


class AICompanionState(MessagesState):
    """State class for the AI Companion workflow.

    Extends MessagesState to track conversation history and maintains the last message received.
    """

    summary: str
    workflow: str
    audio_buffer: bytes
    image_path: str
    current_activity: str
    apply_activity: bool
    memory_context: str
    phone_number: str | None = None
    user_name: str | None = None
    passage_text: Optional[str] = None
    question_text: Optional[str] = None
    options_text: Optional[str] = None
    question_id: Optional[str] = None
    subject: Optional[str] = None