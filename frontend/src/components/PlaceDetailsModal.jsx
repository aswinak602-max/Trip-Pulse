import React, { useState, useEffect } from 'react';
import { 
  X, 
  Star, 
  Clock, 
  MapPin, 
  DollarSign, 
  Bookmark, 
  Plus, 
  Check, 
  Home, 
  Compass, 
  Utensils, 
  Hotel,
  Navigation,
  Sparkles
} from 'lucide-react';
import api from '../services/api';

export const PlaceDetailsModal = ({ place, onClose, onAddToTrip, onDirections, isSaved = false, onToggleSave }) => {
  const [nearbyFacilities, setNearbyFacilities] = useState([]);
  const [activeTab, setActiveTab] = useState('overview'); // overview, scores, nearby
  const [facilityType, setFacilityType] = useState('Restaurants');

  useEffect(() => {
    if (place) {
      api.get(`/maps/nearby?lat=${place.latitude}&lng=${place.longitude}&category=${facilityType}`)
        .then(res => {
          if (res.success && res.data) {
            setNearbyFacilities(res.data.facilities || []);
          }
        })
        .catch(err => console.error(err));
    }
  }, [place, facilityType]);

  if (!place) return null;

  const scoreBars = [
    { label: 'Nature', score: place.nature_score || 0, color: '#10b981' },
    { label: 'Photography', score: place.photography_score || 0, color: '#ec4899' },
    { label: 'Adventure', score: place.adventure_score || 0, color: '#f59e0b' },
    { label: 'History', score: place.history_score || 0, color: '#8b5cf6' },
    { label: 'Culture', score: place.culture_score || 0, color: '#06b6d4' },
    { label: 'Wildlife', score: place.wildlife_score || 0, color: '#14b8a6' },
    { label: 'Family', score: place.family_score || 0, color: '#3b82f6' },
    { label: 'Food', score: place.food_score || 0, color: '#f97316' },
  ];

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(10px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div 
        className="glass-card"
        style={{
          width: '780px',
          maxWidth: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: 0,
          background: 'rgba(17, 24, 39, 0.98)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: 'var(--radius-xl)',
          position: 'relative'
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            zIndex: 10,
            background: 'rgba(0, 0, 0, 0.65)',
            border: '1px solid var(--border)',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            cursor: 'pointer'
          }}
        >
          <X size={18} />
        </button>

        {/* Hero Photo Banner */}
        <div style={{ position: 'relative', height: '240px', overflow: 'hidden' }}>
          <img 
            src={place.image_url} 
            alt={place.name} 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(17, 24, 39, 1) 0%, rgba(17, 24, 39, 0.4) 60%, transparent 100%)'
          }} />

          <div style={{
            position: 'absolute',
            bottom: '16px',
            left: '24px',
            right: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end'
          }}>
            <div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
                <span className="badge badge-info">{place.category}</span>
                {place.is_indoor && (
                  <span className="badge badge-success">
                    <Home size={12} /> Indoor Safe
                  </span>
                )}
              </div>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                {place.name}
              </h2>
            </div>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              background: 'rgba(0,0,0,0.6)',
              borderRadius: 'var(--radius-full)',
              color: '#fbbf24',
              fontWeight: 700
            }}>
              <Star size={16} fill="#fbbf24" stroke="none" />
              <span>{place.rating ? place.rating.toFixed(1) : '4.5'}</span>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div style={{ padding: '24px' }}>
          {/* Quick Info Grid */}
          <div className="grid-3" style={{ marginBottom: '20px' }}>
            <div style={{ padding: '10px 14px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={13} /> Opening Hours
              </div>
              <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#fff', marginTop: '2px' }}>
                {place.opening_hours || '09:00 AM - 06:00 PM'}
              </div>
            </div>

            <div style={{ padding: '10px 14px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={13} /> Visit Duration
              </div>
              <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#fff', marginTop: '2px' }}>
                {place.estimated_visit_hours || 2} Hours
              </div>
            </div>

            <div style={{ padding: '10px 14px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <DollarSign size={13} /> Estimated Entry Fee
              </div>
              <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#fff', marginTop: '2px' }}>
                {place.estimated_cost === 0 ? 'Free Entry' : `₹${place.estimated_cost}`}
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '18px' }}>
            <button 
              className={`btn btn-sm ${activeTab === 'overview' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview & Location
            </button>
            <button 
              className={`btn btn-sm ${activeTab === 'scores' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('scores')}
            >
              <Sparkles size={14} /> ML 9D Interest Radar
            </button>
            <button 
              className={`btn btn-sm ${activeTab === 'nearby' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('nearby')}
            >
              <Utensils size={14} /> Nearby Facilities
            </button>
          </div>

          {/* Tab 1: Overview */}
          {activeTab === 'overview' && (
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '8px', color: '#93c5fd' }}>
                About this attraction
              </h4>
              <p style={{ color: 'var(--text-main)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '18px' }}>
                {place.description}
              </p>

              {place.address && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '12px' }}>
                  <MapPin size={16} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '2px' }} />
                  <span>{place.address} (Coordinates: {place.latitude.toFixed(4)}° N, {place.longitude.toFixed(4)}° E)</span>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: 9D ML Score Vector */}
          {activeTab === 'scores' && (
            <div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Multidimensional interest weights used by the <strong>K-Means Clustering Recommendation Engine</strong> to match traveler profiles:
              </p>

              <div className="grid-2" style={{ gap: '14px' }}>
                {scoreBars.map((bar) => (
                  <div key={bar.label} style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>
                      <span>{bar.label}</span>
                      <span style={{ color: bar.color }}>{Math.round(bar.score * 100)}%</span>
                    </div>
                    <div style={{ height: '6px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${Math.round(bar.score * 100)}%`, height: '100%', background: bar.color, borderRadius: '3px' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 3: Nearby Facilities */}
          {activeTab === 'nearby' && (
            <div>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
                {['Restaurants', 'Hotels', 'Hospitals', 'Fuel Stations', 'ATMs'].map(cat => (
                  <button 
                    key={cat}
                    className={`btn btn-sm ${facilityType === cat ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setFacilityType(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {nearbyFacilities.map((fac, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff' }}>{fac.name}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                        {fac.category} • {fac.address}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className="badge badge-info">{fac.distance_km} km away</span>
                      {fac.price && <div style={{ fontSize: '0.78rem', color: '#34d399', marginTop: '4px' }}>{fac.price}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px', borderTop: '1px solid var(--border)', paddingTop: '18px' }}>
            <button className="btn btn-secondary" onClick={() => onToggleSave && onToggleSave(place)}>
              <Bookmark size={16} fill={isSaved ? 'var(--primary)' : 'none'} />
              {isSaved ? 'Saved' : 'Save Place'}
            </button>
            {onDirections && (
              <button 
                type="button"
                className="btn btn-secondary" 
                onClick={() => { onDirections(place); onClose(); }}
                style={{ color: '#60a5fa', borderColor: 'rgba(96, 165, 250, 0.4)', background: 'rgba(59, 130, 246, 0.12)' }}
              >
                <Navigation size={16} /> Directions
              </button>
            )}
            {onAddToTrip && (
              <button className="btn btn-primary" onClick={() => { onAddToTrip(place); onClose(); }}>
                <Plus size={16} /> Add to Trip Itinerary
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaceDetailsModal;
