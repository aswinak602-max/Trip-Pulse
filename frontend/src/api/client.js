import axios from 'axios';

/**
 * Resolves and normalizes the raw base API URL:
 * - Reads VITE_API_URL (or VITE_API_BASE_URL fallback)
 * - In local development (DEV mode), defaults to 'http://localhost:8000'
 * - In production, uses the configured VITE_API_URL (e.g. 'https://trippulse-backend.onrender.com')
 * - If not configured in production, falls back to window.location.origin
 * - Automatically strips surrounding quotes, trailing slashes, and redundant '/api/v1' suffix
 */
export const getRawApiUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '';
  let url = (typeof envUrl === 'string' ? envUrl : '').trim().replace(/^["']|["']$/g, '');
  
  if (!url) {
    if (import.meta.env.DEV) {
      url = 'http://localhost:8000';
    } else if (typeof window !== 'undefined' && window.location.origin) {
      url = window.location.origin;
    } else {
      url = 'http://localhost:8000';
    }
  }

  // Remove trailing slashes
  let clean = url.replace(/\/+$/, '');
  
  // If the user accidentally provided '/api/v1' in VITE_API_URL, strip it so getApiBaseUrl doesn't duplicate it
  if (clean.endsWith('/api/v1')) {
    clean = clean.slice(0, -'/api/v1'.length);
  }
  
  return clean.replace(/\/+$/, '');
};

/**
 * Computes the full API v1 base URL (e.g. 'https://trippulse-backend.onrender.com/api/v1' or 'http://localhost:8000/api/v1')
 */
export const getApiBaseUrl = () => {
  const raw = getRawApiUrl();
  if (!raw) return '/api/v1';
  return `${raw}/api/v1`;
};

/**
 * Resolves a WebSocket URL based on the current backend API host:
 * - Converts http: -> ws: and https: -> wss:
 */
export const getWsUrl = (path = '') => {
  const raw = getRawApiUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  if (raw.startsWith('https://')) {
    return `${raw.replace(/^https:\/\//i, 'wss://')}${cleanPath}`;
  } else if (raw.startsWith('http://')) {
    return `${raw.replace(/^http:\/\//i, 'ws://')}${cleanPath}`;
  }
  
  const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${raw.replace(/^wss?:\/\//i, '')}${cleanPath}`;
};

export const RAW_API_URL = getRawApiUrl();
export const API_BASE_URL = getApiBaseUrl();

export const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 45000, // 45 second timeout to accommodate cold starts on free cloud tiers (e.g. Render)
});

// Request Interceptor: Attach Auth Token and ensure baseURL
apiClient.interceptors.request.use(
  (config) => {
    if (!config.baseURL) {
      config.baseURL = getApiBaseUrl();
    }
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Clean Payload Extraction & Standardized Error Handling
apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    let message = 'Something went wrong. Please try again.';
    const statusCode = error.response?.status;
    const responseData = error.response?.data;

    if (error.response) {
      message =
        responseData?.message ||
        responseData?.detail ||
        (typeof responseData === 'string' ? responseData : null) ||
        `Server error (${statusCode})`;

      // If login 401
      if (statusCode === 401 && error.config?.url?.includes('/auth/login')) {
        message = responseData?.message || 'Invalid email or password.';
      }

      // Handle 401 Unauthorized for session token expiry
      if (statusCode === 401 && !error.config?.url?.includes('/auth/login')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      message = 'Request timed out. Please check your network connection or server status.';
    } else if (error.message === 'Network Error' || error.code === 'ERR_NETWORK' || !error.response) {
      const targetHost = getRawApiUrl() || 'TripPulse backend server';
      message = `Unable to connect to TripPulse server. Please check that the backend is reachable at ${targetHost}.`;
    } else if (error.message) {
      message = error.message;
    }

    return Promise.reject({
      message,
      status: statusCode,
      data: responseData,
      raw: error
    });
  }
);

export default apiClient;

