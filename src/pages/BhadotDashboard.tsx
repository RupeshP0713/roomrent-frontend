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
import LoadingSpinner from '../components/LoadingSpinner';
import BhadotProfileModal from '../components/BhadotProfileModal';
import { dbService } from '../services/dbService';
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

  useEffect(() => {
    if (id) {
      loadData();
      const interval = setInterval(loadAvailableRooms, 5000);
      return () => clearInterval(interval);
    }
  }, [id]);

  /**
   * Load Bhadot profile and rental requests
   * Checks if profile needs completion (cast/family members)
   */
  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      // Fetch Bhadot data and requests in parallel
      const [bhadotData, requestsData] = await Promise.all([
        dbService.getBhadot(id),
        dbService.getBhadotRequests(id),
      ]);
      
      setBhadot(bhadotData);
      setRequests(requestsData);
      
      // Check if profile is incomplete (for existing users who registered before this feature)
      // Show modal if cast or family members info is missing
      if (bhadotData && (!bhadotData.cast || !bhadotData.totalFamilyMembers || bhadotData.totalFamilyMembers === 0)) {
        setShowProfileModal(true);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
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
      const result = await dbService.getAvailableRoomsCount();
      setAvailableRooms(result.count);
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
      await dbService.updateRequestStatus(requestId, status);
      await loadData(); // Reload to show updated status
      alert(`Request ${status.toLowerCase()} successfully!`);
    } catch (error: any) {
      alert(error.message || 'Failed to update request');
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
      await dbService.updateBhadot(id, {
        name: bhadot?.name || '',
        mobile: bhadot?.mobile || '',
        cast: data.cast,
        totalFamilyMembers: data.totalFamilyMembers
      });
      await loadData(); // Reload to refresh profile data
      setShowProfileModal(false); // Close modal after successful submission
    } catch (error: any) {
      throw new Error(error.message || 'Failed to save profile');
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
      {showProfileModal && bhadot && (
        <BhadotProfileModal
          bhadotName={bhadot.name}
          onSubmit={handleProfileSubmit}
        />
      )}
      <Header title={`${t('roomBhadot')} - ${bhadot.name}`} showLanguageSwitcher={true} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Card */}
        <div className="bg-white rounded-3xl shadow-lg p-6 mb-6 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('welcome')}, {bhadot.name}!</h2>
          <p className="text-gray-600">{t('manageRentalRequests')}</p>
        </div>

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
    </div>
  );
}

