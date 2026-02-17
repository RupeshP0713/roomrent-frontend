/**
 * BhadotDashboard Component
 * 
 * Main dashboard for tenants (Bhadots) to:
 * - View available rooms count (live DB inventory)
 * - See incoming rental offers from landlords
 * - Accept or reject rental requests
 * - View secured contacts (accepted requests) with call/WhatsApp options
 * - Complete profile if missing cast/family members info
 * 
 * Features:
 * - Real-time room count updates (every 5 seconds)
 * - Request management (accept/reject)
 * - Profile completion modal for first-time users
 * - Masked contact information for privacy
 */
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../components/Header';
import ChatWidget from '../components/ChatWidget';
import LoadingSpinner from '../components/LoadingSpinner';
import Toast from '../components/Toast';
import BhadotProfileModal from '../components/BhadotProfileModal';
import { bhadotApi } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';
import type { Bhadot, RentRequestWithDetails } from '../types';

export default function BhadotDashboard() {
  // Get Bhadot ID from URL parameters
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();

  // State Management
  const [bhadot, setBhadot] = useState<Bhadot | null>(null); // Current Bhadot user data
  const [availableRooms, setAvailableRooms] = useState(0); // Live count of available rooms
  const [requests, setRequests] = useState<RentRequestWithDetails[]>([]); // All rental requests
  const [loading, setLoading] = useState(true); // Loading state
  const [updatingRequest, setUpdatingRequest] = useState<string | null>(null); // Currently updating this request ID
  const [showProfileModal, setShowProfileModal] = useState(false); // Show profile completion modal
  const [togglingActive, setTogglingActive] = useState(false); // Bhadot active/inactive toggle state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null); // Toast notification state
  const [countdown, setCountdown] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null); // Countdown timer state

  useEffect(() => {
    if (id) {
      loadData();
      const interval = setInterval(loadAvailableRooms, 5000);
      return () => clearInterval(interval);
    }
  }, [id]);

  // Calculate countdown timer from oldest accepted request
  useEffect(() => {
    const acceptedRequests = requests.filter(req => req.status === 'Accepted');
    if (acceptedRequests.length === 0) {
      setCountdown(null);
      return;
    }

    // Find the oldest accepted request
    const oldestAccepted = acceptedRequests.reduce((oldest, current) => {
      const oldestTime = new Date(oldest.timestamp).getTime();
      const currentTime = new Date(current.timestamp).getTime();
      return currentTime < oldestTime ? current : oldest;
    });

    const updateCountdown = () => {
      const acceptedTime = new Date(oldestAccepted.timestamp).getTime();
      const fiveDaysLater = acceptedTime + (5 * 24 * 60 * 60 * 1000); // 5 days in milliseconds
      const now = new Date().getTime();
      const diff = fiveDaysLater - now;

      if (diff <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setCountdown({ days, hours, minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [requests]);

  /**
   * Load Bhadot profile and rental requests
   * Checks if profile needs completion (cast/family members)
   */
  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      // Fetch Bhadot data and requests in parallel
      const [bhadotRes, requestsRes] = await Promise.all([
        bhadotApi.getById(id),
        bhadotApi.getRequests(id),
      ]);

      setBhadot(bhadotRes.data);
      setRequests(requestsRes.data);

      // Check if profile is incomplete (for existing users who registered before this feature)
      // Show modal if cast or family members info is missing
      const bhadotData = bhadotRes.data;
      if (bhadotData && (!bhadotData.cast || !bhadotData.totalFamilyMembers || bhadotData.totalFamilyMembers === 0)) {
        setShowProfileModal(true);
      }
    } catch (error: any) {
      console.error('Failed to load data:', error);
      if (error.status === 401 || error.response?.status === 401) {
        navigate('/bhadot/register');
      }
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load available rooms count from database
   * This is called every 5 seconds for live updates
   */
  const loadAvailableRooms = async () => {
    try {
      const response = await bhadotApi.getAvailableRooms();
      setAvailableRooms(response.data.count);
    } catch (error) {
      console.error('Failed to load available rooms:', error);
    }
  };

  useEffect(() => {
    loadAvailableRooms();
  }, []);

  /**
   * Handle accepting or rejecting a rental request
   * @param requestId - The ID of the request to update
   * @param status - Either 'Accepted' or 'Rejected'
   */
  const handleUpdateRequest = async (requestId: string, status: 'Accepted' | 'Rejected') => {
    setUpdatingRequest(requestId);
    try {
      await bhadotApi.updateRequestStatus(requestId, status);
      await loadData(); // Reload to show updated status
      setToast({
        message: `Request ${status.toLowerCase()} successfully!`,
        type: 'success'
      });
    } catch (error: any) {
      setToast({
        message: error.message || 'Failed to update request',
        type: 'error'
      });
    } finally {
      setUpdatingRequest(null);
    }
  };

  /**
   * Mask mobile/WhatsApp number for privacy
   * Shows only first 3 digits, rest are masked
   * @param mobile - The mobile number to mask
   * @returns Masked mobile number (e.g., "954-xxxxxxxxxxx")
   */
  const maskMobileNumber = (mobile: string) => {
    if (!mobile || mobile.length < 3) return mobile;
    const firstThree = mobile.substring(0, 3);
    return `${firstThree}-xxxxxxxxxxx`;
  };

  /**
   * Handle profile completion submission
   * Updates Bhadot profile with cast and family members info
   * @param data - Object containing cast and totalFamilyMembers
   */
  const handleProfileSubmit = async (data: { cast: string; totalFamilyMembers: number }) => {
    if (!id) return;
    try {
      await bhadotApi.update(id, {
        name: bhadot?.name || '',
        mobile: bhadot?.mobile || '',
        cast: data.cast,
        totalFamilyMembers: data.totalFamilyMembers
        // Note: update requires all fields or just partial?
        // In api.ts it calls getById then update. logic should be robust.
      });
      await loadData(); // Reload to refresh profile data
      setShowProfileModal(false); // Close modal after successful submission
    } catch (error: any) {
      throw new Error(error.message || 'Failed to save profile');
    }
  };

  /**
   * Toggle Bhadot active/inactive status
   * When inactive, this Bhadot will not be visible to any Malik and all active requests are rejected
   */
  const handleToggleActive = async () => {
    if (!id || !bhadot) return;
    // Treat undefined as active by default, then flip
    const currentActive = bhadot.isActive !== false;
    const nextActive = !currentActive;
    setTogglingActive(true);
    try {
      const response = await bhadotApi.toggleActive(id, nextActive);
      const updatedBhadot = response.data.bhadot;
      setBhadot(updatedBhadot);
      await loadData();
      if (!updatedBhadot.isActive) {
        setToast({
          message: 'Your profile is now inactive. Landlords will not see you and existing requests have been rejected.',
          type: 'info'
        });
      } else {
        setToast({
          message: 'Your profile is now active. Landlords can see your details.',
          type: 'success'
        });
      }
    } catch (error: any) {
      setToast({
        message: error.message || 'Failed to update profile status',
        type: 'error'
      });
    } finally {
      setTogglingActive(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!bhadot) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Bhadot not found</p>
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
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      {showProfileModal && bhadot && (
        <BhadotProfileModal
          bhadotName={bhadot.name}
          onSubmit={handleProfileSubmit}
        />
      )}
      <Header
        title={`${t('roomBhadot')} - ${bhadot.name}`}
        showLanguageSwitcher={true}
        onLogout={() => {
          localStorage.removeItem('token');
          navigate('/');
        }}
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Card */}
        <div className="bg-white rounded-3xl shadow-lg p-6 mb-6 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('welcome')}, {bhadot.name}!</h2>
          <p className="text-gray-600 mb-4">{t('manageRentalRequests')}</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="text-sm font-semibold text-gray-700">
                {t('bhadotProfileStatusLabel')}:
              </div>
              <button
                type="button"
                onClick={handleToggleActive}
                disabled={togglingActive}
                className="flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="relative w-20 h-9 rounded-full bg-gray-300 flex items-center px-1">
                  <div
                    className={`absolute top-1 left-1 w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-md transition-transform duration-200 ${bhadot.isActive === false
                      ? 'bg-red-500 translate-x-0'
                      : 'bg-green-500 translate-x-10'
                      }`}
                  >
                    {bhadot.isActive === false ? 'OFF' : 'ON'}
                  </div>
                </div>
                <span className="text-sm font-medium text-gray-800">
                  {bhadot.isActive === false ? t('bhadotStatusInactive') : t('bhadotStatusActive')}
                </span>
              </button>
            </div>
            <p className="text-xs text-gray-500">
              {t('bhadotStatusHint')}
            </p>
          </div>
        </div>

        {/* 5-Day Countdown Warning - Only show if there's an accepted request */}
        {countdown !== null && requests.some(req => req.status === 'Accepted') && (
          <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-3xl shadow-lg p-6 mb-6 text-white">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <h3 className="text-xl font-bold">{t('accountInactiveWarning')}</h3>
                </div>
                <p className="text-sm opacity-90 mb-4">{t('accountInactiveMessage')}</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-6 py-4 border-2 border-white/30">
                <div className="text-center">
                  <div className="text-4xl font-bold mb-2 flex items-center justify-center gap-2">
                    {countdown.days > 0 && (
                      <span className="bg-white/30 rounded-lg px-3 py-1">
                        <span className="text-2xl">{String(countdown.days).padStart(2, '0')}</span>
                        <span className="text-lg ml-1">d</span>
                      </span>
                    )}
                    <span className="bg-white/30 rounded-lg px-3 py-1">
                      <span className="text-2xl">{String(countdown.hours).padStart(2, '0')}</span>
                      <span className="text-lg ml-1">h</span>
                    </span>
                    <span className="bg-white/30 rounded-lg px-3 py-1">
                      <span className="text-2xl">{String(countdown.minutes).padStart(2, '0')}</span>
                      <span className="text-lg ml-1">m</span>
                    </span>
                    <span className={`bg-white/30 rounded-lg px-3 py-1 ${countdown.seconds < 60 && countdown.days === 0 && countdown.hours === 0 && countdown.minutes === 0 ? 'animate-pulse' : ''}`}>
                      <span className="text-2xl">{String(countdown.seconds).padStart(2, '0')}</span>
                      <span className="text-lg ml-1">s</span>
                    </span>
                  </div>
                  <div className="text-xs font-semibold uppercase tracking-wider opacity-90 mt-2">Time Remaining</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Available Rooms Counter - LIVE DB INVENTORY */}
        <div className="bg-green-600 rounded-3xl shadow-lg p-8 mb-6 text-white">
          <div className="text-center">
            <div className="text-sm font-semibold uppercase tracking-wider mb-4">{t('liveDbInventory')}</div>
            <div className="text-8xl font-bold mb-4">{availableRooms}</div>
            <div className="bg-green-500 rounded-2xl px-6 py-3 inline-block">
              <div className="text-lg font-semibold uppercase">{bhadot.name}</div>
            </div>
          </div>
        </div>

        {/* Incoming Offers */}
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-700 uppercase mb-4">{t('incomingOffers')}</h3>
          <div className="space-y-4">
            {requests.length === 0 ? (
              <div className="bg-white rounded-2xl border-2 border-blue-200 p-6 text-center">
                <p className="text-gray-600">{t('noRentalRequests')}</p>
              </div>
            ) : (
              requests.filter(req => req.status === 'Pending').map((request) => (
                <div
                  key={request.id}
                  className="bg-white rounded-2xl border-2 border-blue-200 p-6"
                >
                  <p className="text-gray-700 mb-4">
                    {t('ownerWantsContact')} <span className="font-bold">{request.malikName}</span> {t('wantsContactRoom')}
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleUpdateRequest(request.id, 'Accepted')}
                      disabled={updatingRequest === request.id}
                      className="flex-1 bg-green-600 text-white rounded-xl py-3 font-bold uppercase hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {updatingRequest === request.id ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        t('accept')
                      )}
                    </button>
                    <button
                      onClick={() => handleUpdateRequest(request.id, 'Rejected')}
                      disabled={updatingRequest === request.id}
                      className="flex-1 bg-gray-200 text-gray-700 border-2 border-gray-300 rounded-xl py-3 font-bold uppercase hover:bg-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {t('reject')}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Secured Contacts - Show Accepted Requests */}
        {requests.filter(req => req.status === 'Accepted').length > 0 && (
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-700 uppercase mb-4">{t('securedContacts')}</h3>
            <div className="space-y-4">
              {requests.filter(req => req.status === 'Accepted').map((request) => (
                <div
                  key={request.id}
                  className="bg-white rounded-2xl shadow-md border-l-4 border-green-600 p-6 relative"
                >
                  <div className="mb-4">
                    <h4 className="font-bold text-gray-900 text-xl mb-2">{request.malikName}</h4>
                    <p className="text-gray-500 text-sm font-mono">
                      {request.malikWhatsapp ? maskMobileNumber(request.malikWhatsapp.replace(/\D/g, '')) : (request.malikId || 'N/A')}
                    </p>
                  </div>
                  {request.malikWhatsapp && (
                    <div className="flex gap-3">
                      <a
                        href={`tel:${request.malikWhatsapp.replace(/\D/g, '')}`}
                        className="flex-1 bg-blue-100 text-blue-700 rounded-xl py-3 font-bold uppercase text-center hover:bg-blue-200 transition"
                      >
                        {t('call')}
                      </a>
                      <a
                        href={`https://wa.me/${request.malikWhatsapp.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 bg-green-600 text-white rounded-xl py-3 font-bold uppercase text-center hover:bg-green-700 transition"
                      >
                        {t('wa')}
                      </a>
                    </div>
                  )}
                </div>
              ))}
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
      <ChatWidget userId={id!} role="Bhadot" />
    </div>
  );
}
