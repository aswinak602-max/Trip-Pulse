import React, { useState } from 'react';
import { MapPin, Star, Heart, ArrowRight, DollarSign, Calendar, Clock } from 'lucide-react';

export const DestinationCard = ({ destination, onExplore, onSelect, onToggleFavorite }) => {
  const handleCardClick = () => {
    if (onExplore) onExplore(destination);
    else if (onSelect) onSelect(destination);
  };

  const [isFavorite, setIsFavorite] = useState(() => {
    try {
      const favs = JSON.parse(localStorage.getItem('trippulse_favorites') || '[]');
      return favs.includes(destination.id || destination.name);
    } catch (e) {
      return false;
    }
  });

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    const newFav = !isFavorite;
    setIsFavorite(newFav);
    try {
      let favs = JSON.parse(localStorage.getItem('trippulse_favorites') || '[]');
      const key = destination.id || destination.name;
      if (newFav) {
        if (!favs.includes(key)) favs.push(key);
      } else {
        favs = favs.filter(k => k !== key);
      }
      localStorage.setItem('trippulse_favorites', JSON.stringify(favs));
    } catch (err) {}
    if (onToggleFavorite) onToggleFavorite(destination, newFav);
  };

  // Helper values for travel metadata
  const ratingVal = destination.popularity ? destination.popularity.toFixed(1) : (destination.rating || 4.8);
  const bestTime = destination.best_season || destination.best_time || 'Oct - May';
  const estimatedBudget = destination.budget_estimate || destination.avg_cost || '₹12,000 - ₹20,000';

  return (
    <div 
      className="travel-card glass-card-interactive"
      style={{
        padding: 0,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        position: 'relative'
      }}
      onClick={handleCardClick}
    >
      {/* Hero Image Container with Favorite Button & Rating */}
      <div style={{ position: 'relative', width: '100%', height: '200px', overflow: 'hidden' }}>
        <img 
          src={destination.hero_image || 'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=600&q=80'} 
          alt={destination.name}
          className="travel-card-img"
        />
        
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to top, rgba(11, 19, 43, 0.92) 0%, rgba(11, 19, 43, 0.1) 60%)'
        }} />

        {/* Top Badges Bar: Rating + Favorite Button */}
        <div style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          right: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{
            padding: '4px 10px',
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(8px)',
            borderRadius: 'var(--radius-full)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.8rem',
            fontWeight: 700,
            color: '#F4C95D'
          }}>
            <Star size={13} fill="#F4C95D" stroke="none" />
            <span>{ratingVal}</span>
          </div>

          <button
            type="button"
            onClick={handleFavoriteClick}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'rgba(0, 0, 0, 0.65)',
              backdropFilter: 'blur(8px)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: isFavorite ? '#FF6B6B' : '#FFFFFF',
              transition: 'var(--transition-fast)'
            }}
            title={isFavorite ? 'Remove from favorites' : 'Save to favorites'}
            aria-label="Save to favorites"
          >
            <Heart size={16} fill={isFavorite ? '#FF6B6B' : 'none'} />
          </button>
        </div>

        {/* Bottom Destination Title & State Overlay */}
        <div style={{
          position: 'absolute',
          bottom: '12px',
          left: '16px',
          right: '16px'
        }}>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#FFFFFF', margin: 0, letterSpacing: '-0.01em' }}>
            {destination.name}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#93C5FD', fontSize: '0.82rem', marginTop: '2px' }}>
            <MapPin size={13} />
            <span>{destination.state ? `${destination.state}, ${destination.country}` : destination.country}</span>
          </div>
        </div>
      </div>

      {/* Card Body with Key Specs */}
      <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between', gap: '14px' }}>
        <p style={{
          fontSize: '0.86rem',
          color: 'var(--text-muted)',
          lineHeight: 1.5,
          margin: 0,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}>
          {destination.description || 'Explore scenic landscapes, cultural monuments, and unique attractions.'}
        </p>

        {/* Travel Specs: Best Time & Est. Budget */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '8px',
          background: 'var(--bg-surface)',
          padding: '8px 12px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border)'
        }}>
          <div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase' }}>Best Time</div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Calendar size={12} color="var(--primary)" />
              <span>{bestTime}</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase' }}>Est. Budget</div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '2px' }}>
              <span>{estimatedBudget}</span>
            </div>
          </div>
        </div>

        {/* Action Bottom Link */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 600 }}>
            {destination.places_count ? `${destination.places_count} Sights Catalogued` : 'Popular Sights'}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.86rem', fontWeight: 700, color: 'var(--primary)' }}>
            Explore Destination <ArrowRight size={14} />
          </span>
        </div>
      </div>
    </div>
  );
};

export default DestinationCard;
