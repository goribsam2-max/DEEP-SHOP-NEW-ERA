import { formatPrice } from "@/lib/utils";
import React, { useState, useEffect, useContext } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import Icon from './Icon';

import { useTheme } from './ThemeContext';
import { Header } from './ui/header-3';
import { PageLoadingContext } from '../App';


const DesktopLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [cartCount, setCartCount] = useState(0);
  const [cartTotal, setCartTotal] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isDark, toggleTheme } = useTheme();
  const { isPageLoading } = useContext(PageLoadingContext);

  useEffect(() => {
    const updateSidebar = (e: any) => setSidebarOpen(e.detail);
    window.addEventListener('toggleSidebar', updateSidebar);
    return () => window.removeEventListener('toggleSidebar', updateSidebar);
  }, []);

  useEffect(() => {
    const updateCart = () => {
      try {
        const cartStr = localStorage.getItem('f_cart');
        const cart = cartStr && cartStr !== "undefined" ? JSON.parse(cartStr) : [];
        if (!Array.isArray(cart)) {
          setCartCount(0);
          setCartTotal(0);
          return;
        }
        const count = cart.reduce((acc: number, item: any) => acc + (item?.quantity || 0), 0);
        const total = cart.reduce((acc: number, item: any) => acc + ((item?.price || 0) * (item?.quantity || 0)), 0);
        setCartCount(count);
        setCartTotal(total);
      } catch (err) {
        console.error("Cart parse error:", err);
        setCartCount(0);
        setCartTotal(0);
      }
    };
    updateCart();
    window.addEventListener('storage', updateCart);
    const interval = setInterval(updateCart, 1000); // Polling for fast local updates
    return () => {
      window.removeEventListener('storage', updateCart);
      clearInterval(interval);
    };
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem('f_cart');
    navigate('/');
    window.dispatchEvent(new CustomEvent('openAccountCenter'));
  };

  const showNav = ['/', '/profile', '/search', '/notifications', '/orders', '/wishlist'].includes(location.pathname);

  return (
    <div className={`min-h-screen bg-transparent flex flex-col ${(location.pathname === '/help-center' || location.pathname === '/messages' || isPageLoading) ? '' : 'pt-14 md:pt-16'}`}>
      {location.pathname !== '/help-center' && location.pathname !== '/messages' && !isPageLoading && <Header />}
      <div className="flex-1 flex w-full flex-col min-h-[calc(100vh-56px)]">
        {/* Main Content Area */}
        <div className={`transition-all duration-300 flex-1 w-full max-w-full ${sidebarOpen ? 'md:pl-64' : ''} lg:max-w-[calc(100vw-80px)] xl:max-w-none bg-transparent`}>
          <div className="w-full max-w-[1920px] mx-auto pb-0 min-h-[70vh]">
            {children}
          </div>
        </div>
      </div>

      {/* Desktop Right Cart Sidebar */}
      <AnimatePresence>
        {cartCount > 0 && location.pathname !== '/help-center' && !isPageLoading && (
          <motion.div 
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 100, opacity: 0 }}
            className="hidden xl:flex flex-col w-80 bg-zinc-50 dark:bg-zinc-800 border-l border-zinc-200 dark:border-zinc-700 h-screen sticky top-0 shrink-0 p-6 shadow-[-4px_0_24px_rgba(0,0,0,0.02)] z-40"
          >
            <div className="mb-8 pt-4">
               <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">Your Cart</h2>
               <p className="text-[10px] font-medium text-zinc-500 tracking-tight mt-1">{cartCount} items</p>
            </div>
            
            <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pr-1">
               {(function() {
                 try {
                   const cartStr = localStorage.getItem('f_cart');
                   const cart = cartStr && cartStr !== "undefined" ? JSON.parse(cartStr) : [];
                   return Array.isArray(cart) ? cart : [];
                 } catch (err) {
                   return [];
                 }
               })().map((item: any) => (
                 <div key={item.id} className="flex items-center space-x-4 bg-zinc-50 dark:bg-zinc-800 p-3 rounded-2xl border border-zinc-100 dark:border-zinc-800 hover:border-zinc-300 transition-colors">
                    <div className="w-14 h-14 bg-zinc-50 dark:bg-zinc-800 rounded-full p-1 shrink-0 border border-zinc-50 shadow-sm flex items-center justify-center">
                       <img src={item.image} className="max-w-full max-h-full object-contain mix-blend-multiply dark:mix-blend-normal" alt=""/>
                    </div>
                    <div className="flex-1 min-w-0">
                       <h4 className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100 truncate  tracking-tight" title={item.name}>{item.name}</h4>
                       <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5">{formatPrice(item.price * item.quantity)}</p>
                    </div>
                    <div className="text-[10px] font-semibold text-zinc-400 px-2 bg-zinc-100 dark:bg-zinc-800 rounded-md py-1">x{item.quantity}</div>
                 </div>
               ))}
            </div>

            <div className="mt-6 border-t border-zinc-100 dark:border-zinc-800 pt-6">
               <div className="flex justify-between items-end mb-6">
                  <span className="text-[10px] font-medium text-zinc-500 tracking-tight mb-1.5">Grand Total</span>
                  <span className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">{formatPrice(cartTotal)}</span>
               </div>
               <button onClick={() => navigate('/checkout')} className="w-full py-4 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 rounded-xl font-semibold text-sm hover:scale-[1.02] transition-all active:scale-[0.98] ">
                 Proceed to Checkout
               </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DesktopLayout;
