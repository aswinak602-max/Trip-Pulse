"""
TripPulse Email Service.
Handles transactional notifications, sign-in confirmations, and password recovery emails.
Integrates with SMTP if configured, and logs gracefully in development environments.
"""

import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from typing import Optional

class EmailService:
    def __init__(self):
        self.smtp_host = os.getenv("SMTP_HOST", "")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_user = os.getenv("SMTP_USER", "")
        self.smtp_password = os.getenv("SMTP_PASSWORD", "")
        self.from_email = os.getenv("EMAILS_FROM_EMAIL", "notifications@trippulse.app")
        self.from_name = os.getenv("EMAILS_FROM_NAME", "TripPulse Team")

    def is_configured(self) -> bool:
        return bool(self.smtp_host and self.smtp_user and self.smtp_password)

    def send_welcome_email(self, recipient_email: str, recipient_name: str, auth_provider: str = "Google") -> bool:
        """
        Sends the official sign-in confirmation email to the verified user email address.
        """
        clean_email = (recipient_email or "").strip().lower()
        if not clean_email:
            return False

        name = recipient_name.strip() if recipient_name else clean_email.split("@")[0].capitalize()
        subject = "Welcome to TripPulse — Sign-in Successful"

        text_body = f"""Hi {name},

You have successfully signed in to TripPulse using your {auth_provider} account.

You can now create trips, manage itineraries, explore destinations, and use TripPulse travel tools.

If this wasn't you, please secure your {auth_provider} account.

— TripPulse Team
"""

        html_body = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 24px; }}
    .container {{ max-width: 560px; margin: 0 auto; background: #1e293b; border-radius: 16px; border: 1px solid #334155; padding: 32px; box-shadow: 0 10px 30px rgba(0,0,0,0.4); }}
    .logo {{ display: flex; align-items: center; gap: 10px; margin-bottom: 24px; }}
    .brand {{ font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; }}
    .badge {{ font-size: 11px; font-weight: 700; background: rgba(99, 102, 241, 0.25); color: #a5b4fc; padding: 3px 8px; border-radius: 6px; margin-left: 8px; }}
    h2 {{ font-size: 20px; font-weight: 700; color: #ffffff; margin-top: 0; margin-bottom: 16px; }}
    p {{ font-size: 15px; line-height: 1.6; color: #cbd5e1; margin: 12px 0; }}
    .highlight-card {{ background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 10px; padding: 16px; margin: 20px 0; }}
    .footer {{ font-size: 13px; color: #94a3b8; border-top: 1px solid #334155; margin-top: 28px; padding-top: 18px; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">
      <span class="brand">TripPulse</span>
      <span class="badge">Intelligent Travel</span>
    </div>
    
    <h2>Welcome to TripPulse!</h2>
    
    <p>Hi <strong>{name}</strong>,</p>
    
    <p>You have successfully signed in to TripPulse using your <strong>{auth_provider}</strong> account (<code>{clean_email}</code>).</p>
    
    <div class="highlight-card">
      <p style="margin: 0; font-size: 14px; color: #93c5fd;">
        ✓ Your travel dashboard is ready. You can now create trips, manage itineraries, explore destinations, and use TripPulse travel tools.
      </p>
    </div>
    
    <p style="font-size: 13px; color: #94a3b8;">
      If this wasn't you, please secure your {auth_provider} account immediately.
    </p>
    
    <div class="footer">
      — The TripPulse Team<br>
      <span style="font-size: 11px; color: #64748b;">This is an automated confirmation message.</span>
    </div>
  </div>
</body>
</html>"""

        if self.is_configured():
            try:
                msg = MIMEMultipart("alternative")
                msg["Subject"] = subject
                msg["From"] = f"{self.from_name} <{self.from_email}>"
                msg["To"] = clean_email

                part1 = MIMEText(text_body, "plain")
                part2 = MIMEText(html_body, "html")
                msg.attach(part1)
                msg.attach(part2)

                context = ssl.create_default_context()
                if self.smtp_port == 465:
                    with smtplib.SMTP_SSL(self.smtp_host, self.smtp_port, context=context) as server:
                        server.login(self.smtp_user, self.smtp_password)
                        server.sendmail(self.from_email, clean_email, msg.as_string())
                else:
                    with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                        server.starttls(context=context)
                        server.login(self.smtp_user, self.smtp_password)
                        server.sendmail(self.from_email, clean_email, msg.as_string())

                print(f"[TripPulse Email Service] Sent confirmation email to {clean_email} via SMTP.")
                return True
            except Exception as e:
                print(f"[TripPulse Email Service] Failed to send email via SMTP: {e}")
                print(f"[TripPulse Email Service] [DEV LOG] To: {clean_email} | Subject: '{subject}'")
                return False
        else:
            print(f"[TripPulse Email Service] [DEV LOG] To: {clean_email} | Subject: '{subject}'")
            print(f"[TripPulse Email Service] [DEV LOG] Body:\n{text_body}")
            return True

    def send_verification_email(self, recipient_email: str, recipient_name: str, verification_url: str) -> bool:
        """
        Sends account email verification link with token.
        """
        clean_email = (recipient_email or "").strip().lower()
        if not clean_email:
            return False

        name = recipient_name.strip() if recipient_name else clean_email.split("@")[0].capitalize()
        subject = "TripPulse Account Verification — Confirm Your Email"

        text_body = f"""Hi {name},

Thank you for creating an account on TripPulse!

Please click the link below or copy and paste it into your browser to verify your email address:
{verification_url}

If you did not create this account, please ignore this email.

— TripPulse Team
"""

        html_body = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 24px; }}
    .container {{ max-width: 560px; margin: 0 auto; background: #1e293b; border-radius: 16px; border: 1px solid #334155; padding: 32px; box-shadow: 0 10px 30px rgba(0,0,0,0.4); }}
    .brand {{ font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; }}
    .btn {{ display: inline-block; background: linear-gradient(135deg, #3b82f6, #6366f1); color: #ffffff !important; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 700; margin: 16px 0; }}
  </style>
</head>
<body>
  <div class="container">
    <div style="margin-bottom: 20px;">
      <span class="brand">TripPulse</span>
    </div>
    <h2>Verify your email address</h2>
    <p>Hi <strong>{name}</strong>,</p>
    <p>Thank you for signing up for TripPulse. Please verify your email to unlock all intelligent travel tools.</p>
    <div style="text-align: center; margin: 24px 0;">
      <a href="{verification_url}" class="btn" style="color: #ffffff;">Verify My Account</a>
    </div>
    <p style="font-size: 12px; color: #94a3b8;">Or copy and paste this link: <br><code>{verification_url}</code></p>
    <div style="margin-top: 24px; border-top: 1px solid #334155; padding-top: 16px; font-size: 12px; color: #64748b;">
      — The TripPulse Team
    </div>
  </div>
</body>
</html>"""

        if self.is_configured():
            try:
                msg = MIMEMultipart("alternative")
                msg["Subject"] = subject
                msg["From"] = f"{self.from_name} <{self.from_email}>"
                msg["To"] = clean_email

                part1 = MIMEText(text_body, "plain")
                part2 = MIMEText(html_body, "html")
                msg.attach(part1)
                msg.attach(part2)

                context = ssl.create_default_context()
                if self.smtp_port == 465:
                    with smtplib.SMTP_SSL(self.smtp_host, self.smtp_port, context=context) as server:
                        server.login(self.smtp_user, self.smtp_password)
                        server.sendmail(self.from_email, clean_email, msg.as_string())
                else:
                    with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                        server.starttls(context=context)
                        server.login(self.smtp_user, self.smtp_password)
                        server.sendmail(self.from_email, clean_email, msg.as_string())

                print(f"[TripPulse Email Service] Sent verification email to {clean_email} via SMTP.")
                return True
            except Exception as e:
                print(f"[TripPulse Email Service] Failed to send email via SMTP: {e}")
                print(f"[TripPulse Email Service] [DEV LOG] To: {clean_email} | Subject: '{subject}' | Link: {verification_url}")
                return False
        else:
            print(f"[TripPulse Email Service] [DEV LOG] To: {clean_email} | Subject: '{subject}'")
            print(f"[TripPulse Email Service] [DEV LOG] Verification URL: {verification_url}")
            return True

email_service = EmailService()
