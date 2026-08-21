import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Calendar, 
  Star, 
  CloudSun, 
  Compass, 
  ArrowLeft, 
  Plus, 
  Utensils, 
  Hotel,
  Share2,
  Sparkles
} from 'lucide-react';
import api from '../services/api';
import PlaceCard from '../components/PlaceCard';
import PlaceDetailsModal from '../components/PlaceDetailsModal';
import LoadingSpinner from '../components/LoadingSpinner';
import Pagination from '../components/Pagination';

export const DestinationDetails = ({ destination, onBack, onAddToTrip, onSelectDirections, setActivePage }) => {
  const [destData, setDestData] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  useEffect(() => {
    if (!destination) return;

    const loadData = async () => {
      try {
        setLoading(true);
        const [destRes, weatherRes] = await Promise.all([
          api.get(`/destinations/${destination.id}`),
          api.get(`/weather?city=${encodeURIComponent(destination.name)}`)
        ]);

        if (destRes.success) setDestData(destRes.data);
        if (weatherRes.success) setWeatherData(weatherRes.data);
      } catch (err) {
        console.error('Error fetching destination details:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [destination]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0' }}>
        <LoadingSpinner text="Loading destination sights and weather..." />
      </div>
    );
  }

  const currentDest = destData || destination;
  const places = currentDest?.places || [];

  const categories = ['All', ...new Set(places.map(p => p.category).filter(Boolean))];
  const filteredPlaces = selectedCategory === 'All' 
    ? places 
    : places.filter(p => p.category === selectedCategory);

  const totalPages = Math.ceil(filteredPlaces.length / ITEMS_PER_PAGE);
  const paginatedPlaces = filteredPlaces.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleCategoryChange = (cat) => {
    setSelectedCategory(cat);
    setCurrentPage(1);
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Back button & top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button className="btn btn-secondary btn-sm" onClick={onBack}>
          <ArrowLeft size={16} /> Back to Search
        </button>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="btn btn-primary btn-sm"
            onClick={() => setActivePage('create-trip')}
          >
            <Plus size={16} /> Plan Trip to {currentDest?.name}
          </button>
        </div>
      </div>

      {/* Hero Banner Card */}
      <div className="glass-card" style={{
        padding: 0,
        overflow: 'hidden',
        position: 'relative',
        height: '340px'
      }}>
        <img 
          src={currentDest?.hero_image} 
          alt={currentDest?.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to top, rgba(11, 15, 25, 0.95) 0%, rgba(11, 15, 25, 0.4) 60%, transparent 100%)'
        }} />

        <div style={{
          position: 'absolute',
          bottom: '24px',
          left: '32px',
          right: '32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#93c5fd', fontSize: '0.9rem', marginBottom: '6px' }}>
              <MapPin size={16} />
              <span>{currentDest?.state ? `${currentDest.state}, ${currentDest.country}` : currentDest?.country}</span>
            </div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fff', margin: 0, lineHeight: 1.1 }}>
              {currentDest?.name}
            </h1>
          </div>

          {/* Quick Weather Snapshot Pill */}
          {weatherData && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 18px',
              background: 'rgba(17, 24, 39, 0.85)',
              backdropFilter: 'blur(12px)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)'
            }}>
              <CloudSun size={24} color="#60a5fa" />
              <div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>
                  {weatherData.temperature}°C
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {weatherData.condition} • {weatherData.suitability}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Overview & Best Time */}
      <div className="grid-3">
        <div className="glass-card" style={{ gridColumn: 'span 2' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '12px', color: '#93c5fd' }}>
            Destination Overview
          </h3>
          <p style={{ color: 'var(--text-main)', fontSize: '0.94rem', lineHeight: 1.65, marginBottom: '16px' }}>
            {currentDest?.description}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {currentDest?.tags?.split(',').map((t, i) => (
              <span key={i} className="badge badge-info">{t.trim()}</span>
            ))}
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#34d399' }}>
              <Calendar size={18} />
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>Best Season to Visit</h4>
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '10px' }}>
              {currentDest?.best_time || 'October to June'}
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Ideal clear mountain skies and comfortable temperatures for outdoor treks, garden strolls, and boat safaris.
            </p>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', marginTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Curated Sights</span>
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>{places.length} Attractions</span>
          </div>
        </div>
      </div>

      {/* Popular Tourist Places Section */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>
              Top Places & Attractions in {currentDest?.name}
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Explore sights evaluated across nature, photography, history, and indoor suitability.
            </p>
          </div>

          {/* Category Filter Buttons */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {categories.map((cat) => (
              <button
                key={cat}
                className={`btn btn-sm ${selectedCategory === cat ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => handleCategoryChange(cat)}
                style={{ borderRadius: 'var(--radius-full)' }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Places Grid */}
        {filteredPlaces.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
            No attractions found in this category.
          </div>
        ) : (
          <div>
            <div className="grid-3" style={{ gap: '22px' }}>
              {paginatedPlaces.map((place) => (
                <PlaceCard 
                  key={place.id}
                  place={place}
                  onSelect={setSelectedPlace}
                  onAddToTrip={onAddToTrip}
                  onDirections={onSelectDirections}
                />
              ))}
            </div>

            {/* Pagination for destination sights (5 items per page) */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(p) => setCurrentPage(p)}
              totalItems={filteredPlaces.length}
              itemsPerPage={ITEMS_PER_PAGE}
              itemName="attractions"
            />
          </div>
        )}
      </div>

      {/* Place Details Modal */}
      {selectedPlace && (
        <PlaceDetailsModal 
          place={selectedPlace}
          onClose={() => setSelectedPlace(null)}
          onAddToTrip={onAddToTrip}
          onDirections={onSelectDirections}
        />
      )}
    </div>
  );
};

export default DestinationDetails;
