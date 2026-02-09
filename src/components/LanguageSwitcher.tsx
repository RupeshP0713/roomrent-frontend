import { useLanguage } from '../contexts/LanguageContext';

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 shadow-sm border border-gray-200">
      <button
        onClick={() => setLanguage('en')}
        className={`px-3 py-1 rounded-lg font-medium text-sm transition ${
          language === 'en'
            ? 'bg-blue-600 text-white'
            : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        English
      </button>
      <button
        onClick={() => setLanguage('hi')}
        className={`px-3 py-1 rounded-lg font-medium text-sm transition ${
          language === 'hi'
            ? 'bg-blue-600 text-white'
            : 'text-gray-600 hover:bg-gray-100'
        }`}
      >
        हिंदी
      </button>
    </div>
  );
}

