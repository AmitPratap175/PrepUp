import asyncio
from langchain_core.messages import HumanMessage
from langgraph.checkpoint.sqlite.aio import AsyncSqliteSaver
from .chatbot.graph import graph_builder
from .chatbot.settings import settings
from .chatbot.modules.speech import SpeechToText, TextToSpeech

async def _invoke_agent_async(session_id: str, message: str):
    if not message:
        return "Please provide a message."

    async with AsyncSqliteSaver.from_conn_string(settings.SHORT_TERM_MEMORY_DB_PATH) as memory:
        app = graph_builder.compile(checkpointer=memory)

        config = {"configurable": {"thread_id": session_id}}
        messages = [HumanMessage(content=message)]
        
        final_state = await app.ainvoke({"messages": messages}, config=config)

        if final_state and 'messages' in final_state and final_state['messages']:
            # The last message is the response from the AI
            last_message = final_state['messages'][-1]
            return last_message.content
        return "Sorry, I couldn't process your request."

def invoke_agent(session_id: str, message: str) -> str:
    """Invokes the LangGraph agent with the user's message and returns the response."""
    return asyncio.run(_invoke_agent_async(session_id, message))

async def _invoke_agent_with_audio_async(session_id: str, audio_data: bytes):
    speech_to_text = SpeechToText()
    text_to_speech = TextToSpeech()

    transcribed_text = await speech_to_text.transcribe(audio_data)
    response_text = await _invoke_agent_async(session_id, transcribed_text)
    audio_response = await text_to_speech.synthesize(response_text)

    return audio_response

def invoke_agent_with_audio(session_id: str, audio_data: bytes) -> bytes:
    """Invokes the LangGraph agent with the user's audio and returns an audio response."""
    return asyncio.run(_invoke_agent_with_audio_async(session_id, audio_data))