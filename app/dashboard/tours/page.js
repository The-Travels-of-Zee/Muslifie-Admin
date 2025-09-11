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
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import apiService from '../../../lib/apiService';

const ToursManagement = () => {
  const [selectedFilter, setSelectedFilter] = useState('pending_review');
  const [selectedCategory, setSelectedCategory] = useState('all');
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
    total: 0
  });

  // FIXED: Fetch tours with showLoading parameter
  const fetchTours = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      
      const filters = {
        status: selectedFilter === 'all' ? undefined : selectedFilter,
        category: selectedCategory === 'all' ? undefined : selectedCategory,
        search: searchTerm || undefined,
        page: 1,
        limit: 20
      };

      // Remove undefined values
      Object.keys(filters).forEach(key => filters[key] === undefined && delete filters[key]);

      const response = await apiService.getTours(filters);
      
      setTours(response.data.tours);
      setPagination(response.data.pagination);
      
      // Calculate stats from the tours data
      const allTours = response.data.tours;
      setStats({
        pending: allTours.filter(t => t.status === 'pending_review').length,
        active: allTours.filter(t => t.status === 'active').length,
        rejected: allTours.filter(t => t.status === 'rejected').length,
        total: allTours.length
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

  // Initial load with loading state
  useEffect(() => {
    fetchTours(true);
  }, []);

  // Filter changes without loading state (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchTours(false); // Don't show loading for filter changes
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [selectedFilter, selectedCategory, searchTerm]);

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
      case 'pending_review':
        return <ClockIcon className="w-4 h-4" />;
      case 'active':
        return <CheckCircleIcon className="w-4 h-4" />;
      case 'rejected':
        return <XCircleIcon className="w-4 h-4" />;
      default:
        return <InformationCircleIcon className="w-4 h-4" />;
    }
  };

  const filteredTours = tours; // Already filtered by API

  // FIXED: No full screen reload on actions
  const handleAction = async (tourId, action, data = {}) => {
    setProcessingAction(tourId);
    
    try {
      await apiService.updateTourStatus(tourId, action, data.reviewNotes);
      
      // Update local state instead of full refetch
      setTours(prevTours => 
        prevTours.map(tour => 
          tour._id === tourId 
            ? { ...tour, status: action, adminReview: { reviewNotes: data.reviewNotes } }
            : tour
        )
      );
      
      // Update stats based on the change
      setStats(prevStats => {
        const newStats = { ...prevStats };
        const tour = tours.find(t => t._id === tourId);
        
        if (tour) {
          // Decrease old status count
          if (tour.status === 'pending_review') newStats.pending = Math.max(0, newStats.pending - 1);
          else if (tour.status === 'active') newStats.active = Math.max(0, newStats.active - 1);
          else if (tour.status === 'rejected') newStats.rejected = Math.max(0, newStats.rejected - 1);
          
          // Increase new status count
          if (action === 'active') newStats.active++;
          else if (action === 'rejected') newStats.rejected++;
        }
        
        return newStats;
      });
      
      setSelectedTour(null);
      alert(`Tour ${action}ed successfully!`);
      
      // Background cache refresh without loading state
      setTimeout(() => {
        apiService.getTours({}, { forceRefresh: true }).catch(console.error);
      }, 1000);
      
    } catch (error) {
      console.error(`Error ${action}ing tour:`, error);
      alert(`Failed to ${action} tour. Please try again.`);
    } finally {
      setProcessingAction(null);
    }
  };

  const viewDetails = async (tour) => {
    setSelectedTour(tour);
  };

  const TourModal = ({ tour, onClose }) => {
    const [actionNotes, setActionNotes] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Jost, sans-serif' }}>
                Tour Review
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-2xl"
              >
                ×
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Tour Header */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Jost, sans-serif' }}>
                    {tour.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(tour.status)}`}>
                      {getStatusIcon(tour.status)}
                      <span className="ml-1 capitalize">{tour.status.replace('_', ' ')}</span>
                    </span>
                    <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                      {tour.category}
                    </span>
                    <div className="flex items-center bg-white px-3 py-1 rounded-full">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      <span className="text-sm font-medium">{tour.completionPercentage || 0}% Complete</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-gray-900 mb-1" style={{ fontFamily: 'Jost, sans-serif' }}>
                    ${tour.pricePerPerson}
                  </div>
                  <p className="text-sm text-gray-600">per person</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center text-gray-600">
                  <ClockIcon className="w-4 h-4 mr-2" />
                  {tour.duration} hours
                </div>
                <div className="flex items-center text-gray-600">
                  <UsersIcon className="w-4 h-4 mr-2" />
                  Max {tour.maxGroupSize}
                </div>
                <div className="flex items-center text-gray-600">
                  <LanguageIcon className="w-4 h-4 mr-2" />
                  {tour.languages?.join(', ') || 'Not specified'}
                </div>
                <div className="flex items-center text-gray-600">
                  <CalendarDaysIcon className="w-4 h-4 mr-2" />
                  {tour.availability?.days?.length || 0} days/week
                </div>
              </div>
            </div>

            {/* Guide Information */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h4 className="text-lg font-bold text-gray-900 mb-4" style={{ fontFamily: 'Jost, sans-serif' }}>
                Tour Guide
              </h4>
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mr-4">
                  <span className="text-white font-bold">
                    {tour.guideId?.fullName?.split(' ').map(n => n[0]).join('') || 'G'}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    {tour.guideId?.fullName || 'Guide Name'}
                  </p>
                  <p className="text-sm text-gray-600">{tour.guideId?.email}</p>
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

            {/* Tour Description */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h4 className="text-lg font-bold text-gray-900 mb-3" style={{ fontFamily: 'Jost, sans-serif' }}>
                Description
              </h4>
              <p className="text-gray-700 leading-relaxed" style={{ fontFamily: 'Poppins, sans-serif' }}>
                {tour.description}
              </p>
            </div>

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

            {/* Admin Actions */}
            {tour.status === 'pending_review' && (
              <div className="bg-gray-50 rounded-2xl p-6">
                <h4 className="text-lg font-bold text-gray-900 mb-4" style={{ fontFamily: 'Jost, sans-serif' }}>
                  Review Actions
                </h4>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Notes (Optional)
                  </label>
                  <textarea
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    rows="3"
                    placeholder="Add notes for approval or general feedback..."
                    style={{ fontFamily: 'Poppins, sans-serif' }}
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                  <button
                    onClick={() => handleAction(tour._id, 'active', { reviewNotes: actionNotes })}
                    disabled={processingAction === tour._id}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-xl font-semibold transition-colors disabled:opacity-50"
                    style={{ fontFamily: 'Poppins, sans-serif' }}
                  >
                    {processingAction === tour._id ? 'Processing...' : 'Approve Tour'}
                  </button>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rejection Reason
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent mb-3"
                    rows="2"
                    placeholder="Explain why this tour is being rejected..."
                    style={{ fontFamily: 'Poppins, sans-serif' }}
                  />
                  <button
                    onClick={() => handleAction(tour._id, 'rejected', { reviewNotes: rejectionReason })}
                    disabled={processingAction === tour._id || !rejectionReason.trim()}
                    className="w-full bg-red-600 hover:bg-red-700 text-white py-3 px-6 rounded-xl font-semibold transition-colors disabled:opacity-50"
                    style={{ fontFamily: 'Poppins, sans-serif' }}
                  >
                    {processingAction === tour._id ? 'Processing...' : 'Reject Tour'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center">
            <div className="bg-orange-100 p-3 rounded-xl">
              <ClockIcon className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Jost, sans-serif' }}>
                {stats.pending}
              </p>
              <p className="text-sm text-gray-600">Pending Review</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-xl">
              <CheckCircleIcon className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Jost, sans-serif' }}>
                {stats.active}
              </p>
              <p className="text-sm text-gray-600">Active Tours</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center">
            <div className="bg-red-100 p-3 rounded-xl">
              <XCircleIcon className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Jost, sans-serif' }}>
                {stats.rejected}
              </p>
              <p className="text-sm text-gray-600">Rejected</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-xl">
              <MapIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Jost, sans-serif' }}>
                {stats.total}
              </p>
              <p className="text-sm text-gray-600">Total Tours</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search tours..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-gray-100 border-0 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all duration-200 w-64"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              />
            </div>

            <div className="flex items-center space-x-3">
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="bg-gray-100 border-0 rounded-xl py-2 px-3 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all duration-200"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                <option value="all">All Status</option>
                <option value="pending_review">Pending Review</option>
                <option value="active">Active</option>
                <option value="rejected">Rejected</option>
                <option value="draft">Draft</option>
              </select>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-gray-100 border-0 rounded-xl py-2 px-3 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all duration-200"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                <option value="all">All Categories</option>
                <option value="Islamic Heritage">Islamic Heritage</option>
                <option value="Food Tours">Food Tours</option>
                <option value="Mosque Architecture">Mosque Architecture</option>
                <option value="Cultural Tours">Cultural Tours</option>
              </select>
            </div>
          </div>

          <button className="flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
            <ArrowDownTrayIcon className="w-5 h-5 mr-2 text-gray-600" />
            <span className="font-medium text-gray-700" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Export
            </span>
          </button>
        </div>
      </div>

      {/* Tours Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Tour & Guide
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Category
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
              {filteredTours.map((tour) => (
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
                    <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                      {tour.category}
                    </span>
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
                        {tour.duration}h
                      </div>
                      <div className="flex items-center">
                        <UsersIcon className="w-4 h-4 mr-1" />
                        Max {tour.maxGroupSize}
                      </div>
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
                      <span className="text-sm font-medium">Review</span>
                    </button>
                  </td>
                </tr>
              ))}
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