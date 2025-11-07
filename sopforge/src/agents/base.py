"""
Base utilities for all agents.
Handles model initialization, tool binding, and common patterns.
"""

import json
import re
from typing import Any
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import BaseMessage, HumanMessage
from src.models import GraphState, SOPForgeConfig
from src.config import settings
from src.utils.tools import TOOLS


def get_model(model_name: str, temperature: float = 0.7) -> ChatGoogleGenerativeAI:
    """
    Initialize a Google Gemini model with tool binding if needed.
    
    Args:
        model_name: Model identifier (e.g., 'gemini-2.5-flash')
        temperature: Sampling temperature (0.0-1.0)
    
    Returns:
        Initialized ChatGoogleGenerativeAI model
    """
    return ChatGoogleGenerativeAI(
        model=model_name,
        api_key=settings.GEMINI_API_KEY,
        temperature=temperature,
        max_tokens=2000,
    )


def get_model_with_tools(model_name: str, temperature: float = 0.7) -> ChatGoogleGenerativeAI:
    """
    Initialize a model with tools bound for agent use.
    
    Args:
        model_name: Model identifier
        temperature: Sampling temperature
    
    Returns:
        Model with tools bound
    """
    model = get_model(model_name, temperature)
    return model.bind_tools(TOOLS)


def extract_json_from_response(response_text: str) -> dict:
    """
    Extract JSON object from LLM response.
    Handles cases where model wraps JSON in markdown or text.
    
    Args:
        response_text: Raw model response
    
    Returns:
        Parsed JSON object
    
    Raises:
        ValueError: If no valid JSON found
    """
    # Try direct parse first
    try:
        return json.loads(response_text)
    except json.JSONDecodeError:
        pass
    
    # Try extracting from markdown code blocks
    json_match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", response_text, re.DOTALL)
    if json_match:
        try:
            return json.loads(json_match.group(1))
        except json.JSONDecodeError:
            pass
    
    # Try finding raw JSON object
    json_match = re.search(r"\{.*\}", response_text, re.DOTALL)
    if json_match:
        try:
            return json.loads(json_match.group(0))
        except json.JSONDecodeError:
            pass
    
    raise ValueError(f"Could not extract valid JSON from response: {response_text[:200]}")


def format_state_for_context(state: GraphState) -> str:
    """
    Format relevant parts of state for LLM context in prompts.
    
    Args:
        state: Current graph state
    
    Returns:
        Formatted context string
    """
    context = f"""
## User Information
**Goal:** {state['user_prompt']}

**Profile:**
{state['user_profile']}
"""
    
    if state['research_findings']:
        context += f"""
## Research Findings
{state['research_findings']}
"""
    
    if state['draft']:
        context += f"""
## Current Draft
{state['draft']}
"""
    
    if state['review_notes']:
        context += f"""
## Review Feedback
{state['review_notes']}
"""
    
    return context


def safe_invoke_model(
    model: ChatGoogleGenerativeAI,
    prompt: str,
    system_message: str = "",
) -> str:
    """
    Safely invoke model with error handling.
    
    Args:
        model: LLM to invoke
        prompt: User/input prompt
        system_message: Optional system message/instructions
    
    Returns:
        Model response text
    
    Raises:
        RuntimeError: If model invocation fails
    """
    try:
        messages = []
        if system_message:
            messages.append({"role": "system", "content": system_message})
        messages.append({"role": "user", "content": prompt})
        
        response = model.invoke(messages)
        return response.content if hasattr(response, 'content') else str(response)
    
    except Exception as e:
        raise RuntimeError(f"Model invocation failed: {str(e)}")
