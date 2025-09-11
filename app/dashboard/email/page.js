// app/dashboard/email/page.js
'use client';
import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../dashboard/layout';
import {
  PaperAirplaneIcon,
  UsersIcon,
  EyeIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  DocumentTextIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';

function EmailPage() {
  const [emailData, setEmailData] = useState({
    subject: '',
    content: '',
    useTemplate: false,
    templateId: null
  });
  
  const [recipients, setRecipients] = useState([]);
  const [selectedRecipients, setSelectedRecipients] = useState([]);
  const [recipientFilters, setRecipientFilters] = useState({
    userType: 'all',
    verificationStatus: 'all',
    city: 'all'
  });
  
  const [templates, setTemplates] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [showRecipientModal, setShowRecipientModal] = useState(false);
  const [sendToAll, setSendToAll] = useState(true);
  
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState(null);
  
  const [stats, setStats] = useState({
    total: 0,
    byUserType: {}
  });

  useEffect(() => {
    fetchTemplates();
    fetchRecipients();
  }, [recipientFilters]);

  const fetchTemplates = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/email/templates`, {

        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setTemplates(data.data.templates);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const fetchRecipients = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        ...recipientFilters,
        limit: '500'
      });
      
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/email/recipients?${params}`, {

        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setRecipients(data.data.recipients);
        setStats(data.data.summary);
      }
    } catch (error) {
      console.error('Error fetching recipients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSelect = (template) => {
    setEmailData({
      ...emailData,
      subject: template.subject,
      content: template.content,
      useTemplate: true,
      templateId: template.id
    });
  };

  const handleSendEmail = async () => {
    if (!emailData.subject || (!emailData.content && !emailData.useTemplate)) {
      alert('Please provide both subject and content');
      return;
    }

    setSending(true);
    setSendResult(null);

    try {
      const payload = {
        subject: emailData.subject,
        content: emailData.content,
        useTemplate: emailData.useTemplate,
        templateId: emailData.templateId,
        sendToAll: sendToAll,
        specificRecipients: sendToAll ? [] : selectedRecipients.map(r => r._id),
        recipientFilters: sendToAll ? recipientFilters : {}
      };

      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/email/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();
      setSendResult(result);
      
      if (result.success) {
        // Reset form on success
        setEmailData({
          subject: '',
          content: '',
          useTemplate: false,
          templateId: null
        });
        setSelectedRecipients([]);
      }
    } catch (error) {
      console.error('Error sending email:', error);
      setSendResult({
        success: false,
        message: 'Error sending email'
      });
    } finally {
      setSending(false);
    }
  };

  const toggleRecipientSelection = (recipient) => {
    const isSelected = selectedRecipients.find(r => r._id === recipient._id);
    if (isSelected) {
      setSelectedRecipients(selectedRecipients.filter(r => r._id !== recipient._id));
    } else {
      setSelectedRecipients([...selectedRecipients, recipient]);
    }
  };

  const getFilteredRecipientsCount = () => {
    if (sendToAll) {
      return stats.total || 0;
    }
    return selectedRecipients.length;
  };

  const previewContent = emailData.useTemplate && emailData.templateId 
    ? templates.find(t => t.id === emailData.templateId)?.content || emailData.content
    : emailData.content;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between">
          {/* <div className="flex items-center"> */}
            {/* <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-3 rounded-2xl shadow-lg mr-4">
              <PaperAirplaneIcon className="w-6 h-6 text-white" />
            </div> */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Jost, sans-serif' }}>
                Send Email
              </h1>
              <p className="text-gray-600" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Send emails to your users
              </p>
            </div>
          {/* </div> */}
          
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-gray-600">Total Recipients</p>
              <p className="text-2xl font-bold text-indigo-600">{getFilteredRecipientsCount()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Send Result Alert */}
      {sendResult && (
        <div className={`rounded-xl p-4 border ${
          sendResult.success 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-start">
            {sendResult.success ? (
              <CheckCircleIcon className="w-5 h-5 text-green-600 mt-0.5 mr-3" />
            ) : (
              <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mt-0.5 mr-3" />
            )}
            <div className="flex-1">
              <h3 className={`font-semibold ${
                sendResult.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {sendResult.success ? 'Email Sent Successfully!' : 'Email Send Failed'}
              </h3>
              <p className={`text-sm mt-1 ${
                sendResult.success ? 'text-green-700' : 'text-red-700'
              }`}>
                {sendResult.message}
              </p>
              {sendResult.data && (
                <div className="mt-2 text-sm text-gray-600">
                  <p>Total: {sendResult.data.totalRecipients} | Success: {sendResult.data.successful} | Failed: {sendResult.data.failed}</p>
                </div>
              )}
            </div>
            <button 
              onClick={() => setSendResult(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Email Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Email Templates */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Quick Templates
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleTemplateSelect(template)}
                  className={`p-3 text-left rounded-lg border transition-all duration-200 ${
                    emailData.templateId === template.id
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start">
                    <DocumentTextIcon className="w-5 h-5 text-indigo-600 mt-0.5 mr-2" />
                    <div>
                      <h3 className="font-medium text-gray-900 text-sm">{template.name}</h3>
                      <p className="text-xs text-gray-600 mt-1">{template.subject}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Email Composer */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Compose Email
            </h2>
            
            <div className="space-y-4">
              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject *
                </label>
                <input
                  type="text"
                  value={emailData.subject}
                  onChange={(e) => setEmailData({...emailData, subject: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter email subject..."
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Content *
                </label>
                <textarea
                  value={emailData.content}
                  onChange={(e) => setEmailData({...emailData, content: e.target.value, useTemplate: false, templateId: null})}
                  rows={12}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Write your email content... You can use {{name}}, {{email}}, {{userType}}, {{city}} as placeholders."
                  style={{ fontFamily: 'Poppins, sans-serif' }}
                />
                <p className="text-xs text-gray-500 mt-2">
                Available placeholders: {`{{name}}, {{email}}, {{userType}}, {{city}}`}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-4">
                <button
                  onClick={() => setShowPreview(true)}
                  disabled={!emailData.subject || !previewContent}
                  className="flex items-center px-4 py-2 text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <EyeIcon className="w-4 h-4 mr-2" />
                  Preview
                </button>
                
                <button
                  onClick={handleSendEmail}
                  disabled={sending || !emailData.subject || !previewContent}
                  className="flex items-center px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {sending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sending...
                    </>
                  ) : (
                    <>
                      <PaperAirplaneIcon className="w-4 h-4 mr-2" />
                      Send Email
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Recipients Panel */}
        <div className="space-y-6">
          {/* Recipient Selection */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Recipients
            </h2>
            
            <div className="space-y-4">
              {/* Send to All Toggle */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium text-gray-700">Send to All Users</span>
                <button
                  onClick={() => setSendToAll(!sendToAll)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    sendToAll ? 'bg-indigo-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      sendToAll ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Filters */}
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    User Type
                  </label>
                  <select
                    value={recipientFilters.userType}
                    onChange={(e) => setRecipientFilters({...recipientFilters, userType: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  >
                    <option value="all">All Users</option>
                    <option value="traveler">Travelers</option>
                    <option value="guide">Guides</option>
                    <option value="influencer">Influencers</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Verification Status
                  </label>
                  <select
                    value={recipientFilters.verificationStatus}
                    onChange={(e) => setRecipientFilters({...recipientFilters, verificationStatus: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  >
                    <option value="all">All Statuses</option>
                    <option value="approved">Approved</option>
                    <option value="pending">Pending</option>
                    <option value="not_required">Not Required</option>
                  </select>
                </div>
              </div>

              {/* Stats */}
              <div className="bg-indigo-50 rounded-lg p-4">
                <h3 className="font-medium text-indigo-900 mb-2">User Statistics</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-indigo-700">Total Users:</span>
                    <span className="font-medium text-indigo-900">{stats.total}</span>
                  </div>
                  {Object.entries(stats.byUserType || {}).map(([type, count]) => (
                    <div key={type} className="flex justify-between">
                      <span className="text-indigo-700 capitalize">{type}s:</span>
                      <span className="font-medium text-indigo-900">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {!sendToAll && (
                <button
                  onClick={() => setShowRecipientModal(true)}
                  className="w-full flex items-center justify-center px-4 py-2 border border-indigo-300 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
                >
                  <UsersIcon className="w-4 h-4 mr-2" />
                  Select Specific Users ({selectedRecipients.length})
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Email Preview</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="mb-4">
                <strong>Subject:</strong> {emailData.subject}
              </div>
              <div className="border rounded-lg p-4 bg-gray-50">
                <div dangerouslySetInnerHTML={{ 
                  __html: previewContent.replace(/\{\{name\}\}/g, 'John Doe')
                    .replace(/\{\{email\}\}/g, 'john@example.com')
                    .replace(/\{\{userType\}\}/g, 'traveler')
                    .replace(/\{\{city\}\}/g, 'Dubai')
                }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recipients Modal */}
      {showRecipientModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Select Recipients</h3>
              <button
                onClick={() => setShowRecipientModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : (
                <div className="space-y-2">
                  {recipients.map((recipient) => (
                    <div
                      key={recipient._id}
                      className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedRecipients.find(r => r._id === recipient._id)
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => toggleRecipientSelection(recipient)}
                    >
                      <div>
                        <p className="font-medium text-gray-900">{recipient.fullName}</p>
                        <p className="text-sm text-gray-600">{recipient.email}</p>
                        <p className="text-xs text-gray-500 capitalize">{recipient.userType} • {recipient.city}</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={!!selectedRecipients.find(r => r._id === recipient._id)}
                        onChange={() => toggleRecipientSelection(recipient)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center justify-between p-6 border-t border-gray-200">
              <p className="text-sm text-gray-600">{selectedRecipients.length} users selected</p>
              <button
                onClick={() => setShowRecipientModal(false)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <DashboardLayout>
      <EmailPage />
    </DashboardLayout>
  );
}