"""
FastAPI server for SOPForge.
Exposes REST endpoints for SOP generation workflow.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from src.main import get_orchestrator
from src.config import settings
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="SOPForge API",
    description="Multi-agent SOP generation system",
    version="1.0.0",
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================================
# Pydantic Models
# ============================================================================

class GenerateSOPRequest(BaseModel):
    """Request to start SOP generation."""
    user_prompt: str
    user_profile: str
    thread_id: Optional[str] = None


class SubmitFeedbackRequest(BaseModel):
    """Request to submit user feedback."""
    thread_id: str
    feedback: str


class SOPResponse(BaseModel):
    """Response containing SOP generation result."""
    status: str
    thread_id: str
    draft: Optional[str] = None
    iteration_count: Optional[int] = None
    error: Optional[str] = None


# ============================================================================
# Health & Info Endpoints
# ============================================================================

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "ok",
        "service": "SOPForge API",
        "version": "1.0.0",
    }


@app.get("/config")
async def get_config():
    """Get current configuration (non-sensitive)."""
    return {
        "checkpointer_type": settings.CHECKPOINTER_TYPE,
        "debug": settings.DEBUG,
        "max_iterations": 3,
        "research_queries_limit": 5,
    }


# ============================================================================
# SOP Generation Endpoints
# ============================================================================

@app.post("/generate", response_model=SOPResponse)
async def generate_sop(request: GenerateSOPRequest):
    """
    Start SOP generation process.
    
    Returns immediately with paused state at human review checkpoint.
    Call /submit-feedback to resume with user's decision.
    
    Request:
        - user_prompt: The user's SOP goal
        - user_profile: User's background, resume, experiences
        - thread_id: Optional (generated if not provided)
    
    Response:
        - status: "paused_at_human_review" or "error"
        - thread_id: ID for tracking this SOP generation
        - draft: Current SOP draft
    """
    
    try:
        orchestrator = get_orchestrator()
        result = orchestrator.generate_sop(
            user_prompt=request.user_prompt,
            user_profile=request.user_profile,
            thread_id=request.thread_id,
        )
        
        logger.info(f"Generated SOP for thread {result['thread_id']}")
        return SOPResponse(**result)
    
    except Exception as e:
        logger.error(f"Error generating SOP: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/submit-feedback", response_model=SOPResponse)
async def submit_feedback(request: SubmitFeedbackRequest):
    """
    Submit user feedback at human review checkpoint.
    
    Request:
        - thread_id: From the /generate response
        - feedback: "APPROVE" to accept, or revision instructions
    
    Response:
        - status: "completed" if approved, "revising" if feedback provided
        - draft: Updated SOP draft
    """
    
    try:
        orchestrator = get_orchestrator()
        result = orchestrator.submit_feedback(
            thread_id=request.thread_id,
            feedback=request.feedback,
        )
        
        logger.info(f"Processed feedback for thread {request.thread_id}")
        return SOPResponse(**result)
    
    except Exception as e:
        logger.error(f"Error processing feedback: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/draft/{thread_id}")
async def get_draft(thread_id: str):
    """Retrieve current draft for a thread."""
    try:
        orchestrator = get_orchestrator()
        draft = orchestrator.get_draft(thread_id)
        
        return {
            "thread_id": thread_id,
            "draft": draft,
        }
    
    except Exception as e:
        logger.error(f"Error retrieving draft: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# Example Usage Endpoint
# ============================================================================

@app.get("/example-usage")
async def example_usage():
    """Get example usage of the API."""
    return {
        "description": "SOPForge API usage example",
        "steps": [
            {
                "step": 1,
                "description": "Start SOP generation",
                "method": "POST /generate",
                "payload": {
                    "user_prompt": "MS in Computer Science at Stanford, focus on AI and ML",
                    "user_profile": "BS in CS from UC Berkeley, 3 years ML engineering at Google, published 2 papers on transformers",
                }
            },
            {
                "step": 2,
                "description": "Receive draft and thread_id",
                "response": {
                    "status": "paused_at_human_review",
                    "thread_id": "some-uuid",
                    "draft": "Here is the generated SOP...",
                }
            },
            {
                "step": 3,
                "description": "Submit feedback",
                "method": "POST /submit-feedback",
                "payload": {
                    "thread_id": "some-uuid",
                    "feedback": "APPROVE"
                }
            },
            {
                "step": 4,
                "description": "Or provide revision feedback",
                "payload": {
                    "thread_id": "some-uuid",
                    "feedback": "Add more detail about why Stanford specifically. Mention Prof. Christopher Manning's work."
                }
            }
        ]
    }


# ============================================================================
# Error Handlers
# ============================================================================

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """Global exception handler."""
    logger.error(f"Unhandled exception: {str(exc)}")
    return {
        "status": "error",
        "message": "Internal server error",
        "detail": str(exc) if settings.DEBUG else "An error occurred",
    }


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        app,
        host=settings.API_HOST,
        port=settings.API_PORT,
        log_level="info",
    )
