// app/dashboard/chat/page.js
'use client';
import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../layout';
import {
  ChatBubbleOvalLeftEllipsisIcon,
  MagnifyingGlassIcon,
  PaperAirplaneIcon,
  XMarkIcon,
  ArrowLeftIcon,
  UserPlusIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';

function ChatPageContent() {
  const [socket, setSocket] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [searchedUsers, setSearchedUsers] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [isMobile, setIsMobile] = useState(false);
  const [showUserList, setShowUserList] = useState(true);
  
  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  
  const selectedConversationRef = useRef(null);

  useEffect(() => {
    selectedConversationRef.current = selectedConversation;
  }, [selectedConversation]);

  useEffect(() => {
    const initializeSocket = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        if (!token) {
          console.error('❌ No admin token found');
          setLoading(false);
          return;
        }

        const { io } = await import('socket.io-client');
        const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:7001';

        const newSocket = io(socketUrl, {
          auth: { token },
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
        });

        newSocket.on('connect', () => {
          console.log('✅ Connected to chat server:', newSocket.id);
          setLoading(false);
        });

        newSocket.on('connect_error', (error) => {
          console.error('❌ Socket connection error:', error.message);
          setLoading(false);
        });

        newSocket.on('conversations_list', (conversationsList) => {
          console.log('📋 Received conversations:', conversationsList.length);
          console.log('📋 Conversations data:', conversationsList);
          setConversations(conversationsList);
        });

        newSocket.on('new_message', (data) => {
          const { message, conversation } = data;
          
          console.log('📨 New message received:', {
            messageId: message._id,
            conversationId: message.conversationId,
            currentConversation: selectedConversationRef.current?.conversationId,
            content: message.content.substring(0, 50)
          });
          
          // ✅ FIX: Update temp conversation with real conversationId
          if (selectedConversationRef.current?.conversationId.startsWith('user_') && 
              message.conversationId !== selectedConversationRef.current?.conversationId) {
            console.log('🔄 Updating temp conversation with real ID:', message.conversationId);
            setSelectedConversation(prev => ({
              ...prev,
              conversationId: message.conversationId
            }));
          }
          
          if (selectedConversationRef.current?.conversationId === message.conversationId ||
              selectedConversationRef.current?.conversationId.startsWith('user_')) {
            console.log('✅ Message belongs to current conversation, adding to UI');
            setMessages(prev => {
              if (prev.some(m => m._id === message._id)) {
                console.log('⚠️ Duplicate message, skipping');
                return prev;
              }
              return [...prev, message];
            });
          } else {
            console.log('📍 Message for different conversation:', message.conversationId);
          }
          
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
          console.log('📊 Loaded messages:', data.messages.length);
          setMessages(data.messages);
        });

        newSocket.on('user_typing', (data) => {
          if (data.conversationId === selectedConversationRef.current?.conversationId) {
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

        newSocket.on('message_sent', (data) => {
          console.log('✅ Message sent confirmation received');
          const { message, conversationId } = data;
          
          // ✅ FIX: Update temp conversation ID with real one
          if (selectedConversationRef.current?.conversationId.startsWith('user_') && 
              conversationId && conversationId !== selectedConversationRef.current?.conversationId) {
            console.log('🔄 Updating conversation ID from temp to real:', conversationId);
            
            setSelectedConversation(prev => ({
              ...prev,
              conversationId: conversationId
            }));
            
            // Leave old room and join new room
            newSocket.emit('leave_conversation', { 
              conversationId: selectedConversationRef.current?.conversationId 
            });
            newSocket.emit('join_conversation', { 
              conversationId: conversationId 
            });
            
            console.log('🚪 Switched to real conversation room:', conversationId);
          }
          
          // Add the message if it's not already there
          if (message && selectedConversationRef.current) {
            setMessages(prev => {
              if (prev.some(m => m._id === message._id)) {
                return prev;
              }
              return [...prev, message];
            });
          }
        });

        setSocket(newSocket);

        return () => {
          console.log('🔌 Cleaning up socket connection');
          newSocket.disconnect();
        };
      } catch (error) {
        console.error('❌ Failed to initialize socket:', error);
        setLoading(false);
      }
    };

    initializeSocket();
  }, []);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const searchUsers = async (query) => {
    if (!query.trim()) {
      setSearchedUsers([]);
      return;
    }
  
    setSearchingUsers(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/users?search=${encodeURIComponent(query)}&limit=10`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
  
      const data = await response.json();
      
      if (data.success) {
        const nonAdminUsers = data.data.users
          .filter(user => user.userType !== 'admin')
          .map(user => ({
            ...user,
            id: user.id || user._id
          }));
        
        console.log('✅ Found users:', nonAdminUsers.length);
        setSearchedUsers(nonAdminUsers);
      }
    } catch (error) {
      console.error('❌ Error searching users:', error);
    } finally {
      setSearchingUsers(false);
    }
  };

  const handleUserSearch = (query) => {
    setUserSearchQuery(query);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchUsers(query);
    }, 300);
  };

  const startConversationWithUser = async (user) => {
    try {
      const userId = user.id || user._id;
      
      if (!userId) {
        console.error('❌ No user ID found:', user);
        alert('Invalid user selected');
        return;
      }
  
      console.log('🆕 Starting conversation with user:', {
        id: userId,
        name: user.fullName,
        email: user.email
      });
      
      if (!socket) {
        console.error('❌ No socket connection');
        return;
      }
  
      const existingConversation = conversations.find(conv => {
        return conv.participants?.some(p => {
          const pUserId = p.user?._id || p.user?.id || p.user;
          return pUserId && (
            pUserId === userId || 
            pUserId.toString() === userId.toString()
          );
        });
      });
  
      if (existingConversation) {
        console.log('✅ Found existing conversation:', existingConversation.conversationId);
        selectConversation(existingConversation);
        setShowUserSearch(false);
        return;
      }
  
      const tempConversation = {
        conversationId: `user_${userId}`,
        participants: [{
          user: {
            _id: userId,
            id: userId,
            fullName: user.fullName,
            email: user.email,
            profileImage: user.profileImage,
            userType: user.userType
          }
        }],
        participantUsers: [{
          _id: userId,
          id: userId,
          fullName: user.fullName,
          email: user.email,
          profileImage: user.profileImage,
          userType: user.userType
        }],
        status: 'active',
        category: 'general',
        priority: 'normal',
        unreadCounts: [],
        lastMessageAt: new Date()
      };
  
      console.log('📝 Created temp conversation:', tempConversation.conversationId);
  
      setSelectedConversation(tempConversation);
      setMessages([]);
      setShowUserSearch(false);
  
      setTimeout(() => {
        messageInputRef.current?.focus();
      }, 100);
  
    } catch (error) {
      console.error('❌ Error starting conversation:', error);
      alert('Failed to start conversation. Please try again.');
    }
  };

  const selectConversation = (conversation) => {
    if (selectedConversation?.conversationId === conversation.conversationId) {
      console.log('⚠️ Already viewing this conversation');
      return;
    }
    
    console.log('📂 Selecting conversation:', conversation.conversationId);
    
    if (selectedConversation && socket) {
      console.log('👋 Leaving previous conversation:', selectedConversation.conversationId);
      socket.emit('leave_conversation', { 
        conversationId: selectedConversation.conversationId 
      });
    }
    
    setSelectedConversation(conversation);
    setMessages([]);
    setTypingUsers(new Set());
    
    if (socket) {
      console.log('🚪 Joining conversation:', conversation.conversationId);
      socket.emit('join_conversation', { 
        conversationId: conversation.conversationId 
      });
    }
    
    if (isMobile) {
      setShowUserList(false);
    }
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !selectedConversation || !socket) {
      console.log('⚠️ Cannot send message:', {
        hasContent: !!newMessage.trim(),
        hasConversation: !!selectedConversation,
        hasSocket: !!socket
      });
      return;
    }

    const content = newMessage.trim();
    console.log('📤 Sending message:', {
      conversationId: selectedConversation.conversationId,
      contentLength: content.length
    });

    setSendingMessage(true);
    
    socket.emit('send_message', {
      conversationId: selectedConversation.conversationId,
      content: content,
      messageType: 'text'
    });

    setNewMessage('');
    setSendingMessage(false);
    
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

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    socket.emit('typing', { 
      conversationId: selectedConversation.conversationId, 
      isTyping: true 
    });

    typingTimeoutRef.current = setTimeout(() => {
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

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Connecting to chat server...</p>
        </div>
      </div>
    );
  }

  if (!socket) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
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
      {/* User Search Modal */}
      {showUserSearch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Start New Conversation</h2>
              <button
                onClick={() => setShowUserSearch(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <XMarkIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-4 border-b border-gray-200">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  value={userSearchQuery}
                  onChange={(e) => handleUserSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {searchingUsers ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                  <p className="text-gray-500 mt-2">Searching users...</p>
                </div>
              ) : userSearchQuery.trim() === '' ? (
                <div className="text-center py-8 text-gray-500">
                  <MagnifyingGlassIcon className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p>Search for users to start a conversation</p>
                </div>
              ) : searchedUsers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No users found</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {searchedUsers.map((user) => {
                    const userId = user.id || user._id;
                    const isOnline = onlineUsers.some(ou => 
                      ou.id === userId || ou.id?.toString() === userId?.toString()
                    );
                    return (
                      <div
                        key={userId}
                        onClick={() => startConversationWithUser(user)}
                        className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                      >
                        <div className="relative">
                          {user.profileImage ? (
                            <img
                              src={user.profileImage}
                              alt={user.fullName}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                              <span className="text-white font-medium text-lg">
                                {user.fullName?.charAt(0) || 'U'}
                              </span>
                            </div>
                          )}
                          {isOnline && (
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {user.fullName || 'Unknown User'}
                          </h3>
                          <p className="text-sm text-gray-500 truncate">{user.email}</p>
                        </div>
                        <div>
                          {isOnline && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Online
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Conversations List */}
      <div className={`bg-white border-r border-gray-200 flex flex-col ${
        isMobile ? (showUserList ? 'w-full' : 'hidden') : 'w-80'
      }`}>
        <div className="p-4 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-gray-900">Live Chat</h1>
            <button
              onClick={() => setShowUserSearch(true)}
              className="flex items-center space-x-2 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              title="Start new conversation"
            >
              <UserPlusIcon className="w-5 h-5" />
              <span className="text-sm font-medium">New</span>
            </button>
          </div>
          
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
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <ChatBubbleOvalLeftEllipsisIcon className="w-12 h-12 mx-auto text-gray-300 mb-2" />
              <p className="mb-2">No conversations yet</p>
              <button
                onClick={() => setShowUserSearch(true)}
                className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
              >
                Start a conversation →
              </button>
            </div>
          ) : (
            conversations
              .filter(conv => {
                if (!searchQuery) return true;
                const user = conv.participantUsers?.find(u => u.userType !== 'admin');
                return user?.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       user?.email?.toLowerCase().includes(searchQuery.toLowerCase());
              })
              .map((conversation) => {
                const user = conversation.participantUsers?.find(u => u.userType !== 'admin');
                const isSelected = selectedConversation?.conversationId === conversation.conversationId;
                const isOnline = onlineUsers.some(ou => ou.id === user?._id || ou.id === user?.id);
                
                return (
                  <div
                    key={conversation.conversationId}
                    onClick={() => selectConversation(conversation)}
                    className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                      isSelected ? 'bg-indigo-50 border-indigo-200' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-3">
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
                        {isOnline && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {user?.fullName || 'Unknown User'}
                          </h3>
                          <span className="text-xs text-gray-500">
                            {formatTime(conversation.lastMessageAt)}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-600 truncate mt-1">
                          {conversation.lastMessageData?.[0]?.content || 'No messages yet'}
                        </p>
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
                  
                  {(() => {
                    const user = selectedConversation.participantUsers?.find(u => u.userType !== 'admin') ||
                                selectedConversation.participants?.find(p => p.user)?.user;
                    const isOnline = onlineUsers.some(ou => ou.id === user?._id || ou.id === user?.id);
                    
                    return (
                      <div className="flex items-center space-x-3">
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
                            {isOnline ? 'Online' : 'Offline'}
                          </p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-500">
                    <ChatBubbleOvalLeftEllipsisIcon className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                </div>
              ) : (
                messages.map((message, index) => {
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
                })
              )}

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
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <ChatBubbleOvalLeftEllipsisIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Select a conversation or start a new one
              </h3>
              <button
                onClick={() => setShowUserSearch(true)}
                className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Start New Conversation
              </button>
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