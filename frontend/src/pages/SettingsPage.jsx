import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Crown,
  Sliders,
  Bell,
  CheckCircle2,
  AlertTriangle,
  LogOut,
  Trash2,
  Save,
  Globe,
  Calendar,
  Compass,
  Sparkles,
  Shield,
  Clock,
  Navigation,
  ExternalLink,
  Plus,
  RefreshCw,
  X,
  Check
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

const AVATAR_OPTIONS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80'
];

export const SettingsPage = ({ setActivePage }) => {
  const { user, login, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('account');
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // 1. Account Settings State
  const [accountForm, setAccountForm] = useState({
    name: user?.name || '',
    username: user?.username || user?.email?.split('@')[0] || '',
    email: user?.email || '',
    avatar_url: user?.avatar_url || ''
  });

  // 2. Linked Mailboxes State
  const [mailboxes, setMailboxes] = useState([
    {
      id: 1,
      email: user?.email || 'user@example.com',
      provider: 'Google Workspace',
      status: 'Connected',
      last_synced: 'Today at 10:45 AM',
      is_primary: true
    }
  ]);
  const [showMailboxModal, setShowMailboxModal] = useState(false);

  // 3. User Preferences State
  const parseJSON = (str, fallback) => {
    try {
      return str ? JSON.parse(str) : fallback;
    } catch {
      return fallback;
    }
  };

  const initialPreferences = parseJSON(user?.preferences, {
    language: 'English',
    date_format: 'MM/DD/YYYY', // Month/Day
    distance_format: 'km', // Kilometers
    time_format: '12h', // 12-hour
    place_descriptions: 'both', // 'both' | 'empty_only'
    export_travel_tips: true,
    trip_journal_backup: true
  });

  const [preferences, setPreferences] = useState(initialPreferences);

  // 4. Notifications State
  const initialNotifications = parseJSON(user?.notification_settings, {
    trip_reminders: true,
    upcoming_trip_reminders: true,
    itinerary_reminders: true,
    location_time_reminders: true,
    weather_alerts: true,
    travel_delay_alerts: true,
    budget_alerts: false,
    general_travel_tips: true
  });

  const [notifications, setNotifications] = useState(initialNotifications);

  // Modals
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => {
    if (user) {
      setAccountForm({
        name: user.name || '',
        username: user.username || user.email?.split('@')[0] || '',
        email: user.email || '',
        avatar_url: user.avatar_url || ''
      });
      if (user.preferences) {
        setPreferences(parseJSON(user.preferences, initialPreferences));
      }
      if (user.notification_settings) {
        setNotifications(parseJSON(user.notification_settings, initialNotifications));
      }
    }
  }, [user]);

  const showNotification = (msg, isError = false) => {
    if (isError) {
      setErrorMessage(msg);
      setSuccessMessage('');
    } else {
      setSuccessMessage(msg);
      setErrorMessage('');
    }
    setTimeout(() => {
      setSuccessMessage('');
      setErrorMessage('');
    }, 4000);
  };

  // Save Account Info
  const handleSaveAccount = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put('/auth/profile', accountForm);
      if (res.success && res.data) {
        login(res.data, localStorage.getItem('token'));
        showNotification('✓ Account settings updated successfully!');
      } else {
        showNotification(res.message || 'Failed to update account.', true);
      }
    } catch (err) {
      showNotification(err.message || 'Error updating account settings.', true);
    } finally {
      setSaving(false);
    }
  };

  // Save Preferences
  const handleSavePreferences = async (updatedPrefs, updatedNotifs) => {
    setSaving(true);
    try {
      const res = await api.put('/auth/preferences', {
        preferences: updatedPrefs || preferences,
        notification_settings: updatedNotifs || notifications
      });
      if (res.success && res.data) {
        login(res.data, localStorage.getItem('token'));
        showNotification('✓ Preferences saved successfully!');
      } else {
        showNotification(res.message || 'Failed to save preferences.', true);
      }
    } catch (err) {
      showNotification(err.message || 'Error saving preferences.', true);
    } finally {
      setSaving(false);
    }
  };

  // Delete Account
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      alert('Please type DELETE to confirm permanent account deletion.');
      return;
    }

    try {
      setDeleting(true);
      const res = await api.delete('/auth/account');
      if (res.success) {
        logout();
        alert('Your TripPulse account and all associated data have been permanently deleted.');
        setActivePage('welcome');
      } else {
        alert(res.message || 'Failed to delete account.');
      }
    } catch (err) {
      alert(err.message || 'Error occurred while deleting account.');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const navItems = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'mailboxes', label: 'Linked Mailboxes', icon: Mail },
    { id: 'pro', label: 'Pro Membership', icon: Crown, badge: 'Pro' },
    { id: 'preferences', label: 'User Preferences', icon: Sliders },
    { id: 'notifications', label: 'Notifications', icon: Bell }
  ];

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Settings Header Banner */}
      <div className="glass-card" style={{
        background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.4) 0%, rgba(88, 28, 135, 0.3) 100%)',
        border: '1px solid rgba(99, 102, 241, 0.3)',
        padding: '24px 32px'
      }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', marginBottom: '4px' }}>
          Settings & Preferences
        </h1>
        <p style={{ color: '#cbd5e1', fontSize: '0.9rem', margin: 0 }}>
          Manage your profile, linked accounts, display units, trip planner configurations, and notifications.
        </p>
      </div>

      {/* Global Alerts */}
      {successMessage && (
        <div style={{
          padding: '12px 18px',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.35)',
          color: '#34d399',
          fontSize: '0.9rem',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <CheckCircle2 size={18} />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div style={{
          padding: '12px 18px',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          color: '#f87171',
          fontSize: '0.9rem',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <AlertTriangle size={18} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 2-Column Layout: Sidebar Nav + Settings Card */}
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '24px', alignItems: 'start' }}>
        
        {/* Navigation Tabs */}
        <div className="glass-card" style={{ padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  border: 'none',
                  background: isActive ? 'var(--primary-light)' : 'transparent',
                  color: isActive ? '#60a5fa' : 'var(--text-muted)',
                  fontSize: '0.9rem',
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'var(--transition-fast)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Icon size={18} style={{ color: isActive ? '#3b82f6' : 'inherit' }} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span style={{
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: 'rgba(234, 179, 8, 0.2)',
                    color: '#facc15'
                  }}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content Panels */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* ================= 1. ACCOUNT TAB ================= */}
          {activeTab === 'account' && (
            <div className="glass-card" style={{ padding: '32px' }}>
              <div style={{ marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                  Account Profile
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', marginTop: '4px', margin: 0 }}>
                  Update your personal details, avatar, and manage your TripPulse credentials.
                </p>
              </div>

              <form onSubmit={handleSaveAccount}>
                {/* Profile Picture / Avatar Section */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
                  <div style={{
                    width: '72px',
                    height: '72px',
                    borderRadius: '50%',
                    background: accountForm.avatar_url ? `url(${accountForm.avatar_url}) center/cover` : 'var(--accent-gradient)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.8rem',
                    fontWeight: 800,
                    color: '#fff',
                    boxShadow: '0 4px 16px rgba(99, 102, 241, 0.4)',
                    border: '2px solid rgba(255, 255, 255, 0.2)',
                    flexShrink: 0
                  }}>
                    {!accountForm.avatar_url && (accountForm.name ? accountForm.name[0].toUpperCase() : 'U')}
                  </div>

                  <div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>
                      Profile Photo
                    </div>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {AVATAR_OPTIONS.map((imgUrl, idx) => (
                        <div
                          key={idx}
                          onClick={() => setAccountForm({ ...accountForm, avatar_url: imgUrl })}
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            backgroundImage: `url(${imgUrl})`,
                            backgroundSize: 'cover',
                            cursor: 'pointer',
                            border: accountForm.avatar_url === imgUrl ? '2px solid var(--primary)' : '1px solid var(--border)',
                            transform: accountForm.avatar_url === imgUrl ? 'scale(1.15)' : 'scale(1)'
                          }}
                        />
                      ))}
                      <button
                        type="button"
                        onClick={() => setAccountForm({ ...accountForm, avatar_url: '' })}
                        style={{
                          fontSize: '0.75rem',
                          background: 'rgba(255, 255, 255, 0.06)',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius-full)',
                          color: 'var(--text-muted)',
                          padding: '2px 10px',
                          cursor: 'pointer'
                        }}
                      >
                        Default Initial
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid-2" style={{ gap: '16px', marginBottom: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input
                      type="text"
                      className="form-input"
                      value={accountForm.name}
                      onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Username</label>
                    <input
                      type="text"
                      className="form-input"
                      value={accountForm.username}
                      onChange={(e) => setAccountForm({ ...accountForm, username: e.target.value })}
                      placeholder="aswin_traveller"
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '24px' }}>
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-input"
                    value={accountForm.email}
                    onChange={(e) => setAccountForm({ ...accountForm, email: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-start', gap: '12px', marginBottom: '32px' }}>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={saving}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px' }}
                  >
                    {saving ? <LoadingSpinner text="Saving..." /> : <><Save size={16} /> Save Changes</>}
                  </button>
                </div>
              </form>

              {/* Danger Zone: Logout & Delete Account */}
              <div style={{
                borderTop: '1px solid rgba(239, 68, 68, 0.25)',
                paddingTop: '24px',
                background: 'rgba(239, 68, 68, 0.03)',
                padding: '20px',
                borderRadius: 'var(--radius-lg)'
              }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#f87171', marginBottom: '8px' }}>
                  Account Actions
                </h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                  Sign out of your active session or permanently erase your user profile and all associated trip itineraries.
                </p>

                <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      logout();
                      setActivePage('welcome');
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <LogOut size={15} /> Sign Out
                  </button>

                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={() => {
                      setDeleteConfirmText('');
                      setShowDeleteModal(true);
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.4)' }}
                  >
                    <Trash2 size={15} /> Delete Account
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================= 2. LINKED MAILBOXES TAB ================= */}
          {activeTab === 'mailboxes' && (
            <div className="glass-card" style={{ padding: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                    Linked Mailboxes
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', marginTop: '4px', margin: 0 }}>
                    Automatically sync flight bookings, hotel reservations, and tickets from your inbox.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => setShowMailboxModal(true)}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Plus size={15} /> Link Mailbox
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {mailboxes.map((box) => (
                  <div
                    key={box.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '16px 20px',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid var(--border)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '10px',
                        background: 'rgba(99, 102, 241, 0.15)',
                        color: 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <Mail size={20} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#fff' }}>{box.email}</span>
                          {box.is_primary && (
                            <span className="badge badge-info" style={{ fontSize: '0.68rem', padding: '2px 6px' }}>Primary</span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {box.provider} • Status: <span style={{ color: '#34d399' }}>{box.status}</span> • Last Synced: {box.last_synced}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => alert(`Synchronizing inbox reservations for ${box.email}...`)}
                        title="Sync reservations now"
                      >
                        <RefreshCw size={14} />
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          if (confirm(`Are you sure you want to disconnect ${box.email}?`)) {
                            setMailboxes(mailboxes.filter(m => m.id !== box.id));
                            showNotification('Mailbox disconnected successfully.');
                          }
                        }}
                      >
                        Disconnect
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= 3. PRO MEMBERSHIP TAB ================= */}
          {activeTab === 'pro' && (
            <div className="glass-card" style={{ padding: '32px' }}>
              <div style={{ marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Crown size={22} color="#facc15" />
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                    Membership & Subscriptions
                  </h3>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', marginTop: '4px', margin: 0 }}>
                  Manage your subscription tier, billing, and unlock advanced AI travel features.
                </p>
              </div>

              {/* Current Tier Badge */}
              <div style={{
                padding: '20px 24px',
                borderRadius: 'var(--radius-lg)',
                background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.12) 0%, rgba(99, 102, 241, 0.15) 100%)',
                border: '1px solid rgba(234, 179, 8, 0.3)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '16px',
                marginBottom: '28px'
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#facc15', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Plan</span>
                    <span className="badge badge-warning" style={{ fontSize: '0.72rem' }}>Basic Free Tier</span>
                  </div>
                  <h4 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff', marginTop: '4px', marginBottom: '2px' }}>
                    TripPulse Standard Edition
                  </h4>
                  <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                    Standard AI Trip Planning with basic Machine Learning cost estimators.
                  </div>
                </div>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setShowUpgradeModal(true)}
                  style={{
                    background: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)',
                    borderColor: '#eab308',
                    color: '#000',
                    fontWeight: 800,
                    boxShadow: '0 4px 16px rgba(234, 179, 8, 0.3)'
                  }}
                >
                  Upgrade to Pro Edition
                </button>
              </div>

              {/* Feature Comparison */}
              <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginBottom: '14px' }}>
                Pro Membership Advantages
              </h4>
              <div className="grid-2" style={{ gap: '14px' }}>
                {[
                  { title: 'Unlimited Trip Architectures', desc: 'Create and persist unlimited trip plans and multi-city routes.' },
                  { title: 'Full K-Means Recommendation Engine', desc: 'Precision 9D interest vector clustering with zero rate limits.' },
                  { title: 'Real-Time Flight & Delay Alerts', desc: 'Continuous airport schedule and weather disruption radar.' },
                  { title: 'Offline Journal & Map PDF Exporter', desc: 'Download high-resolution itinerary packets for remote treks.' },
                  { title: 'AI Tourist Assistant Priority Queue', desc: 'Instant multilingual tourist queries with Gemini intelligence.' },
                  { title: 'Multi-Member Expense Auto-Settler', desc: 'Smart algorithms to minimize peer-to-peer split transactions.' }
                ].map((feat, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '14px 16px',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      gap: '12px',
                      alignItems: 'flex-start'
                    }}
                  >
                    <div style={{ color: '#34d399', marginTop: '2px' }}><Check size={16} /></div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#fff' }}>{feat.title}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>{feat.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= 4. USER PREFERENCES TAB ================= */}
          {activeTab === 'preferences' && (
            <div className="glass-card" style={{ padding: '32px' }}>
              <div style={{ marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                  User Preferences
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', marginTop: '4px', margin: 0 }}>
                  Customize date, distance units, time formats, language, and planner display settings.
                </p>
              </div>

              {/* Language Section */}
              <div style={{ marginBottom: '28px' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.92rem' }}>
                  <Globe size={16} color="var(--primary)" /> Language
                </label>
                <select
                  className="form-input"
                  style={{ maxWidth: '300px' }}
                  value={preferences.language}
                  onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
                >
                  <option value="English">English (United States)</option>
                  <option value="Tamil">Tamil (தமிழ்)</option>
                  <option value="Hindi">Hindi (हिन्दी)</option>
                  <option value="French">French (Français)</option>
                  <option value="German">German (Deutsch)</option>
                  <option value="Spanish">Spanish (Español)</option>
                  <option value="Japanese">Japanese (日本語)</option>
                </select>
              </div>

              {/* Unit & Display Preferences */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px', marginBottom: '28px' }}>
                <h4 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#fff', marginBottom: '16px' }}>
                  Unit and Display Preferences
                </h4>

                <div className="grid-3" style={{ gap: '16px' }}>
                  {/* Date Format */}
                  <div>
                    <label className="form-label">Date Format</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {[
                        { id: 'MM/DD/YYYY', label: 'Month/Day (09/10/2026)' },
                        { id: 'DD/MM/YYYY', label: 'Day/Month (10/09/2026)' }
                      ].map((fmt) => (
                        <label key={fmt.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.86rem', color: '#cbd5e1' }}>
                          <input
                            type="radio"
                            name="date_format"
                            checked={preferences.date_format === fmt.id}
                            onChange={() => setPreferences({ ...preferences, date_format: fmt.id })}
                          />
                          {fmt.label}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Distance Format */}
                  <div>
                    <label className="form-label">Distance Format</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {[
                        { id: 'km', label: 'Kilometers (km)' },
                        { id: 'mi', label: 'Miles (mi)' }
                      ].map((dst) => (
                        <label key={dst.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.86rem', color: '#cbd5e1' }}>
                          <input
                            type="radio"
                            name="distance_format"
                            checked={preferences.distance_format === dst.id}
                            onChange={() => setPreferences({ ...preferences, distance_format: dst.id })}
                          />
                          {dst.label}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Time Format */}
                  <div>
                    <label className="form-label">Time Format</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {[
                        { id: '12h', label: '12-hour (02:30 PM)' },
                        { id: '24h', label: '24-hour (14:30)' }
                      ].map((tmf) => (
                        <label key={tmf.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.86rem', color: '#cbd5e1' }}>
                          <input
                            type="radio"
                            name="time_format"
                            checked={preferences.time_format === tmf.id}
                            onChange={() => setPreferences({ ...preferences, time_format: tmf.id })}
                          />
                          {tmf.label}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Trip Planner Settings */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px', marginBottom: '28px' }}>
                <h4 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#fff', marginBottom: '16px' }}>
                  Trip Planner Display Options
                </h4>

                <div style={{ marginBottom: '16px' }}>
                  <label className="form-label">Place descriptions from the web</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.86rem', color: '#cbd5e1' }}>
                      <input
                        type="radio"
                        name="place_desc"
                        checked={preferences.place_descriptions === 'both'}
                        onChange={() => setPreferences({ ...preferences, place_descriptions: 'both' })}
                      />
                      Show in empty notes and below my custom notes
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.86rem', color: '#cbd5e1' }}>
                      <input
                        type="radio"
                        name="place_desc"
                        checked={preferences.place_descriptions === 'empty_only'}
                        onChange={() => setPreferences({ ...preferences, place_descriptions: 'empty_only' })}
                      />
                      Only show in empty notes
                    </label>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#fff' }}>Export travel tips</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Include AI curated recommendations when downloading trip itineraries</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.export_travel_tips}
                    onChange={(e) => setPreferences({ ...preferences, export_travel_tips: e.target.checked })}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                </div>
              </div>

              {/* Trip Journal Section */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px', marginBottom: '28px' }}>
                <h4 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#fff', marginBottom: '12px' }}>
                  Trip Journal Settings
                </h4>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#fff' }}>Automatic Journal Photo Backup</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Sync journey logs and checkpoint photos with cloud storage</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.trip_journal_backup}
                    onChange={(e) => setPreferences({ ...preferences, trip_journal_backup: e.target.checked })}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                </div>
              </div>

              <button
                type="button"
                className="btn btn-primary"
                onClick={() => handleSavePreferences(preferences, notifications)}
                disabled={saving}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px' }}
              >
                {saving ? <LoadingSpinner text="Saving..." /> : <><Save size={16} /> Save Preferences</>}
              </button>
            </div>
          )}

          {/* ================= 5. NOTIFICATIONS TAB ================= */}
          {activeTab === 'notifications' && (
            <div className="glass-card" style={{ padding: '32px' }}>
              <div style={{ marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '16px' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                  Notification Settings
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', marginTop: '4px', margin: 0 }}>
                  Configure intelligent reminders, weather alerts, itinerary time tracking, and budget warnings.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '28px' }}>
                {[
                  { key: 'trip_reminders', title: 'Trip Reminders', desc: 'Receive countdowns and preparation checklists prior to trip departure.' },
                  { key: 'upcoming_trip_reminders', title: 'Upcoming Trip Reminders', desc: 'Notifications 24 hours before key travel dates and booked reservations.' },
                  { key: 'itinerary_reminders', title: 'Itinerary Reminders', desc: 'Alerts for upcoming scheduled activities during active trip days.' },
                  { key: 'location_time_reminders', title: 'Location & Time Management Reminders', desc: 'Intelligent alerts when spending too much time at a location to keep your itinerary on track.' },
                  { key: 'weather_alerts', title: 'Weather Alerts', desc: 'Severe rain, storm, and temperature change warnings for your destination.' },
                  { key: 'travel_delay_alerts', title: 'Travel Delay Alerts', desc: 'Transit route congestion warnings and suggestions for alternative roads.' },
                  { key: 'budget_alerts', title: 'Budget Alerts', desc: 'Alerts when your group expenses exceed 80% of the allocated target budget.' },
                  { key: 'general_travel_tips', title: 'General Travel Tips', desc: 'Curated cultural customs, local delicacies, and packing tips.' }
                ].map((item) => {
                  const isChecked = !!notifications[item.key];
                  return (
                    <div
                      key={item.key}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '14px 18px',
                        borderRadius: 'var(--radius-md)',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid var(--border)',
                        transition: 'var(--transition-fast)'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff' }}>{item.title}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>{item.desc}</div>
                      </div>

                      {/* Custom Toggle Switch */}
                      <div
                        onClick={() => {
                          const updated = { ...notifications, [item.key]: !isChecked };
                          setNotifications(updated);
                        }}
                        style={{
                          width: '46px',
                          height: '24px',
                          borderRadius: '12px',
                          background: isChecked ? 'var(--primary)' : 'rgba(255, 255, 255, 0.15)',
                          cursor: 'pointer',
                          position: 'relative',
                          transition: 'background 0.2s ease',
                          flexShrink: 0
                        }}
                      >
                        <div style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          background: '#fff',
                          position: 'absolute',
                          top: '3px',
                          left: isChecked ? '25px' : '3px',
                          transition: 'left 0.2s ease',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                className="btn btn-primary"
                onClick={() => handleSavePreferences(preferences, notifications)}
                disabled={saving}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px' }}
              >
                {saving ? <LoadingSpinner text="Saving..." /> : <><Save size={16} /> Save Notification Preferences</>}
              </button>
            </div>
          )}

        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <div className="glass-card" style={{ maxWidth: '460px', width: '100%', padding: '32px', border: '1px solid rgba(239, 68, 68, 0.4)' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#f87171',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px auto'
              }}>
                <AlertTriangle size={26} />
              </div>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff' }}>
                Permanently Delete Account?
              </h3>
              <p style={{ color: '#fca5a5', fontSize: '0.85rem', lineHeight: 1.5, marginTop: '6px' }}>
                Warning: This action is <strong>irreversible</strong>. All your trip plans, expenses, group memberships, and saved places will be permanently deleted from TripPulse.
              </p>
            </div>

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label className="form-label" style={{ fontSize: '0.82rem' }}>
                Type <strong style={{ color: '#f87171' }}>DELETE</strong> to confirm:
              </label>
              <input
                type="text"
                className="form-input"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                style={{ flex: 1, background: '#dc2626', borderColor: '#dc2626', color: '#fff' }}
                disabled={deleteConfirmText !== 'DELETE' || deleting}
                onClick={handleDeleteAccount}
              >
                {deleting ? <LoadingSpinner text="Deleting..." /> : 'Confirm Deletion'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Pro Modal */}
      {showUpgradeModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <div className="glass-card" style={{ maxWidth: '480px', width: '100%', padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Crown size={22} color="#facc15" />
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                  TripPulse Pro Edition
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowUpgradeModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.5, marginBottom: '20px' }}>
              Unlock unlimited AI itineraries, real-time flight radar, weather delay alerts, and automatic expense splitters.
            </p>

            <div style={{
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(234, 179, 8, 0.1)',
              border: '1px solid rgba(234, 179, 8, 0.3)',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff' }}>₹499 <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>/ year</span></div>
              <div style={{ fontSize: '0.78rem', color: '#fde047', marginTop: '4px' }}>All AI features included • No commitment</div>
            </div>

            <div style={{
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border)',
              fontSize: '0.82rem',
              color: '#93c5fd',
              marginBottom: '24px'
            }}>
              Payment gateway integration is currently in sandbox preview mode. No live charges will be processed.
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => setShowUpgradeModal(false)}
              >
                Close
              </button>
              <button
                type="button"
                className="btn btn-primary"
                style={{ flex: 1, background: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)', borderColor: '#eab308', color: '#000', fontWeight: 800 }}
                onClick={() => {
                  alert('Pro membership features simulated! In production, this opens the Stripe/Razorpay secure checkout.');
                  setShowUpgradeModal(false);
                }}
              >
                Start Free Trial
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Link Mailbox Modal */}
      {showMailboxModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <div className="glass-card" style={{ maxWidth: '440px', width: '100%', padding: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                Connect Mailbox
              </h3>
              <button
                type="button"
                onClick={() => setShowMailboxModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', lineHeight: 1.5, marginBottom: '20px' }}>
              TripPulse scans your travel confirmation emails automatically without storing or sharing your personal email contents.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  alert('Google Workspace mailbox connection architecture ready. Connect your Gmail account via OAuth.');
                  setShowMailboxModal(false);
                }}
                style={{ padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
              >
                <Mail size={18} color="#EA4335" /> Connect Gmail / Google Workspace
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  alert('Outlook mailbox connection architecture ready. Connect your Microsoft 365 account via OAuth.');
                  setShowMailboxModal(false);
                }}
                style={{ padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
              >
                <Mail size={18} color="#0078D4" /> Connect Microsoft Outlook
              </button>
            </div>

            <button
              type="button"
              className="btn btn-secondary"
              style={{ width: '100%' }}
              onClick={() => setShowMailboxModal(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default SettingsPage;
