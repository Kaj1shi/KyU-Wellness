"""Shared LLM client helpers for OpenAI cloud and local Ollama."""

from __future__ import annotations

from typing import Any

import httpx
from openai import AsyncOpenAI, OpenAI

from app.config.settings import settings


def uses_ollama() -> bool:
    return settings.llm_provider.lower().strip() in {"ollama", "local"}


def chat_model() -> str:
    if uses_ollama():
        return settings.ollama_model
    return settings.openai_model


def ollama_native_base_url() -> str:
    """Convert OpenAI-style .../v1 base URL to Ollama root (for /api/chat)."""
    base = settings.ollama_base_url.rstrip("/")
    if base.endswith("/v1"):
        base = base[:-3]
    return base.rstrip("/")


def get_sync_openai_client() -> OpenAI | None:
    """Return a sync client, or None if the active provider is not configured."""
    if uses_ollama():
        return OpenAI(
            api_key=settings.ollama_api_key or "ollama",
            base_url=settings.ollama_base_url,
        )
    if not settings.openai_api_key:
        return None
    return OpenAI(api_key=settings.openai_api_key)


def get_async_openai_client() -> AsyncOpenAI:
    """Return an async client for chat generation. Raises if OpenAI key missing."""
    if uses_ollama():
        return AsyncOpenAI(
            api_key=settings.ollama_api_key or "ollama",
            base_url=settings.ollama_base_url,
            timeout=300.0,
        )
    if not settings.openai_api_key:
        raise RuntimeError(
            "OpenAI API key is not configured. Set OPENAI_API_KEY, or set "
            "LLM_PROVIDER=ollama to use a local Ollama model."
        )
    return AsyncOpenAI(api_key=settings.openai_api_key)


def extract_message_text(message) -> str:
    """Read assistant text; some local models put the reply in `reasoning`."""
    if isinstance(message, dict):
        content = (message.get("content") or "").strip()
        if content:
            return content
        for key in ("reasoning", "thinking", "reasoning_content"):
            value = message.get(key)
            if isinstance(value, str) and value.strip():
                return value.strip()
        return ""

    content = (getattr(message, "content", None) or "").strip()
    if content:
        return content
    reasoning = (getattr(message, "reasoning", None) or "").strip()
    if reasoning:
        return reasoning
    # SDK may stash extra fields here depending on version
    extra = getattr(message, "model_extra", None) or {}
    if isinstance(extra, dict):
        for key in ("reasoning", "reasoning_content", "thinking"):
            value = extra.get(key)
            if isinstance(value, str) and value.strip():
                return value.strip()
    return ""


async def ollama_chat(
    messages: list[dict[str, str]],
    *,
    temperature: float = 0.6,
    num_predict: int = 350,
    think: bool = False,
) -> dict[str, Any]:
    """Call Ollama's native /api/chat (supports think=false for reasoning models)."""
    url = f"{ollama_native_base_url()}/api/chat"
    payload = {
        "model": chat_model(),
        "messages": messages,
        "stream": False,
        "think": think,
        "options": {
            "temperature": temperature,
            "num_predict": num_predict,
        },
    }
    async with httpx.AsyncClient(timeout=300.0) as client:
        response = await client.post(url, json=payload)
        response.raise_for_status()
        data = response.json()

    content = extract_message_text(data.get("message") or {})
    if not content:
        raise RuntimeError("Empty response from Ollama")

    tokens_used = None
    prompt = data.get("prompt_eval_count")
    eval_count = data.get("eval_count")
    if isinstance(prompt, int) and isinstance(eval_count, int):
        tokens_used = prompt + eval_count

    return {
        "content": content,
        "model": data.get("model") or chat_model(),
        "tokens_used": tokens_used,
        "provider": "ollama",
        "base_url": settings.ollama_base_url,
    }