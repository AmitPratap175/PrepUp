import os

from groq import Groq

client = Groq(
    api_key= "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"   #os.environ.get("GROQ_API_KEY"),
)

while True:
    question = input("You: ")
    if question == 'quit':
        break
    chat_completion = client.chat.completions.create(
        messages=[
            {
                "role": "user",
                "content": question,
            }
        ],
        model="llama-3.3-70b-versatile",
    )

    print("Bot: ",chat_completion.choices[0].message.content)
    print("="*150,'\n\n')