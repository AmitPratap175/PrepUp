import os
from dataclasses import dataclass
from datetime import datetime
from functools import lru_cache
from typing import List, Optional

from ....settings import settings
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, PointStruct, VectorParams
# from sentence_transformers import SentenceTransformer  # TODO: Removed old embedding model
from langchain_google_genai import GoogleGenerativeAIEmbeddings  # TODO: Added Gemini embedding model


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
    """A class to handle vector storage operations using Qdrant."""

    REQUIRED_ENV_VARS = ["QDRANT_URL", "QDRANT_API_KEY", "GOOGLE_API_KEY"]  # TODO: Added GOOGLE_API_KEY
    EMBEDDING_MODEL = "models/embedding-001"  # TODO: Changed to Gemini embedding model name
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
            self.model = GoogleGenerativeAIEmbeddings(  # TODO: Changed from SentenceTransformer to Gemini
                model=self.EMBEDDING_MODEL,
                api_key=settings.GOOGLE_API_KEY
            )
            self.client = QdrantClient(url="localhost", port=settings.QDRANT_PORT)
            self._initialized = True

    def _validate_env_vars(self) -> None:
        missing_vars = [var for var in self.REQUIRED_ENV_VARS if not os.getenv(var)]
        if missing_vars:
            raise ValueError(f"Missing required environment variables: {', '.join(missing_vars)}")

    def _collection_exists(self) -> bool:
        collections = self.client.get_collections().collections
        return any(col.name == self.COLLECTION_NAME for col in collections)

    def _create_collection(self) -> None:
        sample_embedding = self.model.embed_query("sample text")  # TODO: Changed .encode to .embed_query
        self.client.create_collection(
            collection_name=self.COLLECTION_NAME,
            vectors_config=VectorParams(
                size=len(sample_embedding),
                distance=Distance.COSINE,
            ),
        )

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

        embedding = self.model.embed_query(text)  # TODO: Changed .encode to .embed_query
        point = PointStruct(
            id=metadata.get("id", hash(text)),
            vector=embedding,
            payload={
                "text": text,
                **metadata,
            },
        )

        self.client.upsert(
            collection_name=self.COLLECTION_NAME,
            points=[point],
        )

    def search_memories(self, query: str, k: int = 5) -> List[Memory]:
        if not self._collection_exists():
            return []

        query_embedding = self.model.embed_query(query)  # TODO: Changed .encode to .embed_query
        results = self.client.search(
            collection_name=self.COLLECTION_NAME,
            query_vector=query_embedding,
            limit=k,
        )

        return [
            Memory(
                text=hit.payload["text"],
                metadata={k: v for k, v in hit.payload.items() if k != "text"},
                score=hit.score,
            )
            for hit in results
        ]


@lru_cache
def get_vector_store() -> VectorStore:
    return VectorStore()
