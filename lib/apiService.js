// lib/api/apiService.js
class ApiService {
  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL;
    
    this.cache = new Map();
    this.cacheConfig = {
      defaultTTL: 5 * 60 * 1000,
      
      endpointTTL: {
        '/admin/analytics/overview': 2 * 60 * 1000,
        '/admin/analytics/revenue-trend': 5 * 60 * 1000,
        '/admin/bookings': 1 * 60 * 1000,
        '/admin/earnings': 1 * 60 * 1000,
        '/admin/users': 10 * 60 * 1000,
        '/admin/tours': 5 * 60 * 1000,
        '/admin/reviews': 5 * 60 * 1000,
        '/admin/verifications': 2 * 60 * 1000,
        '/admin/email/recipients': 5 * 60 * 1000,
        '/admin/email/templates': 30 * 60 * 1000,
      },
      
      maxCacheSize: 100,
      persistToStorage: true,
      storagePrefix: 'muslifie_cache_'
    };
    
    this.loadCacheFromStorage();
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
    
    if (this.cache.size >= this.cacheConfig.maxCacheSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
      this.removeFromStorage(oldestKey);
    }
    
    this.cache.set(key, cacheEntry);
    
    if (this.cacheConfig.persistToStorage) {
      this.saveToStorage(key, cacheEntry);
    }
  }

  getCache(key) {
    const cacheEntry = this.cache.get(key);
    
    if (!cacheEntry) {
      const storedEntry = this.loadFromStorage(key);
      if (storedEntry) {
        this.cache.set(key, storedEntry);
        return storedEntry;
      }
      return null;
    }
    
    if (Date.now() > cacheEntry.expiresAt) {
      this.cache.delete(key);
      this.removeFromStorage(key);
      return null;
    }
    
    return cacheEntry;
  }

  invalidateCache(pattern = null) {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
          this.removeFromStorage(key);
        }
      }
    } else {
      this.cache.clear();
      this.clearAllStorage();
    }
  }

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

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const method = options.method || 'GET';
    
    const useCache = options.useCache !== false;
    const forceRefresh = options.forceRefresh === true;
    const customTTL = options.cacheTTL;
    
    const shouldCache = useCache && (method === 'GET' || options.cacheNonGet === true);
    
    const cacheKey = this.getCacheKey(endpoint, options);
    
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

    const token = this.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    try {
      console.log('API Request:', { method, url, body: options.body, cached: false });
      
      const response = await fetch(url, config);
      
      console.log('API Response Status:', response.status);
      
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

      if (shouldCache && response.ok) {
        this.setCache(cacheKey, data, customTTL);
      }

      return data;
    } catch (error) {
      console.error('API Request Error:', error);
      throw error;
    }
  }

  // Token management methods
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
      localStorage.removeItem('firebaseToken'); // ✅ Clear Firebase token
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

  // ✅ Firebase token management
  setFirebaseToken(firebaseToken) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('firebaseToken', firebaseToken);
      console.log('🔥 Firebase token stored');
    }
  }

  getFirebaseToken() {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('firebaseToken');
    }
    return null;
  }

  // Authentication endpoints
  async login(credentials) {
    const response = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
      useCache: false,
    });

    if (response.token) {
      this.setToken(response.token);
      this.setUser(response.user);
      
      // ✅ Store Firebase token
      if (response.firebaseToken) {
        this.setFirebaseToken(response.firebaseToken);
        console.log('✅ Firebase token received and stored');
      } else {
        console.warn('⚠️ No Firebase token in login response');
      }
      
      this.invalidateCache();
    }

    return response;
  }

  async getUserStatus() {
    return await this.request('/auth/status', {
      cacheTTL: 1 * 60 * 1000,
    });
  }

  async getPartners(options = {}) {
    return await this.request('/admin/partners', {
      cacheTTL: 5 * 60 * 1000,
      ...options,
    });
  }

  async createTourForPartner(partnerId, tourData) {
    const result = await this.request(`/admin/partners/${partnerId}/tours`, {
      method: 'POST',
      body: JSON.stringify(tourData),
      useCache: false,
    });
    
    this.invalidateCache('/admin/tours');
    this.invalidateCache('/admin/partners');
    
    return result;
  }

  async logout() {
    this.removeToken();
    this.invalidateCache();
  }

  async getBookings(filters = {}, options = {}) {
    const queryParams = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) queryParams.append(key, filters[key]);
    });
    
    const endpoint = queryParams.toString() 
      ? `/admin/bookings?${queryParams.toString()}`
      : '/admin/bookings';
      
    return await this.request(endpoint, {
      cacheTTL: 1 * 60 * 1000,
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
      cacheTTL: 1 * 60 * 1000,
      ...options,
    });
  }

  async getAnalytics(options = {}) {
    return await this.request('/admin/analytics/overview', {
      cacheTTL: 2 * 60 * 1000,
      ...options,
    });
  }

  async getRevenueTrend(period = '30d', options = {}) {
    return await this.request(`/admin/analytics/revenue-trend?period=${period}`, {
      cacheTTL: 5 * 60 * 1000,
      ...options,
    });
  }

  async markBookingComplete(bookingId) {
    const result = await this.request(`/admin/bookings/${bookingId}/complete`, {
      method: 'POST',
      useCache: false,
    });
    
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
    
    this.invalidateCache('/admin/earnings');
    this.invalidateCache('/admin/analytics');
    
    return result;
  }

  async getUsers(filters = {}, options = {}) {
    const queryParams = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) queryParams.append(key, filters[key]);
    });
    
    const endpoint = queryParams.toString()
      ? `/admin/users?${queryParams.toString()}`
      : '/admin/users';
      
    return await this.request(endpoint, {
      cacheTTL: 10 * 60 * 1000,
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
    
    this.invalidateCache('/admin/users');
    this.invalidateCache('/admin/verifications');
    
    return result;
  }

  async getTours(filters = {}, options = {}) {
    const queryParams = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) queryParams.append(key, filters[key]);
    });
    
    const endpoint = queryParams.toString()
      ? `/admin/tours?${queryParams.toString()}`
      : '/admin/tours';
      
    return await this.request(endpoint, {
      cacheTTL: 5 * 60 * 1000,
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
    
    this.invalidateCache('/admin/tours');
    
    return result;
  }

  async deleteTour(tourId, deleteReason) {
    const result = await this.request(`/admin/tours/${tourId}`, {
      method: 'DELETE',
      body: JSON.stringify({ deleteReason }),
      useCache: false,
    });
    
    this.invalidateCache('/admin/tours');
    this.invalidateCache('/admin/analytics');
    
    return result;
  }

  async getReviews(filters = {}, options = {}) {
    const queryParams = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) queryParams.append(key, filters[key]);
    });
    
    const endpoint = queryParams.toString()
      ? `/admin/reviews?${queryParams.toString()}`
      : '/admin/reviews';
      
    return await this.request(endpoint, {
      cacheTTL: 5 * 60 * 1000,
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
      cacheTTL: 2 * 60 * 1000,
      ...options,
    });
  }

  async getVerifications(filters = {}, options = {}) {
    const queryParams = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) queryParams.append(key, filters[key]);
    });
    
    const endpoint = queryParams.toString()
      ? `/admin/verifications?${queryParams.toString()}`
      : '/admin/verifications';
      
    return await this.request(endpoint, {
      cacheTTL: 2 * 60 * 1000,
      ...options,
    });
  }

  async getVerificationDetails(verificationId, options = {}) {
    return await this.request(`/admin/verifications/${verificationId}`, {
      cacheTTL: 5 * 60 * 1000,
      ...options,
    });
  }

  async approveVerification(verificationId, reviewNotes) {
    const result = await this.request(`/admin/verifications/${verificationId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ reviewNotes }),
      useCache: false,
    });
    
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
    
    this.invalidateCache('/admin/verifications');
    
    return result;
  }

  // Email Management
  async getEmailRecipients(filters = {}, options = {}) {
    const queryParams = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) queryParams.append(key, filters[key]);
    });
    
    const endpoint = queryParams.toString()
      ? `/admin/email/recipients?${queryParams.toString()}`
      : '/admin/email/recipients';
      
    return await this.request(endpoint, {
      cacheTTL: 5 * 60 * 1000,
      ...options,
    });
  }

  async getEmailTemplates(options = {}) {
    return await this.request('/admin/templates', {
      cacheTTL: 30 * 60 * 1000,
      ...options,
    });
  }

  async sendBulkEmail(emailData) {
    const result = await this.request('/admin/send', {
      method: 'POST',
      body: JSON.stringify(emailData),
      useCache: false,
    });
    
    return result;
  }

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

  async testEmailConfig() {
    return await this.request('/admin/email/test', {
      method: 'POST',
      useCache: false,
    });
  }

  async getEmailHistory(filters = {}, options = {}) {
    const queryParams = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) queryParams.append(key, filters[key]);
    });
    
    const endpoint = queryParams.toString()
      ? `/admin/email/history?${queryParams.toString()}`
      : '/admin/email/history';
      
    return await this.request(endpoint, {
      cacheTTL: 5 * 60 * 1000,
      ...options,
    });
  }

  async refreshData(endpoint, filters = {}) {
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

  async getFirebaseEvents(period = '24h', eventFilter = 'all') {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL_ANALYTICS}/getFirebaseEvents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ period, eventFilter, includeErrors: true })
    });
    return await response.json();
  }

  async getUserBehavior(period = '24h') {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL_ANALYTICS}/getUserBehavior`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ period })
    });
    return await response.json();
  }

  async getPerformanceData(period = '24h') {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL_ANALYTICS}/getPerformanceData`, {
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
      useCache: false,
    });
  }
}

const apiService = new ApiService();
export default apiService;