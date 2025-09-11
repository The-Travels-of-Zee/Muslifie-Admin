'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import apiService from '../../lib/apiService';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Check if user is already logged in
  useEffect(() => {
    const token = apiService.getToken();
    const user = apiService.getUser();
    
    if (token && user) {
      // Verify token is still valid
      apiService.getUserStatus()
        .then(() => {
          // Token is valid, redirect to dashboard
          router.push('/dashboard');
        })
        .catch(() => {
          // Token is invalid, remove it
          apiService.removeToken();
        });
    }
  }, [router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Validate input
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      if (!email.includes('@')) {
        throw new Error('Please enter a valid email address');
      }

      console.log('Attempting login for:', email);

      // Call the real backend API
      const response = await apiService.login({
        email: email.trim().toLowerCase(),
        password: password
      });

      console.log('Login successful:', response);

      // Check if user is admin
      if (response.user.userType !== 'admin') {
        throw new Error('Access denied. Admin privileges required.');
      }

      // Check email verification (optional, depends on your requirements)
      if (!response.user.emailVerified) {
        setError('Please verify your email before accessing the admin panel.');
        return;
      }

      // Success - redirect to dashboard
      router.push('/dashboard');
      
    } catch (error) {
      console.error('Login error:', error);
      
      // Handle different types of errors
      if (error.message.includes('Invalid email or password')) {
        setError('Invalid email or password. Please check your credentials.');
      } else if (error.message.includes('Network')) {
        setError('Unable to connect to server. Please check your internet connection.');
      } else if (error.message.includes('Admin privileges required')) {
        setError('Access denied. This account does not have admin privileges.');
      } else if (error.message.includes('verify your email')) {
        setError('Please verify your email before accessing the admin panel.');
      } else {
        setError(error.message || 'An error occurred during login. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 via-pink-500 to-amber-400">
      <div className="min-h-screen flex">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-12">
          <div className="text-center text-white max-w-md">
            <div className="flex items-center justify-center mb-8">
              <div className="bg-white/15 backdrop-blur-sm p-4 rounded-2xl shadow-lg">
                <div className="w-12 h-8 flex items-center justify-center">
                  <Image 
                    src="/muslifie-logo.png" 
                    alt="Muslifie Logo" 
                    width={48} 
                    height={32}
                    className="object-contain"
                    priority
                  />
                </div>
              </div>
              <div className="ml-4">
                <h1 className="text-4xl font-bold" style={{ fontFamily: 'Jost, sans-serif', letterSpacing: '-0.5px' }}>
                  Muslifie
                </h1>
                <p className="text-white/85 text-sm" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Admin Dashboard
                </p>
              </div>
            </div>
            
            <h2 className="text-3xl font-bold mb-6" style={{ fontFamily: 'Jost, sans-serif' }}>
              Manage Your Platform
            </h2>
            <p className="text-white/90 text-lg leading-relaxed" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Monitor bookings, manage users, approve tours, and oversee the entire Muslifie ecosystem from your centralized admin dashboard.
            </p>
            
            <div className="mt-12 grid grid-cols-2 gap-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                <div className="text-2xl font-bold mb-1">31</div>
                <div className="text-white/80 text-sm">Active Users</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
                <div className="text-2xl font-bold mb-1">10</div>
                <div className="text-white/80 text-sm">Tours</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md mx-4">
            {/* Mobile Logo */}
            <div className="lg:hidden flex items-center justify-center mb-8">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-3 rounded-2xl shadow-lg">
                <div className="w-8 h-6 flex items-center justify-center">
                  <Image 
                    src="/muslifie-logo.png" 
                    alt="Muslifie Logo" 
                    width={32} 
                    height={24}
                    className="object-contain"
                  />
                </div>
              </div>
              <div className="ml-3">
                <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Jost, sans-serif' }}>
                  Muslifie
                </h1>
                <p className="text-gray-600 text-sm" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Admin Login
                </p>
              </div>
            </div>

            <div className="hidden lg:block text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Jost, sans-serif' }}>
                Welcome Back
              </h2>
              <p className="text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Sign in to your admin account
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 transition-colors duration-200"
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                  placeholder="Enter your admin email"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 transition-colors duration-200"
                    style={{ fontFamily: 'Poppins, sans-serif' }}
                    placeholder="Enter your password"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center"
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500"
                    disabled={loading}
                  />
                  <span className="ml-2 text-sm text-gray-700" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Remember me
                  </span>
                </label>
                <button
                  type="button"
                  className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                  disabled={loading}
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 px-4 rounded-xl font-semibold text-white transition-all duration-300 transform hover:scale-105 ${
                  loading 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg hover:shadow-xl'
                }`}
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </div>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            {/* Development/Testing Info */}
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-8 text-center">
                <p className="text-gray-600 text-xs" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Development Mode: Enter your admin credentials from the backend
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}