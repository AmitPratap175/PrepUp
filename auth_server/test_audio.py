import asyncio
from notebooklm import NotebookLMClient

async def main():
    async with await NotebookLMClient.from_storage("/home/dspratap/.notebooklm/storage_state.json") as client:
        nb = await client.notebooks.create("Test Audio Partial")
        print("Created notebook", nb.id)
        
        with open("doc1.txt", "w") as f: f.write("This is a document about dogs. Dogs are great.")
        with open("doc2.txt", "w") as f: f.write("This is a document about cats. Cats are awesome.")
        
        s1 = await client.sources.add_file(nb.id, "doc1.txt", wait=True)
        s2 = await client.sources.add_file(nb.id, "doc2.txt", wait=True)
        print("Uploaded sources:", s1.id, s2.id)
        
        print("Testing generate audio for source 1 only...")
        try:
            status = await client.artifacts.generate_audio(nb.id, source_ids=[s1.id])
            print("Success (partial)", status)
        except Exception as e:
            print("Failed (partial):", e)
            
        print("Testing generate audio for all sources...")
        try:
            status = await client.artifacts.generate_audio(nb.id)
            print("Success (all)", status)
        except Exception as e:
            print("Failed (all):", e)

if __name__ == "__main__":
    asyncio.run(main())
