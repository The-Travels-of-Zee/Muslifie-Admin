'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // For Next.js 13+ (app directory)
// import { useNavigate } from 'react-router-dom'; // For React Router (uncomment if using React Router)
import {
  UsersIcon,
  MapIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
  BanknotesIcon,
  CheckBadgeIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  EyeIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import apiService from '../../lib/apiService';

export default function DashboardPage() {
  const router = useRouter(); // Next.js navigation
  // const navigate = useNavigate(); // React Router navigation (uncomment if using React Router)
  
  // Real state management
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalUsers: 0,
      totalTours: 0,
      totalBookings: 0,
      totalRevenue: 0,
      pendingVerifications: 0,
      pendingEarnings: 0,
      pendingTours: 0
    },
    recentActivity: [],
    pendingActions: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Growth calculations (you can enhance this with historical data)
  const [growthData, setGrowthData] = useState({
    userGrowth: 12.5,
    tourGrowth: 8.3,
    bookingGrowth: 23.1,
    revenueGrowth: 18.7
  });

  // Navigation handler for proper routing
  const handleNavigation = (path) => {
    router.push(path); // Next.js
    // navigate(path); // React Router (uncomment if using React Router)
  };

  // Fetch all dashboard data
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch data from multiple endpoints in parallel
      const [
        analyticsResponse,
        usersResponse,
        bookingsResponse,
        earningsResponse,
        verificationsResponse,
        toursResponse
      ] = await Promise.allSettled([
        apiService.getAnalytics(),
        apiService.getUsers({ limit: 5 }), // Get recent users
        apiService.getBookings({ limit: 5 }), // Get recent bookings
        apiService.getEarnings({ status: 'pending', limit: 10 }),
        apiService.getVerifications({ status: 'pending', limit: 10 }),
        apiService.getTours({ status: 'pending_review', limit: 10 })
      ]);

      console.log('Dashboard API Responses:', {
        analytics: analyticsResponse,
        users: usersResponse,
        bookings: bookingsResponse,
        earnings: earningsResponse,
        verifications: verificationsResponse,
        tours: toursResponse
      });

      // Process analytics data
      let analytics = null;
      if (analyticsResponse.status === 'fulfilled' && analyticsResponse.value) {
        analytics = analyticsResponse.value.data || analyticsResponse.value;
      }

      // Process users data
      let usersData = [];
      let totalUsers = 0;
      if (usersResponse.status === 'fulfilled' && usersResponse.value) {
        const userData = usersResponse.value.data || usersResponse.value;
        usersData = userData.users || userData || [];
        totalUsers = userData.pagination?.totalUsers || usersData.length;
      }

      // Process bookings data
      let bookingsData = [];
      let totalBookings = 0;
      let totalRevenue = 0;
      if (bookingsResponse.status === 'fulfilled' && bookingsResponse.value) {
        const bookingData = bookingsResponse.value.data || bookingsResponse.value;
        bookingsData = bookingData.bookings || bookingData || [];
        totalBookings = bookingData.pagination?.totalBookings || bookingsData.length;
        totalRevenue = bookingData.stats?.totalRevenue || bookingsData.reduce((sum, b) => sum + (b.pricing?.totalAmount || 0), 0);
      }

      // Process earnings data
      let pendingEarnings = 0;
      if (earningsResponse.status === 'fulfilled' && earningsResponse.value) {
        const earningData = earningsResponse.value.data || earningsResponse.value;
        const earnings = earningData.earnings || earningData || [];
        pendingEarnings = earnings.filter(e => e.status === 'pending').length;
      }

      // Process verifications data
      let pendingVerifications = 0;
      if (verificationsResponse.status === 'fulfilled' && verificationsResponse.value) {
        const verificationData = verificationsResponse.value.data || verificationsResponse.value;
        const verifications = verificationData.verifications || verificationData || [];
        pendingVerifications = verifications.filter(v => v.verificationStatus === 'pending').length;
      }

      // Process tours data
      let pendingTours = 0;
      let totalTours = 0;
      if (toursResponse.status === 'fulfilled' && toursResponse.value) {
        const tourData = toursResponse.value.data || toursResponse.value;
        const tours = tourData.tours || tourData || [];
        pendingTours = tours.filter(t => t.status === 'pending_review').length;
        totalTours = tourData.pagination?.totalTours || tours.length;
      }

      // Use analytics data if available, otherwise use calculated values
      const stats = {
        totalUsers: analytics?.overview?.users ? 
          Object.values(analytics.overview.users).reduce((sum, count) => sum + count, 0) : 
          totalUsers,
        totalTours: analytics?.distribution?.toursByCategory?.length || totalTours,
        totalBookings: analytics?.overview?.bookings ? 
          Object.values(analytics.overview.bookings).reduce((sum, item) => sum + (item.count || 0), 0) : 
          totalBookings,
        totalRevenue: analytics?.overview?.revenue?.totalRevenue || totalRevenue,
        pendingVerifications,
        pendingEarnings,
        pendingTours
      };

      // Create recent activity from various data sources
      const recentActivity = [];

      // Add recent users
      usersData.slice(0, 2).forEach(user => {
        recentActivity.push({
          type: 'user',
          title: 'New user registered',
          description: `${user.fullName || 'Unknown user'} - ${user.userType}`,
          time: user.createdAt,
          icon: UsersIcon,
          color: 'green'
        });
      });

      // Add recent bookings
      bookingsData.slice(0, 2).forEach(booking => {
        recentActivity.push({
          type: 'booking',
          title: 'New booking confirmed',
          description: `${booking.tourId?.title || 'Unknown tour'} - $${booking.pricing?.totalAmount || 0}`,
          time: booking.createdAt,
          icon: CalendarDaysIcon,
          color: 'blue'
        });
      });

      // Add recent reviews from analytics if available
      if (analytics?.recentActivity?.reviews) {
        analytics.recentActivity.reviews.slice(0, 1).forEach(review => {
          recentActivity.push({
            type: 'review',
            title: 'New review submitted',
            description: `${review.rating}/5 stars - ${review.tourId?.title || 'Unknown tour'}`,
            time: review.createdAt,
            icon: StarIcon,
            color: 'amber'
          });
        });
      }

      // Sort by time and limit
      recentActivity.sort((a, b) => new Date(b.time) - new Date(a.time));
      const limitedActivity = recentActivity.slice(0, 5);

      // Create pending actions with proper navigation paths
      const pendingActions = [
        {
          title: 'Verification Requests',
          description: 'Review guide and service provider verifications',
          count: pendingVerifications,
          path: '/dashboard/verification', // Use path instead of href
          color: 'orange',
          icon: ShieldCheckIcon
        },
        {
          title: 'Pending Earnings',
          description: 'Release pending payments to guides',
          count: pendingEarnings,
          path: '/dashboard/earnings', // Use path instead of href
          color: 'green',
          icon: BanknotesIcon
        },
        {
          title: 'Tour Approvals',
          description: 'Review and approve new tours',
          count: pendingTours,
          path: '/dashboard/tours', // Use path instead of href
          color: 'blue',
          icon: CheckBadgeIcon
        }
      ].filter(action => action.count > 0); // Only show actions with pending items

      setDashboardData({
        stats,
        recentActivity: limitedActivity,
        pendingActions
      });

      setError(null);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const formatGrowth = (value) => {
    const isPositive = value >= 0;
    return (
      <span className={`text-sm font-semibold px-2 py-1 rounded-lg flex items-center ${
        isPositive ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
      }`}>
        {isPositive ? (
          <ArrowUpIcon className="w-3 h-3 mr-1" />
        ) : (
          <ArrowDownIcon className="w-3 h-3 mr-1" />
        )}
        {Math.abs(value).toFixed(1)}%
      </span>
    );
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Unknown';
    
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
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
        <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-700 mb-4">{error}</p>
        <button
          onClick={fetchDashboardData}
          className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-xl transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-3xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'Jost, sans-serif' }}>
              Welcome back, Admin!
            </h1>
            <p className="text-white/90" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Here's what's happening with Muslifie today
            </p>
          </div>
          <div className="text-right">
            <p className="text-white/80 text-sm">
              Last updated: {new Date().toLocaleTimeString()}
            </p>
            <button
              onClick={fetchDashboardData}
              className="mt-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Refresh Data
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-blue-100 p-3 rounded-xl">
              <UsersIcon className="w-6 h-6 text-blue-600" />
            </div>
            {formatGrowth(growthData.userGrowth)}
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1" style={{ fontFamily: 'Jost, sans-serif' }}>
            {dashboardData.stats.totalUsers.toLocaleString()}
          </h3>
          <p className="text-gray-600 text-sm" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Total Users
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-purple-100 p-3 rounded-xl">
              <MapIcon className="w-6 h-6 text-purple-600" />
            </div>
            {formatGrowth(growthData.tourGrowth)}
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1" style={{ fontFamily: 'Jost, sans-serif' }}>
            {dashboardData.stats.totalTours}
          </h3>
          <p className="text-gray-600 text-sm" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Active Tours
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-green-100 p-3 rounded-xl">
              <CalendarDaysIcon className="w-6 h-6 text-green-600" />
            </div>
            {formatGrowth(growthData.bookingGrowth)}
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1" style={{ fontFamily: 'Jost, sans-serif' }}>
            {dashboardData.stats.totalBookings}
          </h3>
          <p className="text-gray-600 text-sm" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Total Bookings
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-amber-100 p-3 rounded-xl">
              <CurrencyDollarIcon className="w-6 h-6 text-amber-600" />
            </div>
            {formatGrowth(growthData.revenueGrowth)}
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1" style={{ fontFamily: 'Jost, sans-serif' }}>
            ${dashboardData.stats.totalRevenue.toLocaleString()}
          </h3>
          <p className="text-gray-600 text-sm" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Total Revenue
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pending Actions - FIXED NAVIGATION */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6" style={{ fontFamily: 'Jost, sans-serif' }}>
            Pending Actions
          </h2>
          <div className="space-y-4">
            {dashboardData.pendingActions.length > 0 ? (
              dashboardData.pendingActions.map((action, index) => (
                <button 
                  key={index}
                  onClick={() => handleNavigation(action.path)} // ✅ FIXED: Using proper navigation
                  className={`w-full flex items-center justify-between p-4 border rounded-xl hover:bg-opacity-80 transition-colors cursor-pointer ${
                    action.color === 'orange' ? 'bg-orange-50 border-orange-200 hover:bg-orange-100' :
                    action.color === 'green' ? 'bg-green-50 border-green-200 hover:bg-green-100' :
                    action.color === 'blue' ? 'bg-blue-50 border-blue-200 hover:bg-blue-100' :
                    'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center">
                    <div className={`p-2 rounded-lg mr-3 ${
                      action.color === 'orange' ? 'bg-orange-100' :
                      action.color === 'green' ? 'bg-green-100' :
                      action.color === 'blue' ? 'bg-blue-100' :
                      'bg-gray-100'
                    }`}>
                      <action.icon className={`w-5 h-5 ${
                        action.color === 'orange' ? 'text-orange-600' :
                        action.color === 'green' ? 'text-green-600' :
                        action.color === 'blue' ? 'text-blue-600' :
                        'text-gray-600'
                      }`} />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        {action.title}
                      </p>
                      <p className="text-sm text-gray-600">{action.description}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold text-white ${
                    action.color === 'orange' ? 'bg-orange-500' :
                    action.color === 'green' ? 'bg-green-500' :
                    action.color === 'blue' ? 'bg-blue-500' :
                    'bg-gray-500'
                  }`}>
                    {action.count}
                  </span>
                </button>
              ))
            ) : (
              <div className="text-center py-8">
                <CheckBadgeIcon className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">All caught up!</p>
                <p className="text-sm text-gray-500">No pending actions at the moment</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Jost, sans-serif' }}>
              Recent Activity
            </h2>
            <button
              onClick={() => handleNavigation('/dashboard/analytics')} // ✅ FIXED: Using proper navigation
              className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
            >
              View All
            </button>
          </div>
          <div className="space-y-4">
            {dashboardData.recentActivity.length > 0 ? (
              dashboardData.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className={`p-2 rounded-lg mr-3 ${
                    activity.color === 'green' ? 'bg-green-100' :
                    activity.color === 'blue' ? 'bg-blue-100' :
                    activity.color === 'purple' ? 'bg-purple-100' :
                    activity.color === 'amber' ? 'bg-amber-100' :
                    'bg-gray-100'
                  }`}>
                    <activity.icon className={`w-4 h-4 ${
                      activity.color === 'green' ? 'text-green-600' :
                      activity.color === 'blue' ? 'text-blue-600' :
                      activity.color === 'purple' ? 'text-purple-600' :
                      activity.color === 'amber' ? 'text-amber-600' :
                      'text-gray-600'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                    <p className="text-xs text-gray-500">{activity.description}</p>
                  </div>
                  <span className="text-xs text-gray-400">
                    {formatTimeAgo(activity.time)}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <ClockIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No recent activity</p>
                <p className="text-sm text-gray-500">Activity will appear here as it happens</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}