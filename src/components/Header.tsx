import { useEffect, useState } from 'react';
import { dbService } from '../services/dbService';
import LanguageSwitcher from './LanguageSwitcher';
import { useLanguage } from '../contexts/LanguageContext';

interface HeaderProps {
  title: string;
  showLanguageSwitcher?: boolean;
  onLogout?: () => void;
}

export default function Header({ title, showLanguageSwitcher = true, onLogout }: HeaderProps) {
  const { t } = useLanguage();
  const [dbStatus, setDbStatus] = useState<'connected' | 'disconnected'>('disconnected');
  const [cloudSync, setCloudSync] = useState<'synced' | 'syncing' | 'offline'>('offline');

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const health = await dbService.checkHealth();
        setDbStatus(health.database === 'connected' ? 'connected' : 'disconnected');
        setCloudSync(health.database === 'connected' ? 'synced' : 'offline');
      } catch {
        setDbStatus('disconnected');
        setCloudSync('offline');
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <div className="flex items-center gap-4">
            {showLanguageSwitcher && <LanguageSwitcher />}
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="px-4 py-2 rounded-xl bg-red-50 text-red-600 border border-red-200 text-sm font-semibold hover:bg-red-100 transition"
              >
                {t('logout')}
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

