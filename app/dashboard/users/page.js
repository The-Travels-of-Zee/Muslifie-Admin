'use client';
import React, { useState, useEffect } from 'react';
import {
  UsersIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  CheckBadgeIcon,
  XCircleIcon,
  ShieldCheckIcon,
  ArrowDownTrayIcon,
  ChevronDownIcon,
  UserCircleIcon,
  MapPinIcon,
  EnvelopeIcon,
  PhoneIcon,
  CalendarDaysIcon,
  StarIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import apiService from '../../../lib/apiService';

const UsersManagement = () => {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedUserType, setSelectedUserType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deleteReason, setDeleteReason] = useState('');
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [processingAction, setProcessingAction] = useState(null);

  // ✅ FIXED: Stats are now separate and fetched independently
  const [stats, setStats] = useState({
    travelers: 0,
    guides: 0,
    influencers: 0,
    pendingVerification: 0
  });

  // ✅ NEW: Fetch stats separately from ALL users (no filters)
  const fetchStats = async () => {
    try {
      // Fetch counts for each user type
      const [travelersRes, guidesRes, influencersRes, pendingRes] = await Promise.allSettled([
        apiService.getUsers({ userType: 'traveler', limit: 1 }),
        apiService.getUsers({ userType: 'guide', limit: 1 }),
        apiService.getUsers({ userType: 'influencer', limit: 1 }),
        apiService.getUsers({ verificationStatus: 'pending', limit: 1 })
      ]);

      const newStats = {
        travelers: 0,
        guides: 0,
        influencers: 0,
        pendingVerification: 0
      };

      // Extract total counts from pagination data
      if (travelersRes.status === 'fulfilled' && travelersRes.value) {
        const data = travelersRes.value.data || travelersRes.value;
        newStats.travelers = data.pagination?.totalUsers || 0;
      }

      if (guidesRes.status === 'fulfilled' && guidesRes.value) {
        const data = guidesRes.value.data || guidesRes.value;
        newStats.guides = data.pagination?.totalUsers || 0;
      }

      if (influencersRes.status === 'fulfilled' && influencersRes.value) {
        const data = influencersRes.value.data || influencersRes.value;
        newStats.influencers = data.pagination?.totalUsers || 0;
      }

      if (pendingRes.status === 'fulfilled' && pendingRes.value) {
        const data = pendingRes.value.data || pendingRes.value;
        newStats.pendingVerification = data.pagination?.totalUsers || 0;
      }

      setStats(newStats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // ✅ FIXED: Fetch users for table (with filters) - NO stats calculation here
  const fetchUsers = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      
      const filters = {
        userType: selectedUserType === 'all' ? undefined : selectedUserType,
        verificationStatus: selectedFilter === 'all' ? undefined : selectedFilter,
        search: searchTerm || undefined,
        page: 1,
        limit: 50
      };

      Object.keys(filters).forEach(key => filters[key] === undefined && delete filters[key]);

      const response = await apiService.getUsers(filters);
      
      let usersData, paginationData;
      if (response.data) {
        usersData = response.data.users || [];
        paginationData = response.data.pagination || null;
      } else {
        usersData = response.users || response || [];
        paginationData = response.pagination || null;
      }
      
      setUsers(usersData);
      setPagination(paginationData);
      
      // ✅ REMOVED: No longer calculating stats from filtered data
      
      setError(null);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users. Please try again.');
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  // ✅ Initial load: Fetch both stats and users
  useEffect(() => {
    fetchStats(); // Fetch stats once on load
    fetchUsers(true);
  }, []);

  // ✅ When filters change: Only fetch users, keep stats unchanged
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchUsers(false);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [selectedFilter, selectedUserType, searchTerm]);

  const handleVerificationAction = async (userId, action) => {
    setProcessingAction(userId);
    
    try {
      let status = action === 'approve' ? 'approved' : 'rejected';

      await apiService.updateUserVerificationStatus(userId, status);
      
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user._id === userId 
            ? { ...user, verificationStatus: status }
            : user
        )
      );
      
      setSelectedUser(prevUser => 
        prevUser && prevUser._id === userId 
          ? { ...prevUser, verificationStatus: status }
          : prevUser
      );
      
      // ✅ Update stats after action
      if (status === 'approved' || status === 'rejected') {
        setStats(prevStats => ({
          ...prevStats,
          pendingVerification: Math.max(0, prevStats.pendingVerification - 1)
        }));
      }
      
      if (selectedUser && selectedUser._id === userId) {
        setSelectedUser(null);
      }
      
      alert(`User verification ${action}ed successfully!`);
      
      // ✅ Refresh stats in background
      setTimeout(() => {
        fetchStats();
        apiService.getUsers({}, { forceRefresh: true }).catch(console.error);
      }, 1000);
      
    } catch (error) {
      console.error(`Error ${action}ing user verification:`, error);
      alert(`Failed to ${action} user verification. Please try again.`);
    } finally {
      setProcessingAction(null);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    setProcessingAction(userToDelete._id);
    
    try {
      await apiService.deleteUser(userToDelete._id, deleteReason);
      
      setUsers(prevUsers => prevUsers.filter(user => user._id !== userToDelete._id));
      
      // ✅ Update stats after deletion
      setStats(prevStats => {
        const newStats = { ...prevStats };
        if (userToDelete.userType === 'traveler') newStats.travelers = Math.max(0, newStats.travelers - 1);
        if (userToDelete.userType === 'guide') newStats.guides = Math.max(0, newStats.guides - 1);
        if (userToDelete.userType === 'influencer') newStats.influencers = Math.max(0, newStats.influencers - 1);
        if (userToDelete.verificationStatus === 'pending') newStats.pendingVerification = Math.max(0, newStats.pendingVerification - 1);
        return newStats;
      });
      
      setShowDeleteModal(false);
      setSelectedUser(null);
      setUserToDelete(null);
      setDeleteReason('');
      
      alert('User deleted successfully!');
      
      // ✅ Refresh stats in background
      setTimeout(() => {
        fetchStats();
        apiService.getUsers({}, { forceRefresh: true }).catch(console.error);
      }, 1000);
      
    } catch (error) {
      console.error('Error deleting user:', error);
      alert(error.message || 'Failed to delete user. Please try again.');
    } finally {
      setProcessingAction(null);
    }
  };

  const getUserTypeColor = (userType) => {
    switch (userType) {
      case 'guide':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'influencer':
        return 'bg-pink-100 text-pink-800 border-pink-200';
      case 'traveler':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'admin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getVerificationStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'incomplete':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'not_required':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getServiceTypeLabel = (serviceType) => {
    const labels = {
      tour_guide: 'Tour Guide',
      halal_restaurant: 'Halal Restaurant',
      transportation: 'Transportation',
      muslim_hotel: 'Muslim Hotel',
      modest_fashion: 'Modest Fashion',
      religious_service: 'Religious Service',
      healthcare: 'Healthcare',
      halal_food_delivery: 'Food Delivery',
      event_planning: 'Event Planning',
      other: 'Other'
    };
    return labels[serviceType] || serviceType;
  };

  const DeleteConfirmationModal = ({ user, onClose, onConfirm }) => {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl max-w-lg w-full p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ExclamationTriangleIcon className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Jost, sans-serif' }}>
              Delete User Account
            </h2>
            <p className="text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
              This action cannot be undone. All user data will be permanently deleted.
            </p>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <h3 className="font-semibold text-red-900 mb-2">User Details:</h3>
            <p className="text-red-800 text-sm">
              <strong>Name:</strong> {user.fullName}<br />
              <strong>Email:</strong> {user.email}<br />
              <strong>Type:</strong> {user.userType}<br />
              <strong>Status:</strong> {user.verificationStatus}
            </p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Deletion (Optional)
            </label>
            <textarea
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              rows="3"
              placeholder="e.g., Policy violation, spam account, user request..."
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={processingAction === user._id}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 px-6 rounded-xl font-semibold transition-colors disabled:opacity-50"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={processingAction === user._id}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 px-6 rounded-xl font-semibold transition-colors disabled:opacity-50"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              {processingAction === user._id ? 'Deleting...' : 'Delete User'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const UserModal = ({ user, onClose }) => {
    const [editMode, setEditMode] = useState(false);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
        <div className="bg-white rounded-2xl sm:rounded-3xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white p-4 sm:p-6 border-b border-gray-200 z-10">
            <div className="flex items-center justify-between">
              <h2 className="text-lg sm:text-2xl font-bold text-gray-900 truncate" style={{ fontFamily: 'Jost, sans-serif' }}>
                User Details
              </h2>
              <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
                <button
                  onClick={() => setEditMode(!editMode)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <PencilIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors text-xl sm:text-2xl"
                >
                  ×
                </button>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl sm:rounded-2xl p-4 sm:p-6">
              <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                  {user.profileImage ? (
                    <img src={user.profileImage} alt={user.fullName} className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover" />
                  ) : (
                    <span className="text-white font-bold text-xl sm:text-2xl">
                      {user.fullName?.split(' ').map(n => n[0]).join('') || 'U'}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0 w-full">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 break-words" style={{ fontFamily: 'Jost, sans-serif' }}>
                      {user.fullName || 'Unknown User'}
                    </h3>
                    <span className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium border ${getUserTypeColor(user.userType)}`}>
                      {user.userType}
                    </span>
                    <span className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium border ${getVerificationStatusColor(user.verificationStatus)}`}>
                      {(user.verificationStatus || 'unknown').replace('_', ' ')}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm">
                    <div className="flex items-center text-gray-600 min-w-0">
                      <EnvelopeIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{user.email}</span>
                      {user.emailVerified && <CheckBadgeIcon className="w-4 h-4 ml-1 text-green-500 flex-shrink-0" />}
                    </div>
                    {user.phone && (
                      <div className="flex items-center text-gray-600">
                        <PhoneIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span>{user.phone}</span>
                      </div>
                    )}
                    {user.city && (
                      <div className="flex items-center text-gray-600">
                        <MapPinIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span>{user.city}</span>
                      </div>
                    )}
                    <div className="flex items-center text-gray-600">
                      <CalendarDaysIcon className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span>Joined {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {user.userType === 'guide' && (
              <div className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-4" style={{ fontFamily: 'Jost, sans-serif' }}>
                  Guide Statistics
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <StarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500 mr-1" />
                      <span className="text-xl sm:text-2xl font-bold text-gray-900" style={{ fontFamily: 'Jost, sans-serif' }}>
                        {user.rating || 0}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600">Rating ({user.totalReviews || 0} reviews)</p>
                  </div>
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Jost, sans-serif' }}>
                      {user.completedTours || 0}
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600">Completed Tours</p>
                  </div>
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Jost, sans-serif' }}>
                      {user.languages?.length || 0}
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600">Languages</p>
                  </div>
                </div>

                {user.serviceType && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs sm:text-sm text-gray-600">Service Type</p>
                    <p className="text-sm sm:text-base font-semibold text-gray-900">{getServiceTypeLabel(user.serviceType)}</p>
                  </div>
                )}
              </div>
            )}

            {user.userType === 'influencer' && user.profileUrl && (
              <div className="bg-pink-50 border border-pink-200 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-2" style={{ fontFamily: 'Jost, sans-serif' }}>
                  Social Media Profile
                </h4>
                <a
                  href={user.profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-pink-600 hover:text-pink-800 underline text-sm sm:text-base break-all"
                >
                  {user.profileUrl}
                </a>
              </div>
            )}

            {user.bio && (
              <div className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-3" style={{ fontFamily: 'Jost, sans-serif' }}>
                  Bio
                </h4>
                <p className="text-sm sm:text-base text-gray-700" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  {user.bio}
                </p>
              </div>
            )}

            {user.languages && user.languages.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-3" style={{ fontFamily: 'Jost, sans-serif' }}>
                  Languages
                </h4>
                <div className="flex flex-wrap gap-2">
                  {user.languages.map((language, index) => (
                    <span key={index} className="px-2 sm:px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs sm:text-sm font-medium">
                      {language}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white border border-gray-200 rounded-xl sm:rounded-2xl p-4 sm:p-6">
              <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-4" style={{ fontFamily: 'Jost, sans-serif' }}>
                Account Status
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs sm:text-sm">
                <div>
                  <p className="text-gray-600">Email Verified</p>
                  <div className="flex items-center mt-1">
                    {user.emailVerified ? (
                      <>
                        <CheckBadgeIcon className="w-4 h-4 text-green-500 mr-1" />
                        <span className="text-green-600 font-medium">Verified</span>
                      </>
                    ) : (
                      <>
                        <XCircleIcon className="w-4 h-4 text-red-500 mr-1" />
                        <span className="text-red-600 font-medium">Not Verified</span>
                      </>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-gray-600">Account Status</p>
                  <div className="flex items-center mt-1">
                    {user.isActive ? (
                      <span className="text-green-600 font-medium">Active</span>
                    ) : (
                      <span className="text-red-600 font-medium">Inactive</span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-gray-600">Last Login</p>
                  <p className="font-medium mt-1">
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                  </p>
                </div>
              </div>
            </div>

            {user.verificationStatus === 'pending' && (
              <div className="bg-gray-50 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-4" style={{ fontFamily: 'Jost, sans-serif' }}>
                  Verification Actions
                </h4>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => handleVerificationAction(user._id, 'approve')}
                    disabled={processingAction === user._id}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 sm:py-3 px-4 sm:px-6 rounded-xl font-semibold transition-colors disabled:opacity-50 text-sm sm:text-base"
                    style={{ fontFamily: 'Poppins, sans-serif' }}
                  >
                    <CheckBadgeIcon className="w-4 h-4 sm:w-5 sm:h-5 inline mr-2" />
                    {processingAction === user._id ? 'Processing...' : 'Approve Verification'}
                  </button>
                  <button
                    onClick={() => handleVerificationAction(user._id, 'reject')}
                    disabled={processingAction === user._id}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 sm:py-3 px-4 sm:px-6 rounded-xl font-semibold transition-colors disabled:opacity-50 text-sm sm:text-base"
                    style={{ fontFamily: 'Poppins, sans-serif' }}
                  >
                    <XCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 inline mr-2" />
                    {processingAction === user._id ? 'Processing...' : 'Reject Verification'}
                  </button>
                </div>
              </div>
            )}

            {user.userType !== 'admin' && (
              <div className="bg-red-50 border border-red-200 rounded-xl sm:rounded-2xl p-4 sm:p-6">
                <h4 className="text-base sm:text-lg font-bold text-red-900 mb-2" style={{ fontFamily: 'Jost, sans-serif' }}>
                  Danger Zone
                </h4>
                <p className="text-xs sm:text-sm text-red-700 mb-4">
                  Permanently delete this user account and all associated data. This action cannot be undone.
                </p>
                <button
                  onClick={() => {
                    setUserToDelete(user);
                    setShowDeleteModal(true);
                  }}
                  disabled={processingAction === user._id}
                  className="bg-red-600 hover:bg-red-700 text-white py-2.5 sm:py-3 px-4 sm:px-6 rounded-xl font-semibold transition-colors disabled:opacity-50 flex items-center text-sm sm:text-base"
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                >
                  <TrashIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  Delete User Account
                </button>
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
          onClick={() => fetchUsers(true)}
          className="mt-4 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-xl"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-3xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'Jost, sans-serif' }}>
              Users Management
            </h1>
            <p className="text-white/90" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Manage travelers, guides, and influencers across your platform
            </p>
          </div>
          <UsersIcon className="w-16 h-16 text-white/80" />
        </div>
      </div>

      {/* ✅ Stats Cards - Now showing correct totals regardless of filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-xl">
              <UserCircleIcon className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Jost, sans-serif' }}>
                {stats.travelers}
              </p>
              <p className="text-sm text-gray-600">Travelers</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-xl">
              <MapPinIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Jost, sans-serif' }}>
                {stats.guides}
              </p>
              <p className="text-sm text-gray-600">Tour Guides</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center">
            <div className="bg-pink-100 p-3 rounded-xl">
              <StarIcon className="w-6 h-6 text-pink-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Jost, sans-serif' }}>
                {stats.influencers}
              </p>
              <p className="text-sm text-gray-600">Influencers</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center">
            <div className="bg-orange-100 p-3 rounded-xl">
              <ShieldCheckIcon className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Jost, sans-serif' }}>
                {stats.pendingVerification}
              </p>
              <p className="text-sm text-gray-600">Pending Verification</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-gray-100 border-0 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all duration-200 w-64"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              />
            </div>

            <div className="flex items-center space-x-3">
              <select
                value={selectedUserType}
                onChange={(e) => setSelectedUserType(e.target.value)}
                className="bg-gray-100 border-0 rounded-xl py-2 px-3 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all duration-200"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                <option value="all">All Types</option>
                <option value="traveler">Travelers</option>
                <option value="guide">Tour Guides</option>
                <option value="influencer">Influencers</option>
              </select>

              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="bg-gray-100 border-0 rounded-xl py-2 px-3 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all duration-200"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                <option value="all">All Status</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
                <option value="incomplete">Incomplete</option>
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

      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  User
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Type
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Location
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Verification
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Status
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Joined
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mr-3">
                        <span className="text-white font-bold text-sm">
                          {user.fullName?.split(' ').map(n => n[0]).join('') || 'U'}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                          {user.fullName || 'Unknown User'}
                        </p>
                        <div className="flex items-center">
                          <p className="text-sm text-gray-600">{user.email}</p>
                          {user.emailVerified && <CheckBadgeIcon className="w-4 h-4 ml-1 text-green-500" />}
                        </div>
                        {user.userType === 'guide' && user.rating > 0 && (
                          <div className="flex items-center mt-1">
                            <StarIcon className="w-4 h-4 text-yellow-500" />
                            <span className="text-sm text-gray-600 ml-1">{user.rating} ({user.totalReviews})</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getUserTypeColor(user.userType)}`}>
                      {user.userType}
                    </span>
                    {user.serviceType && (
                      <p className="text-xs text-gray-500 mt-1">{getServiceTypeLabel(user.serviceType)}</p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-900">{user.city || 'N/A'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getVerificationStatusColor(user.verificationStatus)}`}>
                      {(user.verificationStatus || 'unknown').replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-900">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
                    </p>
                    {user.lastLogin && (
                      <p className="text-xs text-gray-500">
                        Last: {new Date(user.lastLogin).toLocaleDateString()}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => setSelectedUser(user)}
                      className="flex items-center px-3 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg transition-colors"
                    >
                      <EyeIcon className="w-4 h-4 mr-1" />
                      <span className="text-sm font-medium">View</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {users.length === 0 && (
          <div className="text-center py-12">
            <UsersIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
              No users found matching your criteria
            </p>
          </div>
        )}
      </div>

      {selectedUser && (
        <UserModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}

      {showDeleteModal && userToDelete && (
        <DeleteConfirmationModal
          user={userToDelete}
          onClose={() => {
            setShowDeleteModal(false);
            setUserToDelete(null);
            setDeleteReason('');
          }}
          onConfirm={handleDeleteUser}
        />
      )}
    </div>
  );
};

export default UsersManagement;