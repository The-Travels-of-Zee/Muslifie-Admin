// // app/dashboard/chat/page.js
// 'use client';
// import React from 'react';
// import DashboardLayout from '../../dashboard/layout';
// import {
//   ChatBubbleOvalLeftEllipsisIcon,
//   WrenchScrewdriverIcon,
//   ClockIcon
// } from '@heroicons/react/24/outline';

// function ChatPageContent() {
//   return (
//     <div className="space-y-6">
//       {/* Stats Cards */}
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//         <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
//           <div className="flex items-center">
//             <div className="bg-orange-100 p-3 rounded-xl">
//               <ClockIcon className="w-6 h-6 text-orange-600" />
//             </div>
//             <div className="ml-4">
//               <p className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Jost, sans-serif' }}>
//                 In Progress
//               </p>
//               <p className="text-sm text-gray-600">Development Status</p>
//             </div>
//           </div>
//         </div>

//         <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
//           <div className="flex items-center">
//             <div className="bg-blue-100 p-3 rounded-xl">
//               <ChatBubbleOvalLeftEllipsisIcon className="w-6 h-6 text-blue-600" />
//             </div>
//             <div className="ml-4">
//               <p className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Jost, sans-serif' }}>
//                 0
//               </p>
//               <p className="text-sm text-gray-600">Active Conversations</p>
//             </div>
//           </div>
//         </div>

//         <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
//           <div className="flex items-center">
//             <div className="bg-purple-100 p-3 rounded-xl">
//               <WrenchScrewdriverIcon className="w-6 h-6 text-purple-600" />
//             </div>
//             <div className="ml-4">
//               <p className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Jost, sans-serif' }}>
//                 Soon
//               </p>
//               <p className="text-sm text-gray-600">Launch Date</p>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Development Notice */}
//       <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
//         <div className="max-w-md mx-auto text-center">
//           <div className="flex justify-center mb-4">
//             <div className="relative">
//               <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4 rounded-2xl shadow-lg">
//                 <ChatBubbleOvalLeftEllipsisIcon className="w-8 h-8 text-white" />
//               </div>
//               <div className="absolute -bottom-1 -right-1 bg-orange-500 p-1 rounded-full shadow-lg">
//                 <WrenchScrewdriverIcon className="w-3 h-3 text-white" />
//               </div>
//             </div>
//           </div>

//           <div className="flex items-center justify-center mb-3">
//             <ClockIcon className="w-5 h-5 text-orange-500 mr-2" />
//             <span className="text-orange-600 font-semibold text-sm" style={{ fontFamily: 'Poppins, sans-serif' }}>
//               Under Development
//             </span>
//           </div>
          
//           <h3 className="text-lg font-semibold text-gray-900 mb-2" style={{ fontFamily: 'Poppins, sans-serif' }}>
//             We're working on it!
//           </h3>
          
//           <p className="text-gray-600 text-sm leading-relaxed" style={{ fontFamily: 'Poppins, sans-serif' }}>
//             Our live chat feature is currently under development. We're building an amazing real-time messaging experience.
//           </p>

//           <div className="mt-4 inline-flex items-center px-3 py-1 bg-orange-50 border border-orange-200 rounded-full">
//             <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse mr-2"></div>
//             <span className="text-orange-700 text-xs font-medium">Development in Progress</span>
//           </div>
//         </div>
//       </div>

//       {/* Features Preview */}
//       <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
//         <h3 className="text-lg font-semibold text-gray-900 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
//           Coming Soon Features
//         </h3>
        
//         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//           <div className="flex items-center p-4 bg-gray-50 rounded-xl">
//             <div className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></div>
//             <span className="text-sm text-gray-700">Real-time messaging with users</span>
//           </div>
//           <div className="flex items-center p-4 bg-gray-50 rounded-xl">
//             <div className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></div>
//             <span className="text-sm text-gray-700">Conversation management & history</span>
//           </div>
//           <div className="flex items-center p-4 bg-gray-50 rounded-xl">
//             <div className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></div>
//             <span className="text-sm text-gray-700">User status & typing indicators</span>
//           </div>
//           <div className="flex items-center p-4 bg-gray-50 rounded-xl">
//             <div className="w-2 h-2 bg-indigo-500 rounded-full mr-3"></div>
//             <span className="text-sm text-gray-700">Support ticket integration</span>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default function ChatPage() {
//   return (
//     <DashboardLayout>
//       <ChatPageContent />
//     </DashboardLayout>
//   );
// }
'use client';
import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../../dashboard/layout';
import {
  ChatBubbleOvalLeftEllipsisIcon,
  MagnifyingGlassIcon,
  PaperAirplaneIcon,
  EllipsisVerticalIcon,
  UserCircleIcon,
  CheckIcon,
  ClockIcon,
  PhoneIcon,
  VideoCameraIcon,
  PaperClipIcon,
  FaceSmileIcon,
  XMarkIcon,
  ArrowLeftIcon,
  UsersIcon,
  TagIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

function ChatPageContent() {
  // State management
  const [socket, setSocket] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);

  // UI state
  const [showUserList, setShowUserList] = useState(false);
  const [showConversationDetails, setShowConversationDetails] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Filters and sorting
  const [statusFilter, setStatusFilter] = useState('active');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [unreadOnly, setUnreadOnly] = useState(false);

  // Refs
  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Initialize socket connection
  // Initialize socket connection
useEffect(() => {
  const initializeSocket = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        console.error('❌ No admin token found');
        setLoading(false);
        return;
      }

      console.log('🔌 Attempting socket connection...');

      // Dynamic import for socket.io-client
      const { io } = await import('socket.io-client');
      
      const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:7001';
      console.log('Socket URL:', socketUrl);

      const newSocket = io(socketUrl, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      newSocket.on('connect', () => {
        console.log('✅ Connected to chat server:', newSocket.id);
        setSocket(newSocket);
        setLoading(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error.message);
        setLoading(false);
      });

      newSocket.on('conversations_list', (conversationsList) => {
        console.log('📋 Received conversations:', conversationsList.length);
        setConversations(conversationsList);
      });

      newSocket.on('new_message', (data) => {
        console.log('💬 New message:', data);
        const { message, conversation } = data;
        
        // Update messages if it's for current conversation
        if (selectedConversation?.conversationId === message.conversationId) {
          setMessages(prev => [...prev, message]);
        }
        
        // Update conversation list
        setConversations(prev => 
          prev.map(conv => 
            conv.conversationId === conversation.conversationId 
              ? { ...conv, lastMessage: message, lastMessageAt: conversation.lastMessageAt }
              : conv
          )
        );
      });

      newSocket.on('conversation_joined', (data) => {
        console.log('✅ Joined conversation:', data.conversation.conversationId);
        setMessages(data.messages);
        setSelectedConversation(data.conversation);
      });

      newSocket.on('user_typing', (data) => {
        if (data.conversationId === selectedConversation?.conversationId) {
          setTypingUsers(prev => {
            const newSet = new Set(prev);
            if (data.isTyping) {
              newSet.add(data.user.fullName);
            } else {
              newSet.delete(data.user.fullName);
            }
            return newSet;
          });
        }
      });

      newSocket.on('online_users_updated', (users) => {
        console.log('👥 Online users updated:', users.length);
        setOnlineUsers(users);
      });

      newSocket.on('user_message_notification', (data) => {
        console.log('🔔 User message notification:', data);
        // Show notification for new user messages
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(`New message from ${data.user.fullName}`, {
            body: data.message.content,
            icon: '/favicon.ico'
          });
        }
      });

      newSocket.on('error', (error) => {
        console.error('❌ Socket error:', error);
      });

      newSocket.on('disconnect', (reason) => {
        console.log('🔌 Disconnected:', reason);
      });

      // Store socket for cleanup
      setSocket(newSocket);

      return () => {
        console.log('🧹 Cleaning up socket connection');
        newSocket.disconnect();
      };
    } catch (error) {
      console.error('❌ Failed to initialize socket:', error);
      setLoading(false);
    }
  };

  initializeSocket();

  // Cleanup on unmount
  return () => {
    if (socket) {
      socket.disconnect();
    }
  };
}, []); // Remove selectedConversation dependency - it causes reconnects



  // Check mobile screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const selectConversation = (conversation) => {
    if (selectedConversation?.conversationId === conversation.conversationId) return;
    
    setSelectedConversation(conversation);
    setMessages([]);
    
    if (socket) {
      socket.emit('join_conversation', { 
        conversationId: conversation.conversationId 
      });
    }
    
    if (isMobile) {
      setShowUserList(false);
    }
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !selectedConversation || !socket) return;

    setSendingMessage(true);
    
    socket.emit('send_message', {
      conversationId: selectedConversation.conversationId,
      content: newMessage.trim(),
      messageType: 'text'
    });

    setNewMessage('');
    setSendingMessage(false);
    
    // Stop typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    socket.emit('typing', { 
      conversationId: selectedConversation.conversationId, 
      isTyping: false 
    });
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    
    if (!socket || !selectedConversation) return;

    // Send typing indicator
    if (!isTyping) {
      setIsTyping(true);
      socket.emit('typing', { 
        conversationId: selectedConversation.conversationId, 
        isTyping: true 
      });
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit('typing', { 
        conversationId: selectedConversation.conversationId, 
        isTyping: false 
      });
    }, 1000);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (date) => {
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
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      case 'closed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'normal': return 'text-gray-600';
      case 'low': return 'text-gray-400';
      default: return 'text-gray-600';
    }
  };

  const filteredConversations = conversations.filter(conv => {
    if (statusFilter !== 'all' && conv.status !== statusFilter) return false;
    if (categoryFilter !== 'all' && conv.category !== categoryFilter) return false;
    if (unreadOnly && (!conv.unreadCounts || conv.unreadCounts.length === 0)) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const user = conv.participantUsers?.find(u => u.userType !== 'admin');
      return user?.fullName?.toLowerCase().includes(query) || 
             user?.email?.toLowerCase().includes(query) ||
             conv.title?.toLowerCase().includes(query);
    }
    return true;
  });

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Connecting to chat server...</p>
        </div>
      </div>
    );
  }

  if (!socket) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <ChatBubbleOvalLeftEllipsisIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Chat Unavailable</h3>
          <p className="text-gray-500 mb-4">Unable to connect to chat server</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Conversations List */}
      <div className={`bg-white border-r border-gray-200 flex flex-col ${
        isMobile ? (showUserList ? 'w-full' : 'hidden') : 'w-80'
      }`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Jost, sans-serif' }}>
              Live Chat
            </h1>
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {onlineUsers.length} online
              </span>
            </div>
          </div>
          
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2 mt-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs border border-gray-300 rounded px-2 py-1"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
              <option value="closed">Closed</option>
            </select>
            
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs border border-gray-300 rounded px-2 py-1"
            >
              <option value="all">All Categories</option>
              <option value="support">Support</option>
              <option value="booking">Booking</option>
              <option value="payment">Payment</option>
              <option value="verification">Verification</option>
              <option value="general">General</option>
            </select>
            
            <button
              onClick={() => setUnreadOnly(!unreadOnly)}
              className={`text-xs px-2 py-1 rounded ${
                unreadOnly ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700'
              }`}
            >
              Unread
            </button>
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <ChatBubbleOvalLeftEllipsisIcon className="w-12 h-12 mx-auto text-gray-300 mb-2" />
              <p>No conversations found</p>
            </div>
          ) : (
            filteredConversations.map((conversation) => {
              const user = conversation.participantUsers?.find(u => u.userType !== 'admin');
              const isSelected = selectedConversation?.conversationId === conversation.conversationId;
              const hasUnread = conversation.unreadCounts?.some(uc => uc.count > 0);
              
              return (
                <div
                  key={conversation.conversationId}
                  onClick={() => selectConversation(conversation)}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                    isSelected ? 'bg-indigo-50 border-indigo-200' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {/* Avatar */}
                    <div className="relative">
                      {user?.profileImage ? (
                        <img
                          src={user.profileImage}
                          alt={user.fullName}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-medium text-sm">
                            {user?.fullName?.charAt(0) || 'U'}
                          </span>
                        </div>
                      )}
                      {/* Online indicator */}
                      {onlineUsers.some(ou => ou.id === user?._id) && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {user?.fullName || 'Unknown User'}
                        </h3>
                        <div className="flex items-center space-x-1">
                          {conversation.priority !== 'normal' && (
                            <ExclamationTriangleIcon className={`w-4 h-4 ${getPriorityColor(conversation.priority)}`} />
                          )}
                          <span className="text-xs text-gray-500">
                            {formatTime(conversation.lastMessageAt)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-sm text-gray-600 truncate">
                          {conversation.lastMessageData?.[0]?.content || 'No messages yet'}
                        </p>
                        {hasUnread && (
                          <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                            {conversation.unreadCounts?.[0]?.count}
                          </span>
                        )}
                      </div>
                      
                      {/* Status and Category */}
                      <div className="flex items-center space-x-2 mt-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(conversation.status)}`}>
                          {conversation.status}
                        </span>
                        <span className="text-xs text-gray-500 capitalize">
                          {conversation.category}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`flex-1 flex flex-col ${
        isMobile && showUserList ? 'hidden' : 'flex'
      }`}>
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {isMobile && (
                    <button
                      onClick={() => setShowUserList(true)}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                      <ArrowLeftIcon className="w-5 h-5" />
                    </button>
                  )}
                  
                  {/* User info */}
                  <div className="flex items-center space-x-3">
                    {(() => {
                      const user = selectedConversation.participantUsers?.find(u => u.userType !== 'admin');
                      return (
                        <>
                          {user?.profileImage ? (
                            <img
                              src={user.profileImage}
                              alt={user.fullName}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                              <span className="text-white font-medium">
                                {user?.fullName?.charAt(0) || 'U'}
                              </span>
                            </div>
                          )}
                          <div>
                            <h2 className="text-lg font-semibold text-gray-900">
                              {user?.fullName || 'Unknown User'}
                            </h2>
                            <p className="text-sm text-gray-500">
                              {onlineUsers.some(ou => ou.id === user?._id) ? 'Online' : 'Offline'}
                            </p>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowConversationDetails(!showConversationDetails)}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    <EllipsisVerticalIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((message, index) => {
                const isOwnMessage = message.senderType === 'admin';
                const showDate = index === 0 || 
                  formatDate(message.createdAt) !== formatDate(messages[index - 1]?.createdAt);

                return (
                  <div key={message._id}>
                    {showDate && (
                      <div className="flex justify-center my-4">
                        <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
                          {formatDate(message.createdAt)}
                        </span>
                      </div>
                    )}
                    
                    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        isOwnMessage
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white border border-gray-200 text-gray-900'
                      }`}>
                        <p className="text-sm">{message.content}</p>
                        <div className={`flex items-center space-x-1 mt-1 ${
                          isOwnMessage ? 'justify-end' : 'justify-start'
                        }`}>
                          <span className={`text-xs ${
                            isOwnMessage ? 'text-indigo-100' : 'text-gray-500'
                          }`}>
                            {formatTime(message.createdAt)}
                          </span>
                          {isOwnMessage && (
                            <CheckIcon className="w-3 h-3 text-indigo-100" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Typing indicator */}
              {typingUsers.size > 0 && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-lg px-4 py-2">
                    <div className="flex items-center space-x-1">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span className="text-xs text-gray-500 ml-2">
                        {Array.from(typingUsers).join(', ')} typing...
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="bg-white border-t border-gray-200 p-4">
              <div className="flex items-end space-x-2">
                <div className="flex-1">
                  <textarea
                    ref={messageInputRef}
                    value={newMessage}
                    onChange={handleTyping}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    rows={1}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                    style={{ minHeight: '40px', maxHeight: '120px' }}
                  />
                </div>
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || sendingMessage}
                  className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <PaperAirplaneIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          /* No conversation selected */
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
            <ChatBubbleOvalLeftEllipsisIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Select a conversation
              </h3>
              <p className="text-gray-500">
                Choose a conversation from the sidebar to start chatting
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <DashboardLayout>
      <ChatPageContent />
    </DashboardLayout>
  );
}