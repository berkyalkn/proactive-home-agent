import os
import logging
import chromadb
from chromadb.utils import embedding_functions

logger = logging.getLogger(__name__)

class VectorDBService:
    def __init__(self):

        db_path = os.path.join(os.getcwd(), "chroma_data")
        
        self.client = chromadb.PersistentClient(path=db_path)
        
        self.embedding_fn = embedding_functions.SentenceTransformerEmbeddingFunction(
            model_name="all-MiniLM-L6-v2"
        )
        
        self.episodic_collection = self.client.get_or_create_collection(
            name="episodic_memory",
            embedding_function=self.embedding_fn,
            metadata={"hnsw:space": "cosine"}
        )
        
        self.semantic_collection = self.client.get_or_create_collection(
            name="semantic_knowledge",
            embedding_function=self.embedding_fn,
            metadata={"hnsw:space": "cosine"}
        )
        
        logger.info("[VectorDB] Persistent memory initialized successfully.")

    def add_memory(self, sql_id: str, text: str, metadata: dict = None):
        """It adds events (logs/decisions) to memory along with their SQL IDs."""

        if metadata is None:
            metadata = {}
        
        metadata["sql_id"] = str(sql_id)
        
        self.episodic_collection.add(
            documents=[text],
            metadatas=[metadata],
            ids=[f"mem_{sql_id}"]
        )
        logger.debug(f"[VectorDB] Memory saved: {text[:50]}...")

    def search_memory(self, query: str, n_results: int = 3) -> list:
        """It finds the most recent historical events related to the user's question."""

        results = self.episodic_collection.query(
            query_texts=[query],
            n_results=n_results
        )
        return results


    def add_knowledge(self, doc_id: str, text: str, metadata: dict = None):
        """It includes the house's set rules or usage guidelines."""

        if metadata is None:
            metadata = {}
            
        self.semantic_collection.add(
            documents=[text],
            metadatas=[metadata],
            ids=[f"doc_{doc_id}"]
        )
        logger.debug(f"[VectorDB] Knowledge saved: {doc_id}")

    def search_knowledge(self, query: str, n_results: int = 2) -> list:
        """Bring the guidelines or house rules related to the topic in question."""

        results = self.semantic_collection.query(
            query_texts=[query],
            n_results=n_results
        )
        return results

vector_db = VectorDBService()