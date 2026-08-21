import React from 'react';
import { Star, Clock, Plus, Check, MapPin, Navigation, Eye, Compass, Home } from 'lucide-react';

export const PlaceCard = ({
  place,
  onSelect,
  onAddToTrip,
  onDirections,
  isAdded = false,
  origin = ''
}) => {
  const getCategoryColor = (cat = '') => {
    const c = cat.toLowerCase();
    if (c.includes('nature')) return '#10b981';
    if (c.includes('adventure')) return '#f59e0b';
    if (c.includes('histor')) return '#8b5cf6';
    if (c.includes('cultur')) return '#ec4899';
    if (c.includes('wildlife')) return '#14b8a6';
    if (c.includes('beach')) return '#06b6d4';
    if (c.includes('food')) return '#f97316';
    if (c.includes('family')) return '#3b82f6';
    return '#6366f1';
  };

  const handleDirectionsClick = (e) => {
    e.stopPropagation();
    if (onDirections) {
      onDirections(place);
    }
  };

  return (
    <div 
      className="glass-card"
      style={{
        padding: 0,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        position: 'relative',
        transition: 'var(--transition-normal)',
        border: '1px solid rgba(255, 255, 255, 0.08)'
      }}
    >
      {/* Image Banner */}
      <div 
        style={{ position: 'relative', height: '175px', overflow: 'hidden', cursor: 'pointer' }}
        onClick={() => onSelect && onSelect(place)}
      >
        <img 
          src={place.image_url || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80'} 
          alt={place.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          loading="lazy"
        />

        {/* Category & Indoor Badges */}
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          display: 'flex',
          gap: '6px',
          flexWrap: 'wrap',
          zIndex: 2
        }}>
          <span style={{
            fontSize: '0.72rem',
            fontWeight: 700,
            padding: '3px 8px',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(17, 24, 39, 0.85)',
            color: getCategoryColor(place.category),
            border: `1px solid ${getCategoryColor(place.category)}66`,
            backdropFilter: 'blur(8px)'
          }}>
            {place.category || 'Tourist Attraction'}
          </span>
          {place.is_indoor && (
            <span style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(59, 130, 246, 0.3)',
              color: '#93c5fd',
              border: '1px solid rgba(59, 130, 246, 0.5)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              gap: '3px'
            }}>
              <Home size={11} /> Indoor
            </span>
          )}
        </div>

        {/* Rating Pill */}
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          padding: '3px 9px',
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          borderRadius: 'var(--radius-full)',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '0.78rem',
          fontWeight: 700,
          color: '#fbbf24',
          zIndex: 2
        }}>
          <Star size={12} fill="#fbbf24" stroke="none" />
          <span>{place.rating ? Number(place.rating).toFixed(1) : '4.5'}</span>
        </div>
      </div>

      {/* Place Content Body */}
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
        <div>
          <h4 
            style={{ fontSize: '1.08rem', fontWeight: 800, marginBottom: '6px', color: '#fff', cursor: 'pointer' }}
            onClick={() => onSelect && onSelect(place)}
          >
            {place.name}
          </h4>
          
          <p style={{
            fontSize: '0.82rem',
            color: 'var(--text-muted)',
            lineHeight: 1.45,
            marginBottom: '10px',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}>
            {place.description || 'Popular scenic destination and tourist attraction.'}
          </p>

          {/* Address & Coordinates Details */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            fontSize: '0.76rem',
            color: 'var(--text-dim)',
            marginBottom: '12px',
            background: 'rgba(255, 255, 255, 0.02)',
            padding: '8px 10px',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid var(--border)'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '5px' }}>
              <MapPin size={13} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '2px' }} />
              <span style={{ color: '#cbd5e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {place.destination_name ? `${place.destination_name} • ` : ''}{place.address || 'Tourist Destination'}
              </span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px', color: 'var(--text-dim)' }}>
              <span>
                Lat: {Number(place.latitude).toFixed(4)}°, Lng: {Number(place.longitude).toFixed(4)}°
              </span>
              {place.distance_from_origin_km ? (
                <span style={{ color: '#60a5fa', fontWeight: 600 }}>
                  ~{place.distance_from_origin_km} km away
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div>
          {/* Action Buttons: View Details, Add to Trip, Directions */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1fr', gap: '6px' }}>
            <button 
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ padding: '7px 6px', fontSize: '0.78rem', justifyContent: 'center' }}
              onClick={() => onSelect && onSelect(place)}
            >
              <Eye size={13} /> Details
            </button>

            {onAddToTrip ? (
              <button 
                type="button"
                className={`btn btn-sm ${isAdded ? 'btn-secondary' : 'btn-primary'}`}
                style={{
                  padding: '7px 8px',
                  fontSize: '0.78rem',
                  justifyContent: 'center',
                  background: isAdded ? 'rgba(16, 185, 129, 0.2)' : undefined,
                  borderColor: isAdded ? '#10b981' : undefined,
                  color: isAdded ? '#34d399' : undefined
                }}
                onClick={(e) => { e.stopPropagation(); onAddToTrip(place); }}
              >
                {isAdded ? <><Check size={13} /> Added ✓</> : <><Plus size={13} /> Add to Trip</>}
              </button>
            ) : null}

            <button 
              type="button"
              className="btn btn-secondary btn-sm"
              style={{
                padding: '7px 6px',
                fontSize: '0.78rem',
                justifyContent: 'center',
                color: '#60a5fa',
                borderColor: 'rgba(96, 165, 250, 0.4)',
                background: 'rgba(59, 130, 246, 0.12)'
              }}
              onClick={handleDirectionsClick}
              title="Calculate route from current origin to this attraction"
            >
              <Navigation size={13} /> Directions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaceCard;
