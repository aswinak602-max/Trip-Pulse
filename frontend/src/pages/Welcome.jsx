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
  Star,
  Plane,
  Building2,
  Calendar,
  Check,
  TrendingUp,
  Shield,
  Clock
} from 'lucide-react';

export const Welcome = ({ setActivePage }) => {
  const features = [
    {
      icon: DollarSign,
      title: 'ML Cost Predictor',
      badge: 'Multivariate Regression',
      description: 'Accurate budget forecasting trained on real travel costs, transport modes, and accommodation tiers.',
      badgeType: 'badge-gold',
      color: '#F4C95D'
    },
    {
      icon: Compass,
      title: 'Curated Sight Catalog',
      badge: 'Multi-Category',
      description: 'Discover iconic tourist attractions, monuments, nature escapes, and hidden gems with rich local filters.',
      badgeType: 'badge-teal',
      color: '#0FA3B1'
    },
    {
      icon: CloudSun,
      title: 'Weather-Aware Alternatives',
      badge: 'Smart Substitution',
      description: 'Automated indoor backup plans and smart suggestions when unfavorable rain or heat affects outdoor tours.',
      badgeType: 'badge-coral',
      color: '#FF6B6B'
    },
    {
      icon: Map,
      title: 'Interactive Maps & Routing',
      badge: 'GPS & Routes',
      description: 'Dynamic GPS route visualization, turn-by-turn travel distance calculations, and real-time place plotting.',
      badgeType: 'badge-teal',
      color: '#0FA3B1'
    },
    {
      icon: Users,
      title: 'Group Collaboration & Split',
      badge: 'Group Sync',
      description: 'Collaborative itinerary sharing, ticket reservations, and transparent per-member cost splitting.',
      badgeType: 'badge-navy',
      color: '#64748B'
    },
    {
      icon: Bot,
      title: 'AI Tourist Assistant',
      badge: 'Context-Aware',
      description: 'On-demand intelligent concierge providing local cultural tips, hidden spots, and emergency assistance.',
      badgeType: 'badge-coral',
      color: '#FF6B6B'
    },
  ];

  const popularDestinations = [
    {
      name: 'Ooty',
      state: 'Tamil Nadu',
      tag: 'Nilgiri Hills',
      rating: 4.8,
      image: 'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=600&q=80',
      places: 'Botanical Garden, Doddabetta, Avalanche Lake'
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
      padding: '16px 0 60px 0',
      display: 'flex',
      flexDirection: 'column',
      gap: '56px'
    }}>
      {/* =========================================================================
          Hero Section: "Plan Less. Travel More." with Floating Visual Cards
          ========================================================================= */}
      <div className="glass-card" style={{
        position: 'relative',
        overflow: 'hidden',
        padding: '56px 44px',
        background: 'var(--hero-gradient)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-lg)'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.15fr 0.85fr',
          gap: '40px',
          alignItems: 'center'
        }}>
          {/* Left Hero Copy */}
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <span className="badge badge-teal" style={{ padding: '5px 12px', fontSize: '0.8rem' }}>
                <Sparkles size={13} style={{ marginRight: '3px' }} /> AI-Powered Travel Intelligence
              </span>
            </div>

            <h1 style={{
              fontSize: '3.4rem',
              fontWeight: 900,
              lineHeight: 1.12,
              color: 'var(--text-main)',
              marginBottom: '20px',
              letterSpacing: '-0.03em'
            }}>
              Plan Less.<br />
              <span style={{
                background: 'linear-gradient(135deg, #0FA3B1 0%, #FF6B6B 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                Travel More.
              </span>
            </h1>

            <p style={{
              fontSize: '1.16rem',
              color: 'var(--text-muted)',
              lineHeight: 1.6,
              marginBottom: '36px',
              maxWidth: '540px'
            }}>
              Your AI-powered travel companion for smarter planning, personalized itineraries, and unforgettable journeys.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
              <button
                className="btn btn-primary btn-lg"
                onClick={() => setActivePage('create-trip')}
              >
                <span>Plan My Trip</span>
                <ArrowRight size={18} />
              </button>
              <button
                className="btn btn-secondary btn-lg"
                onClick={() => setActivePage('search')}
              >
                <span>Explore Destinations</span>
              </button>
            </div>

            {/* Micro Highlights */}
            <div style={{
              display: 'flex',
              gap: '24px',
              marginTop: '40px',
              paddingTop: '24px',
              borderTop: '1px solid var(--border)',
              flexWrap: 'wrap'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.86rem', color: 'var(--text-muted)' }}>
                <CheckCircle2 size={16} color="var(--secondary-teal)" />
                <span>Instant Itinerary Generator</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.86rem', color: 'var(--text-muted)' }}>
                <CheckCircle2 size={16} color="var(--secondary-teal)" />
                <span>Real-Time Weather Fallback</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.86rem', color: 'var(--secondary-teal)' }}>
                <CheckCircle2 size={16} color="var(--secondary-teal)" />
                <span>ML Budget Optimization</span>
              </div>
            </div>
          </div>

          {/* Right Hero Image + Floating Feature Cards */}
          <div style={{ position: 'relative', minHeight: '420px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* Main Visual Frame */}
            <div style={{
              width: '100%',
              maxWidth: '380px',
              height: '420px',
              borderRadius: 'var(--radius-xl)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-lg)',
              border: '2px solid var(--border)',
              position: 'relative'
            }}>
              <img
                src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=800&q=80"
                alt="Travel Explorer Journey"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to top, rgba(11, 19, 43, 0.7) 0%, rgba(11, 19, 43, 0) 50%)'
              }} />
              <div style={{ position: 'absolute', bottom: '20px', left: '20px', right: '20px', color: '#FFFFFF' }}>
                <span className="badge badge-teal" style={{ marginBottom: '6px' }}>FEATURED ESCAPE</span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Nilgiri Mountain Explorer</h3>
                <p style={{ fontSize: '0.84rem', opacity: 0.9 }}>3 Days • Nature & Photography</p>
              </div>
            </div>

            {/* Floating Card 1: AI Itinerary Generated */}
            <div 
              className="glass-card animate-float"
              style={{
                position: 'absolute',
                top: '10px',
                left: '-20px',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                boxShadow: 'var(--shadow-md)',
                border: '1px solid var(--border)',
                animationDelay: '0s'
              }}
            >
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'var(--cta-gradient)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff'
              }}>
                <Sparkles size={16} />
              </div>
              <div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', fontWeight: 600 }}>AI ITINERARY READY</div>
                <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-main)' }}>8 Activities Optimized</div>
              </div>
            </div>

            {/* Floating Card 2: Flight Suggestion */}
            <div 
              className="glass-card animate-float"
              style={{
                position: 'absolute',
                top: '90px',
                right: '-24px',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                boxShadow: 'var(--shadow-md)',
                border: '1px solid var(--border)',
                animationDelay: '1.5s'
              }}
            >
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'var(--coral-gradient)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff'
              }}>
                <Plane size={16} />
              </div>
              <div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', fontWeight: 600 }}>FASTEST ROUTE</div>
                <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-main)' }}>Scenic Mountain Rail • 4h</div>
              </div>
            </div>

            {/* Floating Card 3: Hotel Recommendation */}
            <div 
              className="glass-card animate-float"
              style={{
                position: 'absolute',
                bottom: '80px',
                left: '-24px',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                boxShadow: 'var(--shadow-md)',
                border: '1px solid var(--border)',
                animationDelay: '2.5s'
              }}
            >
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'var(--gold-gradient)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#0B132B'
              }}>
                <Building2 size={16} />
              </div>
              <div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', fontWeight: 600 }}>STAY MATCH</div>
                <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-main)' }}>Heritage Hill Villa • 4.9 ★</div>
              </div>
            </div>

            {/* Floating Card 4: Weather Information */}
            <div 
              className="glass-card animate-float"
              style={{
                position: 'absolute',
                bottom: '10px',
                right: '-16px',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                boxShadow: 'var(--shadow-md)',
                border: '1px solid var(--border)',
                animationDelay: '3.5s'
              }}
            >
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(15, 163, 177, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--secondary-teal)'
              }}>
                <CloudSun size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', fontWeight: 600 }}>LIVE WEATHER</div>
                <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-main)' }}>21°C • Crisp & Clear</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          Features Grid: Complete Travel Intelligence Suite
          ========================================================================= */}
      <div>
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <span className="badge badge-teal" style={{ marginBottom: '10px' }}>
            <Brain size={13} /> Complete Travel Intelligence Suite
          </span>
          <h2 style={{ fontSize: '2.1rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '8px', letterSpacing: '-0.02em' }}>
            Everything You Need for Seamless Journeys
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginTop: '6px', maxWidth: '600px', margin: '6px auto 0 auto' }}>
            Powered by trained Machine Learning models, live destination catalogs, and collaborative travel tools.
          </p>
        </div>

        <div className="grid-3">
          {features.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div 
                key={idx} 
                className="glass-card glass-card-interactive" 
                onClick={() => setActivePage('create-trip')}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  padding: '28px 24px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '12px',
                    background: `${feat.color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: `1px solid ${feat.color}35`
                  }}>
                    <Icon size={22} color={feat.color} />
                  </div>
                  <span className={`badge ${feat.badgeType}`} style={{ fontSize: '0.72rem' }}>
                    {feat.badge}
                  </span>
                </div>

                <div>
                  <h3 style={{ fontSize: '1.18rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
                    {feat.title}
                  </h3>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.55 }}>
                    {feat.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          Popular Destination Explorer Spotlight
          ========================================================================= */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '28px', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <span className="badge badge-coral" style={{ marginBottom: '8px' }}>
              <MapPin size={13} /> Destination Catalog
            </span>
            <h2 style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '6px' }}>
              Explore Featured Destinations
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              Browse hill stations, historic temples, coastal getaways, and wildlife sanctuaries.
            </p>
          </div>
          <button className="btn btn-secondary" onClick={() => setActivePage('search')}>
            <span>Explore All Places</span>
            <ArrowRight size={16} />
          </button>
        </div>

        <div className="grid-4">
          {popularDestinations.map((dest, i) => (
            <div 
              key={i} 
              className="travel-card glass-card-interactive" 
              onClick={() => setActivePage('search')}
              style={{
                padding: '0',
                cursor: 'pointer'
              }}
            >
              <div style={{ position: 'relative', height: '175px', overflow: 'hidden' }}>
                <img
                  src={dest.image}
                  alt={dest.name}
                  className="travel-card-img"
                />
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, rgba(11, 19, 43, 0.85) 0%, rgba(11, 19, 43, 0.1) 60%)'
                }} />
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '3px 9px',
                  borderRadius: 'var(--radius-full)',
                  background: 'rgba(0, 0, 0, 0.65)',
                  backdropFilter: 'blur(8px)',
                  color: '#F4C95D',
                  fontSize: '0.78rem',
                  fontWeight: 700
                }}>
                  <Star size={12} fill="#F4C95D" /> {dest.rating}
                </div>
                <div style={{ position: 'absolute', bottom: '12px', left: '16px' }}>
                  <span style={{
                    fontSize: '0.72rem',
                    color: '#93C5FD',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em'
                  }}>
                    {dest.state} • {dest.tag}
                  </span>
                  <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                    {dest.name}
                  </h4>
                </div>
              </div>
              <div style={{ padding: '14px 16px' }}>
                <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  <strong style={{ color: 'var(--text-main)' }}>Key sights:</strong> {dest.places}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* =========================================================================
          Bottom Call to Action Banner
          ========================================================================= */}
      <div className="glass-card" style={{
        padding: '48px 36px',
        textAlign: 'center',
        background: 'var(--brand-gradient)',
        color: '#FFFFFF',
        boxShadow: 'var(--shadow-lg)'
      }}>
        <h3 style={{ fontSize: '1.85rem', fontWeight: 900, color: '#FFFFFF', marginBottom: '12px', letterSpacing: '-0.02em' }}>
          Ready to Plan Your Next Adventure?
        </h3>
        <p style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '1.02rem', maxWidth: '620px', margin: '0 auto 28px auto', lineHeight: 1.6 }}>
          Generate custom itineraries in seconds with AI intelligence, live weather tracking, ML cost optimization, and group collaboration.
        </p>
        <div style={{ display: 'inline-flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button className="btn btn-gold btn-lg" onClick={() => setActivePage('create-trip')}>
            <span>Plan Trip with AI</span>
            <ArrowRight size={18} />
          </button>
          <button 
            className="btn btn-secondary btn-lg" 
            onClick={() => setActivePage('login')}
            style={{ background: 'rgba(255, 255, 255, 0.15)', color: '#FFFFFF', borderColor: 'rgba(255, 255, 255, 0.3)' }}
          >
            <span>Sign In to Your Account</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
