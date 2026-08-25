import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  UserPlus, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  Compass,
  Sun,
  Moon
} from 'lucide-react';
import api from '../services/api';
import { getRawApiUrl } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../components/Toast';
import LoadingSpinner from '../components/LoadingSpinner';
import { initiateGoogleSignIn, exchangeOAuthCode, logOAuthDiagnostics, validateGoogleClientId, getGoogleClientId } from '../services/googleAuth';

export const Register = ({ setActivePage, backendStatus, loadingStatus = false }) => {
  const { login } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const toast = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirm_password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

  // OAuth Config and Processing
  const [oauthConfig, setOAuthConfig] = useState(null);
  const [oauthLoading, setOAuthLoading] = useState(false);
  const [oauthError, setOAuthError] = useState('');

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
    };
    initOAuth();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleGoogleSignUp = () => {
    setError('');
    setOAuthError('');

    const clientId = getGoogleClientId(oauthConfig);
    const validation = validateGoogleClientId(clientId);

    if (!validation.valid) {
      setOAuthError(validation.error);
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

    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/auth/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password
      });

      if (res.success && res.data) {
        login(res.data.user, res.data.access_token);
        toast.success(`Welcome to TripPulse, ${res.data.user.name}!`);
        setActivePage('trip-dashboard');
      } else {
        setError(res.message || 'Registration failed.');
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Email may already be in use.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1080px', margin: '24px auto', padding: '0 16px' }}>
      {/* Minimal Auth Header with API Status and Theme Toggle */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px',
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
          {/* Subtle API Health Status Indicator */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 12px',
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
            fontSize: '0.74rem',
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
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: apiStatus === 'online' 
                ? 'var(--success)' 
                : apiStatus === 'checking' 
                  ? 'var(--warning)' 
                  : 'var(--danger)',
              boxShadow: apiStatus === 'online' ? '0 0 8px rgba(16, 185, 129, 0.6)' : 'none'
            }} />
            <span>
              {apiStatus === 'online' ? 'API Online' : apiStatus === 'checking' ? 'Connecting...' : 'API Offline'}
            </span>
          </div>

          {/* Theme Switcher */}
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={toggleTheme}
            title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
            style={{
              padding: '6px 10px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              borderRadius: 'var(--radius-full)',
              cursor: 'pointer'
            }}
            aria-label="Toggle Theme"
          >
            {isDark ? <Sun size={15} color="#F4C95D" /> : <Moon size={15} color="#0FA3B1" />}
          </button>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        borderRadius: 'var(--radius-xl)',
        overflow: 'hidden',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-lg)',
        minHeight: '660px',
        background: 'var(--bg-card)'
      }} className="auth-split-wrapper">
        
        {/* Left Column: Inspirational Travel Visual + Quote */}
        <div style={{
          position: 'relative',
          background: `linear-gradient(135deg, rgba(11, 19, 43, 0.92) 0%, rgba(255, 107, 107, 0.72) 100%), url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80') center/cover`,
          padding: '48px 40px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          color: '#FFFFFF'
        }}>
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

          <div>
            <span className="badge badge-coral" style={{ background: 'rgba(255, 255, 255, 0.2)', color: '#FFFFFF', borderColor: 'rgba(255, 255, 255, 0.3)', marginBottom: '16px' }}>
              <Sparkles size={11} style={{ marginRight: '4px' }} /> START EXPLORING
            </span>
            <h2 style={{ fontSize: '2.1rem', fontWeight: 900, lineHeight: 1.2, color: '#FFFFFF', marginBottom: '16px', letterSpacing: '-0.02em' }}>
              "The journey of a thousand miles begins with a single step."
            </h2>
            <p style={{ color: 'rgba(255, 255, 255, 0.88)', fontSize: '0.96rem', lineHeight: 1.6 }}>
              Join thousands of travelers who plan stress-free, customized holidays powered by artificial intelligence.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.84rem', color: 'rgba(255, 255, 255, 0.9)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={16} color="#34D399" />
              <span>Automated day-by-day travel itineraries</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={16} color="#34D399" />
              <span>Collaborative group planning and expense splitting</span>
            </div>
          </div>
        </div>

        {/* Right Column: Clean Registration Form */}
        <div style={{
          padding: '44px 44px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          background: 'var(--bg-card)'
        }}>
          <div style={{ marginBottom: '24px' }}>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
              Create Your Account
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginTop: '4px' }}>
              Start planning intelligent trips in seconds.
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
              marginBottom: '18px',
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
              <label className="form-label">Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={17} style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-dim)',
                  pointerEvents: 'none'
                }} />
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '42px' }}
                  placeholder="Aswin Kumar"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={17} style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-dim)',
                  pointerEvents: 'none'
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

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={17} style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-dim)',
                    pointerEvents: 'none'
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
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-dim)',
                      cursor: 'pointer',
                      padding: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '6px',
                      transition: 'var(--transition-fast)'
                    }}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={17} style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-dim)',
                    pointerEvents: 'none'
                  }} />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="form-input"
                    style={{ paddingLeft: '42px', paddingRight: '42px' }}
                    placeholder="••••••••"
                    value={formData.confirm_password}
                    onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-dim)',
                      cursor: 'pointer',
                      padding: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '6px',
                      transition: 'var(--transition-fast)'
                    }}
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              style={{ width: '100%', marginTop: '10px' }}
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
            margin: '20px 0',
            color: 'var(--text-dim)',
            fontSize: '0.82rem'
          }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
            <span>or sign up with</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
          </div>

          <button
            type="button"
            onClick={handleGoogleSignUp}
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

          <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => setActivePage('login')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary)',
                fontWeight: 700,
                cursor: 'pointer',
                padding: 0
              }}
            >
              Sign in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
