import { useEffect, useState } from 'react';
import { dbService } from '../services/dbService';
import LanguageSwitcher from './LanguageSwitcher';
import { useLanguage } from '../contexts/LanguageContext';

interface HeaderProps {
  title: string;
  showLanguageSwitcher?: boolean;
}

export default function Header({ title, showLanguageSwitcher = true }: HeaderProps) {
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
            
            {/* Cloud Sync Indicator */}
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                cloudSync === 'synced' ? 'bg-green-500 animate-pulse' :
                cloudSync === 'syncing' ? 'bg-yellow-500 animate-pulse' :
                'bg-gray-400'
              }`} />
              <span className="text-sm font-medium text-gray-600">
                {cloudSync === 'synced' ? t('cloudSynced') :
                 cloudSync === 'syncing' ? t('syncing') :
                 t('offline')}
              </span>
            </div>

            {/* DB Status Indicator */}
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                dbStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'
              }`} />
              <span className="text-sm font-medium text-gray-600">
                DB {dbStatus === 'connected' ? t('connected') : t('disconnected')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

