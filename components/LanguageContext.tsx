import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'bn';

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
};

// Extremely basic dictionary for demonstration purposes.
const translations: Record<Language, Record<string, string>> = {
  en: {
    'home': 'Home',
    'search': 'Search',
    'cart': 'Cart',
    'profile': 'Profile',
    'wishlist': 'Wishlist',
    'all_products': 'All Products',
    'start': 'Start',
    'contact_us': 'Contact Us',
    'helpline': 'Helpline',
    'accepted_payments': 'Accepted Payments',
    'privacy_policy': 'Privacy Policy',
    'terms': 'Terms of Service',
  },
  bn: {
    'home': 'হোম',
    'search': 'সার্চ',
    'cart': 'কার্ট',
    'profile': 'প্রোফাইল',
    'wishlist': 'উইশলিস্ট',
    'all_products': 'সব পণ্য',
    'start': 'শুরু করুন',
    'contact_us': 'যোগাযোগ করুন',
    'helpline': 'হেল্পলাইন',
    'accepted_payments': 'গ্রহণযোগ্য পেমেন্ট',
    'privacy_policy': 'গোপনীয়তা নীতি',
    'terms': 'শর্তাবলী',
    'Sign In Required': 'সাইন ইন আবশ্যক',
    'Please login to view and manage your saved tech essentials.': 'আপনার সংরক্ষিত প্রযুক্তি পণ্যগুলি দেখতে এবং পরিচালনা করতে অনুগ্রহ করে লগইন করুন।',
    'Sign In Now': 'এখনই সাইন ইন করুন',
    'Nothing saved yet': 'এখনো কিছু সংরক্ষণ করা হয়নি',
    'Start Exploring': 'এক্সপ্লোর শুরু করুন',
    'Shipping Information': 'শিপিং তথ্য',
    'Add Shipping Address': 'শিপিং ঠিকানা যোগ করুন',
    'No Address Found': 'কোনো ঠিকানা পাওয়া যায়নি',
    'Please add a shipping address to continue.': 'এগিয়ে যেতে অনুগ্রহ করে একটি শিপিং ঠিকানা যোগ করুন।',
    'Payment Method': 'পেমেন্ট পদ্ধতি',
    'Order Summary': 'অর্ডারের সারাংশ',
    'Subtotal': 'উপমোট',
    'Delivery Fee': 'ডেলিভারি চার্জ',
    'Total': 'মোট',
    'Place Order': 'অর্ডার করুন',
    'Checkout & Pay': 'চেকআউট ও পে করুন',
    'Payment Details': 'পেমেন্টের বিবরণ',
    'Select a Voucher': 'ভাউচার নির্বাচন করুন',
    'Use': 'ব্যবহার করুন'
  }
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key) => key,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    const saved = localStorage.getItem('language') as Language | null;
    if (saved && (saved === 'en' || saved === 'bn')) {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
