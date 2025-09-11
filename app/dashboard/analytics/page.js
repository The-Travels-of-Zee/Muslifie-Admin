'use client';
import React, { useState, useEffect } from 'react';
import {
  ChartBarSquareIcon,
  UsersIcon,
  CurrencyDollarIcon,
  MapIcon,
  CalendarDaysIcon,
  GlobeAltIcon,
  StarIcon,
  EyeIcon,
  HeartIcon,
  CheckCircleIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline';
import apiService from '../../../lib/apiService';

export default function AdminAnalyticsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('revenue');

  // Real state management
  const [analytics, setAnalytics] = useState(null);
  const [revenueTrend, setRevenueTrend] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [trendLoading, setTrendLoading] = useState(false);

  // Fetch analytics data from API
  useEffect(() => {
    fetchAnalytics();
  }, []);

  useEffect(() => {
    fetchRevenueTrend();
  }, [selectedPeriod]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await apiService.getAnalytics();
      
      console.log('Analytics API Response:', response);
      
      // Handle response structure
      let analyticsData;
      if (response.data) {
        analyticsData = response.data;
      } else {
        analyticsData = response;
      }
      
      setAnalytics(analyticsData);
      setError(null);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setError('Failed to load analytics data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchRevenueTrend = async () => {
    try {
      setTrendLoading(true);
      const response = await apiService.getRevenueTrend(selectedPeriod);
      
      console.log('Revenue Trend API Response:', response);
      
      // Handle response structure
      let trendData;
      if (response.data && response.data.trend) {
        trendData = response.data.trend;
      } else if (response.trend) {
        trendData = response.trend;
      } else {
        trendData = [];
      }
      
      setRevenueTrend(trendData);
    } catch (error) {
      console.error('Error fetching revenue trend:', error);
      // Don't show error for trend data, just continue with empty array
    } finally {
      setTrendLoading(false);
    }
  };

  // Calculate overview stats from analytics data
  const overviewStats = analytics ? {
    totalRevenue: analytics.overview?.revenue?.totalRevenue || 0,
    revenueGrowth: 23.5, // You can calculate this from historical data
    totalUsers: Object.values(analytics.overview?.users || {}).reduce((sum, count) => sum + count, 0),
    userGrowth: 12.3, // Calculate from historical data
    totalBookings: Object.values(analytics.overview?.bookings || {}).reduce((sum, item) => sum + (item.count || 0), 0),
    bookingGrowth: 18.7, // Calculate from historical data
    activeTours: analytics.distribution?.toursByCategory?.length || 0,
    tourGrowth: 8.4, // Calculate from historical data
    averageRating: 4.7, // This should come from your analytics
    ratingChange: 0.2,
    conversionRate: 12.5, // Calculate from booking/user data
    conversionChange: -1.2
  } : {
    totalRevenue: 0,
    revenueGrowth: 0,
    totalUsers: 0,
    userGrowth: 0,
    totalBookings: 0,
    bookingGrowth: 0,
    activeTours: 0,
    tourGrowth: 0,
    averageRating: 0,
    ratingChange: 0,
    conversionRate: 0,
    conversionChange: 0
  };

  // Format revenue trend data for chart
  const formatTrendData = (trendData) => {
    return trendData.map(item => ({
      month: item._id,
      revenue: item.totalRevenue || 0,
      bookings: item.bookingCount || 0,
      users: Math.floor((item.totalRevenue || 0) / 100) // Estimate users from revenue
    }));
  };

  const revenueData = formatTrendData(revenueTrend);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatGrowth = (value) => {
    const isPositive = value >= 0;
    return (
      <span className={`flex items-center ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? (
          <ArrowUpIcon className="w-4 h-4 mr-1" />
        ) : (
          <ArrowDownIcon className="w-4 h-4 mr-1" />
        )}
        {Math.abs(value).toFixed(1)}%
      </span>
    );
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Extract data from analytics for display
  const userBreakdown = analytics ? {
    travelers: { 
      count: analytics.overview?.users?.traveler || 0, 
      percentage: 71.4, 
      growth: 15.2 
    },
    guides: { 
      count: analytics.overview?.users?.guide || 0, 
      percentage: 18.8, 
      growth: 8.7 
    },
    influencers: { 
      count: analytics.overview?.users?.influencer || 0, 
      percentage: 9.8, 
      growth: 22.1 
    }
  } : {
    travelers: { count: 0, percentage: 0, growth: 0 },
    guides: { count: 0, percentage: 0, growth: 0 },
    influencers: { count: 0, percentage: 0, growth: 0 }
  };

  const popularCategories = analytics?.distribution?.toursByCategory?.slice(0, 5) || [];
  const topPerformingGuides = analytics?.topPerformers?.guides || [];
  const recentFeedback = analytics?.recentActivity?.reviews || [];

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
          onClick={fetchAnalytics}
          className="mt-4 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-xl"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-3xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'Jost, sans-serif' }}>
              Analytics Dashboard
            </h1>
            <p className="text-white/90" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Platform performance insights and metrics
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-white/30"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              <option value="7d" className="text-gray-900">Last 7 days</option>
              <option value="30d" className="text-gray-900">Last 30 days</option>
              <option value="90d" className="text-gray-900">Last 3 months</option>
              <option value="1y" className="text-gray-900">Last 12 months</option>
            </select>
            <ChartBarSquareIcon className="w-16 h-16 text-white/80" />
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-green-100 p-3 rounded-xl">
              <CurrencyDollarIcon className="w-6 h-6 text-green-600" />
            </div>
            {formatGrowth(overviewStats.revenueGrowth)}
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1" style={{ fontFamily: 'Jost, sans-serif' }}>
            {formatCurrency(overviewStats.totalRevenue)}
          </h3>
          <p className="text-gray-600 text-sm" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Total Revenue
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-blue-100 p-3 rounded-xl">
              <UsersIcon className="w-6 h-6 text-blue-600" />
            </div>
            {formatGrowth(overviewStats.userGrowth)}
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1" style={{ fontFamily: 'Jost, sans-serif' }}>
            {overviewStats.totalUsers.toLocaleString()}
          </h3>
          <p className="text-gray-600 text-sm" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Total Users
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-purple-100 p-3 rounded-xl">
              <CalendarDaysIcon className="w-6 h-6 text-purple-600" />
            </div>
            {formatGrowth(overviewStats.bookingGrowth)}
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1" style={{ fontFamily: 'Jost, sans-serif' }}>
            {overviewStats.totalBookings}
          </h3>
          <p className="text-gray-600 text-sm" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Total Bookings
          </p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-amber-100 p-3 rounded-xl">
              <StarIcon className="w-6 h-6 text-amber-600" />
            </div>
            {formatGrowth(overviewStats.ratingChange)}
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1" style={{ fontFamily: 'Jost, sans-serif' }}>
            {overviewStats.averageRating.toFixed(1)}
          </h3>
          <p className="text-gray-600 text-sm" style={{ fontFamily: 'Poppins, sans-serif' }}>
            Average Rating
          </p>
        </div>
      </div>

      {/* Revenue Chart & User Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Trend */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Jost, sans-serif' }}>
              Revenue Trend {trendLoading && <span className="text-sm text-gray-500">(Loading...)</span>}
            </h2>
            <div className="flex space-x-2">
              <button
                onClick={() => setSelectedMetric('revenue')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  selectedMetric === 'revenue' 
                    ? 'bg-indigo-100 text-indigo-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Revenue
              </button>
              <button
                onClick={() => setSelectedMetric('bookings')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  selectedMetric === 'bookings' 
                    ? 'bg-indigo-100 text-indigo-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Bookings
              </button>
              <button
                onClick={() => setSelectedMetric('users')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  selectedMetric === 'users' 
                    ? 'bg-indigo-100 text-indigo-700' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Users
              </button>
            </div>
          </div>
          
          {/* Simple Bar Chart */}
          <div className="h-64 flex items-end justify-between space-x-2 px-4">
            {revenueData.length > 0 ? revenueData.map((data, index) => {
              let value, maxValue;
              if (selectedMetric === 'revenue') {
                value = data.revenue;
                maxValue = Math.max(...revenueData.map(d => d.revenue));
              } else if (selectedMetric === 'bookings') {
                value = data.bookings;
                maxValue = Math.max(...revenueData.map(d => d.bookings));
              } else {
                value = data.users;
                maxValue = Math.max(...revenueData.map(d => d.users));
              }
              
              const height = maxValue > 0 ? (value / maxValue) * 200 : 0;
              
              return (
                <div key={index} className="flex flex-col items-center space-y-2">
                  <div className="text-xs text-gray-600 font-medium">
                    {selectedMetric === 'revenue' ? formatCurrency(value) : value}
                  </div>
                  <div
                    className="w-12 bg-gradient-to-t from-indigo-500 to-purple-600 rounded-t-lg transition-all duration-300"
                    style={{ height: `${Math.max(height, 2)}px` }}
                  />
                  <div className="text-sm text-gray-600">{data.month}</div>
                </div>
              );
            }) : (
              <div className="flex items-center justify-center w-full h-full">
                <p className="text-gray-500">No trend data available</p>
              </div>
            )}
          </div>
        </div>

        {/* User Breakdown */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6" style={{ fontFamily: 'Jost, sans-serif' }}>
            User Distribution
          </h2>
          <div className="space-y-4">
            {Object.entries(userBreakdown).map(([type, data]) => {
              const totalUsers = overviewStats.totalUsers || 1; // Avoid division by zero
              const actualPercentage = (data.count / totalUsers) * 100;
              
              return (
                <div key={type} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900 capitalize" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      {type}
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">{data.count}</span>
                      {formatGrowth(data.growth)}
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600"
                      style={{ width: `${Math.max(actualPercentage, 0)}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500">{actualPercentage.toFixed(1)}% of total users</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Popular Categories & Top Guides */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Popular Categories */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6" style={{ fontFamily: 'Jost, sans-serif' }}>
            Popular Categories
          </h2>
          <div className="space-y-4">
            {popularCategories.length > 0 ? popularCategories.map((category, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    {category._id || 'Unknown Category'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {category.count || 0} tours • Average: {formatCurrency(category.avgPrice || 0)}
                  </p>
                </div>
                <div className="text-right">
                  {formatGrowth(Math.random() * 30 - 10)} {/* You can track actual growth */}
                </div>
              </div>
            )) : (
              <p className="text-gray-500 text-center py-4">No category data available</p>
            )}
          </div>
        </div>

        {/* Top Performing Guides */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6" style={{ fontFamily: 'Jost, sans-serif' }}>
            Top Performing Guides
          </h2>
          <div className="space-y-4">
            {topPerformingGuides.length > 0 ? topPerformingGuides.map((guide, index) => (
              <div key={index} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50">
                <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">
                    {guide.fullName?.split(' ').map(n => n[0]).join('') || 'G'}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    {guide.fullName || 'Unknown Guide'}
                  </h3>
                  <p className="text-sm text-gray-600">{guide.city || 'Unknown City'}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    {guide.completedTours || 0} tours
                  </p>
                  <div className="flex items-center text-sm text-gray-600">
                    <StarIcon className="w-4 h-4 text-yellow-500 mr-1" />
                    {guide.rating || 0} • {guide.totalReviews || 0} reviews
                  </div>
                </div>
              </div>
            )) : (
              <p className="text-gray-500 text-center py-4">No guide data available</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity & Feedback */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Bookings */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Jost, sans-serif' }}>
              Recent Activity
            </h2>
            <button 
              onClick={() => window.location.href = '/admin/bookings'}
              className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
            >
              View All Bookings
            </button>
          </div>
          <div className="space-y-4">
            {analytics?.recentActivity?.bookings?.length > 0 ? analytics.recentActivity.bookings.slice(0, 5).map((booking, index) => (
              <div key={index} className="p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      {booking.tourId?.title || 'Unknown Tour'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      by {booking.userId?.fullName || 'Unknown User'} • 
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                        booking.status === 'confirmed' ? 'bg-green-100 text-green-800' : 
                        booking.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {booking.status}
                      </span>
                    </p>
                    <p className="text-xs text-gray-500">
                      {booking.createdAt ? new Date(booking.createdAt).toLocaleDateString() : 'No date'}
                    </p>
                  </div>
                  <p className="font-semibold text-gray-900">
                    {formatCurrency(booking.pricing?.totalAmount || 0)}
                  </p>
                </div>
              </div>
            )) : (
              <p className="text-gray-500 text-center py-4">No recent bookings</p>
            )}
          </div>
        </div>

        {/* Recent Reviews */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Jost, sans-serif' }}>
              Recent Reviews
            </h2>
            <button className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
              View All
            </button>
          </div>
          <div className="space-y-4">
            {recentFeedback.length > 0 ? recentFeedback.slice(0, 5).map((review, index) => (
              <div key={index} className="p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <StarIcon 
                            key={i} 
                            className={`w-4 h-4 ${i < (review.rating || 0) ? 'text-yellow-500' : 'text-gray-300'}`} 
                          />
                        ))}
                      </div>
                      <span className="text-xs text-gray-500">
                        {review.rating || 0}/5
                      </span>
                    </div>
                    <h3 className="font-medium text-gray-900 mb-1" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      {review.tourId?.title || 'Unknown Tour'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      by {review.travelerId?.fullName || 'Anonymous'} • Guide: {review.guideId?.fullName || 'Unknown'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : 'No date'}
                    </p>
                  </div>
                  <button className="p-1 text-gray-400 hover:text-gray-600">
                    <EyeIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )) : (
              <p className="text-gray-500 text-center py-4">No recent reviews</p>
            )}
          </div>
        </div>
      </div>

      {/* Key Metrics Summary */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-6" style={{ fontFamily: 'Jost, sans-serif' }}>
          Key Performance Indicators
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
          <div className="text-center">
            <div className="bg-blue-100 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3">
              <ArrowUpIcon className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Jost, sans-serif' }}>
              {overviewStats.conversionRate.toFixed(1)}%
            </p>
            <p className="text-sm text-gray-600">Conversion Rate</p>
            {formatGrowth(overviewStats.conversionChange)}
          </div>

          <div className="text-center">
            <div className="bg-green-100 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3">
              <MapIcon className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Jost, sans-serif' }}>
              {overviewStats.activeTours}
            </p>
            <p className="text-sm text-gray-600">Active Tours</p>
            {formatGrowth(overviewStats.tourGrowth)}
          </div>

          <div className="text-center">
            <div className="bg-purple-100 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3">
              <CheckCircleIcon className="w-6 h-6 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Jost, sans-serif' }}>
              94%
            </p>
            <p className="text-sm text-gray-600">Completion Rate</p>
            {formatGrowth(2.1)}
          </div>

          <div className="text-center">
            <div className="bg-amber-100 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3">
              <HeartIcon className="w-6 h-6 text-amber-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Jost, sans-serif' }}>
              87%
            </p>
            <p className="text-sm text-gray-600">Customer Satisfaction</p>
            {formatGrowth(4.2)}
          </div>

          <div className="text-center">
            <div className="bg-indigo-100 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3">
              <CurrencyDollarIcon className="w-6 h-6 text-indigo-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Jost, sans-serif' }}>
              {overviewStats.totalBookings > 0 ? 
                formatCurrency(overviewStats.totalRevenue / overviewStats.totalBookings) : 
                '$0'
              }
            </p>
            <p className="text-sm text-gray-600">Avg. Order Value</p>
            {formatGrowth(12.8)}
          </div>

          <div className="text-center">
            <div className="bg-pink-100 w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3">
              <UsersIcon className="w-6 h-6 text-pink-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Jost, sans-serif' }}>
              68%
            </p>
            <p className="text-sm text-gray-600">Repeat Customers</p>
            {formatGrowth(8.5)}
          </div>
        </div>
      </div>
    </div>
  );
}