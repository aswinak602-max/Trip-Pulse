"""
TripPulse Email Service.
Handles transactional notifications, sign-in confirmations, password recovery OTP emails,
and SMTP connection diagnostics with full Gmail App Password support.
"""

import smtplib
import ssl
import socket
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional, Tuple, Dict, Any

from app.core.config import settings

class EmailService:
    @property
    def smtp_host(self) -> str:
        return settings.clean_smtp_host

    @property
    def smtp_port(self) -> int:
        return settings.clean_smtp_port

    @property
    def smtp_username(self) -> str:
        return settings.clean_smtp_username

    @property
    def smtp_password(self) -> str:
        return settings.clean_smtp_password

    @property
    def from_email(self) -> str:
        return settings.clean_smtp_from

    @property
    def from_name(self) -> str:
        return settings.clean_smtp_from_name

    def is_configured(self) -> bool:
        return settings.is_smtp_configured()

    def get_smtp_status_summary(self) -> Dict[str, Any]:
        """Returns safe diagnostic information without leaking passwords."""
        has_host = bool(self.smtp_host)
        has_user = bool(self.smtp_username and "@" in self.smtp_username)
        has_pwd = bool(self.smtp_password and not settings.is_smtp_password_placeholder())
        is_ready = self.is_configured()

        return {
            "smtp_host": self.smtp_host,
            "smtp_port": self.smtp_port,
            "smtp_username_configured": has_user,
            "smtp_username_masked": f"{self.smtp_username[:3]}...@{self.smtp_username.split('@')[-1]}" if has_user else "Not set",
            "smtp_password_configured": has_pwd,
            "smtp_from": self.from_email,
            "smtp_configured": is_ready
        }

    def _create_smtp_connection(self) -> smtplib.SMTP:
        """
        Creates and authenticates an SMTP connection with timeouts and TLS/SSL.
        """
        context = ssl.create_default_context()
        timeout = 15.0

        if self.smtp_port == 465:
            server = smtplib.SMTP_SSL(self.smtp_host, self.smtp_port, context=context, timeout=timeout)
        else:
            server = smtplib.SMTP(self.smtp_host, self.smtp_port, timeout=timeout)
            server.ehlo()
            if getattr(settings, "SMTP_USE_TLS", True):
                server.starttls(context=context)
                server.ehlo()

        server.login(self.smtp_username, self.smtp_password)
        return server

    def diagnose_smtp_connection(self) -> Tuple[bool, str, Dict[str, Any]]:
        """
        Tests the SMTP server connection and authentication directly.
        Returns (success, human_message, diagnostic_dict).
        """
        if not self.is_configured():
            msg = (
                "SMTP configuration is incomplete in backend/.env. "
                "Please configure SMTP_HOST=smtp.gmail.com, SMTP_PORT=587, "
                "SMTP_USERNAME=your_gmail@gmail.com, and SMTP_PASSWORD=your_16_char_app_password."
            )
            return False, msg, self.get_smtp_status_summary()

        try:
            server = self._create_smtp_connection()
            server.quit()
            return True, "SMTP connection and authentication successful.", self.get_smtp_status_summary()
        except smtplib.SMTPAuthenticationError as auth_err:
            error_code = getattr(auth_err, "smtp_code", None)
            err_msg = (
                "Gmail SMTP authentication failed. Please configure a 16-character Gmail App Password in backend/.env "
                "(Ensure 2-Step Verification is enabled on your Google Account: https://myaccount.google.com/apppasswords)."
            )
            print(f"[TripPulse Email Service] SMTPAuthenticationError ({error_code}): {auth_err}")
            return False, err_msg, self.get_smtp_status_summary()
        except (socket.timeout, TimeoutError) as timeout_err:
            err_msg = f"SMTP connection timed out connecting to {self.smtp_host}:{self.smtp_port}."
            print(f"[TripPulse Email Service] Connection Timeout: {timeout_err}")
            return False, err_msg, self.get_smtp_status_summary()
        except Exception as e:
            err_msg = f"SMTP connection error: {type(e).__name__} - {str(e)}"
            print(f"[TripPulse Email Service] SMTP Error: {err_msg}")
            return False, err_msg, self.get_smtp_status_summary()

    def send_test_email(self, recipient_email: str) -> Tuple[bool, str]:
        """
        Sends a test email to verify SMTP delivery end-to-end.
        """
        clean_email = (recipient_email or "").strip().lower()
        if not clean_email or "@" not in clean_email:
            return False, "Please provide a valid recipient email address."

        if not self.is_configured():
            return False, "SMTP is not configured in backend/.env. Set SMTP_USERNAME and SMTP_PASSWORD (Gmail App Password)."

        subject = "TripPulse Email Test"
        text_body = "This is a test email from TripPulse. If you received this, your SMTP configuration is working perfectly!"
        html_body = f"""<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: sans-serif; background-color: #0f172a; color: #f8fafc; padding: 24px;">
  <div style="max-width: 500px; margin: 0 auto; background: #1e293b; border-radius: 12px; padding: 28px; border: 1px solid #334155;">
    <h2 style="color: #60a5fa; margin-top: 0;">TripPulse Email Test</h2>
    <p style="color: #cbd5e1; font-size: 15px; line-height: 1.5;">
      This is a test email from TripPulse.
    </p>
    <p style="color: #34d399; font-weight: 600; font-size: 14px;">
      ✓ SMTP connection and email delivery are working successfully!
    </p>
    <hr style="border: none; border-top: 1px solid #334155; margin: 20px 0;" />
    <span style="font-size: 12px; color: #94a3b8;">TripPulse Team</span>
  </div>
</body>
</html>"""

        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"{self.from_name} <{self.from_email}>"
            msg["To"] = clean_email

            msg.attach(MIMEText(text_body, "plain"))
            msg.attach(MIMEText(html_body, "html"))

            server = self._create_smtp_connection()
            server.sendmail(self.from_email, clean_email, msg.as_string())
            server.quit()

            print(f"[TripPulse Email Service] Sent test email to {clean_email} via SMTP.")
            return True, f"Test email sent successfully to {clean_email}."
        except smtplib.SMTPAuthenticationError:
            err_msg = "Gmail SMTP authentication failed. Configure a Gmail App Password in backend/.env."
            print(f"[TripPulse Email Service] Test Email Failed: {err_msg}")
            return False, err_msg
        except Exception as e:
            err_msg = f"Email delivery failed: {type(e).__name__} ({str(e)})"
            print(f"[TripPulse Email Service] Test Email Failed: {err_msg}")
            return False, err_msg

    def send_password_reset_code_email(self, recipient_email: str, verification_code: str, recipient_name: Optional[str] = None) -> Tuple[bool, str]:
        """
        Sends the 6-digit password reset verification OTP code email to the specified user email.
        Returns (success: bool, status_message: str).
        """
        clean_email = (recipient_email or "").strip().lower()
        if not clean_email or "@" not in clean_email:
            return False, "Invalid recipient email address."

        if not verification_code:
            return False, "Verification code is missing."

        subject = "TripPulse Password Reset Verification Code"

        text_body = f"""Hello,

We received a request to reset your TripPulse password.

Your verification code is:

{verification_code}

This code expires in 10 minutes.

If you did not request this password reset, you can safely ignore this email.

Thanks,
TripPulse
"""

        html_body = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 24px; }}
    .container {{ max-width: 540px; margin: 0 auto; background: #1e293b; border-radius: 16px; border: 1px solid #334155; padding: 32px; box-shadow: 0 10px 30px rgba(0,0,0,0.4); }}
    .brand {{ font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; }}
    .badge {{ font-size: 11px; font-weight: 700; background: rgba(99, 102, 241, 0.25); color: #a5b4fc; padding: 3px 8px; border-radius: 6px; margin-left: 8px; }}
    h2 {{ font-size: 20px; font-weight: 700; color: #ffffff; margin-top: 0; margin-bottom: 14px; }}
    p {{ font-size: 15px; line-height: 1.6; color: #cbd5e1; margin: 12px 0; }}
    .code-box {{ background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(59, 130, 246, 0.15)); border: 2px dashed rgba(99, 102, 241, 0.5); border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }}
    .code-digits {{ font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #60a5fa; font-family: monospace; display: inline-block; }}
    .expiry-note {{ font-size: 13px; color: #f59e0b; margin-top: 8px; font-weight: 600; }}
    .footer {{ font-size: 12px; color: #94a3b8; border-top: 1px solid #334155; margin-top: 28px; padding-top: 18px; }}
  </style>
</head>
<body>
  <div class="container">
    <div style="display: flex; align-items: center; margin-bottom: 24px;">
      <span class="brand">TripPulse</span>
      <span class="badge">Security Verification</span>
    </div>
    
    <h2>Password Reset Request</h2>
    
    <p>Hello,</p>
    <p>We received a request to reset your TripPulse password.</p>
    <p>Your verification code is:</p>
    
    <div class="code-box">
      <div class="code-digits">{verification_code}</div>
      <div class="expiry-note">⏱ This code expires in 10 minutes (maximum 5 attempts).</div>
    </div>
    
    <p style="font-size: 13px; color: #94a3b8;">
      If you did not request this password reset, you can safely ignore this email. Your password will remain unchanged.
    </p>
    
    <div class="footer">
      Thanks,<br>
      <strong>TripPulse</strong>
    </div>
  </div>
</body>
</html>"""

        if not self.is_configured():
            msg = (
                "Email service is not configured. Please set SMTP_USERNAME and SMTP_PASSWORD "
                "(Gmail App Password) in backend/.env to send verification emails."
            )
            print(f"[TripPulse Email Service] [CONFIG NOTICE] {msg}")
            return False, msg

        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"{self.from_name} <{self.from_email}>"
            msg["To"] = clean_email

            msg.attach(MIMEText(text_body, "plain"))
            msg.attach(MIMEText(html_body, "html"))

            server = self._create_smtp_connection()
            server.sendmail(self.from_email, clean_email, msg.as_string())
            server.quit()

            print(f"[TripPulse Email Service] Delivered verification OTP to {clean_email} via SMTP.")
            return True, "Verification email sent successfully."
        except smtplib.SMTPAuthenticationError as auth_err:
            err_msg = "Gmail SMTP authentication failed. Configure a Gmail App Password in backend/.env."
            print(f"[TripPulse Email Service] Email dispatch authentication failed: {auth_err}")
            return False, err_msg
        except (socket.timeout, TimeoutError):
            err_msg = f"SMTP connection timed out connecting to {self.smtp_host}:{self.smtp_port}."
            print(f"[TripPulse Email Service] SMTP timeout during dispatch to {clean_email}")
            return False, err_msg
        except Exception as e:
            err_msg = f"Unable to send the verification email: {type(e).__name__}"
            print(f"[TripPulse Email Service] Failed to send email via SMTP to {clean_email}: {type(e).__name__}: {e}")
            return False, err_msg

    def send_welcome_email(self, recipient_email: str, recipient_name: str, auth_provider: str = "Google") -> bool:
        """
        Sends the sign-in confirmation email to the verified user email address.
        """
        clean_email = (recipient_email or "").strip().lower()
        if not clean_email:
            return False

        if not self.is_configured():
            return False

        name = recipient_name.strip() if recipient_name else clean_email.split("@")[0].capitalize()
        subject = "Welcome to TripPulse — Sign-in Successful"

        text_body = f"""Hi {name},

You have successfully signed in to TripPulse using your {auth_provider} account.

You can now create trips, manage itineraries, explore destinations, and use TripPulse travel tools.

If this wasn't you, please secure your {auth_provider} account.

— TripPulse Team
"""

        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"{self.from_name} <{self.from_email}>"
            msg["To"] = clean_email

            msg.attach(MIMEText(text_body, "plain"))

            server = self._create_smtp_connection()
            server.sendmail(self.from_email, clean_email, msg.as_string())
            server.quit()
            return True
        except Exception as e:
            print(f"[TripPulse Email Service] Welcome email notice: {e}")
            return False

    def send_verification_email(self, recipient_email: str, recipient_name: str, verification_url: str) -> bool:
        """
        Sends account email verification link with token.
        """
        clean_email = (recipient_email or "").strip().lower()
        if not clean_email:
            return False

        if not self.is_configured():
            return False

        name = recipient_name.strip() if recipient_name else clean_email.split("@")[0].capitalize()
        subject = "TripPulse Account Verification — Confirm Your Email"

        text_body = f"""Hi {name},

Thank you for creating an account on TripPulse!

Please click the link below to verify your email address:
{verification_url}

— TripPulse Team
"""

        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"{self.from_name} <{self.from_email}>"
            msg["To"] = clean_email

            msg.attach(MIMEText(text_body, "plain"))

            server = self._create_smtp_connection()
            server.sendmail(self.from_email, clean_email, msg.as_string())
            server.quit()
            return True
        except Exception as e:
            print(f"[TripPulse Email Service] Verification email notice: {e}")
            return False

email_service = EmailService()
