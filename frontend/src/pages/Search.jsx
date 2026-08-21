import React, { useState, useEffect } from 'react';
import { Search as SearchIcon, MapPin, Sparkles, SlidersHorizontal, ArrowRight, Compass, Filter } from 'lucide-react';
import api from '../services/api';
import DestinationCard from '../components/DestinationCard';
import PlaceCard from '../components/PlaceCard';
import PlaceDetailsModal from '../components/PlaceDetailsModal';
import LoadingSpinner from '../components/LoadingSpinner';
import Pagination from '../components/Pagination';

const EXAMPLE_CITIES = ['Ooty', 'Chennai', 'Coimbatore', 'Salem', 'Madurai', 'Mysore', 'Kanyakumari', 'Paris'];

const SEARCH_FILTER_OPTIONS = [
  { id: 'all', label: 'All Results' },
  { id: 'cities', label: 'Cities & Destinations' },
  { id: 'places', label: 'Tourist Places' },
  { id: 'attractions', label: 'Attractions' },
  { id: 'nature', label: 'Nature & Parks' },
  { id: 'history', label: 'History & Forts' },
  { id: 'culture', label: 'Culture & Temples' },
  { id: 'adventure', label: 'Adventure & Treks' },
  { id: 'indoor', label: 'Indoor Attractions' },
  { id: 'outdoor', label: 'Outdoor Attractions' }
];

export const Search = ({ 
  searchTerm = '', 
  setSearchTerm, 
  searchFilter = 'all', 
  setSearchFilter, 
  onSelectDestination,
  onSelectDirections,
  onAddToTrip,
  setActivePage 
}) => {
  const [query, setQuery] = useState(searchTerm || '');
  const [filterType, setFilterType] = useState(searchFilter || 'all');
  const [destinations, setDestinations] = useState([]);
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTag, setSelectedTag] = useState('All');
  const [selectedModalPlace, setSelectedModalPlace] = useState(null);

  // Autocomplete suggestions state
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Pagination states (5 items per page)
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const tags = ['All', 'Hill Station', 'Nature', 'Beach', 'Culture', 'Temples', 'Heritage'];

  // Keep parent state in sync if provided
  useEffect(() => {
    if (searchTerm !== undefined && searchTerm !== query) {
      setQuery(searchTerm);
    }
  }, [searchTerm]);

  useEffect(() => {
    if (searchFilter !== undefined && searchFilter !== filterType) {
      setFilterType(searchFilter);
    }
  }, [searchFilter]);

  // Fetch dynamic suggestions on query change
  useEffect(() => {
    const clean = (query || '').trim();
    if (clean.length === 0) {
      setSuggestions([]);
      setShowSuggestions(false);
      setActiveSuggestionIndex(-1);
      return;
    }

    let isMounted = true;
    const fetchSuggestions = async () => {
      try {
        setLoadingSuggestions(true);
        const res = await api.get(`/places/autocomplete?q=${encodeURIComponent(clean)}&limit=8`);
        if (isMounted && res.success && Array.isArray(res.data)) {
          setSuggestions(res.data);
          setShowSuggestions(res.data.length > 0);
          setActiveSuggestionIndex(-1);
        }
      } catch (err) {
        console.warn('Error fetching autocomplete suggestions:', err);
      } finally {
        if (isMounted) setLoadingSuggestions(false);
      }
    };

    const timer = setTimeout(fetchSuggestions, 120);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [query]);

  const executeSearch = async (term = '', filter = 'all') => {
    try {
      setLoading(true);
      setError('');
      setCurrentPage(1);
      setShowSuggestions(false);

      const cleanTerm = (term || '').trim();
      const cleanFilter = filter.toLowerCase();

      // 1. Fetch cities if filter is 'all' or 'cities'
      let destResults = [];
      if (cleanFilter === 'all' || cleanFilter === 'cities') {
        const res = await api.get(`/destinations/search${cleanTerm ? `?query=${encodeURIComponent(cleanTerm)}` : ''}`);
        if (res.success && Array.isArray(res.data)) {
          destResults = res.data;
        }
      }

      // 2. Fetch tourist places if filter is 'all' or specific place categories
      let placeResults = [];
      if (cleanFilter !== 'cities') {
        const placeRes = await api.get(`/places/search?query=${encodeURIComponent(cleanTerm)}&filter_type=${encodeURIComponent(cleanFilter)}`);
        if (placeRes.success && Array.isArray(placeRes.data)) {
          // Deduplicate places by name
          const seen = new Set();
          placeResults = placeRes.data.filter(p => {
            const key = (p.name || '').trim().toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });
        }
      }

      setDestinations(destResults);
      setPlaces(placeResults);
    } catch (err) {
      setError(err.message || 'Failed to execute search.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    executeSearch(query, filterType);
  }, [filterType]);

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    setShowSuggestions(false);
    if (setSearchTerm) setSearchTerm(query);
    executeSearch(query, filterType);
  };

  const handleSelectSuggestion = (item) => {
    const selectedName = item.name || item.title;
    setQuery(selectedName);
    setShowSuggestions(false);
    setActiveSuggestionIndex(-1);
    if (setSearchTerm) setSearchTerm(selectedName);
    executeSearch(selectedName, filterType);
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === 'Enter') {
        handleSearchSubmit(e);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestionIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestionIndex(prev => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeSuggestionIndex >= 0 && activeSuggestionIndex < suggestions.length) {
        handleSelectSuggestion(suggestions[activeSuggestionIndex]);
      } else {
        handleSearchSubmit(e);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setActiveSuggestionIndex(-1);
    }
  };

  const handleFilterChange = (newFilter) => {
    setFilterType(newFilter);
    if (setSearchFilter) setSearchFilter(newFilter);
    setCurrentPage(1);
  };

  // Filter destination tags if applicable
  const filteredDestinations = destinations.filter(d => {
    if (selectedTag === 'All') return true;
    return d.tags && d.tags.toLowerCase().includes(selectedTag.toLowerCase());
  });

  // Calculate results to paginate based on selected filter
  let combinedItems = [];
  if (filterType === 'cities') {
    combinedItems = filteredDestinations.map(d => ({ ...d, _itemType: 'destination' }));
  } else if (filterType === 'places' || filterType === 'attractions' || filterType === 'famous' || filterType === 'nature' || filterType === 'history' || filterType === 'culture' || filterType === 'adventure' || filterType === 'indoor' || filterType === 'outdoor') {
    combinedItems = places.map(p => ({ ...p, _itemType: 'place' }));
  } else {
    // 'all': combine destinations and places
    combinedItems = [
      ...filteredDestinations.map(d => ({ ...d, _itemType: 'destination' })),
      ...places.map(p => ({ ...p, _itemType: 'place' }))
    ];
  }

  const totalPages = Math.max(1, Math.ceil(combinedItems.length / ITEMS_PER_PAGE));
  const paginatedItems = combinedItems.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Search Hero Header */}
      <div className="glass-card" style={{
        background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.35) 0%, rgba(17, 24, 39, 0.8) 100%)',
        border: '1px solid rgba(99, 102, 241, 0.25)',
        padding: '36px 32px'
      }}>
        <div style={{ maxWidth: '820px' }}>
          <span className="badge badge-info" style={{ marginBottom: '12px' }}>
            <Sparkles size={12} /> Global Destination & Sight Discovery
          </span>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>
            Explore Iconic Travel Destinations & Tourist Places
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '24px' }}>
            Discover famous tourist attractions, historical monuments, nature escapes, and hidden gems with multi-category search filters.
          </p>

          {/* Search Input Bar with Filter Selector & Autocomplete Dropdown */}
          <div style={{ position: 'relative' }}>
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                background: 'rgba(31, 41, 55, 0.7)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-full)',
                padding: '4px 6px 4px 16px',
                flex: 1,
                minWidth: '280px'
              }}>
                <SearchIcon size={18} style={{ color: 'var(--text-muted)', marginRight: '10px', flexShrink: 0 }} />
                <input 
                  type="text"
                  className="form-input"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: 'var(--text-main)',
                    fontSize: '0.96rem',
                    padding: '8px 0',
                    boxShadow: 'none'
                  }}
                  placeholder="Search destination, city, or attraction (e.g. Coimbatore, Coonoor, Ooty)..."
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    if (setSearchTerm) setSearchTerm(e.target.value);
                  }}
                  onKeyDown={handleKeyDown}
                  onFocus={() => {
                    if (suggestions.length > 0) setShowSuggestions(true);
                  }}
                  autoComplete="off"
                />

                {/* Filter dropdown inside search bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', borderLeft: '1px solid var(--border)', paddingLeft: '10px', marginLeft: '6px' }}>
                  <Filter size={14} color="#93c5fd" />
                  <select
                    value={filterType}
                    onChange={(e) => handleFilterChange(e.target.value)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-full)',
                      color: '#93c5fd',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      padding: '6px 12px',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    {SEARCH_FILTER_OPTIONS.map(opt => (
                      <option key={opt.id} value={opt.id} style={{ background: '#1f2937', color: '#fff' }}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ padding: '0 28px', borderRadius: 'var(--radius-full)' }}>
                Search
              </button>
            </form>

            {/* Autocomplete Dropdown List */}
            {showSuggestions && suggestions.length > 0 && (
              <div 
                className="glass-card"
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  marginTop: '8px',
                  zIndex: 1000,
                  padding: '8px',
                  background: 'rgba(15, 23, 42, 0.96)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(99, 102, 241, 0.35)',
                  boxShadow: '0 12px 36px rgba(0, 0, 0, 0.6)',
                  borderRadius: 'var(--radius-lg)',
                  maxHeight: '320px',
                  overflowY: 'auto'
                }}
              >
                <div style={{ padding: '6px 12px', fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Suggested Places & Destinations
                </div>
                {suggestions.map((item, idx) => {
                  const isHighlighted = idx === activeSuggestionIndex;
                  const isCity = item.type === 'city';
                  return (
                    <div
                      key={`${item.type}-${item.id}-${idx}`}
                      onClick={() => handleSelectSuggestion(item)}
                      onMouseEnter={() => setActiveSuggestionIndex(idx)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-md)',
                        background: isHighlighted ? 'rgba(59, 130, 246, 0.18)' : 'transparent',
                        cursor: 'pointer',
                        transition: 'var(--transition-fast)',
                        border: isHighlighted ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid transparent'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: isCity ? 'rgba(59, 130, 246, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                          color: isCity ? '#60a5fa' : '#34d399',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          {isCity ? <Compass size={16} /> : <MapPin size={16} />}
                        </div>
                        <div>
                          <div style={{ fontSize: '0.92rem', fontWeight: 700, color: isHighlighted ? '#93c5fd' : '#fff' }}>
                            {item.title || item.name}
                          </div>
                          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                            {item.subtitle || `${item.category} • ${item.state || 'Tamil Nadu'}`}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className={isCity ? 'badge badge-info' : 'badge badge-success'} style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                          {isCity ? 'Destination' : (item.category || 'Attraction')}
                        </span>
                        <ArrowRight size={14} style={{ color: isHighlighted ? '#60a5fa' : 'var(--text-dim)' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Example Tags */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Popular Quick Searches:</span>
            {EXAMPLE_CITIES.map((city) => (
              <button
                key={city}
                type="button"
                onClick={() => {
                  setQuery(city);
                  if (setSearchTerm) setSearchTerm(city);
                  executeSearch(city, filterType);
                }}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border)',
                  color: '#cbd5e1',
                  padding: '3px 10px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  transition: 'var(--transition-fast)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)';
                  e.currentTarget.style.borderColor = 'var(--primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.borderColor = 'var(--border)';
                }}
              >
                {city}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Category Pills Bar */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
        {SEARCH_FILTER_OPTIONS.map((opt) => {
          const isActive = filterType === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => handleFilterChange(opt.id)}
              style={{
                padding: '8px 16px',
                borderRadius: 'var(--radius-full)',
                background: isActive ? 'var(--primary)' : 'rgba(255, 255, 255, 0.05)',
                color: isActive ? '#fff' : 'var(--text-muted)',
                border: `1px solid ${isActive ? 'var(--primary)' : 'var(--border)'}`,
                fontSize: '0.82rem',
                fontWeight: isActive ? 700 : 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'var(--transition-fast)'
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Search Results Area */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <LoadingSpinner text="Searching destinations and sights..." />
        </div>
      ) : error ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '40px', color: '#f87171' }}>
          {error}
        </div>
      ) : combinedItems.length === 0 ? (
        <div className="glass-card" style={{
          textAlign: 'center',
          padding: '60px 20px',
          border: '1px dashed var(--border)'
        }}>
          <Compass size={48} style={{ color: 'var(--text-dim)', margin: '0 auto 16px auto' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '8px' }}>
            No destinations or tourist places found matching your filter.
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '480px', margin: '0 auto 20px auto' }}>
            Try searching for a different keyword or switch to "All Results" to discover top destinations and sights.
          </p>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setQuery('');
              handleFilterChange('all');
            }}
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div>
          {/* Active Result Count & Filter Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ fontSize: '0.92rem', color: 'var(--text-muted)' }}>
              Found <strong style={{ color: '#fff' }}>{combinedItems.length}</strong> result{combinedItems.length > 1 ? 's' : ''} {query ? `for "${query}"` : ''} ({SEARCH_FILTER_OPTIONS.find(o => o.id === filterType)?.label})
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
              Showing {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, combinedItems.length)}-{Math.min(currentPage * ITEMS_PER_PAGE, combinedItems.length)} of {combinedItems.length}
            </div>
          </div>

          {/* Paginated 5 items grid */}
          <div className="grid-3" style={{ gap: '20px' }}>
            {paginatedItems.map((item) => {
              if (item._itemType === 'destination') {
                return (
                  <DestinationCard
                    key={`dest-${item.id}`}
                    destination={item}
                    onSelect={(d) => {
                      if (onSelectDestination) onSelectDestination(d);
                    }}
                  />
                );
              } else {
                return (
                  <PlaceCard
                    key={`place-${item.id || item.name}`}
                    place={item}
                    onSelect={setSelectedModalPlace}
                    onDirections={onSelectDirections}
                    onAddToTrip={onAddToTrip}
                  />
                );
              }
            })}
          </div>

          {/* Dynamic 5-Items Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(p) => {
              setCurrentPage(p);
              window.scrollTo({ top: 200, behavior: 'smooth' });
            }}
            totalItems={combinedItems.length}
            itemsPerPage={ITEMS_PER_PAGE}
            itemName="destinations and sights"
          />
        </div>
      )}

      {/* Place Details Modal */}
      {selectedModalPlace && (
        <PlaceDetailsModal
          place={selectedModalPlace}
          onClose={() => setSelectedModalPlace(null)}
          onAddToTrip={onAddToTrip}
          onDirections={onSelectDirections}
        />
      )}

    </div>
  );
};

export default Search;
