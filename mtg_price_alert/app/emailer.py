"""Simple SMTP email helper for sending alerts.

This module defines a ``send_email`` function that constructs a plain
text email and sends it to one or more recipients using the SMTP
credentials defined in the project configuration. The function
supports connecting to servers that require TLS (STARTTLS) such as
Gmail.
"""
from __future__ import annotations

import smtplib
from email.mime.text import MIMEText
from typing import Iterable

from .config import settings


def send_email(subject: str, body: str, recipients: Iterable[str]) -> None:
    """Send a plain text email to one or more recipients.

    Parameters
    ----------
    subject: str
        The subject line of the email.
    body: str
        The plain text body of the email.
    recipients: iterable of str
        A list or other iterable of email addresses. Each address will
        receive a copy of the message.
    """
    recipients_list = list(recipients)
    msg = MIMEText(body, "plain", "utf-8")
    msg["Subject"] = subject
    msg["From"] = settings.EMAIL_FROM
    msg["To"] = ", ".join(recipients_list)

    # Connect to the SMTP server using TLS. The caller is responsible
    # for providing valid credentials via the .env file.
    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
        server.starttls()
        if settings.SMTP_USERNAME and settings.SMTP_PASSWORD:
            server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
        server.sendmail(settings.EMAIL_FROM, recipients_list, msg.as_string())