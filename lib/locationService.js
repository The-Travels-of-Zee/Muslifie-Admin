// lib/services/locationService.js
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const locationService = {
  /**
   * Get place suggestions for autocomplete
   * @param {string} query - Search query
   * @param {number} lat - Optional latitude for location bias
   * @param {number} lng - Optional longitude for location bias
   * @returns {Promise<Array>} Array of place suggestions
   */
  async getPlaceSuggestions(query, lat = null, lng = null) {
    try {
      if (!query || query.trim().length < 2) {
        return [];
      }

      const body = { query: query.trim() };
      if (lat !== null && lng !== null) {
        body.lat = lat;
        body.lng = lng;
      }

      const response = await fetch(`${API_URL}/api/places/autocomplete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        console.error('HTTP Error:', response.status);
        return [];
      }

      const data = await response.json();
      
      if (data.success && Array.isArray(data.data)) {
        return data.data.map(place => ({
          placeId: place.placeId || '',
          name: place.name || '',
          formattedAddress: place.formattedAddress || '',
          coordinates: {
            lat: place.coordinates?.lat || 0,
            lng: place.coordinates?.lng || 0,
          },
          mainText: place.structuredFormatting?.mainText || place.name || '',
          secondaryText: place.structuredFormatting?.secondaryText || place.formattedAddress || '',
          types: place.types || [],
        }));
      }

      return [];
    } catch (error) {
      console.error('Error getting place suggestions:', error);
      return [];
    }
  },

  /**
   * Geocode an address to get coordinates
   * @param {string} address - Address to geocode
   * @returns {Promise<Array>} Array of geocoded locations
   */
  async geocodeAddress(address) {
    try {
      if (!address || address.trim().length < 3) {
        return [];
      }

      const response = await fetch(`${API_URL}/api/places/geocode`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address: address.trim() }),
      });

      if (!response.ok) {
        console.error('HTTP Error:', response.status);
        return [];
      }

      const data = await response.json();
      
      if (data.success && Array.isArray(data.data)) {
        return data.data.map(place => ({
          placeId: place.placeId || '',
          name: place.name || '',
          formattedAddress: place.formattedAddress || '',
          coordinates: {
            lat: place.coordinates?.lat || 0,
            lng: place.coordinates?.lng || 0,
          },
          mainText: place.structuredFormatting?.mainText || place.name || '',
          secondaryText: place.structuredFormatting?.secondaryText || place.formattedAddress || '',
          types: place.types || [],
        }));
      }

      return [];
    } catch (error) {
      console.error('Error geocoding address:', error);
      return [];
    }
  },

  /**
   * Get user's current location using browser Geolocation API
   * @returns {Promise<Object|null>} Location object with lat/lng or null
   */
  async getCurrentLocation() {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        console.error('Geolocation is not supported by this browser');
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Error getting current location:', error);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  },

  /**
   * Reverse geocode coordinates to get readable address
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @returns {Promise<string>} Formatted address
   */
  async reverseGeocode(lat, lng) {
    try {
      // Use Nominatim for reverse geocoding (free alternative)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
        {
          headers: {
            'User-Agent': 'MuslifieApp/1.0',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Reverse geocoding failed');
      }

      const data = await response.json();
      return data.display_name || `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
    }
  },

  /**
   * Test if the location service is working
   * @returns {Promise<boolean>}
   */
  async testService() {
    try {
      const response = await fetch(`${API_URL}/api/places/test`);
      return response.ok;
    } catch (error) {
      console.error('Service test failed:', error);
      return false;
    }
  },
};