import React, { useState, useEffect } from 'react';
import { 
  Ticket, 
  Hotel, 
  Car, 
  Utensils, 
  Plane, 
  Train, 
  Bus, 
  FileText, 
  Plus, 
  Trash2, 
  ExternalLink,
  MapPin,
  Search,
  CheckCircle,
  ShieldCheck,
  BookmarkPlus,
  Clock,
  Sparkles
} from 'lucide-react';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import Pagination from '../components/Pagination';

const BOOKING_CATEGORIES = [
  { id: 'Hotels', label: 'Hotels', icon: Hotel },
  { id: 'Dining', label: 'Dining', icon: Utensils },
  { id: 'Flights', label: 'Flights', icon: Plane },
  { id: 'Trains', label: 'Trains', icon: Train },
  { id: 'Bus', label: 'Bus', icon: Bus },
  { id: 'Rental Cars', label: 'Rental Cars', icon: Car }
];

export const ReservationsPage = ({ trip }) => {
  const defaultDestination = trip?.destination || 'Ooty';
  const tripId = trip?.id || 1;

  const [destinationInput, setDestinationInput] = useState(defaultDestination);
  const [activeCategory, setActiveCategory] = useState('Hotels');
  const [providers, setProviders] = useState([]);
  const [savedReservations, setSavedReservations] = useState([]);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [searchSuccessNotice, setSearchSuccessNotice] = useState('');

  // Pagination states (5 items per page)
  const [providersPage, setProvidersPage] = useState(1);
  const [savedPage, setSavedPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  // Fetch verified booking providers for the destination & category
  const fetchProviders = async (dest, cat) => {
    try {
      setLoadingProviders(true);
      const res = await api.get(`/reservations/providers?destination=${encodeURIComponent(dest || 'Ooty')}&type=${encodeURIComponent(cat || 'Hotels')}`);
      if (res.success && res.data?.providers) {
        setProviders(res.data.providers);
      } else {
        setProviders([]);
      }
    } catch (err) {
      console.error('Error fetching booking providers:', err);
      setProviders([]);
    } finally {
      setLoadingProviders(false);
    }
  };

  // Fetch saved reservation records from database
  const fetchSavedReservations = async () => {
    try {
      setLoadingSaved(true);
      const res = await api.get(`/reservations/${tripId}`);
      if (res.success && res.data) {
        setSavedReservations(res.data);
      }
    } catch (err) {
      console.error('Error fetching saved reservations:', err);
    } finally {
      setLoadingSaved(false);
    }
  };

  useEffect(() => {
    fetchProviders(destinationInput, activeCategory);
    fetchSavedReservations();
  }, [activeCategory, tripId]);

  const handleDestinationSearch = (e) => {
    e.preventDefault();
    fetchProviders(destinationInput, activeCategory);
  };

  const handleVisitOfficialWebsite = (url) => {
    if (url && url.startsWith('http')) {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      alert('Official booking website unavailable.');
    }
  };

  const handleSaveToTripRecords = async (provider) => {
    try {
      const res = await api.post('/reservations', {
        trip_id: tripId,
        type: provider.type,
        title: `${provider.name} - ${destinationInput.trim() || 'Trip'} Booking`,
        provider: provider.name,
        booking_reference: '',
        date: trip?.start_date || new Date().toISOString().split('T')[0],
        time: '12:00 PM',
        address: `${destinationInput.trim() || 'Destination'} Center`,
        cost: 0,
        notes: `Saved official provider link: ${provider.official_url}`,
        attachment_url: provider.official_url
      });
      if (res.success) {
        setSearchSuccessNotice(`✓ Saved ${provider.name} provider record to your trip itinerary!`);
        setTimeout(() => setSearchSuccessNotice(''), 4000);
        fetchSavedReservations();
      }
    } catch (err) {
      alert(err.message || 'Failed to save reservation record.');
    }
  };

  const handleDeleteSaved = async (id) => {
    try {
      const res = await api.delete(`/reservations/${id}`);
      if (res.success) {
        setSavedReservations(prev => prev.filter(r => r.id !== id));
      }
    } catch (err) {
      alert(err.message || 'Failed to delete record.');
    }
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header Banner */}
      <div className="glass-card" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.45) 0%, rgba(17, 24, 39, 0.9) 100%)',
        padding: '26px 32px',
        border: '1px solid rgba(99, 102, 241, 0.3)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="badge badge-info">
              <Ticket size={12} /> Verified Travel Provider Gateway
            </span>
            <span className="badge badge-success">
              Destination: {destinationInput}
            </span>
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', margin: 0 }}>
            Destination-Based Booking Discovery
          </h1>
          <p style={{ color: '#cbd5e1', fontSize: '0.9rem', marginTop: '6px', margin: 0 }}>
            Discover and book verified official providers for hotels, dining, flights, trains, buses, and rental cars worldwide.
          </p>
        </div>
      </div>

      {searchSuccessNotice && (
        <div style={{
          padding: '12px 16px',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          color: '#34d399',
          fontSize: '0.88rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CheckCircle size={16} /> {searchSuccessNotice}
        </div>
      )}

      {/* Destination & Category Selector Controls */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <form onSubmit={handleDestinationSearch} style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center', marginBottom: '18px' }}>
          <div style={{ flex: '1 1 280px' }}>
            <label className="form-label" style={{ fontSize: '0.78rem', marginBottom: '4px' }}>Target Destination</label>
            <div style={{ position: 'relative' }}>
              <MapPin size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#60a5fa' }} />
              <input 
                type="text" 
                className="form-input"
                style={{ paddingLeft: '36px' }}
                value={destinationInput}
                onChange={(e) => setDestinationInput(e.target.value)}
                placeholder="e.g. Ooty, Paris, Tokyo, Chennai, Mumbai"
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary"
            style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Search size={15} /> Find Providers
          </button>
        </form>

        {/* Category Pills */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {BOOKING_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                className={`btn ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveCategory(cat.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  borderRadius: 'var(--radius-full)',
                  padding: '9px 18px',
                  fontSize: '0.88rem',
                  fontWeight: isSelected ? 700 : 500
                }}
              >
                <Icon size={16} />
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Verified Provider Cards Grid */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={20} color="#34d399" />
            Verified {activeCategory} Providers for {destinationInput}
          </h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
            Official Booking Platforms • Direct Redirection
          </span>
        </div>

        {loadingProviders ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '60px 0' }}>
            <LoadingSpinner text={`Discovering official ${activeCategory} providers for ${destinationInput}...`} />
          </div>
        ) : providers.length === 0 ? (
          <div className="glass-card" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
            Official booking website unavailable for this category.
          </div>
        ) : (
          <div>
            <div className="grid-2" style={{ gap: '18px' }}>
              {providers.slice((providersPage - 1) * ITEMS_PER_PAGE, providersPage * ITEMS_PER_PAGE).map((p, idx) => (
                <div 
                  key={idx} 
                  className="glass-card" 
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    padding: '22px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    background: 'rgba(17, 24, 39, 0.85)'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <span className="badge badge-info">{p.type || activeCategory}</span>
                      <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>
                        {p.badge || 'Verified Partner'}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', marginBottom: '6px' }}>
                      {p.name}
                    </h3>

                    <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '16px' }}>
                      {p.description}
                    </p>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '14px', gap: '10px' }}>
                    <button 
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleSaveToTripRecords(p)}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}
                      title="Save this provider reference to your trip records"
                    >
                      <BookmarkPlus size={14} /> Save Record
                    </button>

                    <button 
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => handleVisitOfficialWebsite(p.official_url)}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', padding: '8px 14px' }}
                    >
                      <ExternalLink size={14} /> Visit Official Website
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Providers 5-items Pagination */}
            <Pagination
              currentPage={providersPage}
              totalPages={Math.ceil(providers.length / ITEMS_PER_PAGE)}
              onPageChange={(p) => setProvidersPage(p)}
              totalItems={providers.length}
              itemsPerPage={ITEMS_PER_PAGE}
              itemName="booking providers"
            />
          </div>
        )}
      </div>

      {/* Saved Database Reservation Records Section */}
      <div className="glass-card" style={{ marginTop: '12px', border: '1px solid rgba(59, 130, 246, 0.25)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', margin: 0 }}>
              Saved Trip Reservation Records
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '2px', margin: 0 }}>
              Database-backed records for this trip ({savedReservations.length} saved).
            </p>
          </div>
        </div>

        {loadingSaved ? (
          <div style={{ textAlign: 'center', padding: '30px 0' }}>
            <LoadingSpinner text="Loading saved records..." />
          </div>
        ) : savedReservations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 20px', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            No saved reservation records yet. Click <strong>Save Record</strong> on any provider above to track your booking links.
          </div>
        ) : (
          <div>
            <div className="grid-2" style={{ gap: '14px' }}>
              {savedReservations.slice((savedPage - 1) * ITEMS_PER_PAGE, savedPage * ITEMS_PER_PAGE).map((res) => (
                <div 
                  key={res.id} 
                  style={{
                    padding: '16px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>{res.service_type || res.type}</span>
                      <strong style={{ color: '#fff', fontSize: '0.95rem' }}>{res.provider_name || res.provider}</strong>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {res.title}
                    </div>
                    {res.official_url && (
                      <div style={{ fontSize: '0.75rem', color: '#60a5fa', marginTop: '4px' }}>
                        {res.official_url}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {res.official_url && (
                      <button 
                        type="button" 
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleVisitOfficialWebsite(res.official_url)}
                        style={{ padding: '6px 10px', color: '#60a5fa' }}
                      >
                        <ExternalLink size={13} /> Open
                      </button>
                    )}
                    <button 
                      type="button" 
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDeleteSaved(res.id)}
                      style={{ padding: '6px 8px' }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Saved Records 5-items Pagination */}
            <Pagination
              currentPage={savedPage}
              totalPages={Math.ceil(savedReservations.length / ITEMS_PER_PAGE)}
              onPageChange={(p) => setSavedPage(p)}
              totalItems={savedReservations.length}
              itemsPerPage={ITEMS_PER_PAGE}
              itemName="saved records"
            />
          </div>
        )}
      </div>

    </div>
  );
};

export default ReservationsPage;
