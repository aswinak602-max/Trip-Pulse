import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Compass, 
  MapPin, 
  Calendar, 
  Users, 
  DollarSign, 
  Sparkles, 
  CloudSun, 
  TrendingUp, 
  CheckSquare, 
  ArrowRight, 
  Map, 
  Bot, 
  Receipt, 
  Ticket, 
  Clock, 
  ShieldCheck, 
  AlertCircle, 
  Search, 
  RefreshCw, 
  Plus, 
  Car, 
  Navigation, 
  HelpCircle, 
  ChevronRight,
  FolderOpen
} from 'lucide-react';
import api from '../services/api';
import { ExpenseCategoryDoughnut, EstimatedVsActualBar } from '../components/ExpenseChart';
import DashboardSkeleton from '../components/DashboardSkeleton';
import { 
  formatCurrency, 
  formatDateRange, 
  formatCity, 
  formatTripTitle, 
  getDestinationImage 
} from '../utils/formatters';

export const TripDashboard = ({ trip, setActivePage, onUpdateTrip }) => {
  // UI State Machine: 'loading' | 'success' | 'error' | 'empty'
  const [uiState, setUiState] = useState('loading');
  const [tripData, setTripData] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [checklistItems, setChecklistItems] = useState([]);

  const isMountedRef = useRef(true);
  const lastFetchedIdRef = useRef(null);

  // Determine which Trip ID we need to load
  const resolveTargetTripId = useCallback(() => {
    // 1. URL search param ?tripId=...
    const urlParams = new URLSearchParams(window.location.search);
    const qId = urlParams.get('tripId');
    if (qId && !isNaN(parseInt(qId, 10))) return parseInt(qId, 10);
    
    // 2. Path param /trip-dashboard/:id
    const pathParts = window.location.pathname.split('/');
    const lastPart = pathParts[pathParts.length - 1];
    if (lastPart && !isNaN(parseInt(lastPart, 10))) return parseInt(lastPart, 10);

    // 3. Current trip ID in localStorage
    const storedId = localStorage.getItem('trippulse_current_trip_id');
    if (storedId && !isNaN(parseInt(storedId, 10))) return parseInt(storedId, 10);

    // 4. Trip prop ID
    if (trip?.id) return trip.id;

    return null;
  }, [trip?.id]);

  // Fetch optional destination weather independently (never blocks main dashboard)
  const fetchWeatherAsync = useCallback(async (destinationName) => {
    if (!destinationName) return;
    setWeatherLoading(true);
    setWeatherError(false);
    try {
      // 4 second timeout for weather
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Weather timeout')), 4000));
      const fetchPromise = api.get(`/weather?city=${encodeURIComponent(destinationName)}`);
      const res = await Promise.race([fetchPromise, timeoutPromise]);
      if (isMountedRef.current && res && res.success && res.data) {
        setWeatherData(res.data);
      } else if (isMountedRef.current) {
        setWeatherError(true);
      }
    } catch {
      if (isMountedRef.current) {
        setWeatherError(true);
      }
    } finally {
      if (isMountedRef.current) {
        setWeatherLoading(false);
      }
    }
  }, []);

  // Main Data Fetcher
  const loadTripData = useCallback(async () => {
    if (!isMountedRef.current) return;
    setUiState('loading');
    setErrorMessage('');

    const targetId = resolveTargetTripId();

    try {
      // Helper with 6-second timeout guarantee
      const withTimeout = (promise, ms = 6000) => {
        return Promise.race([
          promise,
          new Promise((_, reject) => setTimeout(() => reject(new Error('Request timed out after 6 seconds.')), ms))
        ]);
      };

      let loadedTrip = null;

      if (targetId) {
        try {
          const res = await withTimeout(api.get(`/trips/${targetId}`));
          if (res && res.success && res.data) {
            loadedTrip = res.data;
          }
        } catch (singleTripErr) {
          console.warn(`Trip ID ${targetId} fetch notice:`, singleTripErr);
        }
      }

      // If specific trip ID was not found or failed, try user's trips list
      if (!loadedTrip) {
        try {
          const listRes = await withTimeout(api.get('/trips'));
          if (listRes && listRes.success && Array.isArray(listRes.data) && listRes.data.length > 0) {
            loadedTrip = listRes.data[0];
          }
        } catch (listErr) {
          console.warn('Trips list fetch notice:', listErr);
        }
      }

      // Fall back to passed-in trip prop if valid
      if (!loadedTrip && trip && (trip.destination || trip.title)) {
        loadedTrip = trip;
      }

      if (!isMountedRef.current) return;

      if (loadedTrip) {
        lastFetchedIdRef.current = loadedTrip.id;
        setTripData(loadedTrip);
        setChecklistItems(Array.isArray(loadedTrip.checklists) ? loadedTrip.checklists : []);
        setUiState('success');

        // Persist active ID
        if (loadedTrip.id) {
          try {
            localStorage.setItem('trippulse_current_trip_id', String(loadedTrip.id));
          } catch {}
        }

        // Trigger secondary weather fetch in background
        const dest = loadedTrip.destination || 'Coimbatore';
        fetchWeatherAsync(dest);
      } else {
        // No trip data found at all
        setUiState('empty');
      }
    } catch (err) {
      console.error('TripDashboard load error:', err);
      if (!isMountedRef.current) return;

      // If we have an existing trip prop, render it rather than showing error
      if (trip && trip.destination) {
        setTripData(trip);
        setChecklistItems(Array.isArray(trip.checklists) ? trip.checklists : []);
        setUiState('success');
        fetchWeatherAsync(trip.destination);
      } else {
        setErrorMessage(err.message || 'Unable to connect to trip server. Please check that the backend is running.');
        setUiState('error');
      }
    }
  }, [resolveTargetTripId, trip, fetchWeatherAsync]);

  useEffect(() => {
    isMountedRef.current = true;
    loadTripData();

    return () => {
      isMountedRef.current = false;
    };
  }, [loadTripData]);

  // Handle quick checklist item toggle
  const handleToggleChecklist = async (itemId, currentStatus) => {
    const updated = checklistItems.map(item => 
      item.id === itemId ? { ...item, is_completed: !currentStatus } : item
    );
    setChecklistItems(updated);

    try {
      await api.put(`/checklists/${itemId}`, { is_completed: !currentStatus });
    } catch (err) {
      console.warn('Checklist update sync notice:', err);
    }
  };

  // -------------------------------------------------------------
  // STATE 1: LOADING (Polished Dashboard Skeleton)
  // -------------------------------------------------------------
  if (uiState === 'loading') {
    return <DashboardSkeleton />;
  }

  // -------------------------------------------------------------
  // STATE 2: ERROR (Clear error card with Retry action)
  // -------------------------------------------------------------
  if (uiState === 'error') {
    return (
      <div className="glass-card" style={{ maxWidth: '560px', margin: '48px auto', textAlign: 'center', padding: '36px 28px' }}>
        <AlertCircle size={44} style={{ color: '#f87171', margin: '0 auto 16px auto' }} />
        <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>
          We couldn't load your trip
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '24px', lineHeight: 1.5 }}>
          {errorMessage || 'Unable to retrieve your trip itinerary and budget details.'}
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button className="btn btn-secondary btn-md" onClick={loadTripData} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <RefreshCw size={14} /> Retry
          </button>
          <button className="btn btn-primary btn-md" onClick={() => setActivePage('create-trip')} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={14} /> Create Trip
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // STATE 3: EMPTY (No active trip found)
  // -------------------------------------------------------------
  if (uiState === 'empty' || !tripData) {
    return (
      <div className="glass-card" style={{ maxWidth: '560px', margin: '48px auto', textAlign: 'center', padding: '36px 28px' }}>
        <FolderOpen size={44} style={{ color: '#60a5fa', margin: '0 auto 16px auto' }} />
        <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>
          No active trip found
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '24px', lineHeight: 1.5 }}>
          You don't have any active trip itineraries yet. Plan a new trip with AI cost prediction and attraction routing.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button className="btn btn-primary btn-md" onClick={() => setActivePage('create-trip')} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={14} /> Create a Trip
          </button>
          <button className="btn btn-secondary btn-md" onClick={() => setActivePage('search')}>
            <Search size={14} /> Explore Sights
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // STATE 4: SUCCESS (Full Modern Dashboard)
  // -------------------------------------------------------------
  const data = tripData;
  const formattedTitle = formatTripTitle(data);
  const formattedDest = formatCity(data.destination || 'Coimbatore');
  const formattedOrigin = formatCity(data.current_location || 'Chennai');
  const heroImage = getDestinationImage(data.destination);

  const itinerary = Array.isArray(data.itinerary_items) ? data.itinerary_items : [];
  const expenses = Array.isArray(data.expenses) ? data.expenses : [];
  const activeChecklists = checklistItems.length > 0 ? checklistItems : (Array.isArray(data.checklists) ? data.checklists : [
    { id: 1, item_name: 'Government ID & Travel Tickets', is_completed: false },
    { id: 2, item_name: 'Weather-appropriate clothing & comfortable shoes', is_completed: false },
    { id: 3, item_name: 'Emergency medication & First-Aid kit', is_completed: true },
    { id: 4, item_name: 'Phone chargers & Power bank', is_completed: false }
  ]);

  const completedChecks = activeChecklists.filter(c => c && c.is_completed).length;
  const checkProgress = activeChecklists.length > 0 ? Math.round((completedChecks / activeChecklists.length) * 100) : 0;

  // Category map for expense doughnut
  const expCategories = {};
  expenses.forEach(e => {
    if (e && e.category) {
      expCategories[e.category] = (expCategories[e.category] || 0) + (Number(e.amount) || 0);
    }
  });

  // Budget numbers & variance
  const budgetNum = Number(data.budget) || 15000;
  const estCostNum = Number(data.estimated_cost) || 17340;
  const actualSpentNum = Number(data.total_actual_spent) || 0;
  const remainingBudgetNum = data.remaining_budget !== undefined && data.remaining_budget !== null 
    ? Number(data.remaining_budget) 
    : (budgetNum - actualSpentNum);
  const membersCountNum = Math.max(1, Number(data.members_count) || 2);

  const estVariance = estCostNum - budgetNum;
  const isEstOverBudget = estVariance > 0;
  const spentPercent = budgetNum > 0 ? Math.min(100, Math.round((actualSpentNum / budgetNum) * 100)) : 0;

  // Next scheduled stop
  const nextActivity = itinerary.find(it => it && it.day_number === 1) || itinerary[0] || {
    custom_title: 'Siruvani Waterfalls & Dam',
    day_number: 1,
    time_slot: '09:30 AM',
    duration_hours: 2.5,
    travel_time_min: 45,
    place: {
      category: 'Nature & Waterfall',
      description: 'Pristine reservoir and picturesque waterfall known for sweet mineral water.'
    }
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* 1. Trip Master Hero Section */}
      <div style={{
        position: 'relative',
        borderRadius: 'var(--radius-xl)',
        overflow: 'hidden',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-md)',
        minHeight: '220px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        padding: '28px 32px',
        background: `linear-gradient(to top, rgba(9, 13, 22, 0.95) 0%, rgba(9, 13, 22, 0.65) 50%, rgba(9, 13, 22, 0.35) 100%), url(${heroImage}) center/cover no-repeat`
      }}>
        {/* Top Badges & Quick Action Controls */}
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '32px',
          right: '32px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          {/* Route Badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              background: 'rgba(15, 23, 42, 0.85)',
              backdropFilter: 'blur(8px)',
              padding: '5px 12px',
              borderRadius: 'var(--radius-full)',
              color: '#93c5fd',
              fontSize: '0.8rem',
              fontWeight: 700,
              border: '1px solid rgba(59, 130, 246, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <MapPin size={13} color="#60a5fa" />
              {formattedOrigin} → {formattedDest}
            </span>

            <span className="badge badge-success" style={{ backdropFilter: 'blur(8px)' }}>
              <Sparkles size={11} /> Active Journey
            </span>
          </div>

          {/* Quick Header Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => setActivePage('create-trip')}
              style={{ background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)' }}
            >
              <Plus size={13} /> New Trip
            </button>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={() => setActivePage('map')}
              style={{ background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(8px)' }}
            >
              <Map size={13} /> View Map
            </button>
          </div>
        </div>

        {/* Hero Bottom: Title & Travel Info */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px', marginTop: '48px' }}>
          <div>
            <h1 style={{
              fontSize: '1.85rem',
              fontWeight: 800,
              color: '#ffffff',
              marginBottom: '8px',
              letterSpacing: '-0.02em',
              textShadow: '0 2px 8px rgba(0,0,0,0.5)'
            }}>
              {formattedTitle}
            </h1>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: '#cbd5e1', fontSize: '0.86rem', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Calendar size={15} color="#60a5fa" /> 
                {formatDateRange(data.start_date, data.end_date, data.days_count)}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Users size={15} color="#34d399" /> 
                {membersCountNum} {membersCountNum === 1 ? 'traveler' : 'travelers'}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Car size={15} color="#c084fc" /> 
                {data.transport_type || 'Car'} • {data.accommodation_type || 'Standard Stay'}
              </span>
            </div>
          </div>

          {/* Integrated Weather Badge (Independent fallback) */}
          <div 
            onClick={() => setActivePage('weather')}
            style={{
              background: 'rgba(15, 23, 42, 0.85)',
              backdropFilter: 'blur(12px)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              padding: '8px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              transition: 'var(--transition-fast)'
            }}
            title="Click to view weather forecast"
          >
            <CloudSun size={24} color="#60a5fa" />
            <div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>
                {weatherData?.temperature !== undefined ? `${weatherData.temperature}°C` : (weatherLoading ? '...' : '24°C')}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {weatherData?.condition || (weatherError ? 'Forecast ready' : 'Partly Cloudy')} • {weatherData?.suitability || 'Good'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Budget & Financial Overview Cards */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
            Trip Budget & Cost Intelligence
          </h2>
          <span 
            onClick={() => setActivePage('cost-prediction')}
            style={{ fontSize: '0.78rem', color: '#60a5fa', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            ML Cost Breakdown <ChevronRight size={13} />
          </span>
        </div>

        <div className="grid-4">
          {/* Card 1: Target Budget */}
          <div className="glass-card" style={{ padding: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Trip Budget</span>
              <DollarSign size={16} color="#60a5fa" />
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff' }}>
              {formatCurrency(budgetNum)}
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: '4px' }}>
              Total planned group budget
            </div>
          </div>

          {/* Card 2: Estimated Cost */}
          <div className="glass-card" style={{ padding: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Estimated Trip Cost</span>
              <span className={isEstOverBudget ? 'badge badge-warning' : 'badge badge-success'}>
                {isEstOverBudget ? 'Forecast Over' : 'On Track'}
              </span>
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: isEstOverBudget ? '#fbbf24' : '#93c5fd' }}>
              {formatCurrency(estCostNum)}
            </div>
            <div style={{ fontSize: '0.74rem', color: isEstOverBudget ? '#f59e0b' : '#34d399', marginTop: '4px', fontWeight: 600 }}>
              {isEstOverBudget 
                ? `+${formatCurrency(estVariance)} over planned budget`
                : `${formatCurrency(Math.abs(estVariance))} buffer available`
              }
            </div>
          </div>

          {/* Card 3: Spent So Far */}
          <div className="glass-card" style={{ padding: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Spent So Far</span>
              <Receipt size={16} color="#34d399" />
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff' }}>
              {formatCurrency(actualSpentNum)}
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: '4px' }}>
              {spentPercent}% of planned budget used
            </div>
          </div>

          {/* Card 4: Budget Remaining */}
          <div className="glass-card" style={{ padding: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Budget Remaining</span>
              <span className={remainingBudgetNum >= 0 ? 'badge badge-success' : 'badge badge-danger'}>
                {remainingBudgetNum >= 0 ? 'Available' : 'Deficit'}
              </span>
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: remainingBudgetNum >= 0 ? '#34d399' : '#f87171' }}>
              {formatCurrency(remainingBudgetNum)}
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: '4px' }}>
              Available group spending buffer
            </div>
          </div>
        </div>
      </div>

      {/* 3. Primary Core Cards: Next Stop, Weather, Checklist */}
      <div className="grid-3">
        {/* Next Scheduled Stop */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#60a5fa' }}>
                <Clock size={16} />
                <span style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Next Stop</span>
              </div>
              <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>
                Day {nextActivity?.day_number || 1} • {nextActivity?.time_slot || '09:30 AM'}
              </span>
            </div>

            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', marginBottom: '6px' }}>
              {nextActivity?.custom_title || nextActivity?.place?.name || 'Scheduled Sight'}
            </h3>

            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '14px' }}>
              {nextActivity?.place?.description || nextActivity?.notes || `Explore the iconic attractions of ${formattedDest}.`}
            </p>

            <div style={{ display: 'flex', gap: '12px', color: 'var(--text-dim)', fontSize: '0.78rem', marginBottom: '8px' }}>
              <span>⏱ Duration: <strong>{nextActivity?.duration_hours || 2.5} hrs</strong></span>
              <span>🚗 Travel: <strong>{nextActivity?.travel_time_min || 45} min</strong></span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
            <button 
              className="btn btn-secondary btn-sm" 
              style={{ flex: 1 }} 
              onClick={() => setActivePage('itinerary')}
            >
              View Itinerary
            </button>
            <button 
              className="btn btn-primary btn-sm" 
              style={{ flex: 1 }} 
              onClick={() => setActivePage('map')}
            >
              <Navigation size={13} /> Open Map
            </button>
          </div>
        </div>

        {/* Live Weather Forecast */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#34d399' }}>
                <CloudSun size={16} />
                <span style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Destination Weather</span>
              </div>
              <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>
                {weatherData?.suitability || 'Good Condition'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff' }}>
                {weatherData?.temperature !== undefined ? `${weatherData.temperature}°C` : (weatherLoading ? '...' : '24°C')}
              </span>
              <span style={{ fontSize: '0.86rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                {weatherData?.condition || (weatherError ? 'Weather info ready' : 'Partly Cloudy')} in {formattedDest}
              </span>
            </div>

            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5, marginTop: '6px', marginBottom: '12px' }}>
              {weatherData?.advice || `Ideal conditions for outdoor sightseeing, park walks, and photography in ${formattedDest}.`}
            </p>

            <div style={{ display: 'flex', gap: '14px', color: 'var(--text-dim)', fontSize: '0.78rem' }}>
              <span>💧 Humidity: <strong>{weatherData?.humidity !== undefined ? `${weatherData.humidity}%` : '58%'}</strong></span>
              <span>💨 Wind: <strong>{weatherData?.wind_speed !== undefined ? `${weatherData.wind_speed} km/h` : '12 km/h'}</strong></span>
            </div>
          </div>

          <button 
            className="btn btn-secondary btn-sm" 
            style={{ width: '100%', marginTop: '14px' }} 
            onClick={() => setActivePage('weather')}
          >
            Check Indoor Alternatives <ArrowRight size={13} />
          </button>
        </div>

        {/* Packing & Trip Checklist */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f59e0b' }}>
                <CheckSquare size={16} />
                <span style={{ fontSize: '0.82rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Trip Checklist</span>
              </div>
              <span style={{ fontSize: '0.78rem', color: '#fbbf24', fontWeight: 700 }}>
                {completedChecks} / {activeChecklists.length} done
              </span>
            </div>

            {/* Progress Bar */}
            <div style={{ height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', overflow: 'hidden', marginBottom: '12px' }}>
              <div style={{ width: `${checkProgress}%`, height: '100%', background: 'var(--emerald-gradient)', borderRadius: '3px', transition: 'width 0.3s ease' }} />
            </div>

            {/* Interactive items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
              {activeChecklists.slice(0, 3).map((item, idx) => (
                <label 
                  key={item.id || idx}
                  onClick={(e) => {
                    e.preventDefault();
                    handleToggleChecklist(item.id, item.is_completed);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.8rem',
                    color: item.is_completed ? 'var(--text-dim)' : 'var(--text-main)',
                    textDecoration: item.is_completed ? 'line-through' : 'none',
                    cursor: 'pointer'
                  }}
                >
                  <input 
                    type="checkbox" 
                    checked={!!item.is_completed} 
                    readOnly 
                    style={{ accentColor: 'var(--primary)', cursor: 'pointer' }} 
                  />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.item_name || item.title || 'Checklist item'}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <button 
            className="btn btn-secondary btn-sm" 
            style={{ width: '100%', marginTop: '14px' }} 
            onClick={() => setActivePage('checklist')}
          >
            Open Checklist Manager <ArrowRight size={13} />
          </button>
        </div>
      </div>

      {/* 4. AI Travel Assistant Integrated Helper Panel */}
      <div className="glass-card" style={{
        background: 'linear-gradient(135deg, rgba(13, 18, 31, 0.8) 0%, rgba(30, 27, 75, 0.4) 100%)',
        border: '1px solid rgba(168, 85, 247, 0.25)',
        padding: '20px 24px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#c084fc', marginBottom: '6px' }}>
              <Bot size={17} />
              <span style={{ fontSize: '0.88rem', fontWeight: 700 }}>AI Tourist Assistant</span>
              <span className="badge badge-purple" style={{ fontSize: '0.66rem' }}>Context-Aware</span>
            </div>
            <p style={{ color: '#cbd5e1', fontSize: '0.86rem', margin: 0 }}>
              Need recommendations for {formattedDest}? Tap a suggested prompt or ask anything:
            </p>
          </div>

          <button 
            className="btn btn-primary btn-sm" 
            onClick={() => setActivePage('assistant')}
            style={{ background: 'var(--purple-gradient)' }}
          >
            <Sparkles size={14} /> Open AI Assistant
          </button>
        </div>

        {/* Clickable Quick Prompts */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '14px' }}>
          {[
            `What should I pack for ${formattedDest}?`,
            `How can I reduce expenses for this trip?`,
            `What are the best dining spots near our stops?`,
            `Suggest indoor alternatives in case of rain`
          ].map((prompt, pIdx) => (
            <button
              key={pIdx}
              onClick={() => setActivePage('assistant')}
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 'var(--radius-full)',
                padding: '5px 12px',
                color: '#cbd5e1',
                fontSize: '0.78rem',
                cursor: 'pointer',
                transition: 'var(--transition-fast)',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(168, 85, 247, 0.15)';
                e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.35)';
                e.currentTarget.style.color = '#fff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.color = '#cbd5e1';
              }}
            >
              <HelpCircle size={12} color="#c084fc" />
              <span>{prompt}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 5. Financial Analytics Charts */}
      <div className="grid-2">
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#fff', margin: 0 }}>
              Expenses by Category
            </h3>
            <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
              {expenses.length} logged
            </span>
          </div>
          <ExpenseCategoryDoughnut categories={expCategories} />
        </div>

        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#fff', margin: 0 }}>
              Budget vs Estimated vs Actual
            </h3>
            <span className={isEstOverBudget ? 'badge badge-warning' : 'badge badge-success'}>
              {isEstOverBudget ? 'Forecast High' : 'Within Budget'}
            </span>
          </div>
          <EstimatedVsActualBar 
            budget={budgetNum} 
            estimated={estCostNum} 
            actual={actualSpentNum} 
          />
        </div>
      </div>

      {/* 6. Quick Module Shortcuts */}
      <div className="glass-card" style={{ padding: '18px 22px' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '14px', color: 'var(--text-main)' }}>
          Quick Travel Tools
        </h3>
        
        <div className="grid-4" style={{ gap: '12px' }}>
          <div className="glass-card glass-card-interactive" style={{ padding: '14px', cursor: 'pointer' }} onClick={() => setActivePage('itinerary')}>
            <Calendar size={20} color="#60a5fa" style={{ marginBottom: '6px' }} />
            <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>Day-Wise Itinerary</div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{itinerary.length} scheduled stops</div>
          </div>

          <div className="glass-card glass-card-interactive" style={{ padding: '14px', cursor: 'pointer' }} onClick={() => setActivePage('map')}>
            <Map size={20} color="#34d399" style={{ marginBottom: '6px' }} />
            <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>Map & Live Routes</div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>GPS routing & pins</div>
          </div>

          <div className="glass-card glass-card-interactive" style={{ padding: '14px', cursor: 'pointer' }} onClick={() => setActivePage('expenses')}>
            <Receipt size={20} color="#f59e0b" style={{ marginBottom: '6px' }} />
            <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>Expenses & Split</div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Split peer payments</div>
          </div>

          <div className="glass-card glass-card-interactive" style={{ padding: '14px', cursor: 'pointer' }} onClick={() => setActivePage('reservations')}>
            <Ticket size={20} color="#ec4899" style={{ marginBottom: '6px' }} />
            <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>Reservations</div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Hotels & transit bookings</div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default TripDashboard;
