"""Security utility tests."""

from app.utils.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
    verify_token_type,
)


def test_password_hashing():
    password = "securepassword123"
    hashed = hash_password(password)
    assert hashed != password
    assert verify_password(password, hashed)
    assert not verify_password("wrongpassword", hashed)


def test_access_token():
    token = create_access_token("user-123", {"role": "student"})
    payload = decode_token(token)
    assert payload["sub"] == "user-123"
    assert verify_token_type(payload, "access")
    assert payload["role"] == "student"


def test_refresh_token():
    token = create_refresh_token("user-456")
    payload = decode_token(token)
    assert payload["sub"] == "user-456"
    assert verify_token_type(payload, "refresh")
