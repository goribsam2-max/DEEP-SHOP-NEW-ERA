import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { X, ShoppingCart, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const CartAbandonmentPopup: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showPopup, setShowPopup] = useState(false);
  const [prevPath, setPrevPath] = useState(location.pathname);

  useEffect(() => {
    if (prevPath === "/checkout" && location.pathname !== "/checkout") {
      const cart = JSON.parse(localStorage.getItem("f_cart") || "[]");
      if (cart.length > 0) {
        // User left checkout with items in cart
        setShowPopup(true);
      }
    }
    setPrevPath(location.pathname);
  }, [location.pathname, prevPath]);

  const handleComplete = () => {
    setShowPopup(false);
    navigate("/checkout");
  };

  const handleDismiss = () => {
    setShowPopup(false);
  };

  return (
    <AnimatePresence>
      {showPopup && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-4 md:p-6 bg-black/40 backdrop-blur-sm">
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", bounce: 0.1, duration: 0.5 }}
            className="w-full max-w-md mx-auto"
          >
            <div className="w-full bg-white dark:bg-zinc-900 rounded-[2rem] shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden relative">
              <button
                onClick={handleDismiss}
                className="absolute top-4 right-4 p-2 bg-zinc-100 dark:bg-zinc-800 rounded-full text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="p-6">
                <div className="w-12 h-12 bg-[#1cdb5e]/10 text-[#1cdb5e] rounded-2xl flex items-center justify-center mb-4">
                  <ShoppingCart className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-black text-zinc-900 dark:text-white mb-2 tracking-tight">You left items in your cart!</h3>
                <p className="text-sm text-zinc-500 mb-6 font-medium">
                  Do you want to complete your purchase now or continue shopping for more items?
                </p>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleComplete}
                    className="w-full bg-[#1cdb5e] hover:bg-[#17ba4f] text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition"
                  >
                    Complete Checkout <ChevronRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="w-full bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-bold py-4 rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
                  >
                    Continue Shopping
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
