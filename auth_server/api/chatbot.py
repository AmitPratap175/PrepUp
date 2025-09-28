import json
import os
from django.conf import settings
from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document
from langchain_community.embeddings import OllamaEmbeddings

class SimpleChatbot:
    def __init__(self):
        self.documents = self._load_documents()
        self.vector_store = self._create_vector_store()

    def _load_documents(self):
        # Load the bookmarked questions and answers from the JSON file
        bookmarks_path = os.path.join(settings.BASE_DIR, "data", "bookmarks.json")
        with open(bookmarks_path, "r") as f:
            data = json.load(f)

        # Convert the FAQs into a list of Document objects
        documents = []
        for item in data["faqs"]:
            documents.append(
                Document(
                    page_content=item["question"],
                    metadata={"answer": item["answer"]},
                )
            )
        return documents

    def _create_vector_store(self):
        # Create a FAISS vector store from the documents.
        # NOTE: This implementation requires a locally running Ollama instance
        # with the 'llama2' model available.
        embeddings = OllamaEmbeddings(model="llama2")
        vector_store = FAISS.from_documents(self.documents, embedding=embeddings)
        return vector_store

    def get_answer(self, question: str) -> str:
        # Search for the most similar question in the vector store
        try:
            results = self.vector_store.similarity_search(question, k=1)
            if results:
                # Return the answer of the most similar question
                return results[0].metadata["answer"]
        except Exception as e:
            print(f"Error during similarity search: {e}")
            return "Sorry, I am having trouble finding an answer right now."

        return "Sorry, I don't have an answer for that."

chatbot_instance = SimpleChatbot()