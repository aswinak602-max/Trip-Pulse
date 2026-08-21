import React, { useState, useEffect, useRef } from 'react';
import { 
  Compass, 
  MapPin, 
  Calendar, 
  Users, 
  DollarSign, 
  Car, 
  Sparkles, 
  ArrowRight, 
  Check, 
  AlertCircle,
  Clock,
  Navigation,
  Heart,
  Plane,
  Building,
  CheckCircle2,
  RefreshCw,
  Sliders,
  LogIn
} from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import PlaceCard from '../components/PlaceCard';
import PlaceDetailsModal from '../components/PlaceDetailsModal';
import Pagination from '../components/Pagination';
import { formatTripTitle } from '../utils/formatters';

const TRAVEL_STYLE_OPTIONS = [
  { id: 'Adventure', label: 'Adventure', icon: '⛰️' },
  { id: 'Relaxation', label: 'Relaxation', icon: '🏖️' },
  { id: 'Luxury', label: 'Luxury', icon: '✨' },
  { id: 'Family', label: 'Family', icon: '👨‍👩‍👧‍👦' },
  { id: 'Romantic', label: 'Romantic', icon: '💖' },
  { id: 'Backpacking', label: 'Backpacking', icon: '🎒' },
  { id: 'Cultural', label: 'Cultural', icon: '🏛️' },
  { id: 'Food & Culture', label: 'Food & Culture', icon: '🍜' },
];

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
  { id: 'Budget', label: 'Budget Stay / Homestay', desc: '₹800 - ₹1,500/night' },
  { id: 'Standard', label: 'Standard 3-Star Hotel', desc: '₹2,000 - ₹3,500/night' },
  { id: 'Luxury', label: 'Luxury Resort & Hotel', desc: '₹5,000 - ₹8,000/night' },
  { id: 'Premium', label: 'Premium Villa & Spa', desc: '₹9,000+/night' },
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
    travel_style: 'Adventure',
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

  // Pagination for popular places
  const [placesPage, setPlacesPage] = useState(1);
  const PLACES_PER_PAGE = 6;

  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState('');

  // 4-Step Animated Planner Loading State
  const loadingSteps = [
    'Understanding your preferences & travel style',
    'Finding top tourist destinations & sights',
    'Building customized timeline itinerary',
    'Optimizing budget, route & weather alternatives'
  ];

  useEffect(() => {
    let interval;
    if (loading) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev < loadingSteps.length - 1 ? prev + 1 : prev));
      }, 700);
    }
    return () => clearInterval(interval);
  }, [loading]);

  // Fetch destination tourist places
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
    if (loading) return;
    setError('');

    if (!isAuthenticated) {
      setError('Please sign in to plan and save your journey.');
      toast.warning('Please sign in to save your trip.');
      return;
    }

    if (!formData.destination?.trim() || !formData.current_location?.trim()) {
      const msg = 'Please enter both Starting Location and Destination.';
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
      
      if (res && res.success && res.data && res.data.id) {
        const createdTrip = res.data;
        
        try {
          localStorage.setItem('trippulse_current_trip_id', String(createdTrip.id));
          localStorage.setItem('activeTrip', JSON.stringify(createdTrip));
          sessionStorage.removeItem('pendingItineraryPlace');
        } catch (e) {
          console.warn('Storage notice:', e);
        }

        if (onClearPendingPlace) onClearPendingPlace();
        if (onTripCreated) onTripCreated(createdTrip);
        
        toast.success(`AI Trip to ${createdTrip.destination} planned successfully!`);
        setActivePage('trip-dashboard');
      } else {
        const errorMsg = res?.message || 'Trip creation failed: Backend did not return a valid trip.';
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

  // Compute paginated places
  const totalPlacesPages = Math.ceil(popularPlaces.length / PLACES_PER_PAGE);
  const paginatedPlaces = popularPlaces.slice(
    (placesPage - 1) * PLACES_PER_PAGE,
    placesPage * PLACES_PER_PAGE
  );

  return (
    <div style={{ maxWidth: '1120px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* Header Banner */}
      <div className="glass-card" style={{
        background: 'var(--hero-gradient)',
        border: '1px solid var(--border)',
        padding: '32px 36px',
        boxShadow: 'var(--shadow-md)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
          <span className="badge badge-teal">
            <Sparkles size={12} /> AI Travel Architect
          </span>
          {formData.destination && (
            <span className="badge badge-coral">
              Destination: {formData.destination}
            </span>
          )}
        </div>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--text-main)', marginBottom: '8px', letterSpacing: '-0.02em' }}>
          AI Trip Planner
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1rem', maxWidth: '780px', lineHeight: 1.55 }}>
          Configure your travel style, route, companions and budget. Our AI algorithms will construct an optimized day-by-day itinerary with weather backup plans and ML cost forecasts.
        </p>
      </div>

      {/* Unauthenticated Session Notice */}
      {!isAuthenticated && !authLoading && (
        <div className="glass-card" style={{
          background: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--danger)' }}>
            <AlertCircle size={20} style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Sign in to save your trip</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>You can configure your itinerary below and sign in to persist it to your dashboard.</div>
            </div>
          </div>
          <button 
            type="button" 
            className="btn btn-primary btn-sm"
            onClick={() => setActivePage('login')}
          >
            <LogIn size={15} /> Sign In
          </button>
        </div>
      )}

      {error && (
        <div style={{
          padding: '14px 18px',
          borderRadius: 'var(--radius-md)',
          background: 'var(--danger-bg)',
          border: '1px solid var(--danger-border)',
          color: 'var(--danger)',
          fontSize: '0.9rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
        
        {/* =====================================================================
            Main Visual Planning Card: Destination, Origin, Dates, Travelers, Budget
            ===================================================================== */}
        <div className="glass-card" style={{ padding: '32px 36px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '22px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Compass size={20} color="var(--primary)" /> 1. Trip Essentials & Destination
          </h2>

          <div className="form-group">
            <label className="form-label">Trip Title</label>
            <input 
              type="text" 
              className="form-input"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. 3-Day Ooty Highland Getaway or Weekend Nature Escape"
              required
            />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Starting Location (Origin)</label>
              <div style={{ position: 'relative' }}>
                <MapPin size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                <input 
                  type="text" 
                  className="form-input"
                  style={{ paddingLeft: '42px' }}
                  value={formData.current_location}
                  onChange={(e) => setFormData({ ...formData, current_location: e.target.value })}
                  placeholder="e.g. Chennai, Bangalore, Coimbatore"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Destination</label>
              <div style={{ position: 'relative' }}>
                <MapPin size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)' }} />
                <input 
                  type="text" 
                  className="form-input"
                  style={{ paddingLeft: '42px' }}
                  value={formData.destination}
                  onChange={(e) => handleDestinationChange(e.target.value)}
                  placeholder="e.g. Ooty, Madurai, Kanyakumari, Thanjavur"
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid-3" style={{ marginTop: '8px' }}>
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
              <label className="form-label">Duration</label>
              <input 
                type="text" 
                className="form-input"
                value={`${formData.days_count} Days`}
                disabled
                style={{ background: 'var(--bg-surface)', fontWeight: 700, color: 'var(--primary)' }}
              />
            </div>
          </div>

          <div className="grid-2" style={{ marginTop: '8px' }}>
            <div className="form-group">
              <label className="form-label">Number of Travelers</label>
              <div style={{ position: 'relative' }}>
                <Users size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                <input 
                  type="number" 
                  min="1" 
                  max="30"
                  className="form-input" 
                  style={{ paddingLeft: '42px' }}
                  value={formData.members_count}
                  onChange={(e) => setFormData({ ...formData, members_count: parseInt(e.target.value) || 1 })}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Total Estimated Budget (₹ INR)</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', fontWeight: 700 }}>₹</span>
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
        </div>

        {/* =====================================================================
            Section 2: Travel Style & Interests (Chips)
            ===================================================================== */}
        <div className="glass-card" style={{ padding: '32px 36px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sparkles size={20} color="var(--accent-coral)" /> 2. Travel Style & Interests
          </h2>

          <div style={{ marginBottom: '24px' }}>
            <label className="form-label" style={{ marginBottom: '10px', display: 'block' }}>
              Select Your Travel Style
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              {TRAVEL_STYLE_OPTIONS.map((style) => {
                const isSelected = formData.travel_style === style.id;
                return (
                  <button
                    type="button"
                    key={style.id}
                    onClick={() => setFormData({ ...formData, travel_style: style.id })}
                    className={`chip ${isSelected ? 'chip-active' : ''}`}
                    style={{ padding: '10px 18px', fontSize: '0.9rem' }}
                  >
                    <span>{style.icon}</span>
                    <span>{style.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="form-label" style={{ marginBottom: '10px', display: 'block' }}>
              Preferred Activity Interests
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '9px' }}>
              {INTEREST_OPTIONS.map((interest) => {
                const isSelected = formData.interests.includes(interest);
                return (
                  <button
                    type="button"
                    key={interest}
                    onClick={() => toggleInterest(interest)}
                    className={`chip ${isSelected ? 'chip-active' : ''}`}
                  >
                    {isSelected && <Check size={14} />}
                    <span>{interest}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* =====================================================================
            Section 3: Transport & Accommodation Tiers
            ===================================================================== */}
        <div className="glass-card" style={{ padding: '32px 36px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Car size={20} color="var(--highlight-gold)" /> 3. Transportation & Stay Tiers
          </h2>

          <div style={{ marginBottom: '22px' }}>
            <label className="form-label" style={{ marginBottom: '8px', display: 'block' }}>
              Preferred Mode of Transportation
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
              {TRANSPORT_OPTIONS.map((t) => {
                const isSelected = formData.transport_type === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => setFormData({ ...formData, transport_type: t.id })}
                    style={{
                      padding: '14px 12px',
                      borderRadius: 'var(--radius-md)',
                      background: isSelected ? 'var(--primary-light)' : 'var(--bg-surface)',
                      border: `1.5px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'var(--transition-fast)',
                      boxShadow: isSelected ? 'var(--shadow-xs)' : 'none'
                    }}
                  >
                    <div style={{ fontSize: '1.5rem', marginBottom: '6px' }}>{t.icon}</div>
                    <div style={{ fontSize: '0.86rem', fontWeight: isSelected ? 800 : 600, color: isSelected ? 'var(--primary)' : 'var(--text-main)' }}>
                      {t.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <label className="form-label" style={{ marginBottom: '8px', display: 'block' }}>
              Accommodation Tier (Cost Prediction Input)
            </label>
            <div className="grid-2" style={{ gap: '12px' }}>
              {ACCOMMODATION_OPTIONS.map((a) => {
                const isSelected = formData.accommodation_type === a.id;
                return (
                  <div
                    key={a.id}
                    onClick={() => setFormData({ ...formData, accommodation_type: a.id })}
                    style={{
                      padding: '14px 18px',
                      borderRadius: 'var(--radius-md)',
                      background: isSelected ? 'var(--primary-light)' : 'var(--bg-surface)',
                      border: `1.5px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'var(--transition-fast)',
                      boxShadow: isSelected ? 'var(--shadow-xs)' : 'none'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.92rem', fontWeight: isSelected ? 800 : 700, color: isSelected ? 'var(--primary)' : 'var(--text-main)' }}>
                        {a.label}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                        {a.desc}
                      </div>
                    </div>
                    {isSelected && <Check size={18} color="var(--primary)" />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* =====================================================================
            Section 4: Prominent "Generate AI Trip" CTA
            ===================================================================== */}
        <div className="glass-card" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px',
          background: 'var(--brand-gradient)',
          color: '#FFFFFF',
          padding: '28px 36px',
          boxShadow: 'var(--shadow-lg)'
        }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#FFFFFF', letterSpacing: '-0.01em' }}>
              Ready to Generate Your Personalized Trip?
            </div>
            <div style={{ fontSize: '0.88rem', color: 'rgba(255, 255, 255, 0.85)', marginTop: '4px' }}>
              {selectedPlaces.length > 0 
                ? `${selectedPlaces.length} selected attraction${selectedPlaces.length > 1 ? 's' : ''} will be mapped into your custom itinerary.`
                : 'Our AI will automatically select the best sights and schedule them along optimal routes.'}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '14px' }}>
            <button 
              type="button" 
              className="btn btn-secondary btn-md"
              onClick={() => setActivePage('dashboard')}
              style={{ background: 'rgba(255, 255, 255, 0.15)', color: '#FFFFFF', borderColor: 'rgba(255, 255, 255, 0.3)' }}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-gold btn-lg"
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '14px 34px',
                fontSize: '1.02rem',
                fontWeight: 900
              }}
            >
              <Sparkles size={18} />
              <span>Generate AI Trip</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </div>

        {/* =====================================================================
            Section 5: Popular Places in Destination
            ===================================================================== */}
        <div className="glass-card" style={{ padding: '32px 36px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '20px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={18} color="var(--primary)" />
                <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                  {formData.destination?.trim() 
                    ? `Popular Attractions in ${formData.destination.trim()}`
                    : 'Popular Attractions'}
                </h3>
              </div>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '4px', margin: 0 }}>
                {formData.destination?.trim()
                  ? `Select specific tourist places below to include them in your AI trip schedule.`
                  : 'Enter a destination in Step 1 to discover popular tourist places.'}
              </p>
            </div>

            {selectedPlaces.length > 0 && (
              <span className="badge badge-teal" style={{ padding: '6px 14px', fontSize: '0.85rem' }}>
                ✓ {selectedPlaces.length} attraction{selectedPlaces.length > 1 ? 's' : ''} selected
              </span>
            )}
          </div>

          {!formData.destination || !formData.destination.trim() ? (
            <div style={{
              textAlign: 'center',
              padding: '48px 20px',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--bg-surface)',
              border: '1.5px dashed var(--border)'
            }}>
              <Compass size={44} style={{ color: 'var(--text-dim)', margin: '0 auto 12px auto' }} />
              <h4 style={{ fontSize: '1.08rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
                Enter a destination to discover attractions
              </h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', maxWidth: '460px', margin: '0 auto' }}>
                Type your destination city (like Ooty, Madurai, Kanyakumari or Thanjavur) to browse curated sights.
              </p>
            </div>
          ) : loadingPlaces ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <RefreshCw className="animate-spin" size={28} color="var(--primary)" style={{ margin: '0 auto 12px auto' }} />
              <div style={{ fontSize: '0.92rem', color: 'var(--text-muted)' }}>Finding popular sights in {formData.destination}...</div>
            </div>
          ) : placesError ? (
            <div style={{ textAlign: 'center', padding: '36px 20px', color: 'var(--danger)', fontSize: '0.92rem' }}>
              {placesError}
            </div>
          ) : popularPlaces.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '48px 20px',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--bg-surface)',
              border: '1.5px dashed var(--border)'
            }}>
              <MapPin size={44} style={{ color: 'var(--text-dim)', margin: '0 auto 12px auto' }} />
              <h4 style={{ fontSize: '1.08rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '6px' }}>
                No sights found for "{formData.destination}"
              </h4>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', maxWidth: '460px', margin: '0 auto' }}>
                Try searching for popular destinations like Ooty, Madurai, Kanyakumari, Thanjavur, or Chennai.
              </p>
            </div>
          ) : (
            <div>
              <div className="grid-3" style={{ gap: '18px' }}>
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

              <Pagination
                currentPage={placesPage}
                totalPages={totalPlacesPages}
                onPageChange={(p) => setPlacesPage(p)}
                totalItems={popularPlaces.length}
                itemsPerPage={PLACES_PER_PAGE}
                itemName="tourist attractions"
              />
            </div>
          )}
        </div>

      </form>

      {/* =======================================================================
          Polished 4-Step Animated AI Planner Loading Modal
          ======================================================================= */}
      {loading && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(11, 19, 43, 0.75)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
          padding: '20px'
        }}>
          <div className="glass-card animate-fade-in" style={{
            maxWidth: '500px',
            width: '100%',
            padding: '36px 32px',
            textAlign: 'center',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'var(--cta-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px auto',
              color: '#FFFFFF',
              boxShadow: 'var(--shadow-glow)'
            }}>
              <Sparkles size={28} />
            </div>

            <h3 style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--text-main)', marginBottom: '8px' }}>
              AI is planning your perfect journey...
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '28px' }}>
              Architecting custom travel schedule for <strong>{formData.destination || 'your destination'}</strong>.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left' }}>
              {loadingSteps.map((step, idx) => {
                const isDone = idx < loadingStep;
                const isCurrent = idx === loadingStep;
                return (
                  <div 
                    key={idx} 
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-md)',
                      background: isCurrent ? 'var(--primary-light)' : 'var(--bg-surface)',
                      border: `1px solid ${isCurrent ? 'var(--primary)' : 'var(--border)'}`,
                      transition: 'var(--transition-fast)'
                    }}
                  >
                    {isDone ? (
                      <CheckCircle2 size={18} color="var(--success)" style={{ flexShrink: 0 }} />
                    ) : isCurrent ? (
                      <RefreshCw size={18} color="var(--primary)" className="animate-spin" style={{ flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid var(--border)', flexShrink: 0 }} />
                    )}
                    <span style={{
                      fontSize: '0.88rem',
                      fontWeight: isCurrent ? 700 : 500,
                      color: isDone ? 'var(--success)' : isCurrent ? 'var(--primary)' : 'var(--text-dim)'
                    }}>
                      {step}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

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
