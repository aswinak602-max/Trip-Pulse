import React from 'react';
import { 
  Compass, 
  MapPin, 
  Brain, 
  CloudSun, 
  Activity, 
  Database, 
  CheckCircle2, 
  ArrowRight,
  TrendingUp,
  Sparkles,
  DollarSign,
  Calendar,
  Users,
  Bot,
  Receipt,
  Ticket,
  Plus,
  Navigation,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  formatCurrency, 
  formatDateRange, 
  formatCity, 
  formatTripTitle, 
  getDestinationImage 
} from '../utils/formatters';

export const Dashboard = ({ backendStatus, loadingStatus, setActivePage, activeTrip }) => {
  const isApiOnline = backendStatus?.status === 'online' || backendStatus?.status === 'ok' || backendStatus?.success === true;
  
  const formattedTripTitle = formatTripTitle(activeTrip);
  const formattedDest = formatCity(activeTrip?.destination || 'Ooty');
  const formattedOrigin = formatCity(activeTrip?.current_location || 'Chennai');
  const tripImage = getDestinationImage(activeTrip?.destination || 'Ooty');

  const budgetNum = Number(activeTrip?.budget) || 15000;
  const estCostNum = Number(activeTrip?.estimated_cost) || 17340;
  const membersCountNum = Math.max(1, Number(activeTrip?.members_count) || 2);
  const isEstOver = estCostNum > budgetNum;
  const variance = estCostNum - budgetNum;

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '22px' }}>
      
      {/* 1. Active Trip Spotlight Hero */}
      {activeTrip && (
        <div style={{
          position: 'relative',
          borderRadius: 'var(--radius-xl)',
          overflow: 'hidden',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-md)',
          padding: '30px 32px',
          background: `linear-gradient(to right, rgba(9, 13, 22, 0.95) 0%, rgba(9, 13, 22, 0.8) 55%, rgba(9, 13, 22, 0.45) 100%), url(${tripImage}) center/cover no-repeat`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px'
        }}>
          <div style={{ maxWidth: '640px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span className="badge badge-info">
                <Sparkles size={11} /> Current Planned Journey
              </span>
              <span className="badge badge-success">
                {formattedOrigin} → {formattedDest}
              </span>
            </div>

            <h1 style={{
              fontSize: '1.75rem',
              fontWeight: 800,
              color: '#ffffff',
              marginBottom: '8px',
              letterSpacing: '-0.02em'
            }}>
              {formattedTripTitle}
            </h1>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: '#cbd5e1', fontSize: '0.86rem', flexWrap: 'wrap', marginBottom: '18px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Calendar size={14} color="#60a5fa" />
                {formatDateRange(activeTrip.start_date, activeTrip.end_date, activeTrip.days_count)}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Users size={14} color="#34d399" />
                {membersCountNum} {membersCountNum === 1 ? 'traveler' : 'travelers'}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <DollarSign size={14} color="#fbbf24" />
                Budget: {formatCurrency(budgetNum)}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button className="btn btn-primary btn-md" onClick={() => setActivePage('trip-dashboard')}>
                Open Trip Dashboard <ArrowRight size={14} />
              </button>
              <button className="btn btn-secondary btn-md" onClick={() => setActivePage('itinerary')}>
                View Itinerary
              </button>
            </div>
          </div>

          {/* Quick Snapshot Metrics */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(12px)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px 20px',
            minWidth: '240px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 600 }}>ESTIMATED COST</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: isEstOver ? '#fbbf24' : '#93c5fd' }}>
                {formatCurrency(estCostNum)}
              </div>
              <div style={{ fontSize: '0.72rem', color: isEstOver ? '#f59e0b' : '#34d399', fontWeight: 600 }}>
                {isEstOver ? `+${formatCurrency(variance)} over budget` : 'Within planned budget'}
              </div>
            </div>

            <div style={{ height: '1px', background: 'var(--border)' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 600 }}>TRANSPORT</div>
                <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#fff' }}>
                  {activeTrip.transport_type || 'Car'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 600 }}>STAY</div>
                <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#fff' }}>
                  {activeTrip.accommodation_type || 'Standard'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Quick Action Launcher */}
      <div className="grid-3">
        <div 
          className="glass-card glass-card-interactive" 
          onClick={() => setActivePage('create-trip')}
          style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '18px' }}
        >
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'rgba(59, 130, 246, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#60a5fa',
            flexShrink: 0
          }}>
            <Plus size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#fff', margin: 0 }}>Create New Trip</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
              Multi-day itineraries with ML cost forecasts
            </p>
          </div>
        </div>

        <div 
          className="glass-card glass-card-interactive" 
          onClick={() => setActivePage('search')}
          style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '18px' }}
        >
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'rgba(236, 72, 153, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#f472b6',
            flexShrink: 0
          }}>
            <Compass size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#fff', margin: 0 }}>Explore Sights</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
              Discover curated tourist attractions & landmarks
            </p>
          </div>
        </div>

        <div 
          className="glass-card glass-card-interactive" 
          onClick={() => setActivePage('assistant')}
          style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '18px' }}
        >
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'rgba(168, 85, 247, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#c084fc',
            flexShrink: 0
          }}>
            <Bot size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#fff', margin: 0 }}>AI Tourist Assistant</h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
              Ask intelligent questions & get packing tips
            </p>
          </div>
        </div>
      </div>

      {/* 3. Core Travel Modules Grid */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
            Intelligent Travel Engines
          </h2>
        </div>

        <div className="grid-3">
          <div className="glass-card glass-card-interactive" onClick={() => setActivePage('cost-prediction')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <div style={{
                padding: '8px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(59, 130, 246, 0.12)',
                color: '#60a5fa'
              }}>
                <TrendingUp size={20} />
              </div>
              <div>
                <h4 style={{ fontSize: '0.94rem', fontWeight: 700 }}>ML Cost Predictor</h4>
                <span className="badge badge-info" style={{ fontSize: '0.66rem' }}>Regression Model</span>
              </div>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
              Forecasts trip budget across transit, accommodation, and food based on distance and traveler headcount.
            </p>
          </div>

          <div className="glass-card glass-card-interactive" onClick={() => setActivePage('map')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <div style={{
                padding: '8px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(16, 185, 129, 0.12)',
                color: '#34d399'
              }}>
                <Navigation size={20} />
              </div>
              <div>
                <h4 style={{ fontSize: '0.94rem', fontWeight: 700 }}>Interactive Map & Routes</h4>
                <span className="badge badge-success" style={{ fontSize: '0.66rem' }}>GPS Routing</span>
              </div>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
              Visualize destination sights, route coordinates, and nearest-neighbor route order to avoid backtracking.
            </p>
          </div>

          <div className="glass-card glass-card-interactive" onClick={() => setActivePage('weather')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <div style={{
                padding: '8px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(245, 158, 11, 0.12)',
                color: '#fbbf24'
              }}>
                <CloudSun size={20} />
              </div>
              <div>
                <h4 style={{ fontSize: '0.94rem', fontWeight: 700 }}>Weather-Aware Engine</h4>
                <span className="badge badge-warning" style={{ fontSize: '0.66rem' }}>Smart Alternatives</span>
              </div>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
              Live destination weather monitoring with automatic indoor recommendations in case of adverse rain.
            </p>
          </div>
        </div>
      </div>

      {/* 4. Architecture & Health Card (Subtle & Compact) */}
      <div className="glass-card" style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={17} style={{ color: isApiOnline ? '#10b981' : '#ef4444' }} />
            <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#fff' }}>TripPulse System Health</span>
            <span className={isApiOnline ? 'badge badge-success' : 'badge badge-danger'} style={{ fontSize: '0.7rem' }}>
              {isApiOnline ? 'Backend & SQLite Connected' : 'API Disconnected'}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '16px', fontSize: '0.78rem', color: 'var(--text-dim)' }}>
            <span>FastAPI v{backendStatus?.version || '1.0.0'}</span>
            <span>•</span>
            <span>SQLite Database</span>
            <span>•</span>
            <span>Scikit-Learn ML</span>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
