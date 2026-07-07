import { formatPrice } from "@/lib/utils";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Sparkles } from 'lucide-react';
import Icon from './Icon';
import { useNavigate } from 'react-router-dom';
import { StatusBadge } from './ui/status-badge';

const BoxPosition = "fixed bottom-24 md:bottom-10 left-4 md:left-10 z-[80]";

const MysteryBox: React.FC<{ products: any[] }> = ({ products }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [result, setResult] = useState<'win' | 'lose' | null>(null);
  const [revealedProduct, setRevealedProduct] = useState<any>(null);
  const [discount, setDiscount] = useState(0);
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const state = JSON.parse(localStorage.getItem('vibe_mystery_box') || '{}');
      const today = new Date().toDateString();
      const lastPlayedDate = state.lastPlayed ? new Date(state.lastPlayed).toDateString() : null;
      
      if (lastPlayedDate !== today) {
        // Can play today
        setVisible(true);
      } else {
        // Already played today. Is there an active, unused win?
        if (state.result === 'win' && !state.used && state.expiresAt > Date.now()) {
          // Keep it hidden, as they already opened it. Or we can show a floating "Active Deal" icon!
          // But req says "auto hide hoy jabe 1 hour ar modde buy kore nile tahole instant hide hobe"
          // So once played, it hides.
          setVisible(false);
        } else {
          setVisible(false);
        }
      }
    } catch (e) {
      setVisible(true);
    }
  }, []);

  const handleOpen = () => {
    if (products.length === 0) return;
    setIsShaking(true);
    
    setTimeout(() => {
      setIsShaking(false);
      setIsOpen(true);
      
      const isWin = Math.random() > 0.3; // 70% chance to win
      let stateObj: any = { lastPlayed: Date.now(), result: 'lose' };
      
      if (isWin) {
        const randomProd = products[Math.floor(Math.random() * products.length)];
        const discPct = Math.floor(Math.random() * 6) + 5; // 5 to 10
        setRevealedProduct(randomProd);
        setDiscount(discPct);
        setResult('win');
        stateObj = {
          ...stateObj,
          result: 'win',
          productId: randomProd.id,
          discountPct: discPct,
          discountPrice: Math.floor(randomProd.price * (1 - discPct/100)),
          expiresAt: Date.now() + 60 * 60 * 1000,
          used: false
        };
      } else {
        setResult('lose');
      }
      
      localStorage.setItem('vibe_mystery_box', JSON.stringify(stateObj));
    }, 1500);
  };

  const handleClose = () => {
    setIsOpen(false);
    setVisible(false); // Hide after opening
  };

  if (products.length === 0 || !visible) return null;

  return (
    <>
      <motion.div 
        className={`${BoxPosition} cursor-pointer group flex flex-col items-center justify-center`}
        whileHover={{ scale: 1.05 }}
        onClick={handleOpen}
      >
          <motion.div 
            className="w-14 h-14 bg-gradient-to-br from-yellow-400 to-purple-600 rounded-full shadow-[0_10px_30px_rgba(147,51,234,0.4)] flex items-center justify-center relative border-2 border-white"
            animate={{ rotate: isShaking ? [0, -15, 15, -15, 15, 0] : 0 }}
            transition={{ duration: 0.5, repeat: isShaking ? Infinity : 0 }}
          >
             <div className="absolute inset-0 bg-zinc-50 dark:bg-zinc-900/20 rounded-full animate-ping opacity-50"></div>
             <Icon name="gift" className="text-lg text-white  z-10" />
          </motion.div>
          <div className="mt-1.5 shadow-sm">
            <StatusBadge leftIcon={Gift} leftLabel="Mystery Box" />
          </div>
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] bg-zinc-900/80 flex items-center justify-center p-6"
            onClick={handleClose}
          >
            <motion.div 
              initial={{ scale: 0.5, y: 50, rotate: -10 }}
              animate={{ scale: 1, y: 0, rotate: 0 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", bounce: 0.5 }}
              onClick={e => e.stopPropagation()}
              className="bg-zinc-50 dark:bg-zinc-800 rounded-2xl p-8 max-w-sm w-full relative overflow-hidden shadow-sm border-4 border-purple-500/30 text-center"
            >
              <div className="absolute inset-0 bg-mesh-pattern opacity-5 pointer-events-none mix-blend-overlay"></div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-400 rounded-full blur-[60px] opacity-20"></div>
              
              <button onClick={handleClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 rounded-2xl hover:bg-zinc-200 transition-colors">
                <Icon name="times" className="text-xs" />
              </button>

              {result === 'win' && revealedProduct ? (
                <>
                  <div className="mb-6 flex justify-center">
                    <StatusBadge leftIcon={Sparkles} leftLabel="You Unlocked a Deal!" status="success" />
                  </div>

                  <div className="relative w-40 h-40 mx-auto mb-6 bg-zinc-50 dark:bg-zinc-800 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-800 shadow-inner group">
                    <img src={revealedProduct.image} alt={revealedProduct.name} className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute -bottom-3 -right-3 bg-emerald-500 text-white w-12 h-12 rounded-full flex flex-col items-center justify-center font-semibold animate-bounce shadow-lg border-2 border-white rotate-12">
                      <span className="text-[10px] leading-none">EXTRA</span>
                      <span className="text-xs leading-none">{discount}%</span>
                    </div>
                  </div>

                  <h3 className="font-semibold text-lg text-zinc-900 dark:text-zinc-100 mb-2 leading-tight tracking-tight px-4">{revealedProduct.name}</h3>
                  
                  <div className="flex justify-center items-center space-x-2 mb-8">
                    <span className="text-lg font-semibold text-purple-600">{formatPrice(Math.floor(revealedProduct.price * (1 - discount/100)))}</span>
                    <span className="text-xs font-bold text-zinc-400 line-through">{formatPrice(revealedProduct.price)}</span>
                  </div>

                  <button 
                    onClick={() => {
                      handleClose();
                      navigate(`/product/${revealedProduct.id}`);
                    }}
                    className="w-full py-4 bg-purple-600 text-white rounded-full font-semibold  tracking-normal text-[11px] shadow-lg shadow-purple-600/30 hover:bg-purple-700 active:scale-95 transition-all"
                  >
                    Claim Offer Now
                  </button>
                  <p className="text-[8px] font-bold text-zinc-400  tracking-normal mt-4">Offer valid for 1 hour only</p>
                </>
              ) : (
                <div className="py-8">
                  <div className="w-24 h-24 mx-auto bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-6">
                    <Icon name="frown" className="text-lg text-zinc-400" />
                  </div>
                  <h3 className="font-semibold text-xl text-zinc-900 dark:text-zinc-100 mb-2 tracking-tight">Better Luck Next Time</h3>
                  <p className="text-xs font-medium text-zinc-500 mb-8">You didn't win an offer today. Check back tomorrow for another chance!</p>
                  <button 
                    onClick={handleClose}
                    className="w-full py-4 bg-zinc-900 text-white rounded-full font-semibold  tracking-normal text-[11px] shadow-lg hover:bg-zinc-900 active:scale-95 transition-all"
                  >
                    Got It
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default MysteryBox;
