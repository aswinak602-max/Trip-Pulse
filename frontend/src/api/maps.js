import apiClient from './client';

export const mapsApi = {
  getDirections: (origin, destination) => 
    apiClient.get(`/maps/directions?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`),
  getPlaceCoords: (locationName) => 
    apiClient.get(`/maps/geocode?query=${encodeURIComponent(locationName)}`)
};

export default mapsApi;
