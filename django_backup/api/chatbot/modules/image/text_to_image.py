import base64
import logging
import os
from typing import Optional
import io
from PIL import Image as PILImage

from chatbot.core.exceptions import TextToImageError
from chatbot.core.prompts import IMAGE_ENHANCEMENT_PROMPT, IMAGE_SCENARIO_PROMPT
from chatbot.settings import settings
from langchain.prompts import PromptTemplate
from langchain_core.messages import HumanMessage
from pydantic import BaseModel, Field
from langchain_google_genai import ChatGoogleGenerativeAI



class ScenarioPrompt(BaseModel):
    """Class for the scenario response"""

    narrative: str = Field(..., description="The AI's narrative response to the question")
    image_prompt: str = Field(..., description="The visual prompt to generate an image representing the scene")


class EnhancedPrompt(BaseModel):
    """Class for the text prompt"""

    content: str = Field(
        ...,
        description="The enhanced text prompt to generate an image",
    )


class TextToImage:
    """A class to handle text-to-image generation using Gemini AI."""

    REQUIRED_ENV_VARS = ["GOOGLE_API_KEY"]

    def __init__(self):
        """Initialize the TextToImage class and validate environment variables."""
        # self._validate_env_vars()
        self._gemini_client: Optional[ChatGoogleGenerativeAI] = None
        self.logger = logging.getLogger(__name__)

    def _validate_env_vars(self) -> None:
        """Validate that all required environment variables are set."""
        missing_vars = [var for var in self.REQUIRED_ENV_VARS if not os.getenv(var)]
        if missing_vars:
            raise ValueError(f"Missing required environment variables: {', '.join(missing_vars)}")

    @property
    def gemini_client(self) -> ChatGoogleGenerativeAI:
        """Get or create Gemini client instance using singleton pattern."""
        if self._gemini_client is None:
            self._gemini_client = ChatGoogleGenerativeAI(api_key=settings.GOOGLE_API_KEY,
                                                         model=settings.TTI_MODEL_NAME)
        return self._gemini_client

    async def generate_image(self, prompt: str, output_path: str = "", width: int = 1024, height: int = 768) -> bytes:
        """
        Generate an image from a prompt using Gemini AI and resize it to specified dimensions.

        Args:
            prompt (str): The text prompt for image generation.
            output_path (str): Optional path to save the generated image.
            width (int): Desired width of the output image.
            height (int): Desired height of the output image.

        Returns:
            bytes: The raw bytes of the generated (and resized) image.
        """
        if not prompt.strip():
            raise ValueError("Prompt cannot be empty")

        try:
            self.logger.info(f"Generating image for prompt: '{prompt}' (Will resize to {width}x{height})")

            # Construct the message for image generation
            message = HumanMessage(
                content=[
                    {"type": "text", "text": prompt},
                ]
            )

            # Invoke the Gemini model for image generation
            # Note: ChatGoogleGenerativeAI does not take width/height directly here.
            # It generates an image based on its internal defaults.
            # We will resize it afterward.
            response = await self.gemini_client.ainvoke( # Use ainvoke for async
                [message],
                generation_config=dict(response_modalities=["TEXT", "IMAGE"]),
            )

            # Extract the image data
            # Check if image_url exists in the first or second content block
            image_block = None
            for content_part in response.content:
                if isinstance(content_part, dict) and content_part.get("image_url"):
                    image_block = content_part
                    break

            if not image_block:
                raise TextToImageError("No image URL found in the Gemini response.")

            image_base64 = image_block.get("image_url").get("url").split(",")[-1]
            original_image_data = base64.b64decode(image_base64)
            self.logger.info(f"Original image data size: {len(original_image_data)} bytes")

            # Resize the image using Pillow
            img = PILImage.open(io.BytesIO(original_image_data))
            img_resized = img.resize((width, height), PILImage.Resampling.LANCZOS) # Use LANCZOS for quality

            # Convert resized image back to bytes
            buffered = io.BytesIO()
            img_resized.save(buffered, format="PNG") # Save as PNG or JPEG
            final_image_data = buffered.getvalue()

            if output_path and os.path.dirname(output_path): # Only save if output_path is provided and not just a filename
                os.makedirs(os.path.dirname(output_path), exist_ok=True)
                with open(output_path, "wb") as f:
                    f.write(final_image_data)
                self.logger.info(f"Image saved to {output_path} with dimensions {width}x{height}")
            elif output_path: # If output_path is just a filename, save in the current directory
                 with open(output_path, "wb") as f:
                    f.write(final_image_data)
                 self.logger.info(f"Image saved to {output_path} with dimensions {width}x{height}")


            return final_image_data

        except Exception as e:
            self.logger.error(f"Failed to generate and process image: {str(e)}")
            raise TextToImageError(f"Failed to generate image: {str(e)}") from e

    async def create_scenario(self, chat_history: list = None) -> ScenarioPrompt:
        """Creates a first-person narrative scenario and corresponding image prompt based on chat history."""
        try:
            formatted_history = "\n".join([f"{msg.type.title()}: {msg.content}" for msg in chat_history[-5:]])

            self.logger.info("Creating scenario from chat history")

            llm = ChatGoogleGenerativeAI(
                model=settings.TEXT_MODEL_NAME,
                api_key=settings.GOOGLE_API_KEY,
                temperature=0.4,
                max_retries=2,
            )

            structured_llm = llm.with_structured_output(ScenarioPrompt)

            chain = (
                PromptTemplate(
                    input_variables=["chat_history"],
                    template=IMAGE_SCENARIO_PROMPT,
                )
                | structured_llm
            )

            scenario = chain.invoke({"chat_history": formatted_history})
            self.logger.info(f"Created scenario: {scenario}")

            return scenario

        except Exception as e:
            raise TextToImageError(f"Failed to create scenario: {str(e)}") from e

    async def enhance_prompt(self, prompt: str) -> str:
        """Enhance a simple prompt with additional details and context."""
        try:
            self.logger.info(f"Enhancing prompt: '{prompt}'")

            llm = ChatGoogleGenerativeAI(
                model=settings.TEXT_MODEL_NAME,
                api_key=settings.GOOGLE_API_KEY,
                temperature=0.25,
                max_retries=2,
            )

            structured_llm = llm.with_structured_output(EnhancedPrompt)

            chain = (
                PromptTemplate(
                    input_variables=["prompt"],
                    template=IMAGE_ENHANCEMENT_PROMPT,
                )
                | structured_llm
            )

            enhanced_prompt = chain.invoke({"prompt": prompt}).content
            self.logger.info(f"Enhanced prompt: '{enhanced_prompt}'")

            return enhanced_prompt

        except Exception as e:
            raise TextToImageError(f"Failed to enhance prompt: {str(e)}") from e
