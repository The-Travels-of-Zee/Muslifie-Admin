'use client';
import React, { useState, useEffect } from 'react';
import {
  HomeIcon,
  UsersIcon,
  MapIcon,
  CalendarDaysIcon,
  CurrencyDollarIcon,
  BanknotesIcon,
  ChartBarSquareIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  BellIcon,
  MagnifyingGlassIcon,
  Bars3Icon,
  XMarkIcon,
  ShieldCheckIcon,
  PaperAirplaneIcon,
  ChatBubbleLeftIcon,
  FireIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import apiService from '../../lib/apiService';

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [badges, setBadges] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  
  const router = useRouter();
  const pathname = usePathname();

  // Updated menu items with Firebase Analytics
  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: HomeIcon, href: '/dashboard', badge: null },
    { id: 'users', name: 'Users', icon: UsersIcon, href: '/dashboard/users', badge: badges.users },
    { id: 'verification', name: 'Verification', icon: ShieldCheckIcon, href: '/dashboard/verification', badge: badges.verification },
    { id: 'tours', name: 'Tours', icon: MapIcon, href: '/dashboard/tours', badge: badges.tours },
    { id: 'bookings', name: 'Bookings', icon: CalendarDaysIcon, href: '/dashboard/bookings', badge: null },
    { id: 'earnings', name: 'Earnings', icon: CurrencyDollarIcon, href: '/dashboard/earnings', badge: badges.earnings },
    { id: 'withdrawals', name: 'Withdrawals', icon: BanknotesIcon, href: '/dashboard/withdrawals', badge: badges.withdrawals },
    { id: 'firebase-analytics', name: 'Firebase Analytics', icon: FireIcon, href: '/dashboard/firebase-analytics', badge: null },
    { id: 'chat', name: 'Live Chat', icon: ChatBubbleLeftIcon, href: '/dashboard/chat', badge: badges.chat },
    { id: 'email', name: 'Send Email', icon: PaperAirplaneIcon, href: '/dashboard/email', badge: null },
   
    { id: 'analytics', name: 'Analytics', icon: ChartBarSquareIcon, href: '/dashboard/analytics', badge: null },
   
    // { id: 'settings', name: 'Settings', icon: Cog6ToothIcon, href: '/dashboard/settings', badge: null }
  ];

  // Fetch badge counts in the background (non-blocking)
  useEffect(() => {
    fetchBadgeCounts();
    fetchCurrentUser();
    
    // Refresh badges every 30 seconds
    const interval = setInterval(fetchBadgeCounts, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchBadgeCounts = async () => {
    try {
      // Try to fetch pending counts, but don't block if APIs fail
      const promises = [
        apiService.getVerifications({ status: 'pending', limit: 1 }).catch(() => null),
        apiService.getEarnings({ status: 'pending', limit: 1 }).catch(() => null),
        apiService.getTours({ status: 'pending_review', limit: 1 }).catch(() => null),
        apiService.getUsers({ verificationStatus: 'pending', limit: 1 }).catch(() => null)
      ];

      const [verificationsRes, earningsRes, toursRes, usersRes] = await Promise.all(promises);
      
      const newBadges = {};

      // Process responses only if they succeeded
      
      if (verificationsRes) {
        const data = verificationsRes.data || verificationsRes;
        const count = data.stats?.pendingCount || (data.verifications?.length || 0);
        if (count > 0) newBadges.verification = count;
      }

      if (earningsRes) {
        const data = earningsRes.data || earningsRes;
        const count = data.earnings?.filter(e => e.status === 'pending').length || 0;
        if (count > 0) {
          newBadges.earnings = count;
          newBadges.withdrawals = count; // Same data for withdrawals
        }
      }

      if (toursRes) {
        const data = toursRes.data || toursRes;
        const count = data.tours?.filter(t => t.status === 'pending_review').length || 0;
        if (count > 0) newBadges.tours = count;
      }

      if (usersRes) {
        const data = usersRes.data || usersRes;
        const count = data.users?.filter(u => u.verificationStatus === 'pending').length || 0;
        if (count > 0) newBadges.users = count;
      }

      setBadges(newBadges);
      
      // Create simple notifications from badge counts
      const newNotifications = [];
      if (newBadges.verification) {
        newNotifications.push({
          id: 1,
          title: 'Pending Verifications',
          message: `${newBadges.verification} verification requests need review`
        });
      }
      if (newBadges.earnings) {
        newNotifications.push({
          id: 2,
          title: 'Pending Payments',
          message: `${newBadges.earnings} payments ready for release`
        });
      }
      if (newBadges.tours) {
        newNotifications.push({
          id: 3,
          title: 'Tours Awaiting Approval', 
          message: `${newBadges.tours} tours need admin approval`
        });
      }
      setNotifications(newNotifications);

    } catch (error) {
      console.error('Error fetching badge counts:', error);
      // Don't show error to user, just continue without badges
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const storedUser = apiService.getUser();
      setCurrentUser(storedUser || {
        fullName: 'Admin User',
        email: 'admin@muslifie.com',
        role: 'Administrator'
      });
    } catch (error) {
      setCurrentUser({
        fullName: 'Admin User',
        email: 'admin@muslifie.com',
        role: 'Administrator'
      });
    }
  };

  const handleLogout = () => {
    apiService.removeToken();
    router.push('/login');
  };

  const isActiveRoute = (href) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  const getInitials = (name) => {
    if (!name) return 'A';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed left-0 top-0 z-50 h-full w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center">
            <div className="bg-white/20 backdrop-blur-sm border border-white/30 p-2 rounded-2xl shadow-lg">
              <div className="w-10 h-8 flex items-center justify-center">
                <Image 
                  src="/muslifie-logo.png" 
                  alt="Muslifie Logo" 
                  width={40} 
                  height={32}
                  className="object-contain"
                  priority
                />
              </div>
            </div>
            <div className="ml-3">
              <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Jost, sans-serif' }}>
                Muslifie
              </h1>
              <p className="text-sm text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Admin Panel
              </p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-4 space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-left transition-all duration-200 group ${
                isActiveRoute(item.href)
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              <div className="flex items-center">
                <item.icon className={`w-5 h-5 mr-3 ${
                  isActiveRoute(item.href) 
                    ? 'text-indigo-600' 
                    : 'group-hover:text-indigo-600'
                }`} />
                <span className={`font-medium ${
                  isActiveRoute(item.href) 
                    ? 'text-indigo-700' 
                    : 'group-hover:text-indigo-600'
                }`}>
                  {item.name}
                </span>
              </div>
              {item.badge && (
                <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-500 text-white">
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-4 left-4 right-4">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5 mr-3" />
            <span className="font-medium" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Logout
            </span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Top Bar */}
        <div className="bg-white shadow-sm border-b border-gray-100 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 mr-3"
              >
                <Bars3Icon className="w-6 h-6" />
              </button>
              
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="pl-10 pr-4 py-2 bg-gray-100 border-0 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all duration-200"
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <div className="relative group">
                <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl relative">
                  <BellIcon className="w-6 h-6" />
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {notifications.length > 9 ? '9+' : notifications.length}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {notifications.length > 0 && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="p-4 border-b border-gray-100">
                      <h3 className="font-semibold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        Notifications
                      </h3>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.map((notification) => (
                        <div key={notification.id} className="p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0">
                          <p className="font-medium text-sm text-gray-900">{notification.title}</p>
                          <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* User Profile */}
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mr-3">
                  <span className="text-white font-bold text-sm">
                    {getInitials(currentUser?.fullName)}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    {currentUser?.fullName || 'Admin User'}
                  </p>
                  <p className="text-xs text-gray-600">
                    {currentUser?.role || 'Administrator'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}