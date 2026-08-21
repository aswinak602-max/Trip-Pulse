import React from 'react';
import { Compass, User, CheckCircle2, AlertCircle, Settings, LogOut, Menu, X, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export const Navbar = ({ 
  backendStatus,
  loadingStatus = false,
  activePage, 
  setActivePage,
  isMobileNavOpen = false,
  onToggleMobileNav = () => {}
}) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  
  // 3-state API health indicator: 'checking' | 'online' | 'offline'
  let apiStatus = 'checking';
  if (!loadingStatus) {
    if (backendStatus?.status === 'online' || backendStatus?.status === 'ok' || backendStatus?.success === true) {
      apiStatus = 'online';
    } else {
      apiStatus = 'offline';
    }
  }

  const isApiOnline = apiStatus === 'online';
  const isApiChecking = apiStatus === 'checking';

  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: '62px',
      padding: '0 24px',
      background: 'var(--bg-header)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      gap: '16px'
    }}>
      {/* Left: Mobile Toggle + Brand Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {isAuthenticated && (
          <button
            onClick={onToggleMobileNav}
            className="btn btn-ghost"
            style={{ padding: '6px', display: 'none' }}
            id="mobile-nav-toggle"
            aria-label="Toggle navigation menu"
          >
            {isMobileNavOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        )}

        <div 
          onClick={() => setActivePage(isAuthenticated ? 'dashboard' : 'welcome')} 
          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', userSelect: 'none' }}
          title="TripPulse Travel Platform"
        >
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '9px',
            background: 'var(--accent-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(59, 130, 246, 0.35)'
          }}>
            <Compass size={19} color="#ffffff" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{
              fontSize: '1.18rem',
              fontWeight: 800,
              color: 'var(--text-main)',
              letterSpacing: '-0.02em'
            }}>
              TripPulse
            </span>
            <span style={{
              fontSize: '0.66rem',
              padding: '2px 6px',
              borderRadius: '4px',
              background: 'rgba(59, 130, 246, 0.15)',
              color: '#3b82f6',
              fontWeight: 700,
              border: '1px solid rgba(59, 130, 246, 0.25)'
            }}>
              PRO
            </span>
          </div>
        </div>
      </div>

      {/* Right: API Status Indicator, Theme Switcher & User Profile Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Subtle API Health Dot */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 10px',
          borderRadius: 'var(--radius-full)',
          background: isApiOnline 
            ? 'rgba(16, 185, 129, 0.08)' 
            : isApiChecking 
              ? 'rgba(148, 163, 184, 0.08)' 
              : 'rgba(239, 68, 68, 0.08)',
          border: `1px solid ${
            isApiOnline 
              ? 'rgba(16, 185, 129, 0.25)' 
              : isApiChecking 
                ? 'rgba(148, 163, 184, 0.2)' 
                : 'rgba(239, 68, 68, 0.25)'
          }`,
          fontSize: '0.74rem',
          fontWeight: 600,
          color: isApiOnline 
            ? '#10b981' 
            : isApiChecking 
              ? 'var(--text-muted)' 
              : '#ef4444'
        }} title={
          isApiOnline 
            ? 'Backend API and database are connected at http://localhost:8000' 
            : isApiChecking 
              ? 'Checking connection to TripPulse server...' 
              : 'Backend offline: Unable to connect to http://localhost:8000'
        }>
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: isApiOnline 
              ? '#10b981' 
              : isApiChecking 
                ? '#94a3b8' 
                : '#ef4444',
            boxShadow: isApiOnline ? '0 0 6px rgba(16, 185, 129, 0.6)' : 'none'
          }} />
          <span>
            {isApiOnline ? 'API Online' : isApiChecking ? 'Checking API...' : 'API Offline'}
          </span>
        </div>

        {/* Theme Switcher Button */}
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={toggleTheme}
          title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
          style={{
            padding: '5px 10px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--border)',
            cursor: 'pointer'
          }}
          aria-label="Toggle Theme"
        >
          {isDark ? <Sun size={15} color="#fbbf24" /> : <Moon size={15} color="#6366f1" />}
          <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>
            {isDark ? 'Light' : 'Dark'}
          </span>
        </button>

        {/* User Auth Section */}
        {isAuthenticated ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Profile Chip */}
            <div 
              onClick={() => setActivePage('settings')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                background: activePage === 'settings' ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-subtle)',
                border: `1px solid ${activePage === 'settings' ? 'var(--primary)' : 'var(--border)'}`,
                cursor: 'pointer',
                transition: 'var(--transition-fast)'
              }}
              title="View settings & profile"
            >
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: user?.avatar_url ? `url(${user.avatar_url}) center/cover` : 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.72rem',
                fontWeight: 700,
                color: '#fff'
              }}>
                {!user?.avatar_url && (user?.name ? user.name.trim()[0].toUpperCase() : 'U')}
              </div>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-main)', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name || 'Explorer'}
              </span>
            </div>

            {/* Quick Action Buttons */}
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => setActivePage('settings')}
              title="Settings & Preferences"
              style={{ padding: '6px 8px' }}
            >
              <Settings size={14} />
            </button>

            <button 
              className="btn btn-secondary btn-sm" 
              onClick={() => {
                logout();
                setActivePage('welcome');
              }}
              title="Log out of TripPulse"
              style={{ padding: '6px 10px' }}
            >
              <LogOut size={13} style={{ marginRight: '3px' }} />
              <span>Logout</span>
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => setActivePage('login')}>Sign In</button>
            <button className="btn btn-primary btn-sm" onClick={() => setActivePage('register')}>Get Started</button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
