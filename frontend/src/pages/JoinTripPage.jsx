import React, { useState, useEffect } from 'react';
import { 
  Compass, 
  Users, 
  MapPin, 
  Calendar, 
  ShieldCheck, 
  Navigation, 
  Radio, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

export const JoinTripPage = ({ setActivePage, onTripJoined }) => {
  const [tripId, setTripId] = useState(null);
  const [inviteInfo, setInviteInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [friendName, setFriendName] = useState('');
  const [friendEmail, setFriendEmail] = useState('');
  const [joinedMember, setJoinedMember] = useState(null);
  const [joining, setJoining] = useState(false);
  const [showLocationConsent, setShowLocationConsent] = useState(false);
  const [sharingLocation, setSharingLocation] = useState(false);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    // Extract tripId from URL query or path: /join?tripId=1 or /join/1
    const params = new URLSearchParams(window.location.search);
    let id = params.get('tripId') || params.get('id');
    if (!id) {
      const match = window.location.pathname.match(/\/join\/(\d+)/);
      if (match) id = match[1];
    }
    if (!id) id = '1'; // Default fallback

    setTripId(Number(id));

    const fetchInviteInfo = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await api.get(`/members/invite-info/${id}`);
        if (res && res.success && res.data) {
          setInviteInfo(res.data);
        } else {
          setError(res?.message || 'Trip invitation not found or link has expired.');
        }
      } catch (err) {
        console.error('Error fetching invite info:', err);
        setError(err.message || 'Unable to load trip invitation.');
      } finally {
        setLoading(false);
      }
    };

    fetchInviteInfo();
  }, []);

  const handleJoinSubmit = async (e) => {
    e.preventDefault();
    const cleanName = friendName.trim();
    if (!cleanName) {
      alert('Please enter your name to join the trip.');
      return;
    }

    try {
      setJoining(true);
      setError('');
      const res = await api.post('/members/join', {
        trip_id: tripId,
        name: cleanName,
        email: friendEmail.trim() || undefined,
        role: 'VIEW',
        is_sharing_location: false
      });

      if (res && res.success && res.data) {
        setJoinedMember(res.data);
        if (onTripJoined && res.data.trip) {
          onTripJoined(res.data.trip);
        }
        // Prompt for location sharing consent
        setShowLocationConsent(true);
      } else {
        setError(res?.message || 'Failed to join trip.');
      }
    } catch (err) {
      console.error('Error joining trip:', err);
      setError(err.message || 'Error occurred while joining trip.');
    } finally {
      setJoining(false);
    }
  };

  const handleEnableLocationSharing = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      finishAndEnterTrip();
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        try {
          await api.post('/members/location-toggle', {
            trip_id: tripId,
            member_id: joinedMember?.id,
            name: friendName,
            is_sharing: true,
            latitude: lat,
            longitude: lng
          });
          setSharingLocation(true);
        } catch (err) {
          console.warn('Error toggling location sharing:', err);
        } finally {
          setLocating(false);
          setShowLocationConsent(false);
          finishAndEnterTrip();
        }
      },
      (err) => {
        console.warn('Location permission denied or timed out:', err);
        setLocating(false);
        setShowLocationConsent(false);
        finishAndEnterTrip();
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  const handleDeclineLocationSharing = async () => {
    try {
      if (joinedMember?.id) {
        await api.post('/members/location-toggle', {
          trip_id: tripId,
          member_id: joinedMember.id,
          name: friendName,
          is_sharing: false
        });
      }
    } catch (e) {
      console.warn(e);
    }
    setShowLocationConsent(false);
    finishAndEnterTrip();
  };

  const finishAndEnterTrip = () => {
    if (setActivePage) {
      setActivePage('trip-dashboard');
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LoadingSpinner text="Loading TripPulse trip invitation..." />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '640px', margin: '40px auto', padding: '0 16px' }}>
      
      {/* Brand Badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '24px' }}>
        <div style={{
          width: '42px',
          height: '42px',
          borderRadius: '12px',
          background: 'var(--accent-gradient)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)'
        }}>
          <Compass size={24} color="#fff" />
        </div>
        <div>
          <span style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)' }}>TripPulse</span>
          <span style={{ fontSize: '0.72rem', marginLeft: '8px', padding: '2px 8px', borderRadius: '4px', background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', fontWeight: 700 }}>
            Trip Invitation
          </span>
        </div>
      </div>

      {/* Main Invitation Card */}
      <div className="glass-card" style={{ padding: '36px 32px', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
        
        {error ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <AlertCircle size={44} color="#ef4444" style={{ margin: '0 auto 12px auto' }} />
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '8px' }}>Invitation Error</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>{error}</p>
            <button className="btn btn-primary" onClick={() => setActivePage('welcome')}>
              Go to TripPulse Home
            </button>
          </div>
        ) : (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <span className="badge badge-info" style={{ marginBottom: '10px', fontSize: '0.8rem', padding: '4px 12px' }}>
                <Users size={14} /> You're Invited to Join!
              </span>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: '8px 0 6px 0' }}>
                {inviteInfo?.trip_title || 'Exciting Trip Getaway'}
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', margin: 0 }}>
                Invited by <strong style={{ color: '#60a5fa' }}>{inviteInfo?.inviter_name || 'Trip Leader'}</strong>
              </p>
            </div>

            {/* Trip Snapshot Highlights */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '10px',
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border)',
              marginBottom: '28px',
              textAlign: 'center'
            }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>Destination</div>
                <div style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginTop: '2px' }}>
                  <MapPin size={14} color="#ef4444" /> {inviteInfo?.destination || 'Destination'}
                </div>
              </div>
              <div style={{ borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>Duration</div>
                <div style={{ fontSize: '0.98rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginTop: '2px' }}>
                  <Calendar size={14} color="#3b82f6" /> {inviteInfo?.days_count || 3} Days
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>Role Assigned</div>
                <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', marginTop: '2px' }}>
                  <Eye size={14} /> View Only
                </div>
              </div>
            </div>

            {/* Join Form */}
            {!joinedMember ? (
              <form onSubmit={handleJoinSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontWeight: 700 }}>Your Full Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Enter your name (e.g. Sarah Jenkins)"
                    value={friendName}
                    onChange={(e) => setFriendName(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Email Address (Optional)</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="sarah@example.com"
                    value={friendEmail}
                    onChange={(e) => setFriendEmail(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-lg"
                  disabled={joining || !friendName.trim()}
                  style={{ marginTop: '8px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  {joining ? <LoadingSpinner text="Joining Group..." /> : <><span>Join Trip Group</span> <ArrowRight size={18} /></>}
                </button>
              </form>
            ) : null}

          </div>
        )}

      </div>

      {/* Explicit Location Sharing Permission Modal */}
      {showLocationConsent && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.78)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: '20px'
        }}>
          <div className="glass-card" style={{ width: '480px', maxWidth: '100%', padding: '32px', textAlign: 'center' }}>
            
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'rgba(16, 185, 129, 0.15)',
              color: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
              boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)'
            }}>
              <Radio size={28} className="pulse" />
            </div>

            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '8px' }}>
              Share Live Location with Trip Group?
            </h3>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: '24px' }}>
              Location sharing is <strong>100% opt-in and privacy-respecting</strong>. If you enable sharing, your trip mates can see your marker on the interactive trip map in real time. You can stop sharing at any time.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-primary btn-lg"
                onClick={handleEnableLocationSharing}
                disabled={locating}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                {locating ? <LoadingSpinner text="Requesting GPS Location..." /> : <><span>Share My Location</span> <CheckCircle2 size={18} /></>}
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleDeclineLocationSharing}
                style={{ width: '100%' }}
              >
                Not Now (Keep Disabled)
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default JoinTripPage;
