"""
TripPulse Email Service.
Handles transactional notifications, sign-in confirmations, and password recovery OTP emails
via the Resend HTTPS Email API (Render Free plan compatible).
"""

import os
import re
from typing import Optional, Tuple, Dict, Any, List

import resend

from app.core.config import settings


class EmailService:
    """
    Email service delivering transactional emails via Resend HTTPS API.
    Replaces blocking SMTP protocols to ensure seamless execution on Render Free tier
    and other cloud container environments that block outbound SMTP ports.
    """

    @property
    def resend_api_key(self) -> str:
        return settings.clean_resend_api_key

    @property
    def from_email(self) -> str:
        return settings.clean_email_from

    @property
    def from_name(self) -> str:
        return settings.clean_email_from_name

    @property
    def formatted_from(self) -> str:
        """
        Formats sender string for Resend.
        If EMAIL_FROM is already in 'Name <email>' format, returns as is.
        Otherwise wraps with from_name: 'TripPulse Team <onboarding@resend.dev>'.
        """
        raw = self.from_email
        if "<" in raw and ">" in raw:
            return raw
        name = self.from_name or "TripPulse"
        return f"{name} <{raw}>"

    # Backward compatibility properties for SMTP diagnostics & tests
    @property
    def smtp_host(self) -> str:
        return "api.resend.com (HTTPS)"

    @property
    def smtp_port(self) -> int:
        return 443

    @property
    def smtp_username(self) -> str:
        return "resend-api"

    @property
    def smtp_password(self) -> str:
        return self.resend_api_key

    def is_configured(self) -> bool:
        """Checks if Resend API key is validly configured."""
        key = self.resend_api_key
        if not key:
            return False
        placeholders = [
            "your_resend_api_key",
            "your-resend-api-key",
            "re_your_api_key_here",
            "re_123456789",
            "placeholder",
            "xxxx",
            "********",
            "<your_resend_api_key>",
            "re_your_key"
        ]
        return not any(p in key.lower() for p in placeholders)

    def get_missing_config_keys(self) -> List[str]:
        missing = []
        if not self.is_configured():
            missing.append("RESEND_API_KEY")
        return missing

    def get_status_summary(self) -> Dict[str, Any]:
        """Returns safe diagnostic information without leaking secret keys."""
        is_ready = self.is_configured()
        key = self.resend_api_key

        masked_key = "Not set"
        if is_ready and len(key) >= 8:
            masked_key = f"{key[:5]}...{key[-3:]}"
        elif is_ready:
            masked_key = "Set (masked)"

        return {
            "provider": "resend",
            "resend_configured": is_ready,
            "resend_api_key_configured": is_ready,
            "resend_api_key_masked": masked_key,
            "email_from": self.from_email,
            "formatted_from": self.formatted_from,
            # Backward-compatible fields for legacy diagnostic tests
            "smtp_host": self.smtp_host,
            "smtp_port": self.smtp_port,
            "smtp_username_configured": is_ready,
            "smtp_username_masked": masked_key,
            "smtp_password_configured": is_ready,
            "smtp_from": self.from_email,
            "smtp_configured": is_ready
        }

    def get_smtp_status_summary(self) -> Dict[str, Any]:
        """Backward-compatible alias for existing diagnostic endpoints."""
        return self.get_status_summary()

    def diagnose_connection(self) -> Tuple[bool, str, Dict[str, Any]]:
        """
        Tests whether the email service is ready to dispatch emails.
        Returns (success: bool, human_message: str, diagnostic_dict: Dict).
        """
        summary = self.get_status_summary()
        if not self.is_configured():
            msg = "Email service is not configured (Missing RESEND_API_KEY in environment)."
            return False, msg, summary

        return True, "Resend HTTPS API is configured and operational.", summary

    def diagnose_smtp_connection(self) -> Tuple[bool, str, Dict[str, Any]]:
        """Backward-compatible alias for existing diagnostic endpoints."""
        return self.diagnose_connection()

    def _mask_email(self, email: str) -> str:
        """Safely masks email for logs, e.g. j***@domain.com."""
        clean = (email or "").strip().lower()
        if not clean or "@" not in clean:
            return clean
        parts = clean.split("@")
        user, domain = parts[0], parts[1]
        if len(user) <= 2:
            masked_user = user[0] + "*"
        else:
            masked_user = user[:2] + "***"
        return f"{masked_user}@{domain}"

    def _sanitize_log_message(self, message: str) -> str:
        """Ensures secrets such as RESEND_API_KEY are never leaked into logs."""
        clean_msg = str(message)
        if self.resend_api_key and self.resend_api_key in clean_msg:
            clean_msg = clean_msg.replace(self.resend_api_key, "[REDACTED_API_KEY]")
        # Redact any generic re_... token pattern
        clean_msg = re.sub(r"re_[A-Za-z0-9_]{10,}", "[REDACTED_API_KEY]", clean_msg)
        return clean_msg

    def send_password_reset_code_email(
        self,
        recipient_email: str,
        verification_code: str,
        recipient_name: Optional[str] = None
    ) -> Tuple[bool, str]:
        """
        Sends the 6-digit password reset verification OTP code email to the specified user email
        via Resend HTTPS API.
        Returns (success: bool, status_message: str).
        """
        clean_email = (recipient_email or "").strip().lower()
        if not clean_email or "@" not in clean_email:
            return False, "Please enter a valid email address."

        if not verification_code:
            return False, "Verification code is missing."

        masked_target = self._mask_email(clean_email)

        if not self.is_configured():
            print(
                f"[TripPulse Email Service] [RENDER CONFIG ERROR] Cannot send OTP email: "
                f"RESEND_API_KEY is not configured in environment. "
                f"Please add RESEND_API_KEY to your Render Environment Variables."
            )
            return False, "Unable to send the verification email. Please try again later."

        subject = "TripPulse Password Reset Verification Code"
        text_body = f"""Hello,

We received a request to reset your TripPulse password.

Your verification code is:

{verification_code}

This code expires in 10 minutes.

If you did not request this password reset, you can safely ignore this email.

Thanks,
TripPulse Team
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
      <strong>TripPulse Team</strong>
    </div>
  </div>
</body>
</html>"""

        try:
            resend.api_key = self.resend_api_key
            params: resend.Emails.SendParams = {
                "from": self.formatted_from,
                "to": [clean_email],
                "subject": subject,
                "text": text_body,
                "html": html_body
            }

            response = resend.Emails.send(params)
            email_id = getattr(response, "id", None) or (response.get("id") if isinstance(response, dict) else str(response))
            print(f"[TripPulse Email Service] Verification code successfully sent to {masked_target} via Resend HTTP API. ID: {email_id}")
            return True, "Verification code sent successfully. Please check your email."

        except Exception as e:
            err_sanitized = self._sanitize_log_message(str(e))
            print(
                f"[TripPulse Email Service] [RENDER EMAIL FAILURE] Failed to deliver password reset email to {masked_target} "
                f"via Resend API ({type(e).__name__}): {err_sanitized}"
            )
            return False, "Unable to send the verification email. Please try again later."

    def send_welcome_email(self, recipient_email: str, recipient_name: str, auth_provider: str = "Google") -> bool:
        """
        Sends the sign-in confirmation email to the verified user email address via Resend.
        """
        clean_email = (recipient_email or "").strip().lower()
        if not clean_email or "@" not in clean_email:
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
            resend.api_key = self.resend_api_key
            params: resend.Emails.SendParams = {
                "from": self.formatted_from,
                "to": [clean_email],
                "subject": subject,
                "text": text_body
            }
            resend.Emails.send(params)
            print(f"[TripPulse Email Service] Sent welcome email to {self._mask_email(clean_email)} via Resend.")
            return True
        except Exception as e:
            err_sanitized = self._sanitize_log_message(str(e))
            print(f"[TripPulse Email Service] Welcome email dispatch notice ({type(e).__name__}): {err_sanitized}")
            return False

    def send_verification_email(self, recipient_email: str, recipient_name: str, verification_url: str) -> bool:
        """
        Sends account email verification link with token via Resend.
        """
        clean_email = (recipient_email or "").strip().lower()
        if not clean_email or "@" not in clean_email:
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
            resend.api_key = self.resend_api_key
            params: resend.Emails.SendParams = {
                "from": self.formatted_from,
                "to": [clean_email],
                "subject": subject,
                "text": text_body
            }
            resend.Emails.send(params)
            print(f"[TripPulse Email Service] Sent verification email to {self._mask_email(clean_email)} via Resend.")
            return True
        except Exception as e:
            err_sanitized = self._sanitize_log_message(str(e))
            print(f"[TripPulse Email Service] Verification email dispatch notice ({type(e).__name__}): {err_sanitized}")
            return False

    def send_test_email(self, recipient_email: str) -> Tuple[bool, str]:
        """
        Sends a test email to verify Resend HTTPS delivery end-to-end.
        """
        clean_email = (recipient_email or "").strip().lower()
        if not clean_email or "@" not in clean_email:
            return False, "Please provide a valid recipient email address."

        if not self.is_configured():
            missing = self.get_missing_config_keys()
            return False, f"Email service is not configured (Missing: {', '.join(missing)})."

        subject = "TripPulse Email Test (Resend HTTP API)"
        text_body = "This is a test email from TripPulse. If you received this, your Resend HTTP API configuration is working perfectly on Render!"
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
      ✓ Resend HTTPS Email API delivery is working successfully!
    </p>
    <hr style="border: none; border-top: 1px solid #334155; margin: 20px 0;" />
    <span style="font-size: 12px; color: #94a3b8;">TripPulse Team</span>
  </div>
</body>
</html>"""

        try:
            resend.api_key = self.resend_api_key
            params: resend.Emails.SendParams = {
                "from": self.formatted_from,
                "to": [clean_email],
                "subject": subject,
                "text": text_body,
                "html": html_body
            }
            response = resend.Emails.send(params)
            email_id = getattr(response, "id", None) or (response.get("id") if isinstance(response, dict) else str(response))
            masked_target = self._mask_email(clean_email)
            print(f"[TripPulse Email Service] Sent test email to {masked_target} via Resend HTTP API (ID: {email_id}).")
            return True, f"Test email sent successfully to {clean_email} via Resend HTTP API."
        except Exception as e:
            err_sanitized = self._sanitize_log_message(str(e))
            print(f"[TripPulse Email Service] [RENDER EMAIL FAILURE] Test Email Failed via Resend: {err_sanitized}")
            return False, "Unable to deliver test email. Please check your RESEND_API_KEY and EMAIL_FROM configuration."


email_service = EmailService()
