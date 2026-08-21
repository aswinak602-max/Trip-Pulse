import React from 'react';
import { 
  Compass, 
  Sparkles, 
  ArrowRight, 
  DollarSign, 
  Brain, 
  CloudSun, 
  Map, 
  Users, 
  Bot, 
  CheckCircle2, 
  ShieldCheck, 
  MapPin, 
  Star 
} from 'lucide-react';

export const Welcome = ({ setActivePage }) => {
  const features = [
    {
      icon: DollarSign,
      title: 'ML Cost Predictor',
      badge: 'Multivariate Regression',
      description: 'Accurate budget forecasting trained on real-world travel costs, transport modes, and accommodation tiers.',
      gradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(99, 102, 241, 0.1))',
      color: '#60a5fa'
    },
    {
      icon: Compass,
      title: 'Iconic Sight Discovery',
      badge: 'Curated Catalog',
      description: 'Discover popular tourist attractions, monuments, nature escapes, and hidden gems with multi-category filters.',
      gradient: 'linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(236, 72, 153, 0.1))',
      color: '#c084fc'
    },
    {
      icon: CloudSun,
      title: 'Weather-Aware Alternatives',
      badge: 'Dynamic Substitution',
      description: 'Automated indoor backup plans and smart alerts when unfavorable weather or rain affects outdoor sightseeing.',
      gradient: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(239, 68, 68, 0.1))',
      color: '#fbbf24'
    },
    {
      icon: Map,
      title: 'Interactive Maps & Routing',
      badge: 'Leaflet GIS',
      description: 'Dynamic GPS route visualization, turn-by-turn distance calculations, and real-time place plotting.',
      gradient: 'linear-gradient(135deg, rgba(160, 185, 129, 0.2), rgba(6, 182, 212, 0.1))',
      color: '#34d399'
    },
    {
      icon: Users,
      title: 'Group Members & Expense Split',
      badge: 'Collaboration',
      description: 'Collaborative itinerary sharing, ticket reservations, and transparent per-member cost splitting.',
      gradient: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.1))',
      color: '#818cf8'
    },
    {
      icon: Bot,
      title: 'AI Tourist Assistant',
      badge: 'Context-Aware Chat',
      description: 'On-demand intelligent concierge providing local cultural tips, hidden gems, emergency info, and dining guides.',
      gradient: 'linear-gradient(135deg, rgba(236, 72, 153, 0.2), rgba(239, 68, 68, 0.1))',
      color: '#f472b6'
    },
  ];

  const popularDestinations = [
    {
      name: 'Ooty',
      state: 'Tamil Nadu',
      tag: 'Nilgiri Hills',
      rating: 4.8,
      image: 'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=600&q=80',
      places: 'Botanical Garden, Doddabetta, Avalanche'
    },
    {
      name: 'Madurai',
      state: 'Tamil Nadu',
      tag: 'Temple City',
      rating: 4.9,
      image: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=600&q=80',
      places: 'Meenakshi Amman Temple, Thirumalai Nayakkar'
    },
    {
      name: 'Kanyakumari',
      state: 'Tamil Nadu',
      tag: 'Southern Tip',
      rating: 4.8,
      image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
      places: 'Vivekananda Rock, Thiruvalluvar Statue'
    },
    {
      name: 'Thanjavur',
      state: 'Tamil Nadu',
      tag: 'Chola Heritage',
      rating: 4.9,
      image: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=600&q=80',
      places: 'Brihadeeswara Temple, Maratha Palace'
    }
  ];

  return (
    <div style={{
      maxWidth: '1280px',
      margin: '0 auto',
      padding: '20px 0 60px 0',
      display: 'flex',
      flexDirection: 'column',
      gap: '48px'
    }}>
      {/* Hero Welcome Section */}
      <div className="glass-card" style={{
        position: 'relative',
        overflow: 'hidden',
        padding: '56px 40px',
        background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.4) 0%, rgba(88, 28, 135, 0.3) 50%, rgba(17, 24, 39, 0.95) 100%)',
        border: '1px solid rgba(99, 102, 241, 0.35)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)'
      }}>
        {/* Background glow circle */}
        <div style={{
          position: 'absolute',
          top: '-60px',
          right: '-60px',
          width: '360px',
          height: '360px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, rgba(0, 0, 0, 0) 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{ maxWidth: '820px', position: 'relative', zIndex: 2 }}>
          {/* Logo & Badge Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'var(--accent-gradient)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(99, 102, 241, 0.4)'
            }}>
              <Compass size={26} color="#fff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  fontSize: '1.4rem',
                  fontWeight: 900,
                  background: 'linear-gradient(to right, #ffffff, #93c5fd)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '-0.02em'
                }}>
                  TripPulse
                </span>
                <span style={{
                  fontSize: '0.72rem',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  background: 'rgba(99, 102, 241, 0.25)',
                  color: '#a5b4fc',
                  fontWeight: 800,
                  border: '1px solid rgba(99, 102, 241, 0.4)'
                }}>
                  AI • ML
                </span>
              </div>
            </div>
          </div>

          <h1 style={{
            fontSize: '2.8rem',
            fontWeight: 900,
            lineHeight: 1.15,
            color: '#fff',
            marginBottom: '18px',
            letterSpacing: '-0.02em'
          }}>
            AI-Powered Intelligent Trip Planner
          </h1>

          <p style={{
            fontSize: '1.12rem',
            color: '#cbd5e1',
            lineHeight: 1.65,
            marginBottom: '32px',
            maxWidth: '740px'
          }}>
            Plan smarter trips with AI-powered recommendations, cost prediction, weather-aware alternatives, maps, reservations and an AI tourist assistant.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
            <button
              className="btn btn-primary btn-lg"
              onClick={() => setActivePage('login')}
              style={{ padding: '14px 32px', fontSize: '1.05rem', fontWeight: 700 }}
            >
              Get Started <ArrowRight size={18} />
            </button>
            <button
              className="btn btn-secondary btn-lg"
              onClick={() => setActivePage('login')}
              style={{ padding: '14px 28px', fontSize: '1.05rem' }}
            >
              Sign In
            </button>
          </div>
        </div>
      </div>

      {/* Highlights / Features Grid */}
      <div>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <span className="badge badge-info" style={{ marginBottom: '10px' }}>
            <Sparkles size={13} /> Complete Travel Intelligence Suite
          </span>
          <h2 style={{ fontSize: '1.9rem', fontWeight: 800, color: '#fff', marginTop: '6px' }}>
            Everything You Need for Seamless Journeys
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '6px' }}>
            Powered by advanced Machine Learning algorithms, real-time datasets, and interactive tools.
          </p>
        </div>

        <div className="grid-3">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div 
                key={idx} 
                className="glass-card glass-card-interactive" 
                onClick={() => setActivePage('login')}
                style={{
                  background: feat.gradient,
                  border: '1px solid var(--border)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  padding: '28px 24px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: 'rgba(17, 24, 39, 0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: `1px solid ${feat.color}40`
                  }}>
                    <Icon size={22} color={feat.color} />
                  </div>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '4px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    color: feat.color,
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    {feat.badge}
                  </span>
                </div>

                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', marginBottom: '6px' }}>
                    {feat.title}
                  </h3>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
                    {feat.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Popular Destination Explorer Spotlight */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <span className="badge badge-success" style={{ marginBottom: '8px' }}>
              <MapPin size={13} /> Destination Catalog
            </span>
            <h2 style={{ fontSize: '1.7rem', fontWeight: 800, color: '#fff', marginTop: '6px' }}>
              Explore Featured Destinations
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
              Browse heritage monuments, hill stations, temples, and coastal getaways.
            </p>
          </div>
          <button className="btn btn-secondary" onClick={() => setActivePage('login')}>
            Sign In to Explore All <ArrowRight size={16} />
          </button>
        </div>

        <div className="grid-4">
          {popularDestinations.map((dest, i) => (
            <div 
              key={i} 
              className="glass-card glass-card-interactive" 
              onClick={() => setActivePage('login')}
              style={{
                padding: '0',
                overflow: 'hidden',
                border: '1px solid var(--border)'
              }}
            >
              <div style={{ position: 'relative', height: '160px' }}>
                <img
                  src={dest.image}
                  alt={dest.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, rgba(11, 15, 25, 0.9) 0%, rgba(11, 15, 25, 0.1) 60%)'
                }} />
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-full)',
                  background: 'rgba(0, 0, 0, 0.65)',
                  backdropFilter: 'blur(8px)',
                  color: '#fbbf24',
                  fontSize: '0.78rem',
                  fontWeight: 700
                }}>
                  <Star size={12} fill="#fbbf24" /> {dest.rating}
                </div>
                <div style={{ position: 'absolute', bottom: '10px', left: '14px' }}>
                  <span style={{
                    fontSize: '0.72rem',
                    color: '#93c5fd',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em'
                  }}>
                    {dest.state} • {dest.tag}
                  </span>
                  <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                    {dest.name}
                  </h4>
                </div>
              </div>
              <div style={{ padding: '14px 16px' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  <strong>Key sights:</strong> {dest.places}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Call to Action Card */}
      <div className="glass-card" style={{
        padding: '36px 32px',
        textAlign: 'center',
        background: 'linear-gradient(135deg, rgba(17, 24, 39, 0.9), rgba(30, 58, 138, 0.3))',
        border: '1px solid rgba(59, 130, 246, 0.3)'
      }}>
        <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', marginBottom: '10px' }}>
          Ready to plan your next adventure?
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '600px', margin: '0 auto 24px auto' }}>
          Sign in or create an account to access custom itineraries, live weather tracking, ML cost optimization, and group collaboration.
        </p>
        <div style={{ display: 'inline-flex', gap: '14px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button className="btn btn-primary btn-lg" onClick={() => setActivePage('login')}>
            Get Started <ArrowRight size={18} />
          </button>
          <button className="btn btn-secondary btn-lg" onClick={() => setActivePage('login')}>
            Sign In to Existing Account
          </button>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
