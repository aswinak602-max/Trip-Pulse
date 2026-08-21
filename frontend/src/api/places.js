import apiClient from './client';

export const placesApi = {
  getDestinations: (search = '', filter = 'all') => 
    apiClient.get(`/destinations?search=${encodeURIComponent(search)}&filter=${encodeURIComponent(filter)}`),
  getDestinationById: (id) => apiClient.get(`/destinations/${id}`),
  getPlaces: (search = '', category = '') => 
    apiClient.get(`/places?search=${encodeURIComponent(search)}&category=${encodeURIComponent(category)}`),
  getDestinationPlaces: (destination, origin = '') => 
    apiClient.get(`/places/destination?destination=${encodeURIComponent(destination)}&origin=${encodeURIComponent(origin)}`),
  getPlaceById: (id) => apiClient.get(`/places/${id}`),
  savePlace: (placeId) => apiClient.post(`/places/${placeId}/save`),
  unsavePlace: (placeId) => apiClient.delete(`/places/${placeId}/save`),
  getSavedPlaces: () => apiClient.get('/places/saved/all')
};

export default placesApi;
