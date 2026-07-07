import React, { useEffect, useState } from 'react';
import { FacebookIcon } from './ui/BrandIcons';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { QrCode, CreditCard, ShieldCheck, PhoneCall, MessageCircle, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from './LanguageContext';

export const Footer = () => {
  const [settings, setSettings] = useState<any>({ facebookUrl: '', tiktokUrl: '', footerPaymentLogos: [] });
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);
  const [waReason, setWaReason] = useState('Order Issue');
  const [customReason, setCustomReason] = useState('');
  const { t } = useLanguage();

  const waNumber = "8801778953114"; // without + for link

  useEffect(() => {
    getDoc(doc(db, 'settings', 'payments')).then(snap => {
      if (snap.exists()) {
        const data = snap.data();
        setSettings({
          facebookUrl: data.facebookUrl || '',
          tiktokUrl: data.tiktokUrl || '',
          footerPaymentLogos: data.footerPaymentLogos || []
        });
      }
    });
  }, []);

  const handleWhatsAppSend = () => {
    const finalReason = waReason === 'Other' ? customReason : waReason;
    const message = encodeURIComponent(`Hi, I need help regarding: ${finalReason}`);
    window.open(`https://wa.me/${waNumber}?text=${message}`, '_blank');
    setIsWhatsAppOpen(false);
    setIsContactOpen(false);
  };

  return (
    <>
      <footer className="w-full bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-900 dark:rounded-t-[15px] pb-[90px] md:pb-8 pt-12 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col md:flex-row justify-between items-start gap-12">
          
          {/* Brand Side */}
          <div className="flex flex-col gap-4 max-w-sm">
            <h2 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white">DEEP SHOP</h2>
            <p className="text-sm text-zinc-500 leading-relaxed">
              Bangladesh's trusted platform for Border Cross Products & genuine mobiles. We offer authentic devices and premium accessories across the nation.
            </p>
            {/* Social Links */}
            <div className="flex items-center gap-3 pt-2">
              {settings.facebookUrl && (
                <a 
                  href={settings.facebookUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 transition-all duration-300"
                >
                  <FacebookIcon className="w-4 h-4" />
                </a>
              )}
              {settings.tiktokUrl && (
                <a 
                  href={settings.tiktokUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 hover:text-black dark:hover:bg-zinc-800 dark:hover:text-white transition-all duration-300"
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"></path>
                  </svg>
                </a>
              )}
            </div>

            {/* Helpline */}
            <div className="mt-4 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-900 transition" onClick={() => setIsContactOpen(true)}>
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                     <PhoneCall className="w-5 h-5" />
                  </div>
                  <div>
                     <p className="text-sm font-bold text-zinc-900 dark:text-white">{t('helpline')}: +8801778953114</p>
                     <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">10:00 AM - 10:00 PM</p>
                  </div>
               </div>
            </div>

          </div>

        {/* Payment Methods */}
          <div className="flex flex-col md:items-end gap-5">
            <p className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <QrCode className="w-4 h-4 text-[#1cdb5e]" /> {t('accepted_payments')}
            </p>
            <div className="flex flex-col md:items-end gap-3 text-left md:text-right relative">
              <p className="text-sm text-zinc-500 max-w-sm mb-2">
                We accept secure payments via <strong className="text-zinc-900 dark:text-white font-bold">bKash & Nagad</strong> mobile banking systems.
              </p>
              <div className="flex flex-wrap md:justify-end gap-2 w-full max-w-[380px]">
                {settings.footerPaymentLogos?.map((method: any, i: number) => (
                  <div key={i} className="px-3 py-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center gap-2 min-w-[95px] flex-grow justify-center">
                    <img src={method.icon} alt={method.name} className="h-5 md:h-6 w-auto object-contain" />
                    <span className="text-[11px] md:text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">{method.name}</span>
                  </div>
                ))}
              </div>
              
              <div className="flex items-center gap-1.5 mt-1 justify-end text-zinc-500 dark:text-zinc-400">
                 <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>
                 <span className="text-[10px] font-bold uppercase tracking-wider">More BD Banking systems supported</span>
              </div>

              <div className="flex items-center gap-1.5 mt-2 justify-end opacity-80">
                 <ShieldCheck className="w-3.5 h-3.5 text-[#1cdb5e]" />
                 <span className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">Verified & Secure</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 md:px-8 mt-16 pt-8 border-t border-zinc-100 dark:border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-4">
           <p className="text-xs text-zinc-500 font-medium">© {new Date().getFullYear()} DEEP SHOP. All rights reserved.</p>
           <div className="flex items-center gap-6 text-xs font-semibold text-zinc-600 dark:text-zinc-400">
             <Link to="/privacy" className="hover:text-zinc-900 dark:hover:text-white transition-colors">{t('privacy_policy')}</Link>
             <Link to="/terms" className="hover:text-zinc-900 dark:hover:text-white transition-colors">{t('terms')}</Link>
           </div>
        </div>
      </footer>

      {/* Contact Options Popup */}
      {isContactOpen && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 sm:p-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsContactOpen(false)}>
          <div className="bg-white dark:bg-zinc-900 w-full sm:max-w-sm rounded-3xl p-6 shadow-2xl transform transition-all" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Contact Us</h3>
              <button onClick={() => setIsContactOpen(false)} className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-3">
              <a href="tel:+8801778953114" className="w-full flex items-center gap-4 p-4 rounded-2xl bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition text-blue-600 dark:text-blue-400">
                <div className="w-12 h-12 rounded-full bg-white dark:bg-zinc-800 flex items-center justify-center shadow-sm">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="font-bold">Direct Call</p>
                  <p className="text-xs opacity-80">+880 1778-953114</p>
                </div>
              </a>

              <button onClick={() => setIsWhatsAppOpen(true)} className="w-full flex items-center gap-4 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition text-emerald-600 dark:text-emerald-400">
                <div className="w-12 h-12 rounded-full bg-white dark:bg-zinc-800 flex items-center justify-center shadow-sm">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="font-bold">WhatsApp</p>
                  <p className="text-xs opacity-80">Message us instantly</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Reason Popup */}
      {isWhatsAppOpen && (
        <div className="fixed inset-0 z-[210] flex items-end sm:items-center justify-center p-4 sm:p-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsWhatsAppOpen(false)}>
          <div className="bg-white dark:bg-zinc-900 w-full sm:max-w-sm rounded-3xl p-6 shadow-2xl transform transition-all" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">What do you need help with?</h3>
              <button onClick={() => setIsWhatsAppOpen(false)} className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {['Order Issue', 'Product Inquiry', 'Delivery Status', 'Return/Refund', 'Other'].map(reason => (
                <label key={reason} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${waReason === reason ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}>
                  <input type="radio" name="wareason" value={reason} checked={waReason === reason} onChange={(e) => setWaReason(e.target.value)} className="text-emerald-500 focus:ring-emerald-500" />
                  <span className={`text-sm font-medium ${waReason === reason ? 'text-emerald-700 dark:text-emerald-400' : 'text-zinc-700 dark:text-zinc-300'}`}>{reason}</span>
                </label>
              ))}

              {waReason === 'Other' && (
                <textarea 
                  placeholder="Please specify your reason..."
                  value={customReason}
                  onChange={e => setCustomReason(e.target.value)}
                  className="w-full mt-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-sm focus:outline-none focus:border-emerald-500 dark:text-white"
                  rows={3}
                />
              )}

              <button 
                onClick={handleWhatsAppSend}
                disabled={waReason === 'Other' && !customReason.trim()}
                className="w-full mt-4 bg-[#1cdb5e] text-white py-3.5 rounded-xl font-bold shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue to WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
