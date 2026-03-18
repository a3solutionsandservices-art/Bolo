from typing import Optional, AsyncGenerator

from app.core.config import settings


SYSTEM_PROMPT_TEMPLATE = """You are a helpful AI assistant for {tenant_name}.
You answer questions based on the provided knowledge base context.
Always respond in {response_language}.
Be concise, accurate, and helpful.
If you don't know the answer from the context, say so clearly.

Context from knowledge base:
{context}"""


class RAGAgent:
    """LangChain + Pinecone RAG agent for multilingual Q&A."""

    _instance: Optional["RAGAgent"] = None
    _pinecone_client = None
    _embeddings = None

    def __init__(self) -> None:
        self._openai_client = None

    def _get_openai_client(self):
        if self._openai_client is None:
            from openai import AsyncOpenAI
            self._openai_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        return self._openai_client

    @classmethod
    def get_instance(cls) -> "RAGAgent":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def _get_embeddings(self):
        if self._embeddings is None:
            from langchain_openai import OpenAIEmbeddings

            self._embeddings = OpenAIEmbeddings(
                api_key=settings.OPENAI_API_KEY,
                model="text-embedding-3-small",
            )
        return self._embeddings

    def _get_pinecone_index(self):
        if self._pinecone_client is None:
            from pinecone import Pinecone

            pc = Pinecone(api_key=settings.PINECONE_API_KEY)
            self._pinecone_client = pc.Index(settings.PINECONE_INDEX_NAME)
        return self._pinecone_client

    def _get_vectorstore(self, namespace: str):
        from langchain_pinecone import PineconeVectorStore

        return PineconeVectorStore(
            index=self._get_pinecone_index(),
            embedding=self._get_embeddings(),
            namespace=namespace,
        )

    async def index_document(
        self,
        document_id: str,
        text: str,
        namespace: str,
        metadata: Optional[dict] = None,
    ) -> int:
        from langchain.text_splitter import RecursiveCharacterTextSplitter
        from langchain.docstore.document import Document

        splitter = RecursiveCharacterTextSplitter(
            chunk_size=500,
            chunk_overlap=50,
            separators=["\n\n", "\n", "।", ".", "!", "?", " ", ""],
        )

        chunks = splitter.split_text(text)
        docs = [
            Document(
                page_content=chunk,
                metadata={
                    "document_id": document_id,
                    "chunk_index": i,
                    **(metadata or {}),
                },
            )
            for i, chunk in enumerate(chunks)
        ]

        vectorstore = self._get_vectorstore(namespace)
        await vectorstore.aadd_documents(docs)
        return len(chunks)

    async def delete_document(self, document_id: str, namespace: str) -> None:
        index = self._get_pinecone_index()
        index.delete(filter={"document_id": document_id}, namespace=namespace)

    async def query(
        self,
        question: str,
        namespace: str,
        top_k: int = 5,
    ) -> list[dict]:
        vectorstore = self._get_vectorstore(namespace)
        results = await vectorstore.asimilarity_search_with_score(question, k=top_k)
        return [
            {
                "content": doc.page_content,
                "metadata": doc.metadata,
                "score": float(score),
            }
            for doc, score in results
        ]

    async def _build_messages(
        self,
        question: str,
        namespace: str,
        conversation_history: list[dict],
        tenant_name: str,
        response_language: str,
        system_prompt_override: Optional[str] = None,
    ) -> tuple[list[dict], list[dict]]:
        """Shared logic: retrieve context and build the OpenAI messages list."""
        sources: list[dict] = []
        if settings.PINECONE_API_KEY and settings.OPENAI_API_KEY and not system_prompt_override:
            try:
                sources = await self.query(question, namespace)
            except Exception:
                pass
        context = "\n\n".join([s["content"] for s in sources[:3]])

        if system_prompt_override:
            system_msg = system_prompt_override
        else:
            lang_display = settings.LANGUAGE_NAMES.get(response_language, response_language)
            system_msg = SYSTEM_PROMPT_TEMPLATE.format(
                tenant_name=tenant_name,
                response_language=lang_display,
                context=context if context else "No relevant context found.",
            )

        messages: list[dict] = [{"role": "system", "content": system_msg}]
        messages.extend(conversation_history[-10:])
        messages.append({"role": "user", "content": question})
        return messages, sources

    async def generate_response(
        self,
        question: str,
        namespace: str,
        conversation_history: list[dict],
        tenant_name: str,
        response_language: str = "en",
        system_prompt_override: Optional[str] = None,
    ) -> tuple[str, list[dict]]:
        if not settings.OPENAI_API_KEY:
            return (
                "I'm sorry, the AI assistant is not configured yet. Please set up an OpenAI API key.",
                [],
            )

        client = self._get_openai_client()
        messages, sources = await self._build_messages(
            question, namespace, conversation_history, tenant_name, response_language, system_prompt_override
        )

        response = await client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=messages,
            temperature=0.7,
            max_tokens=1024,
        )

        answer = response.choices[0].message.content
        return answer, sources

    async def stream_response(
        self,
        question: str,
        namespace: str,
        conversation_history: list[dict],
        tenant_name: str,
        response_language: str = "en",
    ) -> AsyncGenerator[str, None]:
        if not settings.OPENAI_API_KEY:
            yield "I'm sorry, the AI assistant is not configured yet. Please set up an OpenAI API key."
            return

        client = self._get_openai_client()
        messages, _ = await self._build_messages(
            question, namespace, conversation_history, tenant_name, response_language
        )

        stream = await client.chat.completions.create(
            model=settings.OPENAI_MODEL,
            messages=messages,
            temperature=0.7,
            max_tokens=1024,
            stream=True,
        )

        async for chunk in stream:
            delta = chunk.choices[0].delta.content
            if delta:
                yield delta


def get_rag_agent() -> RAGAgent:
    return RAGAgent.get_instance()
