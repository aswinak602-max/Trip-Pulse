import apiClient from './client';

export const authApi = {
  login: (credentials) => apiClient.post('/auth/login', credentials),
  register: (userData) => apiClient.post('/auth/register', userData),
  getMe: () => apiClient.get('/auth/me'),
  getOAuthConfig: () => apiClient.get('/auth/oauth/config'),
  googleLogin: (oauthData) => apiClient.post('/auth/google', oauthData),
  forgotPassword: (email) => apiClient.post('/auth/forgot-password', { email }),
  resetPassword: (payload) => apiClient.post('/auth/reset-password', payload),
  verifyEmail: (token) => apiClient.get(`/auth/verify-email?token=${encodeURIComponent(token)}`),
  updateProfile: (profileData) => apiClient.put('/auth/profile', profileData),
  updatePreferences: (preferences) => apiClient.put('/auth/preferences', preferences),
  deleteAccount: () => apiClient.delete('/auth/account')
};

export default authApi;
