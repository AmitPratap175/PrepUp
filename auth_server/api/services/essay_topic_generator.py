import json
from typing import List, Dict, Any
from google import genai
from google.genai import types
import os
from dotenv import load_dotenv
load_dotenv()


class EssayTopicGenerator:
    """
    Service to generate essay topics using Google Gemini.
    """
    def __init__(self):
        self.api_key = os.environ.get("GEMINI_API_KEY")
        if not self.api_key:
            print("Warning: GEMINI_API_KEY environment variable not set")
        self.client = genai.Client(api_key=self.api_key)
    
    async def research_current_topics(self, domain: str, count: int = 5) -> List[Dict[str, Any]]:
        """
        Research current topics in a specific domain.
        
        Args:
            domain: The domain to research (science, politics, etc.)
            count: Number of topics to generate
            
        Returns:
            List of topic dictionaries
        """
        prompt = f"""
        Research and generate {count} current, relevant essay topics for XAT (Xavier Aptitude Test) preparation in the domain of {domain}.
        
        Requirements for each topic:
        - Must be current and relevant (within last 6 months)
        - Suitable for a 500-800 word analytical essay
        - Thought-provoking and suitable for management aptitude testing
        - Should test critical thinking and analytical skills
        
        For each topic, provide:
        1. title: A concise, engaging title
        2. description: 2-3 sentences describing what the essay should address
        3. context: Background information (3-4 sentences)
        4. key_points: Array of 3-5 key points that should be addressed
        5. difficulty: "easy", "medium", or "hard"
        
        Return ONLY a JSON array of topic objects. No markdown formatting.
        """
        
        # try:
        response = await self.client.aio.models.generate_content(
            model="gemini-2.5-flash-lite",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.8
            )
        )
        
        if response.text:
            text = response.text.strip()
            if text.startswith("```json"):
                text = text[7:]
            if text.startswith("```"):
                text = text[3:]
            if text.endswith("```"):
                text = text[:-3]
            text = text.strip()
            
            topics = json.loads(text)
            
            if isinstance(topics, dict) and "topics" in topics:
                topics = topics["topics"]
                
            if not isinstance(topics, list):
                print(f"Unexpected response format: {type(topics)}")
                return []
                
            return topics
        else:
            raise Exception("Empty response from Gemini")
            
        # except Exception as e:
        #     print(f"Error generating topics: {e}")
        #     raise e
    
    async def get_topic_context(self, topic_title: str) -> str:
        """
        Get detailed context for a specific topic.
        
        Args:
            topic_title: The topic title
            
        Returns:
            Detailed context string
        """
        prompt = f"""
        Provide detailed background context for this essay topic: "{topic_title}"
        
        Include:
        - Current relevance and why it matters
        - Key facts and statistics
        - Different perspectives on the issue
        - Recent developments
        
        Keep it concise (200-300 words) and informative.
        """
        
        try:
            response = await self.client.aio.models.generate_content(
                model="gemini-2.0-flash-exp",
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0.7
                )
            )
            
            return response.text if response.text else ""
            
        except Exception as e:
            print(f"Error getting context: {e}")
            return ""
