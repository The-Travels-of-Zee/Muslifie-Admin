// components/CountryCitySelector.jsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { globalCities } from '../lib/locations'; // 🔥 Import your existing data

export default function CountryCitySelector({
  selectedCountry,
  selectedCity,
  onCountryChange,
  onCityChange,
  required = false
}) {
  // 🔥 Extract unique countries from globalCities
  const [countries] = useState(() => {
    const uniqueCountries = [...new Set(globalCities.map(city => city.country))];
    return uniqueCountries.sort();
  });
  
  const [cities, setCities] = useState([]);
  const [countrySearch, setCountrySearch] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);

  const countryRef = useRef(null);
  const cityRef = useRef(null);

  // 🔥 Update cities when country changes
  useEffect(() => {
    if (selectedCountry) {
      const countryCities = globalCities
        .filter(city => city.country === selectedCountry)
        .map(city => city.name)
        .sort();
      setCities(countryCities);
    } else {
      setCities([]);
    }
  }, [selectedCountry]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (countryRef.current && !countryRef.current.contains(event.target)) {
        setShowCountryDropdown(false);
      }
      if (cityRef.current && !cityRef.current.contains(event.target)) {
        setShowCityDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter countries based on search
  const filteredCountries = countries.filter(country =>
    country.toLowerCase().includes(countrySearch.toLowerCase())
  );

  // Filter cities based on search
  const filteredCities = cities.filter(city =>
    city.toLowerCase().includes(citySearch.toLowerCase())
  );

  const handleCountrySelect = (country) => {
    console.log('🔥 Country selected:', country); // Debug log
    onCountryChange(country); // ✅ This triggers parent update
    setCountrySearch('');
    setShowCountryDropdown(false);
    // Reset city when country changes
    onCityChange('');
  };

  const handleCitySelect = (city) => {
    console.log('🔥 City selected:', city); // Debug log
    onCityChange(city); // ✅ This triggers parent update
    setCitySearch('');
    setShowCityDropdown(false);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
      {/* Country Selector */}
      <div ref={countryRef} style={{ position: 'relative' }}>
        <label style={{
          display: 'block',
          fontSize: '14px',
          fontWeight: '600',
          color: '#374151',
          marginBottom: '8px',
          fontFamily: 'Poppins, sans-serif'
        }}>
          Country {required && '*'}
        </label>
        
        <div
          onClick={() => setShowCountryDropdown(!showCountryDropdown)}
          style={{
            width: '100%',
            padding: '12px 16px',
            paddingRight: '40px',
            border: '2px solid #E5E7EB',
            borderRadius: '12px',
            fontSize: '14px',
            fontFamily: 'Poppins, sans-serif',
            cursor: 'pointer',
            backgroundColor: 'white',
            color: selectedCountry ? '#1E293B' : '#94A3B8',
            display: 'flex',
            alignItems: 'center',
            transition: 'border-color 0.2s',
            position: 'relative'
          }}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = '#6366F1'}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = '#E5E7EB'}
        >
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {selectedCountry || 'Select country'}
          </span>
          <span style={{
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: '12px',
            color: '#6366F1'
          }}>
            {showCountryDropdown ? '▲' : '▼'}
          </span>
        </div>

        {/* Country Dropdown */}
        {showCountryDropdown && (
          <div style={{
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
            zIndex: 1000
          }}>
            {/* Search Input */}
            <div style={{ padding: '8px', borderBottom: '1px solid #F1F5F9' }}>
              <input
                type="text"
                value={countrySearch}
                onChange={(e) => setCountrySearch(e.target.value)}
                placeholder="Search countries..."
                onClick={(e) => e.stopPropagation()}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontFamily: 'Poppins, sans-serif',
                  outline: 'none'
                }}
                autoFocus
              />
            </div>

            {/* Country List */}
            <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
              {filteredCountries.length > 0 ? (
                filteredCountries.map((country, index) => (
                  <div
                    key={country}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleCountrySelect(country);
                    }}
                    style={{
                      padding: '10px 16px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontFamily: 'Poppins, sans-serif',
                      color: '#1E293B',
                      borderBottom: index < filteredCountries.length - 1 ? '1px solid #F1F5F9' : 'none',
                      backgroundColor: selectedCountry === country ? '#EEF2FF' : 'white',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = selectedCountry === country ? '#EEF2FF' : 'white';
                    }}
                  >
                    🌍 {country}
                  </div>
                ))
              ) : (
                <div style={{
                  padding: '16px',
                  textAlign: 'center',
                  color: '#64748B',
                  fontSize: '13px',
                  fontFamily: 'Poppins, sans-serif'
                }}>
                  No countries found
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* City Selector */}
      <div ref={cityRef} style={{ position: 'relative' }}>
        <label style={{
          display: 'block',
          fontSize: '14px',
          fontWeight: '600',
          color: '#374151',
          marginBottom: '8px',
          fontFamily: 'Poppins, sans-serif'
        }}>
          City {required && '*'}
        </label>
        
        <div
          onClick={() => {
            if (selectedCountry) {
              setShowCityDropdown(!showCityDropdown);
            }
          }}
          style={{
            width: '100%',
            padding: '12px 16px',
            paddingRight: '40px',
            border: '2px solid #E5E7EB',
            borderRadius: '12px',
            fontSize: '14px',
            fontFamily: 'Poppins, sans-serif',
            cursor: selectedCountry ? 'pointer' : 'not-allowed',
            backgroundColor: selectedCountry ? 'white' : '#F8FAFC',
            color: selectedCity ? '#1E293B' : '#94A3B8',
            display: 'flex',
            alignItems: 'center',
            transition: 'border-color 0.2s',
            position: 'relative',
            opacity: selectedCountry ? 1 : 0.6
          }}
          onMouseEnter={(e) => {
            if (selectedCountry) {
              e.currentTarget.style.borderColor = '#6366F1';
            }
          }}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = '#E5E7EB'}
        >
          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {selectedCity || (selectedCountry ? 'Select city' : 'Select country first')}
          </span>
          {selectedCountry && (
            <span style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '12px',
              color: '#6366F1'
            }}>
              {showCityDropdown ? '▲' : '▼'}
            </span>
          )}
        </div>

        {/* City Dropdown */}
        {showCityDropdown && selectedCountry && (
          <div style={{
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
            zIndex: 1000
          }}>
            {/* Search Input */}
            <div style={{ padding: '8px', borderBottom: '1px solid #F1F5F9' }}>
              <input
                type="text"
                value={citySearch}
                onChange={(e) => setCitySearch(e.target.value)}
                placeholder="Search cities..."
                onClick={(e) => e.stopPropagation()}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontFamily: 'Poppins, sans-serif',
                  outline: 'none'
                }}
                autoFocus
              />
            </div>

            {/* City List */}
            <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
              {filteredCities.length > 0 ? (
                filteredCities.map((city, index) => (
                  <div
                    key={city}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleCitySelect(city);
                    }}
                    style={{
                      padding: '10px 16px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontFamily: 'Poppins, sans-serif',
                      color: '#1E293B',
                      borderBottom: index < filteredCities.length - 1 ? '1px solid #F1F5F9' : 'none',
                      backgroundColor: selectedCity === city ? '#EEF2FF' : 'white',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = selectedCity === city ? '#EEF2FF' : 'white';
                    }}
                  >
                    🏙️ {city}
                  </div>
                ))
              ) : (
                <div style={{
                  padding: '16px',
                  textAlign: 'center',
                  color: '#64748B',
                  fontSize: '13px',
                  fontFamily: 'Poppins, sans-serif'
                }}>
                  No cities found
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}