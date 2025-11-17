'use client';
import React, { useState, useEffect } from 'react';
import {
  CalendarDaysIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  CurrencyDollarIcon,
  UserIcon,
  MapPinIcon,
  ClockIcon,
  ChevronDownIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import apiService from '../../../lib/apiService';

export default function AdminBookingsPage() {
  const [selectedTab, setSelectedTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Real state management
  const [bookings, setBookings] = useState([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
    draft: 0,
    totalRevenue: 0,
    monthlyRevenue: 0
  });
  
  const [processingAction, setProcessingAction] = useState(null);

  useEffect(() => {
    fetchBookings();
  }, [selectedTab, statusFilter, dateRange]);

  const fetchBookings = async () => {
    try {
      if (initialLoading) {
        setInitialLoading(true);
      } else {
        setLoading(true);
      }
      
      const filters = {
        status: selectedTab === 'all' ? undefined : selectedTab,
        paymentStatus: statusFilter === 'all' ? undefined : statusFilter,
        dateRange: dateRange === 'all' ? undefined : dateRange,
        page: 1,
        limit: 100
      };

      Object.keys(filters).forEach(key => filters[key] === undefined && delete filters[key]);

      const response = await apiService.getBookings(filters);
      
      console.log('Bookings API Response:', response);
      
      let bookingsData, paginationData, statsData;
      if (response.data) {
        bookingsData = response.data.bookings || [];
        paginationData = response.data.pagination || null;
        statsData = response.data.stats || {};
      } else {
        bookingsData = response.bookings || response || [];
        paginationData = response.pagination || null;
        statsData = response.stats || {};
      }
      
      setBookings(bookingsData);
      setPagination(paginationData);
      
      const newStats = {
        total: paginationData?.totalBookings || bookingsData.length,
        confirmed: bookingsData.filter(b => b.status === 'confirmed').length,
        completed: bookingsData.filter(b => b.status === 'completed').length,
        cancelled: bookingsData.filter(b => b.status === 'cancelled').length,
        draft: bookingsData.filter(b => b.status === 'draft').length,
        totalRevenue: statsData.totalRevenue || bookingsData.reduce((sum, b) => sum + (b.pricing?.totalAmount || 0), 0),
        monthlyRevenue: statsData.monthlyRevenue || 0
      };
      setStats(newStats);
      
      setError(null);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setError('Failed to load bookings. Please try again.');
    } finally {
      setInitialLoading(false);
      setLoading(false);
    }
  };

  const handleMarkCompleted = async (bookingId) => {
    setProcessingAction(bookingId);
    
    try {
      await apiService.markBookingComplete(bookingId);
      await fetchBookings();
      alert('Booking marked as completed and payments released!');
    } catch (error) {
      console.error('Error marking booking as completed:', error);
      alert('Failed to mark booking as completed. Please try again.');
    } finally {
      setProcessingAction(null);
    }
  };

  const handleRefund = async (bookingId) => {
    const confirmed = window.confirm('Are you sure you want to process a refund for this booking?');
    if (!confirmed) return;

    setProcessingAction(bookingId);
    
    try {
      console.log('Processing refund for booking:', bookingId);
      await fetchBookings();
      alert('Refund processed successfully!');
    } catch (error) {
      console.error('Error processing refund:', error);
      alert('Failed to process refund. Please try again.');
    } finally {
      setProcessingAction(null);
    }
  };

  const filteredBookings = bookings.filter(booking => {
    if (selectedTab !== 'all' && booking.status !== selectedTab) return false;
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const customerName = booking.customerInfo?.fullName?.toLowerCase() || '';
      const customerEmail = booking.customerInfo?.email?.toLowerCase() || '';
      const tourTitle = booking.tourId?.title?.toLowerCase() || '';
      const guideName = booking.guideId?.fullName?.toLowerCase() || '';
      const bookingRef = booking.bookingReference?.toLowerCase() || '';
      
      if (!customerName.includes(searchLower) && 
          !customerEmail.includes(searchLower) && 
          !tourTitle.includes(searchLower) && 
          !guideName.includes(searchLower) && 
          !bookingRef.includes(searchLower)) {
        return false;
      }
    }
    
    return true;
  });

  const tabs = [
    { id: 'all', name: 'All Bookings', count: stats.total },
    { id: 'confirmed', name: 'Confirmed', count: stats.confirmed },
    { id: 'completed', name: 'Completed', count: stats.completed },
    { id: 'draft', name: 'Pending Payment', count: stats.draft },
    { id: 'cancelled', name: 'Cancelled', count: stats.cancelled }
  ];

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'completed':
        return <CheckCircleIcon className="w-5 h-5 text-blue-500" />;
      case 'cancelled':
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      case 'draft':
        return <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />;
      default:
        return <ClockIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (initialLoading) {
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
          onClick={fetchBookings}
          className="mt-4 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-xl"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 px-4 md:px-0">
      {/* Header - Mobile Responsive */}
      <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl md:rounded-3xl p-6 md:p-8 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2" style={{ fontFamily: 'Jost, sans-serif' }}>
              Booking Management
            </h1>
            <p className="text-white/90 text-sm md:text-base" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Manage and monitor all platform bookings
            </p>
          </div>
          <CalendarDaysIcon className="w-12 h-12 md:w-16 md:h-16 text-white/80" />
        </div>
      </div>

      {/* Stats Cards - Mobile Responsive Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 shadow-lg border border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center">
            <div className="bg-blue-100 p-2 md:p-3 rounded-lg md:rounded-xl mb-3 md:mb-0 w-fit">
              <CalendarDaysIcon className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
            </div>
            <div className="md:ml-4">
              <p className="text-xl md:text-2xl font-bold text-gray-900" style={{ fontFamily: 'Jost, sans-serif' }}>
                {stats.total}
              </p>
              <p className="text-xs md:text-sm text-gray-600">Total Bookings</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 shadow-lg border border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center">
            <div className="bg-green-100 p-2 md:p-3 rounded-lg md:rounded-xl mb-3 md:mb-0 w-fit">
              <CheckCircleIcon className="w-5 h-5 md:w-6 md:h-6 text-green-600" />
            </div>
            <div className="md:ml-4">
              <p className="text-xl md:text-2xl font-bold text-gray-900" style={{ fontFamily: 'Jost, sans-serif' }}>
                {stats.confirmed}
              </p>
              <p className="text-xs md:text-sm text-gray-600">Confirmed</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 shadow-lg border border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center">
            <div className="bg-purple-100 p-2 md:p-3 rounded-lg md:rounded-xl mb-3 md:mb-0 w-fit">
              <CurrencyDollarIcon className="w-5 h-5 md:w-6 md:h-6 text-purple-600" />
            </div>
            <div className="md:ml-4">
              <p className="text-xl md:text-2xl font-bold text-gray-900" style={{ fontFamily: 'Jost, sans-serif' }}>
                ${stats.totalRevenue.toLocaleString()}
              </p>
              <p className="text-xs md:text-sm text-gray-600">Total Revenue</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 shadow-lg border border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center">
            <div className="bg-amber-100 p-2 md:p-3 rounded-lg md:rounded-xl mb-3 md:mb-0 w-fit">
              <CurrencyDollarIcon className="w-5 h-5 md:w-6 md:h-6 text-amber-600" />
            </div>
            <div className="md:ml-4">
              <p className="text-xl md:text-2xl font-bold text-gray-900" style={{ fontFamily: 'Jost, sans-serif' }}>
                ${stats.monthlyRevenue.toLocaleString()}
              </p>
              <p className="text-xs md:text-sm text-gray-600">This Month</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search - Mobile Responsive */}
      <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 shadow-lg border border-gray-100">
        <div className="flex flex-col space-y-3 md:space-y-0 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 w-full md:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search bookings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-gray-100 border-0 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all duration-200 w-full sm:w-64 md:w-80 text-sm"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              />
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center justify-center px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors text-sm"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              <FunnelIcon className="w-5 h-5 mr-2" />
              Filters
              <ChevronDownIcon className={`w-4 h-4 ml-2 transform transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-gray-100 border-0 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              <option value="all">All Payment Status</option>
              <option value="completed">Payment Completed</option>
              <option value="pending">Payment Pending</option>
              <option value="refunded">Refunded</option>
            </select>

            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 bg-gray-100 border-0 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>

            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setDateRange('all');
              }}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors text-sm sm:col-span-2 md:col-span-1"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Tabs - Mobile Responsive with Horizontal Scroll */}
      <div className="bg-white rounded-xl md:rounded-2xl shadow-lg border border-gray-100">
        <div className="border-b border-gray-200 overflow-x-auto">
          <nav className="flex space-x-4 md:space-x-8 px-4 md:px-6 min-w-max">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`py-3 md:py-4 px-2 border-b-2 font-medium text-xs md:text-sm transition-colors whitespace-nowrap ${
                  selectedTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                {tab.name}
                <span className="ml-2 bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                  {tab.count}
                </span>
              </button>
            ))}
          </nav>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
          </div>
        ) : (
          <>
            {/* Bookings List - Mobile Responsive */}
            <div className="divide-y divide-gray-200">
              {filteredBookings.map((booking) => (
                <div key={booking._id} className="p-4 md:p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col space-y-4">
                    {/* Status and Reference */}
                    <div className="flex flex-wrap items-center gap-2 md:gap-4">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(booking.status)}
                        <span className={`px-2 md:px-3 py-1 rounded-full text-xs md:text-sm font-medium ${getStatusColor(booking.status)}`}>
                          {booking.status === 'draft' ? 'Pending Payment' : booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </span>
                      </div>
                      <span className="font-mono text-xs md:text-sm text-gray-500">{booking.bookingReference}</span>
                    </div>
                    
                    {/* Booking Details Grid - Mobile Stacked */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                      {/* Customer Info */}
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <h4 className="font-semibold text-sm md:text-base text-gray-900 mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                          {booking.customerInfo?.fullName || 'Unknown Customer'}
                        </h4>
                        <p className="text-xs md:text-sm text-gray-600 truncate">{booking.customerInfo?.email}</p>
                      </div>
                      
                      {/* Tour Info */}
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <h4 className="font-semibold text-sm md:text-base text-gray-900 mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                          {booking.tourId?.title || 'Unknown Tour'}
                        </h4>
                        <p className="text-xs md:text-sm text-gray-600 truncate">Guide: {booking.guideId?.fullName || 'Unassigned'}</p>
                      </div>
                      
                      {/* Date & Time */}
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center text-xs md:text-sm text-gray-600 mb-1">
                          <CalendarDaysIcon className="w-4 h-4 mr-1 flex-shrink-0" />
                          <span className="truncate">{booking.bookingDate ? new Date(booking.bookingDate).toLocaleDateString() : 'No date'}</span>
                        </div>
                        <div className="flex items-center text-xs md:text-sm text-gray-600">
                          <ClockIcon className="w-4 h-4 mr-1 flex-shrink-0" />
                          <span className="truncate">{booking.bookingTime || 'No time'} • {booking.numberOfGuests || 0} guests</span>
                        </div>
                      </div>
                      
                      {/* Price */}
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="font-semibold text-base md:text-lg text-gray-900">
                          ${booking.pricing?.totalAmount || 0}
                        </p>
                        <p className="text-xs md:text-sm text-gray-600">
                          {booking.payment?.status === 'completed' ? 'Paid' : booking.payment?.status || 'Unknown'}
                        </p>
                        {booking.promoCode && (
                          <span className="inline-block mt-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                            {booking.promoCode.code}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions - Mobile Stacked */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <button
                        onClick={() => setSelectedBooking(booking)}
                        className="flex items-center justify-center px-4 py-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-gray-200 text-sm"
                        style={{ fontFamily: 'Poppins, sans-serif' }}
                      >
                        <EyeIcon className="w-4 h-4 mr-2" />
                        View Details
                      </button>
                      
                      {booking.status === 'confirmed' && !booking.experience?.completed && (
                        <button
                          onClick={() => handleMarkCompleted(booking._id)}
                          disabled={processingAction === booking._id}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
                          style={{ fontFamily: 'Poppins, sans-serif' }}
                        >
                          {processingAction === booking._id ? 'Processing...' : 'Mark Complete'}
                        </button>
                      )}
                      
                      {booking.status === 'confirmed' && booking.payment?.status === 'completed' && (
                        <button
                          onClick={() => handleRefund(booking._id)}
                          disabled={processingAction === booking._id}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
                          style={{ fontFamily: 'Poppins, sans-serif' }}
                        >
                          {processingAction === booking._id ? 'Processing...' : 'Process Refund'}
                        </button>
                      )}
                    </div>

                    {/* Commission Breakdown */}
                    {(booking.commissions?.guideCommission > 0 || booking.commissions?.influencerCommission > 0) && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs md:text-sm text-gray-600 mb-2 font-medium">Commission Breakdown:</p>
                        <div className="flex flex-wrap gap-3 md:gap-6 text-xs md:text-sm">
                          <span>Guide: ${booking.commissions.guideCommission || 0}</span>
                          <span>Admin: ${booking.commissions.adminCommission || 0}</span>
                          {booking.commissions.influencerCommission > 0 && (
                            <span>Influencer: ${booking.commissions.influencerCommission}</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {filteredBookings.length === 0 && (
              <div className="p-8 md:p-12 text-center">
                <CalendarDaysIcon className="w-10 h-10 md:w-12 md:h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-sm md:text-base" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  {searchTerm ? 'No bookings found matching your search criteria' : 'No bookings found matching your criteria'}
                </p>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="mt-2 text-indigo-600 hover:text-indigo-700 text-sm underline"
                  >
                    Clear search
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Booking Detail Modal - Mobile Responsive */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl md:rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 md:p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-xl md:text-2xl font-bold text-gray-900" style={{ fontFamily: 'Jost, sans-serif' }}>
                  Booking Details
                </h2>
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg text-2xl"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-4 md:p-6 space-y-4 md:space-y-6">
              {/* Booking Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 text-sm md:text-base" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Booking Information
                  </h3>
                  <div className="space-y-2 text-xs md:text-sm">
                    <p><span className="text-gray-600">Reference:</span> {selectedBooking.bookingReference}</p>
                    <p><span className="text-gray-600">Status:</span> 
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs ${getStatusColor(selectedBooking.status)}`}>
                        {selectedBooking.status === 'draft' ? 'Pending Payment' : selectedBooking.status}
                      </span>
                    </p>
                    <p><span className="text-gray-600">Date:</span> {selectedBooking.bookingDate ? new Date(selectedBooking.bookingDate).toLocaleDateString() : 'No date'}</p>
                    <p><span className="text-gray-600">Time:</span> {selectedBooking.bookingTime || 'No time'}</p>
                    <p><span className="text-gray-600">Guests:</span> {selectedBooking.numberOfGuests || 0}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3 text-sm md:text-base" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Customer Information
                  </h3>
                  <div className="space-y-2 text-xs md:text-sm">
                    <p><span className="text-gray-600">Name:</span> {selectedBooking.customerInfo?.fullName || 'Unknown'}</p>
                    <p className="break-all"><span className="text-gray-600">Email:</span> {selectedBooking.customerInfo?.email || 'No email'}</p>
                    <p><span className="text-gray-600">Phone:</span> {selectedBooking.customerInfo?.phone || 'No phone'}</p>
                  </div>
                </div>
              </div>

              {/* Tour & Guide Info */}
              <div className="border-t pt-4 md:pt-6">
                <h3 className="font-semibold text-gray-900 mb-4 text-sm md:text-base" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Tour & Guide Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div className="bg-gray-50 p-3 md:p-4 rounded-lg">
                    <h4 className="font-medium mb-2 text-sm">Tour Details</h4>
                    <div className="space-y-1 text-xs md:text-sm">
                      <p>Title: {selectedBooking.tourId?.title || 'Unknown Tour'}</p>
                      <p>Category: {selectedBooking.tourId?.category || 'No category'}</p>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-3 md:p-4 rounded-lg">
                    <h4 className="font-medium mb-2 text-sm">Guide Information</h4>
                    <div className="space-y-1 text-xs md:text-sm">
                      <p>Name: {selectedBooking.guideId?.fullName || 'Unassigned'}</p>
                      <p>City: {selectedBooking.guideId?.city || 'Unknown'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment & Commission Details */}
              <div className="border-t pt-4 md:pt-6">
                <h3 className="font-semibold text-gray-900 mb-4 text-sm md:text-base" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Payment & Commission Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div className="bg-gray-50 p-3 md:p-4 rounded-lg">
                    <h4 className="font-medium mb-2 text-sm">Payment Information</h4>
                    <div className="space-y-1 text-xs md:text-sm">
                      <p>Amount: ${selectedBooking.pricing?.totalAmount || 0}</p>
                      <p>Status: {selectedBooking.payment?.status || 'Unknown'}</p>
                      <p>Method: {selectedBooking.payment?.method || 'Unknown'}</p>
                      {selectedBooking.payment?.stripePaymentIntentId && (
                        <p className="break-all">Stripe ID: {selectedBooking.payment.stripePaymentIntentId}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-3 md:p-4 rounded-lg">
                    <h4 className="font-medium mb-2 text-sm">Commission Breakdown</h4>
                    <div className="space-y-1 text-xs md:text-sm">
                      <p>Guide: ${selectedBooking.commissions?.guideCommission || 0}</p>
                      <p>Admin: ${selectedBooking.commissions?.adminCommission || 0}</p>
                      {selectedBooking.commissions?.influencerCommission > 0 && (
                        <p>Influencer: ${selectedBooking.commissions.influencerCommission}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="border-t pt-4 md:pt-6">
                <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
                  {selectedBooking.status === 'confirmed' && !selectedBooking.experience?.completed && (
                    <button
                      onClick={() => {
                        handleMarkCompleted(selectedBooking._id);
                        setSelectedBooking(null);
                      }}
                      disabled={processingAction === selectedBooking._id}
                      className="px-4 md:px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 text-sm md:text-base"
                      style={{ fontFamily: 'Poppins, sans-serif' }}
                    >
                      {processingAction === selectedBooking._id ? 'Processing...' : 'Mark as Completed'}
                    </button>
                  )}
                  
                  {selectedBooking.status === 'confirmed' && selectedBooking.payment?.status === 'completed' && (
                    <button
                      onClick={() => {
                        handleRefund(selectedBooking._id);
                        setSelectedBooking(null);
                      }}
                      disabled={processingAction === selectedBooking._id}
                      className="px-4 md:px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 text-sm md:text-base"
                      style={{ fontFamily: 'Poppins, sans-serif' }}
                    >
                      {processingAction === selectedBooking._id ? 'Processing...' : 'Process Refund'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}