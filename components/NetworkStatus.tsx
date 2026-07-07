import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, RefreshCw, X, Wifi } from 'lucide-react';
import { showIsland } from './ui/dynamic-island';

export const NetworkStatus: React.FC = () => {
    const [isOffline, setIsOffline] = useState(!navigator.onLine);
    const [isDismissed, setIsDismissed] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showRestored, setShowRestored] = useState(false);

    useEffect(() => {
        const handleOffline = () => {
            setIsOffline(true);
            setIsDismissed(false);
            setShowRestored(false);
        };
        const handleOnline = () => {
            setIsOffline(false);
            setShowRestored(true);
            setTimeout(() => {
                setShowRestored(false);
            }, 3000);
            showIsland({
                state: 'success',
                title: 'Network Restored',
                subtitle: 'Your connection is back online.'
            });
        };

        const handleForceOfflinePop = () => {
             setIsOffline(true);
             setIsDismissed(false);
        };

        window.addEventListener('offline', handleOffline);
        window.addEventListener('online', handleOnline);
        window.addEventListener('showNetworkError', handleForceOfflinePop);

        return () => {
            window.removeEventListener('offline', handleOffline);
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('showNetworkError', handleForceOfflinePop);
        };
    }, []);

    const handleRefresh = () => {
        setIsRefreshing(true);
        setTimeout(() => {
            if (navigator.onLine) {
                setIsOffline(false);
                setShowRestored(true);
                setTimeout(() => {
                    setShowRestored(false);
                }, 3000);
                showIsland({
                    state: 'success',
                    title: 'Network Restored',
                    subtitle: 'Your connection is back online.'
                });
            } else {
                setIsRefreshing(false);
            }
        }, 800);
    };

    return (
        <AnimatePresence>
            {((isOffline && !isDismissed) || showRestored) && (
                <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-[320px] overflow-hidden shadow-2xl flex flex-col items-center border border-transparent dark:border-zinc-800"
                    >
                        <div className="w-full flex items-center justify-center pt-8 pb-4">
                            {isOffline ? (
                                <div className="w-32 h-32 relative">
                                    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                                        <path className="fill-zinc-900 dark:fill-white" d="M100 150C105.523 150 110 145.523 110 140C110 134.477 105.523 130 100 130C94.4772 130 90 134.477 90 140C90 145.523 94.4772 150 100 150Z"/>
                                        <path className="stroke-zinc-900 dark:stroke-white" d="M50 90C77.6142 62.3858 122.386 62.3858 150 90" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round"/>
                                        <path className="stroke-zinc-900 dark:stroke-white" d="M70 110C86.5685 93.4315 113.431 93.4315 130 110" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round"/>
                                        <path className="stroke-zinc-900 dark:stroke-white" d="M30 30L170 170" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round"/>
                                        <path className="stroke-zinc-200 dark:stroke-zinc-700" d="M124.966 64.9659C132.748 72.7479 138.583 82.2612 142.179 92.6841" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </div>
                            ) : (
                                <div className="w-32 h-32 relative">
                                    <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                                        <path d="M100 150C105.523 150 110 145.523 110 140C110 134.477 105.523 130 100 130C94.4772 130 90 134.477 90 140C90 145.523 94.4772 150 100 150Z" fill="#1cdb5e"/>
                                        <path d="M50 90C77.6142 62.3858 122.386 62.3858 150 90" stroke="#1cdb5e" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round"/>
                                        <path d="M70 110C86.5685 93.4315 113.431 93.4315 130 110" stroke="#1cdb5e" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round"/>
                                        <path d="M30 70C68.6599 31.3401 131.34 31.3401 170 70" stroke="#1cdb5e" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                </div>
                            )}
                        </div>
                        <div className="px-6 pb-6 text-center w-full">
                            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2 tracking-tight">
                                {isOffline ? "No Internet Connection" : "Connection Restored"}
                            </h3>
                            <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-6 leading-relaxed">
                                {isOffline 
                                    ? "You can surf offline but some features require internet data." 
                                    : "You are back online. Enjoy surfing!"}
                            </p>
                            
                            {isOffline ? (
                                <div className="flex w-full border-t border-zinc-100 dark:border-zinc-800">
                                    <button 
                                        onClick={() => setIsDismissed(true)} 
                                        className="flex-1 py-4 text-zinc-500 dark:text-zinc-400 font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition"
                                    >
                                        Cancel
                                    </button>
                                    <div className="w-[1px] bg-zinc-100 dark:bg-zinc-800"></div>
                                    <button 
                                        onClick={handleRefresh}
                                        disabled={isRefreshing}
                                        className="flex-1 py-4 text-[#1cdb5e] font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition flex items-center justify-center gap-2"
                                    >
                                        {isRefreshing ? (
                                            <RefreshCw size={16} className="animate-spin" />
                                        ) : (
                                            "Retry"
                                        )}
                                    </button>
                                </div>
                            ) : (
                                <div className="flex w-full border-t border-zinc-100 dark:border-zinc-800">
                                    <button 
                                        onClick={() => setShowRestored(false)} 
                                        className="w-full py-4 text-[#1cdb5e] font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition"
                                    >
                                        OK
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

