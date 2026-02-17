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
import { malikApi, searchApi } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';

export default function MalikRegister() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  // Form state management
  const [step, setStep] = useState<'phone' | 'details' | 'login'>('phone'); // Current step in registration
  const [whatsapp, setWhatsapp] = useState(''); // WhatsApp number input
  const [formData, setFormData] = useState({
    name: '',
    whatsapp: '',
    address: '',
    password: '', // Added password field for login/auth if needed, though simple version might not use it yet
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
      const response = await searchApi.searchUser(cleanNumber);
      const result = response.data;

      if (result.found && result.user) {
        // User found - check if it's a Malik
        if (result.role === 'Malik' && result.user.id) {
          // For now, we are simulating "auto-login" if found, but ideally we should ask for password.
          // Since the backend now requires token for protected routes, we need to LOGIN to get a token.
          // If the user exists, we should probably redirect to a LOGIN page, or show a password field here.
          // Given the current flow, let's assume we redirect to a login screen or handle login here if they enter password.
          // But the previous flow just redirected to dashboard. This won't work with protected routes unless we have a token.

          // If the user exists, we need to authenticate them.
          // Let's change the flow: If found, ask for password (or just redirect to login page if we have one).
          // We don't have a separate Malik Login page yet? 
          // We modified malikController to have a login endpoint.

          // IMPORTANT: We need a way to login. 
          // Let's update the UI to handle Login if user exists.
          // But to keep it simple and stick to the refactoring, let's assume we redirect to a login component or 
          // we can just prompt for password here.

          // However, the current component is "MalikRegister". 
          // If user exists, we should probably switch to "Login" mode.

          // Let's redirect to a Login page if found? Or use `malikApi.login`.
          // Since I don't want to create new pages if I can avoid it, I'll add a password field to the form step?
          // Or just redirect to dashboard? No, dashboard needs token.

          // Let's look at the implementation plan. "Update Malik Controller (Register/Login)".
          // `MalikRegister.tsx` seems to be the entry point.

          // If user found:
          // We should probably show a "Login" form instead of "Register" form.

          // For now, I will modify this to:
          // If found -> Show Login Form (Password) -> Call login API -> Save Token -> Redirect.
          // If not found -> Show Register Form -> Call register API -> Save Token -> Redirect.

          // I will implement a simple "Enter Password to Login" state?
          // or just redirect to `/malik/login`? But I haven't created that page.
          // I'll add a password input to the `details` step and use it for login if user exists?
          // No, if user exists, we don't need name/address.

          // Let's stick thereto: If found, prompt for password.
          setSearchResult(result);
          setStep('login'); // New step
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await malikApi.login({ whatsapp: formData.whatsapp, password: formData.password }); // You'll need to add password input
      // Wait, the backend login takes 'id' and 'password' or 'whatsapp' and 'password'?
      // malikController: `loginMalik` takes `whatsapp`.

      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        navigate(`/malik/dashboard/${response.data.malik.id}`);
      }
    } catch (err: any) {
      setError('Login failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await malikApi.register(formData);
      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        navigate(`/malik/dashboard/${response.data.malik.id}`);
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ... render ...
  // I need to add 'login' step to the render logic.
  // And add password field to registration usage too? The backend registerMalik creates a user. Does it require password?
  // Let's check malikController.js.
  // `registerMalik`: `const { name, whatsapp, address, password } = req.body;`
  // Yes, it requires password.
  // So I MUST add password field to the registration form.

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
            {/* Progress steps or Login header */}
          </div>

          {step === 'phone' && (
            <div className="space-y-6">
              {/* Phone input form */}
              {/* ... same as before ... */}
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('whatsappNumber10Digits')}
              </label>
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
              <button
                onClick={handlePhoneSearch}
                disabled={searching || whatsapp.length !== 10}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-xl font-semibold hover:from-green-700 hover:to-green-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {searching ? <LoadingSpinner size="sm" /> : t('continue')}
              </button>
              <button onClick={() => navigate('/')} className="w-full text-gray-600 hover:text-gray-900 transition">{t('backToRoleSelection')}</button>
            </div>
          )}

          {step === 'login' && (
            <form onSubmit={handleLogin} className="space-y-6">
              <h2 className="text-xl font-bold text-center">Login</h2>
              <input type="password"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                placeholder="Password"
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
                required
              />
              {error && <div className="text-red-500">{error}</div>}
              <button type="submit" disabled={loading} className="w-full bg-green-600 text-white py-3 rounded-xl">
                {loading ? <LoadingSpinner size="sm" /> : 'Login'}
              </button>
              <button type="button" onClick={() => setStep('phone')} className="w-full text-gray-600">Back</button>
            </form>
          )}

          {step === 'details' && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('whatsappNumber')}</label>
                <input type="tel" value={formData.whatsapp} disabled className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-600" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('name')}</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('address')}</label>
                <textarea value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 outline-none" required />
              </div>

              {error && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl">{error}</div>}

              <div className="flex gap-3">
                <button type="button" onClick={() => setStep('phone')} className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl hover:bg-gray-300">Back</button>
                <button type="submit" disabled={loading} className="flex-1 bg-green-600 text-white py-3 rounded-xl hover:from-green-700 hover:to-green-800 disabled:opacity-50">
                  {loading ? <LoadingSpinner size="sm" /> : t('register')}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
