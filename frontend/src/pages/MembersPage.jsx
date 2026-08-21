import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  Trash2, 
  MapPin, 
  Radio, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  Edit,
  Crown,
  Share2,
  Copy,
  Check,
  Send,
  MessageCircle,
  Mail,
  Smartphone,
  Navigation
} from 'lucide-react';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

export const MembersPage = ({ trip, setActivePage }) => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [isSharingLocation, setIsSharingLocation] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTab, setActiveTab] = useState('share'); // 'share' | 'manual'
  const [inviteForm, setInviteForm] = useState({
    name: '',
    email: '',
    role: 'VIEW'
  });

  const tripId = trip?.id || 1;
  const tripTitle = trip?.title || 'Trip Getaway';
  const destination = trip?.destination || 'Destination';

  // Construct standard deep invite link
  const inviteLink = `${window.location.origin}/join?tripId=${tripId}&inviter=${encodeURIComponent('Aswin')}`;
  const shareMessage = `Join my trip "${tripTitle}" to ${destination} on TripPulse! Click here to join: ${inviteLink}`;

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/members/${tripId}`);
      if (res.success && res.data) {
        setMembers(res.data);
        const selfMember = res.data.find(m => m.email === 'aswin@example.com' || m.role === 'OWNER');
        if (selfMember) {
          setIsSharingLocation(selfMember.is_sharing_location);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [tripId]);

  // WebSocket real-time subscription for live location events
  useEffect(() => {
    if (!tripId) return;

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = window.location.hostname === 'localhost' ? 'localhost:8000' : window.location.host;
    const wsUrl = `${wsProtocol}//${wsHost}/ws/trips/${tripId}/location`;

    let socket = null;
    try {
      socket = new WebSocket(wsUrl);

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'location_update') {
            setMembers(prev => {
              const idx = prev.findIndex(m => 
                (payload.user_id && m.user_id === payload.user_id) ||
                (payload.user_name && m.name && m.name.toLowerCase() === payload.user_name.toLowerCase())
              );
              if (idx >= 0) {
                const updated = [...prev];
                updated[idx] = {
                  ...updated[idx],
                  is_sharing_location: payload.is_sharing,
                  last_latitude: payload.latitude,
                  last_longitude: payload.longitude,
                  last_location_time: payload.timestamp
                };
                return updated;
              }
              return prev;
            });
          }
        } catch (e) {
          console.warn('Error parsing WebSocket message:', e);
        }
      };
    } catch (e) {
      console.warn('WebSocket connection error:', e);
    }

    return () => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, [tripId]);

  const handleToggleLocationSharing = async () => {
    const nextState = !isSharingLocation;
    setIsSharingLocation(nextState);

    if (nextState && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            await api.post('/members/location-toggle', {
              trip_id: tripId,
              is_sharing: true,
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude
            });
            await fetchMembers();
          } catch (err) {
            console.warn(err);
          }
        },
        async () => {
          // Fallback approximate
          try {
            await api.post('/members/location-toggle', {
              trip_id: tripId,
              is_sharing: true,
              latitude: 11.0168,
              longitude: 76.9558
            });
            await fetchMembers();
          } catch (err) {
            alert(err.message || 'Failed to update location sharing');
          }
        }
      );
    } else {
      try {
        await api.post('/members/location-toggle', {
          trip_id: tripId,
          is_sharing: false
        });
        await fetchMembers();
      } catch (err) {
        alert(err.message || 'Failed to disable location sharing');
      }
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `TripPulse: Join ${tripTitle}`,
          text: shareMessage,
          url: inviteLink
        });
      } catch (err) {
        if (err.name !== 'AbortError') console.warn('Native share error:', err);
      }
    } else {
      handleCopyLink();
    }
  };

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    if (!inviteForm.name || !inviteForm.email) return;

    try {
      const res = await api.post('/members', {
        trip_id: tripId,
        ...inviteForm
      });
      if (res.success) {
        setShowInviteModal(false);
        setInviteForm({ name: '', email: '', role: 'VIEW' });
        await fetchMembers();
      }
    } catch (err) {
      alert(err.message || 'Failed to invite member');
    }
  };

  const handleRemoveMember = async (id) => {
    if (!window.confirm('Are you sure you want to remove this member from the trip group?')) return;
    try {
      const res = await api.delete(`/members/${id}`);
      if (res.success) {
        setMembers(prev => prev.filter(m => m.id !== id));
      }
    } catch (err) {
      alert(err.message || 'Failed to remove member');
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'OWNER': return <span className="badge" style={{ background: 'rgba(236, 72, 153, 0.2)', color: '#f472b6' }}><Crown size={12} /> Owner</span>;
      case 'EDIT': return <span className="badge badge-info"><Edit size={12} /> Can Edit</span>;
      default: return <span className="badge badge-success"><Eye size={12} /> View Only</span>;
    }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header Banner */}
      <div className="glass-card" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.4) 0%, rgba(88, 28, 135, 0.3) 100%)',
        padding: '24px 32px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="badge badge-info">
              <Users size={12} /> Group Collaboration
            </span>
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
            Trip Members & Real-Time Location
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button 
            className="btn btn-secondary" 
            onClick={() => setActivePage('map')}
            title="Track opted-in members live on the interactive map"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Navigation size={16} color="#3b82f6" /> Track on Map
          </button>

          <button className="btn btn-primary" onClick={() => setShowInviteModal(true)}>
            <UserPlus size={16} /> Invite Tripmate
          </button>
        </div>
      </div>

      {/* Privacy-First Location Sharing Banner */}
      <div className="glass-card" style={{
        border: `1px solid ${isSharingLocation ? 'rgba(16, 185, 129, 0.4)' : 'var(--border)'}`,
        background: isSharingLocation ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-card)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px 24px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: isSharingLocation ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isSharingLocation ? '#34d399' : 'var(--text-muted)'
          }}>
            <Radio size={22} className={isSharingLocation ? 'pulse' : ''} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-main)' }}>
              Live GPS Location Sharing: {isSharingLocation ? 'ENABLED' : 'DISABLED'}
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              {isSharingLocation 
                ? 'Your location is broadcasting in real time to your trip group. Members can view your pin on the map.'
                : 'Location tracking is disabled. Enable only with your explicit privacy permission.'}
            </div>
          </div>
        </div>

        <button 
          className={isSharingLocation ? 'btn btn-danger' : 'btn btn-primary'}
          onClick={handleToggleLocationSharing}
        >
          {isSharingLocation ? 'Stop Sharing Location' : 'Share My Location (Opt-in)'}
        </button>
      </div>

      {/* Member List Cards */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <LoadingSpinner text="Loading group members..." />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {members.map((member) => {
            const hasCoords = member.last_latitude && member.last_longitude;
            return (
              <div key={member.id} className="glass-card" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '18px 24px',
                flexWrap: 'wrap',
                gap: '14px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    background: member.role === 'OWNER' ? 'var(--sunset-gradient)' : 'var(--accent-gradient)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: '1.1rem'
                  }}>
                    {member.name ? member.name[0].toUpperCase() : 'U'}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                        {member.name}
                      </h3>
                      {getRoleBadge(member.role)}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {member.email}
                    </div>
                  </div>
                </div>

                {/* Location Status & Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: 700 }}>Location Status</div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px', fontSize: '0.86rem', fontWeight: 600, color: member.is_sharing_location ? '#34d399' : 'var(--text-muted)', marginTop: '2px' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: member.is_sharing_location ? '#10b981' : '#6b7280', boxShadow: member.is_sharing_location ? '0 0 8px rgba(16, 185, 129, 0.6)' : 'none' }} />
                      {member.is_sharing_location ? 'Live on Map' : 'Sharing Disabled'}
                    </div>
                    {member.is_sharing_location && hasCoords && (
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                        {member.last_latitude.toFixed(3)}°, {member.last_longitude.toFixed(3)}°
                      </div>
                    )}
                  </div>

                  {/* Track single member button */}
                  {member.is_sharing_location && (
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setActivePage('map')}
                      title={`Track ${member.name} on the map`}
                      style={{ padding: '6px 12px' }}
                    >
                      <MapPin size={14} color="#10b981" /> Track
                    </button>
                  )}

                  {member.role !== 'OWNER' && (
                    <button 
                      className="btn btn-danger btn-sm"
                      onClick={() => handleRemoveMember(member.id)}
                      title="Remove member"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Multi-Platform Invite Modal */}
      {showInviteModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.78)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="glass-card" style={{ width: '500px', maxWidth: '100%', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0 }}>
                Invite Tripmate to Group
              </h3>
              <button 
                type="button" 
                className="btn btn-ghost btn-sm"
                onClick={() => setShowInviteModal(false)}
                style={{ padding: '4px 8px' }}
              >
                ✕
              </button>
            </div>

            {/* Subtitle */}
            <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', lineHeight: 1.5, marginBottom: '20px' }}>
              Share this invite link with your friends. When they open the link, they can enter their name and join your trip as a member with <strong>View Only</strong> access.
            </p>

            {/* Quick Share Link Box */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: 'var(--bg-subtle)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '8px 12px',
              gap: '10px',
              marginBottom: '20px'
            }}>
              <input
                type="text"
                readOnly
                value={inviteLink}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--text-main)',
                  fontSize: '0.82rem',
                  textOverflow: 'ellipsis'
                }}
              />
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleCopyLink}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}
              >
                {copiedLink ? <><Check size={14} color="#10b981" /> Copied!</> : <><Copy size={14} /> Copy Link</>}
              </button>
            </div>

            {/* Multi-Platform Instant Share Grid */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '10px' }}>
                Share via Social & Messaging:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                
                {/* WhatsApp */}
                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', padding: '10px 4px', textDecoration: 'none' }}
                >
                  <MessageCircle size={20} color="#25D366" />
                  <span style={{ fontSize: '0.74rem' }}>WhatsApp</span>
                </a>

                {/* Telegram */}
                <a
                  href={`https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(`Join my trip "${tripTitle}" on TripPulse!`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', padding: '10px 4px', textDecoration: 'none' }}
                >
                  <Send size={20} color="#229ED9" />
                  <span style={{ fontSize: '0.74rem' }}>Telegram</span>
                </a>

                {/* Email */}
                <a
                  href={`mailto:?subject=${encodeURIComponent(`TripPulse Invitation: ${tripTitle}`)}&body=${encodeURIComponent(shareMessage)}`}
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', padding: '10px 4px', textDecoration: 'none' }}
                >
                  <Mail size={20} color="#EA4335" />
                  <span style={{ fontSize: '0.74rem' }}>Email</span>
                </a>

                {/* Native / SMS */}
                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', padding: '10px 4px' }}
                >
                  <Share2 size={20} color="#6366f1" />
                  <span style={{ fontSize: '0.74rem' }}>Share...</span>
                </button>
              </div>
            </div>

            {/* Direct Email Invite Form (Optional) */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '10px' }}>
                Or Direct Email Invite:
              </div>
              <form onSubmit={handleInviteSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Friend's Name"
                    value={inviteForm.name}
                    onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                  />
                  <input 
                    type="email" 
                    className="form-input" 
                    placeholder="friend@example.com"
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '4px' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowInviteModal(false)}>
                    Close
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={!inviteForm.name || !inviteForm.email}>
                    Add Directly
                  </button>
                </div>
              </form>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default MembersPage;

