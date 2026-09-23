import logging
from email.message import EmailMessage

import aiosmtplib

from app.config.settings import settings

logger = logging.getLogger(__name__)


async def send_email(to_email: str, subject: str, body: str) -> bool:
    message = EmailMessage()
    message["From"] = settings.smtp_from_email
    message["To"] = to_email
    message["Subject"] = subject
    message.set_content(body)

    try:
        await aiosmtplib.send(
            message,
            hostname=settings.smtp_host,
            port=settings.smtp_port,
            username=settings.smtp_user or None,
            password=settings.smtp_password or None,
            start_tls=False,
        )
        return True
    except Exception:
        logger.exception("Failed to send email to %s", to_email)
        return False


async def send_verification_email(to_email: str, token: str) -> bool:
    link = f"{settings.frontend_url}/auth/verify-email?token={token}"
    body = (
        "Welcome to KyU Wellness!\n\n"
        "Please verify your email address by clicking the link below:\n\n"
        f"{link}\n\n"
        "This link expires in 24 hours.\n\n"
        "If you did not create an account, you can ignore this email.\n\n"
        "— KyU Wellness Team"
    )
    return await send_email(to_email, "Verify your KyU Wellness account", body)


async def send_crisis_alert_email(
    *,
    to_email: str,
    student_label: str,
    distress_level: str,
    message_excerpt: str,
    escalation_id: str,
    dashboard_link: str,
) -> bool:
    body = (
        "CRISIS ALERT — KyU Wellness\n\n"
        f"A student may need immediate support.\n\n"
        f"Student: {student_label}\n"
        f"Distress level: {distress_level}\n"
        f"Escalation ID: {escalation_id}\n\n"
        f"Message excerpt:\n\"{message_excerpt}\"\n\n"
        f"Review in the counselor dashboard:\n{dashboard_link}\n\n"
        "Please respond according to your campus crisis protocol.\n\n"
        "— KyU Wellness System"
    )
    return await send_email(to_email, f"[CRISIS] KyU Wellness alert — {distress_level}", body)


async def send_password_reset_email(to_email: str, token: str) -> bool:
    link = f"{settings.frontend_url}/auth/reset-password?token={token}"
    body = (
        "You requested a password reset for your KyU Wellness account.\n\n"
        "Click the link below to set a new password:\n\n"
        f"{link}\n\n"
        "This link expires in 1 hour.\n\n"
        "If you did not request this, you can safely ignore this email.\n\n"
        "— KyU Wellness Team"
    )
    return await send_email(to_email, "Reset your KyU Wellness password", body)
