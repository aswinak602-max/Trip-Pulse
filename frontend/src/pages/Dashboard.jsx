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
  ShieldCheck,
  Heart,
  Layers,
  Star,
  Clock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { 
  formatCurrency, 
  formatDateRange, 
  formatCity, 
  formatTripTitle, 
  getDestinationImage 
} from '../utils/formatters';

export const Dashboard = ({ backendStatus, loadingStatus, setActivePage, activeTrip }) => {
  const { user } = useAuth();
  const isApiOnline = backendStatus?.status === 'online' || backendStatus?.status === 'ok' || backendStatus?.success === true;
  
  // Greeting based on time of day
  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const userName = user?.name ? user.name.split(' ')[0] : 'Traveler';

  const formattedTripTitle = formatTripTitle(activeTrip);
  const formattedDest = formatCity(activeTrip?.destination || 'Ooty');
  const formattedOrigin = formatCity(activeTrip?.current_location || 'Chennai');
  const tripImage = getDestinationImage(activeTrip?.destination || 'Ooty');

  const budgetNum = Number(activeTrip?.budget) || 15000;
  const estCostNum = Number(activeTrip?.estimated_cost) || 17340;
  const membersCountNum = Math.max(1, Number(activeTrip?.members_count) || 2);
  const isEstOver = estCostNum > budgetNum;
  const variance = estCostNum - budgetNum;

  // 4 Statistics Cards
  const stats = [
    { label: 'Trips Planned', value: '4', icon: Calendar, color: '#0FA3B1', bg: 'rgba(15, 163, 177, 0.12)' },
    { label: 'Destinations Explored', value: '12', icon: MapPin, color: '#FF6B6B', bg: 'rgba(255, 107, 107, 0.12)' },
    { label: 'Saved Places', value: '18', icon: Heart, color: '#F4C95D', bg: 'rgba(244, 201, 93, 0.15)' },
    { label: 'AI Plans Generated', value: '9', icon: Bot, color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)' },
  ];

  // AI Recommended Destinations
  const aiRecommendations = [
    {
      name: 'Ooty',
      tag: 'Nilgiri Hills',
      image: 'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=500&q=80',
      reason: 'Perfect 21°C weather match for your adventure preference',
      rating: 4.8
    },
    {
      name: 'Madurai',
      tag: 'Temple City',
      image: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=500&q=80',
      reason: 'Rich cultural architecture and iconic heritage monuments',
      rating: 4.9
    },
    {
      name: 'Kanyakumari',
      tag: 'Southern Coast',
      image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=500&q=80',
      reason: 'Coastal sunset views and historic seaside memorials',
      rating: 4.8
    }
  ];

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* =======================================================================
          Top Greeting Header
          ======================================================================= */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="badge badge-teal">
              <Sparkles size={11} /> AI Travel Hub
            </span>
          </div>
          <h1 style={{ fontSize: '2.1rem', fontWeight: 900, color: 'var(--text-main)', letterSpacing: '-0.025em', margin: 0 }}>
            {timeGreeting}, {userName} 👋
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.96rem', marginTop: '4px', margin: 0 }}>
            Here is your real-time travel overview, AI recommendations, and upcoming itinerary status.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary btn-md" onClick={() => setActivePage('search')}>
            <MapPin size={16} /> Explore Sights
          </button>
          <button className="btn btn-primary btn-md" onClick={() => setActivePage('create-trip')}>
            <Plus size={16} /> Plan New Trip
          </button>
        </div>
      </div>

      {/* =======================================================================
          4 Statistics Cards (Trips Planned, Destinations, Saved Places, AI Plans)
          ======================================================================= */}
      <div className="grid-4">
        {stats.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="stats-card glass-card-interactive" onClick={() => setActivePage(idx === 0 ? 'trip-dashboard' : idx === 1 ? 'search' : idx === 2 ? 'search' : 'assistant')}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: item.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: item.color,
                flexShrink: 0
              }}>
                <Icon size={22} />
              </div>
              <div>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-main)', lineHeight: 1.1 }}>
                  {item.value}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '3px' }}>
                  {item.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* =======================================================================
          Upcoming Trip Spotlight Hero
          ======================================================================= */}
      {activeTrip && (
        <div style={{
          position: 'relative',
          borderRadius: 'var(--radius-xl)',
          overflow: 'hidden',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-md)',
          padding: '36px 36px',
          background: `linear-gradient(to right, rgba(11, 19, 43, 0.95) 0%, rgba(11, 19, 43, 0.82) 55%, rgba(11, 19, 43, 0.4) 100%), url(${tripImage}) center/cover no-repeat`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '24px'
        }}>
          <div style={{ maxWidth: '640px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <span className="badge badge-teal">
                <Sparkles size={11} /> UPCOMING TRIP
              </span>
              <span className="badge badge-coral">
                {formattedOrigin} → {formattedDest}
              </span>
            </div>

            <h2 style={{
              fontSize: '1.9rem',
              fontWeight: 900,
              color: '#FFFFFF',
              marginBottom: '10px',
              letterSpacing: '-0.02em'
            }}>
              {formattedTripTitle}
            </h2>

            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', color: 'rgba(255, 255, 255, 0.88)', fontSize: '0.9rem', flexWrap: 'wrap', marginBottom: '22px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar size={15} color="#93C5FD" />
                {formatDateRange(activeTrip.start_date, activeTrip.end_date, activeTrip.days_count)}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Users size={15} color="#34D399" />
                {membersCountNum} {membersCountNum === 1 ? 'traveler' : 'travelers'}
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <DollarSign size={15} color="#F4C95D" />
                Target Budget: {formatCurrency(budgetNum)}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button className="btn btn-primary btn-md" onClick={() => setActivePage('trip-dashboard')}>
                <span>Open Trip Dashboard</span>
                <ArrowRight size={15} />
              </button>
              <button 
                className="btn btn-secondary btn-md" 
                onClick={() => setActivePage('itinerary')}
                style={{ background: 'rgba(255, 255, 255, 0.12)', color: '#FFFFFF', borderColor: 'rgba(255, 255, 255, 0.25)' }}
              >
                <span>View Timeline Plan</span>
              </button>
            </div>
          </div>

          {/* Quick Snapshot Metrics Card */}
          <div style={{
            background: 'rgba(15, 27, 45, 0.85)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px 24px',
            minWidth: '260px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div>
              <div style={{ fontSize: '0.74rem', color: '#94A3B8', fontWeight: 700, letterSpacing: '0.04em' }}>ESTIMATED ML COST</div>
              <div style={{ fontSize: '1.45rem', fontWeight: 900, color: isEstOver ? '#F4C95D' : '#34D399' }}>
                {formatCurrency(estCostNum)}
              </div>
              <div style={{ fontSize: '0.76rem', color: isEstOver ? '#F59E0B' : '#34D399', fontWeight: 600, marginTop: '2px' }}>
                {isEstOver ? `+${formatCurrency(variance)} over target` : '✓ Within planned target budget'}
              </div>
            </div>

            <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 700 }}>TRANSPORT</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#FFFFFF' }}>
                  {activeTrip.transport_type || 'Car'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 700 }}>ACCOMMODATION</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#FFFFFF' }}>
                  {activeTrip.accommodation_type || 'Standard'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================================
          AI Recommendations Section
          ======================================================================= */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div>
            <span className="badge badge-coral" style={{ marginBottom: '4px' }}>
              <Bot size={12} /> Personalized
            </span>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', margin: '4px 0 0 0' }}>
              AI Recommendations for You
            </h2>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => setActivePage('search')}>
            View all destinations <ChevronRight size={14} />
          </button>
        </div>

        <div className="grid-3">
          {aiRecommendations.map((item, idx) => (
            <div 
              key={idx} 
              className="travel-card glass-card-interactive"
              onClick={() => setActivePage('search')}
              style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
            >
              <div style={{ height: '150px', position: 'relative', overflow: 'hidden' }}>
                <img src={item.image} alt={item.name} className="travel-card-img" />
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, rgba(11, 19, 43, 0.8) 0%, transparent 60%)'
                }} />
                <div style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  padding: '3px 8px',
                  background: 'rgba(0, 0, 0, 0.65)',
                  backdropFilter: 'blur(6px)',
                  borderRadius: 'var(--radius-full)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  color: '#F4C95D'
                }}>
                  <Star size={11} fill="#F4C95D" stroke="none" />
                  <span>{item.rating}</span>
                </div>
                <div style={{ position: 'absolute', bottom: '10px', left: '14px' }}>
                  <div style={{ fontSize: '0.72rem', color: '#93C5FD', fontWeight: 600 }}>{item.tag}</div>
                  <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>{item.name}</h4>
                </div>
              </div>

              <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                  <Sparkles size={13} color="var(--primary)" style={{ display: 'inline', marginRight: '5px' }} />
                  {item.reason}
                </p>
                <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontWeight: 600 }}>Suggested Stop</span>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--primary)' }}>Explore</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* =======================================================================
          Intelligent Travel Engines Quick Access
          ======================================================================= */}
      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '16px' }}>
          Explore Travel Engines
        </h2>

        <div className="grid-3">
          <div className="glass-card glass-card-interactive" onClick={() => setActivePage('cost-prediction')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
              <div style={{
                padding: '10px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(15, 163, 177, 0.12)',
                color: 'var(--secondary-teal)'
              }}>
                <TrendingUp size={22} />
              </div>
              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)' }}>ML Cost Predictor</h4>
                <span className="badge badge-teal" style={{ fontSize: '0.68rem' }}>Regression Model</span>
              </div>
            </div>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
              Forecasts overall trip expenses across transport, stay, and meals with instant budget variance tracking.
            </p>
          </div>

          <div className="glass-card glass-card-interactive" onClick={() => setActivePage('map')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
              <div style={{
                padding: '10px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(16, 185, 129, 0.12)',
                color: 'var(--success)'
              }}>
                <Navigation size={22} />
              </div>
              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)' }}>Interactive Map & Routes</h4>
                <span className="badge badge-success" style={{ fontSize: '0.68rem' }}>GPS Routing</span>
              </div>
            </div>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
              Visualize destination sights, route coordinates, and nearest-neighbor route order to avoid backtracking.
            </p>
          </div>

          <div className="glass-card glass-card-interactive" onClick={() => setActivePage('weather')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
              <div style={{
                padding: '10px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(244, 201, 93, 0.18)',
                color: '#B45309'
              }}>
                <CloudSun size={22} />
              </div>
              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)' }}>Weather-Aware Engine</h4>
                <span className="badge badge-gold" style={{ fontSize: '0.68rem' }}>Smart Substitution</span>
              </div>
            </div>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
              Live destination weather monitoring with automatic indoor recommendations in case of adverse rain.
            </p>
          </div>
        </div>
      </div>

      {/* =======================================================================
          System Health Status
          ======================================================================= */}
      <div className="glass-card" style={{ padding: '16px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Activity size={18} style={{ color: isApiOnline ? 'var(--success)' : 'var(--danger)' }} />
            <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-main)' }}>TripPulse System Health</span>
            <span className={isApiOnline ? 'badge badge-success' : 'badge badge-danger'} style={{ fontSize: '0.72rem' }}>
              {isApiOnline ? 'API & SQLite Connected' : 'API Disconnected'}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
            <span>FastAPI v{backendStatus?.version || '1.0.0'}</span>
            <span>•</span>
            <span>SQLite DB</span>
            <span>•</span>
            <span>Scikit-Learn ML</span>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
