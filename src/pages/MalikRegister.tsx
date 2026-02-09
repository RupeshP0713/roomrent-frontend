/**
 * MalikRegister Component
 * 
 * Two-step registration process for landlords (Maliks):
 * Step 1: Enter WhatsApp number (searches for existing user)
 * Step 2: Enter name and address details
 * 
 * Features:
 * - Auto-login if user already exists
 * - Phone number validation
 * - Two-step form with progress indicator
 * - Language support (Hindi/English)
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dbService } from '../services/dbService';
import LoadingSpinner from '../components/LoadingSpinner';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';

export default function MalikRegister() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  // Form state management
  const [step, setStep] = useState<'phone' | 'details'>('phone'); // Current step in registration
  const [whatsapp, setWhatsapp] = useState(''); // WhatsApp number input
  const [formData, setFormData] = useState({
    name: '',
    whatsapp: '',
    address: '',
  });
  
  // UI state management
  const [loading, setLoading] = useState(false); // Registration in progress
  const [error, setError] = useState(''); // Error message display
  const [searchResult, setSearchResult] = useState<{ found: boolean; role?: string; user?: any } | null>(null); // Search result
  const [searching, setSearching] = useState(false); // Searching for existing user

  /**
   * Handle phone number search
   * Searches for existing user by WhatsApp number
   * Auto-logs in if user exists, otherwise proceeds to registration
   */
  const handlePhoneSearch = async () => {
    // Clean phone number (remove non-digits)
    const cleanNumber = whatsapp.replace(/\D/g, '');
    if (cleanNumber.length !== 10) {
      setError('Please enter a valid 10-digit WhatsApp number');
      return;
    }

    setError('');
    setSearching(true);
    try {
      const result = await dbService.searchUser(cleanNumber);
      
      if (result.found && result.user) {
        // User found - check if it's a Malik
        if (result.role === 'Malik' && result.user.id) {
          // Auto-login and redirect to dashboard
          navigate(`/malik/dashboard/${result.user.id}`);
          return;
        } else {
          // User found but wrong role
          setError('This number is registered as a different role. Please use the correct registration page.');
        }
      } else {
        // New user - set WhatsApp number and proceed to registration
        setFormData(prev => ({
          ...prev,
          whatsapp: cleanNumber,
        }));
        // Move to next step (details form)
        setStep('details');
      }
    } catch (error) {
      console.error('Search failed:', error);
      setError('Search failed. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await dbService.registerMalik(formData);
      if (result.success && result.malik) {
        navigate(`/malik/dashboard/${result.malik.id}`);
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-200">
          <div className="text-center mb-8">
            <div className="flex justify-end mb-4">
              <LanguageSwitcher />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('makanMalikRegistration')}</h1>
            <p className="text-gray-600">{t('registerAsLandlord')}</p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                step === 'phone' ? 'bg-green-600 text-white' : 'bg-green-100 text-green-600'
              }`}>
                1
              </div>
              <div className="w-12 h-1 bg-gray-200 rounded"></div>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                step === 'details' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-400'
              }`}>
                2
              </div>
            </div>
          </div>

          {step === 'phone' ? (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('whatsappNumber10Digits')}
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={whatsapp}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setWhatsapp(value);
                      setError('');
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition text-lg text-center"
                    placeholder="Enter WhatsApp number"
                    maxLength={10}
                    autoFocus
                  />
                  {searching && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <LoadingSpinner size="sm" />
                    </div>
                  )}
                </div>
                <p className="mt-2 text-sm text-gray-500">{t('checkExistingAccount')}</p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
                  {error}
                </div>
              )}

              <button
                onClick={handlePhoneSearch}
                disabled={searching || whatsapp.length !== 10}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-xl font-semibold hover:from-green-700 hover:to-green-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {searching ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span>Searching...</span>
                  </>
                ) : (
                  t('continue')
                )}
              </button>

              <button
                onClick={() => navigate('/')}
                className="w-full text-gray-600 hover:text-gray-900 transition"
              >
                {t('backToRoleSelection')}
              </button>
            </div>
          ) : (
            <div>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('whatsappNumber')}
                  </label>
                  <input
                    type="tel"
                    value={formData.whatsapp}
                    disabled
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('name')}
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                    placeholder={t('enterName')}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('address')}
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                    placeholder={t('enterAddress')}
                    rows={3}
                    required
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
                    {error}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('phone');
                      setError('');
                    }}
                    className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-300 transition"
                  >
                    ← {t('back')}
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-xl font-semibold hover:from-green-700 hover:to-green-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <LoadingSpinner size="sm" />
                        <span>{t('registering')}</span>
                      </>
                    ) : (
                      t('register')
                    )}
                  </button>
                </div>
              </form>

              <button
                onClick={() => navigate('/')}
                className="mt-4 w-full text-gray-600 hover:text-gray-900 transition"
              >
                {t('backToRoleSelection')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

