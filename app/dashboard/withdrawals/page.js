'use client';
import React, { useState, useEffect } from 'react';
import {
  BanknotesIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  EyeIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

const WithdrawalManagement = () => {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
  const [processingAction, setProcessingAction] = useState(null);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    processing: 0,
    completed: 0,
    totalAmount: 0
  });

  useEffect(() => {
    fetchWithdrawals();
  }, [selectedFilter]);

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      
      const params = new URLSearchParams();
      if (selectedFilter !== 'all') {
        params.append('status', selectedFilter);
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/withdrawals?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setWithdrawals(data.data.withdrawals || []);
        
        const withdrawalStats = {
          pending: data.data.withdrawals?.filter(w => w.status === 'pending').length || 0,
          approved: data.data.withdrawals?.filter(w => w.status === 'approved').length || 0,
          processing: data.data.withdrawals?.filter(w => w.status === 'processing').length || 0,
          completed: data.data.withdrawals?.filter(w => w.status === 'completed').length || 0,
          totalAmount: data.data.withdrawals?.reduce((sum, w) => sum + (w.amount || 0), 0) || 0
        };
        setStats(withdrawalStats);
      } else {
        console.error('Failed to fetch withdrawals:', data.message);
      }
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'approved':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'processing':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <ClockIcon className="w-4 h-4" />;
      case 'approved':
        return <CheckCircleIcon className="w-4 h-4" />;
      case 'processing':
        return <ClockIcon className="w-4 h-4" />;
      case 'completed':
        return <CheckCircleIcon className="w-4 h-4" />;
      case 'rejected':
        return <XCircleIcon className="w-4 h-4" />;
      default:
        return <InformationCircleIcon className="w-4 h-4" />;
    }
  };

  const getUserTypeColor = (userType) => {
    switch (userType) {
      case 'guide':
        return 'bg-blue-100 text-blue-800';
      case 'influencer':
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const copyToClipboard = (text) => {
    if (text) {
      navigator.clipboard.writeText(text);
      alert('Copied to clipboard!');
    }
  };

  const filteredWithdrawals = withdrawals.filter(withdrawal => {
    const matchesFilter = selectedFilter === 'all' || withdrawal.status === selectedFilter;
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      withdrawal.user?.name?.toLowerCase().includes(searchLower) ||
      withdrawal.reference?.toLowerCase().includes(searchLower) ||
      withdrawal.user?.email?.toLowerCase().includes(searchLower);
    return matchesFilter && matchesSearch;
  });

  const handleAction = async (withdrawalId, action, notes = '') => {
    setProcessingAction(withdrawalId);
    
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/withdrawals/${withdrawalId}/${action}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          notes,
          adminNotes: notes
        })
      });

      const result = await response.json();
      
      if (result.success) {
        await fetchWithdrawals();
        setSelectedWithdrawal(null);
        alert(`Withdrawal ${action} successfully!`);
      } else {
        alert(`Failed to ${action} withdrawal: ${result.message}`);
      }
    } catch (error) {
      console.error(`Error ${action} withdrawal:`, error);
      alert(`Error ${action} withdrawal. Please try again.`);
    } finally {
      setProcessingAction(null);
    }
  };

  const WithdrawalModal = ({ withdrawal, onClose }) => {
    const [actionNotes, setActionNotes] = useState('');
    const [transactionId, setTransactionId] = useState('');

    // Extract user information from backend response
    const userInfo = withdrawal.user || {};
    const userName = userInfo.name || 'Unknown User';
    const userEmail = userInfo.email || 'No email';
    const userType = userInfo.type || 'user';

    // Extract bank details from backend response
    const bankDetails = withdrawal.bankDetails || {};
    const hasBankDetails = bankDetails && Object.keys(bankDetails).length > 0;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Jost, sans-serif' }}>
                Withdrawal Details
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-2xl"
              >
                ×
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Withdrawal Information */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Reference</p>
                  <p className="font-semibold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    {withdrawal.reference || withdrawal.id}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Amount</p>
                  <p className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Jost, sans-serif' }}>
                    ${(withdrawal.amount || 0).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Status</p>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(withdrawal.status)}`}>
                    {getStatusIcon(withdrawal.status)}
                    <span className="ml-1 capitalize">{withdrawal.status}</span>
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Payment Method</p>
                  <p className="font-medium text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    Bank Transfer
                  </p>
                </div>
              </div>
            </div>

            {/* User Information */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4" style={{ fontFamily: 'Jost, sans-serif' }}>
                User Information
              </h3>
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mr-4">
                  <span className="text-white font-bold">
                    {userName.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    {userName}
                  </p>
                  <p className="text-sm text-gray-600">{userEmail}</p>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${getUserTypeColor(userType)}`}>
                    {userType}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Details */}
            {hasBankDetails ? (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-blue-900" style={{ fontFamily: 'Jost, sans-serif' }}>
                    Payment Details for Processing
                  </h3>
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                    BANK TRANSFER
                  </span>
                </div>

                <div className="bg-white rounded-xl p-4 border border-blue-200">
                  <h4 className="font-bold text-lg text-gray-900 mb-3">
                    Bank Transfer Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {bankDetails.bankName && (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Bank Name</p>
                        <p className="text-lg font-bold text-gray-900 mt-1">
                          {bankDetails.bankName}
                        </p>
                      </div>
                    )}
                    
                    {(bankDetails.accountHolderName || userName) && (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Account Holder</p>
                        <p className="text-lg font-bold text-gray-900 mt-1">
                          {bankDetails.accountHolderName || userName}
                        </p>
                      </div>
                    )}
                    
                    {(bankDetails.accountNumber || bankDetails.accountNumberMasked) && (
  <div className="bg-gray-50 p-3 rounded-lg">
    <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">Account Number</p>
    <p className="text-lg font-bold text-gray-900 mt-1 font-mono tracking-wider">
      {bankDetails.accountNumber || bankDetails.accountNumberMasked}
    </p>
    <div className="flex items-center justify-between mt-2">
      <p className="text-xs text-green-600">
        Full account number displayed for manual processing
      </p>
      <button
        onClick={() => copyToClipboard(bankDetails.accountNumber || bankDetails.accountNumberMasked)}
        className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 px-2 py-1 rounded transition-colors"
      >
        Copy
      </button>
    </div>
  </div>
)}
                  </div>
                </div>

               
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-red-900 mb-4">
                  Payment Details Not Available
                </h3>
                <div className="text-sm text-red-800 space-y-2">
                  <p>No payment details found in the backend response.</p>
                  <p>Available withdrawal data:</p>
                  <ul className="list-disc ml-4">
                    <li>Withdrawal ID: {withdrawal.id}</li>
                    <li>Reference: {withdrawal.reference}</li>
                    <li>Amount: ${withdrawal.amount}</li>
                    <li>Status: {withdrawal.status}</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Timeline */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4" style={{ fontFamily: 'Jost, sans-serif' }}>
                Timeline
              </h3>
              <div className="space-y-3">
                {withdrawal.requestedAt && (
                  <div className="flex items-center text-sm">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                    <span className="text-gray-600">
                      Requested: {new Date(withdrawal.requestedAt).toLocaleDateString()} at {new Date(withdrawal.requestedAt).toLocaleTimeString()}
                    </span>
                  </div>
                )}
                {withdrawal.processedAt && (
                  <div className="flex items-center text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-gray-600">
                      Processed: {new Date(withdrawal.processedAt).toLocaleDateString()} at {new Date(withdrawal.processedAt).toLocaleTimeString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Request Notes */}
            {withdrawal.requestNotes && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-2" style={{ fontFamily: 'Jost, sans-serif' }}>
                  Request Notes
                </h3>
                <p className="text-gray-700" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  {withdrawal.requestNotes}
                </p>
              </div>
            )}

            {/* Actions for Pending */}
            {withdrawal.status === 'pending' && (
              <div className="bg-gray-50 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4" style={{ fontFamily: 'Jost, sans-serif' }}>
                  Admin Actions
                </h3>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Notes (Optional)
                  </label>
                  <textarea
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    rows="3"
                    placeholder="Add notes for this action..."
                    style={{ fontFamily: 'Poppins, sans-serif' }}
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => handleAction(withdrawal.id, 'approve', actionNotes)}
                    disabled={processingAction === withdrawal.id}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-xl font-semibold transition-colors disabled:opacity-50"
                    style={{ fontFamily: 'Poppins, sans-serif' }}
                  >
                    {processingAction === withdrawal.id ? 'Processing...' : 'Approve Withdrawal'}
                  </button>
                  
                  <button
                    onClick={() => handleAction(withdrawal.id, 'reject', actionNotes)}
                    disabled={processingAction === withdrawal.id}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 px-6 rounded-xl font-semibold transition-colors disabled:opacity-50"
                    style={{ fontFamily: 'Poppins, sans-serif' }}
                  >
                    {processingAction === withdrawal.id ? 'Processing...' : 'Reject Withdrawal'}
                  </button>
                </div>
              </div>
            )}

            {/* Complete Processing Actions */}
            {withdrawal.status === 'processing' && (
              <div className="bg-gray-50 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4" style={{ fontFamily: 'Jost, sans-serif' }}>
                  Complete Processing
                </h3>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Transaction Reference
                  </label>
                  <input
                    type="text"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Enter transaction reference..."
                    style={{ fontFamily: 'Poppins, sans-serif' }}
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Completion Notes
                  </label>
                  <textarea
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    rows="3"
                    placeholder="Add completion notes..."
                    style={{ fontFamily: 'Poppins, sans-serif' }}
                  />
                </div>

                <button
                  onClick={() => handleAction(withdrawal.id, 'complete', `${actionNotes} | Transaction: ${transactionId}`)}
                  disabled={processingAction === withdrawal.id || !transactionId.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-xl font-semibold transition-colors disabled:opacity-50"
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                >
                  {processingAction === withdrawal.id ? 'Processing...' : 'Mark as Completed'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-3xl p-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'Jost, sans-serif' }}>
                Withdrawal Management
              </h1>
              <p className="text-white/90" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Loading withdrawal data...
              </p>
            </div>
            <BanknotesIcon className="w-16 h-16 text-white/80" />
          </div>
        </div>
        
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
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
              Withdrawal Management
            </h1>
            <p className="text-white/90" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Review and process withdrawal requests from tour guides and influencers
            </p>
          </div>
          <BanknotesIcon className="w-16 h-16 text-white/80" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center">
            <div className="bg-orange-100 p-3 rounded-xl">
              <ClockIcon className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Jost, sans-serif' }}>
                {stats.pending}
              </p>
              <p className="text-sm text-gray-600">Pending Review</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-xl">
              <CheckCircleIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Jost, sans-serif' }}>
                {stats.approved}
              </p>
              <p className="text-sm text-gray-600">Approved</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center">
            <div className="bg-purple-100 p-3 rounded-xl">
              <ClockIcon className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Jost, sans-serif' }}>
                {stats.processing}
              </p>
              <p className="text-sm text-gray-600">Processing</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-xl">
              <BanknotesIcon className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Jost, sans-serif' }}>
                ${stats.totalAmount.toFixed(0)}
              </p>
              <p className="text-sm text-gray-600">Total Amount</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search withdrawals..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-gray-100 border-0 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all duration-200 w-64"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              />
            </div>

            <div className="flex items-center space-x-2">
              <FunnelIcon className="w-5 h-5 text-gray-600" />
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="bg-gray-100 border-0 rounded-xl py-2 px-3 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all duration-200"
                style={{ fontFamily: 'Poppins, sans-serif' }}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="processing">Processing</option>
                <option value="completed">Completed</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          <button 
            onClick={fetchWithdrawals}
            className="flex items-center px-4 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-xl transition-colors"
          >
            <span className="font-medium" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Refresh
            </span>
          </button>
        </div>
      </div>

      {/* Withdrawals Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  User
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Reference
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Amount
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Method
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Status
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Requested
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredWithdrawals.map((withdrawal) => {
                const userInfo = withdrawal.user || {};
                const userName = userInfo.name || 'Unknown User';
                const userEmail = userInfo.email || 'No email';
                const userType = userInfo.type || 'user';

                return (
                  <tr key={withdrawal.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mr-3">
                          <span className="text-white font-bold text-sm">
                            {userName.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                            {userName}
                          </p>
                          <p className="text-sm text-gray-600">{userEmail}</p>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${getUserTypeColor(userType)}`}>
                            {userType}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-mono text-sm text-gray-900">{withdrawal.reference}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        ${(withdrawal.amount || 0).toFixed(2)}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                        Bank Transfer
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(withdrawal.status)}`}>
                        {getStatusIcon(withdrawal.status)}
                        <span className="ml-1 capitalize">{withdrawal.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">
                        {withdrawal.requestedAt ? new Date(withdrawal.requestedAt).toLocaleDateString() : 'N/A'}
                      </p>
                      <p className="text-xs text-gray-600">
                        {withdrawal.requestedAt ? new Date(withdrawal.requestedAt).toLocaleTimeString() : ''}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setSelectedWithdrawal(withdrawal)}
                        className="flex items-center px-3 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg transition-colors"
                      >
                        <EyeIcon className="w-4 h-4 mr-1" />
                        <span className="text-sm font-medium">View</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredWithdrawals.length === 0 && !loading && (
          <div className="text-center py-12">
            <BanknotesIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
              No withdrawals found matching your criteria
            </p>
          </div>
        )}
      </div>

      {/* Withdrawal Detail Modal */}
      {selectedWithdrawal && (
        <WithdrawalModal
          withdrawal={selectedWithdrawal}
          onClose={() => setSelectedWithdrawal(null)}
        />
      )}
    </div>
  );
};

export default WithdrawalManagement;