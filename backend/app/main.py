from __future__ import annotations

from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware

from app.core.config import settings
from app.api import auth, voice, conversation, knowledge, analytics, billing, tenants, telephony


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    print(f"Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    yield
    print("Shutting down...")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI Voice Translation & Conversation Platform for Indian Languages",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=1000)

app.include_router(auth.router, prefix="/api/v1")
app.include_router(voice.router, prefix="/api/v1")
app.include_router(conversation.router, prefix="/api/v1")
app.include_router(knowledge.router, prefix="/api/v1")
app.include_router(analytics.router, prefix="/api/v1")
app.include_router(billing.router, prefix="/api/v1")
app.include_router(tenants.router, prefix="/api/v1")
app.include_router(telephony.router, prefix="/api/v1")


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "version": settings.APP_VERSION,
        "service": settings.APP_NAME,
    }


@app.get("/")
async def root():
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs": "/docs",
    }
