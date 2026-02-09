/**
 * RoleSwitcher Component
 * 
 * This is the main landing page where users select their role:
 * - Makan Malik (Landlord): Property owner portal
 * - Room Bhadot (Tenant): Tenant portal
 * 
 * Features:
 * - Language switcher (Hindi/English)
 * - Responsive design with smooth animations
 * - Role-based navigation
 */
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';

export default function RoleSwitcher() {
  // Navigation hook for routing
  const navigate = useNavigate();
  
  // Language context for translations
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-gray-50 to-gray-100 flex items-center justify-center px-4 py-12">
      <div className="max-w-4xl w-full">
        {/* Language Switcher - Top Right */}
        <div className="flex justify-end mb-6">
          <LanguageSwitcher />
        </div>

        {/* Main Header Section */}
        <div className="text-center mb-12 animate-in fade-in duration-500">
          <h1 className="text-6xl font-extrabold mb-4">
            <span className="text-blue-600">Room Rent</span>{' '}
            <span className="text-green-600">Connect</span>
          </h1>
          <p className="text-xl text-gray-600 font-medium">{t('chooseRole')}</p>
        </div>

        {/* Role Selection Cards Grid - Only 2 Cards (Malik and Bhadot) */}
        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          
          {/* Malik (Landlord) Card - Green Theme */}
          <button
            onClick={() => navigate('/malik/register')}
            className="group bg-white rounded-3xl shadow-xl p-8 hover:shadow-2xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-2 animate-in fade-in slide-in-from-bottom duration-700"
          >
            <div className="text-center">
              {/* Icon Container with Gradient Background */}
              <div className="w-24 h-24 bg-gradient-to-br from-green-500 via-green-600 to-green-700 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-lg group-hover:shadow-green-500/50 transition-all duration-300 group-hover:scale-110">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              {/* Title */}
              <h2 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-green-600 transition-colors">
                {t('makanMalik')}
              </h2>
              {/* Description */}
              <p className="text-gray-600 group-hover:text-gray-700 transition-colors">
                {t('landlordPortal')}
              </p>
            </div>
          </button>

          {/* Bhadot (Tenant) Card - Blue Theme */}
          <button
            onClick={() => navigate('/bhadot/register')}
            className="group bg-white rounded-3xl shadow-xl p-8 hover:shadow-2xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-2 animate-in fade-in slide-in-from-bottom duration-700"
          >
            <div className="text-center">
              {/* Icon Container with Gradient Background */}
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-lg group-hover:shadow-blue-500/50 transition-all duration-300 group-hover:scale-110">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              {/* Title */}
              <h2 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                {t('roomBhadot')}
              </h2>
              {/* Description */}
              <p className="text-gray-600 group-hover:text-gray-700 transition-colors">
                {t('tenantPortal')}
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

