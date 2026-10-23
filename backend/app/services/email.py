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
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "").strip()
ADMIN_NAME = os.getenv("ADMIN_NAME", "Administrator").strip()
SMTP_HOST = os.getenv("SMTP_HOST", "").strip()
SMTP_PORT = int(os.getenv("SMTP_PORT", "587").strip() or 587)
SMTP_USER = os.getenv("SMTP_USER", "").strip()
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "").strip()
EMAILS_FROM_EMAIL = os.getenv("EMAILS_FROM_EMAIL", SMTP_USER or ADMIN_EMAIL or "noreply@agenticmarketer.com").strip()
RESEND_API_KEY = os.getenv("RESEND_API_KEY", "").strip()


def _is_smtp_configured() -> bool:
    return bool(SMTP_HOST and SMTP_USER and SMTP_PASSWORD)


def _is_resend_configured() -> bool:
    return bool(RESEND_API_KEY)


def _send_smtp_sync(
    to_email: str,
    subject: str,
    html_body: str,
    text_body: str = "",
    from_header: Optional[str] = None,
    reply_to: Optional[str] = None,
) -> bool:
    """Synchronous SMTP worker intended to run in a background thread."""
    if not _is_smtp_configured():
        print(f"[Email Service] SMTP not configured. Skipped sending email to {to_email}.")
        return False

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = from_header or f"{ADMIN_NAME} <{EMAILS_FROM_EMAIL}>"
    msg["To"] = to_email
    if reply_to:
        msg["Reply-To"] = reply_to

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


async def _send_resend_async(
    to_email: str,
    subject: str,
    html_body: str,
    from_header: Optional[str] = None,
    reply_to: Optional[str] = None,
) -> bool:
    """Send transactional email using Resend REST API."""
    headers = {
        "Authorization": f"Bearer {RESEND_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "from": from_header or f"{ADMIN_NAME} <{EMAILS_FROM_EMAIL or 'onboarding@resend.dev'}>",
        "to": [to_email],
        "subject": subject,
        "html": html_body,
    }
    if reply_to:
        payload["reply_to"] = reply_to

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


async def send_email(
    to_email: str,
    subject: str,
    html_content: str,
    text_content: str = "",
    from_header: Optional[str] = None,
    reply_to: Optional[str] = None,
) -> bool:
    """
    Asynchronously dispatch transactional email.
    Prefers Resend API if configured, falls back to SMTP, or logs gracefully.
    Non-blocking: will never crash caller if providers are unreachable.
    """
    if not to_email:
        return False

    if _is_resend_configured():
        return await _send_resend_async(to_email, subject, html_content, from_header=from_header, reply_to=reply_to)

    if _is_smtp_configured():
        return await asyncio.to_thread(_send_smtp_sync, to_email, subject, html_content, text_content, from_header, reply_to)

    print(f"[Email Service Info] Simulation: Email to {to_email} ('{subject}') logged from {from_header or EMAILS_FROM_EMAIL}. Configure SMTP or Resend to deliver live.")
    return True


# ── High-Level Trigger Templates ─────────────────────────────────────

async def send_welcome_email(to_email: str, user_name: Optional[str] = None) -> bool:
    """Dispatched upon first registration or Google OAuth auto-creation."""
    display_name = user_name or to_email.split("@")[0].title()
    subject = "Welcome to AgenticMarketer Workspace"
    frontend_url = os.getenv("FRONTEND_PROD_URL", "https://agentic-marketer-automated-marketin.vercel.app").rstrip("/")
    dashboard_url = f"{frontend_url}/dashboard"

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
        <a href="{dashboard_url}" class="btn">Launch Command Console</a>
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
{dashboard_url}

— The AgenticMarketer Team"""

    from_header = f"{ADMIN_NAME} <{EMAILS_FROM_EMAIL}>"
    return await send_email(to_email, subject, html_content, text_content, from_header=from_header, reply_to=EMAILS_FROM_EMAIL)


async def send_operator_invite_email(
    to_email: str,
    operator_name: str,
    role: str,
    temporary_password: str,
    admin_name: Optional[str] = None,
    admin_email: Optional[str] = None,
) -> bool:
    """Dispatched when the Super Admin invites an operator from the Admin Panel."""
    sender_name = admin_name or os.getenv("ADMIN_NAME", "Platform Administrator")
    reply_email = admin_email or os.getenv("ADMIN_EMAIL", EMAILS_FROM_EMAIL)
    frontend_url = os.getenv("FRONTEND_PROD_URL", "https://agentic-marketer-automated-marketin.vercel.app").rstrip("/")
    login_url = f"{frontend_url}/login"
    subject = f"Workspace Access Granted: Your Operator Clearance from {sender_name}"
    from_header = f"{sender_name} via AgenticMarketer <{EMAILS_FROM_EMAIL}>"
    reply_to = reply_email

    role_label = {
        "admin": "System Administrator",
        "marketer": "Growth & Campaign Marketer",
        "backend_dev": "Backend / RAG Developer",
        "frontend_dev": "Frontend UI Developer",
        "user": "Standard Operator",
    }.get(role.lower(), role.title())

    html_content = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #030712; color: #f8fafc; margin: 0; padding: 0; }}
    .container {{ max-width: 600px; margin: 30px auto; background-color: #0f172a; border: 1px solid #312e81; border-radius: 16px; overflow: hidden; }}
    .header {{ background: linear-gradient(135deg, #4338ca 0%, #6366f1 100%); padding: 32px 24px; text-align: center; }}
    .header h1 {{ margin: 0; color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }}
    .header p {{ margin: 6px 0 0 0; color: #c7d2fe; font-size: 13px; }}
    .content {{ padding: 32px 24px; color: #cbd5e1; line-height: 1.6; font-size: 15px; }}
    .badge {{ display: inline-block; background-color: #312e81; color: #a5b4fc; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }}
    .creds-box {{ background-color: #020617; border: 1px solid #1e293b; border-radius: 12px; padding: 20px; margin: 24px 0; }}
    .cred-row {{ display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #0f172a; font-size: 13px; }}
    .cred-row:last-child {{ border-bottom: none; }}
    .cred-label {{ color: #64748b; font-weight: 500; }}
    .cred-val {{ color: #f1f5f9; font-family: monospace; font-weight: 600; }}
    .btn {{ display: inline-block; background: #6366f1; color: #ffffff !important; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 12px; }}
    .footer {{ padding: 24px; text-align: center; color: #64748b; font-size: 12px; border-top: 1px solid #1e293b; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <span class="badge">Operator Clearance Invitation</span>
      <h1 style="margin-top: 8px;">AgenticMarketer Swarm Access</h1>
      <p>Autonomous Marketing Intelligence Console</p>
    </div>
    <div class="content">
      <h2 style="color: #ffffff; margin-top: 0; font-size: 18px;">Hello, {operator_name}!</h2>
      <p>You have been officially invited and provisioned by Administrator <strong>{sender_name}</strong> (<a href="mailto:{reply_email}" style="color: #818cf8;">{reply_email}</a>) to join the <strong>AgenticMarketer</strong> workspace.</p>

      <div class="creds-box">
        <div style="font-size: 11px; font-weight: 700; color: #818cf8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px;">Your Workspace Credentials</div>
        <div class="cred-row">
          <span class="cred-label">Authorized Email:</span>
          <span class="cred-val">{to_email}</span>
        </div>
        <div class="cred-row">
          <span class="cred-label">Assigned Clearance:</span>
          <span class="cred-val">{role_label}</span>
        </div>
        <div class="cred-row">
          <span class="cred-label">Temporary Access Key:</span>
          <span class="cred-val" style="color: #38bdf8;">{temporary_password}</span>
        </div>
        <div class="cred-row">
          <span class="cred-label">Provisioned By:</span>
          <span class="cred-val">{sender_name} ({reply_email})</span>
        </div>
      </div>

      <p style="font-size: 13px; color: #94a3b8;">
        Click the link below to initialize your operator terminal. You can change your password at any time inside your workspace settings.
      </p>

      <div style="text-align: center; margin: 24px 0;">
        <a href="{login_url}" class="btn">Access Command Console</a>
      </div>

      <p style="font-size: 12px; color: #64748b;">
        If you have questions regarding this invitation, you can reply directly to this email to reach {sender_name} at {reply_email}.
      </p>
    </div>
    <div class="footer">
      &copy; 2026 AgenticMarketer Platform Security. Sent on behalf of {sender_name} ({reply_email}).
    </div>
  </div>
</body>
</html>"""

    text_content = f"""Hello {operator_name},

You have been invited by Administrator {sender_name} ({reply_email}) to join the AgenticMarketer workspace.

Your Operator Credentials:
- Workspace Email: {to_email}
- Clearance Role: {role_label}
- Temporary Password: {temporary_password}
- Console URL: {login_url}

Please sign in and change your password. You can reply directly to this email to contact {sender_name}.

— AgenticMarketer Command Console"""

    return await send_email(
        to_email,
        subject,
        html_content,
        text_content,
        from_header=from_header,
        reply_to=reply_to,
    )


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
