#!/usr/bin/env python3
"""Promote a registered user to counselor or admin.

Usage (from repo root, with DATABASE_URL set or backend/.env present):

  cd backend && source venv/bin/activate
  python ../scripts/promote_user.py --email you@example.com --role counselor

Or with Docker Postgres:

  DATABASE_URL=postgresql://postgres:postgres@localhost:5432/mental_health_db \\
    python scripts/promote_user.py --email you@example.com --role admin
"""

from __future__ import annotations

import argparse
import os
import sys

# Allow importing app when run from repo root or backend/
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
BACKEND = os.path.join(ROOT, "backend")
sys.path.insert(0, BACKEND)
os.chdir(BACKEND)

from app.config.database import SessionLocal  # noqa: E402
from app.services import admin_service  # noqa: E402


def main() -> int:
    parser = argparse.ArgumentParser(description="Set a user's role")
    parser.add_argument("--email", required=True)
    parser.add_argument(
        "--role",
        required=True,
        choices=["student", "counselor", "admin"],
    )
    args = parser.parse_args()

    db = SessionLocal()
    try:
        user = admin_service.set_user_role(db, args.email, args.role)
        print(f"OK: {user.email} -> {user.role.value}")
        return 0
    except Exception as exc:
        detail = getattr(exc, "detail", str(exc))
        print(f"Error: {detail}", file=sys.stderr)
        return 1
    finally:
        db.close()


if __name__ == "__main__":
    raise SystemExit(main())
