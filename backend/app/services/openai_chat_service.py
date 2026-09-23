from __future__ import annotations

from typing import Any

from app.config.settings import settings
from app.services.llm_client import (
    chat_model,
    extract_message_text,
    get_async_openai_client,
    ollama_chat,
    uses_ollama,
)


class OpenAIChatError(RuntimeError):
    pass


def _build_system_prompt(*, distress_level: str | None) -> str:
    crisis_line = (
        "\n\nSafety: only if the user expresses self-harm, suicide intent, or immediate danger — "
        "respond with empathy, encourage immediate help (trusted person, campus counselor, emergency services), "
        "and do NOT provide instructions or methods. "
        "Do not add counselor/emergency reminders in ordinary supportive chats."
    )

    distress_hint = ""
    if distress_level in {"low", None} or not distress_level:
        distress_hint = (
            "\n\nContext: distress seems low or the user may already feel better. "
            "Match that lighter mood. Do not lecture about waves of emotion or push professional help."
        )
    elif distress_level == "moderate":
        distress_hint = (
            "\n\nContext: moderate distress. Stay supportive and practical; "
            "mention campus support only if it fits naturally."
        )
    elif distress_level in {"high", "crisis"}:
        distress_hint = (
            f"\n\nContext: distress level = {distress_level}. Prioritize safety and grounding; "
            "encourage real-world support when needed."
        )

    return (
        "You are the KyU Wellness chat companion — a supportive mental health assistant for "
        "Kyambogo University students in Uganda. "
        "Speak in the first person as \"I\". "
        "Your product name is KyU Wellness; use that name only if the student asks who you are, "
        "or once briefly when introducing yourself. "
        "Never address the student as \"KyU Wellness\", never put \"KyU Wellness,\" after "
        "greetings like \"Oh my goodness\", and never talk to yourself by name. "
        "The person you are helping is the student — not the app. "
        "Never mention Empero AI, Qwythos, model names, creators, or that you were built by another company. "
        "You are NOT a licensed clinician. "
        "Talk like a caring, emotionally intelligent friend — natural, specific, and human — not like a hotline script. "
        "Reflect what the student actually said; use concrete details from the conversation. "
        "When they share good news or feel lighter after getting help: celebrate with them briefly, "
        "keep the tone easy and warm, and ask one natural follow-up tied to their situation "
        "(plans, rest, what helped, what’s next) — not a generic 'How are you feeling right now?'. "
        "Avoid canned phrases such as 'these waves of emotion will pass', "
        "'reaching out to a trusted person or campus counselor is always okay', "
        "'I'm here for you', or similar stock closers unless safety truly requires it. "
        "Do not end every message with a reminder about counselors or that feelings will pass. "
        "Suggest coping steps only when they still need help; if they are already okay, do not pile on advice. "
        "Avoid diagnosis, medical/legal advice, and moralizing. Keep replies concise and culturally respectful."
        f"{distress_hint}"
        f"{crisis_line}"
        "\n\nStyle: warm, specific, conversational. Prefer 2-5 short sentences. One thoughtful question at most. "
        "Good crisis opening example: \"I'm really sorry you're in so much pain right now.\" "
        "Bad example to never produce: \"Oh my goodness—KyU Wellness, I am so sorry...\""
    )


def _to_openai_messages(history: list[dict[str, str]], *, distress_level: str | None) -> list[dict[str, str]]:
    messages: list[dict[str, str]] = [{"role": "system", "content": _build_system_prompt(distress_level=distress_level)}]
    messages.extend(history)
    return messages


async def generate_assistant_reply(
    *,
    history: list[dict[str, str]],
    distress_level: str | None,
) -> dict[str, Any]:
    """
    Returns: { "content": str, "model": str | None, "tokens_used": int | None }
    """
    messages = _to_openai_messages(history, distress_level=distress_level)

    # Native Ollama API: disable hidden "think" tokens so replies return quickly.
    if uses_ollama():
        try:
            return await ollama_chat(
                messages,
                temperature=0.6,
                num_predict=350,
                think=False,
            )
        except Exception as exc:
            raise OpenAIChatError(f"Ollama chat request failed: {exc}") from exc

    try:
        client = get_async_openai_client()
    except RuntimeError as exc:
        raise OpenAIChatError(str(exc)) from exc

    try:
        resp = await client.chat.completions.create(
            model=chat_model(),
            messages=messages,
            temperature=0.6,
            max_tokens=400,
        )
    except Exception as exc:
        raise OpenAIChatError(f"OpenAI chat request failed: {exc}") from exc

    choice = resp.choices[0]
    content = extract_message_text(choice.message)
    if not content:
        raise OpenAIChatError("Empty response from chat model")

    tokens_used: int | None = None
    try:
        tokens_used = getattr(resp.usage, "total_tokens", None)
    except Exception:
        tokens_used = None

    return {
        "content": content,
        "model": getattr(resp, "model", None) or chat_model(),
        "tokens_used": tokens_used,
        "provider": "openai",
        "base_url": None,
    }
