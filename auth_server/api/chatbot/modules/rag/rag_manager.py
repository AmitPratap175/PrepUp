import logging
from typing import List

from ..memory.long_term.vector_store import get_vector_store
from ...settings import settings


class RAGManager:
    """Manages the Retrieval-Augmented Generation process."""

    def __init__(self):
        self.logger = logging.getLogger(__name__)
        self.vector_store = get_vector_store()

    def get_relevant_documents(self, query: str) -> List[str]:
        """Retrieve relevant document chunks from the vector store."""
        document_filter = {"must": [{"key": "source", "match": {"value": "document"}}]}
        results = self.vector_store.search_memories(
            query, k=settings.RAG_TOP_K, filter=document_filter
        )
        self.logger.info(f"Retrieved {len(results)} document chunks for RAG.")
        return [memory.text for memory in results]

    def format_context(self, documents: List[str]) -> str:
        """Format the document chunks into a single context string."""
        return "\n\n---\n\n".join(documents)


def get_rag_manager() -> RAGManager:
    """Get a RAGManager instance."""
    return RAGManager()
