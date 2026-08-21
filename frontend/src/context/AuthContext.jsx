import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

// Helper to extract tokens from URL search params or hash fragments
const extractUrlAuthToken = () => {
  try {
    // 1. Check URL search query parameters (e.g. ?token=... or ?oauth_token=... or ?access_token=...)
    const urlParams = new URLSearchParams(window.location.search);
    let foundToken = urlParams.get('oauth_token') || urlParams.get('token') || urlParams.get('access_token');

    // 2. Check URL hash fragments (e.g. #access_token=... or #token=...)
    if (!foundToken && window.location.hash) {
      const hashStr = window.location.hash.startsWith('#') ? window.location.hash.substring(1) : window.location.hash;
      const hashParams = new URLSearchParams(hashStr);
      foundToken = hashParams.get('oauth_token') || hashParams.get('token') || hashParams.get('access_token');
    }

    return foundToken;
  } catch (e) {
    console.warn('[AuthContext] Error reading URL auth tokens:', e);
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  // Pre-seed token from URL or localStorage synchronously to prevent unauthenticated flash
  const initialUrlToken = extractUrlAuthToken();
  const initialLocalToken = localStorage.getItem('token');
  const initialToken = initialUrlToken || initialLocalToken || null;

  if (initialUrlToken) {
    try {
      localStorage.setItem('token', initialUrlToken);
    } catch (e) {
      console.warn('[AuthContext] Failed to cache initial URL token:', e);
    }
  }

  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(initialToken);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      const urlToken = extractUrlAuthToken();
      const activeToken = urlToken || localStorage.getItem('token') || token;
      const storedUser = localStorage.getItem('user');

      if (urlToken) {
        localStorage.setItem('token', urlToken);
        if (isMounted) setToken(urlToken);

        // Clean URL parameters and hash while preserving clean path
        try {
          const cleanSearch = new URLSearchParams(window.location.search);
          cleanSearch.delete('token');
          cleanSearch.delete('oauth_token');
          cleanSearch.delete('access_token');
          cleanSearch.delete('success');
          cleanSearch.delete('code');
          cleanSearch.delete('state');
          const newSearchStr = cleanSearch.toString();
          const newUrl = window.location.pathname + (newSearchStr ? `?${newSearchStr}` : '');
          window.history.replaceState({}, document.title, newUrl);
        } catch (urlErr) {
          console.warn('[AuthContext] Clean URL notice:', urlErr);
        }
      }

      if (activeToken) {
        // Optimistically populate user from localStorage if available
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            if (isMounted) {
              setUser(parsedUser);
              setToken(activeToken);
            }
          } catch {
            // will fetch fresh from /auth/me below
          }
        }

        // Validate token against backend /auth/me
        try {
          const res = await api.get('/auth/me', {
            headers: { Authorization: `Bearer ${activeToken}` }
          });

          if (res && res.success && res.data && isMounted) {
            setUser(res.data);
            setToken(activeToken);
            localStorage.setItem('user', JSON.stringify(res.data));
            localStorage.setItem('token', activeToken);
          } else if (!storedUser && isMounted) {
            setUser(null);
            setToken(null);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        } catch (apiErr) {
          console.warn('[AuthContext] Session validation notice:', apiErr.message || apiErr);
          if (apiErr?.status === 401 && isMounted) {
            setUser(null);
            setToken(null);
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
          // If network is temporarily unreachable but local token exists, preserve state
        }
      } else if (isMounted) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setToken(null);
      }

      if (isMounted) {
        setLoading(false);
      }
    };

    initAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback((userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    setLoading(false);
    if (authToken) localStorage.setItem('token', authToken);
    if (userData) localStorage.setItem('user', JSON.stringify(userData));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    setLoading(false);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated: !!token && !!user,
      hasToken: !!token,
      login,
      logout,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;



