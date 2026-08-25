import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider, useToast } from './components/Toast';
import { Compass } from 'lucide-react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import LoadingSpinner from './components/LoadingSpinner';
import api from './services/api';

// Dynamic code-split lazy imports for all application pages
const Welcome = lazy(() => import('./pages/Welcome'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const VerifyResetCode = lazy(() => import('./pages/VerifyResetCode'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const CreateTrip = lazy(() => import('./pages/CreateTrip'));
const Search = lazy(() => import('./pages/Search'));
const DestinationDetails = lazy(() => import('./pages/DestinationDetails'));
const TripDashboard = lazy(() => import('./pages/TripDashboard'));
const ItineraryPage = lazy(() => import('./pages/ItineraryPage'));
const MapViewPage = lazy(() => import('./pages/MapViewPage'));
const CostPredictionPage = lazy(() => import('./pages/CostPredictionPage'));
const WeatherPage = lazy(() => import('./pages/WeatherPage'));
const ExpensesPage = lazy(() => import('./pages/ExpensesPage'));
const ReservationsPage = lazy(() => import('./pages/ReservationsPage'));
const MembersPage = lazy(() => import('./pages/MembersPage'));
const ChecklistPage = lazy(() => import('./pages/ChecklistPage'));
const AssistantPage = lazy(() => import('./pages/AssistantPage'));
const JoinTripPage = lazy(() => import('./pages/JoinTripPage'));

const PROTECTED_PAGES = new Set([
  'dashboard',
  'create-trip',
  'search',
  'destination-detail',
  'trip-dashboard',
  'itinerary',
  'map',
  'cost-prediction',
  'weather',
  'expenses',
  'reservations',
  'members',
  'checklist',
  'assistant',
  'settings'
]);

const pathToPage = (path) => {
  const cleanPath = (path || '').replace(/\/+$/, '') || '/';
  
  if (cleanPath.startsWith('/join')) {
    return 'join';
  }

  if (cleanPath.startsWith('/trip-dashboard')) {
    return 'trip-dashboard';
  }

  if (cleanPath.startsWith('/auth/callback') || cleanPath.startsWith('/oauth/callback') || cleanPath.startsWith('/callback')) {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('error')) {
        return 'login';
      }
    } catch {
      // fallback
    }
    return 'trip-dashboard';
  }

  switch (cleanPath) {
    case '/':
      return 'welcome';
    case '/login':
      return 'login';
    case '/register':
      return 'register';
    case '/forgot-password':
      return 'forgot-password';
    case '/verify-reset-code':
      return 'verify-reset-code';
    case '/reset-password':
      return 'reset-password';
    case '/join':
      return 'join';
    case '/settings':
      return 'settings';
    case '/dashboard':
      return 'dashboard';
    case '/create-trip':
      return 'create-trip';
    case '/explore':
    case '/search':
      return 'search';
    case '/destination-detail':
      return 'destination-detail';
    case '/trip-dashboard':
      return 'trip-dashboard';
    case '/itinerary':
      return 'itinerary';
    case '/map':
      return 'map';
    case '/cost-predictor':
    case '/cost-prediction':
      return 'cost-prediction';
    case '/weather':
      return 'weather';
    case '/reservations':
      return 'reservations';
    case '/expenses':
      return 'expenses';
    case '/group-members':
    case '/members':
      return 'members';
    case '/checklists':
    case '/checklist':
      return 'checklist';
    case '/ai-assistant':
    case '/assistant':
      return 'assistant';
    default:
      return 'welcome';
  }
};

const pageToPath = (page) => {
  switch (page) {
    case 'welcome':
      return '/';
    case 'login':
      return '/login';
    case 'register':
      return '/register';
    case 'forgot-password':
      return '/forgot-password';
    case 'verify-reset-code':
      return '/verify-reset-code';
    case 'reset-password':
      return '/reset-password';
    case 'join':
      return '/join';
    case 'settings':
      return '/settings';
    case 'dashboard':
      return '/dashboard';
    case 'create-trip':
      return '/create-trip';
    case 'search':
      return '/explore';
    case 'destination-detail':
      return '/destination-detail';
    case 'trip-dashboard':
      return '/trip-dashboard';
    case 'itinerary':
      return '/itinerary';
    case 'map':
      return '/map';
    case 'cost-prediction':
      return '/cost-predictor';
    case 'weather':
      return '/weather';
    case 'reservations':
      return '/reservations';
    case 'expenses':
      return '/expenses';
    case 'members':
      return '/group-members';
    case 'checklist':
      return '/checklists';
    case 'assistant':
      return '/ai-assistant';
    default:
      return '/';
  }
};

function AppContent() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const toast = useToast();
  const [activePage, setActivePage] = useState(() => pathToPage(window.location.pathname));
  const [resetEmail, setResetEmail] = useState(() => sessionStorage.getItem('reset_email') || '');
  const [resetToken, setResetToken] = useState(() => sessionStorage.getItem('reset_token') || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilter, setSearchFilter] = useState('all');
  const [backendStatus, setBackendStatus] = useState(null);
  const [loadingHealth, setLoadingHealth] = useState(true);
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [directionsTarget, setDirectionsTarget] = useState(null);
  const [pendingPlace, setPendingPlace] = useState(null);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Active trip initialized from localStorage or default
  const [activeTrip, setActiveTrip] = useState(() => {
    try {
      const saved = localStorage.getItem('activeTrip');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Could not parse saved activeTrip:', e);
    }
    return {
      id: 1,
      title: 'College Mini-Project Demo: Ooty Nature Getaway',
      destination: 'Ooty',
      current_location: 'Chennai',
      start_date: '2026-09-10',
      end_date: '2026-09-13',
      days_count: 3,
      members_count: 4,
      budget: 25000,
      transport_type: 'Car',
      accommodation_type: 'Standard',
      food_budget_tier: 'Standard',
      interests: ['Nature', 'Photography', 'Adventure'],
      status: 'active'
    };
  });

  const updateActiveTrip = useCallback((tripData) => {
    setActiveTrip(tripData);
    if (tripData && tripData.id) {
      try {
        localStorage.setItem('activeTrip', JSON.stringify(tripData));
        localStorage.setItem('trippulse_current_trip_id', String(tripData.id));
      } catch (e) {
        console.warn('Failed to save activeTrip to localStorage:', e);
      }
    } else if (!tripData) {
      localStorage.removeItem('activeTrip');
      localStorage.removeItem('trippulse_current_trip_id');
    }
  }, []);

  const navigate = useCallback((page) => {
    setActivePage(page);
    const targetPath = pageToPath(page);
    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
    window.scrollTo(0, 0);
  }, []);

  // Listen to browser forward/backward buttons
  useEffect(() => {
    const handlePopState = () => {
      setActivePage(pathToPage(window.location.pathname));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Check Backend Health on Initial Load and Periodically
  useEffect(() => {
    let mounted = true;
    const checkHealth = async () => {
      try {
        const res = await api.get('/health');
        if (mounted) {
          const statusData = res?.data 
            ? { ...res.data, status: res.data.status || (res.success ? 'online' : 'error') } 
            : (res || { status: 'online' });
          setBackendStatus(statusData);
          setLoadingHealth(false);
        }
      } catch (err) {
        if (mounted) {
          setBackendStatus({ status: 'error', message: err.message || 'API Disconnected' });
          setLoadingHealth(false);
        }
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // Fetch active trip from backend when authenticated
  useEffect(() => {
    const fetchTrips = async () => {
      if (!isAuthenticated) return;
      try {
        const res = await api.get('/trips');
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          updateActiveTrip(res.data[0]);
        }
      } catch (err) {
        console.error('Could not load user trips:', err);
      }
    };
    fetchTrips();
  }, [isAuthenticated, updateActiveTrip]);

  // Auth Protection Handling
  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated && PROTECTED_PAGES.has(activePage)) {
      navigate('login');
      return;
    }

    if (isAuthenticated && (activePage === 'welcome' || activePage === 'login' || activePage === 'register' || activePage === 'forgot-password' || activePage === 'verify-reset-code' || activePage === 'reset-password')) {
      navigate('trip-dashboard');
    }
  }, [isAuthenticated, authLoading, activePage, navigate]);

  const handleSelectDirections = (place) => {
    setDirectionsTarget(place);
    navigate('map');
  };

  const handleAddToItinerary = async (place) => {
    if (!place) return;

    // A. If the user already has an active trip:
    if (activeTrip && activeTrip.id) {
      try {
        const res = await api.post('/itinerary', {
          trip_id: activeTrip.id,
          place_id: place.id,
          custom_title: place.name,
          day_number: 1,
          time_slot: '10:00 AM',
          duration_hours: place.estimated_visit_hours || 2.0,
          notes: place.description || ''
        });

        if (res && res.success) {
          toast.success(`${place.name} added to your itinerary.`);
        } else {
          toast.warning(res?.message || `${place.name} is already in your itinerary.`);
        }
      } catch (err) {
        if (err.status === 409 || err.message?.includes('already in your itinerary')) {
          toast.warning(`This place is already in your itinerary.`);
        } else {
          toast.error(err.message || `Unable to add ${place.name} to itinerary.`);
        }
      }
    } else {
      // B. If user does NOT have an active trip:
      setPendingPlace(place);
      toast.info(`Selected ${place.name}. Let's create your trip to add it to your itinerary.`);
      navigate('create-trip');
    }
  };

  if (authLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg-main)',
        gap: '20px'
      }}>
        <div style={{
          width: '54px',
          height: '54px',
          borderRadius: '16px',
          background: 'var(--accent-gradient)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 24px rgba(99, 102, 241, 0.45)'
        }}>
          <Compass size={30} color="#fff" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>TripPulse</span>
          <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: '6px', background: 'rgba(99, 102, 241, 0.25)', color: '#a5b4fc', fontWeight: 800 }}>AI • ML</span>
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            border: '2px solid rgba(255, 255, 255, 0.2)',
            borderTopColor: 'var(--primary)',
            animation: 'spin 0.8s linear infinite'
          }} />
          <span>Checking authentication...</span>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activePage) {
      case 'welcome':
        return <Welcome setActivePage={navigate} />;
      case 'login':
        return (
          <Login 
            setActivePage={navigate} 
            backendStatus={backendStatus}
            loadingStatus={loadingHealth}
            onOpenResetPassword={(token) => {
              setResetToken(token);
              navigate('reset-password');
            }}
          />
        );
      case 'register':
        return <Register setActivePage={navigate} />;
      case 'forgot-password':
        return (
          <ForgotPassword
            setActivePage={navigate}
            initialEmail={resetEmail}
            onEmailSubmitted={(email) => {
              setResetEmail(email);
              navigate('verify-reset-code');
            }}
          />
        );
      case 'verify-reset-code':
        return (
          <VerifyResetCode
            email={resetEmail}
            setActivePage={navigate}
            onChangeEmail={() => navigate('forgot-password')}
            onCodeVerified={(token) => {
              setResetToken(token);
              navigate('reset-password');
            }}
          />
        );
      case 'reset-password':
        return (
          <ResetPassword
            token={resetToken}
            setActivePage={navigate}
            onResetComplete={() => {
              setResetToken('');
              setResetEmail('');
            }}
          />
        );
      case 'settings':
        return <SettingsPage setActivePage={navigate} />;
      case 'create-trip':
        return (
          <CreateTrip 
            setActivePage={navigate} 
            onTripCreated={(newTrip) => {
              updateActiveTrip(newTrip);
              setPendingPlace(null);
            }}
            onSelectDirections={handleSelectDirections}
            pendingPlace={pendingPlace}
            onClearPendingPlace={() => setPendingPlace(null)}
          />
        );
      case 'search':
        return (
          <Search 
            searchTerm={searchQuery}
            setSearchTerm={setSearchQuery}
            searchFilter={searchFilter}
            setSearchFilter={setSearchFilter}
            onSelectDestination={(dest) => {
              setSelectedDestination(dest);
              navigate('destination-detail');
            }} 
            onSelectDirections={handleSelectDirections}
            onAddToTrip={handleAddToItinerary}
            setActivePage={navigate} 
          />
        );
      case 'destination-detail':
        return (
          <DestinationDetails 
            destination={selectedDestination || { id: 1, name: 'Ooty', country: 'India', state: 'Tamil Nadu', hero_image: 'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=1200&q=80', description: 'The Queen of Hill Stations in the Nilgiri Hills.', popularity: 4.8 }}
            onBack={() => navigate('search')}
            onAddToTrip={handleAddToItinerary}
            onSelectDirections={handleSelectDirections}
            setActivePage={navigate}
          />
        );
      case 'trip-dashboard':
        return <TripDashboard trip={activeTrip} setActivePage={navigate} onUpdateTrip={updateActiveTrip} />;
      case 'join':
        return (
          <JoinTripPage 
            setActivePage={navigate} 
            onTripJoined={(tripData) => {
              updateActiveTrip(tripData);
              navigate('trip-dashboard');
            }} 
          />
        );
      case 'itinerary':
        return (
          <ItineraryPage 
            trip={activeTrip} 
            setActivePage={navigate} 
            onSelectDirections={handleSelectDirections} 
          />
        );
      case 'map':
        return (
          <MapViewPage 
            trip={activeTrip} 
            directionsTarget={directionsTarget} 
            onClearDirectionsTarget={() => setDirectionsTarget(null)}
            setActivePage={navigate} 
          />
        );
      case 'cost-prediction':
        return <CostPredictionPage trip={activeTrip} setActivePage={navigate} />;
      case 'weather':
        return <WeatherPage trip={activeTrip} setActivePage={navigate} />;
      case 'expenses':
        return <ExpensesPage trip={activeTrip} />;
      case 'reservations':
        return <ReservationsPage trip={activeTrip} />;
      case 'members':
        return <MembersPage trip={activeTrip} setActivePage={navigate} />;
      case 'checklist':
        return <ChecklistPage trip={activeTrip} />;
      case 'assistant':
        return <AssistantPage trip={activeTrip} setActivePage={navigate} />;
      case 'dashboard':
      default:
        return (
          <Dashboard
            backendStatus={backendStatus}
            loadingStatus={loadingHealth}
            setActivePage={navigate}
            activeTrip={activeTrip}
          />
        );
    }
  };

  const isPublicPage = activePage === 'welcome' || activePage === 'login' || activePage === 'register' || activePage === 'forgot-password' || activePage === 'verify-reset-code' || activePage === 'reset-password' || activePage === 'join';

  return (
    <div className="app-layout">
      <Navbar
        searchQuery={searchQuery}
        searchFilter={searchFilter}
        onFilterChange={(filter) => {
          setSearchFilter(filter);
          if (isAuthenticated) navigate('search');
        }}
        onSearch={(query) => {
          setSearchQuery(query);
          if (query) navigate(isAuthenticated ? 'search' : 'login');
        }}
        backendStatus={backendStatus}
        loadingStatus={loadingHealth}
        activePage={activePage}
        setActivePage={navigate}
        isMobileNavOpen={isMobileNavOpen}
        onToggleMobileNav={() => setIsMobileNavOpen(prev => !prev)}
      />
      <div className="app-body">
        {!isPublicPage && isAuthenticated && (
          <Sidebar 
            activePage={activePage} 
            setActivePage={navigate}
            isMobileNavOpen={isMobileNavOpen}
            onCloseMobileNav={() => setIsMobileNavOpen(false)}
          />
        )}
        <main className="main-content" style={{ width: '100%' }}>
          <Suspense fallback={<LoadingSpinner fullScreen text="Loading page..." />}>
            {renderContent()}
          </Suspense>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
