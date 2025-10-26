import os
from dataclasses import dataclass
from datetime import datetime
from functools import lru_cache
from typing import List, Optional

from ....settings import settings
import chromadb  # TODO: Replaced QdrantClient with ChromaDB client
# from sentence_transformers import SentenceTransformer  # TODO: Removed old embedding model
# from langchain_google_genai import GoogleGenerativeAIEmbeddings  # TODO: Removed Gemini embedding model
from fastembed import TextEmbedding  # TODO: Added FastEmbed for local embeddings


@dataclass
class Memory:
    """Represents a memory entry in the vector store."""

    text: str
    metadata: dict
    score: Optional[float] = None

    @property
    def id(self) -> Optional[str]:
        return self.metadata.get("id")

    @property
    def timestamp(self) -> Optional[datetime]:
        ts = self.metadata.get("timestamp")
        return datetime.fromisoformat(ts) if ts else None


class VectorStore:
    """A class to handle vector storage operations using ChromaDB."""

    REQUIRED_ENV_VARS = ["GOOGLE_API_KEY"]  # TODO: Kept same name for compatibility
    EMBEDDING_MODEL = "BAAI/bge-base-en-v1.5"  # TODO: Changed to FastEmbed model name
    COLLECTION_NAME = "long_term_memory"
    SIMILARITY_THRESHOLD = 0.9

    _instance: Optional["VectorStore"] = None
    _initialized: bool = False

    def __new__(cls) -> "VectorStore":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self) -> None:
        if not self._initialized:
            # self._validate_env_vars()
            self.model = TextEmbedding(model_name=self.EMBEDDING_MODEL)  # TODO: Changed from Gemini to FastEmbed
            self.client = chromadb.PersistentClient(path="./chromadb")
            self._initialized = True

    def _validate_env_vars(self) -> None:
        missing_vars = [var for var in self.REQUIRED_ENV_VARS if not os.getenv(var)]
        if missing_vars:
            raise ValueError(f"Missing required environment variables: {', '.join(missing_vars)}")

    def _collection_exists(self) -> bool:
        collections = [col.name for col in self.client.list_collections()]
        return self.COLLECTION_NAME in collections

    def _create_collection(self) -> None:
        self.client.create_collection(name=self.COLLECTION_NAME)

    def find_similar_memory(self, text: str) -> Optional[Memory]:
        results = self.search_memories(text, k=1)
        if results and results[0].score >= self.SIMILARITY_THRESHOLD:
            return results[0]
        return None

    def store_memory(self, text: str, metadata: dict) -> None:
        if not self._collection_exists():
            self._create_collection()

        similar_memory = self.find_similar_memory(text)
        if similar_memory and similar_memory.id:
            metadata["id"] = similar_memory.id

        embedding = list(self.model.embed([text]))[0]  # TODO: Changed .embed_query to FastEmbed usage
        collection = self.client.get_collection(name=self.COLLECTION_NAME)

        collection.add(
            ids=[str(metadata.get("id", hash(text)))],
            embeddings=[embedding],
            documents=[text],
            metadatas=[metadata]
        )

    def search_memories(self, query: str, k: int = 5, filter: Optional[dict] = None) -> List[Memory]:
        if not self._collection_exists():
            return []

        query_embedding = list(self.model.embed([query]))[0]  # TODO: Changed .embed_query to FastEmbed usage
        collection = self.client.get_collection(name=self.COLLECTION_NAME)

        where_clause = {}
        if filter and "must" in filter:
            conditions = []
            for condition in filter["must"]:
                key = condition.get("key")
                value = condition.get("match", {}).get("value")
                if key and value:
                    conditions.append({key: {"$eq": value}})

            if len(conditions) > 1:
                where_clause = {"$and": conditions}
            elif conditions:
                where_clause = conditions[0]

        query_args = {
            "query_embeddings": [query_embedding],
            "n_results": k,
        }
        if where_clause:
            query_args["where"] = where_clause

        results = collection.query(**query_args)

        # Convert results to Memory objects
        memories = []
        if results["documents"]:
            for i in range(len(results["documents"][0])):
                memories.append(Memory(
                    text=results["documents"][0][i],
                    metadata=results["metadatas"][0][i],
                    score=(
                        1 - results["distances"][0][i]
                        if "distances" in results and results["distances"]
                        else None
                    )
                ))
        return memories


@lru_cache
def get_vector_store() -> VectorStore:
    return VectorStore()
