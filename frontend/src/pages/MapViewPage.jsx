import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Map as MapIcon, 
  Navigation, 
  MapPin, 
  Users, 
  Compass, 
  ExternalLink,
  LocateFixed,
  Clock,
  Sparkles,
  Search,
  CheckCircle,
  AlertCircle,
  Eye,
  ArrowRight
} from 'lucide-react';
import api from '../services/api';
import LeafletMap from '../components/LeafletMap';
import LoadingSpinner from '../components/LoadingSpinner';

export const MapViewPage = ({ trip, directionsTarget, onClearDirectionsTarget, setActivePage }) => {
  const defaultOrigin = trip?.current_location || 'Coimbatore';
  const defaultDest = trip?.destination || 'Kanyakumari';

  const [originInput, setOriginInput] = useState(defaultOrigin);
  const [destInput, setDestInput] = useState(defaultDest);
  const [selectedPlaceInfo, setSelectedPlaceInfo] = useState(null);

  const [originCoords, setOriginCoords] = useState(null);
  const [destCoords, setDestCoords] = useState(null);

  const [routeData, setRouteData] = useState(null);
  const [routeError, setRouteError] = useState('');
  const [itineraryStops, setItineraryStops] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [selectedDay, setSelectedDay] = useState(0);

  const tripId = trip?.id;
  const initialLoadDone = useRef(false);

  const calculateRoute = useCallback(async (orig, dest, customOrigCoords = null, customDestCoords = null) => {
    const cleanOrig = (orig || '').trim();
    const cleanDest = (dest || '').trim();

    if (!cleanOrig || !cleanDest) return;

    try {
      setLoading(true);
      setRouteError('');

      // Use coordinates only if explicitly provided (e.g. from GPS or attraction card)
      let originParam = cleanOrig;
      if (customOrigCoords) {
        originParam = `${customOrigCoords.lat},${customOrigCoords.lng}`;
      } else if (originCoords && cleanOrig.startsWith('My Location')) {
        originParam = `${originCoords.lat},${originCoords.lng}`;
      }

      let destParam = cleanDest;
      if (customDestCoords) {
        destParam = `${customDestCoords.lat},${customDestCoords.lng}`;
      } else if (destCoords && selectedPlaceInfo && selectedPlaceInfo.name.toLowerCase() === cleanDest.toLowerCase()) {
        destParam = `${destCoords.lat},${destCoords.lng}`;
      }

      const res = await api.get(`/maps/directions?origin=${encodeURIComponent(originParam)}&destination=${encodeURIComponent(destParam)}`);
      if (res && res.success && res.data) {
        setRouteData(res.data);
      } else {
        setRouteError(res?.message || 'Unable to calculate route for this destination.');
        setRouteData(null);
      }
    } catch (err) {
      console.error('Error calculating route:', err);
      setRouteError(err.message || 'Unable to calculate route for this destination.');
      setRouteData(null);
    } finally {
      setLoading(false);
    }
  }, [originCoords, destCoords, selectedPlaceInfo]);

  // WebSocket live location tracking
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
            setMembers(prevMembers => {
              const idx = prevMembers.findIndex(m => 
                (payload.user_id && m.user_id === payload.user_id) || 
                (payload.user_name && m.name && m.name.toLowerCase() === payload.user_name.toLowerCase())
              );
              if (idx >= 0) {
                const updated = [...prevMembers];
                updated[idx] = {
                  ...updated[idx],
                  is_sharing_location: payload.is_sharing,
                  last_latitude: payload.latitude,
                  last_longitude: payload.longitude,
                  last_location_time: payload.timestamp
                };
                return updated;
              } else if (payload.latitude && payload.longitude) {
                return [...prevMembers, {
                  id: Date.now(),
                  trip_id: tripId,
                  name: payload.user_name || 'Member',
                  is_sharing_location: payload.is_sharing,
                  last_latitude: payload.latitude,
                  last_longitude: payload.longitude,
                  last_location_time: payload.timestamp,
                  role: 'VIEW'
                }];
              }
              return prevMembers;
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

  // Handle incoming directionsTarget from Itinerary / Explore / Attraction Cards
  useEffect(() => {
    if (!directionsTarget) return;

    const targetPlace = directionsTarget.destination || directionsTarget.place || (directionsTarget.latitude ? directionsTarget : null);
    const targetOrigin = directionsTarget.origin || trip?.current_location || 'Current Location';

    if (targetPlace && (targetPlace.name || targetPlace.title)) {
      const placeName = targetPlace.name || targetPlace.title;
      const placeCoords = (targetPlace.latitude && targetPlace.longitude) 
        ? { lat: Number(targetPlace.latitude), lng: Number(targetPlace.longitude) } 
        : null;

      setDestInput(placeName);
      setSelectedPlaceInfo(targetPlace);
      setDestCoords(placeCoords);

      setOriginInput(targetOrigin);
      setOriginCoords(null);

      calculateRoute(targetOrigin, placeName, null, placeCoords);
    } else if (directionsTarget.destination || typeof directionsTarget === 'string') {
      const destStr = typeof directionsTarget === 'string' ? directionsTarget : directionsTarget.destination;
      setDestInput(destStr);
      setSelectedPlaceInfo(null);
      setDestCoords(null);
      calculateRoute(targetOrigin, destStr, null, null);
    }

    if (onClearDirectionsTarget) {
      onClearDirectionsTarget();
    }
  }, [directionsTarget, trip, calculateRoute, onClearDirectionsTarget]);

  // Initial load for map data if no directionsTarget was provided
  useEffect(() => {
    if (initialLoadDone.current) return;
    initialLoadDone.current = true;

    if (!directionsTarget) {
      const initialOrig = trip?.current_location || 'Coimbatore';
      const initialDest = trip?.destination || 'Kanyakumari';
      setOriginInput(initialOrig);
      setDestInput(initialDest);
      calculateRoute(initialOrig, initialDest, null, null);
    }

    if (tripId) {
      api.get(`/itinerary/${tripId}`).then(res => {
        if (res.success && res.data) setItineraryStops(res.data);
      }).catch(err => console.error(err));

      api.get(`/members/${tripId}`).then(res => {
        if (res.success && res.data) setMembers(res.data);
      }).catch(err => console.error(err));
    }
  }, [tripId, trip, directionsTarget, calculateRoute]);

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const coords = { lat, lng };
        setOriginCoords(coords);
        setOriginInput(`My Location (${lat.toFixed(3)}°, ${lng.toFixed(3)}°)`);
        setLocating(false);
        calculateRoute(`My Location (${lat.toFixed(3)}°, ${lng.toFixed(3)}°)`, destInput, coords, destCoords);
      },
      (err) => {
        console.warn('Geolocation denied or timed out:', err);
        setLocating(false);
        alert('Could not access current GPS location. Please enter your origin manually.');
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  const handleShowRoute = (e) => {
    e.preventDefault();
    calculateRoute(originInput, destInput, originCoords, destCoords);
  };

  const handleOpenInGoogleMaps = () => {
    if (routeData?.google_maps_url) {
      window.open(routeData.google_maps_url, '_blank', 'noopener,noreferrer');
    } else {
      const origParam = originCoords ? `${originCoords.lat},${originCoords.lng}` : originInput;
      const destParam = destCoords ? `${destCoords.lat},${destCoords.lng}` : destInput;
      const gUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origParam)}&destination=${encodeURIComponent(destParam)}&travelmode=driving`;
      window.open(gUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const filteredStops = itineraryStops.filter(s => {
    if (selectedDay === 0) return true;
    return s.day_number === selectedDay;
  });

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header Banner */}
      <div className="glass-card" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.45) 0%, rgba(17, 24, 39, 0.9) 100%)',
        padding: '24px 28px',
        border: '1px solid rgba(99, 102, 241, 0.3)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="badge badge-info">
              <MapIcon size={12} /> Live Route & Directions Matrix
            </span>
            {routeData && (
              <span className="badge badge-success">
                {routeData.origin} → {routeData.destination}
              </span>
            )}
          </div>
          <h1 style={{ fontSize: '1.7rem', fontWeight: 800, color: '#fff', margin: 0 }}>
            Interactive Route Directions & Maps
          </h1>
        </div>

        {routeData && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '10px 18px',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)'
          }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Driving Distance</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#60a5fa' }}>{routeData.distance_km} km</div>
            </div>
            <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: '16px' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Estimated Transit</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#34d399' }}>{routeData.duration_formatted}</div>
            </div>
            <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: '16px' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Travel Mode</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f59e0b' }}>Driving / Road</div>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Origin/Destination Controls Bar */}
      <div className="glass-card" style={{ padding: '16px 20px' }}>
        <form onSubmit={handleShowRoute} style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'flex-end' }}>
          
          <div style={{ flex: '1 1 240px' }}>
            <label className="form-label" style={{ fontSize: '0.78rem', marginBottom: '4px' }}>Origin / Starting Location</label>
            <div style={{ position: 'relative' }}>
              <MapPin size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#10b981' }} />
              <input 
                type="text" 
                className="form-input"
                style={{ paddingLeft: '36px', fontSize: '0.88rem' }}
                value={originInput}
                onChange={(e) => {
                  setOriginInput(e.target.value);
                  setOriginCoords(null);
                }}
                placeholder="e.g. Coimbatore, Chennai, Bangalore"
                required
              />
            </div>
          </div>

          <div style={{ flex: '1 1 240px' }}>
            <label className="form-label" style={{ fontSize: '0.78rem', marginBottom: '4px' }}>Destination / Attraction</label>
            <div style={{ position: 'relative' }}>
              <MapPin size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#ef4444' }} />
              <input 
                type="text" 
                className="form-input"
                style={{ paddingLeft: '36px', fontSize: '0.88rem' }}
                value={destInput}
                onChange={(e) => {
                  setDestInput(e.target.value);
                  setDestCoords(null);
                  if (selectedPlaceInfo && selectedPlaceInfo.name.toLowerCase() !== e.target.value.toLowerCase()) {
                    setSelectedPlaceInfo(null);
                  }
                }}
                placeholder="e.g. Kanyakumari, Madurai, Bhagavathi Amman Temple"
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={handleUseCurrentLocation}
              disabled={locating}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
            >
              <LocateFixed size={15} color="#34d399" />
              {locating ? 'Locating...' : 'Use My GPS Location'}
            </button>

            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
            >
              <Navigation size={15} /> Show Route
            </button>

            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={handleOpenInGoogleMaps}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: '#60a5fa' }}
            >
              <ExternalLink size={15} /> Open in Google Maps
            </button>
          </div>

        </form>
      </div>

      {/* Route Error Alert */}
      {routeError && (
        <div style={{
          padding: '14px 18px',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          color: '#fca5a5',
          fontSize: '0.88rem',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <AlertCircle size={18} style={{ flexShrink: 0, color: '#ef4444' }} />
          <span>{routeError}</span>
        </div>
      )}

      {/* Selected Tourist Place Information Card */}
      {selectedPlaceInfo && (
        <div className="glass-card" style={{
          padding: '16px 20px',
          background: 'rgba(59, 130, 246, 0.08)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="badge badge-info">{selectedPlaceInfo.category || 'Selected Tourist Attraction'}</span>
              <span style={{ fontSize: '0.8rem', color: '#fbbf24', fontWeight: 700 }}>★ {selectedPlaceInfo.rating || '4.5'}</span>
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', margin: '4px 0 2px 0' }}>
              {selectedPlaceInfo.name}
            </h3>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              {selectedPlaceInfo.address || 'Scenic Destination'} • Lat: {Number(selectedPlaceInfo.latitude || 8.0883).toFixed(4)}°, Lng: {Number(selectedPlaceInfo.longitude || 77.5385).toFixed(4)}°
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              type="button" 
              className="btn btn-primary btn-sm"
              onClick={handleOpenInGoogleMaps}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Navigation size={14} /> Open Navigation
            </button>
          </div>
        </div>
      )}

      {/* Main Interactive Map Card */}
      {loading ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '80px 0' }}>
          <LoadingSpinner text="Calculating accurate route and rendering map..." />
        </div>
      ) : (
        <div className="glass-card" style={{ padding: '8px' }}>
          <LeafletMap 
            center={
              routeData?.origin_coords
                ? [routeData.origin_coords.lat, routeData.origin_coords.lng]
                : [11.0168, 76.9558]
            }
            zoom={8}
            routeWaypoints={routeData?.waypoints || []}
            itineraryStops={filteredStops}
            memberLocations={members}
            height="580px"
          />
        </div>
      )}

      {/* Route Waypoints / Itinerary Legend */}
      <div className="grid-3">
        <div className="glass-card">
          <h4 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: '10px', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Navigation size={16} /> Route Waypoints & Markers
          </h4>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            {routeData?.waypoints && routeData.waypoints.length > 0 ? (
              routeData.waypoints.map((w, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <span style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: idx === 0 ? '#10b981' : (idx === routeData.waypoints.length - 1 ? '#ef4444' : '#3b82f6')
                  }} />
                  <span><strong>{w.name}</strong> ({w.type})</span>
                </div>
              ))
            ) : (
              <p style={{ margin: 0, color: 'var(--text-dim)' }}>Enter origin and destination above to compute route waypoints.</p>
            )}
          </div>
        </div>

        <div className="glass-card">
          <h4 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: '10px', color: '#ec4899', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Users size={16} /> Group GPS Status
          </h4>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            {members.filter(m => m.is_sharing_location).length > 0 ? (
              members.filter(m => m.is_sharing_location).map((m, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
                  <span><strong>{m.name}</strong> • Active in {destInput}</span>
                </div>
              ))
            ) : (
              <p style={{ margin: 0 }}>All trip members are in transit.</p>
            )}
          </div>
        </div>

        <div className="glass-card">
          <h4 style={{ fontSize: '0.92rem', fontWeight: 700, marginBottom: '10px', color: '#34d399', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Compass size={16} /> Transit Recommendations
          </h4>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
            Route connects {originInput} directly to {destInput}. Check live traffic and road conditions prior to departure.
          </p>
        </div>
      </div>

    </div>
  );
};

export default MapViewPage;
