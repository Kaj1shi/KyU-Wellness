from types import SimpleNamespace

from app.config.settings import settings
from app.services.llm_client import extract_message_text, ollama_native_base_url, uses_ollama


def test_extract_prefers_content():
    msg = SimpleNamespace(content="Hello", reasoning="thinking...")
    assert extract_message_text(msg) == "Hello"


def test_extract_falls_back_to_reasoning():
    msg = SimpleNamespace(content="", reasoning="Final answer from thinking model")
    assert extract_message_text(msg) == "Final answer from thinking model"


def test_extract_from_dict():
    assert extract_message_text({"content": "Hi there"}) == "Hi there"
    assert extract_message_text({"content": "", "thinking": "only thoughts"}) == "only thoughts"


def test_uses_ollama(monkeypatch):
    monkeypatch.setattr(settings, "llm_provider", "ollama")
    assert uses_ollama() is True
    monkeypatch.setattr(settings, "llm_provider", "openai")
    assert uses_ollama() is False


def test_ollama_native_base_strips_v1(monkeypatch):
    monkeypatch.setattr(settings, "ollama_base_url", "http://host.docker.internal:11435/v1")
    assert ollama_native_base_url() == "http://host.docker.internal:11435"
