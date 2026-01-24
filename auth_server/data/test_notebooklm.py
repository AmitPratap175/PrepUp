import asyncio
from notebooklm import NotebookLMClient
from pathlib import Path
from enum import Enum

class QuizQuantity(Enum):
    FEWER = 1
    STANDARD = 2
    MORE = 3

class QuizDifficulty(Enum):
    EASY = 1
    MEDIUM = 2
    HARD = 3

async def main():
    async with await NotebookLMClient.from_storage("/home/dspratap/.notebooklm/storage_state.json") as client:
        # Create notebook and add sources
        nb = await client.notebooks.create("Research on Polity")
        await client.sources.add_file(nb.id, Path("/home/dspratap/Downloads/PrepUp/auth_server/data/HistoricalUnderpinnings.pdf"), wait=True)

        # Chat with your sources
        result = await client.chat.ask(nb.id, "Summarize this")
        print(result.answer)

        # # Generate content (podcast, video, quiz, etc.)
        # status = await client.artifacts.generate_audio(nb.id, instructions="make it fun")
        # await client.artifacts.wait_for_completion(nb.id, status.task_id)
        # await client.artifacts.download_audio(nb.id, "podcast.mp3")

        # Generate quiz and download as JSON
        status = await client.artifacts.generate_quiz(
            nb.id,
            instructions="""
Act as a strict Union Public Service Commission (UPSC) paper setter. Your goal is to exhaustively test my knowledge of the uploaded document by generating a high-volume Question Bank (at least 50 questions).
Using ONLY the information provided in this document, generate questions in the following specific UPSC formats:

**1. The 'Statement-Based' Trap (20 Questions):**

Create questions with 2-3 statements (e.g., 'Consider the following statements regarding [Topic]...').
Intentionally include common UPSC traps: swap dates, change 'Constitutional' to 'Statutory', or use extreme words like 'only', 'always', or 'mandatorily' to test precision.
Options must be: (a) 1 only, (b) 2 only, (c) Both 1 and 2, (d) Neither 1 nor 2.

**2. Chronology & Sequencing (10 Questions):**

Select 4 events, acts, or steps mentioned in the text and ask to arrange them in correct chronological order.

**3. Match the Following (10 Questions):**

Create pairs matching specific terms, personalities, committees, or articles with their correct descriptions or years.

**4. Assertion-Reasoning (5 Questions):**

Provide two statements: an Assertion (A) and a Reason (R). Ask if both are true and if R is the correct explanation of A.

**5. Rapid Fire Fact-Check (15 Questions):**

Direct questions focusing on specific numbers, data points, 'First' occurrences, and definitions mentioned in the text.

**Output Rules:**

Do not summarize. Go straight to the questions.
Cover the entire document from the first page to the last, ensuring no small fact or footnote is ignored.
Answer Key: Provide a separate Answer Key at the very end. For every answer, provide a brief 'Explanation' citing the specific logic or fact from the text.
""",
            quantity=QuizQuantity.MORE,    # FEWER, STANDARD
            difficulty=QuizDifficulty.HARD,  # EASY, MEDIUM, HARD
            # language="en"
            )
        await client.artifacts.wait_for_completion(nb.id, status.task_id)
        await client.artifacts.download_quiz(nb.id, "quiz.json", output_format="json")

        # # Generate mind map and export
        # result = await client.artifacts.generate_mind_map(nb.id)
        # await client.artifacts.download_mind_map(nb.id, "mindmap.json")

asyncio.run(main())