/**
 * MalikDashboard Component
 * 
 * Main dashboard for landlords (Maliks) to:
 * - View and edit their address
 * - See all available tenants (Bhadots)
 * - Send rental requests to tenants
 * - Track pending/accepted/rejected requests
 * - Monitor request limit (max 2 pending, 24-hour cooldown)
 * 
 * Features:
 * - Real-time countdown timer for request limit
 * - Visual progress indicators
 * - Request status tracking
 * - Address editing functionality
 */
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../components/Header';
import LoadingSpinner from '../components/LoadingSpinner';
import { dbService } from '../services/dbService';
import { useLanguage } from '../contexts/LanguageContext';
import type { Malik, Bhadot, RentRequestWithDetails } from '../types';

export default function MalikDashboard() {
  // Get Malik ID from URL parameters
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  // State Management
  const [malik, setMalik] = useState<Malik | null>(null); // Current Malik user data
  const [bhadots, setBhadots] = useState<Bhadot[]>([]); // List of all available tenants
  const [requests, setRequests] = useState<RentRequestWithDetails[]>([]); // All rental requests
  const [loading, setLoading] = useState(true); // Loading state
  
  // Request sending states
  const [sendingRequest, setSendingRequest] = useState<string | null>(null); // Currently sending request to this Bhadot ID
  
  // Address editing states
  const [editingAddress, setEditingAddress] = useState(false); // Whether address is being edited
  const [addressValue, setAddressValue] = useState(''); // Temporary address value during editing
  const [savingAddress, setSavingAddress] = useState(false); // Saving address state
  
  // Request limit management
  const [pendingCount, setPendingCount] = useState(0); // Number of active pending requests (within 24h)
  const [canSendMore, setCanSendMore] = useState(true); // Whether more requests can be sent
  const [nextAvailableTime, setNextAvailableTime] = useState<Date | null>(null); // When next request can be sent
  const [timeRemaining, setTimeRemaining] = useState<string>(''); // Countdown timer display
  const [activeTab, setActiveTab] = useState<'tenants' | 'requests'>('tenants'); // Tab state

  // Load data when component mounts or ID changes
  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  // Update countdown timer every second when limit is reached
  useEffect(() => {
    const updateTimer = () => {
      if (nextAvailableTime && !canSendMore) {
        const now = new Date();
        const diff = nextAvailableTime.getTime() - now.getTime();
        
        if (diff > 0) {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          
          if (hours > 0) {
            setTimeRemaining(`${hours}h ${minutes}m`);
          } else if (minutes > 0) {
            setTimeRemaining(`${minutes}m ${seconds}s`);
          } else {
            setTimeRemaining(`${seconds}s`);
          }
        } else {
          setTimeRemaining('');
          loadData(); // Reload to check if we can send more
        }
      } else {
        setTimeRemaining('');
      }
    };
    
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [nextAvailableTime, canSendMore]);

  useEffect(() => {
    if (malik) {
      setAddressValue(malik.address);
    }
  }, [malik]);

  /**
   * Load all dashboard data
   * Fetches Malik profile, all Bhadots, and rental requests
   * Calculates request limit status and countdown timer
   */
  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      // Fetch all data in parallel for better performance
      const [malikData, bhadotsData, requestsData] = await Promise.all([
        dbService.getMalik(id),
        dbService.getMalikBhadots(id),
        dbService.getMalikRequests(id),
      ]);
      
      setMalik(malikData);
      setBhadots(bhadotsData);
      setRequests(requestsData);
      
      // Calculate active pending requests (within 24 hours)
      // Only requests sent in the last 24 hours count towards the limit
      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const activePending = requestsData.filter(req => {
        if (req.status !== 'Pending') return false;
        const requestTime = new Date(req.timestamp);
        return requestTime > twentyFourHoursAgo;
      });
      
      // Find oldest pending request to calculate next available time
      // This helps show when the user can send more requests
      const allPending = requestsData.filter(req => req.status === 'Pending');
      if (allPending.length > 0) {
        // Sort by timestamp to find the oldest request
        const sortedPending = [...allPending].sort((a, b) => 
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
        const oldestRequest = sortedPending[0];
        const oldestRequestTime = new Date(oldestRequest.timestamp);
        // Next request can be sent 24 hours after the oldest pending request
        const nextAvailable = new Date(oldestRequestTime.getTime() + 24 * 60 * 60 * 1000);
        setNextAvailableTime(nextAvailable);
      } else {
        setNextAvailableTime(null);
      }
      
      // Update request limit status
      setPendingCount(activePending.length);
      setCanSendMore(activePending.length < 2); // Max 2 pending requests allowed
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle sending a rental request to a specific tenant
   * @param bhadotId - The ID of the tenant (Bhadot) to send request to
   */
  const handleSendRequest = async (bhadotId: string) => {
    if (!id) return;
    
    // Check if request limit has been reached
    if (!canSendMore) {
      alert('Maximum 2 pending requests allowed. Please wait 24 hours after your oldest pending request to send more.');
      return;
    }
    
    setSendingRequest(bhadotId);
    try {
      await dbService.sendRentalRequest(id, bhadotId);
      await loadData(); // Reload data to update request count
      alert('Rental request sent successfully!');
    } catch (error: any) {
      alert(error.message || 'Failed to send request');
    } finally {
      setSendingRequest(null);
    }
  };

  // Removed handleSendToAll function as it's not used in the UI

  const handleSaveAddress = async () => {
    if (!id) return;
    setSavingAddress(true);
    try {
      const result = await dbService.updateMalikAddress(id, addressValue);
      if (result.success) {
        setMalik(result.malik);
        setEditingAddress(false);
        alert('Address updated successfully!');
      }
    } catch (error: any) {
      alert(error.message || 'Failed to update address');
    } finally {
      setSavingAddress(false);
    }
  };

  const handleCancelEdit = () => {
    if (malik) {
      setAddressValue(malik.address);
    }
    setEditingAddress(false);
  };

  /**
   * Mask mobile number for privacy
   * Shows only first 3 digits, rest are masked
   * @param mobile - The mobile number to mask
   * @returns Masked mobile number (e.g., "954-xxxxxxxxxxx")
   */
  const maskMobileNumber = (mobile: string) => {
    if (!mobile || mobile.length < 3) return mobile;
    const firstThree = mobile.substring(0, 3);
    return `${firstThree}-xxxxxxxxxxx`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!malik) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Malik not found</p>
          <button
            onClick={() => navigate('/')}
            className="text-blue-600 hover:text-blue-800"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        title={`${t('makanMalik')} - ${malik.name}`}
        showLanguageSwitcher={true}
        onLogout={() => navigate('/')}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Card */}
        <div className="bg-white rounded-3xl shadow-lg p-6 mb-6 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('welcome')}, {malik.name}!</h2>
          <p className="text-gray-600 mb-6">{t('searchAvailableTenants')}</p>
          
          {/* Address Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                {t('address')}
              </label>
              {!editingAddress && (
                <button
                  onClick={() => setEditingAddress(true)}
                  className="text-green-600 hover:text-green-800 font-medium text-sm"
                >
                  {t('edit')}
                </button>
              )}
            </div>
            {editingAddress ? (
              <div className="space-y-3">
                <textarea
                  value={addressValue}
                  onChange={(e) => setAddressValue(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                    placeholder={t('enterAddress')}
                  rows={3}
                />
                <div className="flex gap-3">
                  <button
                    onClick={handleSaveAddress}
                    disabled={savingAddress}
                    className="px-4 py-2 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {savingAddress ? (
                      <>
                        <LoadingSpinner size="sm" />
                        <span>{t('saving')}</span>
                      </>
                    ) : (
                      t('save')
                    )}
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    disabled={savingAddress}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition disabled:opacity-50"
                  >
                    {t('cancel')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-700">
                {malik.address || 'No address set'}
              </div>
            )}
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="bg-white rounded-3xl shadow-lg p-2 mb-6 border border-gray-200">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('tenants')}
              className={`flex-1 py-3 px-6 rounded-2xl font-semibold transition-all duration-300 ${
                activeTab === 'tenants'
                  ? 'bg-green-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {t('allTenants')} ({bhadots.length})
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`flex-1 py-3 px-6 rounded-2xl font-semibold transition-all duration-300 ${
                activeTab === 'requests'
                  ? 'bg-green-600 text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {t('myRentalRequests')} ({requests.length})
            </button>
          </div>
        </div>

        {/* All Tenants Tab Content */}
        {activeTab === 'tenants' && (
        <div className="bg-white rounded-3xl shadow-lg p-6 mb-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900">{t('allTenants')} ({bhadots.length})</h3>
              
              {/* Request Limit Status Card */}
              <div className={`mt-3 rounded-2xl p-4 border-2 ${
                canSendMore 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-300'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                      canSendMore 
                        ? 'bg-green-500 text-white' 
                        : 'bg-red-500 text-white'
                    }`}>
                      {pendingCount}/2
                    </div>
                    <div>
                      <p className={`font-semibold ${
                        canSendMore ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {t('pendingRequests')}
                      </p>
                      {!canSendMore && (
                        <p className="text-sm text-red-700 mt-1">
                          {t('limitReached')}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {!canSendMore && nextAvailableTime && timeRemaining && (
                    <div className="text-right">
                      <p className="text-xs text-red-600 font-medium mb-1">{t('nextRequestAvailable')}</p>
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-red-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-lg font-bold text-red-700">{timeRemaining}</span>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Progress Bar */}
                <div className="mt-3">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className={`h-2.5 rounded-full transition-all duration-500 ${
                        canSendMore ? 'bg-green-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${(pendingCount / 2) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    {canSendMore 
                      ? (() => {
                          const remaining = 2 - pendingCount;
                          if (remaining === 1) {
                            return t('canSendMoreRequests').replace('{count}', '1');
                          }
                          return t('canSendMoreRequests').replace('{count}', String(remaining));
                        })()
                      : t('waitFor24Hours')
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            {bhadots.length === 0 ? (
              <p className="text-gray-600 text-center py-8">{t('noTenantsFound')}</p>
            ) : (
              bhadots.map((bhadot) => {
                const hasPendingRequest = requests.some(
                  req => req.bhadotId === bhadot.id && req.status === 'Pending'
                );
                return (
                  <div
                    key={bhadot.id}
                    className="border border-gray-200 rounded-2xl p-4 hover:shadow-md transition"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900 text-lg">{bhadot.name}</h4>
                        <p className="text-gray-600 mt-1">{t('mobile')}: {maskMobileNumber(bhadot.mobile)}</p>
                        {bhadot.area && (
                          <p className="text-gray-600">Area: {bhadot.area}</p>
                        )}
                        {bhadot.cast && (
                          <p className="text-gray-600">
                            {t('cast')}: {bhadot.cast}
                          </p>
                        )}
                        {typeof bhadot.totalFamilyMembers === 'number' && bhadot.totalFamilyMembers > 0 && (
                          <p className="text-gray-600">
                            {t('totalFamilyMembers')}: {bhadot.totalFamilyMembers}
                          </p>
                        )}
                        <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-medium ${
                          bhadot.status === 'Approved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {t(bhadot.status.toLowerCase())}
                        </span>
                      </div>
                      <div className="ml-4 flex flex-col items-end gap-2">
                        <button
                          onClick={() => handleSendRequest(bhadot.id)}
                          disabled={hasPendingRequest || sendingRequest === bhadot.id || !canSendMore}
                          className={`px-6 py-2 rounded-xl font-semibold transition ${
                            hasPendingRequest || !canSendMore
                              ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                              : 'bg-green-600 text-white hover:bg-green-700'
                          }`}
                        >
                          {sendingRequest === bhadot.id ? (
                            <LoadingSpinner size="sm" />
                          ) : hasPendingRequest ? (
                            <span className="flex items-center gap-2">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              {t('requestSent')}
                            </span>
                          ) : !canSendMore ? (
                            <span className="flex items-center gap-2">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                              {t('limitReachedBtn')}
                            </span>
                          ) : (
                            <span className="flex items-center gap-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                              {t('sendRequest')}
                            </span>
                          )}
                        </button>
                        {!canSendMore && !hasPendingRequest && (
                          <p className="text-xs text-red-600 text-right max-w-[120px]">
                            {timeRemaining && `${t('availableIn')} ${timeRemaining}`}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
        )}

        {/* My Rental Requests Tab Content */}
        {activeTab === 'requests' && (
        <div className="bg-white rounded-3xl shadow-lg p-6 border border-gray-200">
          <h3 className="text-xl font-bold text-gray-900 mb-4">{t('myRentalRequests')}</h3>
          <div className="space-y-4">
            {requests.length === 0 ? (
              <p className="text-gray-600 text-center py-8">{t('noRequestsSent')}</p>
            ) : (
              requests.map((request) => (
                <div
                  key={request.id}
                  className="border border-gray-200 rounded-2xl p-4 hover:shadow-md transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 text-lg">{request.bhadotName}</h4>
                      <p className="text-gray-600 mt-1">{t('mobile')}: {maskMobileNumber(request.bhadotMobile || '')}</p>
                      {request.bhadotArea && (
                        <p className="text-gray-600">Area: {request.bhadotArea}</p>
                      )}
                      {request.bhadotCast && (
                        <p className="text-gray-600">
                          {t('cast')}: {request.bhadotCast}
                        </p>
                      )}
                      {typeof request.bhadotTotalFamilyMembers === 'number' && request.bhadotTotalFamilyMembers > 0 && (
                        <p className="text-gray-600">
                          {t('totalFamilyMembers')}: {request.bhadotTotalFamilyMembers}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(request.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                      request.status === 'Accepted' ? 'bg-green-100 text-green-800' :
                      request.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {t(request.status.toLowerCase())}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        )}

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-gray-600 hover:text-gray-900 transition"
          >
            {t('backToRoleSelection')}
          </button>
        </div>
      </div>
    </div>
  );
}

