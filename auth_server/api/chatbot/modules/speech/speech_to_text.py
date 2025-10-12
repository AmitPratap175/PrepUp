import os
import tempfile
from typing import Optional

from ...core.exceptions import SpeechToTextError
from ...settings import settings
from langchain_core.messages import HumanMessage
from langchain_google_genai import ChatGoogleGenerativeAI
import base64

class SpeechToText:
    """A class to handle speech-to-text conversion using Gemini's TTS model."""

    # Required environment variables
    REQUIRED_ENV_VARS = ["GOOGLE_API_KEY"]

    def __init__(self):
        """Initialize the SpeechToText class and validate environment variables."""
        # self._validate_env_vars()
        self._client: Optional[ChatGoogleGenerativeAI] = None
        self.audio_mime_type = "audio/mpeg"

    def _validate_env_vars(self) -> None:
        """Validate that all required environment variables are set."""
        missing_vars = [var for var in self.REQUIRED_ENV_VARS if not os.getenv(var)]
        if missing_vars:
            raise ValueError(f"Missing required environment variables: {', '.join(missing_vars)}")

    @property
    def client(self) -> ChatGoogleGenerativeAI:
        """Get or create Gemini client instance using singleton pattern."""
        if self._client is None:
            self._client = ChatGoogleGenerativeAI(api_key=settings.GOOGLE_API_KEY,
                                                  model=settings.STT_MODEL_NAME)
        return self._client

    async def transcribe(self, audio_data: bytes) -> str:
        """Convert speech to text using Gemini's TTS model.

        Args:
            audio_data: Binary audio data

        Returns:
            str: Transcribed text

        Raises:
            ValueError: If the audio file is empty or invalid
            RuntimeError: If the transcription fails
        """
        if not audio_data:
            raise ValueError("Audio data cannot be empty")

        try:
            # Create a temporary file with .wav extension
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_file:
                temp_file.write(audio_data)
                temp_file_path = temp_file.name

            try:
                # Open the temporary file for the API request
                with open(temp_file_path, "rb") as audio_file:
                    encoded_audio = base64.b64encode(audio_file.read()).decode('utf-8')
                
                message = HumanMessage(
                    content=[
                            {"type": "text", "text": "Transcribe this audio. No PREAMBLE"},
                            {"type": "media", "data": encoded_audio, "mime_type": self.audio_mime_type}
                        ]
                )
                transcription = self.client.invoke([message])

                if not transcription:
                    raise SpeechToTextError("Transcription result is empty")

                return transcription.content

            finally:
                # Clean up the temporary file
                os.unlink(temp_file_path)

        except Exception as e:
            raise SpeechToTextError(f"Speech-to-text conversion failed: {str(e)}") from e
