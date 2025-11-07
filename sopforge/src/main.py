"""
SOPForge main entry point and orchestration logic.
Handles the workflow with human-in-the-loop support.
"""

import uuid
from src.models import GraphState, create_initial_state
from src.graph.builder import build_sop_graph
from src.config import settings
from langgraph.types import Command


class SOPForgeOrchestrator:
    """Main orchestrator for SOPForge workflow."""
    
    def __init__(self):
        """Initialize the orchestrator and build graph."""
        settings.validate()  # Validate required env vars
        self.graph = build_sop_graph()
    
    def generate_sop(
        self,
        user_prompt: str,
        user_profile: str,
        thread_id: str = None,
    ) -> dict:
        """
        Generate an SOP from user inputs with human-in-the-loop approval.
        
        Runs the full SOP generation pipeline and pauses at human review checkpoint.
        Call submit_feedback() after to resume with user's decision.
        
        Args:
            user_prompt: User's SOP goal (e.g., "MS in CS at Stanford, focus on AI")
            user_profile: User's background and resume
            thread_id: Optional thread ID for persistence (generated if not provided)
        
        Returns:
            Dict with status, draft, and thread_id
        """
        
        if not thread_id:
            thread_id = str(uuid.uuid4())
        
        # Create initial state
        initial_state = create_initial_state(user_prompt, user_profile)
        config = {"configurable": {"thread_id": thread_id}}
        
        print(f"\n🚀 Starting SOP generation (thread: {thread_id})...")
        print("📋 Running: Planner → Researcher → Writer → Reviewer...")
        
        try:
            # Run graph until interrupted (human_in_the_loop)
            result = self.graph.invoke(initial_state, config=config)
            
            return {
                "status": "paused_at_human_review",
                "thread_id": thread_id,
                "draft": result.get("draft", ""),
                "iteration_count": result.get("iteration_count", 0),
            }
        
        except Exception as e:
            return {
                "status": "error",
                "thread_id": thread_id,
                "error": str(e),
            }
    
    def submit_feedback(
        self,
        thread_id: str,
        feedback: str,
    ) -> dict:
        """
        Submit user feedback at human-in-the-loop checkpoint.
        
        Resumes graph execution with user's decision:
        - "APPROVE": Accept draft and end
        - Anything else: Treat as revision instructions and loop back to editor
        
        Args:
            thread_id: Thread ID from generate_sop()
            feedback: User feedback ("APPROVE" or revision instructions)
        
        Returns:
            Dict with status and final draft (if approved)
        """
        
        config = {"configurable": {"thread_id": thread_id}}
        
        try:
            # Resume with user feedback
            result = self.graph.invoke(
                Command(resume=feedback),
                config=config,
            )
            
            return {
                "status": "completed" if feedback.upper() == "APPROVE" else "revising",
                "thread_id": thread_id,
                "draft": result.get("draft", ""),
                "iteration_count": result.get("iteration_count", 0),
            }
        
        except Exception as e:
            return {
                "status": "error",
                "thread_id": thread_id,
                "error": str(e),
            }
    
    def stream_generation(
        self,
        user_prompt: str,
        user_profile: str,
        thread_id: str = None,
    ):
        """
        Stream the SOP generation process (updates only).
        
        Yields state updates as each node executes.
        Note: Still pauses at human_in_the_loop for approval.
        
        Args:
            user_prompt: User's SOP goal
            user_profile: User's background
            thread_id: Optional thread ID
        
        Yields:
            State updates as dict
        """
        
        if not thread_id:
            thread_id = str(uuid.uuid4())
        
        initial_state = create_initial_state(user_prompt, user_profile)
        config = {"configurable": {"thread_id": thread_id}}
        
        try:
            for chunk in self.graph.stream(
                initial_state,
                config=config,
                stream_mode="updates",
            ):
                yield chunk
        
        except Exception as e:
            yield {"error": str(e)}
    
    def get_draft(self, thread_id: str) -> str:
        """Retrieve current draft for a thread."""
        config = {"configurable": {"thread_id": thread_id}}
        try:
            state = self.graph.get_state(config)
            return state.values.get("draft", "")
        except Exception as e:
            return f"Error retrieving draft: {str(e)}"


# Global orchestrator instance
_orchestrator = None


def get_orchestrator() -> SOPForgeOrchestrator:
    """Get or create global orchestrator instance."""
    global _orchestrator
    if _orchestrator is None:
        _orchestrator = SOPForgeOrchestrator()
    return _orchestrator
