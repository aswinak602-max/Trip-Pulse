import React, { useState, useEffect, useRef } from 'react';
import { 
  Compass, 
  MapPin, 
  Calendar, 
  Users, 
  DollarSign, 
  Car, 
  Hotel, 
  Sparkles, 
  ArrowRight, 
  Check, 
  TrendingUp, 
  ShieldCheck,
  LogIn,
  AlertCircle,
  Map as MapIcon,
  Search as SearchIcon
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import PlaceCard from '../components/PlaceCard';
import PlaceDetailsModal from '../components/PlaceDetailsModal';
import LoadingSpinner from '../components/LoadingSpinner';
import Pagination from '../components/Pagination';
import { formatTripTitle } from '../utils/formatters';

const INTEREST_OPTIONS = [
  'Nature', 'Adventure', 'Historical', 'Beach', 'Wildlife', 
  'Culture', 'Food', 'Photography', 'Shopping', 'Family'
];

const TRANSPORT_OPTIONS = [
  { id: 'Car', label: 'Car / Road Trip', icon: '🚗' },
  { id: 'Train', label: 'Train / Railway', icon: '🚆' },
  { id: 'Flight', label: 'Flight', icon: '✈️' },
  { id: 'Bus', label: 'Bus / Coach', icon: '🚌' },
  { id: 'Rental', label: 'Rental Vehicle', icon: '🚙' },
];

const ACCOMMODATION_OPTIONS = [
  { id: 'Budget', label: 'Budget Cottages / Homestay', desc: '₹800 - ₹1,200/night' },
  { id: 'Standard', label: 'Standard 3-Star Hotel', desc: '₹2,000 - ₹3,000/night' },
  { id: 'Luxury', label: 'Luxury Heritage Hotel', desc: '₹5,000 - ₹7,500/night' },
  { id: 'Premium', label: 'Premium Resort & Villa', desc: '₹8,000+/night' },
];

export const CreateTrip = ({ 
  setActivePage, 
  onTripCreated, 
  onSelectDirections,
  pendingPlace,
  onClearPendingPlace
}) => {
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const toast = useToast();

  const [formData, setFormData] = useState({
    title: '',
    current_location: '',
    destination: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    days_count: 3,
    members_count: 2,
    budget: 15000,
    transport_type: 'Car',
    accommodation_type: 'Standard',
    food_budget_tier: 'Standard',
    interests: ['Nature', 'Adventure']
  });

  const [popularPlaces, setPopularPlaces] = useState([]);
  const [selectedPlaces, setSelectedPlaces] = useState([]);
  const [loadingPlaces, setLoadingPlaces] = useState(false);
  const [placesError, setPlacesError] = useState('');
  const [selectedModalPlace, setSelectedModalPlace] = useState(null);

  // Prepopulate if pendingPlace was selected from Explore or query params / sessionStorage
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const queryDest = urlParams.get('destination');
    const queryPlace = urlParams.get('place');

    let targetPlace = pendingPlace;
    if (!targetPlace) {
      try {
        const saved = sessionStorage.getItem('pendingItineraryPlace');
        if (saved) targetPlace = JSON.parse(saved);
      } catch (e) {}
    }

    if (targetPlace) {
      const destName = targetPlace.destination_name || targetPlace.city || targetPlace.name;
      setFormData((prev) => ({
        ...prev,
        destination: prev.destination || destName,
        title: prev.title || `Trip to ${destName}`
      }));
      setSelectedPlaces((prev) => {
        const exists = prev.some(p => (p.id && p.id === targetPlace.id) || p.name === targetPlace.name);
        return exists ? prev : [targetPlace, ...prev];
      });
      try {
        sessionStorage.setItem('pendingItineraryPlace', JSON.stringify(targetPlace));
      } catch (e) {}
    } else if (queryDest) {
      setFormData((prev) => ({
        ...prev,
        destination: queryDest,
        title: prev.title || `Trip to ${queryDest}`
      }));
      if (queryPlace) {
        setSelectedPlaces((prev) => {
          const exists = prev.some(p => p.name === queryPlace);
          return exists ? prev : [{ name: queryPlace, destination_name: queryDest }, ...prev];
        });
      }
    }
  }, [pendingPlace]);

  // Pagination for popular places: 5 places per page
  const [placesPage, setPlacesPage] = useState(1);
  const PLACES_PER_PAGE = 5;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch destination tourist places whenever destination or origin changes
  const fetchPlacesTimeoutRef = useRef(null);

  const fetchDestinationPlaces = async (destCity, originCity) => {
    const trimmedDest = destCity ? destCity.trim() : '';
    if (!trimmedDest || trimmedDest.length < 2) {
      setPopularPlaces([]);
      setPlacesPage(1);
      setPlacesError('');
      return;
    }

    try {
      setLoadingPlaces(true);
      setPlacesError('');
      const res = await api.get(`/places/destination?destination=${encodeURIComponent(trimmedDest)}&origin=${encodeURIComponent(originCity?.trim() || '')}`);
      if (res.success && Array.isArray(res.data)) {
        // Deduplicate places by lowercase name
        const seen = new Set();
        const deduplicated = res.data.filter(p => {
          const nameKey = (p.name || '').trim().toLowerCase();
          if (seen.has(nameKey)) return false;
          seen.add(nameKey);
          return true;
        });
        setPopularPlaces(deduplicated);
      } else {
        setPopularPlaces([]);
      }
      setPlacesPage(1);
    } catch (err) {
      console.error('Error fetching tourist attractions:', err);
      setPopularPlaces([]);
      setPlacesError('Unable to load tourist places right now.');
    } finally {
      setLoadingPlaces(false);
    }
  };

  useEffect(() => {
    if (fetchPlacesTimeoutRef.current) {
      clearTimeout(fetchPlacesTimeoutRef.current);
    }
    
    if (!formData.destination || !formData.destination.trim()) {
      setPopularPlaces([]);
      setPlacesPage(1);
      return;
    }

    fetchPlacesTimeoutRef.current = setTimeout(() => {
      fetchDestinationPlaces(formData.destination, formData.current_location);
    }, 350);

    return () => {
      if (fetchPlacesTimeoutRef.current) clearTimeout(fetchPlacesTimeoutRef.current);
    };
  }, [formData.destination, formData.current_location]);

  const handleDestinationChange = (val) => {
    setFormData(prev => {
      const updatedTitle = (!prev.title || prev.title.startsWith('Trip to ') || prev.title.includes('Expedition'))
        ? (val.trim() ? `Trip to ${val.trim()}` : '')
        : prev.title;
      return {
        ...prev,
        destination: val,
        title: updatedTitle
      };
    });
    setSelectedPlaces([]);
    setPlacesPage(1);
  };

  const toggleInterest = (interest) => {
    setFormData((prev) => {
      const exists = prev.interests.includes(interest);
      return {
        ...prev,
        interests: exists 
          ? prev.interests.filter(i => i !== interest)
          : [...prev.interests, interest]
      };
    });
  };

  const handleDateChange = (start, end) => {
    let days = formData.days_count;
    if (start && end) {
      const diffTime = Math.abs(new Date(end) - new Date(start));
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      if (diffDays > 0) days = diffDays;
    }
    setFormData((prev) => ({
      ...prev,
      start_date: start,
      end_date: end,
      days_count: days
    }));
  };

  const handleTogglePlace = (place) => {
    setSelectedPlaces((prev) => {
      const exists = prev.some(p => (p.id && p.id === place.id) || p.name.trim().toLowerCase() === place.name.trim().toLowerCase());
      if (exists) {
        return prev.filter(p => (p.id && p.id !== place.id) && p.name.trim().toLowerCase() !== place.name.trim().toLowerCase());
      } else {
        return [...prev, place];
      }
    });
  };

  const handleDirections = (place) => {
    if (onSelectDirections) {
      onSelectDirections({
        place,
        origin: formData.current_location || 'Current Location'
      });
      setActivePage('map');
    }
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (loading) return; // Prevent double submission
    setError('');

    if (!isAuthenticated) {
      setError('Your session has expired. Please sign in again.');
      toast.error('Please sign in to save your trip.');
      return;
    }

    if (!formData.destination?.trim() || !formData.current_location?.trim()) {
      const msg = 'Please fill in Origin and Destination for your trip.';
      setError(msg);
      toast.warning(msg);
      return;
    }

    try {
      setLoading(true);
      const sanitizedTitle = formatTripTitle({
        title: formData.title,
        destination: formData.destination,
        current_location: formData.current_location
      });

      const payload = {
        ...formData,
        title: sanitizedTitle,
        destination: formData.destination.trim(),
        current_location: formData.current_location.trim(),
        selected_places: selectedPlaces
      };

      const res = await api.post('/trips', payload);
      
      // Validate that trip was created and has a real trip ID
      if (res && res.success && res.data && res.data.id) {
        const createdTrip = res.data;
        
        // Persist current trip ID
        try {
          localStorage.setItem('trippulse_current_trip_id', String(createdTrip.id));
          localStorage.setItem('activeTrip', JSON.stringify(createdTrip));
          sessionStorage.removeItem('pendingItineraryPlace');
        } catch (e) {
          console.warn('Storage notice:', e);
        }

        if (onClearPendingPlace) onClearPendingPlace();
        if (onTripCreated) onTripCreated(createdTrip);
        
        toast.success(`Intelligent Trip to ${createdTrip.destination} created successfully!`);
        
        // Navigate only after confirmed backend persistence
        setActivePage('trip-dashboard');
      } else {
        const errorMsg = res?.message || 'Trip creation failed: Backend did not return a valid trip.';
        console.error('Trip creation failed:', res);
        setError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (err) {
      console.error('Trip creation error:', err);
      const errorMsg = err.message || 'Unable to connect to TripPulse server. Please check that the backend is running.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Compute paginated places for current page (5 places per page)
  const totalPlacesPages = Math.ceil(popularPlaces.length / PLACES_PER_PAGE);
  const paginatedPlaces = popularPlaces.slice(
    (placesPage - 1) * PLACES_PER_PAGE,
    placesPage * PLACES_PER_PAGE
  );

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header Banner */}
      <div className="glass-card" style={{
        background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.4) 0%, rgba(88, 28, 135, 0.3) 100%)',
        border: '1px solid rgba(99, 102, 241, 0.3)',
        padding: '28px 32px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <span className="badge badge-info">
            <Sparkles size={12} /> ML Intelligent Trip Architect
          </span>
          {formData.destination && (
            <span className="badge badge-success">
              Destination: {formData.destination}
            </span>
          )}
        </div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', marginBottom: '6px' }}>
          Plan a New Intelligent Journey
        </h1>
        <p style={{ color: '#cbd5e1', fontSize: '0.92rem' }}>
          Configure your route, travel companions, budget and interests. Our Machine Learning algorithms will predict costs, optimize itineraries, and discover popular tourist attractions automatically.
        </p>
      </div>

      {/* Authentication Expiration / Session Warning Banner */}
      {!isAuthenticated && !authLoading && (
        <div className="glass-card" style={{
          background: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#fca5a5' }}>
            <AlertCircle size={20} style={{ color: '#ef4444', flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Your session has expired. Please sign in again.</div>
              <div style={{ fontSize: '0.82rem', color: '#f87171' }}>Sign in to save and synchronize your trip architecture.</div>
            </div>
          </div>
          <button 
            type="button" 
            className="btn btn-primary btn-sm"
            onClick={() => setActivePage('login')}
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <LogIn size={15} /> Sign In
          </button>
        </div>
      )}

      {error && (
        <div style={{
          padding: '12px 16px',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          color: '#f87171',
          fontSize: '0.88rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <span>{error}</span>
          {error.includes('sign in') && (
            <button 
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setActivePage('login')}
            >
              Sign In
            </button>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Top 2-Column Responsive Grid for Essentials & Parameters */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '20px'
        }}>
          
          {/* Section 1: Trip Essentials & Destination */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Compass size={18} color="var(--primary)" /> 1. Trip Essentials & Destination
              </h3>

              <div className="form-group">
                <label className="form-label">Trip Title</label>
                <input 
                  type="text" 
                  className="form-input"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Ooty Nature Expedition or Weekend Getaway"
                  required
                />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Current Location (Origin)</label>
                  <div style={{ position: 'relative' }}>
                    <MapPin size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input 
                      type="text" 
                      className="form-input"
                      style={{ paddingLeft: '40px' }}
                      value={formData.current_location}
                      onChange={(e) => setFormData({ ...formData, current_location: e.target.value })}
                      placeholder="e.g. Chennai"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Destination City</label>
                  <div style={{ position: 'relative' }}>
                    <MapPin size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#60a5fa' }} />
                    <input 
                      type="text" 
                      className="form-input"
                      style={{ paddingLeft: '40px' }}
                      value={formData.destination}
                      onChange={(e) => handleDestinationChange(e.target.value)}
                      placeholder="e.g. Ooty, Coimbatore, Salem, Madurai"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid-3">
                <div className="form-group">
                  <label className="form-label">Start Date</label>
                  <input 
                    type="date" 
                    className="form-input"
                    value={formData.start_date}
                    onChange={(e) => handleDateChange(e.target.value, formData.end_date)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">End Date</label>
                  <input 
                    type="date" 
                    className="form-input"
                    value={formData.end_date}
                    onChange={(e) => handleDateChange(formData.start_date, e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Trip Duration</label>
                  <input 
                    type="text" 
                    className="form-input"
                    value={`${formData.days_count} Days`}
                    disabled
                    style={{ background: 'rgba(255, 255, 255, 0.05)', color: '#93c5fd', fontWeight: 600 }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Members & Travel Parameters */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <DollarSign size={18} color="#34d399" /> 2. Members & Travel Parameters
              </h3>

              <div className="grid-2" style={{ marginBottom: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Number of Members</label>
                  <div style={{ position: 'relative' }}>
                    <Users size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input 
                      type="number" 
                      min="1" 
                      max="30"
                      className="form-input" 
                      style={{ paddingLeft: '40px' }}
                      value={formData.members_count}
                      onChange={(e) => setFormData({ ...formData, members_count: parseInt(e.target.value) || 1 })}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Target Group Budget (₹ INR)</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#34d399', fontWeight: 700 }}>₹</span>
                    <input 
                      type="number" 
                      min="1000" 
                      step="500"
                      className="form-input" 
                      style={{ paddingLeft: '34px' }}
                      value={formData.budget}
                      onChange={(e) => setFormData({ ...formData, budget: parseFloat(e.target.value) || 0 })}
                      required
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="form-label" style={{ marginBottom: '8px' }}>
                  Travel Interests (K-Means Feature Vector)
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {INTEREST_OPTIONS.map((interest) => {
                    const isSelected = formData.interests.includes(interest);
                    return (
                      <button
                        type="button"
                        key={interest}
                        onClick={() => toggleInterest(interest)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: 'var(--radius-full)',
                          background: isSelected ? 'var(--accent-gradient)' : 'rgba(255, 255, 255, 0.04)',
                          border: `1px solid ${isSelected ? 'transparent' : 'var(--border)'}`,
                          color: isSelected ? '#fff' : 'var(--text-muted)',
                          fontSize: '0.82rem',
                          fontWeight: isSelected ? 700 : 500,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          transition: 'var(--transition-fast)'
                        }}
                      >
                        {isSelected && <Check size={12} />}
                        {interest}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Section 3: Travel Mode & Accommodation */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Car size={18} color="#f59e0b" /> 3. Travel Mode & Accommodation
          </h3>

          <div style={{ marginBottom: '18px' }}>
            <label className="form-label">Mode of Transportation</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px', marginTop: '6px' }}>
              {TRANSPORT_OPTIONS.map((t) => {
                const isSelected = formData.transport_type === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => setFormData({ ...formData, transport_type: t.id })}
                    style={{
                      padding: '12px 10px',
                      borderRadius: 'var(--radius-md)',
                      background: isSelected ? 'var(--primary-light)' : 'rgba(255, 255, 255, 0.03)',
                      border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'var(--transition-fast)'
                    }}
                  >
                    <div style={{ fontSize: '1.4rem', marginBottom: '4px' }}>{t.icon}</div>
                    <div style={{ fontSize: '0.82rem', fontWeight: isSelected ? 700 : 500, color: isSelected ? '#fff' : 'var(--text-muted)' }}>
                      {t.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <label className="form-label">Accommodation Tier</label>
            <div className="grid-2" style={{ marginTop: '6px', gap: '10px' }}>
              {ACCOMMODATION_OPTIONS.map((a) => {
                const isSelected = formData.accommodation_type === a.id;
                return (
                  <div
                    key={a.id}
                    onClick={() => setFormData({ ...formData, accommodation_type: a.id })}
                    style={{
                      padding: '12px 16px',
                      borderRadius: 'var(--radius-md)',
                      background: isSelected ? 'var(--primary-light)' : 'rgba(255, 255, 255, 0.03)',
                      border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'var(--transition-fast)'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: isSelected ? 700 : 600, color: isSelected ? '#fff' : 'var(--text-main)' }}>
                        {a.label}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                        {a.desc}
                      </div>
                    </div>
                    {isSelected && <Check size={16} color="var(--primary)" />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Section 4: Generate Trip Plan Action Controls */}
        <div className="glass-card" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.25) 0%, rgba(17, 24, 39, 0.7) 100%)',
          border: '1px solid rgba(99, 102, 241, 0.35)',
          padding: '20px 24px'
        }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: '#fff' }}>
              Ready to Architect Your Itinerary?
            </div>
            <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              {selectedPlaces.length > 0 
                ? `${selectedPlaces.length} destination attraction${selectedPlaces.length > 1 ? 's' : ''} selected will be intelligently distributed across your schedule.`
                : 'Choose attractions from the Popular Places below or generate an automated smart itinerary.'}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              type="button" 
              className="btn btn-secondary btn-md"
              onClick={() => setActivePage('dashboard')}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary btn-lg"
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 28px',
                fontSize: '0.95rem',
                fontWeight: 800,
                boxShadow: '0 4px 18px rgba(99, 102, 241, 0.45)'
              }}
            >
              {loading ? <LoadingSpinner text="Generating Intelligent Plan..." /> : (
                <>Generate Intelligent Trip Plan <ArrowRight size={18} /></>
              )}
            </button>
          </div>
        </div>

        {/* Section 5: Popular Places in [Destination] at Bottom */}
        <div className="glass-card" style={{ border: '1px solid rgba(59, 130, 246, 0.35)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={18} color="#60a5fa" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                  {formData.destination?.trim() 
                    ? `Popular Places in ${formData.destination.trim()}`
                    : 'Popular Places'}
                </h3>
              </div>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', marginTop: '4px', margin: 0 }}>
                {formData.destination?.trim()
                  ? `Showing top sights for ${formData.destination.trim()}. Select attractions to prioritize them in your itinerary.`
                  : 'Enter a destination in Step 1 to discover popular tourist attractions.'}
              </p>
            </div>

            {selectedPlaces.length > 0 && (
              <span className="badge badge-success" style={{ padding: '6px 14px', fontSize: '0.85rem' }}>
                ✓ {selectedPlaces.length} attraction{selectedPlaces.length > 1 ? 's' : ''} selected
              </span>
            )}
          </div>

          {/* Empty / Loading / Sights State */}
          {!formData.destination || !formData.destination.trim() ? (
            <div style={{
              textAlign: 'center',
              padding: '48px 20px',
              borderRadius: 'var(--radius-lg)',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px dashed var(--border)'
            }}>
              <Compass size={40} style={{ color: 'var(--text-dim)', margin: '0 auto 12px auto' }} />
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '6px' }}>
                Enter a destination to discover tourist places.
              </h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', maxWidth: '440px', margin: '0 auto' }}>
                Type your destination city in the form above to explore curated attractions and add them to your trip plan.
              </p>
            </div>
          ) : loadingPlaces ? (
            <div style={{ textAlign: 'center', padding: '50px 0' }}>
              <LoadingSpinner text={`Finding popular places in ${formData.destination}...`} />
            </div>
          ) : placesError ? (
            <div style={{ textAlign: 'center', padding: '36px 20px', color: '#f87171', fontSize: '0.9rem' }}>
              {placesError}
            </div>
          ) : popularPlaces.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '48px 20px',
              borderRadius: 'var(--radius-lg)',
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px dashed var(--border)'
            }}>
              <MapPin size={40} style={{ color: 'var(--text-dim)', margin: '0 auto 12px auto' }} />
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '6px' }}>
                No tourist places found for this destination.
              </h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem', maxWidth: '460px', margin: '0 auto' }}>
                No tourist attractions were found for "{formData.destination}". Try searching for another destination like Ooty, Coimbatore, Salem, Madurai, or Chennai.
              </p>
            </div>
          ) : (
            <div>
              {/* Exactly 5 Tourist Places Per Page */}
              <div className="grid-3" style={{ gap: '16px' }}>
                {paginatedPlaces.map((place) => {
                  const isAdded = selectedPlaces.some(p => (p.id && p.id === place.id) || p.name.trim().toLowerCase() === place.name.trim().toLowerCase());
                  return (
                    <PlaceCard
                      key={place.id || place.name}
                      place={place}
                      origin={formData.current_location}
                      isAdded={isAdded}
                      onSelect={setSelectedModalPlace}
                      onAddToTrip={handleTogglePlace}
                      onDirections={handleDirections}
                    />
                  );
                })}
              </div>

              {/* Dynamic 5-Items Pagination */}
              <Pagination
                currentPage={placesPage}
                totalPages={totalPlacesPages}
                onPageChange={(p) => setPlacesPage(p)}
                totalItems={popularPlaces.length}
                itemsPerPage={PLACES_PER_PAGE}
                itemName="tourist places"
              />
            </div>
          )}
        </div>

      </form>

      {/* Place Details Modal */}
      {selectedModalPlace && (
        <PlaceDetailsModal
          place={selectedModalPlace}
          onClose={() => setSelectedModalPlace(null)}
          onAddToTrip={(p) => {
            handleTogglePlace(p);
            setSelectedModalPlace(null);
          }}
        />
      )}
    </div>
  );
};

export default CreateTrip;
