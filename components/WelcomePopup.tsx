import React, { useState, useEffect } from 'react';
import { OnboardingDialog } from './ui/onboarding-dialog';

interface Banner {
  id: string;
  imageUrl: string;
  title: string;
  description: string;
  link?: string;
  bannerType?: 'hero' | 'popup' | 'gif';
}

const WelcomePopup: React.FC<{ banners: Banner[] }> = ({ banners }) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check local storage for 1-day expiration
    const storedData = localStorage.getItem('hide_welcome_popup');
    if (storedData) {
      try {
        const { timestamp } = JSON.parse(storedData);
        if (timestamp && Date.now() - timestamp < 24 * 60 * 60 * 1000) {
          return; // Still within 1 day
        } else {
          localStorage.removeItem('hide_welcome_popup');
        }
      } catch (e) {
        if (storedData === 'true') {
           localStorage.setItem('hide_welcome_popup', JSON.stringify({ timestamp: Date.now() }));
           return;
        }
      }
    }

    if (banners.length > 0) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [banners]);

  const handleClose = () => {
    localStorage.setItem('hide_welcome_popup', JSON.stringify({ timestamp: Date.now() }));
    setIsOpen(false);
  };

  if (!isOpen || banners.length === 0) return null;

  return <OnboardingDialog defaultOpen={isOpen} slides={banners} onClose={handleClose} />;
};

export default WelcomePopup;
