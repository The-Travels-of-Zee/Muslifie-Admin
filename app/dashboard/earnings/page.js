'use client';
import React, { useState, useEffect } from 'react';
import {
  CurrencyDollarIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  BanknotesIcon,
  UserIcon,
  EyeIcon,
  PlayIcon,
  PauseIcon,
  ArrowPathIcon,
  ChevronDownIcon,
  DocumentTextIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import apiService from '../../../lib/apiService';

export default function AdminEarningsPage() {
  const [selectedTab, setSelectedTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEarning, setSelectedEarning] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [userTypeFilter, setUserTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showReleaseModal, setShowReleaseModal] = useState(false);
  const [selectedPendingEarnings, setSelectedPendingEarnings] = useState([]);

  // Real state management
  const [earnings, setEarnings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [stats, setStats] = useState({
    totalAmount: 0,
    pendingAmount: 0,
    confirmedAmount: 0,
    paidAmount: 0,
    guideEarnings: 0,
    influencerEarnings: 0,
    adminEarnings: 0
  });
  
  const [processingAction, setProcessingAction] = useState(null);
  const [processingBulk, setProcessingBulk] = useState(false);

  // Fetch earnings from API (removed searchTerm from dependencies to prevent loading on every keystroke)
  useEffect(() => {
    fetchEarnings();
  }, [selectedTab, userTypeFilter, statusFilter]);

  const fetchEarnings = async () => {
    try {
      setLoading(true);
      const filters = {
        status: statusFilter === 'all' ? undefined : statusFilter,
        earningType: userTypeFilter === 'guide' ? 'guide_commission' : 
                    userTypeFilter === 'influencer' ? 'influencer_commission' : 
                    userTypeFilter === 'all' ? undefined : userTypeFilter,
        // Removed search from API call - we'll filter client-side for better performance
        page: 1,
        limit: 100 // Increased limit since we're filtering client-side
      };

      // Remove undefined values
      Object.keys(filters).forEach(key => filters[key] === undefined && delete filters[key]);

      const response = await apiService.getEarnings(filters);
      
      console.log('Earnings API Response:', response);
      
      // Handle response structure
      let earningsData, paginationData, statsData;
      if (response.data) {
        earningsData = response.data.earnings || [];
        paginationData = response.data.pagination || null;
        statsData = response.data.stats || {};
      } else {
        earningsData = response.earnings || response || [];
        paginationData = response.pagination || null;
        statsData = response.stats || {};
      }
      
      setEarnings(earningsData);
      setPagination(paginationData);
      setStats({
        totalAmount: statsData.totalAmount || 0,
        pendingAmount: statsData.pendingAmount || 0,
        confirmedAmount: statsData.confirmedAmount || 0,
        paidAmount: statsData.paidAmount || 0,
        guideEarnings: statsData.guideEarnings || 0,
        influencerEarnings: statsData.influencerEarnings || 0,
        adminEarnings: statsData.adminEarnings || 0
      });
      
      setError(null);
    } catch (error) {
      console.error('Error fetching earnings:', error);
      setError('Failed to load earnings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'all', name: 'All Earnings', count: earnings.length },
    { id: 'pending', name: 'Pending Release', count: earnings.filter(e => e.status === 'pending').length },
    { id: 'confirmed', name: 'Available for Withdrawal', count: earnings.filter(e => e.status === 'confirmed').length },
    { id: 'paid', name: 'Withdrawn', count: earnings.filter(e => e.status === 'paid').length }
  ];

  const getStatusIcon = (status) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'pending':
        return <ClockIcon className="w-5 h-5 text-yellow-500" />;
      case 'paid':
        return <BanknotesIcon className="w-5 h-5 text-blue-500" />;
      case 'cancelled':
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />;
      default:
        return <ClockIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'paid':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusDisplayText = (status) => {
    switch (status) {
      case 'pending':
        return 'Pending Release';
      case 'confirmed':
        return 'Available for Withdrawal';
      case 'paid':
        return 'Withdrawn';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const handleReleasePayment = async (earningId) => {
    setProcessingAction(earningId);
    
    try {
      await apiService.releaseSinglePayment(earningId);
      
      // Refresh earnings list
      await fetchEarnings();
      
      alert('Payment released successfully! It is now available for user withdrawal.');
    } catch (error) {
      console.error('Error releasing payment:', error);
      alert('Failed to release payment. Please try again.');
    } finally {
      setProcessingAction(null);
    }
  };

  const handleBulkRelease = async () => {
    setProcessingBulk(true);
    
    try {
      const pendingEarnings = earnings.filter(e => e.status === 'pending');
      const earningIds = pendingEarnings.map(e => e._id);
      
      if (earningIds.length === 0) {
        alert('No pending earnings to release.');
        setShowReleaseModal(false);
        return;
      }

      await apiService.releaseBulkPayments(earningIds);
      
      // Refresh earnings list
      await fetchEarnings();
      
      setShowReleaseModal(false);
      setSelectedPendingEarnings([]);
      alert(`Successfully released ${earningIds.length} pending payments! They are now available for user withdrawal.`);
    } catch (error) {
      console.error('Error releasing bulk payments:', error);
      alert('Failed to release bulk payments. Please try again.');
    } finally {
      setProcessingBulk(false);
    }
  };

  const filteredEarnings = earnings.filter(earning => {
    if (selectedTab !== 'all' && earning.status !== selectedTab) return false;
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const userName = earning.userDetails?.fullName?.toLowerCase() || '';
      const customerName = earning.customerName?.toLowerCase() || '';
      if (!userName.includes(searchLower) && !customerName.includes(searchLower)) return false;
    }
    
    if (userTypeFilter !== 'all') {
      if (userTypeFilter === 'guide' && !earning.earningType.includes('guide')) return false;
      if (userTypeFilter === 'influencer' && !earning.earningType.includes('influencer')) return false;
    }
    
    if (statusFilter !== 'all' && earning.status !== statusFilter) return false;
    return true;
  });

  const pendingEarnings = earnings.filter(e => e.status === 'pending');

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
          onClick={fetchEarnings}
          className="mt-4 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-xl"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900" style={{ fontFamily: 'Jost, sans-serif' }}>
            Earnings Management
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Manage platform earnings and release pending payments to user balances
          </p>
        </div>

        {pendingEarnings.length > 0 && (
          <button
            onClick={() => setShowReleaseModal(true)}
            className="w-full sm:w-auto flex items-center justify-center px-4 sm:px-6 py-2.5 sm:py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-all duration-200 text-sm sm:text-base"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            <PlayIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            <span className="hidden sm:inline">Release Pending Payments ({pendingEarnings.length})</span>
            <span className="sm:hidden">Release ({pendingEarnings.length})</span>
          </button>
        )}
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 sm:p-4">
        <div className="flex items-start space-x-2 sm:space-x-3">
          <InformationCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs sm:text-sm">
            <h3 className="font-medium text-blue-900 mb-1">Payment Status Explained</h3>
            <ul className="text-blue-800 space-y-1">
              <li><strong>Pending Release:</strong> Earnings held until tour completion - require admin approval</li>
              <li><strong>Available for Withdrawal:</strong> Released to user's balance - users can withdraw these</li>
              <li><strong>Withdrawn:</strong> Users have successfully withdrawn these earnings</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="bg-purple-100 p-2 sm:p-3 rounded-lg sm:rounded-xl">
              <CurrencyDollarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
            </div>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1" style={{ fontFamily: 'Jost, sans-serif' }}>
            ${stats.totalAmount.toLocaleString()}
          </h3>
          <p className="text-gray-600 text-xs sm:text-sm" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Total Earnings
          </p>
        </div>

        <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="bg-yellow-100 p-2 sm:p-3 rounded-lg sm:rounded-xl">
              <ClockIcon className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />
            </div>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1" style={{ fontFamily: 'Jost, sans-serif' }}>
            ${stats.pendingAmount.toLocaleString()}
          </h3>
          <p className="text-gray-600 text-xs sm:text-sm" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Pending Release
          </p>
          <p className="text-xs text-yellow-700 mt-1">
            Requires admin approval
          </p>
        </div>

        <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="bg-green-100 p-2 sm:p-3 rounded-lg sm:rounded-xl">
              <CheckCircleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
            </div>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1" style={{ fontFamily: 'Jost, sans-serif' }}>
            ${stats.confirmedAmount.toLocaleString()}
          </h3>
          <p className="text-gray-600 text-xs sm:text-sm" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Available for Withdrawal
          </p>
          <p className="text-xs text-green-700 mt-1">
            In user balances
          </p>
        </div>

        <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="bg-blue-100 p-2 sm:p-3 rounded-lg sm:rounded-xl">
              <BanknotesIcon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            </div>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1" style={{ fontFamily: 'Jost, sans-serif' }}>
            ${stats.paidAmount.toLocaleString()}
          </h3>
          <p className="text-gray-600 text-xs sm:text-sm" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Successfully Withdrawn
          </p>
          <p className="text-xs text-blue-700 mt-1">
            Completed transactions
          </p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-lg border border-gray-100">
        <div className="flex flex-col space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search earnings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 sm:py-2 bg-gray-100 border-0 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all duration-200 text-sm sm:text-base"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              />
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center justify-center px-4 py-2.5 sm:py-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors text-sm sm:text-base"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              <FunnelIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Filters
              <ChevronDownIcon className={`w-4 h-4 ml-2 transform transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <select
              value={userTypeFilter}
              onChange={(e) => setUserTypeFilter(e.target.value)}
              className="w-full px-4 py-2.5 sm:py-2 bg-gray-100 border-0 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm sm:text-base"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              <option value="all">All User Types</option>
              <option value="guide">Tour Guides</option>
              <option value="influencer">Influencers</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2.5 sm:py-2 bg-gray-100 border-0 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm sm:text-base"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending Release</option>
              <option value="confirmed">Available for Withdrawal</option>
              <option value="paid">Withdrawn</option>
            </select>

            <select
              className="w-full px-4 py-2.5 sm:py-2 bg-gray-100 border-0 rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm sm:text-base"
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
                setUserTypeFilter('all');
                setStatusFilter('all');
              }}
              className="w-full px-4 py-2.5 sm:py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors text-sm sm:text-base"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-100">
        <div className="border-b border-gray-200 overflow-x-auto">
          <nav className="flex space-x-4 sm:space-x-8 px-4 sm:px-6 min-w-max sm:min-w-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`py-3 sm:py-4 px-2 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
                  selectedTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                <span className="hidden sm:inline">{tab.name}</span>
                <span className="sm:hidden">{tab.name.split(' ')[0]}</span>
                <span className="ml-1 sm:ml-2 bg-gray-100 text-gray-600 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-xs">
                  {tab.count}
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* Earnings List */}
        <div className="divide-y divide-gray-200">
          {filteredEarnings.map((earning) => (
            <div key={earning._id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(earning.status)}
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(earning.status)}`}>
                        {getStatusDisplayText(earning.status)}
                      </span>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      earning.earningType.includes('guide') ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                    }`}>
                      {earning.earningType.includes('guide') ? 'Guide' : 'Influencer'}
                    </span>
                  </div>
                  
                  <div className="mt-3 grid grid-cols-1 lg:grid-cols-4 gap-4">
                    <div>
                      <h4 className="font-semibold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        {earning.userDetails?.fullName || 'Unknown User'}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {earning.earningType === 'guide_commission' ? 'Tour Guide Commission' : 'Influencer Commission'}
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        {earning.sourceInfo?.tourTitle || `Promo: ${earning.sourceInfo?.promoCode}`}
                      </h4>
                      <p className="text-sm text-gray-600">Customer: {earning.customerName}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-600">
                        From booking: ${earning.sourceInfo?.bookingAmount || 0}
                      </p>
                      <p className="text-sm text-gray-600">
                        Rate: {earning.sourceInfo?.commissionRate || 0}%
                      </p>
                    </div>
                    
                    <div>
                      <p className="font-semibold text-lg text-gray-900">
                        ${earning.amount}
                      </p>
                      <p className="text-sm text-gray-600">
                        {new Date(earning.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Status-specific Info */}
                  {earning.status === 'pending' && (
                    <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="flex items-center space-x-2">
                        <InformationCircleIcon className="w-4 h-4 text-yellow-600" />
                        <p className="text-sm text-yellow-800">
                          <strong>Held for tour completion</strong> - Release this payment to make it available for user withdrawal
                        </p>
                      </div>
                    </div>
                  )}

                  {earning.status === 'confirmed' && (
                    <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center space-x-2">
                        <CheckCircleIcon className="w-4 h-4 text-green-600" />
                        <p className="text-sm text-green-800">
                          <strong>Available in user's balance</strong> - User can withdraw this amount
                          {earning.releasedAt && ` (Released: ${new Date(earning.releasedAt).toLocaleDateString()})`}
                        </p>
                      </div>
                    </div>
                  )}

                  {earning.status === 'paid' && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center space-x-2">
                        <BanknotesIcon className="w-4 h-4 text-blue-600" />
                        <p className="text-sm text-blue-800">
                          <strong>Successfully withdrawn</strong> - User received this payment
                          {earning.paidAt && ` on ${new Date(earning.paidAt).toLocaleDateString()}`}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-2 ml-6">
                  <button
                    onClick={() => setSelectedEarning(earning)}
                    className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="View Details"
                  >
                    <EyeIcon className="w-5 h-5" />
                  </button>
                  
                  {earning.status === 'pending' && (
                    <button
                      onClick={() => handleReleasePayment(earning._id)}
                      disabled={processingAction === earning._id}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors flex items-center disabled:opacity-50"
                      style={{ fontFamily: 'Poppins, sans-serif' }}
                      title="Release to user's balance for withdrawal"
                    >
                      <PlayIcon className="w-4 h-4 mr-1" />
                      {processingAction === earning._id ? 'Releasing...' : 'Release'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredEarnings.length === 0 && (
          <div className="p-12 text-center">
            <CurrencyDollarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500" style={{ fontFamily: 'Poppins, sans-serif' }}>
              No earnings found matching your criteria
            </p>
          </div>
        )}
      </div>

      {/* Bulk Release Modal */}
      {showReleaseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Jost, sans-serif' }}>
                Release Pending Payments
              </h2>
              <p className="text-gray-600 mt-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Release pending payments to user balances so they can withdraw them
              </p>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <InformationCircleIcon className="w-5 h-5 text-yellow-600" />
                  <h3 className="font-medium text-yellow-800">About to Release</h3>
                </div>
                <p className="text-sm text-yellow-700 mb-3">
                  Found {pendingEarnings.length} pending payments totaling ${pendingEarnings.reduce((sum, e) => sum + e.amount, 0).toFixed(2)}
                </p>
                <p className="text-sm text-yellow-700 mb-3">
                  <strong>Action:</strong> Change status from "Pending Release" → "Available for Withdrawal"
                </p>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {pendingEarnings.map((earning) => (
                    <div key={earning._id} className="flex items-center justify-between py-2 px-3 bg-white rounded border">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{earning.userDetails?.fullName || 'Unknown User'}</p>
                        <p className="text-xs text-gray-600">
                          {earning.sourceInfo?.tourTitle || earning.sourceInfo?.promoCode} - {earning.customerName}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${earning.amount}</p>
                        <p className="text-xs text-gray-500">
                          {earning.earningType.includes('guide') ? 'Guide' : 'Influencer'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={handleBulkRelease}
                  disabled={processingBulk}
                  className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-colors flex items-center justify-center disabled:opacity-50"
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                >
                  <PlayIcon className="w-5 h-5 mr-2" />
                  {processingBulk ? 'Releasing...' : 'Release All to User Balances'}
                </button>
                <button
                  onClick={() => setShowReleaseModal(false)}
                  className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-semibold transition-colors"
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Earning Detail Modal */}
      {selectedEarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Jost, sans-serif' }}>
                  Earning Details
                </h2>
                <button
                  onClick={() => setSelectedEarning(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg text-2xl"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Status Banner */}
              <div className={`p-4 rounded-lg border ${
                selectedEarning.status === 'pending' ? 'bg-yellow-50 border-yellow-200' :
                selectedEarning.status === 'confirmed' ? 'bg-green-50 border-green-200' :
                selectedEarning.status === 'paid' ? 'bg-blue-50 border-blue-200' :
                'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center space-x-3">
                  {getStatusIcon(selectedEarning.status)}
                  <div>
                    <h3 className="font-semibold">{getStatusDisplayText(selectedEarning.status)}</h3>
                    <p className="text-sm">
                      {selectedEarning.status === 'pending' && 'This payment is held until tour completion. Release it to make it available for user withdrawal.'}
                      {selectedEarning.status === 'confirmed' && 'This payment is in the user\'s balance and available for withdrawal.'}
                      {selectedEarning.status === 'paid' && 'This payment has been successfully withdrawn by the user.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* User & Earning Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    User Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-gray-600">Name:</span> {selectedEarning.userDetails?.fullName || 'Unknown User'}</p>
                    <p><span className="text-gray-600">Type:</span> 
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                        selectedEarning.earningType.includes('guide') ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                      }`}>
                        {selectedEarning.earningType.includes('guide') ? 'Tour Guide' : 'Influencer'}
                      </span>
                    </p>
                    <p><span className="text-gray-600">User ID:</span> {selectedEarning.userId}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Earning Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-gray-600">Amount:</span> <span className="font-semibold text-lg">${selectedEarning.amount}</span></p>
                    <p><span className="text-gray-600">Status:</span> 
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs ${getStatusColor(selectedEarning.status)}`}>
                        {getStatusDisplayText(selectedEarning.status)}
                      </span>
                    </p>
                    <p><span className="text-gray-600">Created:</span> {new Date(selectedEarning.createdAt).toLocaleDateString()}</p>
                    {selectedEarning.releasedAt && (
                      <p><span className="text-gray-600">Released:</span> {new Date(selectedEarning.releasedAt).toLocaleDateString()}</p>
                    )}
                    {selectedEarning.paidAt && (
                      <p><span className="text-gray-600">Withdrawn:</span> {new Date(selectedEarning.paidAt).toLocaleDateString()}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Source Information */}
              <div className="border-t pt-6">
                <h3 className="font-semibold text-gray-900 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Source Details
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
                  {selectedEarning.sourceInfo?.tourTitle && (
                    <p><span className="text-gray-600">Tour:</span> {selectedEarning.sourceInfo.tourTitle}</p>
                  )}
                  {selectedEarning.sourceInfo?.promoCode && (
                    <p><span className="text-gray-600">Promo Code:</span> {selectedEarning.sourceInfo.promoCode}</p>
                  )}
                  <p><span className="text-gray-600">Customer:</span> {selectedEarning.customerName}</p>
                  <p><span className="text-gray-600">Booking Amount:</span> ${selectedEarning.sourceInfo?.bookingAmount || 0}</p>
                  <p><span className="text-gray-600">Commission Rate:</span> {selectedEarning.sourceInfo?.commissionRate || 0}%</p>
                </div>
              </div>

              {/* Status History */}
              {selectedEarning.statusHistory && selectedEarning.statusHistory.length > 0 && (
                <div className="border-t pt-6">
                  <h3 className="font-semibold text-gray-900 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Status History
                  </h3>
                  <div className="space-y-3">
                    {selectedEarning.statusHistory.map((history, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className={`p-1 rounded-full ${getStatusColor(history.status).replace('text-', 'bg-').replace('800', '200')}`}>
                          {getStatusIcon(history.status)}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{getStatusDisplayText(history.status)}</p>
                          <p className="text-xs text-gray-600">{history.reason}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(history.changedAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="border-t pt-6">
                <div className="flex space-x-4">
                  {selectedEarning.status === 'pending' && (
                    <button
                      onClick={() => {
                        handleReleasePayment(selectedEarning._id);
                        setSelectedEarning(null);
                      }}
                      disabled={processingAction === selectedEarning._id}
                      className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center disabled:opacity-50"
                      style={{ fontFamily: 'Poppins, sans-serif' }}
                    >
                      <PlayIcon className="w-4 h-4 mr-2" />
                      {processingAction === selectedEarning._id ? 'Releasing...' : 'Release to User Balance'}
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