'use client';
import React, { useState, useEffect } from 'react';
import {
  FireIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UsersIcon,
  MapIcon,
  CurrencyDollarIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  CalendarDaysIcon,
  ArrowPathIcon,
  FunnelIcon,
  DevicePhoneMobileIcon,
  ShieldCheckIcon,
  BellIcon,
  HeartIcon,
  ShareIcon,
  ChartBarIcon,
  GlobeAltIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import apiService from '../../../lib/apiService';

const FirebaseAnalyticsPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [events, setEvents] = useState([]);
  const [errors, setErrors] = useState([]);
  const [stats, setStats] = useState({});
  const [userBehavior, setUserBehavior] = useState({});
  const [performance, setPerformance] = useState([]);
  const [conversionFunnel, setConversionFunnel] = useState([]);
  const [screenAnalytics, setScreenAnalytics] = useState([]);
  const [userProperties, setUserProperties] = useState({});
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('24h');
  const [selectedTab, setSelectedTab] = useState('events');
  const [searchTerm, setSearchTerm] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    fetchAnalyticsData();
  }, [selectedFilter, selectedPeriod]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Fetching Firebase Analytics data...');
      
      // Fetch comprehensive Firebase Analytics data
      const [eventsResponse, behaviorResponse, performanceResponse] = await Promise.all([
        apiService.request('/api/admin/analytics/firebase-events', {
          method: 'POST',
          body: JSON.stringify({
            period: selectedPeriod,
            eventFilter: selectedFilter,
            includeErrors: true
          }),
          useCache: false // Always get fresh analytics data
        }).catch(err => {
          console.error('Events API Error:', err);
          throw new Error(`Events API failed: ${err.message}`);
        }),
        
        apiService.request('/api/admin/analytics/user-behavior', {
          method: 'POST',
          body: JSON.stringify({ period: selectedPeriod }),
          useCache: false
        }).catch(err => {
          console.error('Behavior API Error:', err);
          return null; // Non-critical
        }),
        
        apiService.request('/api/admin/analytics/performance', {
          method: 'POST', 
          body: JSON.stringify({ period: selectedPeriod }),
          useCache: false
        }).catch(err => {
          console.error('Performance API Error:', err);
          return null; // Non-critical
        })
      ]);

      // Process events response (critical)
      if (eventsResponse?.success) {
        setEvents(eventsResponse.data.events || []);
        setErrors(eventsResponse.data.errors || []);
        setStats(eventsResponse.data.stats || {});
        console.log('✅ Events data loaded:', eventsResponse.data);
      } else {
        throw new Error('Failed to load events data');
      }

      // Process behavior response (optional)
      if (behaviorResponse?.success) {
        const behaviorData = behaviorResponse.data || {};
        setUserBehavior(behaviorData);
        setScreenAnalytics(behaviorData.screenAnalytics || []);
        setUserProperties(behaviorData.userSegmentation || {});
        setConversionFunnel(behaviorData.conversionFunnel || []);
        console.log('✅ Behavior data loaded:', behaviorData);
      }

      // Process performance response (optional)
      if (performanceResponse?.success) {
        setPerformance(performanceResponse.data || []);
        console.log('✅ Performance data loaded:', performanceResponse.data);
      }

      setRetryCount(0); // Reset retry count on success
      
    } catch (error) {
      console.error('❌ Firebase Analytics Error:', error);
      setError(error.message || 'Failed to load analytics data');
      
      // Clear any existing data on error
      setEvents([]);
      setErrors([]);
      setStats({});
      setUserBehavior({});
      setPerformance([]);
      setConversionFunnel([]);
      setScreenAnalytics([]);
      setUserProperties({});
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    fetchAnalyticsData();
  };

  const getEventIcon = (eventName) => {
    switch (eventName.toLowerCase()) {
      case 'login':
      case 'sign_up':
        return <UsersIcon className="w-5 h-5 text-blue-600" />;
      case 'tour_viewed':
      case 'tour_created':
        return <MapIcon className="w-5 h-5 text-green-600" />;
      case 'purchase':
        return <CurrencyDollarIcon className="w-5 h-5 text-purple-600" />;
      case 'search':
        return <MagnifyingGlassIcon className="w-5 h-5 text-orange-600" />;
      case 'prayer_time_viewed':
        return <ClockIcon className="w-5 h-5 text-indigo-600" />;
      case 'add_to_wishlist':
        return <HeartIcon className="w-5 h-5 text-pink-600" />;
      case 'share':
        return <ShareIcon className="w-5 h-5 text-cyan-600" />;
      case 'notification_interaction':
        return <BellIcon className="w-5 h-5 text-yellow-600" />;
      default:
        return <InformationCircleIcon className="w-5 h-5 text-gray-600" />;
    }
  };

  const getEventColor = (eventName) => {
    switch (eventName.toLowerCase()) {
      case 'login':
      case 'sign_up':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'tour_viewed':
      case 'tour_created':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'purchase':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'search':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'prayer_time_viewed':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'add_to_wishlist':
        return 'bg-pink-100 text-pink-800 border-pink-200';
      case 'share':
        return 'bg-cyan-100 text-cyan-800 border-cyan-200';
      case 'notification_interaction':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Unknown time';
    
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diff = now - date;
      
      if (isNaN(diff)) return 'Invalid date';
      
      if (diff < 60000) return 'Just now';
      if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
      if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    } catch (e) {
      return 'Invalid date';
    }
  };

  const filteredEvents = events.filter(event => {
    if (selectedFilter !== 'all' && event.eventName !== selectedFilter) return false;
    if (searchTerm && !event.eventName.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const filteredErrors = errors.filter(error => {
    if (searchTerm && !error.errorMessage.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-3xl p-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'Jost, sans-serif' }}>
                Firebase Analytics
              </h1>
              <p className="text-white/90" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Loading real-time analytics data...
              </p>
            </div>
            <FireIcon className="w-16 h-16 text-white/80" />
          </div>
        </div>
        
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Fetching Firebase Analytics data...</p>
            {retryCount > 0 && (
              <p className="text-sm text-gray-500 mt-2">Retry attempt {retryCount}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-red-500 via-pink-500 to-purple-500 rounded-3xl p-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'Jost, sans-serif' }}>
                Firebase Analytics
              </h1>
              <p className="text-white/90" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Unable to load analytics data
              </p>
            </div>
            <ExclamationCircleIcon className="w-16 h-16 text-white/80" />
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
          <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-red-900 mb-2">Analytics Data Unavailable</h3>
          <p className="text-red-700 mb-6 max-w-2xl mx-auto">
            {error}
          </p>
          
          <div className="space-y-4">
            <button
              onClick={handleRetry}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
            >
              <ArrowPathIcon className="w-5 h-5 inline mr-2" />
              Retry Connection ({retryCount}/3)
            </button>
            
            <div className="bg-red-100 border border-red-300 rounded-xl p-4 text-left max-w-2xl mx-auto">
              <h4 className="font-semibold text-red-900 mb-2">Troubleshooting Steps:</h4>
              <ul className="text-sm text-red-800 space-y-1 list-disc pl-5">
                <li>Check if your backend server is running</li>
                <li>Verify Firebase service account credentials are configured</li>
                <li>Ensure FIREBASE_GA_PROPERTY_ID environment variable is set</li>
                <li>Check network connectivity</li>
                <li>Verify authentication middleware allows admin access</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // No data state
  if (!events.length && !errors.length && Object.keys(stats).length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-3xl p-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'Jost, sans-serif' }}>
                Firebase Analytics
              </h1>
              <p className="text-white/90" style={{ fontFamily: 'Poppins, sans-serif' }}>
                No analytics data available
              </p>
            </div>
            <FireIcon className="w-16 h-16 text-white/80" />
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 text-center">
          <InformationCircleIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900 mb-2">No Analytics Data</h3>
          <p className="text-gray-600 mb-6">
            No Firebase Analytics events found for the selected period. This could mean:
          </p>
          
          <div className="bg-white border border-gray-200 rounded-xl p-4 text-left max-w-2xl mx-auto mb-6">
            <ul className="text-sm text-gray-700 space-y-2 list-disc pl-5">
              <li>No users have interacted with your app recently</li>
              <li>Firebase Analytics is not properly configured in your mobile app</li>
              <li>The selected time period has no recorded events</li>
              <li>Analytics events are still being processed by Firebase</li>
            </ul>
          </div>

          <button
            onClick={handleRetry}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
          >
            <ArrowPathIcon className="w-5 h-5 inline mr-2" />
            Refresh Data
          </button>
        </div>
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
              Firebase Analytics
            </h1>
            <p className="text-white/90" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Real-time events and error tracking from your Muslifie app
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={fetchAnalyticsData}
              className="bg-white/20 hover:bg-white/30 p-3 rounded-xl transition-colors"
              title="Refresh Data"
            >
              <ArrowPathIcon className="w-6 h-6" />
            </button>
            <FireIcon className="w-16 h-16 text-white/80" />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-xl">
              <CheckCircleIcon className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Jost, sans-serif' }}>
                {stats.totalEvents || 0}
              </p>
              <p className="text-sm text-gray-600">Total Events</p>
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
                {stats.totalErrors || 0}
              </p>
              <p className="text-sm text-gray-600">Total Errors</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-xl">
              <UsersIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Jost, sans-serif' }}>
                {stats.activeUsers || 0}
              </p>
              <p className="text-sm text-gray-600">Active Users</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center">
            <div className="bg-purple-100 p-3 rounded-xl">
              <EyeIcon className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Jost, sans-serif' }}>
                {stats.topEvents?.tour_viewed || stats.topEvents?.view_item || 0}
              </p>
              <p className="text-sm text-gray-600">Tour Views</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search events or errors..."
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
                className="bg-gray-100 border-0 rounded-xl py-2 px-3 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                <option value="all">All Events</option>
                <option value="login">Login</option>
                <option value="sign_up">Sign Up</option>
                <option value="tour_viewed">Tour Views</option>
                <option value="view_item">View Item</option>
                <option value="purchase">Purchases</option>
                <option value="search">Searches</option>
                <option value="prayer_time_viewed">Prayer Times</option>
                <option value="add_to_wishlist">Wishlist</option>
                <option value="share">Share</option>
              </select>

              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="bg-gray-100 border-0 rounded-xl py-2 px-3 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                <option value="1h">Last Hour</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Tabs */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-200 overflow-x-auto">
          {[
            { id: 'events', name: 'Events', count: filteredEvents.length },
            { id: 'errors', name: 'Errors', count: filteredErrors.length },
            { id: 'screens', name: 'Screen Analytics', count: screenAnalytics.length },
            { id: 'users', name: 'User Behavior', count: userProperties.byType?.length || 0 },
            { id: 'performance', name: 'Performance', count: performance.length },
            { id: 'funnel', name: 'Conversion Funnel', count: conversionFunnel.length }
          ].map((tab) => (
            <button
              key={tab.id}
              className={`flex-shrink-0 px-6 py-4 text-center font-medium transition-colors ${
                selectedTab === tab.id 
                  ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-500' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setSelectedTab(tab.id)}
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              {tab.name} ({tab.count})
            </button>
          ))}
        </div>

        {/* Events Tab */}
        {selectedTab === 'events' && (
          <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
            {filteredEvents.length === 0 ? (
              <div className="text-center py-12">
                <InformationCircleIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  No events found for the selected filters
                </p>
              </div>
            ) : (
              filteredEvents.map((event) => (
                <div key={event.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start">
                      <div className="mr-4 mt-1">
                        {getEventIcon(event.eventName)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getEventColor(event.eventName)}`}>
                            {event.eventName}
                          </span>
                          <span className="ml-3 text-sm text-gray-500">
                            User: {event.userId || 'Anonymous'}
                          </span>
                          <span className="ml-3 text-sm text-gray-500 capitalize">
                            {event.platform || 'Unknown'}
                          </span>
                        </div>
                        {event.parameters && Object.keys(event.parameters).length > 0 && (
                          <div className="text-sm text-gray-600 space-y-1">
                            {Object.entries(event.parameters).map(([key, value]) => (
                              <div key={key} className="flex">
                                <span className="font-medium text-gray-700 w-24">{key}:</span>
                                <span>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      {formatTimestamp(event.timestamp)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Errors Tab */}
        {selectedTab === 'errors' && (
          <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
            {filteredErrors.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircleIcon className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <p className="text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  No errors found - great job!
                </p>
              </div>
            ) : (
              filteredErrors.map((error) => (
                <div key={error.id} className="p-6 hover:bg-red-50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start">
                      <div className="mr-4 mt-1">
                        <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 border border-red-200">
                            {error.errorType}
                          </span>
                          <span className="ml-3 text-sm text-gray-500">
                            User: {error.userId || 'Anonymous'}
                          </span>
                          <span className="ml-3 text-sm text-gray-500 capitalize">
                            {error.platform || 'Unknown'}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-gray-900 mb-2">
                          {error.errorMessage}
                        </p>
                        <div className="text-sm text-gray-600">
                          <div className="mb-1">
                            <span className="font-medium">Screen:</span> {error.screenName || 'Unknown'}
                          </div>
                          {error.stackTrace && (
                            <div className="text-xs bg-gray-100 p-2 rounded font-mono max-w-md overflow-x-auto">
                              {error.stackTrace}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      {formatTimestamp(error.timestamp)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Screen Analytics Tab */}
        {selectedTab === 'screens' && (
          <div className="p-6">
            {screenAnalytics.length === 0 ? (
              <div className="text-center py-12">
                <ChartBarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No screen analytics data available</p>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4" style={{ fontFamily: 'Jost, sans-serif' }}>
                    Screen Analytics
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Screen Views</h4>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={screenAnalytics}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="screenName" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="views" fill="#6366f1" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Average Time on Screen</h4>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={screenAnalytics}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="screenName" />
                          <YAxis />
                          <Tooltip formatter={(value) => [`${value}s`, 'Avg Time']} />
                          <Bar dataKey="avgTime" fill="#8b5cf6" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  {screenAnalytics.map((screen, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center">
                        <DevicePhoneMobileIcon className="w-5 h-5 text-gray-600 mr-3" />
                        <div>
                          <p className="font-semibold text-gray-900">{screen.screenName}</p>
                          <p className="text-sm text-gray-600">
                            Bounce Rate: {((screen.bounceRate || 0) * 100).toFixed(1)}%
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">{(screen.views || 0).toLocaleString()}</p>
                        <p className="text-sm text-gray-600">{screen.avgTime || 0}s avg</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* User Behavior Tab */}
        {selectedTab === 'users' && (
          <div className="p-6">
            {Object.keys(userProperties).length === 0 ? (
              <div className="text-center py-12">
                <UsersIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No user behavior data available</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* User Types */}
                {userProperties.byType && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">User Types</h4>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={userProperties.byType}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ type, percentage }) => `${type} ${percentage}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="users"
                        >
                          {userProperties.byType.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={['#6366f1', '#8b5cf6', '#ec4899'][index % 3]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Platform Distribution */}
                {userProperties.byPlatform && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Platform Distribution</h4>
                    <div className="space-y-3">
                      {userProperties.byPlatform.map((platform, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <DevicePhoneMobileIcon className="w-5 h-5 text-gray-600 mr-3" />
                            <span className="font-medium text-gray-900 capitalize">{platform.platform}</span>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-gray-900">{(platform.users || 0).toLocaleString()}</div>
                            <div className="text-sm text-gray-600">{platform.percentage || 0}%</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Top Cities */}
                {userProperties.byLocation && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Top Cities</h4>
                    <div className="space-y-3">
                      {userProperties.byLocation.map((city, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <GlobeAltIcon className="w-5 h-5 text-gray-600 mr-3" />
                            <span className="font-medium text-gray-900">{city.city}</span>
                          </div>
                          <span className="font-bold text-gray-900">{(city.users || 0).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Performance Tab */}
        {selectedTab === 'performance' && (
          <div className="p-6">
            {performance.length === 0 ? (
              <div className="text-center py-12">
                <ShieldCheckIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No performance data available</p>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-bold text-gray-900 mb-4" style={{ fontFamily: 'Jost, sans-serif' }}>
                  App Performance Metrics
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {performance.map((metric, index) => (
                    <div key={index} className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">{metric.metric}</h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          metric.status === 'excellent' ? 'bg-green-100 text-green-800' :
                          metric.status === 'good' ? 'bg-blue-100 text-blue-800' :
                          metric.status === 'warning' ? 'bg-orange-100 text-orange-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {metric.status}
                        </span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900 mb-1">
                        {metric.avgValue} {metric.unit}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Conversion Funnel Tab */}
        {selectedTab === 'funnel' && (
          <div className="p-6">
            {conversionFunnel.length === 0 ? (
              <div className="text-center py-12">
                <FunnelIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No conversion funnel data available</p>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-bold text-gray-900 mb-4" style={{ fontFamily: 'Jost, sans-serif' }}>
                  Conversion Funnel
                </h3>
                <div className="space-y-4">
                  {conversionFunnel.map((step, index) => (
                    <div key={index} className="relative">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 ${
                            step.conversionRate >= 80 ? 'bg-green-100 text-green-600' :
                            step.conversionRate >= 60 ? 'bg-blue-100 text-blue-600' :
                            step.conversionRate >= 40 ? 'bg-orange-100 text-orange-600' :
                            'bg-red-100 text-red-600'
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{step.step}</p>
                            <p className="text-sm text-gray-600">
                              {(step.users || 0).toLocaleString()} users • {step.conversionRate || 0}% conversion
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                step.conversionRate >= 80 ? 'bg-green-500' :
                                step.conversionRate >= 60 ? 'bg-blue-500' :
                                step.conversionRate >= 40 ? 'bg-orange-500' :
                                'bg-red-500'
                              }`}
                              style={{ width: `${step.conversionRate || 0}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      {index < conversionFunnel.length - 1 && (
                        <div className="flex justify-center py-2">
                          <div className="w-0.5 h-4 bg-gray-300"></div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FirebaseAnalyticsPage;