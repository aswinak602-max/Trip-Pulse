import React from 'react';
import { MapPin, Sparkles, ArrowRight, Star } from 'lucide-react';

export const DestinationCard = ({ destination, onExplore }) => {
  return (
    <div 
      className="glass-card glass-card-interactive"
      style={{
        padding: 0,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        position: 'relative'
      }}
      onClick={() => onExplore(destination)}
    >
      {/* Hero Image Container */}
      <div style={{ position: 'relative', width: '100%', height: '180px', overflow: 'hidden' }}>
        <img 
          src={destination.hero_image} 
          alt={destination.name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.4s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.06)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1.0)'}
        />
        <div style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          padding: '4px 10px',
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(8px)',
          borderRadius: 'var(--radius-full)',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '0.82rem',
          fontWeight: 700,
          color: '#fbbf24'
        }}>
          <Star size={14} fill="#fbbf24" stroke="none" />
          <span>{destination.popularity ? destination.popularity.toFixed(1) : '4.8'}</span>
        </div>

        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'linear-gradient(to top, rgba(17, 24, 39, 0.95), transparent)',
          padding: '16px 16px 8px 16px'
        }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', margin: 0 }}>
            {destination.name}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#93c5fd', fontSize: '0.82rem', marginTop: '2px' }}>
            <MapPin size={13} />
            <span>{destination.state ? `${destination.state}, ${destination.country}` : destination.country}</span>
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
        <p style={{
          fontSize: '0.85rem',
          color: 'var(--text-muted)',
          lineHeight: 1.5,
          marginBottom: '14px',
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}>
          {destination.description}
        </p>

        <div>
          {destination.tags && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
              {destination.tags.split(',').slice(0, 3).map((tag, idx) => (
                <span 
                  key={idx} 
                  style={{
                    fontSize: '0.72rem',
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255, 255, 255, 0.06)',
                    color: 'var(--text-dim)',
                    border: '1px solid var(--border)'
                  }}
                >
                  {tag.trim()}
                </span>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
              {destination.places_count ? `${destination.places_count} Curated Places` : 'Top Attractions'}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.84rem', fontWeight: 600, color: 'var(--primary)' }}>
              Explore <ArrowRight size={14} />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DestinationCard;
