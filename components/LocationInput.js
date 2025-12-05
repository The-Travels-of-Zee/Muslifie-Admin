// components/LocationInput.jsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { locationService } from './../lib/locationService';

export default function LocationInput({ 
  value, 
  onChange, 
  placeholder = 'Search for a location...', 
  onLocationSelect,
  showCurrentLocation = true
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  
  const debounceTimer = useRef(null);
  const wrapperRef = useRef(null);

  // Get current location on mount if enabled
  useEffect(() => {
    if (showCurrentLocation) {
      locationService.getCurrentLocation().then(result => {
        if (result.success && result.lat && result.lng) {
          setCurrentLocation({ lat: result.lat, lng: result.lng });
          console.log('✅ User location detected for search bias');
        } else {
          console.log('ℹ️ Could not get user location for search bias (not critical)');
        }
      });
    }
  }, [showCurrentLocation]);

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search locations with debounce
  const searchLocations = async (query) => {
    if (!query || query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setLoading(true);
    try {
      const results = await locationService.getPlaceSuggestions(
        query,
        currentLocation?.lat,
        currentLocation?.lng
      );
      
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
    } catch (error) {
      console.error('Error searching locations:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    onChange(newValue);
    setSelectedLocation(null); // Clear selection when typing

    // Debounce search
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      searchLocations(newValue);
    }, 500);
  };

  const handleSelectSuggestion = (suggestion) => {
    onChange(suggestion.name);
    setSelectedLocation(suggestion);
    setShowSuggestions(false);
    setSuggestions([]);

    if (onLocationSelect) {
      onLocationSelect({
        name: suggestion.name,
        address: suggestion.formattedAddress,
        placeId: suggestion.placeId,
        coordinates: suggestion.coordinates,
      });
    }
  };

  const handleUseCurrentLocation = async () => {
    setLoading(true);
    try {
      const result = await locationService.getCurrentLocation();
      
      // Check for errors
      if (!result.success || result.error) {
        console.error('Location error:', result);
        
        // Show user-friendly error message
        const errorMessages = {
          'PERMISSION_DENIED': 'Please allow location access in your browser to use this feature.\n\nHow to enable:\n• Click the lock icon in address bar\n• Allow location access\n• Refresh the page',
          'NOT_SECURE': 'Location access requires HTTPS. Please access this page via https://',
          'UNAVAILABLE': 'Location services unavailable. Please check your device settings.',
          'TIMEOUT': 'Location request timed out. Please try again.',
          'NOT_SUPPORTED': 'Your browser doesn\'t support location services.'
        };
        
        const message = errorMessages[result.code] || result.error || 'Could not get your location. Please search manually.';
        alert(message);
        return;
      }

      // Success - get address
      const address = await locationService.reverseGeocode(result.lat, result.lng);
      
      onChange(address);
      setSelectedLocation({
        name: address,
        formattedAddress: address,
        coordinates: { lat: result.lat, lng: result.lng },
      });
      setShowSuggestions(false);

      if (onLocationSelect) {
        onLocationSelect({
          name: address,
          address: address,
          coordinates: { lat: result.lat, lng: result.lng },
        });
      }
    } catch (error) {
      console.error('Error using current location:', error);
      alert('Failed to get current location. Please try searching manually.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      {/* Input Field */}
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          placeholder={placeholder}
          style={{
            width: '100%',
            padding: '12px 16px',
            paddingLeft: '44px',
            paddingRight: showCurrentLocation ? '44px' : '16px',
            border: '2px solid #E5E7EB',
            borderRadius: '12px',
            fontSize: '14px',
            fontFamily: 'Poppins, sans-serif',
            outline: 'none',
            transition: 'border-color 0.2s',
          }}
        //   onFocus={(e) => (e.target.style.borderColor = '#6366F1')}
          onBlur={(e) => {
            setTimeout(() => {
              if (e.target !== document.activeElement) {
                e.target.style.borderColor = '#E5E7EB';
              }
            }, 200);
          }}
        />
        
        {/* Location Icon */}
        <div
          style={{
            position: 'absolute',
            left: '14px',
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: '20px',
            color: '#6366F1',
            pointerEvents: 'none',
          }}
        >
          📍
        </div>

        {/* Current Location Button */}
        {showCurrentLocation && (
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={loading}
            style={{
              position: 'absolute',
              right: '8px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: loading ? '#F1F5F9' : '#10B981',
              color: 'white',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              transition: 'all 0.2s',
            }}
            title="Use current location"
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.backgroundColor = '#059669';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.target.style.backgroundColor = '#10B981';
              }
            }}
          >
            {loading ? '⏳' : '🎯'}
          </button>
        )}
      </div>

      {/* Loading Indicator */}
      {loading && (
        <p
          style={{
            fontSize: '11px',
            color: '#6366F1',
            fontFamily: 'Poppins, sans-serif',
            marginTop: '4px',
          }}
        >
          Searching locations...
        </p>
      )}

      {/* Location Confirmation */}
      {selectedLocation && selectedLocation.coordinates.lat !== 0 && (
        <div
          style={{
            marginTop: '8px',
            padding: '12px 16px',
            backgroundColor: '#F0FDF4',
            border: '2px solid #10B981',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              backgroundColor: '#10B981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <span style={{ color: 'white', fontSize: '14px' }}>✓</span>
          </div>
          <div style={{ flex: 1 }}>
            <p
              style={{
                fontSize: '13px',
                fontWeight: '600',
                color: '#10B981',
                fontFamily: 'Poppins, sans-serif',
                margin: 0,
                marginBottom: '2px',
              }}
            >
              Location Confirmed
            </p>
            <p
              style={{
                fontSize: '12px',
                color: '#059669',
                fontFamily: 'Poppins, sans-serif',
                margin: 0,
              }}
            >
              {selectedLocation.formattedAddress || selectedLocation.name}
            </p>
          </div>
          <span style={{ fontSize: '18px' }}>🗺️</span>
        </div>
      )}

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            backgroundColor: 'white',
            border: '2px solid #E5E7EB',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            maxHeight: '300px',
            overflowY: 'auto',
            zIndex: 1000,
          }}
        >
          {suggestions.slice(0, 5).map((suggestion, index) => (
            <div
              key={suggestion.placeId || index}
              onClick={() => handleSelectSuggestion(suggestion)}
              style={{
                padding: '12px 16px',
                borderBottom:
                  index < Math.min(suggestions.length, 5) - 1
                    ? '1px solid #F1F5F9'
                    : 'none',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = '#F8FAFC')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = 'white')
              }
            >
              <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                <span style={{ fontSize: '18px', marginTop: '2px' }}>📍</span>
                <div style={{ flex: 1 }}>
                  <p
                    style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#1E293B',
                      fontFamily: 'Poppins, sans-serif',
                      margin: 0,
                      marginBottom: '2px',
                    }}
                  >
                    {suggestion.mainText}
                  </p>
                  {suggestion.secondaryText && (
                    <p
                      style={{
                        fontSize: '12px',
                        color: '#64748B',
                        fontFamily: 'Poppins, sans-serif',
                        margin: 0,
                      }}
                    >
                      {suggestion.secondaryText}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No Results */}
      {!loading &&
        showSuggestions &&
        suggestions.length === 0 &&
        value.length >= 2 && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 4px)',
              left: 0,
              right: 0,
              backgroundColor: 'white',
              border: '2px solid #E5E7EB',
              borderRadius: '12px',
              padding: '16px',
              textAlign: 'center',
              zIndex: 1000,
            }}
          >
            <p
              style={{
                fontSize: '13px',
                color: '#64748B',
                fontFamily: 'Poppins, sans-serif',
                margin: 0,
              }}
            >
              No locations found. Try a different search.
            </p>
          </div>
        )}
    </div>
  );
}