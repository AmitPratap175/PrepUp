import os

from groq import Groq

client = Groq(
    api_key= "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"   #os.environ.get("GROQ_API_KEY"),
)

chat_completion = client.chat.completions.create(
    messages=[
        {
            "role": "user",
            "content": "Explain the importance of fast language models",
        }
    ],
    model="llama-3.3-70b-versatile",
)

print(chat_completion.choices[0].message.content)