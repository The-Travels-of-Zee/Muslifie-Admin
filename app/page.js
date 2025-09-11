'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import apiService from '../lib/apiService';

export default function Home() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthenticationStatus();
  }, []);

  const checkAuthenticationStatus = async () => {
    try {
      const token = apiService.getToken();
      const user = apiService.getUser();
      
      console.log('Checking auth status:', { token: !!token, user: !!user });

      if (!token || !user) {
        console.log('No token or user found, redirecting to login');
        router.push('/login');
        return;
      }

      // Verify token is still valid by checking user status
      const response = await apiService.getUserStatus();
      console.log('User status response:', response);

      // Check if user is admin
      if (response.user.userType !== 'admin') {
        console.log('User is not admin, redirecting to login');
        apiService.removeToken(); // Clear invalid session
        router.push('/login');
        return;
      }

      // Check email verification (optional)
      if (!response.user.emailVerified) {
        console.log('Email not verified, redirecting to login');
        router.push('/login');
        return;
      }

      console.log('User is authenticated admin, redirecting to dashboard');
      router.push('/dashboard');

    } catch (error) {
      console.error('Auth check failed:', error);
      // Token is invalid or expired
      apiService.removeToken();
      router.push('/login');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 via-pink-500 to-amber-400 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-white/15 backdrop-blur-sm p-4 rounded-2xl shadow-lg">
              <div className="w-12 h-8 bg-white rounded-lg flex items-center justify-center">
                <span className="text-indigo-600 font-bold text-xl">M</span>
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
          
          <div className="flex items-center justify-center space-x-2">
            <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-lg" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Checking authentication...
            </span>
          </div>
        </div>
      </div>
    );
  }

  // This should rarely be seen since we redirect quickly
  return null;
}