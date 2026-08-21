import React, { useState, useEffect } from 'react';
import { 
  CloudSun, 
  CloudRain, 
  Wind, 
  Droplets, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Home, 
  Sparkles, 
  Plus, 
  MapPin,
  ArrowRight
} from 'lucide-react';
import api from '../services/api';
import PlaceCard from '../components/PlaceCard';
import PlaceDetailsModal from '../components/PlaceDetailsModal';
import LoadingSpinner from '../components/LoadingSpinner';

export const WeatherPage = ({ trip, setActivePage }) => {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [cityInput, setCityInput] = useState(trip?.destination || 'Ooty');

  const fetchWeather = async (city = cityInput) => {
    try {
      setLoading(true);
      const res = await api.get(`/weather?city=${encodeURIComponent(city)}`);
      if (res.success && res.data) {
        setWeatherData(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather(trip?.destination || 'Ooty');
  }, [trip?.destination]);

  const handleCitySearch = (e) => {
    e.preventDefault();
    fetchWeather(cityInput);
  };

  const handleAddIndoorToItinerary = async (place) => {
    try {
      const res = await api.post('/itinerary', {
        trip_id: trip?.id || 1,
        day_number: 1,
        time_slot: '03:30 PM',
        place_id: place.id,
        custom_title: place.name,
        activity_type: 'attraction',
        duration_hours: place.estimated_visit_hours || 2.0,
        notes: 'Indoor weather-safe alternative selected'
      });
      if (res.success) {
        alert(`✓ "${place.name}" added to itinerary as weather-safe stop!`);
      }
    } catch (err) {
      alert(err.message || 'Failed to add activity');
    }
  };

  const isRainyOrUnsuitable = weatherData?.suitability === 'UNSUITABLE' || 
    weatherData?.forecast?.some(f => f.suitability === 'UNSUITABLE' || f.condition === 'Rain');

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header Banner */}
      <div className="glass-card" style={{
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.35) 0%, rgba(30, 58, 138, 0.35) 50%, rgba(17, 24, 39, 0.9) 100%)',
        border: '1px solid rgba(16, 185, 129, 0.3)',
        padding: '28px 32px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span className="badge badge-success">
            <CloudSun size={12} /> Weather Intelligence & Meteorological Engine
          </span>
          <span className="badge badge-info">
            OpenWeatherMap API + Smart Fallback
          </span>
        </div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', marginBottom: '6px' }}>
          Weather Forecast & Weather-Aware Alternative Engine
        </h1>
        <p style={{ color: '#cbd5e1', fontSize: '0.92rem' }}>
          Classifies outdoor trip suitability (<strong>GOOD, MODERATE, UNSUITABLE</strong>) and automatically identifies indoor cultural, museum, and dining alternatives when bad weather strikes.
        </p>
      </div>

      {/* City Switcher Form */}
      <div className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <form onSubmit={handleCitySearch} style={{ display: 'flex', gap: '10px', flex: 1, maxWidth: '480px' }}>
          <input 
            type="text" 
            className="form-input" 
            placeholder="Check weather for another city (e.g. Ooty, Chennai, Munnar)..."
            value={cityInput}
            onChange={(e) => setCityInput(e.target.value)}
          />
          <button type="submit" className="btn btn-primary btn-sm">Check</button>
        </form>

        <div style={{ display: 'flex', gap: '6px' }}>
          {['Ooty', 'Chennai', 'Munnar', 'Paris', 'Tokyo'].map((c) => (
            <button
              key={c}
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setCityInput(c);
                fetchWeather(c);
              }}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <LoadingSpinner text="Retrieving meteorological data and indoor alternatives..." />
        </div>
      ) : weatherData && (
        <>
          {/* Main Weather Metric Cards */}
          <div className="grid-3" style={{ gap: '20px' }}>
            
            {/* Current Snapshot Card */}
            <div className="glass-card" style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#93c5fd', fontSize: '0.88rem' }}>
                      <MapPin size={15} /> {weatherData.city}, {weatherData.country}
                    </div>
                    <div style={{ fontSize: '3rem', fontWeight: 900, color: '#fff', lineHeight: 1.1, marginTop: '8px' }}>
                      {weatherData.temperature}°C
                    </div>
                    <div style={{ fontSize: '1rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Feels like {weatherData.feels_like}°C • <strong>{weatherData.condition}</strong> ({weatherData.description})
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-dim)', marginBottom: '4px' }}>Outdoor Suitability</div>
                    <span className={
                      weatherData.suitability === 'GOOD' ? 'badge badge-success' :
                      (weatherData.suitability === 'MODERATE' ? 'badge badge-warning' : 'badge badge-danger')
                    } style={{ fontSize: '0.92rem', padding: '6px 16px' }}>
                      {weatherData.suitability}
                    </span>
                  </div>
                </div>

                <p style={{
                  fontSize: '0.86rem',
                  color: '#cbd5e1',
                  background: 'rgba(255, 255, 255, 0.03)',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                  marginTop: '18px',
                  lineHeight: 1.5
                }}>
                  {weatherData.suitability_reason}
                </p>
              </div>

              <div className="grid-2" style={{ gap: '12px', marginTop: '18px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  <Droplets size={18} color="#60a5fa" />
                  <span>Humidity: <strong>{weatherData.humidity}%</strong></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  <Wind size={18} color="#34d399" />
                  <span>Wind: <strong>{weatherData.wind_speed} km/h</strong></span>
                </div>
              </div>
            </div>

            {/* Suitability Explainer Callout Card */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '12px', color: '#34d399', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={16} /> Weather-Aware Intelligence
                </h3>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
                  The weather module monitors precipitation thresholds. If rainfall exceeds 70% or heavy mist occurs, it triggers the <strong>Indoor Alternative Engine</strong> to swap outdoor trails with covered historical, museum, or indoor parks.
                </p>
              </div>

              <div style={{ padding: '12px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(59, 130, 246, 0.25)', fontSize: '0.8rem', color: '#93c5fd' }}>
                ✓ {weatherData.indoor_alternatives?.length || 0} Indoor Safe Attractions available for {weatherData.city}
              </div>
            </div>

          </div>

          {/* 5-Day Weather Forecast Strip */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', color: '#fff' }}>
              5-Day Meteorological Forecast
            </h3>

            <div className="grid-5" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
              {weatherData.forecast?.map((day, idx) => (
                <div 
                  key={idx}
                  style={{
                    padding: '16px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: day.condition === 'Rain' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                    border: `1px solid ${day.condition === 'Rain' ? 'rgba(239, 68, 68, 0.3)' : 'var(--border)'}`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    gap: '6px'
                  }}
                >
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff' }}>{day.date}</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: day.condition === 'Rain' ? '#f87171' : '#60a5fa', margin: '4px 0' }}>
                    {day.temp_day}°C
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{day.condition}</div>
                  
                  <span className={
                    day.suitability === 'GOOD' ? 'badge badge-success' :
                    (day.suitability === 'MODERATE' ? 'badge badge-warning' : 'badge badge-danger')
                  } style={{ fontSize: '0.7rem', marginTop: '6px' }}>
                    {day.suitability}
                  </span>

                  <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '4px' }}>
                    Rain: {day.rain_probability}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Automated Weather-Aware Indoor Alternatives Section */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Home size={20} color="#34d399" />
                  <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                    Indoor & All-Weather Alternatives
                  </h2>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Covered museums, tea factories, and cultural venues recommended when weather is unsuitable for mountain treks.
                </p>
              </div>
            </div>

            <div className="grid-3" style={{ gap: '20px' }}>
              {weatherData.indoor_alternatives?.map((place) => (
                <PlaceCard 
                  key={place.id}
                  place={place}
                  onSelect={setSelectedPlace}
                  onAddToTrip={handleAddIndoorToItinerary}
                />
              ))}
            </div>
          </div>
        </>
      )}

      {/* Details Modal */}
      {selectedPlace && (
        <PlaceDetailsModal 
          place={selectedPlace}
          onClose={() => setSelectedPlace(null)}
          onAddToTrip={handleAddIndoorToItinerary}
        />
      )}

    </div>
  );
};

export default WeatherPage;
