import React, { useState, useEffect } from 'react';
import { KeyRound, Lock, Eye, EyeOff, CheckCircle2, ArrowLeft, ArrowRight, ShieldCheck, Check, X, Sparkles, Compass, Sun, Moon } from 'lucide-react';
import api from '../services/api';
import { getRawApiUrl } from '../api/client';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';

export const ResetPassword = ({
  token: initialToken = '',
  setActivePage,
  onResetComplete,
  backendStatus,
  loadingStatus = false
}) => {
  const toast = useToast();
  const { theme, toggleTheme, isDark } = useTheme();
  const urlParams = new URLSearchParams(window.location.search);

  // 3-state connection status: 'checking' | 'online' | 'offline'
  let apiStatus = 'checking';
  if (!loadingStatus) {
    if (backendStatus?.status === 'online' || backendStatus?.status === 'ok' || backendStatus?.success === true) {
      apiStatus = 'online';
    } else {
      apiStatus = 'offline';
    }
  }
  
  const [token, setToken] = useState(
    initialToken || urlParams.get('token') || sessionStorage.getItem('reset_token') || ''
  );
  
  const [formData, setFormData] = useState({
    new_password: '',
    confirm_password: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (initialToken) {
      setToken(initialToken);
      sessionStorage.setItem('reset_token', initialToken);
    } else {
      const savedToken = sessionStorage.getItem('reset_token') || urlParams.get('token');
      if (savedToken) {
        setToken(savedToken);
      }
    }
  }, [initialToken]);

  // Validation conditions
  const hasMinLength = formData.new_password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(formData.new_password);
  const hasNumber = /[0-9]/.test(formData.new_password);
  const isPasswordValid = hasMinLength && hasLetter && hasNumber;
  const doPasswordsMatch = formData.new_password === formData.confirm_password && formData.confirm_password.length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanToken = token.trim();
    if (!cleanToken) {
      setError('This password reset session has expired. Please start again from Forgot Password.');
      return;
    }

    if (!isPasswordValid) {
      setError('Password does not meet the required security requirements.');
      return;
    }

    if (formData.new_password !== formData.confirm_password) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/auth/reset-password', {
        token: cleanToken,
        new_password: formData.new_password,
        confirm_password: formData.confirm_password
      });

      if (res.success) {
        setSuccess(true);
        sessionStorage.removeItem('reset_token');
        sessionStorage.removeItem('reset_email');
        sessionStorage.removeItem('reset_code_requested_at');
        toast.success(res.message || 'Password reset successfully!');
        if (onResetComplete) {
          onResetComplete();
        }
      } else {
        setError(res.message || 'Failed to update password.');
      }
    } catch (err) {
      if (err.status === 400 && err.message?.includes('expired')) {
        setError('This password reset session has expired. Please request a new verification code.');
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

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
        {success ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{
              width: '68px',
              height: '68px',
              borderRadius: '50%',
              background: 'var(--success-bg)',
              border: '2px solid var(--success-border)',
              color: 'var(--success)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px auto',
              boxShadow: '0 8px 24px rgba(16, 185, 129, 0.25)'
            }}>
              <CheckCircle2 size={38} />
            </div>

            <h2 style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: '8px', letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
              Password Reset Successful!
            </h2>
            
            <p style={{ color: 'var(--text-muted)', fontSize: '0.96rem', marginBottom: '28px', lineHeight: 1.6 }}>
              Your account password has been updated securely. You can now sign in with your new credentials.
            </p>

            <button
              type="button"
              className="btn btn-primary btn-lg"
              style={{
                width: '100%',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
              onClick={() => setActivePage('login')}
            >
              <span>Sign In with New Password</span>
              <ArrowRight size={18} />
            </button>
          </div>
        ) : (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: 'var(--cta-gradient)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
                boxShadow: 'var(--shadow-glow)',
                color: '#FFFFFF'
              }}>
                <KeyRound size={28} />
              </div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                Create New Password
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginTop: '6px', lineHeight: 1.55 }}>
                Enter your new password to regain access to TripPulse.
              </p>
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
                <X size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span style={{ lineHeight: 1.4 }}>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* New Password */}
              <div className="form-group">
                <label className="form-label">New Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={17} style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-dim)'
                  }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter new password"
                    className="form-input"
                    style={{ paddingLeft: '42px', paddingRight: '42px' }}
                    value={formData.new_password}
                    onChange={(e) => setFormData({ ...formData, new_password: e.target.value })}
                    autoFocus
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '14px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-dim)',
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={17} style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-dim)'
                  }} />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm new password"
                    className="form-input"
                    style={{ paddingLeft: '42px', paddingRight: '42px' }}
                    value={formData.confirm_password}
                    onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{
                      position: 'absolute',
                      right: '14px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-dim)',
                      cursor: 'pointer',
                      padding: 0
                    }}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Password Requirements Real-Time Checklist */}
              <div style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                padding: '14px 16px',
                margin: '18px 0 24px 0'
              }}>
                <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
                  Password requirements:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.84rem',
                    color: hasMinLength ? 'var(--success)' : 'var(--text-dim)',
                    fontWeight: hasMinLength ? 700 : 500
                  }}>
                    <Check size={15} color={hasMinLength ? 'var(--success)' : 'var(--text-dim)'} />
                    <span>At least 8 characters</span>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.84rem',
                    color: hasLetter ? 'var(--success)' : 'var(--text-dim)',
                    fontWeight: hasLetter ? 700 : 500
                  }}>
                    <Check size={15} color={hasLetter ? 'var(--success)' : 'var(--text-dim)'} />
                    <span>Contains a letter</span>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.84rem',
                    color: hasNumber ? 'var(--success)' : 'var(--text-dim)',
                    fontWeight: hasNumber ? 700 : 500
                  }}>
                    <Check size={15} color={hasNumber ? 'var(--success)' : 'var(--text-dim)'} />
                    <span>Contains a number</span>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.84rem',
                    color: doPasswordsMatch ? 'var(--success)' : 'var(--text-dim)',
                    fontWeight: doPasswordsMatch ? 700 : 500
                  }}>
                    <Check size={15} color={doPasswordsMatch ? 'var(--success)' : 'var(--text-dim)'} />
                    <span>Passwords match</span>
                  </div>
                </div>
              </div>

              {/* Reset Password Submit Button */}
              <button
                type="submit"
                className="btn btn-primary btn-lg"
                style={{ width: '100%' }}
                disabled={loading || !isPasswordValid || !doPasswordsMatch}
              >
                {loading ? <LoadingSpinner text="Updating password..." /> : 'Reset Password'}
              </button>
            </form>

            <div style={{ marginTop: '20px', textAlign: 'center' }}>
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
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
