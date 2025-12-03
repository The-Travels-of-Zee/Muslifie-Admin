'use client';
import React, { useState, useEffect } from 'react';
import {
  MapIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  StarIcon,
  PhotoIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
  UsersIcon,
  ArrowDownTrayIcon,
  ChatBubbleLeftEllipsisIcon,
  MapPinIcon,
  LanguageIcon,
  HeartIcon,
  ShieldCheckIcon,
  InformationCircleIcon,
  PauseCircleIcon,
  ArchiveBoxIcon,
  DocumentTextIcon,
  BuildingOfficeIcon,
  HomeIcon,
  TruckIcon,
  BeakerIcon,
  TagIcon,
  GlobeAltIcon,
  BanknotesIcon,
  CalendarIcon,
  BookOpenIcon,
  ExclamationTriangleIcon,
  PhoneIcon,
  BriefcaseIcon,
  LightBulbIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import apiService from '../../../lib/apiService';

const ToursManagement = () => {
  const [selectedFilter, setSelectedFilter] = useState('pending_review');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTourType, setSelectedTourType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTour, setSelectedTour] = useState(null);
  const [processingAction, setProcessingAction] = useState(null);
  
  // Real state management
  const [tours, setTours] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [stats, setStats] = useState({
    pending: 0,
    active: 0,
    rejected: 0,
    total: 0,
    packages: 0,
    dayTrips: 0
  });

  // Helper function to normalize tourType (treat missing as day_trip)
  const normalizeTourType = (tourType) => {
    return tourType || 'day_trip';
  };

  // Helper function to get correct duration display
  const getDurationDisplay = (tour) => {
    const normalizedType = normalizeTourType(tour.tourType);
    if (normalizedType === 'package') {
      const days = tour.packageDetails?.totalDays || tour.duration || 1;
      return `${days} ${days === 1 ? 'day' : 'days'}`;
    } else {
      const hours = tour.duration || 1;
      return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
    }
  };

  // Fetch tours with tourType filter
  const fetchTours = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      
      const filters = {
        status: selectedFilter === 'all' ? undefined : selectedFilter,
        category: selectedCategory === 'all' ? undefined : selectedCategory,
        tourType: selectedTourType === 'all' ? undefined : selectedTourType,
        search: searchTerm || undefined,
        page: 1,
        limit: 50
      };

      // Remove undefined values
      Object.keys(filters).forEach(key => filters[key] === undefined && delete filters[key]);

      const response = await apiService.getTours(filters);
      
      setTours(response.data.tours);
      setPagination(response.data.pagination);
      
      // Calculate enhanced stats including tour types (with normalization)
      const allTours = response.data.tours;
      setStats({
        pending: allTours.filter(t => t.status === 'pending_review').length,
        active: allTours.filter(t => t.status === 'active').length,
        rejected: allTours.filter(t => t.status === 'rejected').length,
        total: allTours.length,
        packages: allTours.filter(t => normalizeTourType(t.tourType) === 'package').length,
        dayTrips: allTours.filter(t => normalizeTourType(t.tourType) === 'day_trip').length
      });
      
      setError(null);
    } catch (error) {
      console.error('Error fetching tours:', error);
      setError('Failed to load tours. Please try again.');
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  // Initial load and filter updates
  useEffect(() => {
    fetchTours(true);
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchTours(false);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [selectedFilter, selectedCategory, selectedTourType, searchTerm]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'pending_review':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'paused':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'archived':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'draft':
        return <DocumentTextIcon className="w-4 h-4" />;
      case 'pending_review':
        return <ClockIcon className="w-4 h-4" />;
      case 'active':
        return <CheckCircleIcon className="w-4 h-4" />;
      case 'paused':
        return <PauseCircleIcon className="w-4 h-4" />;
      case 'rejected':
        return <XCircleIcon className="w-4 h-4" />;
      case 'archived':
        return <ArchiveBoxIcon className="w-4 h-4" />;
      default:
        return <InformationCircleIcon className="w-4 h-4" />;
    }
  };

  const getTourTypeDisplay = (tourType) => {
    const normalizedType = normalizeTourType(tourType);
    switch (normalizedType) {
      case 'package':
        return {
          icon: <BriefcaseIcon className="w-4 h-4" />,
          color: 'bg-purple-100 text-purple-800 border-purple-200',
          label: 'Package'
        };
      case 'day_trip':
        return {
          icon: <ClockIcon className="w-4 h-4" />,
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          label: 'Day Trip'
        };
      default:
        return {
          icon: <MapIcon className="w-4 h-4" />,
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          label: 'Tour'
        };
    }
  };

  const filteredTours = tours;

  const handleAction = async (tourId, action, data = {}) => {
    setProcessingAction(tourId);
  
    try {
      // 1. Call backend first
      await apiService.updateTourStatus(tourId, action, data.reviewNotes);
  
      // 2. Clear caches
      apiService.invalidateCache('/admin/tours');
      apiService.invalidateCache('/admin/verifications');
      apiService.invalidateCache('/admin/analytics');
  
      // 3. Close modal
      setSelectedTour(null);
      
      // 4. Show loading state and fetch fresh data
      setLoading(true);
      
      // 5. Wait a bit for backend to process, then fetch
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // 6. Fetch fresh data - this will update both tours and stats correctly
      await fetchTours(true);
      
      // 7. Show success message AFTER refresh completes
      alert(`Tour status changed to ${action} successfully!`);
  
      // 8. Trigger window event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('tourStatusChanged', {
          detail: { tourId, oldStatus: null, newStatus: action }
        }));
      }
  
    } catch (error) {
      console.error(`Error updating tour status:`, error);
      alert(`Failed to update tour status. Please try again.`);
      fetchTours(true);
    } finally {
      setProcessingAction(null);
      setLoading(false);
    }
  };

  const handleDeleteTour = async (tourId, deleteReason) => {
    setProcessingAction(tourId);
    try {
      await apiService.deleteTour(tourId, deleteReason);
      
      // Remove tour from state
      setTours(prevTours => prevTours.filter(tour => tour._id !== tourId));
      
      // Update stats
      setStats(prevStats => {
        const newStats = { ...prevStats };
        const tour = tours.find(t => t._id === tourId);
        
        if (tour) {
          newStats.total = Math.max(0, newStats.total - 1);
          
          if (tour.status === 'pending_review') newStats.pending = Math.max(0, newStats.pending - 1);
          else if (tour.status === 'active') newStats.active = Math.max(0, newStats.active - 1);
          else if (tour.status === 'rejected') newStats.rejected = Math.max(0, newStats.rejected - 1);
          
          const normalizedType = normalizeTourType(tour.tourType);
          if (normalizedType === 'package') newStats.packages = Math.max(0, newStats.packages - 1);
          else newStats.dayTrips = Math.max(0, newStats.dayTrips - 1);
        }
        
        return newStats;
      });
      
      setSelectedTour(null);
      alert('Tour deleted successfully!');
      
      // Refresh tours list
      setTimeout(() => {
        fetchTours(false);
      }, 500);
      
    } catch (error) {
      console.error('Error deleting tour:', error);
      alert(error.message || 'Failed to delete tour. Please try again.');
    } finally {
      setProcessingAction(null);
    }
  };

  const viewDetails = async (tour) => {
    setSelectedTour(tour);
  };

  // Tour Modal with comprehensive tour information
  const TourModal = ({ tour, onClose }) => {
    const [actionNotes, setActionNotes] = useState('');
    const [selectedStatus, setSelectedStatus] = useState(tour.status);
    const [statusReason, setStatusReason] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteReason, setDeleteReason] = useState('');

    const allStatuses = [
      { value: 'draft', label: 'Draft', color: 'text-gray-600', description: 'Tour is in draft mode' },
      { value: 'pending_review', label: 'Pending Review', color: 'text-orange-600', description: 'Waiting for admin review' },
      { value: 'active', label: 'Active', color: 'text-green-600', description: 'Live and accepting bookings' },
      { value: 'paused', label: 'Paused', color: 'text-blue-600', description: 'Temporarily unavailable' },
      { value: 'rejected', label: 'Rejected', color: 'text-red-600', description: 'Rejected and needs changes' },
      { value: 'archived', label: 'Archived', color: 'text-purple-600', description: 'Permanently disabled' }
    ];

    const handleStatusChange = () => {
      if (selectedStatus === tour.status) {
        alert('Please select a different status to update.');
        return;
      }

      const requiresReason = ['rejected', 'paused', 'archived'];
      if (requiresReason.includes(selectedStatus) && !statusReason.trim()) {
        alert(`Please provide a reason for changing status to ${selectedStatus}.`);
        return;
      }

      const notes = statusReason.trim() || actionNotes.trim() || `Status changed to ${selectedStatus} by admin`;
      handleAction(tour._id, selectedStatus, { reviewNotes: notes });
    };

    const handleConfirmDelete = () => {
      if (!deleteReason.trim()) {
        alert('Please provide a reason for deleting this tour.');
        return;
      }
      handleDeleteTour(tour._id, deleteReason);
      setShowDeleteConfirm(false);
      setDeleteReason('');
    };

    const tourTypeDisplay = getTourTypeDisplay(tour.tourType);
    const normalizedType = normalizeTourType(tour.tourType);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
        <div className="bg-white rounded-2xl sm:rounded-3xl max-w-7xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white p-4 sm:p-6 border-b border-gray-200 z-10">
            <div className="flex items-center justify-between">
              <h2 className="text-lg sm:text-2xl font-bold text-gray-900 truncate" style={{ fontFamily: 'Jost, sans-serif' }}>
                Tour Management
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-xl sm:text-2xl flex-shrink-0"
              >
                ×
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            {/* Tour Header with Tour Type */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl sm:rounded-2xl p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start justify-between mb-4 space-y-4 sm:space-y-0">
                <div className="flex-1 min-w-0 w-full">
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 break-words" style={{ fontFamily: 'Jost, sans-serif' }}>
                    {tour.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3">
                    <span className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium border ${getStatusColor(tour.status)}`}>
                      {getStatusIcon(tour.status)}
                      <span className="ml-1 capitalize">{tour.status.replace('_', ' ')}</span>
                    </span>
                    <span className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium border ${tourTypeDisplay.color}`}>
                      {tourTypeDisplay.icon}
                      <span className="ml-1">{tourTypeDisplay.label}</span>
                    </span>
                    {tour.category && (
                      <span className="bg-purple-100 text-purple-800 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
                        {tour.category}
                      </span>
                    )}
                    <div className="flex items-center bg-white px-2 sm:px-3 py-1 rounded-full">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      <span className="text-xs sm:text-sm font-medium">{tour.completionPercentage || 0}% Complete</span>
                    </div>
                  </div>
                </div>
                <div className="text-left sm:text-right flex-shrink-0">
                  <div className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1" style={{ fontFamily: 'Jost, sans-serif' }}>
                    ${tour.pricePerPerson}
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600">
                    {normalizedType === 'package' ? 'per package' : 'per person'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 text-xs sm:text-sm">
                <div className="flex items-center text-gray-600">
                  <ClockIcon className="w-4 h-4 mr-2" />
                  {getDurationDisplay(tour)}
                </div>
                {tour.maxGroupSize && (
                  <div className="flex items-center text-gray-600">
                    <UsersIcon className="w-4 h-4 mr-2" />
                    Max {tour.maxGroupSize}
                  </div>
                )}
                {tour.languages?.length > 0 && (
                  <div className="flex items-center text-gray-600">
                    <LanguageIcon className="w-4 h-4 mr-2" />
                    {tour.languages.join(', ')}
                  </div>
                )}
                {tour.availability && (
                  <div className="flex items-center text-gray-600">
                    <CalendarDaysIcon className="w-4 h-4 mr-2" />
                    {tour.availability.type === 'recurring' 
                      ? `${tour.availability.days?.length || 0} days/week`
                      : `${tour.availability.startDates?.length || 0} start dates`
                    }
                  </div>
                )}
              </div>
            </div>

            {/* Guide Information */}
            <div className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl p-4 sm:p-6">
              <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-4" style={{ fontFamily: 'Jost, sans-serif' }}>
                Tour Guide
              </h4>
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0">
                  <span className="text-white font-bold text-sm sm:text-base">
                    {tour.guideId?.fullName?.split(' ').map(n => n[0]).join('') || 'G'}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900 text-sm sm:text-base truncate" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    {tour.guideId?.fullName || 'Guide Name'}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600 truncate">{tour.guideId?.email}</p>
                  <div className="flex items-center mt-1">
                    <MapPinIcon className="w-4 h-4 text-gray-500 mr-1" />
                    <span className="text-sm text-gray-600">{tour.guideId?.city}</span>
                    {tour.guideId?.rating > 0 && (
                      <>
                        <StarIcon className="w-4 h-4 text-yellow-500 ml-3 mr-1" />
                        <span className="text-sm text-gray-600">{tour.guideId.rating} ({tour.guideId.totalReviews || 0})</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Location Information */}
            {tour.location && (tour.location.country || tour.location.city) && (
              <div className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-3" style={{ fontFamily: 'Jost, sans-serif' }}>
                  Location Details
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {tour.location.country && (
                    <div className="flex items-center">
                      <GlobeAltIcon className="w-5 h-5 text-gray-500 mr-2" />
                      <div>
                        <p className="text-sm text-gray-600">Country</p>
                        <p className="font-medium">{tour.location.country}</p>
                      </div>
                    </div>
                  )}
                  {tour.location.city && (
                    <div className="flex items-center">
                      <BuildingOfficeIcon className="w-5 h-5 text-gray-500 mr-2" />
                      <div>
                        <p className="text-sm text-gray-600">City</p>
                        <p className="font-medium">{tour.location.city}</p>
                      </div>
                    </div>
                  )}
                  {tour.location.area && (
                    <div className="flex items-center">
                      <MapPinIcon className="w-5 h-5 text-gray-500 mr-2" />
                      <div>
                        <p className="text-sm text-gray-600">Area</p>
                        <p className="font-medium">{tour.location.area}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tour Description */}
            <div className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl p-4 sm:p-6">
              <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-3" style={{ fontFamily: 'Jost, sans-serif' }}>
                Description
              </h4>
              <p className="text-sm sm:text-base text-gray-700 leading-relaxed" style={{ fontFamily: 'Poppins, sans-serif' }}>
                {tour.description}
              </p>
            </div>

            {/* Availability Information */}
            {tour.availability && (
              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <h4 className="text-lg font-bold text-gray-900 mb-4" style={{ fontFamily: 'Jost, sans-serif' }}>
                  Availability
                </h4>
                {tour.availability.type === 'recurring' ? (
                  <div className="space-y-4">
                    {tour.availability.days?.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Available Days</p>
                        <div className="flex flex-wrap gap-2">
                          {tour.availability.days.map((day, index) => (
                            <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                              {day}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {tour.availability.timeSlots?.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Time Slots</p>
                        <div className="flex flex-wrap gap-2">
                          {tour.availability.timeSlots.map((slot, index) => (
                            <span key={index} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                              {slot}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Package Start Dates</p>
                    {tour.availability.startDates?.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {tour.availability.startDates.map((date, index) => (
                          <span key={index} className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                            {new Date(date).toLocaleDateString()}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 italic">No start dates specified</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Package Details Section (Only for Package Tours) */}
            {normalizedType === 'package' && tour.packageDetails && (
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-4" style={{ fontFamily: 'Jost, sans-serif' }}>
                  Package Details
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {/* Duration & Accommodation */}
                  <div className="space-y-4">
                    <div className="bg-white rounded-xl p-4 border border-purple-200">
                      <div className="flex items-center mb-2">
                        <CalendarIcon className="w-5 h-5 text-purple-600 mr-2" />
                        <h5 className="font-semibold text-gray-900">Duration</h5>
                      </div>
                      <p className="text-2xl font-bold text-purple-600">{tour.packageDetails.totalDays} Days</p>
                      {tour.packageDetails.accommodationSummary?.totalNights && (
                        <p className="text-sm text-gray-600">{tour.packageDetails.accommodationSummary.totalNights} Nights</p>
                      )}
                    </div>

                    {tour.packageDetails.accommodationSummary && (
                      <div className="bg-white rounded-xl p-4 border border-purple-200">
                        <div className="flex items-center mb-2">
                          <HomeIcon className="w-5 h-5 text-purple-600 mr-2" />
                          <h5 className="font-semibold text-gray-900">Accommodation</h5>
                        </div>
                        <p className="text-sm text-gray-700">{tour.packageDetails.accommodationSummary.hotelStandard}</p>
                        <p className="text-sm text-gray-600">{tour.packageDetails.accommodationSummary.roomSharing} Occupancy</p>
                      </div>
                    )}
                  </div>

                  {/* Meals & Transportation */}
                  <div className="space-y-4">
                    {tour.packageDetails.mealPlan && (
                      <div className="bg-white rounded-xl p-4 border border-purple-200">
                        <div className="flex items-center mb-2">
                          <BeakerIcon className="w-5 h-5 text-purple-600 mr-2" />
                          <h5 className="font-semibold text-gray-900">Meal Plan</h5>
                        </div>
                        <p className="text-sm text-gray-700">{tour.packageDetails.mealPlan}</p>
                      </div>
                    )}

                    {tour.packageDetails.transportation && (
                      <div className="bg-white rounded-xl p-4 border border-purple-200">
                        <div className="flex items-center mb-2">
                          <TruckIcon className="w-5 h-5 text-purple-600 mr-2" />
                          <h5 className="font-semibold text-gray-900">Transportation</h5>
                        </div>
                        <p className="text-sm text-gray-700">{tour.packageDetails.transportation.transportType}</p>
                        {tour.packageDetails.transportation.flightsIncluded && (
                          <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded text-xs mt-1">
                            Flights Included
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Booking Policy */}
                  <div className="space-y-4">
                    {tour.packageDetails.bookingPolicy && (
                      <div className="bg-white rounded-xl p-4 border border-purple-200">
                        <div className="flex items-center mb-2">
                          <DocumentTextIcon className="w-5 h-5 text-purple-600 mr-2" />
                          <h5 className="font-semibold text-gray-900">Booking Policy</h5>
                        </div>
                        <p className="text-sm text-gray-700">
                          Book {tour.packageDetails.bookingPolicy.advanceBookingDays} days in advance
                        </p>
                        <p className="text-sm text-gray-600">
                          {tour.packageDetails.bookingPolicy.cancellationPolicy} cancellation
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Package Inclusions & Exclusions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  {tour.packageDetails.packageInclusions?.length > 0 && (
                    <div className="bg-white rounded-xl p-4 border border-green-200">
                      <h5 className="font-semibold text-green-800 mb-3 flex items-center">
                        <CheckCircleIcon className="w-5 h-5 mr-2" />
                        Inclusions
                      </h5>
                      <div className="space-y-1">
                        {tour.packageDetails.packageInclusions.map((inclusion, index) => (
                          <div key={index} className="flex items-center text-sm text-green-700">
                            <CheckCircleIcon className="w-4 h-4 mr-2 text-green-500" />
                            {inclusion}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {tour.packageDetails.packageExclusions?.length > 0 && (
                    <div className="bg-white rounded-xl p-4 border border-red-200">
                      <h5 className="font-semibold text-red-800 mb-3 flex items-center">
                        <XCircleIcon className="w-5 h-5 mr-2" />
                        Exclusions
                      </h5>
                      <div className="space-y-1">
                        {tour.packageDetails.packageExclusions.map((exclusion, index) => (
                          <div key={index} className="flex items-center text-sm text-red-700">
                            <XCircleIcon className="w-4 h-4 mr-2 text-red-500" />
                            {exclusion}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Day-wise Itinerary */}
                {tour.packageDetails.dayWiseItinerary?.length > 0 && (
                  <div className="mt-6">
                    <h5 className="font-semibold text-gray-900 mb-4 flex items-center">
                      <BookOpenIcon className="w-5 h-5 mr-2" />
                      Day-wise Itinerary
                    </h5>
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {tour.packageDetails.dayWiseItinerary.map((day, index) => (
                        <div key={index} className="bg-white rounded-lg p-4 border border-gray-200">
                          <div className="flex items-center justify-between mb-2">
                            <h6 className="font-medium text-gray-900">Day {day.day}: {day.title}</h6>
                            <div className="flex space-x-2">
                              {day.meals?.breakfast && (
                                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">B</span>
                              )}
                              {day.meals?.lunch && (
                                <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs">L</span>
                              )}
                              {day.meals?.dinner && (
                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">D</span>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-gray-600">{day.description}</p>
                          {day.accommodation?.provided && (
                            <div className="mt-2 text-xs text-gray-500">
                              <HomeIcon className="w-4 h-4 inline mr-1" />
                              {day.accommodation.hotelName} ({day.accommodation.roomType})
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Meeting Point Information */}
            {tour.meetingPoint && (tour.meetingPoint.name || tour.meetingPoint.instructions) && (
              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <h4 className="text-lg font-bold text-gray-900 mb-4" style={{ fontFamily: 'Jost, sans-serif' }}>
                  Meeting Point
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tour.meetingPoint.name && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Meeting Location</p>
                      <p className="font-medium text-gray-900">{tour.meetingPoint.name}</p>
                    </div>
                  )}
                  {tour.meetingPoint.instructions && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Instructions</p>
                      <p className="text-gray-700">{tour.meetingPoint.instructions}</p>
                    </div>
                  )}
                  {tour.meetingPoint.returnLocation && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Return Location</p>
                      <p className="text-gray-700">{tour.meetingPoint.returnLocation}</p>
                    </div>
                  )}
                  {tour.meetingPoint.coordinates && (tour.meetingPoint.coordinates.lat !== 0 || tour.meetingPoint.coordinates.lng !== 0) && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Coordinates</p>
                      <p className="text-gray-700">
                        {tour.meetingPoint.coordinates.lat}, {tour.meetingPoint.coordinates.lng}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tour Features */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h4 className="text-lg font-bold text-gray-900 mb-4" style={{ fontFamily: 'Jost, sans-serif' }}>
                Tour Features
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`p-4 rounded-xl border-2 ${tour.isHalalCertified ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                  <div className="flex items-center">
                    <ShieldCheckIcon className={`w-5 h-5 mr-2 ${tour.isHalalCertified ? 'text-green-600' : 'text-gray-400'}`} />
                    <span className="font-medium">Halal Certified</span>
                  </div>
                </div>
                <div className={`p-4 rounded-xl border-2 ${tour.includesPrayerBreaks ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-gray-50'}`}>
                  <div className="flex items-center">
                    <ClockIcon className={`w-5 h-5 mr-2 ${tour.includesPrayerBreaks ? 'text-blue-600' : 'text-gray-400'}`} />
                    <span className="font-medium">Prayer Breaks</span>
                  </div>
                </div>
                <div className={`p-4 rounded-xl border-2 ${tour.femaleGuideAvailable ? 'border-pink-200 bg-pink-50' : 'border-gray-200 bg-gray-50'}`}>
                  <div className="flex items-center">
                    <UsersIcon className={`w-5 h-5 mr-2 ${tour.femaleGuideAvailable ? 'text-pink-600' : 'text-gray-400'}`} />
                    <span className="font-medium">Female Guide Available</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Inclusions for Day Trips */}
            {normalizedType === 'day_trip' && tour.inclusions?.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <h4 className="text-lg font-bold text-gray-900 mb-4" style={{ fontFamily: 'Jost, sans-serif' }}>
                  Tour Inclusions
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {tour.inclusions.map((inclusion, index) => (
                    <div key={index} className="flex items-center text-sm text-green-700">
                      <CheckCircleIcon className="w-4 h-4 mr-2 text-green-500" />
                      {inclusion}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Additional Information */}
            {tour.additionalInfo && (
              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <h4 className="text-lg font-bold text-gray-900 mb-4" style={{ fontFamily: 'Jost, sans-serif' }}>
                  Additional Information
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* What to Bring */}
                  {tour.additionalInfo.whatToBring?.length > 0 && (
                    <div>
                      <h5 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <BriefcaseIcon className="w-5 h-5 mr-2 text-blue-600" />
                        What to Bring
                      </h5>
                      <div className="space-y-1">
                        {tour.additionalInfo.whatToBring.map((item, index) => (
                          <div key={index} className="flex items-center text-sm text-gray-700">
                            <TagIcon className="w-4 h-4 mr-2 text-blue-500" />
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Important Notes */}
                  {tour.additionalInfo.importantNotes?.length > 0 && (
                    <div>
                      <h5 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <ExclamationTriangleIcon className="w-5 h-5 mr-2 text-orange-600" />
                        Important Notes
                      </h5>
                      <div className="space-y-1">
                        {tour.additionalInfo.importantNotes.map((note, index) => (
                          <div key={index} className="flex items-start text-sm text-gray-700">
                            <LightBulbIcon className="w-4 h-4 mr-2 text-orange-500 mt-0.5" />
                            {note}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Emergency Contact */}
                {tour.additionalInfo.emergencyContact && (tour.additionalInfo.emergencyContact.name || tour.additionalInfo.emergencyContact.phone) && (
                  <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-4">
                    <h5 className="font-semibold text-red-900 mb-2 flex items-center">
                      <PhoneIcon className="w-5 h-5 mr-2" />
                      Emergency Contact
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {tour.additionalInfo.emergencyContact.name && (
                        <div>
                          <p className="text-sm text-red-700">Name</p>
                          <p className="font-medium text-red-900">{tour.additionalInfo.emergencyContact.name}</p>
                        </div>
                      )}
                      {tour.additionalInfo.emergencyContact.phone && (
                        <div>
                          <p className="text-sm text-red-700">Phone</p>
                          <p className="font-medium text-red-900">{tour.additionalInfo.emergencyContact.phone}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Detailed Itinerary for Day Trips */}
                {tour.additionalInfo.detailedItinerary?.length > 0 && (
                  <div className="mt-6">
                    <h5 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <ClockIcon className="w-5 h-5 mr-2 text-indigo-600" />
                      Detailed Itinerary
                    </h5>
                    <div className="space-y-3 max-h-40 overflow-y-auto">
                      {tour.additionalInfo.detailedItinerary.map((item, index) => (
                        <div key={index} className="flex items-start bg-gray-50 rounded-lg p-3">
                          <div className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded text-xs font-medium mr-3 mt-0.5">
                            {item.time}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{item.title}</p>
                            {item.description && (
                              <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                            )}
                            {item.type && (
                              <span className="inline-block bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs mt-1">
                                {item.type}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Status Management Section */}
            <div className="bg-gray-50 rounded-xl sm:rounded-2xl p-4 sm:p-6">
              <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-4" style={{ fontFamily: 'Jost, sans-serif' }}>
                Status Management
              </h4>
              
              <div className="mb-6 p-4 bg-white rounded-xl border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Current Status</p>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(tour.status)}`}>
                      {getStatusIcon(tour.status)}
                      <span className="ml-1 capitalize">{tour.status.replace('_', ' ')}</span>
                    </span>
                  </div>
                  {tour.reviewedAt && (
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Last Updated</p>
                      <p className="text-xs text-gray-500">
                        {new Date(tour.reviewedAt).toLocaleDateString()} at {new Date(tour.reviewedAt).toLocaleTimeString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    Change Status To
                  </label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full p-2.5 sm:p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm sm:text-base"
                    style={{ fontFamily: 'Poppins, sans-serif' }}
                  >
                    {allStatuses.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                  {selectedStatus && selectedStatus !== tour.status && (
                    <p className="mt-2 text-xs sm:text-sm text-gray-600">
                      {allStatuses.find(s => s.value === selectedStatus)?.description}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    Admin Notes (Optional)
                  </label>
                  <textarea
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    className="w-full p-2.5 sm:p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm sm:text-base"
                    rows="3"
                    placeholder="Add any general notes about this tour or status change..."
                    style={{ fontFamily: 'Poppins, sans-serif' }}
                  />
                </div>

                {(['rejected', 'paused', 'archived'].includes(selectedStatus) && selectedStatus !== tour.status) && (
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-red-700 mb-2">
                      Reason for {selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1)} (Required)
                    </label>
                    <textarea
                      value={statusReason}
                      onChange={(e) => setStatusReason(e.target.value)}
                      className="w-full p-2.5 sm:p-3 border border-red-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm sm:text-base"
                      rows="3"
                      placeholder={`Explain why this tour is being ${selectedStatus}...`}
                      style={{ fontFamily: 'Poppins, sans-serif' }}
                      required
                    />
                  </div>
                )}

                {selectedStatus !== tour.status && (
                  <button
                    onClick={handleStatusChange}
                    disabled={processingAction === tour._id}
                    className={`w-full py-2.5 sm:py-3 px-4 sm:px-6 rounded-xl font-semibold transition-colors disabled:opacity-50 text-sm sm:text-base ${
                      selectedStatus === 'active'
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : selectedStatus === 'rejected'
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : selectedStatus === 'paused'
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : selectedStatus === 'archived'
                        ? 'bg-purple-600 hover:bg-purple-700 text-white'
                        : 'bg-gray-600 hover:bg-gray-700 text-white'
                    }`}
                    style={{ fontFamily: 'Poppins, sans-serif' }}
                  >
                    {processingAction === tour._id ? 'Processing...' : `Change Status to ${selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1)}`}
                  </button>
                )}

                {selectedStatus === tour.status && (
                  <div className="text-center py-3">
                    <p className="text-xs sm:text-sm text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      Select a different status to make changes
                    </p>
                  </div>
                )}
              </div>

              {(tour.adminReview?.reviewNotes || tour.reviewNotes || tour.rejectionReason) && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <h5 className="text-sm font-medium text-blue-900 mb-2">Previous Admin Notes:</h5>
                  <p className="text-sm text-blue-800">
                    {tour.adminReview?.reviewNotes || tour.reviewNotes || tour.rejectionReason}
                  </p>
                </div>
              )}
            </div>

            {/* DELETE TOUR SECTION - DANGER ZONE */}
            <div className="bg-red-50 border-2 border-red-200 rounded-xl sm:rounded-2xl p-4 sm:p-6">
              <div className="flex items-start">
                <ExclamationTriangleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 mr-2 sm:mr-3 mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h4 className="text-base sm:text-lg font-bold text-red-900 mb-2" style={{ fontFamily: 'Jost, sans-serif' }}>
                    Danger Zone
                  </h4>
                  <p className="text-xs sm:text-sm text-red-700 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Permanently delete this tour from the system. This action cannot be undone and will remove all associated data including bookings history, reviews, and analytics.
                  </p>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex items-center px-3 sm:px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors text-sm sm:text-base"
                    style={{ fontFamily: 'Poppins, sans-serif' }}
                  >
                    <TrashIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    Delete Tour Permanently
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center p-2 sm:p-4 z-10">
            <div className="bg-white rounded-xl sm:rounded-2xl max-w-md w-full p-4 sm:p-6">
              <div className="text-center mb-4 sm:mb-6">
                <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-red-100 rounded-full flex items-center justify-center mb-3 sm:mb-4">
                  <TrashIcon className="w-6 h-6 sm:w-8 sm:h-8 text-red-600" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Jost, sans-serif' }}>
                  Delete Tour Permanently?
                </h3>
                <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  You are about to permanently delete:
                </p>
                <p className="font-semibold text-sm sm:text-base text-gray-900 mb-2 break-words">"{tour.title}"</p>
                <div className="bg-red-50 border border-red-200 rounded-lg p-2 sm:p-3 mb-3 sm:mb-4">
                  <p className="text-xs sm:text-sm text-red-800">
                    <strong>Warning:</strong> This will delete all tour data, bookings, and cannot be recovered.
                  </p>
                </div>
              </div>

              <div className="mb-4 sm:mb-6">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Deletion Reason (Required) <span className="text-red-600">*</span>
                </label>
                <textarea
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  className="w-full p-2.5 sm:p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm sm:text-base"
                  rows="4"
                  placeholder="Explain why this tour is being permanently deleted. This reason will be sent to the tour guide."
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                />
                {deleteReason.trim() && (
                  <p className="mt-2 text-xs text-gray-600">
                    {deleteReason.trim().length} characters
                  </p>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteReason('');
                  }}
                  className="flex-1 py-2.5 sm:py-3 px-4 sm:px-6 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-xl font-semibold transition-colors text-sm sm:text-base"
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={processingAction === tour._id || !deleteReason.trim()}
                  className="flex-1 py-2.5 sm:py-3 px-4 sm:px-6 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                >
                  {processingAction === tour._id ? 'Deleting...' : 'Yes, Delete Tour'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-700">{error}</p>
        <button
          onClick={() => fetchTours(true)}
          className="mt-4 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-xl"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-3xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'Jost, sans-serif' }}>
              Tours Management
            </h1>
            <p className="text-white/90" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Review, approve, and manage tour submissions from guides
            </p>
          </div>
          <MapIcon className="w-16 h-16 text-white/80" />
        </div>
      </div>

      {/* Stats Cards with Tour Type Information */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 lg:gap-6">
        <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100">
          <div className="flex items-center">
            <div className="bg-orange-100 p-2 sm:p-3 rounded-lg sm:rounded-xl flex-shrink-0">
              <ClockIcon className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
            </div>
            <div className="ml-3 sm:ml-4 min-w-0">
              <p className="text-xl sm:text-2xl font-bold text-gray-900 truncate" style={{ fontFamily: 'Jost, sans-serif' }}>
                {stats.pending}
              </p>
              <p className="text-xs sm:text-sm text-gray-600">Pending Review</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100">
          <div className="flex items-center">
            <div className="bg-green-100 p-2 sm:p-3 rounded-lg sm:rounded-xl flex-shrink-0">
              <CheckCircleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
            </div>
            <div className="ml-3 sm:ml-4 min-w-0">
              <p className="text-xl sm:text-2xl font-bold text-gray-900 truncate" style={{ fontFamily: 'Jost, sans-serif' }}>
                {stats.active}
              </p>
              <p className="text-xs sm:text-sm text-gray-600">Active Tours</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100">
          <div className="flex items-center">
            <div className="bg-red-100 p-2 sm:p-3 rounded-lg sm:rounded-xl flex-shrink-0">
              <XCircleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
            </div>
            <div className="ml-3 sm:ml-4 min-w-0">
              <p className="text-xl sm:text-2xl font-bold text-gray-900 truncate" style={{ fontFamily: 'Jost, sans-serif' }}>
                {stats.rejected}
              </p>
              <p className="text-xs sm:text-sm text-gray-600">Rejected</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100">
          <div className="flex items-center">
            <div className="bg-blue-100 p-2 sm:p-3 rounded-lg sm:rounded-xl flex-shrink-0">
              <MapIcon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            </div>
            <div className="ml-3 sm:ml-4 min-w-0">
              <p className="text-xl sm:text-2xl font-bold text-gray-900 truncate" style={{ fontFamily: 'Jost, sans-serif' }}>
                {stats.total}
              </p>
              <p className="text-xs sm:text-sm text-gray-600">Total Tours</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100">
          <div className="flex items-center">
            <div className="bg-purple-100 p-2 sm:p-3 rounded-lg sm:rounded-xl flex-shrink-0">
              <BriefcaseIcon className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
            </div>
            <div className="ml-3 sm:ml-4 min-w-0">
              <p className="text-xl sm:text-2xl font-bold text-gray-900 truncate" style={{ fontFamily: 'Jost, sans-serif' }}>
                {stats.packages}
              </p>
              <p className="text-xs sm:text-sm text-gray-600">Packages</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100">
          <div className="flex items-center">
            <div className="bg-indigo-100 p-2 sm:p-3 rounded-lg sm:rounded-xl flex-shrink-0">
              <ClockIcon className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
            </div>
            <div className="ml-3 sm:ml-4 min-w-0">
              <p className="text-xl sm:text-2xl font-bold text-gray-900 truncate" style={{ fontFamily: 'Jost, sans-serif' }}>
                {stats.dayTrips}
              </p>
              <p className="text-xs sm:text-sm text-gray-600">Day Trips</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search with Tour Type Filter */}
      <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100">
        <div className="flex flex-col gap-4">
          {/* Search Bar - Full Width on Mobile */}
          <div className="relative w-full">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search tours..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 sm:py-2 bg-gray-100 border-0 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all duration-200 text-sm sm:text-base"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            />
          </div>

          {/* Filters - Stack on Mobile, Grid on Larger Screens */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="w-full bg-gray-100 border-0 rounded-xl py-2.5 sm:py-2 px-3 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all duration-200 text-sm sm:text-base"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              <option value="all">All Status</option>
              <option value="pending_review">Pending Review</option>
              <option value="active">Active</option>
              <option value="rejected">Rejected</option>
              <option value="draft">Draft</option>
              <option value="paused">Paused</option>
              <option value="archived">Archived</option>
            </select>

            <select
              value={selectedTourType}
              onChange={(e) => setSelectedTourType(e.target.value)}
              className="w-full bg-gray-100 border-0 rounded-xl py-2.5 sm:py-2 px-3 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all duration-200 text-sm sm:text-base"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              <option value="all">All Types</option>
              <option value="day_trip">Day Trips</option>
              <option value="package">Packages</option>
            </select>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-gray-100 border-0 rounded-xl py-2.5 sm:py-2 px-3 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all duration-200 text-sm sm:text-base"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              <option value="all">All Categories</option>
              <option value="Islamic Heritage">Islamic Heritage</option>
              <option value="Food Tours">Food Tours</option>
              <option value="Mosque Architecture">Mosque Architecture</option>
              <option value="Cultural Tours">Cultural Tours</option>
              <option value="Historical Tours">Historical Tours</option>
              <option value="Walking Tours">Walking Tours</option>
              <option value="City Tours">City Tours</option>
            </select>
          </div>

          <button className="flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
            <ArrowDownTrayIcon className="w-5 h-5 mr-2 text-gray-600" />
            <span className="font-medium text-gray-700" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Export
            </span>
          </button>
        </div>
      </div>

      {/* Tours Table with Tour Type Column */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Tour & Guide
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Type & Category
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Price & Duration
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Status
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Submitted
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredTours.map((tour) => {
                const tourTypeDisplay = getTourTypeDisplay(tour.tourType);
                return (
                  <tr key={tour._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-gray-900 mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                          {tour.title}
                        </p>
                        <div className="flex items-center text-sm text-gray-600">
                          <div className="w-6 h-6 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mr-2">
                            <span className="text-white font-bold text-xs">
                              {tour.guideId?.fullName?.split(' ').map(n => n[0]).join('') || 'G'}
                            </span>
                          </div>
                          <span>{tour.guideId?.fullName || 'Guide Name'}</span>
                          <span className="mx-2">•</span>
                          <MapPinIcon className="w-4 h-4 mr-1" />
                          <span>{tour.guideId?.city}</span>
                        </div>
                        <div className="flex items-center mt-2">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full" 
                              style={{ width: `${tour.completionPercentage || 0}%` }}
                            ></div>
                          </div>
                          <span className="text-xs text-gray-500 ml-2">{tour.completionPercentage || 0}%</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-2">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${tourTypeDisplay.color}`}>
                          {tourTypeDisplay.icon}
                          <span className="ml-1">{tourTypeDisplay.label}</span>
                        </span>
                        {tour.category && (
                          <div>
                            <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                              {tour.category}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center mt-2 space-x-2">
                        {tour.isHalalCertified && (
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Halal</span>
                        )}
                        {tour.includesPrayerBreaks && (
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">Prayer</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        ${tour.pricePerPerson}
                      </p>
                      <div className="text-sm text-gray-600 mt-1">
                        <div className="flex items-center">
                          <ClockIcon className="w-4 h-4 mr-1" />
                          {getDurationDisplay(tour)}
                        </div>
                        {tour.maxGroupSize && (
                          <div className="flex items-center">
                            <UsersIcon className="w-4 h-4 mr-1" />
                            Max {tour.maxGroupSize}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(tour.status)}`}>
                        {getStatusIcon(tour.status)}
                        <span className="ml-1 capitalize">{tour.status.replace('_', ' ')}</span>
                      </span>
                      {tour.stats?.averageRating > 0 && (
                        <div className="flex items-center mt-1">
                          <StarIcon className="w-4 h-4 text-yellow-500" />
                          <span className="text-sm text-gray-600 ml-1">
                            {tour.stats.averageRating} ({tour.stats.totalReviews})
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {tour.submittedForReviewAt && (
                        <>
                          <p className="text-sm text-gray-900">
                            {new Date(tour.submittedForReviewAt).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(tour.submittedForReviewAt).toLocaleTimeString()}
                          </p>
                        </>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => viewDetails(tour)}
                        className="flex items-center px-3 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg transition-colors"
                      >
                        <EyeIcon className="w-4 h-4 mr-1" />
                        <span className="text-sm font-medium">Manage</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredTours.length === 0 && (
          <div className="text-center py-12">
            <MapIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
              No tours found matching your criteria
            </p>
          </div>
        )}
      </div>

      {/* Tour Detail Modal */}
      {selectedTour && (
        <TourModal
          tour={selectedTour}
          onClose={() => setSelectedTour(null)}
        />
      )}
    </div>
  );
};

export default ToursManagement;