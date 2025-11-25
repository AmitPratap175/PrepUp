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
        You are an expert essay reviewer for XAT (Xavier Aptitude Test) preparation. Review this essay and provide detailed, constructive feedback.
        
        Essay Title: {title}
        
        Essay Content:
        {plain_text}
        
        Analyze and score the essay on these criteria (0-100 for each):
        
        1. STRUCTURE (0-100):
           - Clear introduction with thesis
           - Well-organized body paragraphs
           - Strong conclusion
           - Logical flow
        
        2. COHERENCE (0-100):
           - Smooth transitions between ideas
           - Consistent argument throughout
           - Clear connections between paragraphs
        
        3. ARGUMENTS (0-100):
           - Strength and validity of arguments
           - Use of evidence and examples
           - Critical thinking demonstrated
           - Depth of analysis
        
        4. LANGUAGE (0-100):
           - Grammar and syntax
           - Vocabulary richness
           - Sentence variety
           - Writing style
        
        Provide your response as JSON with this structure:
        {{
            "overall_score": <0-100>,
            "structure_score": <0-100>,
            "coherence_score": <0-100>,
            "arguments_score": <0-100>,
            "language_score": <0-100>,
            "detailed_feedback": {{
                "strengths": ["strength 1", "strength 2", ...],
                "weaknesses": ["weakness 1", "weakness 2", ...],
                "structure_analysis": "detailed analysis of structure",
                "coherence_analysis": "detailed analysis of coherence",
                "arguments_analysis": "detailed analysis of arguments",
                "language_analysis": "detailed analysis of language"
            }},
            "improvement_suggestions": [
                "specific suggestion 1",
                "specific suggestion 2",
                "specific suggestion 3",
                ...
            ]
        }}
        
        Be constructive, specific, and educational. Focus on helping the writer improve.
        """
        
        try:
            response = await self.client.aio.models.generate_content(
                model="gemini-2.0-flash-exp",
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
