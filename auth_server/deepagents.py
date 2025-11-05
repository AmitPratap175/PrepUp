import os
import re
from typing import Literal, List, Dict, Any

# Keep your original deepagents import and usage
from deepagents import create_deep_agent

# ---- LangChain Google GenAI + Google Search imports ----
try:
    # Chat model (Gemini) integration via LangChain Google GenAI
    from langchain_google_genai.chat_models import ChatGoogleGenerativeAI
    # Google Search wrapper (community)
    from langchain_google_community.utilities.google_search import GoogleSearchAPIWrapper
    LANGCHAIN_GOOGLE_AVAILABLE = True
except Exception as e:
    LANGCHAIN_GOOGLE_AVAILABLE = False
    _import_error = e


# ---- Utility helpers ----
def _extract_urls(text: str) -> List[str]:
    """Extract unique URLs from text while preserving order."""
    if not text:
        return []
    urls = re.findall(r"https?://[^\s\)\]]+", text)
    seen = set()
    out = []
    for u in urls:
        if u not in seen:
            seen.add(u)
            out.append(u)
    return out


def _concat_messages_as_prompt(messages: List[Dict[str, str]]) -> str:
    """Fallback: flatten messages into a single prompt string."""
    parts = []
    for m in messages:
        role = m.get("role", "")
        content = m.get("content", "")
        parts.append(f"{role.upper()}:\n{content}")
    return "\n\n".join(parts)


# ---- Internet search tool using LangChain Google GenAI + Search ----
def internet_search(
    query: str,
    max_results: int = 5,
    topic: Literal["general", "news", "finance"] = "general",
    include_raw_content: bool = False,
) -> Dict[str, Any]:
    """
    Run a search using Google Search API (via LangChain wrapper) and synthesize
    the answer using Google GenAI (Gemini) via LangChain's ChatGoogleGenerativeAI.

    Returns:
      {
        "answer": <string synthesized answer including inline citations>,
        "sources": [<url1>, <url2>, ...],
        "raw_search": <raw search wrapper output, optional>
      }
    """
    if not LANGCHAIN_GOOGLE_AVAILABLE:
        raise RuntimeError(
            "LangChain Google integrations not available. "
            "Install langchain-google-genai and langchain-google-community and ensure they are importable."
        )

    # 1) Run the Google Search wrapper to get search snippets / results (k = max_results)
    try:
        search_wrapper = GoogleSearchAPIWrapper(k=max_results)
        raw_search_text = search_wrapper.run(query)
    except Exception as e:
        # surface a helpful error
        raise RuntimeError(f"GoogleSearchAPIWrapper failed: {e}")

    # 2) extract urls found in the raw search text for later sources
    found_urls = _extract_urls(raw_search_text)

    # 3) Initialize the Gemini LLM wrapper
    model_name = os.environ.get("GOOGLE_GENAI_MODEL", "gemini-2.5-pro")
    temp = float(os.environ.get("GOOGLE_GENAI_TEMPERATURE", 0.0))
    try:
        llm = ChatGoogleGenerativeAI(model=model_name, temperature=temp)
    except Exception as e:
        raise RuntimeError(f"Failed to initialize ChatGoogleGenerativeAI: {e}")

    # 4) Compose system + user messages prompting the model to synthesize an answer
    system_prompt = (
        "You are an expert research assistant. Using the provided search results below, "
        "write a clear, structured, citation-aware answer to the user's query. "
        "Use inline numeric citations [1], [2], etc., where helpful. At the end, include "
        "a 'Sources' section listing the URLs mapped to the numbers."
    )

    user_prompt = (
        f"User query:\n{query}\n\n"
        "Search results / excerpts (for context):\n"
        f"{raw_search_text}\n\n"
        "Write a helpful, self-contained answer to the user's query, referencing the search results "
        "with inline citations (e.g. [1]) and end with a Sources list mapping numbers to URLs."
    )

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]

    # 5) Call the LLM. Use several calling strategies for compatibility across LangChain versions.
    try:
        if hasattr(llm, "invoke"):
            # Some wrappers expose 'invoke' which accepts messages
            response = llm.invoke(messages)
            # try to fetch text content
            answer_text = getattr(response, "content", None) or str(response)
        else:
            # Fallback: flatten messages and call llm directly
            prompt = _concat_messages_as_prompt(messages)
            # try llm.__call__ or llm.generate-like interfaces
            try:
                answer_text = llm(prompt)
            except Exception:
                # last attempt: try predict (some LLM wrappers)
                if hasattr(llm, "predict"):
                    answer_text = llm.predict(prompt)
                else:
                    # as ultimate fallback cast to string
                    answer_text = str(prompt)
    except Exception as e:
        # If LLM call fails, still return raw_search_text so caller has sources
        return {
            "answer": None,
            "sources": found_urls,
            "raw_search": raw_search_text if include_raw_content else None,
            "error": f"LLM call failed: {e}",
        }

    # 6) Extract any URLs the model may have embedded in its output and merge with found_urls
    answer_urls = _extract_urls(answer_text)
    merged_urls = []
    for u in (answer_urls + found_urls):
        if u not in merged_urls:
            merged_urls.append(u)

    result = {
        "answer": answer_text,
        "sources": merged_urls,
    }
    if include_raw_content:
        result["raw_search"] = raw_search_text
    return result


# ---- Sub-agent prompts (researcher + critique) and main agent instructions ----
sub_research_prompt = """You are a dedicated researcher.
Your job is to gather detailed information about a single given topic (a section or subsection of the SOP).
You will be given the topic and should use the internet_search tool as needed.
Your final output (in this sub-agent) should be a comprehensive write-up of that topic (with facts, citations, structure) so that the main agent can later assemble it.
Do not combine multiple topics in one call; handle exactly what you were asked.
Focus on content accuracy, clarity, relevance to SOP style, and proper citation using [Title](URL) format.
"""

research_sub_agent = {
    "name": "research-agent",
    "description": "Conducts focused research for one section of the SOP",
    "system_prompt": sub_research_prompt,
    "tools": [internet_search],
}

sub_critique_prompt = """You are a dedicated editor and reviewer.
You will be given the draft of the SOP (in file `draft_report.md`) and the original brief (in `brief.txt`).
Your task is to review the draft and provide detailed critique covering:
- Whether each section heading is appropriate and clearly labelled
- Whether the language is consistent in tone, style, and formality appropriate for an SOP
- Whether the content in each section is sufficiently detailed (not too short or missing key elements)
- Whether the report comprehensively covers the relevant areas (context, purpose, audience, procedure, impacts, etc)
- Whether the report directly addresses the brief/question and stays on topic
- Whether the structure flows well, paragraphs are well developed (not just bullet lists), and the document is easy to understand
- If there are sections that are weak, missing or need expansion, point them out specifically
You may use the internet_search tool if you need to check facts or industry norms.
Do not rewrite the draft yourself – only critique and suggest improvements.
"""

critique_sub_agent = {
    "name": "critique-agent",
    "description": "Reviews and critiques the SOP draft",
    "system_prompt": sub_critique_prompt,
    "tools": [internet_search],
}

research_instructions = """You are an expert SOP-writer agent tasked with producing a formal Standard Operating Procedure document (SOP) tailored to the user's requirements.
Here’s your workflow:

1. First, write the original user question / brief to a file `brief.txt`.
2. Next, decompose the SOP into its logical sections (e.g., Introduction, Purpose, Scope, Procedure, Responsibilities, Documentation, Review & Monitoring, Definitions).
   Write the plan (list of sections and subsections) to `plan.txt`.
3. For each section/subsection you identified, invoke the research-agent to gather detailed content. Each call should handle exactly one section/subsection.
   Save each section’s content to a file named `section_<safe_section_name>.md`.
4. After all sections are drafted, assemble them into a unified document file `draft_report.md`. Ensure proper headings (# Title, ## Sections, ### Subsections).
5. Then invoke the critique-agent to review `draft_report.md` (using `brief.txt` as context).
   The critique-agent will return suggestions for improvements.
6. If the critique-agent reports that parts are weak or missing, go back and for each flagged subsection invoke the research-agent again (or edit the content) then update `draft_report.md`.
7. When you are satisfied that the document is fully comprehensive, polished in tone and structure, write the final SOP document to `final_report.md`.
   The document must:
   - Be in the same language as the user’s original question
   - Have a clear title, properly named sections and subsections
   - Use paragraph form writing (not just bullets), though bullets are permitted where appropriate
   - Include specific facts, figures or examples and citation links in [Title](URL) format
   - Directly answer the user’s brief and be fully self-contained
   - End with a “Sources” section listing each referenced link by number
8. Use the tools (internet_search) as needed.
9. Maintain clarity, formal tone, good structure, and assume knowledgeable but non-specialist reader.
10. You may loop through steps of draft -> critique -> revise as many times as required until quality is high.

Begin by reading the user's question, saving it to `brief.txt`, then output your plan (to be saved in `plan.txt`) to the user in markdown.
"""

# ---- Create the deep agent (unchanged usage pattern) ----
agent = create_deep_agent(
    tools=[internet_search],
    system_prompt=research_instructions,
    subagents=[research_sub_agent, critique_sub_agent],
)

# ---- Example quick test (optional) ----
if __name__ == "__main__":
    if not LANGCHAIN_GOOGLE_AVAILABLE:
        print("LangChain Google integrations not available. Please install required packages.")
    else:
        q = "How to write a Standard Operating Procedure (SOP) for chemical lab safety?"
        print("Running sample internet_search (Google Search + Google GenAI)...\n")
        res = internet_search(q, max_results=4, include_raw_content=True)
        print("Answer (truncated):\n", (res.get("answer") or "")[:1200])
        print("\nSources:\n", "\n".join(res.get("sources", [])))
