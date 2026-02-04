import json
from typing import Dict, Any
from google import genai
from google.genai import types
import os
import re


class EssayReviewer:
    """
    Service to review essays using Google Gemini.
    """
    def __init__(self):
        self.api_key = os.environ.get("GEMINI_API_KEY")
        self.client = genai.Client(api_key=self.api_key)
    
    async def analyze_essay(self, title: str, content: str) -> Dict[str, Any]:
        """
        Analyze an essay and provide comprehensive feedback.
        
        Args:
            title: Essay title
            content: Essay content (HTML)
            
        Returns:
            Dictionary with scores and feedback
        """
        # Strip HTML tags for analysis
        plain_text = self._strip_html(content)
        
        prompt = f"""
        You are an expert UPSC Civil Services Essay reviewer. Review this essay and provide detailed, constructive feedback based on the official UPSC evaluation standards and the "Components of a Good Essay".
        
        Essay Title: {title}
        
        Essay Content:
        {plain_text}
        
        Analyze and score the essay on these 7 criteria (0-100 for each):
        
        1. CONTENT & DIMENSIONS (High Weight):
           - Multidimensionality: Does it cover diverse angles (Social, Political, Economic, Environmental, Historical, Ethical)?
           - Depth: Is there deep analysis rather than just superficial points?
           - Relevance: Do the arguments stick closely to the subject without digressing?
        
        2. STRUCTURE & ORGANIZATION (High Weight):
           - Thesis Statement: Is there a clear thesis after the intro outlining the essay's direction?
           - Orderly Fashion: Are ideas arranged logically? (e.g., Past -> Present -> Future or Problem -> Solution)
           - Paragraphing: Does each paragraph deal with **one major sub-topic**?
        
        3. FLOW & CONNECTIVITY (Medium Weight):
           - Inter-paragraph Coherence: Are there **link sentences** or questions at the end of paragraphs to transition to the next?
           - Connectives: Use of words like *However, Moreover, Consequently* to link ideas within paragraphs.
        
        4. EVIDENCE & SUBSTANTIATION (Medium Weight):
           - Data & Facts: Use of specific reports, indices, or statistics to back arguments.
           - Examples: Real-life anecdotes, historical events, or current affairs.
           - Book References: Citing ideas from well-known books to demonstrate depth of reading.
        
        5. INTRODUCTION (Critical):
           - Hook: Does it start with a story, quote, startling fact, or context to engage the reader immediately?
           - Length: Is it concise (approx. 120-150 words)?
        
        6. CONCLUSION (Critical):
           - Echoing: Does it revisit the intro or thesis to provide closure?
           - Futuristic/Solution-Oriented: Does it end on a positive, problem-solving note?
           - Length: Approx. 200-250 words.
        
        7. LANGUAGE & PRESENTATION (Low/Medium Weight):
           - Clarity: Is the language simple and exact? Avoid complex jargon.
           - Conciseness: Are sentences short and direct?
           - Visuals: Use of subheadings or diagrams where appropriate to improve presentation.
        
        Provide your response as JSON with this structure:
        {{
            "overall_score": <0-100>,
            "content_score": <0-100>,
            "structure_score": <0-100>,
            "coherence_score": <0-100>,
            "evidence_score": <0-100>,
            "intro_score": <0-100>,
            "conclusion_score": <0-100>,
            "language_score": <0-100>,
            "detailed_feedback": {{
                "strengths": ["strength 1", "strength 2", ...],
                "weaknesses": ["weakness 1", "weakness 2", ...],
                "content_analysis": "Detailed analysis of dimensions, depth, and relevance.",
                "structure_analysis": "Detailed analysis of thesis, order, and paragraphing.",
                "coherence_analysis": "Detailed analysis of transitions and connectives.",
                "evidence_analysis": "Detailed analysis of data, examples, and references.",
                "intro_analysis": "Analysis of the hook and introductory bridge.",
                "conclusion_analysis": "Analysis of the echoing and futuristic vision.",
                "language_analysis": "Analysis of clarity and presentation."
            }},
            "improvement_suggestions": [
                "specific suggestion 1",
                "specific suggestion 2",
                "specific suggestion 3",
                ...
            ]
        }}
        
        Be constructive, specific, and educational. Use the terminology from the criteria above (e.g., "The essay lacks multidimensionality...", "The connectivity between paragraphs is strong...").
        """
        
        try:
            response = await self.client.aio.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.7
                )
            )
            
            if response.text:
                review_data = json.loads(response.text)
                return review_data
            else:
                print("Empty response from Gemini")
                return self._default_review()
                
        except Exception as e:
            print(f"Error reviewing essay: {e}")
            return self._default_review()
    
    def _strip_html(self, html_content: str) -> str:
        """
        Strip HTML tags from content.
        
        Args:
            html_content: HTML string
            
        Returns:
            Plain text
        """
        # Simple HTML tag removal
        clean = re.compile('<.*?>')
        text = re.sub(clean, '', html_content)
        # Replace HTML entities
        text = text.replace('&nbsp;', ' ')
        text = text.replace('&amp;', '&')
        text = text.replace('&lt;', '<')
        text = text.replace('&gt;', '>')
        return text.strip()
    
    def _default_review(self) -> Dict[str, Any]:
        """
        Return a default review structure in case of errors.
        """
        return {
            "overall_score": 0,
            "structure_score": 0,
            "coherence_score": 0,
            "arguments_score": 0,
            "language_score": 0,
            "detailed_feedback": {
                "strengths": [],
                "weaknesses": ["Unable to generate review at this time"],
                "structure_analysis": "Review unavailable",
                "coherence_analysis": "Review unavailable",
                "arguments_analysis": "Review unavailable",
                "language_analysis": "Review unavailable"
            },
            "improvement_suggestions": ["Please try submitting again"]
        }
