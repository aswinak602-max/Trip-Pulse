import axios from 'axios';

// Centralized API Base URL configuration
const rawUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const baseURL = rawUrl.endsWith('/api/v1') ? rawUrl : `${rawUrl.replace(/\/+$/, '')}/api/v1`;

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout to prevent hanging requests
});

// Request Interceptor: Attach Auth Token
apiClient.interceptors.request.use(
  (config) => {
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
      message = 'Request timed out. Please check your network connection.';
    } else if (error.message === 'Network Error' || error.code === 'ERR_NETWORK' || !error.response) {
      message = 'Unable to connect to TripPulse server. Please check that the backend is running at http://localhost:8000.';
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
