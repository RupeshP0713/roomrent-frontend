import { useState } from 'react';
import LoadingSpinner from './LoadingSpinner';
import { useLanguage } from '../contexts/LanguageContext';

interface BhadotProfileModalProps {
  bhadotName: string;
  onSubmit: (data: { cast: string; totalFamilyMembers: number }) => Promise<void>;
}

const CAST_OPTIONS = [
  'Marathi',
  'Gujrati',
  'Marwadi',
  'Bhari',
  'UP',
  'Other'
];

export default function BhadotProfileModal({ bhadotName, onSubmit }: BhadotProfileModalProps) {
  const { t } = useLanguage();
  const [cast, setCast] = useState('');
  const [customCast, setCustomCast] = useState('');
  const [totalFamilyMembers, setTotalFamilyMembers] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!cast) {
      setError(t('pleaseSelectCast'));
      return;
    }

    if (cast === 'Other' && !customCast.trim()) {
      setError(t('pleaseEnterCast'));
      return;
    }

    if (!totalFamilyMembers || parseInt(totalFamilyMembers) < 1) {
      setError(t('pleaseEnterFamilyMembers'));
      return;
    }

    setLoading(true);
    try {
      const finalCast = cast === 'Other' ? customCast.trim() : cast;
      await onSubmit({
        cast: finalCast,
        totalFamilyMembers: parseInt(totalFamilyMembers)
      });
    } catch (err: any) {
      setError(err.message || 'Failed to save profile information');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.stopPropagation()}
    >
      <div 
        className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('completeProfile')}</h2>
          <p className="text-gray-600">{t('welcome')}, {bhadotName}! {t('provideAdditionalInfo')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('cast')} <span className="text-red-500">*</span>
            </label>
            <select
              value={cast}
              onChange={(e) => {
                setCast(e.target.value);
                setCustomCast('');
                setError('');
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              required
            >
              <option value="">{t('selectCast')}</option>
              {CAST_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {t(option.toLowerCase())}
                </option>
              ))}
            </select>
          </div>

          {cast === 'Other' && (
            <div className="animate-in fade-in slide-in-from-top duration-300">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('enterCast')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={customCast}
                onChange={(e) => {
                  setCustomCast(e.target.value);
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
              value={totalFamilyMembers}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '');
                setTotalFamilyMembers(value);
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

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" />
                        <span>{t('submitting')}</span>
                      </>
                    ) : (
                      t('submitContinue')
                    )}
                  </button>
                </form>

                <p className="text-xs text-gray-500 text-center mt-4">
                  {t('infoRequired')}
                </p>
      </div>
    </div>
  );
}

