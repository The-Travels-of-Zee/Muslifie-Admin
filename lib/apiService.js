// lib/api/apiService.js - 
class ApiService {
  constructor() {
    // Update this URL to match your backend server
    this.baseURL = process.env.NEXT_PUBLIC_API_URL;
    
    // Cache configuration
    this.cache = new Map();
    this.cacheConfig = {
      // Default cache TTL in milliseconds
      defaultTTL: 5 * 60 * 1000, // 5 minutes
      
      // Specific TTLs for different endpoints
      endpointTTL: {
        '/admin/analytics/overview': 2 * 60 * 1000, // 2 minutes
        '/admin/analytics/revenue-trend': 5 * 60 * 1000, // 5 minutes
        '/admin/bookings': 1 * 60 * 1000, // 1 minute
        '/admin/earnings': 1 * 60 * 1000, // 1 minute
        '/admin/users': 10 * 60 * 1000, // 10 minutes
        '/admin/tours': 5 * 60 * 1000, // 5 minutes
        '/admin/reviews': 5 * 60 * 1000, // 5 minutes
        '/admin/verifications': 2 * 60 * 1000, // 2 minutes
        '/admin/email/recipients': 5 * 60 * 1000, // 5 minutes - NEW
        '/admin/email/templates': 30 * 60 * 1000, // 30 minutes - NEW
      },
      
      // Max cache size (number of entries)
      maxCacheSize: 100,
      
      // Enable localStorage persistence
      persistToStorage: true,
      
      // Storage key prefix
      storagePrefix: 'muslifie_cache_'
    };
    
    // Initialize cache from localStorage
    this.loadCacheFromStorage();
    
    // Cleanup expired cache entries periodically
    this.startCacheCleanup();
  }

  // Cache Management Methods
  getCacheKey(endpoint, options = {}) {
    const method = options.method || 'GET';
    const body = options.body || '';
    const queryString = endpoint.includes('?') ? endpoint.split('?')[1] : '';
    return `${method}:${endpoint}:${body}:${queryString}`;
  }

  getTTL(endpoint) {
    // Check for specific endpoint TTL
    for (const [pattern, ttl] of Object.entries(this.cacheConfig.endpointTTL)) {
      if (endpoint.includes(pattern)) {
        return ttl;
      }
    }
    return this.cacheConfig.defaultTTL;
  }

  setCache(key, data, customTTL = null) {
    const now = Date.now();
    const ttl = customTTL || this.getTTL(key);
    const expiresAt = now + ttl;
    
    const cacheEntry = {
      data,
      expiresAt,
      createdAt: now
    };
    
    // Enforce max cache size
    if (this.cache.size >= this.cacheConfig.maxCacheSize) {
      // Remove oldest entry
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
      this.removeFromStorage(oldestKey);
    }
    
    this.cache.set(key, cacheEntry);
    
    // Persist to localStorage if enabled
    if (this.cacheConfig.persistToStorage) {
      this.saveToStorage(key, cacheEntry);
    }
  }

  getCache(key) {
    const cacheEntry = this.cache.get(key);
    
    if (!cacheEntry) {
      // Try to load from localStorage
      const storedEntry = this.loadFromStorage(key);
      if (storedEntry) {
        this.cache.set(key, storedEntry);
        return storedEntry;
      }
      return null;
    }
    
    // Check if expired
    if (Date.now() > cacheEntry.expiresAt) {
      this.cache.delete(key);
      this.removeFromStorage(key);
      return null;
    }
    
    return cacheEntry;
  }

  invalidateCache(pattern = null) {
    if (pattern) {
      // Invalidate specific pattern
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
          this.removeFromStorage(key);
        }
      }
    } else {
      // Clear all cache
      this.cache.clear();
      this.clearAllStorage();
    }
  }

  // localStorage integration
  saveToStorage(key, data) {
    if (typeof window === 'undefined') return;
    
    try {
      const storageKey = this.cacheConfig.storagePrefix + key;
      localStorage.setItem(storageKey, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save cache to localStorage:', error);
    }
  }

  loadFromStorage(key) {
    if (typeof window === 'undefined') return null;
    
    try {
      const storageKey = this.cacheConfig.storagePrefix + key;
      const data = localStorage.getItem(storageKey);
      if (data) {
        const parsed = JSON.parse(data);
        // Check if expired
        if (Date.now() > parsed.expiresAt) {
          localStorage.removeItem(storageKey);
          return null;
        }
        return parsed;
      }
    } catch (error) {
      console.warn('Failed to load cache from localStorage:', error);
    }
    return null;
  }

  removeFromStorage(key) {
    if (typeof window === 'undefined') return;
    
    try {
      const storageKey = this.cacheConfig.storagePrefix + key;
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.warn('Failed to remove cache from localStorage:', error);
    }
  }

  loadCacheFromStorage() {
    if (typeof window === 'undefined') return;
    
    try {
      const keys = Object.keys(localStorage);
      for (const storageKey of keys) {
        if (storageKey.startsWith(this.cacheConfig.storagePrefix)) {
          const key = storageKey.replace(this.cacheConfig.storagePrefix, '');
          const data = this.loadFromStorage(key);
          if (data) {
            this.cache.set(key, data);
          }
        }
      }
    } catch (error) {
      console.warn('Failed to load cache from localStorage:', error);
    }
  }

  clearAllStorage() {
    if (typeof window === 'undefined') return;
    
    try {
      const keys = Object.keys(localStorage);
      for (const key of keys) {
        if (key.startsWith(this.cacheConfig.storagePrefix)) {
          localStorage.removeItem(key);
        }
      }
    } catch (error) {
      console.warn('Failed to clear cache from localStorage:', error);
    }
  }

  startCacheCleanup() {
    // Clean up expired entries every 5 minutes
    setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.cache.entries()) {
        if (now > entry.expiresAt) {
          this.cache.delete(key);
          this.removeFromStorage(key);
        }
      }
    }, 5 * 60 * 1000);
  }

  // Enhanced request method with caching
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const method = options.method || 'GET';
    
    // Configuration options
    const useCache = options.useCache !== false; // Default to true
    const forceRefresh = options.forceRefresh === true; // Default to false
    const customTTL = options.cacheTTL; // Custom cache TTL
    
    // Only cache GET requests unless specified otherwise
    const shouldCache = useCache && (method === 'GET' || options.cacheNonGet === true);
    
    const cacheKey = this.getCacheKey(endpoint, options);
    
    // Try to get from cache first (if not forcing refresh)
    if (shouldCache && !forceRefresh) {
      const cached = this.getCache(cacheKey);
      if (cached) {
        console.log('Cache hit for:', endpoint);
        return cached.data;
      }
    }
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      method,
      ...options,
    };

    // Add auth token if available
    const token = this.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    try {
      console.log('API Request:', { method, url, body: options.body, cached: false });
      
      const response = await fetch(url, config);
      
      console.log('API Response Status:', response.status);
      
      // Handle different response types
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      console.log('API Response Data:', data);

      if (!response.ok) {
        throw new Error(data.message || data || `HTTP error! status: ${response.status}`);
      }

      // Cache successful responses
      if (shouldCache && response.ok) {
        this.setCache(cacheKey, data, customTTL);
      }

      return data;
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  // Token management methods (unchanged)
  getToken() {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('adminToken');
    }
    return null;
  }

  setToken(token) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('adminToken', token);
    }
  }

  removeToken() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
    }
  }

  setUser(user) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('adminUser', JSON.stringify(user));
    }
  }

  getUser() {
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem('adminUser');
      return user ? JSON.parse(user) : null;
    }
    return null;
  }

  // Authentication endpoints
  async login(credentials) {
    const response = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
      useCache: false, // Never cache login requests
    });

    // Store token and user info
    if (response.token) {
      this.setToken(response.token);
      this.setUser(response.user);
      
      // Clear cache on login (new user session)
      this.invalidateCache();
    }

    return response;
  }

  async getUserStatus() {
    return await this.request('/auth/status', {
      cacheTTL: 1 * 60 * 1000, // 1 minute cache for user status
    });
  }

  // Get partners list
async getPartners(options = {}) {
  return await this.request('/admin/partners', {
    cacheTTL: 5 * 60 * 1000, // 5 minutes cache
    ...options,
  });
}

// Create tour for partner
async createTourForPartner(partnerId, tourData) {
  const result = await this.request(`/admin/partners/${partnerId}/tours`, {
    method: 'POST',
    body: JSON.stringify(tourData),
    useCache: false,
  });
  
  // Invalidate related cache
  this.invalidateCache('/admin/tours');
  this.invalidateCache('/admin/partners');
  
  return result;
}

  async logout() {
    this.removeToken();
    this.invalidateCache(); // Clear cache on logout
    // Optional: Call backend logout endpoint if you have one
    // await this.request('/auth/logout', { method: 'POST', useCache: false });
  }

  // Admin-specific endpoints with caching
  async getBookings(filters = {}, options = {}) {
    const queryParams = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) queryParams.append(key, filters[key]);
    });
    
    const endpoint = queryParams.toString() 
      ? `/admin/bookings?${queryParams.toString()}`
      : '/admin/bookings';
      
    return await this.request(endpoint, {
      cacheTTL: 1 * 60 * 1000, // 1 minute cache
      ...options,
    });
  }

  async getEarnings(filters = {}, options = {}) {
    const queryParams = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) queryParams.append(key, filters[key]);
    });
    
    const endpoint = queryParams.toString()
      ? `/admin/earnings?${queryParams.toString()}`
      : '/admin/earnings';
      
    return await this.request(endpoint, {
      cacheTTL: 1 * 60 * 1000, // 1 minute cache
      ...options,
    });
  }

  async getAnalytics(options = {}) {
    return await this.request('/admin/analytics/overview', {
      cacheTTL: 2 * 60 * 1000, // 2 minutes cache
      ...options,
    });
  }

  async getRevenueTrend(period = '30d', options = {}) {
    return await this.request(`/admin/analytics/revenue-trend?period=${period}`, {
      cacheTTL: 5 * 60 * 1000, // 5 minutes cache
      ...options,
    });
  }

  // Methods that modify data - invalidate related cache
  async markBookingComplete(bookingId) {
    const result = await this.request(`/admin/bookings/${bookingId}/complete`, {
      method: 'POST',
      useCache: false,
    });
    
    // Invalidate related cache
    this.invalidateCache('/admin/bookings');
    this.invalidateCache('/admin/analytics');
    this.invalidateCache('/admin/earnings');
    
    return result;
  }

  async releaseSinglePayment(earningId) {
    const result = await this.request(`/admin/earnings/${earningId}/release`, {
      method: 'POST',
      useCache: false,
    });
    
    // Invalidate related cache
    this.invalidateCache('/admin/earnings');
    this.invalidateCache('/admin/analytics');
    
    return result;
  }

  async releaseBulkPayments(earningIds) {
    const result = await this.request('/admin/earnings/release', {
      method: 'POST',
      body: JSON.stringify({ earningIds }),
      useCache: false,
    });
    
    // Invalidate related cache
    this.invalidateCache('/admin/earnings');
    this.invalidateCache('/admin/analytics');
    
    return result;
  }

  // User management with caching
  async getUsers(filters = {}, options = {}) {
    const queryParams = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) queryParams.append(key, filters[key]);
    });
    
    const endpoint = queryParams.toString()
      ? `/admin/users?${queryParams.toString()}`
      : '/admin/users';
      
    return await this.request(endpoint, {
      cacheTTL: 10 * 60 * 1000, // 10 minutes cache
      ...options,
    });
  }

  async deleteUser(userId, deleteReason = '') {
    console.log('🔍 API Service - deleteUser called');
    console.log('User ID:', userId);
    console.log('Base URL:', this.baseURL);
    console.log('Full URL:', `${this.baseURL}/admin/users/${userId}`);
    
    try {
      const response = await this.request(`/admin/users/${userId}`, {
        method: 'DELETE',
        body: JSON.stringify({ deleteReason }),
        useCache: false,
      });
      
      console.log('✅ Delete successful:', response);
      
      // Invalidate users cache after deletion
      this.invalidateCache('/admin/users');
      
      return response;
    } catch (error) {
      console.error('❌ Delete failed:', error);
      throw error;
    }
  }
  

  async updateUserVerificationStatus(userId, status) {
    const result = await this.request(`/admin/users/${userId}/verification`, {
      method: 'PUT',
      body: JSON.stringify({ verificationStatus: status }),
      useCache: false,
    });
    
    // Invalidate related cache
    this.invalidateCache('/admin/users');
    this.invalidateCache('/admin/verifications');
    
    return result;
  }

  // Tour management with caching
  async getTours(filters = {}, options = {}) {
    const queryParams = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) queryParams.append(key, filters[key]);
    });
    
    const endpoint = queryParams.toString()
      ? `/admin/tours?${queryParams.toString()}`
      : '/admin/tours';
      
    return await this.request(endpoint, {
      cacheTTL: 5 * 60 * 1000, // 5 minutes cache
      ...options,
    });
  }

  async updateTourStatus(tourId, status, reviewNotes) {
    const result = await this.request(`/admin/tours/${tourId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ 
        status,
        ...(reviewNotes && { reviewNotes })
      }),
      useCache: false,
    });
    
    // Invalidate related cache
    this.invalidateCache('/admin/tours');
    
    return result;
  }
  async deleteTour(tourId, deleteReason) {
    const result = await this.request(`/admin/tours/${tourId}`, {
      method: 'DELETE',
      body: JSON.stringify({ deleteReason }),
      useCache: false,
    });
    
    // Invalidate related cache
    this.invalidateCache('/admin/tours');
    
    return result;
  }
  // Additional cached methods
  async getReviews(filters = {}, options = {}) {
    const queryParams = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) queryParams.append(key, filters[key]);
    });
    
    const endpoint = queryParams.toString()
      ? `/admin/reviews?${queryParams.toString()}`
      : '/admin/reviews';
      
    return await this.request(endpoint, {
      cacheTTL: 5 * 60 * 1000, // 5 minutes cache
      ...options,
    });
  }

  async getNotifications(filters = {}, options = {}) {
    const queryParams = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) queryParams.append(key, filters[key]);
    });
    
    const endpoint = queryParams.toString()
      ? `/admin/notifications?${queryParams.toString()}`
      : '/admin/notifications';
      
    return await this.request(endpoint, {
      cacheTTL: 2 * 60 * 1000, // 2 minutes cache
      ...options,
    });
  }

  // Verification management with caching
  async getVerifications(filters = {}, options = {}) {
    const queryParams = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) queryParams.append(key, filters[key]);
    });
    
    const endpoint = queryParams.toString()
      ? `/admin/verifications?${queryParams.toString()}`
      : '/admin/verifications';
      
    return await this.request(endpoint, {
      cacheTTL: 2 * 60 * 1000, // 2 minutes cache
      ...options,
    });
  }

  async getVerificationDetails(verificationId, options = {}) {
    return await this.request(`/admin/verifications/${verificationId}`, {
      cacheTTL: 5 * 60 * 1000, // 5 minutes cache
      ...options,
    });
  }

  async approveVerification(verificationId, reviewNotes) {
    const result = await this.request(`/admin/verifications/${verificationId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ reviewNotes }),
      useCache: false,
    });
    
    // Invalidate related cache
    this.invalidateCache('/admin/verifications');
    this.invalidateCache('/admin/users');
    
    return result;
  }

  async rejectVerification(verificationId, rejectionReason, requiredChanges = []) {
    const result = await this.request(`/admin/verifications/${verificationId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ 
        rejectionReason,
        requiredChanges
      }),
      useCache: false,
    });
    
    // Invalidate related cache
    this.invalidateCache('/admin/verifications');
    this.invalidateCache('/admin/users');
    
    return result;
  }

  async updateDocumentVerification(verificationId, documentType, verified) {
    const result = await this.request(`/admin/verifications/${verificationId}/document`, {
      method: 'PUT',
      body: JSON.stringify({ 
        documentType,
        verified
      }),
      useCache: false,
    });
    
    // Invalidate related cache
    this.invalidateCache('/admin/verifications');
    
    return result;
  }

  // ========================================
  // EMAIL MANAGEMENT METHODS - NEW
  // ========================================
  
  // Get email recipients with filters (cached)
  async getEmailRecipients(filters = {}, options = {}) {
    const queryParams = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) queryParams.append(key, filters[key]);
    });
    
    const endpoint = queryParams.toString()
      ? `/admin/email/recipients?${queryParams.toString()}`
      : '/admin/email/recipients';
      
    return await this.request(endpoint, {
      cacheTTL: 5 * 60 * 1000, // 5 minutes cache
      ...options,
    });
  }

  // Get email templates (cached)
  async getEmailTemplates(options = {}) {
    return await this.request('/admin/templates', {
      cacheTTL: 30 * 60 * 1000, // 30 minutes cache (templates don't change often)
      ...options,
    });
  }

  // Send bulk email (never cached)
  async sendBulkEmail(emailData) {
    const result = await this.request('/admin/send', {
      method: 'POST',
      body: JSON.stringify(emailData),
      useCache: false, // Never cache email sends
    });
    
    // Don't invalidate cache for email sends
    // Email sending doesn't affect other data
    
    return result;
  }

  // Send email to specific users (convenience method)
  async sendEmailToUsers(recipientIds, subject, content, useTemplate = false, templateId = null) {
    return await this.sendBulkEmail({
      subject,
      content,
      useTemplate,
      templateId,
      sendToAll: false,
      specificRecipients: recipientIds,
      recipientFilters: {}
    });
  }

  // Send email to all users with filters (convenience method)
  async sendEmailToAllUsers(subject, content, filters = {}, useTemplate = false, templateId = null) {
    return await this.sendBulkEmail({
      subject,
      content,
      useTemplate,
      templateId,
      sendToAll: true,
      specificRecipients: [],
      recipientFilters: filters
    });
  }

  // Test email configuration (never cached)
  async testEmailConfig() {
    return await this.request('/admin/email/test', {
      method: 'POST',
      useCache: false,
    });
  }

  // Get email sending history (if you want to add this feature later)
  async getEmailHistory(filters = {}, options = {}) {
    const queryParams = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) queryParams.append(key, filters[key]);
    });
    
    const endpoint = queryParams.toString()
      ? `/admin/email/history?${queryParams.toString()}`
      : '/admin/email/history';
      
    return await this.request(endpoint, {
      cacheTTL: 5 * 60 * 1000, // 5 minutes cache
      ...options,
    });
  }

  // ========================================
  
  // Cache utility methods for components
  async refreshData(endpoint, filters = {}) {
    // Force refresh specific data
    const queryParams = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) queryParams.append(key, filters[key]);
    });
    
    const fullEndpoint = queryParams.toString()
      ? `${endpoint}?${queryParams.toString()}`
      : endpoint;
      
    return await this.request(fullEndpoint, { forceRefresh: true });
  }

  getCacheStats() {
    const stats = {
      totalEntries: this.cache.size,
      entries: [],
      memoryUsage: 0
    };
    
    for (const [key, entry] of this.cache.entries()) {
      const size = JSON.stringify(entry).length;
      stats.memoryUsage += size;
      stats.entries.push({
        key,
        createdAt: new Date(entry.createdAt).toISOString(),
        expiresAt: new Date(entry.expiresAt).toISOString(),
        isExpired: Date.now() > entry.expiresAt,
        sizeBytes: size
      });
    }
    
    return stats;
  }


// Replace your existing methods with these:
async getFirebaseEvents(period = '24h', eventFilter = 'all') {
  const response = await fetch(`${NEXT_PUBLIC_API_URL_ANALYTICS}/getFirebaseEvents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ period, eventFilter, includeErrors: true })
  });
  return await response.json();
}

async getUserBehavior(period = '24h') {
  const response = await fetch(`${NEXT_PUBLIC_API_URL_ANALYTICS}/getUserBehavior`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ period })
  });
  return await response.json();
}

async getPerformanceData(period = '24h') {
  const response = await fetch(`${NEXT_PUBLIC_API_URL_ANALYTICS}/getPerformanceData`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ period })
  });
  return await response.json();
}

async getFirebaseEventsByType(eventType, period = '24h') {
  return await this.request('/api/admin/analytics/firebase-events', {
    method: 'POST',
    body: JSON.stringify({
      period,
      eventFilter: eventType,
      includeErrors: false
    }),
    useCache: false, // Real-time for specific event tracking
  });
}

  
}

// Create and export a singleton instance
const apiService = new ApiService();
export default apiService;