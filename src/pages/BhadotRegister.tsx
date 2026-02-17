/**
 * BhadotRegister Component
 * 
 * Two-step registration process for tenants (Bhadots):
 * Step 1: Enter mobile number (searches for existing user)
 * Step 2: Enter name, cast, and family members details
 * 
 * Features:
 * - Login if user already exists
 * - Phone number validation
 * - Cast selection with "Other" option
 * - Family members count validation
 * - Two-step form with progress indicator
 * - Language support (Hindi/English)
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { bhadotApi, searchApi } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';

export default function BhadotRegister() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  // Form state management
  const [step, setStep] = useState<'phone' | 'details'>('phone'); // Current step in registration
  const [mobile, setMobile] = useState(''); // Mobile number input
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    cast: '',
    customCast: '', // Custom cast when "Other" is selected
    totalFamilyMembers: '',
  });

  // UI state management
  const [loading, setLoading] = useState(false); // Registration in progress
  const [error, setError] = useState(''); // Error message display
  const [searching, setSearching] = useState(false); // Searching for existing user

  /**
   * Handle phone number search
   * Searches for existing user by mobile number
   * Logs in if user exists, otherwise proceeds to registration
   */
  const handlePhoneSearch = async () => {
    // Clean phone number (remove non-digits)
    const cleanNumber = mobile.replace(/\D/g, '');
    if (cleanNumber.length !== 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    setError('');
    setSearching(true);
    try {
      const response = await searchApi.searchUser(cleanNumber);
      const result = response.data;

      if (result.found && result.user) {
        // User found - check if it's a Bhadot
        if (result.role === 'Bhadot' && result.user.id) {
          setFormData(prev => ({ ...prev, mobile: cleanNumber }));
          // Auto-login since password is not required
          await performAutoLogin(cleanNumber);
        } else {
          // User found but wrong role
          setError('This number is registered as a different role. Please use the correct registration page.');
        }
      } else {
        // New user - set mobile number and proceed to registration
        setFormData(prev => ({
          ...prev,
          mobile: cleanNumber,
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

  const performAutoLogin = async (mobileNumber: string) => {
    setLoading(true);
    try {
      const response = await bhadotApi.login({ mobile: mobileNumber });
      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        navigate(`/bhadot/dashboard/${response.data.bhadot.id}`);
      }
    } catch (err: any) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle form submission
   * Validates all fields and registers new Bhadot
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Form validation
    if (!formData.cast) {
      setError('Please select your cast');
      return;
    }

    // If "Other" cast is selected, require custom cast input
    if (formData.cast === 'Other' && !formData.customCast.trim()) {
      setError('Please enter your cast');
      return;
    }

    // Validate family members count (minimum 1)
    if (!formData.totalFamilyMembers || parseInt(formData.totalFamilyMembers) < 1) {
      setError('Please enter total family members (minimum 1)');
      return;
    }

    setLoading(true);

    try {
      // Use custom cast if "Other" is selected, otherwise use selected cast
      const finalCast = formData.cast === 'Other' ? formData.customCast.trim() : formData.cast;

      // Register new Bhadot with all details
      const response = await bhadotApi.register({
        name: formData.name,
        mobile: formData.mobile,
        cast: finalCast,
        totalFamilyMembers: parseInt(formData.totalFamilyMembers)
      });

      // Redirect to dashboard on successful registration
      if (response.data.success && response.data.bhadot) {
        localStorage.setItem('token', response.data.token);
        navigate(`/bhadot/dashboard/${response.data.bhadot.id}`);
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('roomBhadotRegistration')}</h1>
            <p className="text-gray-600">{t('registerAsTenant')}</p>
          </div>

          {step === 'phone' && (
            <form onSubmit={(e) => { e.preventDefault(); handlePhoneSearch(); }} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('mobileNumber10Digits')}
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={mobile}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setMobile(value);
                      setError('');
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-lg text-center"
                    placeholder="Enter mobile number"
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
                type="submit"
                disabled={searching || loading || mobile.length !== 10}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {searching || loading ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span>{searching ? 'Searching...' : 'Logging in...'}</span>
                  </>
                ) : (
                  t('continue')
                )}
              </button>

              <button
                type="button"
                onClick={() => navigate('/')}
                className="w-full text-gray-600 hover:text-gray-900 transition"
              >
                {t('backToRoleSelection')}
              </button>
            </form>
          )}

          {step === 'details' && (
            <div>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('mobileNumber')}
                  </label>
                  <input
                    type="tel"
                    value={formData.mobile}
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    placeholder={t('enterName')}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('cast')} <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.cast}
                    onChange={(e) => {
                      setFormData({ ...formData, cast: e.target.value, customCast: '' });
                      setError('');
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    required
                  >
                    <option value="">{t('selectCast')}</option>
                    <option value="Marathi">{t('marathi')}</option>
                    <option value="Gujrati">{t('gujrati')}</option>
                    <option value="Marwadi">{t('marwadi')}</option>
                    <option value="Bhari">{t('bhari')}</option>
                    <option value="UP">{t('up')}</option>
                    <option value="Other">{t('other')}</option>
                  </select>
                </div>

                {formData.cast === 'Other' && (
                  <div className="animate-in fade-in slide-in-from-top duration-300">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('enterCast')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.customCast}
                      onChange={(e) => {
                        setFormData({ ...formData, customCast: e.target.value });
                        setError('');
                      }}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                      placeholder={t('enterCast')}
                      required
                      autoFocus
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('totalFamilyMembers')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.totalFamilyMembers}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '');
                      setFormData({ ...formData, totalFamilyMembers: value });
                      setError('');
                    }}
                    min="1"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    placeholder={t('enterFamilyMembers')}
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
                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
