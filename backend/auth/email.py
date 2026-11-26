import logging
import smtplib
from email.message import EmailMessage

from app.core.config import settings

logger = logging.getLogger(__name__)


def send_otp_email(email: str, otp: str) -> None:
    """Deliver a password-reset OTP.

    Dev (no SMTP configured): log/prints the OTP so the flow is testable locally.
    Prod: set SMTP_HOST/SMTP_USERNAME/SMTP_PASSWORD/SMTP_FROM in the environment.
    Plain-text passwords are never passed to this function.
    """
    if not settings.smtp_host:
        # Explicitly allowed by the auth spec for local development only.
        print(f"[dev email] Password-reset OTP for {email}: {otp}")
        logger.info("Password-reset OTP issued for %s (dev mode, no SMTP)", email)
        return

    msg = EmailMessage()
    msg["Subject"] = "Your LMS password reset code"
    msg["From"] = settings.smtp_from or settings.smtp_username or "no-reply@localhost"
    msg["To"] = email
    msg.set_content(
        f"Your password reset code is: {otp}\n"
        f"It expires in {settings.otp_expire_minutes} minutes. "
        "If you did not request this, you can ignore this email."
    )
    with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=10) as server:
        if settings.smtp_use_tls:
            server.starttls()
        if settings.smtp_username and settings.smtp_password:
            server.login(settings.smtp_username, settings.smtp_password)
        server.send_message(msg)
