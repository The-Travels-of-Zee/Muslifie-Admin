'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  UserGroupIcon,
  MapPinIcon,
  ClockIcon,
  CurrencyDollarIcon,
  CalendarDaysIcon,
  GlobeAltIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  PhotoIcon,
  PlusIcon,
  TrashIcon,
  BuildingOfficeIcon,
  TruckIcon,
  HomeIcon,
  SparklesIcon,
  ExclamationTriangleIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';
import apiService from '../../../../lib/apiService';

export default function CreateTourForPartnerPage() {
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [partners, setPartners] = useState([]);
  const [selectedPartner, setSelectedPartner] = useState('');
  const [tourType, setTourType] = useState('day_trip');
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    location: true,
    pricing: true,
    availability: true,
    features: false,
    meeting: false,
    additional: false,
    package: false
  });
  
  const [formData, setFormData] = useState({
    // Basic Info
    title: '',
    description: '',
    category: '',
    duration: 1,
    
    // Pricing
    pricePerPerson: 0,
    maxGroupSize: 8,
    
    // Location
    location: {
      country: '',
      city: '',
      area: ''
    },
    
    // Languages
    languages: [],
    
    // Inclusions
    inclusions: [],
    
    // Islamic Features
    isHalalCertified: true,
    includesPrayerBreaks: true,
    femaleGuideAvailable: false,
    
    // Meeting Point
    meetingPoint: {
      name: '',
      instructions: '',
      returnLocation: '',
      returnInstructions: '',
      coordinates: { lat: 0, lng: 0 }
    },
    
    // Availability (Day Trip)
    availability: {
      type: 'recurring',
      days: [],
      timeSlots: [],
      startDates: []
    },
    
    // Additional Info
    additionalInfo: {
      detailedItinerary: [],
      whatToBring: [],
      importantNotes: [],
      emergencyContact: {
        name: '',
        phone: ''
      }
    },
    
    // Package Details (Package Tour)
    packageDetails: {
      totalDays: 1,
      dayWiseItinerary: [],
      transportation: {
        flightsIncluded: false,
        localTransport: false,
        transportType: 'Car',
        details: ''
      },
      accommodationSummary: {
        totalNights: 0,
        hotelStandard: '3-Star',
        roomSharing: 'Double'
      },
      mealPlan: 'Breakfast Only',
      packageInclusions: [],
      packageExclusions: ['Personal Expenses', 'Shopping', 'Optional Activities', 'Tips and Gratuities'],
      ticketsAndEntries: {
        flightTickets: false,
        attractionTickets: false,
        transportationPasses: false,
        entranceFees: false,
        ticketDetails: ''
      },
      bookingPolicy: {
        advanceBookingDays: 7,
        cancellationPolicy: 'Moderate',
        refundPolicy: ''
      }
    }
  });
  
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);

  const categories = [
    'Walking Tours', 'Hiking & Nature', 'City Tours', 'Cultural Tours',
    'Food Tours', 'Historical Tours', 'Adventure Tours', 'Photography Tours',
    'Art & Museums', 'Architecture Tours', 'Islamic Heritage', 'Mosque Architecture',
    'Halal Food Tours', 'Religious Education', 'Pilgrimage Sites'
  ];

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const languageOptions = [
    'English', 'Arabic', 'Spanish', 'French', 'German', 'Urdu', 'Hindi',
    'Turkish', 'Indonesian', 'Malay', 'Persian (Farsi)', 'Bengali', 'Chinese (Mandarin)',
    'Japanese', 'Korean', 'Portuguese', 'Italian', 'Russian', 'Swahili'
  ];

  const transportTypes = ['Bus', 'Car', 'Train', 'Flight', 'Mixed'];
  const hotelStandards = ['Budget', '3-Star', '4-Star', '5-Star', 'Luxury'];
  const roomSharingOptions = ['Single', 'Double', 'Triple', 'Dormitory'];
  const mealPlanOptions = ['No Meals', 'Breakfast Only', 'Half Board', 'Full Board', 'All Inclusive'];
  const cancellationPolicies = ['Flexible', 'Moderate', 'Strict'];

  const packageInclusionOptions = [
    'Accommodation', 'All Meals', 'Breakfast Only', 'Local Transportation',
    'Flight Tickets', 'Visa Assistance', 'Travel Insurance', 'Tour Guide',
    'Entrance Fees', 'Airport Transfers', 'Free WiFi', 'Cultural Activities',
    'Religious Sites Access', 'Halal Certified Meals', 'Prayer Facility Access'
  ];

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      const response = await apiService.getPartners();
      const data = response.data || response;
      setPartners(data.partners || []);
    } catch (error) {
      console.error('Error fetching partners:', error);
      alert('Failed to load partners');
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleLocationChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      location: {
        ...prev.location,
        [field]: value
      }
    }));
  };

  const handleMeetingPointChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      meetingPoint: {
        ...prev.meetingPoint,
        [field]: value
      }
    }));
  };

  const handlePackageChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      packageDetails: {
        ...prev.packageDetails,
        [field]: value
      }
    }));
  };

  const handlePackageNestedChange = (parent, field, value) => {
    setFormData(prev => ({
      ...prev,
      packageDetails: {
        ...prev.packageDetails,
        [parent]: {
          ...prev.packageDetails[parent],
          [field]: value
        }
      }
    }));
  };

  const handleDayToggle = (day) => {
    setFormData(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        days: prev.availability.days.includes(day)
          ? prev.availability.days.filter(d => d !== day)
          : [...prev.availability.days, day]
      }
    }));
  };

  const handleLanguageToggle = (lang) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.includes(lang)
        ? prev.languages.filter(l => l !== lang)
        : [...prev.languages, lang]
    }));
  };

  const handlePackageInclusionToggle = (inclusion) => {
    setFormData(prev => ({
      ...prev,
      packageDetails: {
        ...prev.packageDetails,
        packageInclusions: prev.packageDetails.packageInclusions.includes(inclusion)
          ? prev.packageDetails.packageInclusions.filter(i => i !== inclusion)
          : [...prev.packageDetails.packageInclusions, inclusion]
      }
    }));
  };

  // Time Slots Management
  const handleAddTimeSlot = () => {
    const timeSlot = prompt('Enter time slot (e.g., 9:00 AM):');
    if (timeSlot && timeSlot.trim()) {
      setFormData(prev => ({
        ...prev,
        availability: {
          ...prev.availability,
          timeSlots: [...prev.availability.timeSlots, timeSlot.trim()]
        }
      }));
    }
  };

  const handleRemoveTimeSlot = (index) => {
    setFormData(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        timeSlots: prev.availability.timeSlots.filter((_, i) => i !== index)
      }
    }));
  };

  // Start Dates Management (Package Tours)
  const handleAddStartDate = () => {
    const dateStr = prompt('Enter start date (YYYY-MM-DD):');
    if (dateStr) {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime()) && date > new Date()) {
        setFormData(prev => ({
          ...prev,
          availability: {
            ...prev.availability,
            type: 'start_dates',
            startDates: [...prev.availability.startDates, date.toISOString()]
          }
        }));
      } else {
        alert('Please enter a valid future date');
      }
    }
  };

  const handleRemoveStartDate = (index) => {
    setFormData(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        startDates: prev.availability.startDates.filter((_, i) => i !== index)
      }
    }));
  };

  // Inclusions Management
  const handleAddInclusion = () => {
    const inclusion = prompt('Enter inclusion:');
    if (inclusion && inclusion.trim()) {
      setFormData(prev => ({
        ...prev,
        inclusions: [...prev.inclusions, inclusion.trim()]
      }));
    }
  };

  const handleRemoveInclusion = (index) => {
    setFormData(prev => ({
      ...prev,
      inclusions: prev.inclusions.filter((_, i) => i !== index)
    }));
  };

  // What to Bring Management
  const handleAddWhatToBring = () => {
    const item = prompt('Enter item to bring:');
    if (item && item.trim()) {
      setFormData(prev => ({
        ...prev,
        additionalInfo: {
          ...prev.additionalInfo,
          whatToBring: [...prev.additionalInfo.whatToBring, item.trim()]
        }
      }));
    }
  };

  const handleRemoveWhatToBring = (index) => {
    setFormData(prev => ({
      ...prev,
      additionalInfo: {
        ...prev.additionalInfo,
        whatToBring: prev.additionalInfo.whatToBring.filter((_, i) => i !== index)
      }
    }));
  };

  // Important Notes Management
  const handleAddImportantNote = () => {
    const note = prompt('Enter important note:');
    if (note && note.trim()) {
      setFormData(prev => ({
        ...prev,
        additionalInfo: {
          ...prev.additionalInfo,
          importantNotes: [...prev.additionalInfo.importantNotes, note.trim()]
        }
      }));
    }
  };

  const handleRemoveImportantNote = (index) => {
    setFormData(prev => ({
      ...prev,
      additionalInfo: {
        ...prev.additionalInfo,
        importantNotes: prev.additionalInfo.importantNotes.filter((_, i) => i !== index)
      }
    }));
  };

  // Detailed Itinerary Management (Day Trip)
  const handleAddDetailedItinerary = () => {
    const time = prompt('Enter time (e.g., 9:00 AM):');
    if (!time) return;
    
    const type = prompt('Enter type (Meet up, Visit, Lunch, Break, Return, Activity):');
    if (!type) return;
    
    const title = prompt('Enter title:');
    if (!title) return;
    
    const description = prompt('Enter description:');
    
    setFormData(prev => ({
      ...prev,
      additionalInfo: {
        ...prev.additionalInfo,
        detailedItinerary: [
          ...prev.additionalInfo.detailedItinerary,
          { time, type, title, description: description || '' }
        ]
      }
    }));
  };

  const handleRemoveDetailedItinerary = (index) => {
    setFormData(prev => ({
      ...prev,
      additionalInfo: {
        ...prev.additionalInfo,
        detailedItinerary: prev.additionalInfo.detailedItinerary.filter((_, i) => i !== index)
      }
    }));
  };

  // Day-wise Itinerary Management (Package Tour)
  const handleAddDayItinerary = () => {
    const day = formData.packageDetails.dayWiseItinerary.length + 1;
    const title = prompt(`Enter title for Day ${day}:`);
    if (!title) return;
    
    const description = prompt(`Enter description for Day ${day}:`);
    if (!description) return;
    
    setFormData(prev => ({
      ...prev,
      packageDetails: {
        ...prev.packageDetails,
        dayWiseItinerary: [
          ...prev.packageDetails.dayWiseItinerary,
          {
            day,
            title,
            description,
            activities: [],
            meals: {
              breakfast: false,
              lunch: false,
              dinner: false,
              snacks: false
            },
            accommodation: {
              provided: false,
              hotelName: '',
              hotelRating: 3,
              roomType: '',
              checkIn: '',
              checkOut: ''
            }
          }
        ]
      }
    }));
  };

  const handleRemoveDayItinerary = (index) => {
    setFormData(prev => ({
      ...prev,
      packageDetails: {
        ...prev.packageDetails,
        dayWiseItinerary: prev.packageDetails.dayWiseItinerary
          .filter((_, i) => i !== index)
          .map((day, idx) => ({ ...day, day: idx + 1 })) // Renumber days
      }
    }));
  };

  const handleUpdateDayItinerary = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      packageDetails: {
        ...prev.packageDetails,
        dayWiseItinerary: prev.packageDetails.dayWiseItinerary.map((day, i) => 
          i === index ? { ...day, [field]: value } : day
        )
      }
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Basic validation
    if (!selectedPartner) newErrors.partner = 'Please select a partner';
    if (!formData.title || formData.title.length < 10) newErrors.title = 'Title must be at least 10 characters';
    if (!formData.description || formData.description.length < 50) newErrors.description = 'Description must be at least 50 characters';
    if (!formData.category) newErrors.category = 'Please select a category';
    if (formData.duration < 0.5) newErrors.duration = 'Duration must be at least 0.5 hours';
    if (formData.pricePerPerson <= 0) newErrors.price = 'Price must be greater than 0';
    if (!formData.location.country) newErrors.country = 'Country is required';
    if (!formData.location.city) newErrors.city = 'City is required';
    
    // Day trip specific validation
    if (tourType === 'day_trip') {
      if (formData.availability.days.length === 0) newErrors.days = 'Select at least one day';
      if (formData.availability.timeSlots.length === 0) newErrors.timeSlots = 'Add at least one time slot';
    }
    
    // Package tour specific validation
    if (tourType === 'package') {
      if (formData.packageDetails.totalDays < 1) newErrors.totalDays = 'Total days must be at least 1';
      if (formData.packageDetails.dayWiseItinerary.length === 0) newErrors.dayWiseItinerary = 'Add at least one day itinerary';
      if (formData.availability.startDates.length === 0) newErrors.startDates = 'Add at least one start date for package tour';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      alert('Please fix the errors in the form');
      return;
    }
    
    setLoading(true);
    
    try {
      const tourData = {
        ...formData,
        tourType,
        pricing: {
          type: 'fixed',
          basePrice: parseFloat(formData.pricePerPerson),
          tiers: []
        }
      };
      
      // Ensure availability type is set correctly
      if (tourType === 'package') {
        tourData.availability.type = 'start_dates';
      } else {
        tourData.availability.type = 'recurring';
      }
      
      const response = await apiService.createTourForPartner(selectedPartner, tourData);
      
      setSuccess(true);
      setTimeout(() => {
        router.push('/dashboard/tours');
      }, 2000);
      
    } catch (error) {
      console.error('Error creating tour:', error);
      alert(error.message || 'Failed to create tour');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Tour Draft Created!</h2>
          <p className="text-gray-600">Partner will be notified. Redirecting...</p>
        </div>
      </div>
    );
  }

  const SectionHeader = ({ icon: Icon, title, sectionKey }) => (
    <button
      type="button"
      onClick={() => toggleSection(sectionKey)}
      className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl hover:from-indigo-100 hover:to-purple-100 transition-colors"
    >
      <div className="flex items-center">
        <Icon className="w-6 h-6 mr-3 text-indigo-600" />
        <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Jost, sans-serif' }}>
          {title}
        </h2>
      </div>
      {expandedSections[sectionKey] ? (
        <ChevronUpIcon className="w-5 h-5 text-indigo-600" />
      ) : (
        <ChevronDownIcon className="w-5 h-5 text-indigo-600" />
      )}
    </button>
  );

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.back()}
          className="text-indigo-600 hover:text-indigo-800 mb-4 flex items-center"
        >
          ← Back to Tours
        </button>
        <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Jost, sans-serif' }}>
          Create Tour for Partner
        </h1>
        <p className="text-gray-600 mt-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
          Create a comprehensive draft tour on behalf of a partner. They can review and publish it later.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Partner Selection */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <SectionHeader icon={UserGroupIcon} title="Select Partner" sectionKey="partner" />
          
          {expandedSections.partner !== false && (
            <div className="mt-4">
              <select
                value={selectedPartner}
                onChange={(e) => setSelectedPartner(e.target.value)}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 ${
                  errors.partner ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              >
                <option value="">Select a partner/guide...</option>
                {partners.map(partner => (
                  <option key={partner._id} value={partner._id}>
                    {partner.fullName || `${partner.firstName} ${partner.lastName}`} ({partner.email})
                  </option>
                ))}
              </select>
              {errors.partner && <p className="text-red-500 text-sm mt-1">{errors.partner}</p>}
            </div>
          )}
        </div>

        {/* Tour Type */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Tour Type</h2>
          
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setTourType('day_trip')}
              className={`p-6 border-2 rounded-xl transition-all ${
                tourType === 'day_trip'
                  ? 'border-indigo-600 bg-indigo-50 shadow-lg'
                  : 'border-gray-300 hover:border-indigo-300'
              }`}
            >
              <ClockIcon className={`w-8 h-8 mx-auto mb-2 ${tourType === 'day_trip' ? 'text-indigo-600' : 'text-gray-400'}`} />
              <p className="font-semibold text-lg">Day Trip</p>
              <p className="text-sm text-gray-600 mt-1">Single day tour with recurring schedule</p>
            </button>
            
            <button
              type="button"
              onClick={() => setTourType('package')}
              className={`p-6 border-2 rounded-xl transition-all ${
                tourType === 'package'
                  ? 'border-indigo-600 bg-indigo-50 shadow-lg'
                  : 'border-gray-300 hover:border-indigo-300'
              }`}
            >
              <CalendarDaysIcon className={`w-8 h-8 mx-auto mb-2 ${tourType === 'package' ? 'text-indigo-600' : 'text-gray-400'}`} />
              <p className="font-semibold text-lg">Package Tour</p>
              <p className="text-sm text-gray-600 mt-1">Multi-day package with specific start dates</p>
            </button>
          </div>
        </div>

        {/* Basic Information */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <SectionHeader icon={InformationCircleIcon} title="Basic Information" sectionKey="basic" />
          
          {expandedSections.basic && (
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tour Title * <span className="text-xs text-gray-500">(min 10 characters)</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 ${
                    errors.title ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., Historical Mosques Tour in Istanbul"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">{formData.title.length}/10 characters</p>
                {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description * <span className="text-xs text-gray-500">(min 50 characters)</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={6}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 ${
                    errors.description ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Provide a detailed description of the tour..."
                  required
                />
                <p className="text-xs text-gray-500 mt-1">{formData.description.length}/50 characters</p>
                {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 ${
                      errors.category ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  >
                    <option value="">Select category...</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration (hours) *
                  </label>
                  <input
                    type="number"
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    min="0.5"
                    step="0.5"
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 ${
                      errors.duration ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  />
                  {errors.duration && <p className="text-red-500 text-sm mt-1">{errors.duration}</p>}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Location */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <SectionHeader icon={MapPinIcon} title="Location" sectionKey="location" />
          
          {expandedSections.location && (
            <div className="mt-4 grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country *
                </label>
                <input
                  type="text"
                  value={formData.location.country}
                  onChange={(e) => handleLocationChange('country', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 ${
                    errors.country ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., Turkey"
                  required
                />
                {errors.country && <p className="text-red-500 text-sm mt-1">{errors.country}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City *
                </label>
                <input
                  type="text"
                  value={formData.location.city}
                  onChange={(e) => handleLocationChange('city', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 ${
                    errors.city ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., Istanbul"
                  required
                />
                {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Area (Optional)
                </label>
                <input
                  type="text"
                  value={formData.location.area}
                  onChange={(e) => handleLocationChange('area', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., Sultanahmet"
                />
              </div>
            </div>
          )}
        </div>

        {/* Pricing */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <SectionHeader icon={CurrencyDollarIcon} title="Pricing & Group Size" sectionKey="pricing" />
          
          {expandedSections.pricing && (
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price Per Person ($) *
                </label>
                <input
                  type="number"
                  name="pricePerPerson"
                  value={formData.pricePerPerson}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 ${
                    errors.price ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                  required
                />
                {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Group Size
                </label>
                <input
                  type="number"
                  name="maxGroupSize"
                  value={formData.maxGroupSize}
                  onChange={handleInputChange}
                  min="1"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  placeholder="8"
                />
              </div>
            </div>
          )}
        </div>

        {/* Availability - DAY TRIP */}
        {tourType === 'day_trip' && (
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <SectionHeader icon={CalendarDaysIcon} title="Availability (Recurring Schedule)" sectionKey="availability" />
            
            {expandedSections.availability && (
              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Available Days *
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {daysOfWeek.map(day => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => handleDayToggle(day)}
                        className={`px-4 py-2 rounded-lg border-2 transition-all ${
                          formData.availability.days.includes(day)
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
                            : 'border-gray-300 text-gray-700 hover:border-indigo-300'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                  {errors.days && <p className="text-red-500 text-sm mt-1">{errors.days}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time Slots *
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.availability.timeSlots.map((slot, index) => (
                      <div key={index} className="flex items-center bg-indigo-50 px-3 py-2 rounded-lg border border-indigo-200">
                        <ClockIcon className="w-4 h-4 text-indigo-600 mr-2" />
                        <span className="text-sm font-medium">{slot}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTimeSlot(index)}
                          className="ml-2 text-red-500 hover:text-red-700"
                        >
                          <XCircleIcon className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={handleAddTimeSlot}
                    className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Add Time Slot
                  </button>
                  {errors.timeSlots && <p className="text-red-500 text-sm mt-1">{errors.timeSlots}</p>}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Availability - PACKAGE TOUR */}
        {tourType === 'package' && (
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <SectionHeader icon={CalendarDaysIcon} title="Package Start Dates" sectionKey="availability" />
            
            {expandedSections.availability && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Dates * <span className="text-xs text-gray-500">(Future dates only)</span>
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.availability.startDates.map((date, index) => (
                    <div key={index} className="flex items-center bg-purple-50 px-3 py-2 rounded-lg border border-purple-200">
                      <CalendarDaysIcon className="w-4 h-4 text-purple-600 mr-2" />
                      <span className="text-sm font-medium">{new Date(date).toLocaleDateString()}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveStartDate(index)}
                        className="ml-2 text-red-500 hover:text-red-700"
                      >
                        <XCircleIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={handleAddStartDate}
                  className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Add Start Date
                </button>
                {errors.startDates && <p className="text-red-500 text-sm mt-1">{errors.startDates}</p>}
              </div>
            )}
          </div>
        )}

        {/* Languages */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <SectionHeader icon={GlobeAltIcon} title="Languages" sectionKey="languages" />
          
          {expandedSections.languages !== false && (
            <div className="mt-4">
              <div className="flex flex-wrap gap-2">
                {languageOptions.map(lang => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => handleLanguageToggle(lang)}
                    className={`px-4 py-2 rounded-lg border-2 transition-all ${
                      formData.languages.includes(lang)
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
                        : 'border-gray-300 text-gray-700 hover:border-indigo-300'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Inclusions */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <SectionHeader icon={CheckCircleIcon} title="What's Included" sectionKey="inclusions" />
          
          {expandedSections.inclusions !== false && (
            <div className="mt-4">
              <div className="space-y-2 mb-4">
                {formData.inclusions.map((inclusion, index) => (
                  <div key={index} className="flex items-center justify-between bg-green-50 p-3 rounded-lg border border-green-200">
                    <div className="flex items-center">
                      <CheckCircleIcon className="w-5 h-5 text-green-600 mr-2" />
                      <span className="font-medium">{inclusion}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveInclusion(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
              
              <button
                type="button"
                onClick={handleAddInclusion}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                Add Inclusion
              </button>
            </div>
          )}
        </div>

        {/* Islamic Features */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <SectionHeader icon={SparklesIcon} title="Islamic Features" sectionKey="features" />
          
          {expandedSections.features && (
            <div className="mt-4 space-y-3">
              <label className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                <input
                  type="checkbox"
                  name="isHalalCertified"
                  checked={formData.isHalalCertified}
                  onChange={handleInputChange}
                  className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span className="ml-3 text-gray-700 font-medium">Halal Certified</span>
              </label>

              <label className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                <input
                  type="checkbox"
                  name="includesPrayerBreaks"
                  checked={formData.includesPrayerBreaks}
                  onChange={handleInputChange}
                  className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span className="ml-3 text-gray-700 font-medium">Includes Prayer Breaks</span>
              </label>

              <label className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer">
                <input
                  type="checkbox"
                  name="femaleGuideAvailable"
                  checked={formData.femaleGuideAvailable}
                  onChange={handleInputChange}
                  className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <span className="ml-3 text-gray-700 font-medium">Female Guide Available</span>
              </label>
            </div>
          )}
        </div>

        {/* Meeting Point */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <SectionHeader icon={MapPinIcon} title="Meeting Point Details" sectionKey="meeting" />
          
          {expandedSections.meeting && (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meeting Point Name
                  </label>
                  <input
                    type="text"
                    value={formData.meetingPoint.name}
                    onChange={(e) => handleMeetingPointChange('name', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g., Blue Mosque entrance"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Return Location
                  </label>
                  <input
                    type="text"
                    value={formData.meetingPoint.returnLocation}
                    onChange={(e) => handleMeetingPointChange('returnLocation', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                    placeholder="Same as meeting point or different"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meeting Point Instructions
                </label>
                <textarea
                  value={formData.meetingPoint.instructions}
                  onChange={(e) => handleMeetingPointChange('instructions', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  placeholder="How to find the meeting point, what to look for, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Return Instructions
                </label>
                <textarea
                  value={formData.meetingPoint.returnInstructions}
                  onChange={(e) => handleMeetingPointChange('returnInstructions', e.target.value)}
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  placeholder="Where and how the tour ends"
                />
              </div>
            </div>
          )}
        </div>

        {/* Additional Info - DAY TRIP */}
        {tourType === 'day_trip' && (
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <SectionHeader icon={InformationCircleIcon} title="Additional Information" sectionKey="additional" />
            
            {expandedSections.additional && (
              <div className="mt-4 space-y-6">
                {/* Detailed Itinerary */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Detailed Itinerary (Optional)
                  </label>
                  <div className="space-y-2 mb-2">
                    {formData.additionalInfo.detailedItinerary.map((item, index) => (
                      <div key={index} className="flex items-start justify-between bg-blue-50 p-3 rounded-lg border border-blue-200">
                        <div className="flex-1">
                          <div className="flex items-center mb-1">
                            <ClockIcon className="w-4 h-4 text-blue-600 mr-2" />
                            <span className="font-medium text-sm">{item.time}</span>
                            <span className="ml-2 px-2 py-0.5 bg-blue-200 text-blue-700 text-xs rounded">{item.type}</span>
                          </div>
                          <p className="font-semibold text-sm">{item.title}</p>
                          {item.description && <p className="text-xs text-gray-600 mt-1">{item.description}</p>}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveDetailedItinerary(index)}
                          className="ml-2 text-red-500 hover:text-red-700"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={handleAddDetailedItinerary}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Add Itinerary Item
                  </button>
                </div>

                {/* What to Bring */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    What to Bring (Optional)
                  </label>
                  <div className="space-y-2 mb-2">
                    {formData.additionalInfo.whatToBring.map((item, index) => (
                      <div key={index} className="flex items-center justify-between bg-amber-50 p-3 rounded-lg border border-amber-200">
                        <span className="font-medium text-sm">{item}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveWhatToBring(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={handleAddWhatToBring}
                    className="flex items-center px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
                  >
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Add Item
                  </button>
                </div>

                {/* Important Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Important Notes (Optional)
                  </label>
                  <div className="space-y-2 mb-2">
                    {formData.additionalInfo.importantNotes.map((note, index) => (
                      <div key={index} className="flex items-start justify-between bg-red-50 p-3 rounded-lg border border-red-200">
                        <div className="flex items-start flex-1">
                          <ExclamationTriangleIcon className="w-4 h-4 text-red-600 mr-2 mt-0.5" />
                          <span className="text-sm">{note}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveImportantNote(index)}
                          className="ml-2 text-red-500 hover:text-red-700"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={handleAddImportantNote}
                    className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Add Note
                  </button>
                </div>

                {/* Emergency Contact */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Emergency Contact Name
                    </label>
                    <input
                      type="text"
                      value={formData.additionalInfo.emergencyContact.name}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        additionalInfo: {
                          ...prev.additionalInfo,
                          emergencyContact: {
                            ...prev.additionalInfo.emergencyContact,
                            name: e.target.value
                          }
                        }
                      }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                      placeholder="Contact person name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Emergency Contact Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.additionalInfo.emergencyContact.phone}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        additionalInfo: {
                          ...prev.additionalInfo,
                          emergencyContact: {
                            ...prev.additionalInfo.emergencyContact,
                            phone: e.target.value
                          }
                        }
                      }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                      placeholder="+1234567890"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Package Details - PACKAGE TOUR */}
        {tourType === 'package' && (
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <SectionHeader icon={BuildingOfficeIcon} title="Package Details" sectionKey="package" />
            
            {expandedSections.package && (
              <div className="mt-4 space-y-6">
                {/* Total Days */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Days *
                  </label>
                  <input
                    type="number"
                    value={formData.packageDetails.totalDays}
                    onChange={(e) => handlePackageChange('totalDays', parseInt(e.target.value) || 1)}
                    min="1"
                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-indigo-500 ${
                      errors.totalDays ? 'border-red-500' : 'border-gray-300'
                    }`}
                    required
                  />
                  {errors.totalDays && <p className="text-red-500 text-sm mt-1">{errors.totalDays}</p>}
                </div>

                {/* Day-wise Itinerary */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Day-wise Itinerary *
                  </label>
                  <div className="space-y-3 mb-3">
                    {formData.packageDetails.dayWiseItinerary.map((day, index) => (
                      <div key={index} className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center mb-1">
                              <span className="px-3 py-1 bg-purple-600 text-white rounded-lg font-bold text-sm">Day {day.day}</span>
                            </div>
                            <p className="font-bold text-lg mt-2">{day.title}</p>
                            <p className="text-sm text-gray-600 mt-1">{day.description}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveDayItinerary(index)}
                            className="ml-2 text-red-500 hover:text-red-700"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </div>
                        
                        {/* Meals */}
                        <div className="mt-3 flex items-center gap-3 text-xs">
                          <span className="font-medium text-gray-700">Meals:</span>
                          {day.meals.breakfast && <span className="px-2 py-1 bg-green-100 text-green-700 rounded">Breakfast</span>}
                          {day.meals.lunch && <span className="px-2 py-1 bg-green-100 text-green-700 rounded">Lunch</span>}
                          {day.meals.dinner && <span className="px-2 py-1 bg-green-100 text-green-700 rounded">Dinner</span>}
                          {day.meals.snacks && <span className="px-2 py-1 bg-green-100 text-green-700 rounded">Snacks</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={handleAddDayItinerary}
                    className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Add Day
                  </button>
                  {errors.dayWiseItinerary && <p className="text-red-500 text-sm mt-1">{errors.dayWiseItinerary}</p>}
                </div>

                {/* Transportation */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Transportation
                  </label>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <label className="flex items-center p-3 bg-gray-50 rounded-lg cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.packageDetails.transportation.flightsIncluded}
                          onChange={(e) => handlePackageNestedChange('transportation', 'flightsIncluded', e.target.checked)}
                          className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                        <span className="ml-3 text-sm font-medium">Flights Included</span>
                      </label>

                      <label className="flex items-center p-3 bg-gray-50 rounded-lg cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.packageDetails.transportation.localTransport}
                          onChange={(e) => handlePackageNestedChange('transportation', 'localTransport', e.target.checked)}
                          className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                        <span className="ml-3 text-sm font-medium">Local Transport</span>
                      </label>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Transport Type</label>
                        <select
                          value={formData.packageDetails.transportation.transportType}
                          onChange={(e) => handlePackageNestedChange('transportation', 'transportType', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                        >
                          {transportTypes.map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Details</label>
                        <input
                          type="text"
                          value={formData.packageDetails.transportation.details}
                          onChange={(e) => handlePackageNestedChange('transportation', 'details', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                          placeholder="Additional details"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Accommodation Summary */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Accommodation Summary
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Total Nights</label>
                      <input
                        type="number"
                        value={formData.packageDetails.accommodationSummary.totalNights}
                        onChange={(e) => handlePackageNestedChange('accommodationSummary', 'totalNights', parseInt(e.target.value) || 0)}
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Hotel Standard</label>
                      <select
                        value={formData.packageDetails.accommodationSummary.hotelStandard}
                        onChange={(e) => handlePackageNestedChange('accommodationSummary', 'hotelStandard', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      >
                        {hotelStandards.map(standard => (
                          <option key={standard} value={standard}>{standard}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Room Sharing</label>
                      <select
                        value={formData.packageDetails.accommodationSummary.roomSharing}
                        onChange={(e) => handlePackageNestedChange('accommodationSummary', 'roomSharing', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      >
                        {roomSharingOptions.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Meal Plan */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meal Plan
                  </label>
                  <select
                    value={formData.packageDetails.mealPlan}
                    onChange={(e) => handlePackageChange('mealPlan', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                  >
                    {mealPlanOptions.map(plan => (
                      <option key={plan} value={plan}>{plan}</option>
                    ))}
                  </select>
                </div>

                {/* Package Inclusions */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Package Inclusions
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {packageInclusionOptions.map(inclusion => (
                      <button
                        key={inclusion}
                        type="button"
                        onClick={() => handlePackageInclusionToggle(inclusion)}
                        className={`px-3 py-2 rounded-lg border-2 text-sm transition-all ${
                          formData.packageDetails.packageInclusions.includes(inclusion)
                            ? 'border-green-600 bg-green-50 text-green-600'
                            : 'border-gray-300 text-gray-700 hover:border-green-300'
                        }`}
                      >
                        {inclusion}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tickets & Entries */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Tickets & Entries
                  </label>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <label className="flex items-center p-3 bg-gray-50 rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.packageDetails.ticketsAndEntries.flightTickets}
                        onChange={(e) => handlePackageNestedChange('ticketsAndEntries', 'flightTickets', e.target.checked)}
                        className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      />
                      <span className="ml-3 text-sm font-medium">Flight Tickets</span>
                    </label>

                    <label className="flex items-center p-3 bg-gray-50 rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.packageDetails.ticketsAndEntries.attractionTickets}
                        onChange={(e) => handlePackageNestedChange('ticketsAndEntries', 'attractionTickets', e.target.checked)}
                        className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      />
                      <span className="ml-3 text-sm font-medium">Attraction Tickets</span>
                    </label>

                    <label className="flex items-center p-3 bg-gray-50 rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.packageDetails.ticketsAndEntries.transportationPasses}
                        onChange={(e) => handlePackageNestedChange('ticketsAndEntries', 'transportationPasses', e.target.checked)}
                        className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      />
                      <span className="ml-3 text-sm font-medium">Transportation Passes</span>
                    </label>

                    <label className="flex items-center p-3 bg-gray-50 rounded-lg cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.packageDetails.ticketsAndEntries.entranceFees}
                        onChange={(e) => handlePackageNestedChange('ticketsAndEntries', 'entranceFees', e.target.checked)}
                        className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      />
                      <span className="ml-3 text-sm font-medium">Entrance Fees</span>
                    </label>
                  </div>

                  <input
                    type="text"
                    value={formData.packageDetails.ticketsAndEntries.ticketDetails}
                    onChange={(e) => handlePackageNestedChange('ticketsAndEntries', 'ticketDetails', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                    placeholder="Additional ticket details..."
                  />
                </div>

                {/* Booking Policy */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Booking Policy
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Advance Booking Days</label>
                      <input
                        type="number"
                        value={formData.packageDetails.bookingPolicy.advanceBookingDays}
                        onChange={(e) => handlePackageNestedChange('bookingPolicy', 'advanceBookingDays', parseInt(e.target.value) || 7)}
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Cancellation Policy</label>
                      <select
                        value={formData.packageDetails.bookingPolicy.cancellationPolicy}
                        onChange={(e) => handlePackageNestedChange('bookingPolicy', 'cancellationPolicy', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      >
                        {cancellationPolicies.map(policy => (
                          <option key={policy} value={policy}>{policy}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="mt-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1">Refund Policy Details</label>
                    <textarea
                      value={formData.packageDetails.bookingPolicy.refundPolicy}
                      onChange={(e) => handlePackageNestedChange('bookingPolicy', 'refundPolicy', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                      placeholder="Describe your refund policy..."
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Submit Buttons */}
        <div className="flex gap-4 sticky bottom-0 bg-white p-6 rounded-2xl shadow-2xl border-t-4 border-indigo-600">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-semibold text-lg"
            disabled={loading}
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-colors disabled:bg-gray-400 font-semibold text-lg shadow-lg"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Creating Draft...
              </span>
            ) : (
              '🚀 Create Draft Tour'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}