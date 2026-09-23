"""Initial schema

Revision ID: 001_initial
Revises:
Create Date: 2026-06-27
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    user_role = postgresql.ENUM(
        "student", "guest", "counselor", "admin", name="user_role", create_type=False
    )
    assessment_type = postgresql.ENUM(
        "phq9", "gad7", "stress", name="assessment_type", create_type=False
    )
    severity_level = postgresql.ENUM(
        "low", "moderate", "high", name="severity_level", create_type=False
    )
    distress_level = postgresql.ENUM(
        "low", "moderate", "high", "crisis", name="distress_level", create_type=False
    )
    message_sender = postgresql.ENUM(
        "user", "assistant", "system", name="message_sender", create_type=False
    )
    escalation_distress_level = postgresql.ENUM(
        "low", "moderate", "high", "crisis", name="escalation_distress_level", create_type=False
    )
    escalation_status = postgresql.ENUM(
        "open", "acknowledged", "resolved", name="escalation_status", create_type=False
    )
    notification_type = postgresql.ENUM(
        "crisis_alert", "system", "reminder", name="notification_type", create_type=False
    )

    bind = op.get_bind()
    user_role.create(bind, checkfirst=True)
    assessment_type.create(bind, checkfirst=True)
    severity_level.create(bind, checkfirst=True)
    distress_level.create(bind, checkfirst=True)
    message_sender.create(bind, checkfirst=True)
    escalation_distress_level.create(bind, checkfirst=True)
    escalation_status.create(bind, checkfirst=True)
    notification_type.create(bind, checkfirst=True)

    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=True),
        sa.Column("password_hash", sa.String(length=255), nullable=True),
        sa.Column("role", user_role, nullable=False),
        sa.Column("is_anonymous", sa.Boolean(), nullable=False),
        sa.Column("email_verified", sa.Boolean(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("privacy_consent", sa.Boolean(), nullable=False),
        sa.Column("age", sa.Integer(), nullable=True),
        sa.Column("gender", sa.String(length=50), nullable=True),
        sa.Column("faculty", sa.String(length=100), nullable=True),
        sa.Column("year_of_study", sa.Integer(), nullable=True),
        sa.Column("nickname", sa.String(length=100), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
    )
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)

    op.create_table(
        "email_tokens",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("token", sa.String(length=255), nullable=False),
        sa.Column("token_type", sa.String(length=50), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("used", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("token"),
    )
    op.create_index(op.f("ix_email_tokens_token"), "email_tokens", ["token"], unique=True)

    op.create_table(
        "assessments",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("assessment_type", assessment_type, nullable=False),
        sa.Column("responses", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("score", sa.Integer(), nullable=False),
        sa.Column("severity", severity_level, nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_assessments_user_id"), "assessments", ["user_id"], unique=False)

    op.create_table(
        "chat_sessions",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_chat_sessions_user_id"), "chat_sessions", ["user_id"], unique=False)

    op.create_table(
        "mood_entries",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("mood_score", sa.Integer(), nullable=False),
        sa.Column("mood_label", sa.String(length=50), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_mood_entries_user_id"), "mood_entries", ["user_id"], unique=False)

    op.create_table(
        "daily_checkins",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("energy_level", sa.Integer(), nullable=False),
        sa.Column("stress_level", sa.Integer(), nullable=False),
        sa.Column("sleep_quality", sa.Integer(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_daily_checkins_user_id"), "daily_checkins", ["user_id"], unique=False)

    op.create_table(
        "journal_entries",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=True),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_journal_entries_user_id"), "journal_entries", ["user_id"], unique=False)

    op.create_table(
        "feedback",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("rating", sa.Integer(), nullable=True),
        sa.Column("comment", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_feedback_user_id"), "feedback", ["user_id"], unique=False)

    op.create_table(
        "appointment_requests",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("preferred_date", sa.String(length=50), nullable=True),
        sa.Column("reason", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=50), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_appointment_requests_user_id"), "appointment_requests", ["user_id"], unique=False
    )

    op.create_table(
        "chat_messages",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("session_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("sender", message_sender, nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["session_id"], ["chat_sessions.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_chat_messages_session_id"), "chat_messages", ["session_id"], unique=False)

    op.create_table(
        "notifications",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("notification_type", notification_type, nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("read", sa.Boolean(), nullable=False),
        sa.Column("metadata", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_notifications_user_id"), "notifications", ["user_id"], unique=False)

    op.create_table(
        "escalations",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("message_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("level", escalation_distress_level, nullable=False),
        sa.Column("status", escalation_status, nullable=False),
        sa.Column("distress_snapshot", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("counselor_notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["message_id"], ["chat_messages.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_escalations_user_id"), "escalations", ["user_id"], unique=False)

    op.create_table(
        "distress_results",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("message_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("level", distress_level, nullable=False),
        sa.Column("indicators", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("rule_matches", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("ai_analysis", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["message_id"], ["chat_messages.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("message_id"),
    )
    op.create_index(
        op.f("ix_distress_results_message_id"), "distress_results", ["message_id"], unique=True
    )


def downgrade() -> None:
    op.drop_table("distress_results")
    op.drop_table("escalations")
    op.drop_table("notifications")
    op.drop_table("chat_messages")
    op.drop_table("appointment_requests")
    op.drop_table("feedback")
    op.drop_table("journal_entries")
    op.drop_table("daily_checkins")
    op.drop_table("mood_entries")
    op.drop_table("chat_sessions")
    op.drop_table("assessments")
    op.drop_table("email_tokens")
    op.drop_table("users")

    bind = op.get_bind()
    for enum_name in [
        "notification_type",
        "escalation_status",
        "escalation_distress_level",
        "message_sender",
        "distress_level",
        "severity_level",
        "assessment_type",
        "user_role",
    ]:
        sa.Enum(name=enum_name).drop(bind, checkfirst=True)
