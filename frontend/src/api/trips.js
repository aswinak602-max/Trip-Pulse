import apiClient from './client';

export const tripsApi = {
  getTrips: () => apiClient.get('/trips'),
  getTripById: (tripId) => apiClient.get(`/trips/${tripId}`),
  createTrip: (tripData) => apiClient.post('/trips', tripData),
  updateTrip: (tripId, tripData) => apiClient.put(`/trips/${tripId}`, tripData),
  deleteTrip: (tripId) => apiClient.delete(`/trips/${tripId}`),
  reorderItinerary: (tripId, items) => apiClient.put(`/trips/${tripId}/reorder`, { items })
};

export default tripsApi;
