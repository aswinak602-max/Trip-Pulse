import React, { useState, useEffect } from 'react';
import { Mail, Lock, Eye, EyeOff, LogIn, ArrowRight, AlertCircle, Info, KeyRound, HelpCircle, ExternalLink, X } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';
import { initiateGoogleSignIn, exchangeOAuthCode, logOAuthDiagnostics, validateGoogleClientId, getGoogleClientId } from '../services/googleAuth';

export const Login = ({ setActivePage, onOpenResetPassword, backendStatus, loadingStatus = false }) => {
  const { login, isAuthenticated } = useAuth();
  const toast = useToast();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Auto-redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      setActivePage('trip-dashboard');
    }
  }, [isAuthenticated, setActivePage]);

  // 3-state connection status: 'checking' | 'online' | 'offline'
  let apiStatus = 'checking';
  if (!loadingStatus) {
    if (backendStatus?.status === 'online' || backendStatus?.status === 'ok' || backendStatus?.success === true) {
      apiStatus = 'online';
    } else {
      apiStatus = 'offline';
    }
  }

  // Forgot Password State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccessMsg, setForgotSuccessMsg] = useState('');
  const [forgotErrorMsg, setForgotErrorMsg] = useState('');
  const [demoToken, setDemoToken] = useState('');

  // OAuth Config and Processing
  const [oauthConfig, setOAuthConfig] = useState(null);
  const [oauthLoading, setOAuthLoading] = useState(false);
  const [oauthError, setOAuthError] = useState('');
  const [showOAuthHelpModal, setShowOAuthHelpModal] = useState(false);
  const [oauthHelpDetails, setOAuthHelpDetails] = useState('');

  // Check OAuth config and URL params for return from Google OAuth
  useEffect(() => {
    let isMounted = true;

    const initOAuth = async () => {
      try {
        const res = await api.get('/auth/oauth/config');
        if (res.success && res.data && isMounted) {
          setOAuthConfig(res.data);
          logOAuthDiagnostics(res.data);
        }
      } catch (err) {
        console.warn('[TripPulse OAuth] Config lookup notice:', err);
      }

      // Check if redirected back with OAuth code, token, or error
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const errorParam = urlParams.get('error');
      const oauthToken = urlParams.get('oauth_token') || urlParams.get('token') || urlParams.get('access_token');

      if (oauthToken) {
        localStorage.setItem('token', oauthToken);
        api.get('/auth/me', { headers: { Authorization: `Bearer ${oauthToken}` } })
          .then((res) => {
            if (res.success && res.data && isMounted) {
              login(res.data, oauthToken);
              toast.success(`Welcome back, ${res.data.name}!`);
              setActivePage('trip-dashboard');
            }
          })
          .catch((err) => {
            console.warn('OAuth token exchange error:', err);
            if (isMounted) setOAuthError('Google sign-in session expired. Please sign in again.');
          });
        return;
      }

      if (errorParam) {
        if (isMounted) {
          if (errorParam === 'access_denied') {
            setOAuthError('Google sign-in was cancelled.');
          } else if (errorParam === 'invalid_client') {
            setOAuthError('Google OAuth error (invalid_client): The GOOGLE_CLIENT_SECRET in backend/.env is invalid or expired. Please create a new Client Secret in Google Cloud Console and paste it into backend/.env.');
          } else if (errorParam === 'google_client_secret_missing') {
            setOAuthError('Google OAuth notice: Using client-side Google authentication.');
          } else if (errorParam === 'google_client_id_missing' || errorParam === 'google_oauth_not_configured') {
            setOAuthError('Google OAuth is not configured. Please ensure VITE_GOOGLE_CLIENT_ID in frontend/.env is set.');
          } else if (errorParam === 'oauth_verification_failed' || errorParam === 'token_exchange_failed') {
            setOAuthError('Google OAuth verification failed. Please try signing in again.');
          } else if (errorParam === 'redirect_uri_mismatch') {
            setOAuthError('Google OAuth error (redirect_uri_mismatch): The Authorized Redirect URI in Google Cloud Console must match http://localhost:8000/api/v1/auth/google/callback.');
          } else if (errorParam === 'invalid_grant') {
            setOAuthError('Google OAuth error (invalid_grant): The authorization code expired or has already been used. Please try signing in again.');
          } else if (errorParam === 'missing_authorization_code') {
            setOAuthError('Google sign-in error: No authorization code received from Google.');
          } else if (errorParam === 'unverified_google_email') {
            setOAuthError('Google account email is not verified. Please verify your email with Google.');
          } else if (errorParam === 'google_userinfo_failed') {
            setOAuthError('Failed to fetch user profile information from Google.');
          } else if (errorParam === 'user_creation_failed') {
            setOAuthError('Failed to create or link user account in TripPulse database.');
          } else {
            setOAuthError(`Google authentication notice: ${errorParam.replace(/_/g, ' ')}`);
          }
        }
      } else if (code) {
        handleGoogleCodeExchange(code);
      }

      // Check if redirected with email verification token
      const verifyToken = urlParams.get('verify_token');
      if (verifyToken) {
        api.get(`/auth/verify-email?token=${encodeURIComponent(verifyToken)}`)
          .then((res) => {
            if (res && res.success) {
              toast.success('Your email has been verified successfully! You can now sign in.');
            }
          })
          .catch((err) => {
            console.warn('Verification notice:', err);
          });
      }
    };

    initOAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleGoogleCodeExchange = async (code, redirectUri = null) => {
    try {
      setOAuthLoading(true);
      setOAuthError('');
      const res = await exchangeOAuthCode(code, redirectUri || 'http://localhost:8000/api/v1/auth/google/callback');

      if (res.success && res.data) {
        login(res.data.user, res.data.access_token);
        toast.success(`Welcome back, ${res.data.user.name}!`);
        setActivePage('trip-dashboard');
      } else {
        setOAuthError(res.message || 'Google sign-in could not be completed.');
      }
    } catch (err) {
      setOAuthError(err.message || 'Failed to authenticate with Google. Please try again.');
    } finally {
      setOAuthLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    setError('');
    setOAuthError('');

    const clientId = getGoogleClientId(oauthConfig);
    const validation = validateGoogleClientId(clientId);

    if (!validation.valid) {
      setOAuthError(validation.error);
      setOAuthHelpDetails(validation.error);
      setShowOAuthHelpModal(true);
      return;
    }

    initiateGoogleSignIn({
      serverConfig: oauthConfig,
      onStart: () => {
        setOAuthLoading(true);
        setOAuthError('');
      },
      onSuccess: (data) => {
        login(data.user, data.access_token);
        toast.success(`Welcome back, ${data.user.name}!`);
        setActivePage('trip-dashboard');
      },
      onError: (errMsg, valDetails) => {
        setOAuthError(errMsg);
        if (valDetails && !valDetails.valid) {
          setOAuthHelpDetails(errMsg);
          setShowOAuthHelpModal(true);
        }
      },
      onEnd: () => {
        setOAuthLoading(false);
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.password) {
      setError('Please enter both email and password.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/auth/login', formData);
      if (res.success && res.data) {
        login(res.data.user, res.data.access_token);
        toast.success(`Welcome back, ${res.data.user.name}!`);
        setActivePage('trip-dashboard');
      } else {
        setError(res.message || 'Invalid email or password.');
      }
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    setForgotErrorMsg('');
    setForgotSuccessMsg('');
    setDemoToken('');

    if (!forgotEmail.trim()) {
      setForgotErrorMsg('Please enter your email address.');
      return;
    }

    try {
      setForgotLoading(true);
      const res = await api.post('/auth/forgot-password', { email: forgotEmail.trim() });
      if (res.success) {
        setForgotSuccessMsg(res.message || 'Password reset link sent to your email.');
        if (res.data?.demo_token) {
          setDemoToken(res.data.demo_token);
        }
      } else {
        setForgotErrorMsg(res.message || 'Unable to process password reset.');
      }
    } catch (err) {
      setForgotErrorMsg(err.message || 'Failed to submit forgot password request.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div style={{
      maxWidth: '460px',
      margin: '40px auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px'
    }}>
      <div className="glass-card" style={{ padding: '36px 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'var(--accent-gradient)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '12px',
            boxShadow: '0 4px 16px rgba(99, 102, 241, 0.4)'
          }}>
            <LogIn size={24} color="#fff" />
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Welcome Back</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            Sign in to access your intelligent trip plans
          </p>

          {/* Subtle Connection Status Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            marginTop: '10px',
            padding: '3px 10px',
            borderRadius: 'var(--radius-full)',
            background: apiStatus === 'online'
              ? 'rgba(16, 185, 129, 0.08)'
              : apiStatus === 'checking'
                ? 'rgba(148, 163, 184, 0.08)'
                : 'rgba(239, 68, 68, 0.08)',
            border: `1px solid ${
              apiStatus === 'online'
                ? 'rgba(16, 185, 129, 0.25)'
                : apiStatus === 'checking'
                  ? 'rgba(148, 163, 184, 0.2)'
                  : 'rgba(239, 68, 68, 0.25)'
            }`,
            fontSize: '0.74rem',
            fontWeight: 600,
            color: apiStatus === 'online'
              ? '#34d399'
              : apiStatus === 'checking'
                ? '#94a3b8'
                : '#f87171'
          }}>
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: apiStatus === 'online'
                ? '#10b981'
                : apiStatus === 'checking'
                  ? '#94a3b8'
                  : '#ef4444',
              boxShadow: apiStatus === 'online' ? '0 0 6px rgba(16, 185, 129, 0.6)' : 'none'
            }} />
            <span>
              {apiStatus === 'online' ? 'Online' : apiStatus === 'checking' ? 'Checking connection...' : 'Offline'}
            </span>
          </div>
        </div>

        {error && (
          <div style={{
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#f87171',
            fontSize: '0.88rem',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-dim)'
              }} />
              <input
                type="email"
                className="form-input"
                style={{ paddingLeft: '38px' }}
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label className="form-label" style={{ margin: 0 }}>Password</label>
              <button
                type="button"
                onClick={() => {
                  setForgotEmail(formData.email);
                  setShowForgotModal(true);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary)',
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  fontWeight: 600,
                  padding: 0
                }}
              >
                Forgot password?
              </button>
            </div>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-dim)'
              }} />
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                style={{ paddingLeft: '38px', paddingRight: '38px' }}
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
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

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '12px', padding: '12px' }}
            disabled={loading || oauthLoading}
          >
            {loading ? <LoadingSpinner text="Signing in..." /> : (
              <>
                <span>Sign In to TripPulse</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          margin: '24px 0',
          color: 'var(--text-dim)',
          fontSize: '0.82rem'
        }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          <span>or sign in with</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
        </div>

        {/* Real Google OAuth 2.0 Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={oauthLoading || loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            width: '100%',
            padding: '11px 16px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid var(--border)',
            color: '#fff',
            fontSize: '0.9rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'var(--transition-fast)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
            e.currentTarget.style.borderColor = 'var(--border)';
          }}
        >
          {oauthLoading ? (
            <LoadingSpinner text="Connecting to Google..." />
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15s.7 5.3 1.9 7.7l3.7-2.9z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16c1.8 3.7 5.6 7 10.1 7z"
                />
              </svg>
              <span>Continue with Google</span>
            </>
          )}
        </button>

        {oauthError && (
          <div style={{
            marginTop: '14px',
            padding: '12px 14px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#f87171',
            fontSize: '0.84rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span style={{ flex: 1, lineHeight: 1.4 }}>{oauthError}</span>
            </div>
            <button
              type="button"
              onClick={() => setShowOAuthHelpModal(true)}
              style={{
                alignSelf: 'flex-start',
                background: 'none',
                border: 'none',
                color: '#93c5fd',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                padding: 0,
                textDecoration: 'underline'
              }}
            >
              How do I configure Google OAuth credentials?
            </button>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
          Don't have an account?{' '}
          <button
            type="button"
            onClick={() => setActivePage('register')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--primary)',
              fontWeight: 600,
              cursor: 'pointer',
              padding: 0
            }}
          >
            Create account
          </button>
        </div>
      </div>

      {/* Google OAuth Setup Guide Modal */}
      {showOAuthHelpModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <div className="glass-card" style={{ maxWidth: '520px', width: '100%', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'rgba(99, 102, 241, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--primary)'
                }}>
                  <HelpCircle size={20} />
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>Google OAuth Setup Guide</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowOAuthHelpModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', lineHeight: 1.5, marginBottom: '16px' }}>
              To enable live Google Sign-In, configure a Google OAuth 2.0 Web Client in Google Cloud Console:
            </p>

            <ol style={{
              margin: '0 0 20px 20px',
              padding: 0,
              fontSize: '0.84rem',
              color: 'var(--text-main)',
              lineHeight: 1.6
            }}>
              <li>Visit <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', fontWeight: 600 }}>Google Cloud Console Credentials <ExternalLink size={12} style={{ display: 'inline' }} /></a>.</li>
              <li>Create credentials → <strong>OAuth client ID</strong> → Application type: <strong>Web application</strong>.</li>
              <li>Add Authorized JavaScript origins:
                <div style={{ background: 'rgba(0, 0, 0, 0.4)', padding: '6px 10px', borderRadius: '6px', margin: '4px 0', fontFamily: 'monospace', fontSize: '0.78rem' }}>
                  http://localhost:5174<br/>
                  http://127.0.0.1:5174
                </div>
              </li>
              <li>Add Authorized redirect URIs:
                <div style={{ background: 'rgba(0, 0, 0, 0.4)', padding: '6px 10px', borderRadius: '6px', margin: '4px 0', fontFamily: 'monospace', fontSize: '0.78rem' }}>
                  http://localhost:8000/api/v1/auth/google/callback<br/>
                  http://127.0.0.1:8000/api/v1/auth/google/callback
                </div>
              </li>
              <li>Copy the real Client ID and Secret to your environment files:
                <div style={{ background: 'rgba(0, 0, 0, 0.4)', padding: '8px 10px', borderRadius: '6px', margin: '4px 0', fontFamily: 'monospace', fontSize: '0.76rem', lineHeight: 1.6 }}>
                  <strong>frontend/.env:</strong><br/>
                  VITE_GOOGLE_CLIENT_ID="123456789012-xxx.apps.googleusercontent.com"<br/><br/>
                  <strong>backend/.env:</strong><br/>
                  GOOGLE_CLIENT_ID="123456789012-xxx.apps.googleusercontent.com"<br/>
                  GOOGLE_CLIENT_SECRET="GOCSPX-xxxxxxxxxxxxxxxxxxxx"
                </div>
              </li>
            </ol>


            <button
              type="button"
              className="btn btn-primary"
              style={{ width: '100%' }}
              onClick={() => setShowOAuthHelpModal(false)}
            >
              Got it!
            </button>
          </div>
        </div>
      )}

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <div className="glass-card" style={{ maxWidth: '440px', width: '100%', padding: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(99, 102, 241, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary)'
              }}>
                <KeyRound size={20} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Reset Password</h3>
            </div>

            {forgotErrorMsg && (
              <div style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#f87171',
                fontSize: '0.85rem',
                marginBottom: '14px'
              }}>
                {forgotErrorMsg}
              </div>
            )}

            {forgotSuccessMsg ? (
              <div>
                <div style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  color: '#34d399',
                  fontSize: '0.88rem',
                  marginBottom: '16px'
                }}>
                  {forgotSuccessMsg}
                </div>

                {demoToken && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ width: '100%', marginBottom: '12px' }}
                    onClick={() => {
                      setShowForgotModal(false);
                      if (onOpenResetPassword) {
                        onOpenResetPassword(demoToken);
                      } else {
                        setActivePage('reset-password');
                      }
                    }}
                  >
                    Proceed to Set New Password →
                  </button>
                )}

                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ width: '100%' }}
                  onClick={() => setShowForgotModal(false)}
                >
                  Back to Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPasswordSubmit}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '16px', lineHeight: 1.5 }}>
                  Enter your verified account email address to receive password recovery instructions.
                </p>

                <div className="form-group">
                  <label className="form-label">Account Email</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={18} style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--text-dim)'
                    }} />
                    <input
                      type="email"
                      placeholder="you@example.com"
                      className="form-input"
                      style={{ paddingLeft: '38px' }}
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ flex: 1 }}
                    onClick={() => setShowForgotModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ flex: 1 }}
                    disabled={forgotLoading}
                  >
                    {forgotLoading ? <LoadingSpinner text="Sending..." /> : 'Send Link'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
