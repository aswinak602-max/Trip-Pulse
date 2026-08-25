import React, { useState, useEffect, useRef } from 'react';
import { Shield, Clock, RefreshCw, ArrowLeft, ArrowRight, AlertCircle, CheckCircle, Mail, AlertTriangle, Sparkles, Compass, Sun, Moon } from 'lucide-react';
import api from '../services/api';
import { getRawApiUrl } from '../api/client';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';

const EXPIRATION_SECONDS = 10 * 60; // 10 minutes
const RESEND_COOLDOWN_SECONDS = 60; // 60 seconds

export const VerifyResetCode = ({
  email: initialEmail = '',
  setActivePage,
  onCodeVerified,
  onChangeEmail,
  backendStatus,
  loadingStatus = false
}) => {
  const toast = useToast();
  const { theme, toggleTheme, isDark } = useTheme();
  const [email, setEmail] = useState(
    initialEmail || sessionStorage.getItem('reset_email') || ''
  );
  
  // 3-state connection status: 'checking' | 'online' | 'offline'
  let apiStatus = 'checking';
  if (!loadingStatus) {
    if (backendStatus?.status === 'online' || backendStatus?.status === 'ok' || backendStatus?.success === true) {
      apiStatus = 'online';
    } else {
      apiStatus = 'offline';
    }
  }
  
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef([]);

  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Expiration countdown (10:00)
  const [secondsRemaining, setSecondsRemaining] = useState(() => {
    const requestedAt = sessionStorage.getItem('reset_code_requested_at');
    if (requestedAt) {
      const elapsed = Math.floor((Date.now() - Number(requestedAt)) / 1000);
      const remaining = EXPIRATION_SECONDS - elapsed;
      return remaining > 0 ? remaining : 0;
    }
    return EXPIRATION_SECONDS;
  });

  // Resend cooldown countdown (60s)
  const [resendCooldown, setResendCooldown] = useState(() => {
    const requestedAt = sessionStorage.getItem('reset_code_requested_at');
    if (requestedAt) {
      const elapsed = Math.floor((Date.now() - Number(requestedAt)) / 1000);
      const remaining = RESEND_COOLDOWN_SECONDS - elapsed;
      return remaining > 0 ? remaining : 0;
    }
    return RESEND_COOLDOWN_SECONDS;
  });

  useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail);
      sessionStorage.setItem('reset_email', initialEmail);
    } else {
      const saved = sessionStorage.getItem('reset_email');
      if (saved) {
        setEmail(saved);
      } else {
        setActivePage('forgot-password');
      }
    }
  }, [initialEmail, setActivePage]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const cooldownTimer = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownTimer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(cooldownTimer);
  }, [resendCooldown]);

  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  const formatTime = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleDigitChange = (index, value) => {
    setError('');
    const cleanValue = value.replace(/[^0-9]/g, '');

    if (!cleanValue) {
      const newDigits = [...digits];
      newDigits[index] = '';
      setDigits(newDigits);
      return;
    }

    const lastChar = cleanValue.slice(-1);
    const newDigits = [...digits];
    newDigits[index] = lastChar;
    setDigits(newDigits);

    if (index < 5 && lastChar) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        const newDigits = [...digits];
        newDigits[index - 1] = '';
        setDigits(newDigits);
        inputRefs.current[index - 1]?.focus();
      } else {
        const newDigits = [...digits];
        newDigits[index] = '';
        setDigits(newDigits);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    setError('');
    const pastedData = e.clipboardData.getData('text').trim().replace(/[^0-9]/g, '');

    if (!pastedData) return;

    const newDigits = [...digits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pastedData[i] || '';
    }
    setDigits(newDigits);

    const nextEmptyIndex = newDigits.findIndex((d) => !d);
    if (nextEmptyIndex !== -1) {
      inputRefs.current[nextEmptyIndex]?.focus();
    } else {
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    setError('');

    const fullCode = digits.join('');
    if (fullCode.length !== 6) {
      setError('Please enter the full 6-digit verification code.');
      return;
    }

    if (secondsRemaining <= 0) {
      setError('This verification code has expired. Please request a new code.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/auth/verify-reset-code', {
        email: email.trim().toLowerCase(),
        code: fullCode
      });

      if (res.success && res.data?.reset_token) {
        sessionStorage.setItem('reset_token', res.data.reset_token);
        toast.success(res.message || 'Email verified successfully!');
        
        if (onCodeVerified) {
          onCodeVerified(res.data.reset_token);
        } else {
          setActivePage('reset-password');
        }
      } else {
        setError(res.message || 'Incorrect verification code. Please try again.');
      }
    } catch (err) {
      if (err.status === 429) {
        setError('Too many attempts. Please request a new verification code.');
      } else if (err.status === 400 && err.message?.includes('expired')) {
        setError('This verification code has expired. Please request a new code.');
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Incorrect verification code. Please check your Gmail and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0 || resendLoading) return;
    setError('');

    try {
      setResendLoading(true);
      const res = await api.post('/auth/forgot-password', {
        email: email.trim().toLowerCase()
      });

      if (res.success) {
        toast.success('A new 6-digit verification code has been sent to your email.');
        setDigits(['', '', '', '', '', '']);
        setSecondsRemaining(EXPIRATION_SECONDS);
        setResendCooldown(RESEND_COOLDOWN_SECONDS);
        sessionStorage.setItem('reset_code_requested_at', String(Date.now()));
        inputRefs.current[0]?.focus();
      } else {
        setError(res.message || 'Unable to resend verification code.');
      }
    } catch (err) {
      if (err.status === 429) {
        setError(err.message || 'Please wait before requesting another code.');
      } else {
        setError(err.message || 'Unable to send the verification email. Please try again.');
      }
    } finally {
      setResendLoading(false);
    }
  };

  const isCodeComplete = digits.every((d) => d !== '');
  const isExpired = secondsRemaining <= 0;

  return (
    <div style={{
      maxWidth: '480px',
      margin: '24px auto',
      padding: '0 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px'
    }}>
      {/* Minimal Auth Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 4px'
      }}>
        <div 
          onClick={() => setActivePage('welcome')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }}
          title="TripPulse Home"
        >
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '9px',
            background: 'var(--brand-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF'
          }}>
            <Compass size={18} />
          </div>
          <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            TripPulse
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            borderRadius: 'var(--radius-full)',
            background: apiStatus === 'online' 
              ? 'rgba(16, 185, 129, 0.09)' 
              : apiStatus === 'checking' 
                ? 'rgba(245, 158, 11, 0.09)' 
                : 'rgba(239, 68, 68, 0.09)',
            border: `1px solid ${
              apiStatus === 'online' 
                ? 'rgba(16, 185, 129, 0.25)' 
                : apiStatus === 'checking' 
                  ? 'rgba(245, 158, 11, 0.25)' 
                  : 'rgba(239, 68, 68, 0.25)'
            }`,
            fontSize: '0.72rem',
            fontWeight: 700,
            color: apiStatus === 'online' 
              ? 'var(--success)' 
              : apiStatus === 'checking' 
                ? 'var(--warning)' 
                : 'var(--danger)'
          }} title={
            apiStatus === 'online' 
              ? `Backend API and database are active (${getRawApiUrl()})` 
              : apiStatus === 'checking' 
                ? 'Connecting to TripPulse server...' 
                : `Backend offline: Unable to reach ${getRawApiUrl()}`
          }>
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: apiStatus === 'online' 
                ? 'var(--success)' 
                : apiStatus === 'checking' 
                  ? 'var(--warning)' 
                  : 'var(--danger)',
              boxShadow: apiStatus === 'online' ? '0 0 6px rgba(16, 185, 129, 0.6)' : 'none'
            }} />
            <span>
              {apiStatus === 'online' ? 'API Online' : apiStatus === 'checking' ? 'Connecting...' : 'API Offline'}
            </span>
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={toggleTheme}
            title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
            style={{
              padding: '5px 8px',
              display: 'inline-flex',
              alignItems: 'center',
              borderRadius: 'var(--radius-full)',
              cursor: 'pointer'
            }}
            aria-label="Toggle Theme"
          >
            {isDark ? <Sun size={14} color="#F4C95D" /> : <Moon size={14} color="#0FA3B1" />}
          </button>
        </div>
      </div>
      <div className="glass-card" style={{ padding: '40px 36px', boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'var(--brand-gradient)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
            boxShadow: 'var(--shadow-glow)',
            color: '#FFFFFF'
          }}>
            <Shield size={28} />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            Verify Your Email
          </h2>
          
          <div style={{
            marginTop: '8px',
            color: 'var(--text-muted)',
            fontSize: '0.92rem',
            lineHeight: 1.55
          }}>
            We sent a 6-digit code to:
            <div style={{
              marginTop: '6px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontWeight: 700,
              color: 'var(--primary)',
              background: 'var(--primary-light)',
              padding: '4px 12px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--primary)',
              fontSize: '0.88rem'
            }}>
              <Mail size={14} />
              <span>{email || 'your email'}</span>
            </div>
            {onChangeEmail && (
              <button
                type="button"
                onClick={onChangeEmail}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary)',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  marginLeft: '8px',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Change
              </button>
            )}
          </div>
        </div>

        {/* Expiration Timer Banner */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          padding: '10px 16px',
          borderRadius: 'var(--radius-md)',
          background: isExpired
            ? 'var(--danger-bg)'
            : secondsRemaining < 120
              ? 'var(--warning-bg)'
              : 'var(--primary-light)',
          border: `1px solid ${
            isExpired
              ? 'var(--danger-border)'
              : secondsRemaining < 120
                ? 'var(--warning-border)'
                : 'var(--primary)'
          }`,
          marginBottom: '24px',
          color: isExpired
            ? 'var(--danger)'
            : secondsRemaining < 120
              ? 'var(--warning)'
              : 'var(--primary)',
          fontSize: '0.9rem',
          fontWeight: 700
        }}>
          {isExpired ? (
            <>
              <AlertTriangle size={18} />
              <span>Code expired. Please request a new code.</span>
            </>
          ) : (
            <>
              <Clock size={16} />
              <span>Code expires in {formatTime(secondsRemaining)}</span>
            </>
          )}
        </div>

        {error && (
          <div style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--danger-bg)',
            border: '1px solid var(--danger-border)',
            color: 'var(--danger)',
            fontSize: '0.88rem',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px'
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span style={{ lineHeight: 1.4 }}>{error}</span>
          </div>
        )}

        <form onSubmit={handleVerify}>
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              textAlign: 'center',
              fontSize: '0.9rem',
              fontWeight: 700,
              color: 'var(--text-main)',
              marginBottom: '14px'
            }}>
              Enter the 6-digit OTP from your email
            </label>

            {/* Discrete 6-Box Grid */}
            <div className="otp-inputs-wrapper">
              {digits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (inputRefs.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  disabled={loading || isExpired}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  onPaste={handlePaste}
                  className="otp-box"
                />
              ))}
            </div>
          </div>

          {!isExpired ? (
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: '100%' }}
              disabled={loading || !isCodeComplete || isExpired}
            >
              {loading ? <LoadingSpinner text="Verifying Code..." /> : (
                <>
                  <span>Verify Code</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary btn-lg"
              style={{ width: '100%' }}
              onClick={handleResendCode}
              disabled={resendLoading}
            >
              {resendLoading ? <LoadingSpinner text="Sending New Code..." /> : (
                <>
                  <RefreshCw size={18} />
                  <span>Send New Code</span>
                </>
              )}
            </button>
          )}
        </form>

        {/* Resend Cooldown Section */}
        <div style={{
          marginTop: '24px',
          textAlign: 'center',
          borderTop: '1px solid var(--border)',
          paddingTop: '20px'
        }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '0 0 10px 0' }}>
            Didn't receive the email?
          </p>

          <button
            type="button"
            onClick={handleResendCode}
            disabled={resendCooldown > 0 || resendLoading}
            className="btn btn-secondary btn-sm"
            style={{
              fontWeight: 700,
              cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer'
            }}
          >
            <RefreshCw size={14} className={resendLoading ? 'animate-spin' : ''} />
            <span>
              {resendLoading
                ? 'Sending...'
                : resendCooldown > 0
                  ? `Resend Code (${resendCooldown}s)`
                  : 'Resend Code'}
            </span>
          </button>
        </div>

        <div style={{ marginTop: '16px', textAlign: 'center' }}>
          <button
            type="button"
            onClick={() => setActivePage('login')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '0.88rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'var(--transition-fast)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            <ArrowLeft size={16} />
            <span>Back to Login</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyResetCode;
