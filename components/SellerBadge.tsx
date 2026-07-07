import React from 'react';
import { AlertCircle } from 'lucide-react';

interface SellerBadgeProps {
  kycStatus: string | undefined;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const VerifiedIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5 text-emerald-500" }) => {
  return (
    <svg 
      className={`${className} fill-emerald-500/10 stroke-emerald-500`} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M8.38 12L10.79 14.42L15.62 9.57996" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
      <path d="M10.75 2.44995C11.44 1.85995 12.57 1.85995 13.27 2.44995L14.85 3.80995C15.15 4.06995 15.71 4.27995 16.11 4.27995H17.81C18.87 4.27995 19.74 5.14995 19.74 6.20995V7.90995C19.74 8.29995 19.95 8.86995 20.21 9.16995L21.57 10.7499C22.16 11.4399 22.16 12.5699 21.57 13.2699L20.21 14.8499C19.95 15.1499 19.74 15.7099 19.74 16.1099V17.8099C19.74 18.8699 18.87 19.7399 17.81 19.7399H16.11C15.72 19.7399 15.15 19.9499 14.85 20.2099L13.27 21.5699C12.58 22.1599 11.45 22.1599 10.75 21.5699L9.17 20.2099C8.87 19.9499 8.31 19.7399 7.91 19.7399H6.18C5.12 19.7399 4.25 18.8699 4.25 17.8099V16.0999C4.25 15.7099 4.04 15.1499 3.79 14.8499L2.44 13.2599C1.86 12.5699 1.86 11.4499 2.44 10.7599L3.79 9.16995C4.04 8.86995 4.25 8.30995 4.25 7.91995V6.19995C4.25 5.13995 5.12 4.26995 6.18 4.26995H7.91C8.3 4.26995 8.87 4.05995 9.17 3.79995L10.75 2.44995Z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
    </svg>
  );
};

export const RegisteredBadge: React.FC<{ showText?: boolean; size?: 'sm' | 'md' | 'lg' }> = ({ showText = true, size = 'md' }) => {
  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const textSizes = {
    sm: 'text-[10px]',
    md: 'text-xs',
    lg: 'text-sm'
  };

  return (
    <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/50 text-blue-600 dark:text-blue-400 font-bold shrink-0">
      <svg 
        className={`${iconSizes[size]} fill-blue-500/10 stroke-blue-500`} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
      {showText && <span className={`${textSizes[size]} tracking-tight`}>Registered User</span>}
    </div>
  );
};

export const SellerBadge: React.FC<SellerBadgeProps> = ({ kycStatus, showText = true, size = 'md' }) => {
  const isVerified = kycStatus === 'verified';

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const textSizes = {
    sm: 'text-[10px]',
    md: 'text-xs',
    lg: 'text-sm'
  };

  if (isVerified) {
    return (
      <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50 text-emerald-600 dark:text-emerald-400 font-bold shrink-0">
        <VerifiedIcon className={iconSizes[size]} />
        {showText && <span className={`${textSizes[size]} tracking-tight`}>Verified Partner</span>}
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 text-amber-600 dark:text-amber-400 font-bold shrink-0">
      <AlertCircle className={`${iconSizes[size]} text-amber-500`} />
      {showText && <span className={`${textSizes[size]} tracking-tight`}>Not Verified</span>}
    </div>
  );
};
