import os
import json
from google import genai
from google.genai import types

class ModelAnswerGenerator:
    """
    Service to generate model answers for UPSC essays using Gemini.
    """
    def __init__(self):
        self.api_key = os.environ.get("GEMINI_API_KEY")
        self.client = genai.Client(api_key=self.api_key)

    async def generate_model_answer(self, topic: str, context: str = "") -> str:
        """
        Generates a comprehensive model answer for a given topic.

        Args:
            topic: The essay topic.
            context: Optional context (e.g., PIB summary or reading material).

        Returns:
            A string containing the markdown-formatted model answer.
        """
        prompt = f"""
        You are an expert UPSC Civil Services Essay mentor and writer. Write a "Model Answer" for the following essay topic, strictly adhering to the architectural blueprint provided below.

        Topic: "{topic}"
        Context (if any): {context}

        ### Model Answer Framework
        A Model Answer must follow this architectural blueprint:

        #### I. Pre-Writing Phase (Include this as a "Strategy Note" at the start)
        *   **Brainstorming:** Briefly list the key dimensions (Social, Political, Economic, etc.) generated via "Brain Dump" or "Abstraction/Inversion".
        *   **Rough Outline:** Show the logical flow of the essay.

        #### II. The Introduction (120-150 Words)
        *   **The Hook:** Start with a Story, Quote, or Startling Fact.
        *   **The Bridge:** Connect the hook to the main topic.
        *   **The Thesis Statement:** Explicitly state the stand and provide a "roadmap".
        *   *Model Phrase:* "In this essay, we will analyze [Topic] through the lens of [Lens 1] and [Lens 2], while exploring potential solutions."

        #### III. The Main Body (The "Meat")
        *   **Structure:** Break into Dimensions (Temporal, Sectoral, etc.).
        *   **Paragraph Architecture (Apply this to every paragraph):**
            1.  **Topic Sentence:** One sub-topic.
            2.  **Expansion/Analysis:** The *why* and *how*.
            3.  **Substantiation:** Add **Data** (e.g., "According to..."), **Book References** (e.g., "As Amartya Sen argues..."), or **Examples**.
            4.  **Connectivity:** End with a **Link Sentence** or **Question** leading to the next paragraph.

        #### IV. The Conclusion (200-250 Words)
        *   **Summarize:** Briefly recap without repetition.
        *   **The Echo:** Reference the story or quote used in the Intro to create closure.
        *   **Futuristic Vision:** End on a solution-oriented, visionary note (Peak-End Rule).

        #### V. Points to Remember & Content Enhancements
        *   Add a section at the very end titled "**Points to Remember**" or "**Content Enhancements**".
        *   Include specific **Mnemonics**, **Keywords**, or **Quotes** that students can derive from this essay.

        **Format:** Use Markdown. Use bolding for key terms, authors, and data. content should be high quality and strictly relevant to UPSC standards.
        """

        try:
            response = await self.client.aio.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="text/plain",
                    temperature=0.7
                )
            )
            return response.text
        except Exception as e:
            print(f"Error generating model answer: {e}")
            return "Unable to generate model answer at this time. Please try again later."
