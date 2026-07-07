import React, { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { auth } from '../../firebase';
import { useNotify } from '../Notifications';
import { subscribeToWebPush } from '../../lib/push';
import { motion, AnimatePresence } from 'framer-motion';

export function NotificationPermissionModal() {
  const [open, setOpen] = useState(false);
  const notify = useNotify();

  useEffect(() => {
    // Check if the user has already granted/denied permission
    // and if we have already asked them before.
    if ('Notification' in window) {
      const permission = Notification.permission;
      const hasDismissed = localStorage.getItem('notificationPromptDismissed');
      
      if (permission === 'granted') {
          // Ensure they are subscribed if permission is already granted
          const ensureSubscribed = async () => {
             if (localStorage.getItem('vibe_push_enabled') !== 'true') {
                 const result: any = await subscribeToWebPush();
                 if (result && !result.error) {
                     localStorage.setItem('vibe_push_enabled', 'true');
                 }
             }
          };
          ensureSubscribed();
      } else if (permission === 'default' && !hasDismissed) {
         // Show after a small delay to not overwhelm
         const timer = setTimeout(() => {
            setOpen(true);
         }, 3000);
         return () => clearTimeout(timer);
      }
    }
  }, []);

  const handleAllow = async () => {
    try {
      const result: any = await subscribeToWebPush();
      if (result && !result.error) {
         localStorage.setItem('vibe_push_enabled', 'true');
         notify('Push notifications enabled!', 'success');
         // Auto-send a welcome push notification if successful!
         fetch('/api/send-welcome-push', { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ subscription: result })
         }).catch(e => console.error("Welcome push error:", e));
      } else {
         notify(result?.error || 'Permission denied or failed to setup. You can change this in your browser settings.', 'error');
         localStorage.setItem('notificationPromptDismissed', 'true');
      }
    } catch (err) {
      console.error('Error requesting notification permission:', err);
    } finally {
      setOpen(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('notificationPromptDismissed', 'true');
    setOpen(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div 
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:w-[380px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl z-[100000] p-4 flex gap-4 overflow-hidden"
        >
          <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
            <Bell className="w-5 h-5 text-zinc-900 dark:text-zinc-100" />
          </div>
          <div className="flex-1">
             <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm mb-1">Enable Notifications</h3>
             <p className="text-zinc-500 text-xs mb-3 leading-snug">Get updates about your orders and exclusive discounts directly on your device.</p>
             <div className="flex gap-2">
                <button 
                  onClick={handleDismiss}
                  className="flex-1 py-2 rounded-[15px] border border-zinc-200 dark:border-zinc-700 text-zinc-500 font-bold text-xs hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center text-center"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAllow}
                  className="flex-1 py-2 rounded-[15px] bg-black dark:bg-white text-white dark:text-black font-bold text-xs hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors flex items-center justify-center text-center"
                >
                  Allow
                </button>
             </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
