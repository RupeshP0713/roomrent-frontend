import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'en' | 'hi';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: ReactNode;
  showLanguageSwitcher?: boolean;
}

export const LanguageProvider = ({ children }: LanguageProviderProps) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('app_language');
    return (saved === 'hi' || saved === 'en') ? saved : 'hi';
  });

  useEffect(() => {
    localStorage.setItem('app_language', language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || translations['en'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Common
    'welcome': 'Welcome',
    'back': 'Back',
    'submit': 'Submit',
    'cancel': 'Cancel',
    'edit': 'Edit',
    'save': 'Save',
    'delete': 'Delete',
    'loading': 'Loading...',
    'error': 'Error',
    'success': 'Success',

    // Role Switcher
    'roomRentConnect': 'Room Rent Connect',
    'chooseRole': 'Choose your role to continue',
    'admin': 'Admin',
    'systemManagement': 'System Management & Analytics',
    'makanMalik': 'Makan Malik',
    'landlordPortal': 'Landlord Portal',
    'roomBhadot': 'Room Bhadot',
    'tenantPortal': 'Tenant Portal',

    // Admin
    'adminLogin': 'Admin Login',
    'enterCredentials': 'Enter your credentials to access the admin dashboard',
    'adminId': 'Admin ID',
    'password': 'Password',
    'login': 'Login',
    'loggingIn': 'Logging in...',
    'invalidCredentials': 'Invalid credentials',

    // Malik Registration
    'makanMalikRegistration': 'Makan Malik Registration',
    'registerAsLandlord': 'Register as a Landlord',
    'whatsappNumber': 'WhatsApp Number',
    'whatsappNumber10Digits': 'WhatsApp Number (10 digits)',
    'checkExistingAccount': 'We\'ll check if you already have an account',
    'continue': 'Continue',
    'searching': 'Searching...',
    'name': 'Name',
    'address': 'Address',
    'enterName': 'Enter your name',
    'enterAddress': 'Enter your address',
    'register': 'Register',
    'registering': 'Registering...',

    // Malik Dashboard
    'searchAvailableTenants': 'Search for available tenants and send rental requests',
    'allTenants': 'All Tenants',
    'pendingRequests': 'Pending Requests',
    'limitReached': 'Limit reached - wait 24h',
    'sendRequest': 'Send Request',
    'requestSent': 'Request Sent',
    'limitReachedBtn': 'Limit Reached',
    'nextRequestAvailable': 'Next request available in',
    'canSendMoreRequests': 'You can send {count} more request(s)',
    'waitFor24Hours': 'Wait 24 hours after your oldest pending request to send more',
    'availableIn': 'Available in',
    'sendRequestToAll': 'Send Request to All',
    'sendingToAll': 'Sending to All...',
    'myRentalRequests': 'My Rental Requests',
    'noRequestsSent': 'No requests sent yet',
    'mobile': 'Mobile',
    'status': 'Status',
    'waiting': 'Waiting',
    'approved': 'Approved',
    'pending': 'Pending',
    'accepted': 'Accepted',
    'rejected': 'Rejected',
    'cloudSynced': 'Cloud Synced',
    'syncing': 'Syncing...',
    'offline': 'Offline',
    'connected': 'Connected',
    'disconnected': 'Disconnected',
    'saving': 'Saving...',
    'noTenantsFound': 'No available tenants found',

    // Bhadot Registration
    'roomBhadotRegistration': 'Room Bhadot Registration',
    'registerAsTenant': 'Register as a Tenant',
    'mobileNumber': 'Mobile Number',
    'mobileNumber10Digits': 'Mobile Number (10 digits)',
    'cast': 'Cast',
    'selectCast': 'Select your cast',
    'enterCast': 'Enter your cast',
    'totalFamilyMembers': 'Total Members in Family',
    'enterFamilyMembers': 'Enter total family members',
    'marathi': 'Marathi',
    'gujrati': 'Gujrati',
    'marwadi': 'Marwadi',
    'bihari': 'Bihari',
    'mp': 'M.P.',
    'up': 'UP',
    'other': 'Other',

    // Bhadot Dashboard
    'manageRentalRequests': 'Manage your rental requests from landlords',
    'liveDbInventory': 'LIVE DB INVENTORY',
    'availableRooms': 'Available Rooms',
    'liveCountUpdated': 'Live count updated every 5 seconds',
    'incomingOffers': 'INCOMING OFFERS',
    'noRentalRequests': 'No rental requests received yet',
    'ownerWantsContact': 'An owner',
    'wantsContactRoom': 'wants to contact you about a room.',
    'accept': 'ACCEPT',
    'reject': 'REJECT',
    'securedContacts': 'SECURED CONTACTS',
    'call': 'CALL',
    'wa': 'WA',
    'backToRoleSelection': '← Back to Role Selection',
    'completeProfile': 'Complete Your Profile',
    'provideAdditionalInfo': 'Please provide additional information to continue.',
    'pleaseSelectCast': 'Please select your cast',
    'pleaseEnterCast': 'Please enter your cast',
    'pleaseEnterFamilyMembers': 'Please enter total family members (minimum 1)',
    'submitting': 'Submitting...',
    'submitContinue': 'Submit & Continue',
    'infoRequired': 'This information is required to continue. Please fill all fields.',
    'bhadotProfileStatusLabel': 'Profile status',
    'bhadotStatusActive': 'Active',
    'bhadotStatusInactive': 'Inactive',
    'bhadotStatusHint': 'To show your details to Maliks keep this ON. To hide your details from Maliks turn this OFF.',
    'accountInactiveWarning': 'Your account will become inactive in',
    'accountInactiveMessage': 'After 5 days of accepting a request, your account will automatically become inactive. You can reactivate it anytime using the toggle above.',

    // Chat Widget
    'supportChat': 'Support Chat',
    'startConversation': 'Start a conversation with Admin',
    'typeMessage': 'Type a message...',
    'chatWithAdmin': 'Chat with Admin',
  },
  hi: {
    // Common
    'welcome': 'स्वागत है',
    'back': 'वापस',
    'submit': 'जमा करें',
    'cancel': 'रद्द करें',
    'edit': 'संपादित करें',
    'save': 'सहेजें',
    'delete': 'हटाएं',
    'loading': 'लोड हो रहा है...',
    'error': 'त्रुटि',
    'success': 'सफल',

    // Role Switcher
    'roomRentConnect': 'रूम रेंट कनेक्ट',
    'chooseRole': 'जारी रखने के लिए अपनी भूमिका चुनें',
    'admin': 'एडमिन',
    'systemManagement': 'सिस्टम प्रबंधन और विश्लेषण',
    'makanMalik': 'मकान मालिक',
    'landlordPortal': 'मकान मालिक पोर्टल',
    'roomBhadot': 'रूम भड़ोत',
    'tenantPortal': 'किरायेदार पोर्टल',

    // Admin
    'adminLogin': 'एडमिन लॉगिन',
    'enterCredentials': 'एडमिन डैशबोर्ड तक पहुंचने के लिए अपनी साख दर्ज करें',
    'adminId': 'एडमिन आईडी',
    'password': 'पासवर्ड',
    'login': 'लॉगिन',
    'loggingIn': 'लॉगिन हो रहा है...',
    'invalidCredentials': 'अमान्य साख',

    // Malik Registration
    'makanMalikRegistration': 'मकान मालिक पंजीकरण',
    'registerAsLandlord': 'मकान मालिक के रूप में पंजीकरण करें',
    'whatsappNumber': 'व्हाट्सएप नंबर',
    'whatsappNumber10Digits': 'व्हाट्सएप नंबर (10 अंक)',
    'checkExistingAccount': 'हम जांचेंगे कि क्या आपका प्रोफाइल पहले से मौजूद है',
    'continue': 'जारी रखें',
    'searching': 'खोज रहे हैं...',
    'name': 'नाम',
    'address': 'पता',
    'enterName': 'अपना नाम दर्ज करें',
    'enterAddress': 'अपना पता दर्ज करें',
    'register': 'पंजीकरण करें',
    'registering': 'पंजीकरण हो रहा है...',

    // Malik Dashboard
    'searchAvailableTenants': 'उपलब्ध किरायेदारों की खोज करें और किराया अनुरोध भेजें',
    'allTenants': 'सभी किरायेदार',
    'pendingRequests': 'लंबित अनुरोध',
    'limitReached': 'सीमा पहुंच गई - 24 घंटे प्रतीक्षा करें',
    'sendRequest': 'अनुरोध भेजें',
    'requestSent': 'अनुरोध भेज दिया गया',
    'limitReachedBtn': 'सीमा पहुंच गई',
    'nextRequestAvailable': 'अगला अनुरोध उपलब्ध होगा',
    'canSendMoreRequests': 'आप {count} और अनुरोध भेज सकते हैं',
    'waitFor24Hours': 'अधिक भेजने के लिए अपने सबसे पुराने लंबित अनुरोध के 24 घंटे बाद प्रतीक्षा करें',
    'availableIn': 'उपलब्ध होगा',
    'sendRequestToAll': 'सभी को अनुरोध भेजें',
    'sendingToAll': 'सभी को भेज रहे हैं...',
    'myRentalRequests': 'मेरे किराया अनुरोध',
    'noRequestsSent': 'अभी तक कोई अनुरोध नहीं भेजा गया',
    'mobile': 'मोबाइल',
    'status': 'स्थिति',
    'waiting': 'प्रतीक्षा',
    'approved': 'अनुमोदित',
    'pending': 'लंबित',
    'accepted': 'स्वीकृत',
    'rejected': 'अस्वीकृत',

    // Bhadot Registration
    'roomBhadotRegistration': 'रूम भड़ोत पंजीकरण',
    'registerAsTenant': 'किरायेदार के रूप में पंजीकरण करें',
    'mobileNumber': 'मोबाइल नंबर',
    'mobileNumber10Digits': 'मोबाइल नंबर (10 अंक)',
    'cast': 'जाति',
    'selectCast': 'अपनी जाति चुनें',
    'enterCast': 'अपनी जाति दर्ज करें',
    'totalFamilyMembers': 'परिवार में कुल सदस्य',
    'enterFamilyMembers': 'कुल परिवार के सदस्य दर्ज करें',
    'marathi': 'मराठी',
    'gujrati': 'गुजराती',
    'marwadi': 'मारवाड़ी',
    'bihari': 'बिहारी',
    'mp': 'एम.पी.',
    'up': 'यूपी',
    'other': 'अन्य',

    // Bhadot Dashboard
    'manageRentalRequests': 'मकान मालिकों से किराया अनुरोध प्रबंधित करें',
    'liveDbInventory': 'लाइव डीबी इन्वेंटरी',
    'availableRooms': 'उपलब्ध कमरे',
    'liveCountUpdated': 'लाइव गिनती हर 5 सेकंड में अपडेट होती है',
    'incomingOffers': 'आने वाले प्रस्ताव',
    'noRentalRequests': 'अभी तक कोई किराया अनुरोध प्राप्त नहीं हुआ',
    'ownerWantsContact': 'एक मालिक',
    'wantsContactRoom': 'आपसे कमरे के बारे में संपर्क करना चाहता है।',
    'accept': 'स्वीकार करें',
    'reject': 'अस्वीकार करें',
    'securedContacts': 'सुरक्षित संपर्क',
    'call': 'कॉल',
    'wa': 'व्हाट्सएप',
    'backToRoleSelection': '← भूमिका चयन पर वापस जाएं',
    'cloudSynced': 'क्लाउड सिंक',
    'syncing': 'सिंक हो रहा है...',
    'offline': 'ऑफलाइन',
    'connected': 'कनेक्टेड',
    'disconnected': 'डिस्कनेक्टेड',
    'saving': 'सहेज रहे हैं...',
    'noTenantsFound': 'कोई उपलब्ध किरायेदार नहीं मिला',
    'completeProfile': 'अपना प्रोफाइल पूरा करें',
    'provideAdditionalInfo': 'कृपया जारी रखने के लिए अतिरिक्त जानकारी प्रदान करें।',
    'pleaseSelectCast': 'कृपया अपनी जाति चुनें',
    'pleaseEnterCast': 'कृपया अपनी जाति दर्ज करें',
    'pleaseEnterFamilyMembers': 'कृपया कुल परिवार के सदस्य दर्ज करें (न्यूनतम 1)',
    'submitting': 'जमा हो रहा है...',
    'submitContinue': 'जमा करें और जारी रखें',
    'infoRequired': 'यह जानकारी जारी रखने के लिए आवश्यक है। कृपया सभी फ़ील्ड भरें।',
    'bhadotProfileStatusLabel': 'प्रोफाइल स्थिति',
    'bhadotStatusActive': 'सक्रिय (ON)',
    'bhadotStatusInactive': 'निष्क्रिय (OFF)',
    'bhadotStatusHint': 'मालिक को अपना डेटा दिखाने के लिए इसे ON रखें और मालिक को अपना डेटा नहीं दिखाने के लिए इसे OFF करें।',
    'accountInactiveWarning': 'आपका प्रोफाइल निष्क्रिय हो जाएगा',
    'accountInactiveMessage': 'अनुरोध स्वीकार करने के 5 दिन बाद, आपका प्रोफाइल स्वचालित रूप से निष्क्रिय हो जाएगा। आप ऊपर दिए गए टॉगल का उपयोग करके इसे कभी भी पुनः सक्रिय कर सकते हैं।',

    // Chat Widget
    'supportChat': 'सहायता चैट',
    'startConversation': 'एडमिन के साथ बातचीत शुरू करें',
    'typeMessage': 'संदेश टाइप करें...',
    'chatWithAdmin': 'एडमिन से चैट करें',
  }
};

