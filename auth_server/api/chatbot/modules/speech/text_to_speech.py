import os
from typing import Optional
import base64

from ...core.exceptions import TextToSpeechError
from ...settings import settings
from google.genai import Client as TTSGenerator
from google.genai import types
import wave

# Helper function to save PCM data to a WAV file
def save_wav_file(filename: str, pcm: bytes, channels: int = 1, rate: int = 24000, sample_width: int = 2) -> None:
   """
   Saves raw PCM audio data to a WAV file.

   Args:
       filename (str): The name of the output WAV file.
       pcm (bytes): The raw PCM audio data.
       channels (int): Number of audio channels (e.g., 1 for mono, 2 for stereo).
       rate (int): Sample rate (samples per second).
       sample_width (int): Sample width in bytes (e.g., 2 for 16-bit audio).
   """
   with wave.open(filename, "wb") as wf:
      wf.setnchannels(channels)
      wf.setsampwidth(sample_width)
      wf.setframerate(rate)
      wf.writeframes(pcm)
   print(f"Audio saved to {filename}")

class TextToSpeech:
    """A class to handle text-to-speech conversion using Gemini TTS model."""

    # Required environment variables
    REQUIRED_ENV_VARS = ["GOOGLE_API_KEY"]

    def __init__(self):
        """Initialize the TextToSpeech class and validate environment variables."""
        # self._validate_env_vars()
        self._client: Optional[TTSGenerator] = None

    def _validate_env_vars(self) -> None:
        """Validate that all required environment variables are set."""
        missing_vars = [var for var in self.REQUIRED_ENV_VARS if not os.getenv(var)]
        if missing_vars:
            raise ValueError(f"Missing required environment variables: {', '.join(missing_vars)}")

    @property
    def client(self) -> TTSGenerator:
        """Get or create Gemini TTS model client instance using singleton pattern."""
        if self._client is None:
            self._client = TTSGenerator(api_key=settings.GOOGLE_API_KEY)
        return self._client

    async def synthesize(self, text: str) -> bytes:
        """Convert text to speech using Gemini TTS model.

        Args:
            text: Text to convert to speech

        Returns:
            bytes: Audio data

        Raises:
            ValueError: If the input text is empty or too long
            TextToSpeechError: If the text-to-speech conversion fails
        """
        if not text.strip():
            raise ValueError("Input text cannot be empty")

        if len(text) > 5000:  # Gemini TTS model typical limit
            raise ValueError("Input text exceeds maximum length of 5000 characters")

        try:
            audio_generator = self.client.models.generate_content(
                model=settings.TTS_MODEL_NAME,
                contents=text,
                config=types.GenerateContentConfig(
                    response_modalities=["AUDIO"],
                    speech_config=types.SpeechConfig(
                        voice_config=types.VoiceConfig(
                            prebuilt_voice_config=types.PrebuiltVoiceConfig(
                            voice_name='Kore',
                            )
                        )
                    ),
                )
            )
            audio_data = audio_generator.candidates[0].content.parts[0].inline_data.data

            # save_wav_file("sipun.wav", audio_data)
            # Convert generator to bytes
            audio_bytes = audio_data #bytes(audio_data)  #b"".join(audio_data)
            if not audio_bytes:
                raise TextToSpeechError("Generated audio is empty")

            return audio_bytes

        except Exception as e:
            raise TextToSpeechError(f"Text-to-speech conversion failed: {str(e)}") from e
