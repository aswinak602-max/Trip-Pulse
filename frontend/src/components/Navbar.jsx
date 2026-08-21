import React, { useState } from 'react';
import { 
  Compass, 
  Sparkles, 
  MapPin, 
  Calendar, 
  Heart, 
  Bot, 
  Bell, 
  User, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  Sun, 
  Moon, 
  Layers,
  ChevronDown
} from 'lucide-react';
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
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  
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

  const navLinks = [
    { id: 'search', label: 'Explore', icon: MapPin },
    { id: 'create-trip', label: 'Plan Trip', icon: Calendar, badge: 'AI' },
    { id: isAuthenticated ? 'dashboard' : 'welcome', label: 'My Trips', icon: Layers },
    { id: 'assistant', label: 'AI Assistant', icon: Bot, isNew: true },
    { id: 'search', label: 'Favorites', icon: Heart, isFavorite: true },
  ];

  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: '66px',
      padding: '0 28px',
      background: 'var(--bg-header)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      gap: '16px'
    }}>
      {/* Left: Mobile Toggle + TripPulse Brand Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <button
          onClick={onToggleMobileNav}
          className="btn btn-ghost"
          style={{ padding: '6px', display: 'none' }}
          id="mobile-nav-toggle"
          aria-label="Toggle navigation menu"
        >
          {isMobileNavOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <div 
          onClick={() => setActivePage(isAuthenticated ? 'dashboard' : 'welcome')} 
          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', userSelect: 'none' }}
          title="TripPulse — Smart AI Travel Platform"
        >
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '11px',
            background: 'var(--brand-gradient)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(15, 163, 177, 0.35)',
            color: '#FFFFFF'
          }}>
            <Compass size={22} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              fontSize: '1.24rem',
              fontWeight: 800,
              color: 'var(--text-main)',
              letterSpacing: '-0.025em'
            }}>
              TripPulse
            </span>
            <span className="badge badge-teal" style={{ fontSize: '0.66rem', padding: '2px 7px' }}>
              <Sparkles size={10} style={{ marginRight: '2px' }} /> AI TRAVEL
            </span>
          </div>
        </div>
      </div>

      {/* Center: Desktop Navigation Links */}
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        background: 'var(--bg-surface)',
        padding: '4px 6px',
        borderRadius: 'var(--radius-full)',
        border: '1px solid var(--border)'
      }} className="desktop-nav">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = activePage === link.id && (!link.isFavorite || activePage === 'search');
          return (
            <button
              key={link.label}
              onClick={() => setActivePage(link.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                border: 'none',
                background: isActive ? 'var(--bg-card)' : 'transparent',
                color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                fontSize: '0.84rem',
                fontWeight: isActive ? 700 : 600,
                cursor: 'pointer',
                transition: 'var(--transition-fast)',
                boxShadow: isActive ? 'var(--shadow-xs)' : 'none'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = 'var(--text-main)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = 'var(--text-muted)';
                }
              }}
            >
              <Icon size={15} style={{ color: isActive ? 'var(--primary)' : 'var(--text-dim)' }} />
              <span>{link.label}</span>
              {link.badge && (
                <span className="badge badge-coral" style={{ fontSize: '0.6rem', padding: '1px 5px' }}>
                  {link.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Right: API Status, Theme Switcher, Notifications & Auth */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Subtle API Health Status Indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '5px 12px',
          borderRadius: 'var(--radius-full)',
          background: isApiOnline 
            ? 'rgba(16, 185, 129, 0.09)' 
            : isApiChecking 
              ? 'rgba(245, 158, 11, 0.09)' 
              : 'rgba(239, 68, 68, 0.09)',
          border: `1px solid ${
            isApiOnline 
              ? 'rgba(16, 185, 129, 0.25)' 
              : isApiChecking 
                ? 'rgba(245, 158, 11, 0.25)' 
                : 'rgba(239, 68, 68, 0.25)'
          }`,
          fontSize: '0.74rem',
          fontWeight: 700,
          color: isApiOnline 
            ? 'var(--success)' 
            : isApiChecking 
              ? 'var(--warning)' 
              : 'var(--danger)'
        }} title={
          isApiOnline 
            ? 'Backend API and SQLite database are active at http://localhost:8000' 
            : isApiChecking 
              ? 'Connecting to TripPulse server...' 
              : 'Backend offline: Check that http://localhost:8000 is running'
        }>
          <span style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            background: isApiOnline 
              ? 'var(--success)' 
              : isApiChecking 
                ? 'var(--warning)' 
                : 'var(--danger)',
            boxShadow: isApiOnline ? '0 0 8px rgba(16, 185, 129, 0.6)' : 'none'
          }} />
          <span>
            {isApiOnline ? 'API Online' : isApiChecking ? 'Connecting...' : 'API Offline'}
          </span>
        </div>

        {/* Theme Toggle Button */}
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={toggleTheme}
          title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
          style={{
            padding: '6px 10px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            borderRadius: 'var(--radius-full)',
            cursor: 'pointer'
          }}
          aria-label="Toggle Theme"
        >
          {isDark ? <Sun size={15} color="#F4C95D" /> : <Moon size={15} color="#0FA3B1" />}
        </button>

        {/* User Auth Section */}
        {isAuthenticated ? (
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Notification Bell */}
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => setActivePage('dashboard')}
              title="Travel Notifications"
              style={{ padding: '6px 8px', borderRadius: 'var(--radius-full)', position: 'relative' }}
            >
              <Bell size={15} />
              <span style={{
                position: 'absolute',
                top: '4px',
                right: '4px',
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: 'var(--accent-coral)'
              }} />
            </button>

            {/* Profile Avatar & Dropdown Trigger */}
            <div 
              onClick={() => setProfileDropdownOpen(prev => !prev)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 10px 4px 5px',
                borderRadius: 'var(--radius-full)',
                background: profileDropdownOpen ? 'var(--primary-light)' : 'var(--bg-surface)',
                border: `1px solid ${profileDropdownOpen ? 'var(--primary)' : 'var(--border)'}`,
                cursor: 'pointer',
                transition: 'var(--transition-fast)'
              }}
              title="User Account Menu"
            >
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: user?.avatar_url ? `url(${user.avatar_url}) center/cover` : 'var(--brand-gradient)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.76rem',
                fontWeight: 800,
                color: '#FFFFFF'
              }}>
                {!user?.avatar_url && (user?.name ? user.name.trim()[0].toUpperCase() : 'T')}
              </div>
              <span style={{
                fontSize: '0.84rem',
                fontWeight: 600,
                color: 'var(--text-main)',
                maxWidth: '110px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {user?.name || 'Traveler'}
              </span>
              <ChevronDown size={14} color="var(--text-dim)" />
            </div>

            {/* Dropdown Menu */}
            {profileDropdownOpen && (
              <div 
                style={{
                  position: 'absolute',
                  top: '44px',
                  right: 0,
                  width: '210px',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-lg)',
                  padding: '8px',
                  zIndex: 100,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
                onMouseLeave={() => setProfileDropdownOpen(false)}
              >
                <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)', marginBottom: '4px' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>{user?.name || 'Traveler'}</div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email || 'traveler@trippulse.app'}</div>
                </div>
                
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    setActivePage('settings');
                    setProfileDropdownOpen(false);
                  }}
                  style={{ justifyContent: 'flex-start', width: '100%', padding: '8px 10px' }}
                >
                  <Settings size={14} />
                  <span>Settings & Profile</span>
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    setActivePage('dashboard');
                    setProfileDropdownOpen(false);
                  }}
                  style={{ justifyContent: 'flex-start', width: '100%', padding: '8px 10px' }}
                >
                  <Layers size={14} />
                  <span>My Trips Hub</span>
                </button>
                
                <div style={{ borderTop: '1px solid var(--border)', marginTop: '4px', paddingTop: '4px' }}>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => {
                      logout();
                      setActivePage('welcome');
                      setProfileDropdownOpen(false);
                    }}
                    style={{ justifyContent: 'flex-start', width: '100%', padding: '8px 10px' }}
                  >
                    <LogOut size={14} />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            )}
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
