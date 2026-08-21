import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  LogIn, 
  ArrowRight, 
  AlertCircle, 
  Sparkles,
  Compass,
  CheckCircle2,
  HelpCircle, 
  ExternalLink, 
  X 
} from 'lucide-react';
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
            setOAuthError('Google OAuth error (invalid_client): The GOOGLE_CLIENT_SECRET in backend/.env is invalid or expired.');
          } else {
            setOAuthError(`Google authentication notice: ${errorParam.replace(/_/g, ' ')}`);
          }
        }
      } else if (code) {
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
      onError: (errMsg) => {
        setOAuthError(errMsg);
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

  return (
    <div style={{
      maxWidth: '1080px',
      margin: '30px auto',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      borderRadius: 'var(--radius-xl)',
      overflow: 'hidden',
      border: '1px solid var(--border)',
      boxShadow: 'var(--shadow-lg)',
      minHeight: '620px',
      background: 'var(--bg-card)'
    }} className="auth-split-wrapper">
      
      {/* Left Column: Inspirational Travel Visual + Quote */}
      <div style={{
        position: 'relative',
        background: `linear-gradient(135deg, rgba(11, 19, 43, 0.92) 0%, rgba(15, 163, 177, 0.75) 100%), url('https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1000&q=80') center/cover`,
        padding: '48px 40px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        color: '#FFFFFF'
      }}>
        {/* Top Brand Tag */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'rgba(255, 255, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(8px)',
            color: '#FFFFFF'
          }}>
            <Compass size={22} />
          </div>
          <span style={{ fontSize: '1.25rem', fontWeight: 900, letterSpacing: '-0.02em' }}>TripPulse</span>
        </div>

        {/* Center Quote */}
        <div>
          <span className="badge badge-teal" style={{ background: 'rgba(255, 255, 255, 0.2)', color: '#FFFFFF', borderColor: 'rgba(255, 255, 255, 0.3)', marginBottom: '16px' }}>
            <Sparkles size={11} style={{ marginRight: '4px' }} /> AI JOURNEY ARCHITECT
          </span>
          <h2 style={{ fontSize: '2.1rem', fontWeight: 900, lineHeight: 1.2, color: '#FFFFFF', marginBottom: '16px', letterSpacing: '-0.02em' }}>
            "Travel is the only thing you buy that makes you richer."
          </h2>
          <p style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '0.96rem', lineHeight: 1.6 }}>
            Access your personalized multi-day itineraries, machine-learning cost estimates, and real-time weather backup plans.
          </p>
        </div>

        {/* Bottom Feature Highlights */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.84rem', color: 'rgba(255, 255, 255, 0.9)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} color="#34D399" />
            <span>Multi-day intelligent routing without backtrack driving</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} color="#34D399" />
            <span>Curated sight catalogs with live weather alerts</span>
          </div>
        </div>
      </div>

      {/* Right Column: Clean Authentication Card */}
      <div style={{
        padding: '48px 44px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        background: 'var(--bg-card)'
      }}>
        <div style={{ marginBottom: '28px' }}>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            Welcome Back
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginTop: '4px' }}>
            Sign in to continue planning your intelligent journeys.
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
            alignItems: 'center',
            gap: '10px'
          }}>
            <AlertCircle size={17} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
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
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label className="form-label" style={{ margin: 0 }}>Password</label>
              <button
                type="button"
                onClick={() => {
                  if (formData.email) {
                    sessionStorage.setItem('reset_email', formData.email.trim());
                  }
                  setActivePage('forgot-password');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary)',
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  fontWeight: 700,
                  padding: 0
                }}
              >
                Forgot password?
              </button>
            </div>
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
                className="form-input"
                style={{ paddingLeft: '42px', paddingRight: '42px' }}
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
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: '12px' }}
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
          margin: '22px 0',
          color: 'var(--text-dim)',
          fontSize: '0.82rem'
        }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          <span>or continue with</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
        </div>

        {/* Real Google OAuth 2.0 Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={oauthLoading || loading}
          className="btn btn-secondary btn-md"
          style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '10px' }}
        >
          {oauthLoading ? (
            <LoadingSpinner text="Connecting to Google..." />
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z" />
                <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
                <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15s.7 5.3 1.9 7.7l3.7-2.9z" />
                <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16c1.8 3.7 5.6 7 10.1 7z" />
              </svg>
              <span>Continue with Google</span>
            </>
          )}
        </button>

        {oauthError && (
          <div style={{
            marginTop: '14px',
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--danger-bg)',
            border: '1px solid var(--danger-border)',
            color: 'var(--danger)',
            fontSize: '0.84rem'
          }}>
            {oauthError}
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Don't have an account?{' '}
          <button
            type="button"
            onClick={() => setActivePage('register')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--primary)',
              fontWeight: 700,
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
          background: 'rgba(11, 19, 43, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <div className="glass-card" style={{ maxWidth: '520px', width: '100%', padding: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Google OAuth Setup Guide</h3>
              <button
                type="button"
                onClick={() => setShowOAuthHelpModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.5, marginBottom: '16px' }}>
              Configure a Google OAuth 2.0 Web Client in Google Cloud Console:
            </p>

            <ol style={{
              margin: '0 0 20px 20px',
              padding: 0,
              fontSize: '0.86rem',
              color: 'var(--text-main)',
              lineHeight: 1.6
            }}>
              <li>Visit <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', fontWeight: 600 }}>Google Cloud Console Credentials <ExternalLink size={12} style={{ display: 'inline' }} /></a>.</li>
              <li>Create credentials → <strong>OAuth client ID</strong> → Application type: <strong>Web application</strong>.</li>
              <li>Add Authorized JavaScript origins: <code>http://localhost:5174</code></li>
              <li>Add Authorized redirect URIs: <code>http://localhost:8000/api/v1/auth/google/callback</code></li>
            </ol>

            <button
              type="button"
              className="btn btn-primary"
              style={{ width: '100%' }}
              onClick={() => setShowOAuthHelpModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
