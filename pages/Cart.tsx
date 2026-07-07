import { formatPrice } from "@/lib/utils";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Icon from "../components/Icon";
import { CustomSectionEmbed } from "../components/CustomSectionEmbed";
import { useTheme } from "../components/ThemeContext";
import { Button } from "../components/ui/button";
import { auth, db } from "../firebase";
import { query, where, getDocs, collection } from "firebase/firestore";
import { useNotify } from "../components/Notifications";

const Cart: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<any>(null);
  const [promoError, setPromoError] = useState("");
  const [myCoupons, setMyCoupons] = useState<any[]>([]);
  const [showCouponsModal, setShowCouponsModal] = useState(false);
  
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const notify = useNotify();

  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem("f_cart") || "[]");
    setItems(cart);

    const loadVouchers = async () => {
      try {
        if (!auth.currentUser) return;
        const q = query(
          collection(db, "coupons"),
          where("userId", "==", auth.currentUser.uid),
          where("isActive", "==", true)
        );
        const snap = await getDocs(q);
        setMyCoupons(snap.docs.map((d) => ({ id: d.id, ...d.data(), isVoucher: true })));
      } catch (e) {}
    };
    loadVouchers();
  }, []);

  const total = items.reduce(
    (acc, curr) => acc + (curr.discountPrice || curr.price) * curr.quantity,
    0,
  );

  const deliveryCharge = 150; // default delivery charge

  let promoDiscount = 0;
  if (appliedPromo) {
    if (appliedPromo.type === "fixed") {
      promoDiscount = appliedPromo.discount;
    } else if (appliedPromo.type === "percentage") {
      promoDiscount = (total * appliedPromo.discount) / 100;
    }
  }

  const updateQuantity = (index: number, delta: number) => {
    const newItems = [...items];
    newItems[index].quantity = Math.max(1, newItems[index].quantity + delta);
    setItems(newItems);
    localStorage.setItem("f_cart", JSON.stringify(newItems));
  };

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    localStorage.setItem("f_cart", JSON.stringify(newItems));
  };

  const applyPromo = async () => {
    setPromoError("");
    if (!promoCode.trim()) return;
    try {
      const q = query(
        collection(db, "promo_codes"),
        where("code", "==", promoCode.trim().toUpperCase())
      );
      const snap = await getDocs(q);
      if (snap.empty) setPromoError("Invalid promo code");
      else {
        const c = snap.docs[0].data();
        if (!c.isActive) {
          setPromoError("Promo code inactive");
        } else if (c.expiresAt && c.expiresAt < Date.now()) {
          setPromoError("Promo code expired");
        } else if (c.minOrderValue && total < c.minOrderValue) {
          setPromoError(`Min order value is ৳${c.minOrderValue}`);
        } else {
          setAppliedPromo({ id: snap.docs[0].id, ...c, isVoucher: false });
          notify("Promo code applied!", "success");
        }
      }
    } catch (e) {
      setPromoError("Error verifying promo code");
    }
  };
  
  const applyVoucher = (voucher: any) => {
    if (voucher.minOrderValue && total < voucher.minOrderValue) {
      notify(`Minimum order logic value is ৳${voucher.minOrderValue}`, "error");
      return;
    }
    setAppliedPromo(voucher);
    setShowCouponsModal(false);
    notify("Voucher applied!", "success");
  };

  return (
    <div className="bg-zinc-50 dark:bg-[#121212] min-h-screen animate-fade-in relative transition-colors font-sans pb-24">
      {/* Header */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 pb-2">
         <h1 className="text-[2rem] font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-3">
           My Cart
         </h1>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-4 pb-12">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-zinc-900 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 text-center relative z-10 shadow-sm">
            <div className="w-24 h-24 bg-zinc-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-6 border border-zinc-100 dark:border-zinc-700">
              <Icon
                name="shopping-cart"
                className="text-2xl text-zinc-400 dark:text-zinc-500"
              />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mb-2">
              Your cart is empty
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-8 max-w-sm">
              Looks like you haven't added anything to your cart yet. Let's change that!
            </p>
            <button onClick={() => navigate("/")} className="px-8 py-3.5 rounded-full shadow-lg bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 font-bold transition-all border-none">
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-6 relative z-10">
            <div id="cart-products" className="flex flex-col gap-5">
              <AnimatePresence mode="popLayout">
                {items.map((item, idx) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={idx}
                    className="flex items-center gap-4 group"
                  >
                     <div className="w-24 h-24 sm:w-28 sm:h-28 bg-white dark:bg-zinc-900/50 rounded-2xl flex items-center justify-center shrink-0 border border-zinc-100 dark:border-zinc-800 overflow-hidden relative shadow-sm">
                       <img
                         src={item.image}
                         className="w-[80%] h-[80%] object-contain block dark:mix-blend-normal mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
                         alt={item.name}
                       />
                     </div>
                     <div className="flex-1 min-w-0">
                       <div className="flex justify-between items-start mb-1 gap-2">
                         <h4 className="font-bold text-[15px] sm:text-lg tracking-tight text-zinc-900 dark:text-zinc-100 line-clamp-1 leading-tight capitalize">
                           {item.name}
                         </h4>
                         <button
                           onClick={() => removeItem(idx)}
                           className="text-zinc-400 hover:text-red-500 transition-colors shrink-0 p-1"
                         >
                           <Icon name="x" className="text-lg" />
                         </button>
                       </div>
                       
                       <div className="text-xs sm:text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-3 truncate">
                          {item.variant ? item.variant : "Standard"} 
                          {item.brand && ` | ${item.brand}`}
                       </div>
                       
                       <div className="flex justify-between items-center mt-1">
                          <div className="font-black text-lg sm:text-xl text-zinc-900 dark:text-zinc-100 tracking-tight">
                            {formatPrice(item.discountPrice || item.price)}
                          </div>
                          
                          <div className="flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-full h-9 sm:h-10">
                            <button
                              onClick={() => updateQuantity(idx, -1)}
                              className="w-10 sm:w-11 h-full flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors text-lg font-bold"
                            >
                              −
                            </button>
                            <span className="w-6 sm:w-8 text-center text-sm font-bold text-zinc-900 dark:text-zinc-100 select-none">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(idx, 1)}
                              className="w-10 sm:w-11 h-full flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors text-lg font-bold"
                            >
                              +
                            </button>
                          </div>
                       </div>
                     </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Promo / Voucher Section */}
            <div>
               <div className="flex bg-white dark:bg-zinc-900 rounded-full border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden p-1 relative z-10 w-full mb-1">
                 <input 
                   type="text" 
                   value={promoCode}
                   onChange={(e) => setPromoCode(e.target.value)}
                   disabled={!!appliedPromo}
                   placeholder={appliedPromo ? appliedPromo.code : "Promo code (e.g. FESTIVE10)"} 
                   className="flex-1 min-w-0 bg-transparent px-5 py-3 text-sm font-semibold outline-none text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 disabled:opacity-50"
                 />
                 {appliedPromo ? (
                    <button 
                       onClick={() => setAppliedPromo(null)}
                       className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 px-6 py-3 rounded-full text-sm font-bold tracking-wide transition-colors whitespace-nowrap overflow-hidden shrink-0"
                    >
                      Remove
                    </button>
                 ) : (
                    <button 
                       onClick={applyPromo}
                       className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-6 py-3 rounded-full text-[13px] sm:text-sm font-bold tracking-wide transition-transform active:scale-95 whitespace-nowrap overflow-hidden shrink-0"
                    >
                      Apply Code
                    </button>
                 )}
               </div>
               
               {promoError && (
                 <p className="text-xs text-red-500 font-semibold px-4 mt-1">{promoError}</p>
               )}
               
               {myCoupons.length > 0 && !appliedPromo && (
                 <button 
                    onClick={() => setShowCouponsModal(true)}
                    className="flex justify-between items-center w-full px-5 py-4 bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl mt-4 border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors"
                 >
                    <div className="flex items-center gap-3 text-zinc-900 dark:text-zinc-100 font-semibold text-sm">
                       <Icon name="ticket" className="text-zinc-500" />
                       You have {myCoupons.length} vouchers available!
                    </div>
                    <span className="text-xs font-bold bg-zinc-200 dark:bg-zinc-700 px-3 py-1 rounded-full text-zinc-700 dark:text-zinc-300">
                       View All
                    </span>
                 </button>
               )}
            </div>

            {/* Order Summary */}
            <div id="cart-summary" className="mt-2">
              <div className="bg-white dark:bg-zinc-900 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 shadow-sm p-6 sm:p-7">
                <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100 mb-6 tracking-tight">Order Summary</h3>
                
                <div className="space-y-4 text-sm sm:text-base font-semibold">
                  <div className="flex justify-between text-zinc-500 dark:text-zinc-400">
                    <span>Sub Total</span>
                    <span className="text-zinc-900 dark:text-zinc-100">{formatPrice(total)}</span>
                  </div>
                  {appliedPromo && (
                    <div className="flex justify-between text-zinc-500 dark:text-zinc-400">
                      <span>Promo Code Discount</span>
                      <span className="text-red-500">-{formatPrice(promoDiscount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-zinc-500 dark:text-zinc-400">
                    <span>Delivery Charge</span>
                    <span className="text-zinc-900 dark:text-zinc-100">{formatPrice(deliveryCharge)}</span>
                  </div>
                  <div className="pt-5 mt-1 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                    <span className="text-zinc-500 dark:text-zinc-400">Total</span>
                    <span className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
                      {formatPrice(Math.max(0, total + deliveryCharge - promoDiscount))}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-2 text-center pb-4">
               <button
                  className="w-full relative overflow-hidden group rounded-full bg-[#1cdb5e] hover:bg-[#17ba4f] text-white transition-all font-bold tracking-wide border-none shadow-xl hover:shadow-2xl py-4 flex items-center justify-center text-lg active:scale-[0.98]"
                  onClick={() => navigate("/checkout")}
               >
                  <span className="relative z-10 flex items-center justify-center">
                    Proceed to Checkout
                  </span>
               </button>
            </div>
            
          </div>
        )}
        <CustomSectionEmbed location="cart_bottom" />
      </div>

      {showCouponsModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
          >
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center shrink-0">
               <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-100">Your Vouchers</h3>
               <button onClick={() => setShowCouponsModal(false)} className="w-8 h-8 flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 rounded-full text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
                  <Icon name="x" className="text-sm" />
               </button>
            </div>
            <div className="overflow-y-auto p-4 space-y-4">
               {myCoupons.map((voucher) => (
                  <div key={voucher.id} className="border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-4 flex justify-between items-center gap-4">
                     <div>
                        <h4 className="font-bold text-zinc-900 dark:text-zinc-100">{voucher.title}</h4>
                        <p className="text-[11px] font-semibold text-zinc-500 mt-1">Min. order: {formatPrice(voucher.minOrderValue || 0)}</p>
                     </div>
                     <button
                       onClick={() => applyVoucher(voucher)}
                       className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap shrink-0 active:scale-95"
                     >
                       Apply
                     </button>
                  </div>
               ))}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Cart;
