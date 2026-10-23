"""
AgenticMarketer Backend — Transactional Email Service.
Supports asynchronous SMTP (Gmail, SendGrid, AWS SES) and Resend API.
Provides non-blocking welcome emails and password reset delivery with graceful fallbacks.
"""

import os
import smtplib
import asyncio
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
import httpx

# Configuration
SMTP_HOST = os.getenv("SMTP_HOST", "").strip()
SMTP_PORT = int(os.getenv("SMTP_PORT", "587").strip() or 587)
SMTP_USER = os.getenv("SMTP_USER", "").strip()
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "").strip()
EMAILS_FROM_EMAIL = os.getenv("EMAILS_FROM_EMAIL", SMTP_USER or "noreply@agenticmarketer.com").strip()
RESEND_API_KEY = os.getenv("RESEND_API_KEY", "").strip()


def _is_smtp_configured() -> bool:
    return bool(SMTP_HOST and SMTP_USER and SMTP_PASSWORD)


def _is_resend_configured() -> bool:
    return bool(RESEND_API_KEY)


def _send_smtp_sync(to_email: str, subject: str, html_body: str, text_body: str = "") -> bool:
    """Synchronous SMTP worker intended to run in a background thread."""
    if not _is_smtp_configured():
        print(f"[Email Service] SMTP not configured. Skipped sending email to {to_email}.")
        return False

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"AgenticMarketer <{EMAILS_FROM_EMAIL}>"
    msg["To"] = to_email

    if text_body:
        msg.attach(MIMEText(text_body, "plain", "utf-8"))
    msg.attach(MIMEText(html_body, "html", "utf-8"))

    try:
        if SMTP_PORT == 465:
            with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, timeout=12) as server:
                server.login(SMTP_USER, SMTP_PASSWORD)
                server.send_message(msg)
        else:
            with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=12) as server:
                server.ehlo()
                server.starttls()
                server.ehlo()
                server.login(SMTP_USER, SMTP_PASSWORD)
                server.send_message(msg)

        print(f"[Email Service] Successfully delivered email '{subject}' to {to_email} via SMTP.")
        return True
    except Exception as exc:
        print(f"[Email Service Warning] Failed to send email via SMTP to {to_email}: {exc}")
        return False


async def _send_resend_async(to_email: str, subject: str, html_body: str) -> bool:
    """Send transactional email using Resend REST API."""
    headers = {
        "Authorization": f"Bearer {RESEND_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "from": EMAILS_FROM_EMAIL or "onboarding@resend.dev",
        "to": [to_email],
        "subject": subject,
        "html": html_body,
    }
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post("https://api.resend.com/emails", json=payload, headers=headers)
            if resp.status_code in (200, 201):
                print(f"[Email Service] Successfully delivered email '{subject}' to {to_email} via Resend.")
                return True
            else:
                print(f"[Email Service Warning] Resend returned status {resp.status_code}: {resp.text}")
                return False
    except Exception as exc:
        print(f"[Email Service Warning] Failed to send email via Resend to {to_email}: {exc}")
        return False


async def send_email(to_email: str, subject: str, html_content: str, text_content: str = "") -> bool:
    """
    Asynchronously dispatch transactional email.
    Prefers Resend API if configured, falls back to SMTP, or logs gracefully.
    Non-blocking: will never crash caller if providers are unreachable.
    """
    if not to_email:
        return False

    if _is_resend_configured():
        return await _send_resend_async(to_email, subject, html_content)

    if _is_smtp_configured():
        return await asyncio.to_thread(_send_smtp_sync, to_email, subject, html_content, text_content)

    print(f"[Email Service Info] Simulation: Email to {to_email} ('{subject}') logged. Configure SMTP or Resend to deliver live.")
    return True


# ── High-Level Trigger Templates ─────────────────────────────────────

async def send_welcome_email(to_email: str, user_name: Optional[str] = None) -> bool:
    """Dispatched upon first registration or Google OAuth auto-creation."""
    display_name = user_name or to_email.split("@")[0].title()
    subject = "Welcome to AgenticMarketer Workspace"

    html_content = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #030712; color: #f8fafc; margin: 0; padding: 0; }}
    .container {{ max-width: 600px; margin: 30px auto; background-color: #0f172a; border: 1px solid #312e81; border-radius: 16px; overflow: hidden; }}
    .header {{ background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 32px 24px; text-align: center; }}
    .header h1 {{ margin: 0; color: #ffffff; font-size: 26px; font-weight: 800; letter-spacing: -0.5px; }}
    .content {{ padding: 32px 24px; color: #cbd5e1; line-height: 1.6; font-size: 15px; }}
    .btn {{ display: inline-block; background: #6366f1; color: #ffffff !important; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px; }}
    .features {{ background-color: #020617; border: 1px solid #1e293b; border-radius: 12px; padding: 16px; margin: 20px 0; }}
    .feature-item {{ margin: 8px 0; display: flex; align-items: center; color: #94a3b8; font-size: 13px; }}
    .footer {{ padding: 24px; text-align: center; color: #64748b; font-size: 12px; border-top: 1px solid #1e293b; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>AgenticMarketer</h1>
      <p style="margin: 6px 0 0 0; color: #c7d2fe; font-size: 14px;">Autonomous Marketing Intelligence</p>
    </div>
    <div class="content">
      <h2 style="color: #ffffff; margin-top: 0;">Welcome, {display_name}!</h2>
      <p>Your workspace on the AgenticMarketer platform is now active and ready. You have access to our collaborative 6-agent marketing intelligence mesh.</p>
      
      <div class="features">
        <div class="feature-item">✓ <strong>Autonomous Swarm:</strong> Multi-agent collaborative strategy and copy generation.</div>
        <div class="feature-item">✓ <strong>Grounding RAG:</strong> Vector store search over your private briefs and PDFs.</div>
        <div class="feature-item">✓ <strong>AI Image Synthesis:</strong> Photorealistic campaign assets powered by FLUX & Cloudflare.</div>
        <div class="feature-item">✓ <strong>Omnichannel Broadcast:</strong> Instant publishing via universal webhooks.</div>
      </div>

      <p>Log in anytime to initialize campaign directives and manage your marketing telemetry:</p>
      <div style="text-align: center; margin: 24px 0;">
        <a href="https://agenticmarketer.vercel.app/dashboard" class="btn">Launch Command Console</a>
      </div>
      <p style="font-size: 13px; color: #94a3b8;">If you did not sign up for this account, you can safely disregard this message.</p>
    </div>
    <div class="footer">
      &copy; 2026 AgenticMarketer Platform. All rights reserved.
    </div>
  </div>
</body>
</html>"""

    text_content = f"""Welcome to AgenticMarketer, {display_name}!

Your autonomous marketing intelligence workspace is ready.
Access your AI agents, campaign orchestrators, and grounding vector store at:
https://agenticmarketer.vercel.app/dashboard

— The AgenticMarketer Team"""

    return await send_email(to_email, subject, html_content, text_content)


async def send_password_reset_email(to_email: str, reset_url: str) -> bool:
    """Dispatched when a user requests a password reset."""
    subject = "Reset Your AgenticMarketer Password"

    html_content = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #030712; color: #f8fafc; margin: 0; padding: 0; }}
    .container {{ max-width: 600px; margin: 30px auto; background-color: #0f172a; border: 1px solid #312e81; border-radius: 16px; overflow: hidden; }}
    .header {{ background: #1e1b4b; padding: 28px 24px; text-align: center; border-bottom: 1px solid #312e81; }}
    .header h1 {{ margin: 0; color: #818cf8; font-size: 22px; font-weight: 700; }}
    .content {{ padding: 32px 24px; color: #cbd5e1; line-height: 1.6; font-size: 15px; }}
    .btn {{ display: inline-block; background: #6366f1; color: #ffffff !important; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 20px 0; }}
    .footer {{ padding: 20px 24px; text-align: center; color: #64748b; font-size: 12px; border-top: 1px solid #1e293b; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Security Clearance Recovery</h1>
    </div>
    <div class="content">
      <p>We received a request to reset your password for your AgenticMarketer account associated with <strong>{to_email}</strong>.</p>
      <p>Click the secure link below to reset your password. This link is valid for 1 hour.</p>
      <div style="text-align: center;">
        <a href="{reset_url}" class="btn">Reset Password</a>
      </div>
      <p style="font-size: 13px; color: #94a3b8;">If you did not request a password reset, no action is required and your account remains secure.</p>
    </div>
    <div class="footer">
      &copy; 2026 AgenticMarketer Platform Security.
    </div>
  </div>
</body>
</html>"""

    text_content = f"""Reset Your AgenticMarketer Password

A password reset request was received for {to_email}.
Use this link to reset your credentials:
{reset_url}

If you did not make this request, please disregard this email."""

    return await send_email(to_email, subject, html_content, text_content)
