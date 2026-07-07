import React, { useState, useEffect } from 'react';
import Icon from './Icon';

export const MobileGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isDesktop, setIsDesktop] = useState(window.innerWidth > 1024);

    useEffect(() => {
        const handleResize = () => setIsDesktop(window.innerWidth > 1024);
        window.addEventListener('resize', handleResize);
        
        // Initial check
        handleResize();
        
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    
    if (isDesktop) {
        return (
            <div className="fixed inset-0 bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-6 z-[99999]" style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
               <div className="max-w-md w-full text-center space-y-6 bg-[#121212] p-10 rounded-2xl border border-white/5 relative overflow-hidden">
                 <div className="absolute top-[-50%] right-[-10%] w-[300px] h-[300px] bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900/10 rounded-full blur-[80px] pointer-events-none"></div>
                 
                 <div className="w-24 h-24 bg-black rounded-full flex items-center justify-center mx-auto mb-8 shadow-sm shadow-emerald-500/10 border border-white/5">
                    <Icon name="mobile-alt" className="text-lg text-zinc-800 dark:text-zinc-200 animate-bounce" />
                 </div>
                 
                 <h1 className="text-xl font-semibold tracking-tight bg-gradient-to-br from-white to-zinc-500 bg-clip-text text-transparent">Mobile Only</h1>
                 <p className="text-zinc-400 text-sm leading-relaxed px-4">
                   This platform is exclusively designed for mobile devices to ensure the best shopping experience.
                 </p>
                 
                 <div className="pt-8 mt-8 border-t border-white/5 relative z-10">
                    <div className="inline-flex items-center space-x-2 text-[10px] font-bold  tracking-normal text-zinc-500 bg-black/50 px-4 py-2 border border-white/5 rounded-full">
                       <Icon name="ban" className="text-red-500 text-xs" />
                       <span className="mt-0.5">Desktop Access Disabled</span>
                    </div>
                 </div>
               </div>
            </div>
        );
    }

    return <>{children}</>;
};
