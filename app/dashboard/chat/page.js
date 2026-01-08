// app/dashboard/chat/page.js - UPDATED TO USE TOUR PATTERN
'use client';
import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../layout';
import firestoreService from '../../../services/firestore.service';
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
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [searchedUsers, setSearchedUsers] = useState([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  
  const [isMobile, setIsMobile] = useState(false);
  const [showUserList, setShowUserList] = useState(true);
  const [adminId, setAdminId] = useState(null);
  const [adminToken, setAdminToken] = useState(null);
  
  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Initialize Firebase Firestore and get admin info
  useEffect(() => {
    const initFirebase = async () => {
      console.log('🔥 Initializing Firestore...');
      firestoreService.initialize();

      const token = localStorage.getItem('adminToken');
      const firebaseToken = localStorage.getItem('firebaseToken');
      
      if (!token) {
        console.error('❌ No admin token found');
        setLoading(false);
        return;
      }

      setAdminToken(token);
      
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const userId = payload.userId || payload._id || payload.id;
        console.log('👤 Admin ID:', userId);
        setAdminId(userId);

        if (firebaseToken) {
          console.log('🔑 Firebase token found, signing in...');
          await firestoreService.signInWithToken(firebaseToken);
          console.log('✅ Signed into Firebase Auth successfully!');
        } else {
          console.error('❌ No Firebase token found - Admin needs to re-login');
        }
      } catch (error) {
        console.error('❌ Error initializing Firebase:', error);
      }

      // Listen to conversations in Firestore
      firestoreService.listenToConversations(
        (firestoreConversations) => {
          console.log('📋 Firestore conversations updated:', firestoreConversations.length);
          setConversations(firestoreConversations);
          setLoading(false);
        },
        (error) => {
          console.error('❌ Firestore error:', error);
          setLoading(false);
        }
      );
    };

    initFirebase();

    return () => {
      console.log('🧹 Cleaning up Firestore listeners');
      firestoreService.unsubscribeAll();
    };
  }, []);

  // Listen to messages in Firestore when conversation is selected
  useEffect(() => {
    if (!selectedConversation?.conversationId) {
      setMessages([]);
      return;
    }

    console.log('👂 Listening to messages for:', selectedConversation.conversationId);

    firestoreService.unsubscribe(`messages_${selectedConversation.conversationId}`);

    const messagesUnsubscribe = firestoreService.listenToMessages(
      selectedConversation.conversationId,
      (firestoreMessages) => {
        console.log('💬 Firestore messages updated:', firestoreMessages.length);
        
        const formattedMessages = firestoreMessages.map(msg => ({
          _id: msg._id || msg.id,
          conversationId: selectedConversation.conversationId,
          content: msg.content,
          sender: { _id: msg.senderId },
          senderType: msg.senderType,
          messageType: msg.messageType || 'text',
          createdAt: msg.createdAt,
          readBy: msg.readBy || [],
          status: msg.status || 'sent'
        }));

        setMessages(formattedMessages);

        if (adminId) {
          firestoreService.markMessagesAsRead(
            selectedConversation.conversationId,
            adminId
          );
          
          markMessagesReadAPI(selectedConversation.conversationId);
        }
      },
      (error) => {
        console.error('❌ Firestore messages error:', error);
      }
    );

    return () => {
      if (messagesUnsubscribe) {
        messagesUnsubscribe();
      }
    };
  }, [selectedConversation, adminId]);

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

  const markMessagesReadAPI = async (conversationId) => {
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/chat/${conversationId}/read`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
    } catch (error) {
      console.error('❌ Error marking messages as read:', error);
    }
  };

  const searchUsers = async (query) => {
    if (!query.trim()) {
      setSearchedUsers([]);
      return;
    }
  
    setSearchingUsers(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/admin/users?search=${encodeURIComponent(query)}&limit=10`,
        {
          headers: {
            'Authorization': `Bearer ${adminToken}`,
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

  // ✅ UPDATED: Use tour pattern - create conversation first
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

      // ✅ NEW: Create conversation using API (like tour chat)
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/chat/conversations/admin-user`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userId: userId // User to chat with
          })
        }
      );

      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Conversation created/found:', data.data.conversation.conversationId);
        
        // Wait a moment for Firestore to sync
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Find the conversation in our state (Firestore should have updated)
        const conversation = conversations.find(
          c => c.conversationId === data.data.conversation.conversationId
        );
        
        if (conversation) {
          selectConversation(conversation);
        } else {
          // If not in state yet, create a temp one and wait for Firestore
          const tempConversation = {
            conversationId: data.data.conversation.conversationId,
            participants: [userId, adminId],
            participantDetails: {
              [userId]: {
                name: user.fullName,
                email: user.email,
                profileImage: user.profileImage,
                userType: user.userType
              }
            },
            status: 'active',
            category: 'support',
            lastMessageAt: new Date()
          };
          
          selectConversation(tempConversation);
        }
        
        setShowUserSearch(false);
        
        setTimeout(() => {
          messageInputRef.current?.focus();
        }, 100);
      } else {
        console.error('❌ Failed to create conversation:', data.message);
        alert('Failed to create conversation: ' + data.message);
      }
  
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
    
    setSelectedConversation(conversation);
    
    if (isMobile) {
      setShowUserList(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || !adminToken) {
      console.log('⚠️ Cannot send message:', {
        hasContent: !!newMessage.trim(),
        hasConversation: !!selectedConversation,
        hasToken: !!adminToken
      });
      return;
    }

    const content = newMessage.trim();
    console.log('📤 Sending message:', {
      conversationId: selectedConversation.conversationId,
      contentLength: content.length
    });

    setSendingMessage(true);
    
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/chat/${selectedConversation.conversationId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            content: content,
            messageType: 'text'
          })
        }
      );

      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Message sent successfully');
        setNewMessage('');
      } else {
        console.error('❌ Failed to send message:', data.message);
        alert('Failed to send message: ' + data.message);
      }
    } catch (error) {
      console.error('❌ Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setSendingMessage(false);
    }
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

  const getConversationUser = (conversation) => {
    if (!conversation) return null;

    const userId = conversation.participants?.[0] || 
                  conversation.mongoParticipants?.find(id => id !== adminId);
    
    return conversation.participantDetails?.[userId] || null;
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Connecting to Firestore...</p>
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
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {user.fullName || 'Unknown User'}
                          </h3>
                          <p className="text-sm text-gray-500 truncate">{user.email}</p>
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
                const user = getConversationUser(conv);
                return user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                       user?.email?.toLowerCase().includes(searchQuery.toLowerCase());
              })
              .map((conversation) => {
                const user = getConversationUser(conversation);
                const isSelected = selectedConversation?.conversationId === conversation.conversationId;
                
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
                            alt={user.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-medium text-sm">
                              {user?.name?.charAt(0) || 'U'}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-medium text-gray-900 truncate">
                            {user?.name || 'Unknown User'}
                          </h3>
                          <span className="text-xs text-gray-500">
                            {formatTime(conversation.lastMessageAt)}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-600 truncate mt-1">
                          {conversation.lastMessage || 'No messages yet'}
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
                    const user = getConversationUser(selectedConversation);
                    
                    return (
                      <div className="flex items-center space-x-3">
                        {user?.profileImage ? (
                          <img
                            src={user.profileImage}
                            alt={user.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-medium">
                              {user?.name?.charAt(0) || 'U'}
                            </span>
                          </div>
                        )}
                        <div>
                          <h2 className="text-lg font-semibold text-gray-900">
                            {user?.name || 'Unknown User'}
                          </h2>
                          <p className="text-sm text-gray-500">
                            {user?.email || ''}
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

              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="bg-white border-t border-gray-200 p-4">
              <div className="flex items-end space-x-2">
                <div className="flex-1">
                  <textarea
                    ref={messageInputRef}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
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