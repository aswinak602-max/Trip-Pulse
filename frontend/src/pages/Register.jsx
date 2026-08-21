import React, { useState, useEffect } from 'react';
import { User, Mail, Lock, Eye, EyeOff, UserPlus, ArrowRight, CheckCircle2, AlertCircle, Info, HelpCircle, ExternalLink, X } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';
import { initiateGoogleSignIn, exchangeOAuthCode, logOAuthDiagnostics, validateGoogleClientId, getGoogleClientId } from '../services/googleAuth';

export const Register = ({ setActivePage }) => {
  const { login } = useAuth();
  const toast = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirm_password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // OAuth Config and Processing
  const [oauthConfig, setOAuthConfig] = useState(null);
  const [oauthLoading, setOAuthLoading] = useState(false);
  const [oauthError, setOAuthError] = useState('');
  const [showOAuthHelpModal, setShowOAuthHelpModal] = useState(false);

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

      // Check if user was redirected to /register with OAuth params
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const errorParam = urlParams.get('error');
      const oauthToken = urlParams.get('oauth_token') || urlParams.get('token');

      if (oauthToken) {
        window.history.replaceState({}, document.title, window.location.pathname);
        api.get('/auth/me', { headers: { Authorization: `Bearer ${oauthToken}` } })
          .then((res) => {
            if (res.success && res.data && isMounted) {
              login(res.data, oauthToken);
              toast.success(`Welcome to TripPulse, ${res.data.name}!`);
              setActivePage('dashboard');
            }
          })
          .catch((err) => {
            console.warn('OAuth token exchange error:', err);
            if (isMounted) setOAuthError('Google sign-up session expired. Please try again.');
          });
        return;
      }

      if (errorParam) {
        window.history.replaceState({}, document.title, window.location.pathname);
        if (isMounted) {
          if (errorParam === 'access_denied') {
            setOAuthError('Google sign-up was cancelled.');
          } else if (errorParam === 'invalid_client') {
            setOAuthError('Google OAuth error (invalid_client): The GOOGLE_CLIENT_SECRET in backend/.env is invalid or expired. Please create a new Client Secret in Google Cloud Console and paste it into backend/.env.');
          } else if (errorParam === 'google_client_secret_missing') {
            setOAuthError('Google OAuth error: GOOGLE_CLIENT_SECRET is missing or placeholder in backend/.env. Please configure your rotated Google Client Secret in backend/.env.');
          } else if (errorParam === 'google_client_id_missing' || errorParam === 'google_oauth_not_configured') {
            setOAuthError('Google OAuth is not configured. Please ensure VITE_GOOGLE_CLIENT_ID in frontend/.env and GOOGLE_CLIENT_ID in backend/.env are set.');
          } else if (errorParam === 'oauth_verification_failed' || errorParam === 'token_exchange_failed') {
            setOAuthError('Google OAuth verification failed: Google rejected token exchange. Please ensure your real GOOGLE_CLIENT_SECRET from Google Cloud Console is configured in backend/.env.');
          } else if (errorParam === 'redirect_uri_mismatch') {
            setOAuthError('Google OAuth error (redirect_uri_mismatch): The Authorized Redirect URI in Google Cloud Console must match http://localhost:8000/api/v1/auth/google/callback.');
          } else if (errorParam === 'invalid_grant') {
            setOAuthError('Google OAuth error (invalid_grant): The authorization code expired or has already been used. Please try signing up again.');
          } else if (errorParam === 'missing_authorization_code') {
            setOAuthError('Google sign-up error: No authorization code received from Google.');
          } else if (errorParam === 'unverified_google_email') {
            setOAuthError('Google account email is not verified. Please verify your email with Google.');
          } else if (errorParam === 'google_userinfo_failed') {
            setOAuthError('Failed to fetch user profile information from Google.');
          } else if (errorParam === 'user_creation_failed') {
            setOAuthError('Failed to create or link user account in TripPulse database.');
          } else {
            setOAuthError(`Google registration notice: ${errorParam.replace(/_/g, ' ')}`);
          }
        }
      } else if (code) {
        window.history.replaceState({}, document.title, window.location.pathname);
        handleGoogleCodeExchange(code);
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
        toast.success(`Welcome to TripPulse, ${res.data.user.name}!`);
        setActivePage('dashboard');
      } else {
        setOAuthError(res.message || 'Google sign-up could not be completed.');
      }
    } catch (err) {
      setOAuthError(err.message || 'Failed to register with Google. Please try again.');
    } finally {
      setOAuthLoading(false);
    }
  };

  const handleGoogleSignUp = () => {
    setError('');
    setOAuthError('');

    const clientId = getGoogleClientId(oauthConfig);
    const validation = validateGoogleClientId(clientId);

    if (!validation.valid) {
      setOAuthError(validation.error);
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
        toast.success(`Welcome to TripPulse, ${data.user.name}!`);
        setActivePage('dashboard');
      },
      onError: (errMsg, valDetails) => {
        setOAuthError(errMsg);
        if (valDetails && !valDetails.valid) {
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

    if (formData.name.length < 2) {
      setError('Name must be at least 2 characters.');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/auth/register', formData);
      if (res.success && res.data) {
        login(res.data.user, res.data.access_token);
        toast.success(`Welcome to TripPulse, ${res.data.user.name}!`);
        setActivePage('dashboard');
      } else {
        setError(res.message || 'Registration failed.');
      }
    } catch (err) {
      setError(err.message || 'Unable to create account. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      maxWidth: '480px',
      margin: '30px auto',
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
            background: 'var(--emerald-gradient)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '12px',
            boxShadow: '0 4px 16px rgba(16, 185, 129, 0.3)'
          }}>
            <UserPlus size={24} color="#fff" />
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Create Your Account</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            Plan smarter, travel better with AI-powered itineraries
          </p>
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
            <label className="form-label">Full Name</label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-dim)'
              }} />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '38px' }}
                placeholder="Alex Mercer"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
          </div>

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
                placeholder="alex@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
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
                placeholder="•••••••• (Min. 6 chars)"
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

          <div className="form-group">
            <label className="form-label">Confirm Password</label>
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
                style={{ paddingLeft: '38px' }}
                placeholder="••••••••"
                value={formData.confirm_password}
                onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{
              width: '100%',
              marginTop: '12px',
              padding: '12px',
              background: 'var(--emerald-gradient)',
              borderColor: 'transparent'
            }}
            disabled={loading || oauthLoading}
          >
            {loading ? <LoadingSpinner text="Creating Account..." /> : (
              <>
                <span>Create TripPulse Account</span>
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
          <span>or sign up with</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
        </div>

        {/* Real Google OAuth 2.0 Button */}
        <button
          type="button"
          onClick={handleGoogleSignUp}
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
          Already have an account?{' '}
          <button
            type="button"
            onClick={() => setActivePage('login')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--primary)',
              fontWeight: 600,
              cursor: 'pointer',
              padding: 0
            }}
          >
            Sign in
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
              To enable live Google Sign-Up, configure a Google OAuth 2.0 Web Client in Google Cloud Console:
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
    </div>
  );
};

export default Register;
