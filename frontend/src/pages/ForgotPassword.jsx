import React, { useState } from 'react';
import { Mail, ArrowLeft, ArrowRight, KeyRound, AlertCircle, ShieldCheck, Clock, Sparkles, Compass, Sun, Moon } from 'lucide-react';
import api from '../services/api';
import { getRawApiUrl } from '../api/client';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';

export const ForgotPassword = ({ setActivePage, onEmailSubmitted, initialEmail = '', backendStatus, loadingStatus = false }) => {
  const toast = useToast();
  const { theme, toggleTheme, isDark } = useTheme();
  const [email, setEmail] = useState(initialEmail || sessionStorage.getItem('reset_email') || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 3-state connection status: 'checking' | 'online' | 'offline'
  let apiStatus = 'checking';
  if (!loadingStatus) {
    if (backendStatus?.status === 'online' || backendStatus?.status === 'ok' || backendStatus?.success === true) {
      apiStatus = 'online';
    } else {
      apiStatus = 'offline';
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/auth/forgot-password', { email: cleanEmail });

      if (res.success) {
        sessionStorage.setItem('reset_email', cleanEmail);
        sessionStorage.setItem('reset_code_requested_at', String(Date.now()));
        toast.success(res.message || 'Verification code sent to your email.');
        
        if (onEmailSubmitted) {
          onEmailSubmitted(cleanEmail);
        } else {
          setActivePage('verify-reset-code');
        }
      } else {
        setError(res.message || 'Unable to send verification code. Please try again.');
      }
    } catch (err) {
      if (err.status === 429) {
        setError(err.message || 'Too many requests. Please wait a moment before trying again.');
      } else {
        setError(err.message || 'Unable to send the verification email. Please try again.');
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
            Forgot Password?
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginTop: '6px', lineHeight: 1.55 }}>
            Enter your account email. We'll generate a secure 6-digit verification code and deliver it to your inbox.
          </p>
        </div>

        {/* 10-Minute Expiry Notice Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 14px',
          borderRadius: 'var(--radius-md)',
          background: 'var(--primary-light)',
          border: '1px solid var(--primary)',
          color: 'var(--primary)',
          fontSize: '0.84rem',
          fontWeight: 600,
          marginBottom: '20px'
        }}>
          <Clock size={16} style={{ flexShrink: 0 }} />
          <span>The generated verification code will remain valid for 10 minutes.</span>
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

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Account Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={17} style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-dim)'
              }} />
              <input
                type="email"
                className="form-input"
                style={{ paddingLeft: '42px' }}
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{
              width: '100%',
              marginTop: '16px'
            }}
            disabled={loading}
          >
            {loading ? <LoadingSpinner text="Sending Verification Code..." /> : (
              <>
                <span>Send Verification Code</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <button
            type="button"
            onClick={() => setActivePage('login')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '0.9rem',
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

        <div style={{
          marginTop: '28px',
          paddingTop: '18px',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: 'var(--text-dim)',
          fontSize: '0.8rem'
        }}>
          <ShieldCheck size={16} color="var(--success)" />
          <span>Encrypted with SHA-256 secure verification tokens.</span>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
