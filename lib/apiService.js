// lib/api/apiService.js - Updated with Email Management Methods
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
  // CHAT MANAGEMENT METHODS - NEW
  // ========================================
  
  // Get conversations (cached)
  async getConversations(filters = {}, options = {}) {
    const queryParams = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) queryParams.append(key, filters[key]);
    });
    
    const endpoint = queryParams.toString()
      ? `/chat/conversations?${queryParams.toString()}`
      : '/chat/conversations';
      
    return await this.request(endpoint, {
      cacheTTL: 1 * 60 * 1000, // 1 minute cache
      ...options,
    });
  }

  // Get specific conversation
  async getConversation(conversationId, options = {}) {
    return await this.request(`/chat/conversations/${conversationId}`, {
      cacheTTL: 30 * 1000, // 30 seconds cache
      ...options,
    });
  }

  // Get messages for conversation
  async getMessages(conversationId, filters = {}, options = {}) {
    const queryParams = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) queryParams.append(key, filters[key]);
    });
    
    const endpoint = queryParams.toString()
      ? `/chat/conversations/${conversationId}/messages?${queryParams.toString()}`
      : `/chat/conversations/${conversationId}/messages`;
      
    return await this.request(endpoint, {
      useCache: false, // Don't cache messages, they update frequently
      ...options,
    });
  }

  // Send message (never cached)
  async sendMessage(conversationId, messageData) {
    const result = await this.request(`/chat/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify(messageData),
      useCache: false,
    });
    
    // Don't invalidate cache for chat - real-time updates via socket
    return result;
  }

  // Create conversation (admin only, never cached)
  async createConversation(userId) {
    const result = await this.request('/chat/conversations', {
      method: 'POST',
      body: JSON.stringify({ userId }),
      useCache: false,
    });
    
    // Invalidate conversations cache
    this.invalidateCache('/chat/conversations');
    return result;
  }

  // Update conversation (admin only, never cached)
  async updateConversation(conversationId, updates) {
    const result = await this.request(`/chat/conversations/${conversationId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
      useCache: false,
    });
    
    // Invalidate conversations cache
    this.invalidateCache('/chat/conversations');
    return result;
  }

  // Get chat statistics (cached)
  async getChatStats(options = {}) {
    return await this.request('/chat/stats', {
      cacheTTL: 2 * 60 * 1000, // 2 minutes cache
      ...options,
    });
  }

  // Search conversations and messages
  async searchChat(query, type = 'all', limit = 20, options = {}) {
    const queryParams = new URLSearchParams({ query, type, limit });
    
    return await this.request(`/chat/search?${queryParams.toString()}`, {
      cacheTTL: 30 * 1000, // 30 seconds cache for search
      ...options,
    });
  }
  

  // Get unread messages count
  async getUnreadCount(options = {}) {
    return await this.request('/chat/unread', {
      useCache: false, // Always get fresh unread count
      ...options,
    });
  }

  // ========================================
  // CHAT UTILITY METHODS
  // ========================================
  
  // Initialize socket connection for real-time chat
  initializeSocket(token = null) {
    if (typeof window === 'undefined') return null;
    
    const authToken = token || this.getToken();
    if (!authToken) return null;

    const { io } = require('socket.io-client');
    
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:7001', {
      auth: { token: authToken },
      transports: ['websocket']
    });

    return socket;
  }

  // Format conversation display name
  formatConversationName(conversation, currentUserId) {
    if (conversation.title) return conversation.title;
    
    // Find other participants (exclude current user)
    const otherParticipants = conversation.participants
      ?.filter(p => p.user._id !== currentUserId && p.isActive)
      ?.map(p => p.user.fullName || p.user.email)
      ?.join(', ');
    
    return otherParticipants || 'Unknown';
  }

  // Get conversation status color
  getConversationStatusColor(status) {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      case 'closed': return 'bg-red-100 text-red-800';
      case 'blocked': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  // Get priority color
  getPriorityColor(priority) {
    switch (priority) {
      case 'urgent': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'normal': return 'text-gray-600';
      case 'low': return 'text-gray-400';
      default: return 'text-gray-600';
    }
  }

  // Format message time
  formatMessageTime(date) {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Format message date
  formatMessageDate(date) {
    const today = new Date();
    const messageDate = new Date(date);
    
    if (messageDate.toDateString() === today.toDateString()) {
      return 'Today';
    }
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    
    return messageDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  }
  
  // Validate email data before sending
  validateEmailData(emailData) {
    const errors = [];

    if (!emailData.subject || emailData.subject.trim().length === 0) {
      errors.push('Subject is required');
    }

    if (!emailData.content || emailData.content.trim().length === 0) {
      if (!emailData.useTemplate || !emailData.templateId) {
        errors.push('Content is required when not using a template');
      }
    }

    if (emailData.subject && emailData.subject.length > 200) {
      errors.push('Subject must be less than 200 characters');
    }

    if (!emailData.sendToAll && (!emailData.specificRecipients || emailData.specificRecipients.length === 0)) {
      errors.push('At least one recipient must be selected when not sending to all users');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Format recipient count for display
  formatRecipientCount(count) {
    if (count === 0) return 'No recipients';
    if (count === 1) return '1 recipient';
    if (count < 1000) return `${count} recipients`;
    if (count < 1000000) return `${(count / 1000).toFixed(1)}K recipients`;
    return `${(count / 1000000).toFixed(1)}M recipients`;
  }

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

  // Add these methods to your existing apiService.js

// Firebase Analytics Methods - ADD TO YOUR EXISTING apiService.js
async getFirebaseEvents(period = '24h', eventFilter = 'all') {
  return await this.request('/api/admin/analytics/firebase-events', {
    method: 'POST',
    body: JSON.stringify({
      period,
      eventFilter,
      includeErrors: true
    }),
    cacheTTL: 1 * 60 * 1000, // 1 minute cache
  });
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