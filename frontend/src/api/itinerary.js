import apiClient from './client';

export const itineraryApi = {
  getItinerary: (tripId) => apiClient.get(`/itinerary/${tripId}`),
  addItem: (itemData) => apiClient.post('/itinerary', itemData),
  updateItem: (itemId, itemData) => apiClient.put(`/itinerary/${itemId}`, itemData),
  deleteItem: (itemId) => apiClient.delete(`/itinerary/${itemId}`)
};

export default itineraryApi;
