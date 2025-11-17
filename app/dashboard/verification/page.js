'use client';
import React, { useState, useEffect } from 'react';
import {
  ShieldCheckIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  PhotoIcon,
  GlobeAltIcon,
  AcademicCapIcon,
  BuildingOfficeIcon,
  IdentificationIcon,
  StarIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ArrowDownTrayIcon,
  LinkIcon,
  PhoneIcon,
  EnvelopeIcon,
  UserGroupIcon,
  UserIcon,
  BriefcaseIcon
} from '@heroicons/react/24/outline';
import apiService from '../../../lib/apiService';

const VerificationManagement = () => {
  const [selectedFilter, setSelectedFilter] = useState('pending');
  const [selectedServiceType, setSelectedServiceType] = useState('all');
  const [selectedGuideType, setSelectedGuideType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVerification, setSelectedVerification] = useState(null);
  const [processingAction, setProcessingAction] = useState(null);
  
  // Real state management
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState(null);
  const [stats, setStats] = useState({
    pendingCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
    incompleteCount: 0
  });

  const fetchVerifications = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      
      const filters = {
        status: selectedFilter === 'all' ? undefined : selectedFilter,
        serviceType: selectedServiceType === 'all' ? undefined : selectedServiceType,
        guideType: selectedGuideType === 'all' ? undefined : selectedGuideType,
        search: searchTerm || undefined,
        page: 1,
        limit: 20
      };

      Object.keys(filters).forEach(key => filters[key] === undefined && delete filters[key]);

      const response = await apiService.getVerifications(filters);
      
      setVerifications(response.data.verifications);
      setPagination(response.data.pagination);
      setStats(response.data.stats);
      setError(null);
    } catch (error) {
      console.error('Error fetching verifications:', error);
      setError('Failed to load verifications. Please try again.');
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchVerifications(true);
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchVerifications(false);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [selectedFilter, selectedServiceType, selectedGuideType, searchTerm]);

  const getGuideTypeLabel = (guideType) => {
    const labels = {
      single_certified: 'Certified Guide',
      single_uncertified: 'Uncertified Guide',
      company: 'Company'
    };
    return labels[guideType] || 'Not Specified';
  };

  const getGuideTypeIcon = (guideType) => {
    switch (guideType) {
      case 'single_certified':
        return <AcademicCapIcon className="w-4 h-4" />;
      case 'single_uncertified':
        return <UserIcon className="w-4 h-4" />;
      case 'company':
        return <BuildingOfficeIcon className="w-4 h-4" />;
      default:
        return <UserGroupIcon className="w-4 h-4" />;
    }
  };

  const getGuideTypeColor = (guideType) => {
    switch (guideType) {
      case 'single_certified':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'single_uncertified':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'company':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'incomplete':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'pending':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'approved':
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
      case 'rejected':
        return <XCircleIcon className="w-4 h-4" />;
      case 'incomplete':
        return <ExclamationTriangleIcon className="w-4 h-4" />;
      default:
        return <InformationCircleIcon className="w-4 h-4" />;
    }
  };

  const getServiceTypeLabel = (serviceType) => {
    const labels = {
      tour_guide: 'Tour Guide',
      halal_restaurant: 'Halal Restaurant',
      transportation: 'Transportation',
      muslim_hotel: 'Muslim Hotel',
      modest_fashion: 'Modest Fashion',
      religious_service: 'Religious Service',
      healthcare: 'Healthcare',
      halal_food_delivery: 'Food Delivery',
      event_planning: 'Event Planning',
      other: 'Other'
    };
    return labels[serviceType] || serviceType;
  };

  const normalizeSocialMediaUrl = (url, platform) => {
    if (!url) return null;
    
    url = url.trim();
    
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    
    const username = url.replace('@', '').trim();
    
    const platformUrls = {
      instagram: `https://instagram.com/${username}`,
      facebook: `https://facebook.com/${username}`,
      twitter: `https://twitter.com/${username}`,
      linkedin: `https://linkedin.com/in/${username}`
    };
    
    if (url.includes('instagram.com') || url.includes('facebook.com') || 
        url.includes('twitter.com') || url.includes('linkedin.com')) {
      return `https://${url.replace(/^(https?:\/\/)/, '')}`;
    }
    
    return platformUrls[platform] || `https://${username}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not available';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Not available';
      }
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch (error) {
      return 'Not available';
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Not available';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Not available';
      }
      return date.toLocaleString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Not available';
    }
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return '';
      }
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return '';
    }
  };

  const handleAction = async (verificationId, action, data = {}) => {
    setProcessingAction(verificationId);
    
    try {
      if (action === 'approve') {
        await apiService.approveVerification(verificationId, data.reviewNotes);
      } else if (action === 'reject') {
        await apiService.rejectVerification(verificationId, data.rejectionReason, data.requiredChanges);
      }

      setVerifications(prevVerifications => 
        prevVerifications.map(verification => 
          verification._id === verificationId 
            ? { 
                ...verification, 
                verificationStatus: action === 'approve' ? 'approved' : 'rejected',
                adminReview: {
                  reviewedAt: new Date().toISOString(),
                  reviewNotes: data.reviewNotes,
                  rejectionReason: data.rejectionReason,
                  requiredChanges: data.requiredChanges
                }
              }
            : verification
        )
      );
      
      setStats(prevStats => {
        const newStats = { ...prevStats };
        const verification = verifications.find(v => v._id === verificationId);
        
        if (verification && verification.verificationStatus === 'pending') {
          newStats.pendingCount = Math.max(0, newStats.pendingCount - 1);
          if (action === 'approve') newStats.approvedCount++;
          else if (action === 'reject') newStats.rejectedCount++;
        }
        
        return newStats;
      });
      
      setSelectedVerification(null);
      alert(`Verification ${action}ed successfully!`);
      
      setTimeout(() => {
        apiService.getVerifications({}, { forceRefresh: true }).catch(console.error);
      }, 1000);
      
    } catch (error) {
      console.error(`Error ${action}ing verification:`, error);
      alert(`Failed to ${action} verification. Please try again.`);
    } finally {
      setProcessingAction(null);
    }
  };

  const handleDocumentVerification = async (verificationId, documentType, verified) => {
    try {
      await apiService.updateDocumentVerification(verificationId, documentType, verified);
      
      setSelectedVerification(prevVerification => {
        if (!prevVerification || prevVerification._id !== verificationId) return prevVerification;
        
        return {
          ...prevVerification,
          documents: {
            ...prevVerification.documents,
            [documentType]: {
              ...prevVerification.documents[documentType],
              verified
            }
          }
        };
      });
      
      setVerifications(prevVerifications => 
        prevVerifications.map(verification => 
          verification._id === verificationId 
            ? {
                ...verification,
                documents: {
                  ...verification.documents,
                  [documentType]: {
                    ...verification.documents[documentType],
                    verified
                  }
                }
              }
            : verification
        )
      );
      
      alert(`Document ${verified ? 'verified' : 'unverified'} successfully!`);
      
    } catch (error) {
      console.error('Error updating document verification:', error);
      alert('Failed to update document verification.');
    }
  };

  const viewDetails = async (verificationId) => {
    try {
      setSelectedVerification({ loading: true });
      
      const response = await apiService.getVerificationDetails(verificationId);
      setSelectedVerification(response.data.verification);
    } catch (error) {
      console.error('Error fetching verification details:', error);
      alert('Failed to load verification details.');
      setSelectedVerification(null);
    }
  };

  const DocumentViewer = ({ document, type, title, verificationId }) => {
    if (!document || !document.fileUrl) return null;

    const getDocumentIcon = (type) => {
      switch (type) {
        case 'tourGuideCertificate':
          return <AcademicCapIcon className="w-5 h-5 text-purple-600 mr-2" />;
        case 'governmentId':
        case 'personInChargeId':
          return <IdentificationIcon className="w-5 h-5 text-blue-600 mr-2" />;
        case 'companyRegistration':
        case 'businessLicense':
          return <BuildingOfficeIcon className="w-5 h-5 text-indigo-600 mr-2" />;
        case 'companyTaxDocument':
          return <DocumentTextIcon className="w-5 h-5 text-green-600 mr-2" />;
        default:
          return <DocumentTextIcon className="w-5 h-5 text-blue-600 mr-2" />;
      }
    };

    const isPDF = document.fileName?.toLowerCase().endsWith('.pdf') || 
                  document.fileUrl?.toLowerCase().includes('.pdf');

    const handleDocumentClick = (e) => {
      if (isPDF) {
        e.preventDefault();
        const newWindow = window.open(document.fileUrl, '_blank');
        if (newWindow) {
          newWindow.focus();
        } else {
          const link = document.createElement('a');
          link.href = document.fileUrl;
          link.download = document.fileName || 'document.pdf';
          link.target = '_blank';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      }
    };

    return (
      <div className="border border-gray-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center min-w-0 flex-1">
            {getDocumentIcon(type)}
            <span className="font-medium text-gray-900 text-sm md:text-base truncate">{title}</span>
          </div>
          <div className="flex items-center space-x-2 flex-shrink-0 ml-2">
            {document.verified ? (
              <CheckCircleIcon className="w-5 h-5 text-green-500" />
            ) : (
              <ClockIcon className="w-5 h-5 text-orange-500" />
            )}
            <a
              href={document.fileUrl}
              onClick={handleDocumentClick}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:text-indigo-800 text-xs md:text-sm font-medium whitespace-nowrap"
            >
              {isPDF ? 'View PDF' : 'View'}
            </a>
          </div>
        </div>
        <div className="text-xs md:text-sm text-gray-600 mb-3 space-y-1">
          <p className="truncate">File: {document.fileName}</p>
          <p>Uploaded: {formatDate(document.uploadedAt)}</p>
          <p>Status: <span className={document.verified ? 'text-green-600' : 'text-orange-600'}>
            {document.verified ? 'Verified' : 'Pending Review'}
          </span></p>
        </div>
        <button
          onClick={() => handleDocumentVerification(verificationId, type, !document.verified)}
          className={`w-full py-2 px-4 rounded-lg font-medium transition-colors text-sm ${
            document.verified 
              ? 'bg-red-100 text-red-700 hover:bg-red-200' 
              : 'bg-green-100 text-green-700 hover:bg-green-200'
          }`}
        >
          {document.verified ? 'Mark as Unverified' : 'Mark as Verified'}
        </button>
      </div>
    );
  };

  const VerificationModal = ({ verification, onClose }) => {
    const [actionNotes, setActionNotes] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');
    const [requiredChanges, setRequiredChanges] = useState(['']);

    const addRequiredChange = () => {
      setRequiredChanges([...requiredChanges, '']);
    };

    const removeRequiredChange = (index) => {
      setRequiredChanges(requiredChanges.filter((_, i) => i !== index));
    };

    const updateRequiredChange = (index, value) => {
      const updated = [...requiredChanges];
      updated[index] = value;
      setRequiredChanges(updated);
    };

    if (verification?.loading) {
      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl md:rounded-3xl p-6 md:p-8">
            <div className="animate-spin rounded-full h-12 w-12 md:h-16 md:w-16 border-b-2 border-indigo-500 mx-auto"></div>
            <p className="text-center mt-4 text-gray-600 text-sm md:text-base">Loading verification details...</p>
          </div>
        </div>
      );
    }

    const getRequiredDocuments = () => {
      if (!verification.guideType) {
        return [
          { key: 'passportId', label: 'Passport/ID' },
          { key: 'businessLicense', label: 'Business License' },
          { key: 'professionalCert', label: 'Professional Certificate' },
          { key: 'halalCert', label: 'Halal Certificate' }
        ];
      }

      switch (verification.guideType) {
        case 'single_certified':
          return [
            { key: 'tourGuideCertificate', label: 'Tour Guide Certificate' },
            { key: 'governmentId', label: 'Government ID' }
          ];
        case 'single_uncertified':
          return [
            { key: 'governmentId', label: 'Government ID' }
          ];
        case 'company':
          return [
            { key: 'companyRegistration', label: 'Company Registration' },
            { key: 'personInChargeId', label: 'Person in Charge ID' },
            { key: 'companyTaxDocument', label: 'Company Tax Document' }
          ];
        default:
          return [];
      }
    };

    const requiredDocs = getRequiredDocuments();

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl md:rounded-3xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
          {/* Modal Header - Sticky */}
          <div className="sticky top-0 bg-white p-4 md:p-6 border-b border-gray-200 z-10">
            <div className="flex items-center justify-between">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900" style={{ fontFamily: 'Jost, sans-serif' }}>
                Verification Review
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-2xl flex-shrink-0"
              >
                ×
              </button>
            </div>
          </div>

          <div className="p-4 md:p-6 space-y-4 md:space-y-6">
            {/* Verification Header - Mobile Responsive */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl md:rounded-2xl p-4 md:p-6">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between space-y-4 md:space-y-0 mb-4">
                <div className="flex items-start">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mr-3 md:mr-4 flex-shrink-0">
                    <span className="text-white font-bold text-base md:text-xl">
                      {verification.userId?.fullName?.split(' ').map(n => n[0]).join('') || 'U'}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg md:text-2xl font-bold text-gray-900 mb-1 break-words" style={{ fontFamily: 'Jost, sans-serif' }}>
                      {verification.userId?.fullName || 'Unknown User'}
                    </h3>
                    <p className="text-gray-600 mb-2 text-sm md:text-base break-words">{verification.businessName}</p>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-2 sm:space-y-0 text-xs md:text-sm text-gray-600">
                      <div className="flex items-center min-w-0">
                        <EnvelopeIcon className="w-4 h-4 mr-1 flex-shrink-0" />
                        <span className="truncate">{verification.userId?.email}</span>
                      </div>
                      <div className="flex items-center">
                        <PhoneIcon className="w-4 h-4 mr-1 flex-shrink-0" />
                        <span>{verification.userId?.phone}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-left md:text-right flex-shrink-0">
                  <span className={`inline-flex items-center px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-medium border ${getStatusColor(verification.verificationStatus)}`}>
                    {getStatusIcon(verification.verificationStatus)}
                    <span className="ml-2 capitalize">{verification.verificationStatus}</span>
                  </span>
                  <p className="text-xs md:text-sm text-gray-600 mt-2">
                    Submitted: {formatDate(verification.submittedAt)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
                {verification.guideType && (
                  <div className="bg-white p-3 md:p-4 rounded-lg md:rounded-xl">
                    <p className="text-xs md:text-sm text-gray-600">Guide Type</p>
                    <div className="flex items-center mt-1">
                      {getGuideTypeIcon(verification.guideType)}
                      <p className="font-semibold text-gray-900 ml-1 text-xs md:text-sm">{getGuideTypeLabel(verification.guideType)}</p>
                    </div>
                  </div>
                )}
                <div className="bg-white p-3 md:p-4 rounded-lg md:rounded-xl">
                  <p className="text-xs md:text-sm text-gray-600">Service Type</p>
                  <p className="font-semibold text-gray-900 text-xs md:text-sm">{getServiceTypeLabel(verification.serviceType)}</p>
                </div>
                <div className="bg-white p-3 md:p-4 rounded-lg md:rounded-xl">
                  <p className="text-xs md:text-sm text-gray-600">City</p>
                  <p className="font-semibold text-gray-900 text-xs md:text-sm">{verification.city}</p>
                </div>
                <div className="bg-white p-3 md:p-4 rounded-lg md:rounded-xl">
                  <p className="text-xs md:text-sm text-gray-600">Experience</p>
                  <p className="font-semibold text-gray-900 text-xs md:text-sm">{verification.yearsOfExperience} years</p>
                </div>
                <div className="bg-white p-3 md:p-4 rounded-lg md:rounded-xl">
                  <p className="text-xs md:text-sm text-gray-600">Test Score</p>
                  <p className={`font-semibold text-xs md:text-sm ${verification.testResults?.passed ? 'text-green-600' : 'text-red-600'}`}>
                    {verification.testResults?.percentage || 0}%
                  </p>
                </div>
              </div>
            </div>

            {/* Progress Steps - Mobile Responsive */}
            <div className="bg-white border border-gray-200 rounded-xl md:rounded-2xl p-4 md:p-6">
              <h4 className="text-base md:text-lg font-bold text-gray-900 mb-4" style={{ fontFamily: 'Jost, sans-serif' }}>
                Verification Progress
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
                {[
                  ...(verification.guideType ? [{ key: 'guideTypeSelection', label: 'Guide Type', icon: UserGroupIcon }] : []),
                  { key: 'basicInfo', label: 'Basic Info', icon: IdentificationIcon },
                  { key: 'documents', label: 'Documents', icon: DocumentTextIcon },
                  { key: 'knowledgeTest', label: 'Knowledge Test', icon: AcademicCapIcon },
                  { key: 'onlinePresence', label: 'Online Presence', icon: GlobeAltIcon },
                  { key: 'review', label: 'Admin Review', icon: ShieldCheckIcon }
                ].map((step) => (
                  <div key={step.key} className={`p-2 md:p-3 rounded-lg md:rounded-xl border-2 ${
                    verification.completedSteps?.[step.key]
                      ? 'border-green-200 bg-green-50' 
                      : 'border-gray-200 bg-gray-50'
                  }`}>
                    <div className="flex items-center mb-2">
                      <step.icon className={`w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2 ${
                        verification.completedSteps?.[step.key] ? 'text-green-600' : 'text-gray-400'
                      }`} />
                      <span className="font-medium text-xs md:text-sm">{step.label}</span>
                    </div>
                    {verification.completedSteps?.[step.key] ? (
                      <CheckCircleIcon className="w-5 h-5 md:w-6 md:h-6 text-green-500" />
                    ) : (
                      <ClockIcon className="w-5 h-5 md:w-6 md:h-6 text-gray-400" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Service Description */}
            <div className="bg-white border border-gray-200 rounded-xl md:rounded-2xl p-4 md:p-6">
              <h4 className="text-base md:text-lg font-bold text-gray-900 mb-3" style={{ fontFamily: 'Jost, sans-serif' }}>
                Service Description
              </h4>
              <p className="text-gray-700 leading-relaxed text-sm md:text-base" style={{ fontFamily: 'Poppins, sans-serif' }}>
                {verification.serviceDescription}
              </p>
            </div>

            {/* Documents Section - Mobile Responsive */}
            <div className="bg-white border border-gray-200 rounded-xl md:rounded-2xl p-4 md:p-6">
              <h4 className="text-base md:text-lg font-bold text-gray-900 mb-4" style={{ fontFamily: 'Jost, sans-serif' }}>
                Uploaded Documents
                {verification.guideType && (
                  <span className={`ml-2 md:ml-3 text-xs md:text-sm px-2 md:px-3 py-1 rounded-full border ${getGuideTypeColor(verification.guideType)}`}>
                    {getGuideTypeIcon(verification.guideType)}
                    <span className="ml-1">{getGuideTypeLabel(verification.guideType)}</span>
                  </span>
                )}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                {requiredDocs.map(doc => (
                  <DocumentViewer 
                    key={doc.key}
                    document={verification.documents?.[doc.key]} 
                    type={doc.key}
                    title={doc.label}
                    verificationId={verification._id}
                  />
                ))}
              </div>
            </div>

            {/* Knowledge Test Results */}
            {verification.testResults && (
              <div className="bg-white border border-gray-200 rounded-xl md:rounded-2xl p-4 md:p-6">
                <h4 className="text-base md:text-lg font-bold text-gray-900 mb-4" style={{ fontFamily: 'Jost, sans-serif' }}>
                  Knowledge Test Results
                </h4>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-gray-50 rounded-xl gap-4">
                  <div className="flex items-center">
                    <AcademicCapIcon className={`w-6 h-6 md:w-8 md:h-8 mr-3 flex-shrink-0 ${verification.testResults.passed ? 'text-green-600' : 'text-red-600'}`} />
                    <div>
                      <p className="font-semibold text-gray-900 text-sm md:text-base">
                        Score: {verification.testResults.percentage}%
                      </p>
                      <p className="text-xs md:text-sm text-gray-600">
                        Status: <span className={verification.testResults.passed ? 'text-green-600' : 'text-red-600'}>
                          {verification.testResults.passed ? 'Passed' : 'Failed'}
                        </span>
                      </p>
                      {verification.testResults.completedAt && (
                        <p className="text-xs text-gray-500">
                          Completed: {formatDate(verification.testResults.completedAt)}
                        </p>
                      )}
                    </div>
                  </div>
                  {verification.testResults.retakeCount > 0 && (
                    <div className="text-left sm:text-right">
                      <p className="text-xs md:text-sm text-orange-600">
                        Retake #{verification.testResults.retakeCount}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Online Presence - Mobile Responsive */}
            <div className="bg-white border border-gray-200 rounded-xl md:rounded-2xl p-4 md:p-6">
              <h4 className="text-base md:text-lg font-bold text-gray-900 mb-4" style={{ fontFamily: 'Jost, sans-serif' }}>
                Online Presence
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                {verification.onlinePresence?.website && (
                  <div className="flex items-center p-3 bg-blue-50 rounded-xl">
                    <GlobeAltIcon className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm md:text-base">Website</p>
                      <a 
                        href={verification.onlinePresence.website.startsWith('http') 
                          ? verification.onlinePresence.website 
                          : `https://${verification.onlinePresence.website}`
                        } 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-blue-600 hover:text-blue-800 text-xs md:text-sm truncate block"
                      >
                        {verification.onlinePresence.website}
                      </a>
                    </div>
                  </div>
                )}
                {verification.onlinePresence?.socialMedia && Object.entries(verification.onlinePresence.socialMedia).map(([platform, url]) => {
                  const normalizedUrl = normalizeSocialMediaUrl(url, platform);
                  return normalizedUrl ? (
                    <div key={platform} className="flex items-center p-3 bg-purple-50 rounded-xl">
                      <LinkIcon className="w-5 h-5 text-purple-600 mr-3 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 capitalize text-sm md:text-base">{platform}</p>
                        <a 
                          href={normalizedUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-purple-600 hover:text-purple-800 text-xs md:text-sm truncate block"
                        >
                          {url.replace('@', '')}
                        </a>
                      </div>
                    </div>
                  ) : null;
                })}
              </div>
            </div>

            {/* Previous Admin Review */}
            {verification.adminReview && verification.adminReview.reviewedAt && 
             !isNaN(new Date(verification.adminReview.reviewedAt).getTime()) && (
              <div className={`border-2 rounded-xl md:rounded-2xl p-4 md:p-6 ${
                verification.verificationStatus === 'approved' 
                  ? 'border-green-200 bg-green-50'
                  : 'border-red-200 bg-red-50'
              }`}>
                <h4 className="text-base md:text-lg font-bold text-gray-900 mb-3" style={{ fontFamily: 'Jost, sans-serif' }}>
                  Previous Admin Review
                </h4>
                <div className="space-y-3">
                  <p className="text-xs md:text-sm text-gray-600">
                    Reviewed on: {formatDateTime(verification.adminReview.reviewedAt)}
                  </p>
                  {verification.adminReview.reviewNotes && (
                    <div>
                      <p className="font-medium text-gray-900 mb-1 text-sm md:text-base">Review Notes:</p>
                      <p className="text-gray-700 text-sm md:text-base">{verification.adminReview.reviewNotes}</p>
                    </div>
                  )}
                  {verification.adminReview.rejectionReason && (
                    <div>
                      <p className="font-medium text-red-800 mb-1 text-sm md:text-base">Rejection Reason:</p>
                      <p className="text-red-700 text-sm md:text-base">{verification.adminReview.rejectionReason}</p>
                    </div>
                  )}
                  {verification.adminReview.requiredChanges && verification.adminReview.requiredChanges.length > 0 && (
                    <div>
                      <p className="font-medium text-orange-800 mb-2 text-sm md:text-base">Required Changes:</p>
                      <ul className="list-disc list-inside text-orange-700 space-y-1 text-sm md:text-base">
                        {verification.adminReview.requiredChanges.map((change, index) => (
                          <li key={index}>{change}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Admin Actions - Mobile Responsive */}
            {verification.verificationStatus === 'pending' && (
              <div className="bg-gray-50 rounded-xl md:rounded-2xl p-4 md:p-6">
                <h4 className="text-base md:text-lg font-bold text-gray-900 mb-4" style={{ fontFamily: 'Jost, sans-serif' }}>
                  Admin Review Actions
                </h4>
                
                <div className="mb-6">
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                    Review Notes
                  </label>
                  <textarea
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm md:text-base"
                    rows="3"
                    placeholder="Add notes about the verification review..."
                    style={{ fontFamily: 'Poppins, sans-serif' }}
                  />
                </div>

                <div className="flex flex-col gap-3 mb-6">
                  <button
                    onClick={() => handleAction(verification._id, 'approve', { reviewNotes: actionNotes })}
                    disabled={processingAction === verification._id}
                    className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-xl font-semibold transition-colors disabled:opacity-50 text-sm md:text-base"
                    style={{ fontFamily: 'Poppins, sans-serif' }}
                  >
                    {processingAction === verification._id ? 'Processing...' : 'Approve Verification'}
                  </button>
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                    Rejection Reason
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent mb-4 text-sm md:text-base"
                    rows="2"
                    placeholder="Explain why this verification is being rejected..."
                    style={{ fontFamily: 'Poppins, sans-serif' }}
                  />

                  <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                    Required Changes
                  </label>
                  {requiredChanges.map((change, index) => (
                    <div key={index} className="flex items-center mb-2 gap-2">
                      <input
                        type="text"
                        value={change}
                        onChange={(e) => updateRequiredChange(index, e.target.value)}
                        className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm md:text-base"
                        placeholder="Required change..."
                        style={{ fontFamily: 'Poppins, sans-serif' }}
                      />
                      <button
                        onClick={() => removeRequiredChange(index)}
                        className="p-2 text-red-600 hover:text-red-800 text-xl flex-shrink-0"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={addRequiredChange}
                    className="text-xs md:text-sm text-indigo-600 hover:text-indigo-800 mb-4"
                  >
                    + Add Required Change
                  </button>

                  <button
                    onClick={() => handleAction(verification._id, 'reject', { 
                      rejectionReason, 
                      requiredChanges: requiredChanges.filter(c => c.trim()) 
                    })}
                    disabled={processingAction === verification._id || !rejectionReason.trim()}
                    className="w-full bg-red-600 hover:bg-red-700 text-white py-3 px-6 rounded-xl font-semibold transition-colors disabled:opacity-50 text-sm md:text-base"
                    style={{ fontFamily: 'Poppins, sans-serif' }}
                  >
                    {processingAction === verification._id ? 'Processing...' : 'Reject Verification'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-700">{error}</p>
        <button
          onClick={() => fetchVerifications(true)}
          className="mt-4 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-xl"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 px-4 md:px-0">
      {/* Header - Mobile Responsive */}
      <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl md:rounded-3xl p-6 md:p-8 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2" style={{ fontFamily: 'Jost, sans-serif' }}>
              Verification Management
            </h1>
            <p className="text-white/90 text-sm md:text-base" style={{ fontFamily: 'Poppins, sans-serif' }}>
              Review and verify travel partners' credentials
            </p>
          </div>
          <ShieldCheckIcon className="w-12 h-12 md:w-16 md:h-16 text-white/80" />
        </div>
      </div>

      {/* Stats Cards - Mobile Responsive Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 shadow-lg border border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center">
            <div className="bg-orange-100 p-2 md:p-3 rounded-lg md:rounded-xl mb-3 md:mb-0 w-fit">
              <ClockIcon className="w-5 h-5 md:w-6 md:h-6 text-orange-600" />
            </div>
            <div className="md:ml-4">
              <p className="text-xl md:text-2xl font-bold text-gray-900" style={{ fontFamily: 'Jost, sans-serif' }}>
                {stats.pendingCount}
              </p>
              <p className="text-xs md:text-sm text-gray-600">Pending Review</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 shadow-lg border border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center">
            <div className="bg-green-100 p-2 md:p-3 rounded-lg md:rounded-xl mb-3 md:mb-0 w-fit">
              <CheckCircleIcon className="w-5 h-5 md:w-6 md:h-6 text-green-600" />
            </div>
            <div className="md:ml-4">
              <p className="text-xl md:text-2xl font-bold text-gray-900" style={{ fontFamily: 'Jost, sans-serif' }}>
                {stats.approvedCount}
              </p>
              <p className="text-xs md:text-sm text-gray-600">Approved</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 shadow-lg border border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center">
            <div className="bg-red-100 p-2 md:p-3 rounded-lg md:rounded-xl mb-3 md:mb-0 w-fit">
              <XCircleIcon className="w-5 h-5 md:w-6 md:h-6 text-red-600" />
            </div>
            <div className="md:ml-4">
              <p className="text-xl md:text-2xl font-bold text-gray-900" style={{ fontFamily: 'Jost, sans-serif' }}>
                {stats.rejectedCount}
              </p>
              <p className="text-xs md:text-sm text-gray-600">Rejected</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 shadow-lg border border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center">
            <div className="bg-gray-100 p-2 md:p-3 rounded-lg md:rounded-xl mb-3 md:mb-0 w-fit">
              <BuildingOfficeIcon className="w-5 h-5 md:w-6 md:h-6 text-gray-600" />
            </div>
            <div className="md:ml-4">
              <p className="text-xl md:text-2xl font-bold text-gray-900" style={{ fontFamily: 'Jost, sans-serif' }}>
                {pagination?.totalVerifications || 0}
              </p>
              <p className="text-xs md:text-sm text-gray-600">Total Applications</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search - Mobile Responsive */}
      <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 shadow-lg border border-gray-100">
        <div className="flex flex-col space-y-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search verifications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-gray-100 border-0 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all duration-200 w-full text-sm md:text-base"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="bg-gray-100 border-0 rounded-xl py-2 px-3 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all duration-200 text-sm md:text-base"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="incomplete">Incomplete</option>
            </select>

            <select
              value={selectedGuideType}
              onChange={(e) => setSelectedGuideType(e.target.value)}
              className="bg-gray-100 border-0 rounded-xl py-2 px-3 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all duration-200 text-sm md:text-base"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              <option value="all">All Guide Types</option>
              <option value="single_certified">Certified Guide</option>
              <option value="single_uncertified">Uncertified Guide</option>
              <option value="company">Company</option>
            </select>

            <select
              value={selectedServiceType}
              onChange={(e) => setSelectedServiceType(e.target.value)}
              className="bg-gray-100 border-0 rounded-xl py-2 px-3 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all duration-200 text-sm md:text-base"
              style={{ fontFamily: 'Poppins, sans-serif' }}
            >
              <option value="all">All Services</option>
              <option value="tour_guide">Tour Guide</option>
              <option value="halal_restaurant">Halal Restaurant</option>
              <option value="transportation">Transportation</option>
              <option value="muslim_hotel">Muslim Hotel</option>
              <option value="other">Other</option>
            </select>

            <button className="flex items-center justify-center px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors text-sm md:text-base">
              <ArrowDownTrayIcon className="w-5 h-5 mr-2 text-gray-600" />
              <span className="font-medium text-gray-700" style={{ fontFamily: 'Poppins, sans-serif' }}>
                Export
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Verifications - Card View for Mobile, Table for Desktop */}
      <div className="bg-white rounded-xl md:rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Applicant
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Business
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Guide Type
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Service Type
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Test Score
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Status
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Submitted
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {verifications.map((verification) => (
                <tr key={verification._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mr-3">
                        <span className="text-white font-bold text-sm">
                          {verification.userId?.fullName?.split(' ').map(n => n[0]).join('') || 'U'}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                          {verification.userId?.fullName || 'Unknown User'}
                        </p>
                        <p className="text-sm text-gray-600">{verification.userId?.email}</p>
                        <p className="text-xs text-gray-500">{verification.city}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>
                      {verification.businessName}
                    </p>
                    <p className="text-sm text-gray-600">{verification.yearsOfExperience} years experience</p>
                  </td>
                  <td className="px-6 py-4">
                    {verification.guideType ? (
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getGuideTypeColor(verification.guideType)}`}>
                        {getGuideTypeIcon(verification.guideType)}
                        <span className="ml-1">{getGuideTypeLabel(verification.guideType)}</span>
                      </span>
                    ) : (
                      <span className="text-gray-400 text-sm">Legacy</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                      {getServiceTypeLabel(verification.serviceType)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <AcademicCapIcon className={`w-5 h-5 mr-2 ${verification.testResults?.passed ? 'text-green-600' : 'text-red-600'}`} />
                      <span className={`font-semibold ${verification.testResults?.passed ? 'text-green-600' : 'text-red-600'}`}>
                        {verification.testResults?.percentage || 0}%
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {verification.testResults?.passed ? 'Passed' : 'Failed'}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(verification.verificationStatus)}`}>
                      {getStatusIcon(verification.verificationStatus)}
                      <span className="ml-1 capitalize">{verification.verificationStatus}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {verification.submittedAt ? (
                      <>
                        <p className="text-sm text-gray-900">
                          {formatDate(verification.submittedAt)}
                        </p>
                        {formatTime(verification.submittedAt) && (
                          <p className="text-xs text-gray-500">
                            {formatTime(verification.submittedAt)}
                          </p>
                        )}
                      </>
                    ) : (
                      <span className="text-gray-400 text-sm">Not submitted</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => viewDetails(verification._id)}
                      className="flex items-center px-3 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg transition-colors"
                    >
                      <EyeIcon className="w-4 h-4 mr-1" />
                      <span className="text-sm font-medium">Review</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden divide-y divide-gray-200">
          {verifications.map((verification) => (
            <div key={verification._id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start space-x-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-sm">
                    {verification.userId?.fullName?.split(' ').map(n => n[0]).join('') || 'U'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate" style={{ fontFamily: 'Poppins, sans-serif' }}>
                    {verification.userId?.fullName || 'Unknown User'}
                  </p>
                  <p className="text-xs text-gray-600 truncate">{verification.userId?.email}</p>
                  <p className="text-xs text-gray-500">{verification.city}</p>
                </div>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border flex-shrink-0 ${getStatusColor(verification.verificationStatus)}`}>
                  {getStatusIcon(verification.verificationStatus)}
                  <span className="ml-1 capitalize">{verification.verificationStatus}</span>
                </span>
              </div>

              <div className="space-y-2 mb-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Business:</span>
                  <span className="font-semibold text-gray-900">{verification.businessName}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Experience:</span>
                  <span className="text-gray-900">{verification.yearsOfExperience} years</span>
                </div>
                {verification.guideType && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Guide Type:</span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getGuideTypeColor(verification.guideType)}`}>
                      {getGuideTypeIcon(verification.guideType)}
                      <span className="ml-1">{getGuideTypeLabel(verification.guideType)}</span>
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Service:</span>
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                    {getServiceTypeLabel(verification.serviceType)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Test Score:</span>
                  <div className="flex items-center">
                    <AcademicCapIcon className={`w-4 h-4 mr-1 ${verification.testResults?.passed ? 'text-green-600' : 'text-red-600'}`} />
                    <span className={`font-semibold ${verification.testResults?.passed ? 'text-green-600' : 'text-red-600'}`}>
                      {verification.testResults?.percentage || 0}%
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Submitted:</span>
                  <span className="text-gray-900 text-xs">{formatDate(verification.submittedAt)}</span>
                </div>
              </div>

              <button
                onClick={() => viewDetails(verification._id)}
                className="w-full flex items-center justify-center px-4 py-2 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg transition-colors"
              >
                <EyeIcon className="w-4 h-4 mr-2" />
                <span className="text-sm font-medium">Review Details</span>
              </button>
            </div>
          ))}
        </div>

        {verifications.length === 0 && (
          <div className="text-center py-12">
            <ShieldCheckIcon className="w-12 h-12 md:w-16 md:h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-sm md:text-base" style={{ fontFamily: 'Poppins, sans-serif' }}>
              No verifications found matching your criteria
            </p>
          </div>
        )}
      </div>

      {/* Verification Detail Modal */}
      {selectedVerification && (
        <VerificationModal
          verification={selectedVerification}
          onClose={() => setSelectedVerification(null)}
        />
      )}
    </div>
  );
};

export default VerificationManagement;