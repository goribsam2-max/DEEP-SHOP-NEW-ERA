import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "../components/Icon";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, arrayUnion } from "firebase/firestore";
import { db, auth } from "../firebase";
import { useNotify } from "../components/Notifications";
import { formatPrice } from "../lib/utils";

const Coupon: React.FC = () => {
  const navigate = useNavigate();
  const notify = useNotify();
  const [coupons, setCoupons] = useState<any[]>([]);
  const [userData, setUserData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"Available" | "Used" | "Expired">("Available");

  useEffect(() => {
    const q = query(collection(db, "coupons"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        setCoupons(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (auth.currentUser) {
        const unsub = onSnapshot(doc(db, "users", auth.currentUser.uid), (docSnap) => {
            if (docSnap.exists()) setUserData(docSnap.data());
        });
        return () => unsub();
    }
  }, []);

  const handleClaim = async (couponId: string) => {
    if (!auth.currentUser) {
        notify("Please login to claim vouchers", "error");
        return;
    }
    try {
        await updateDoc(doc(db, "users", auth.currentUser.uid), {
            claimedCoupons: arrayUnion(couponId)
        });
        notify("Voucher claimed successfully! You can use it at checkout", "success");
    } catch (err) {
        notify("Failed to claim voucher", "error");
    }
  };

  const filteredCoupons = coupons.filter(c => {
    const isExpired = c.expiresAt && c.expiresAt < Date.now();
    const isClaimed = userData?.claimedCoupons?.includes(c.id);
    const isUsed = userData?.usedCoupons?.includes(c.id);
    
    if (activeTab === "Available") return !isExpired && !isUsed;
    if (activeTab === "Used") return isClaimed || isUsed;
    if (activeTab === "Expired") return isExpired;
    return false;
  });

  return (
    <div className="max-w-2xl mx-auto p-6 md:py-6 animate-fade-in min-h-screen bg-zinc-50 dark:bg-zinc-800">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="w-10"></div>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Coupons</h1>
        <button className="w-10 h-10 bg-white dark:bg-zinc-900 rounded-full flex items-center justify-center border border-zinc-100 dark:border-zinc-800 shadow-sm">
          <Icon name="ellipsis-h" className="text-zinc-900 dark:text-zinc-100" />
        </button>
      </div>

      <div className="flex bg-white dark:bg-zinc-900 rounded-[24px] p-1.5 mb-8 border border-zinc-100 dark:border-zinc-800 shadow-sm gap-1">
        {["Available", "Used", "Expired"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`flex-1 text-center py-3 rounded-full text-sm font-bold transition-all ${
              activeTab === tab
                ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-md"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 bg-transparent"
            }`}
          >
            {tab === "Used" ? "Claimed" : tab}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredCoupons.map((c, i) => {
          const isExpired = c.expiresAt && c.expiresAt < Date.now();
          const isClaimed = userData?.claimedCoupons?.includes(c.id);
          const isUsed = userData?.usedCoupons?.includes(c.id);
          
          return (
            <div key={i} className={`relative bg-amber-500/10 dark:bg-amber-900/10 rounded-[20px] overflow-hidden border border-amber-200 dark:border-amber-900 flex shadow-sm ${(isExpired || isUsed) ? "opacity-60 grayscale" : ""}`}>
                {(isClaimed || isUsed) && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/30 dark:bg-black/30 backdrop-blur-[1px]">
                    <div className={`border-[3px] md:border-4 font-black text-2xl md:text-3xl tracking-widest uppercase px-4 py-1.5 md:px-6 md:py-2 rounded-[8px] transform -rotate-12 select-none shadow-sm opacity-90 mix-blend-multiply dark:mix-blend-screen bg-transparent ${isUsed ? "border-zinc-500 text-zinc-500" : "border-red-500 text-red-500"}`}>
                      {isUsed ? "Used" : "Claimed"}
                    </div>
                  </div>
                )}
                
                {/* Left section - Discount */}
                <div className="w-[100px] md:w-[120px] bg-amber-500 text-white flex flex-col justify-center items-center p-4 relative shrink-0">
                    <span className="text-2xl md:text-3xl font-black">{c.type === 'percent' ? `${c.discount}%` : `${formatPrice(c.discount)}`}</span>
                    <span className="text-xs font-bold tracking-wider uppercase mt-1">OFF</span>
                    
                    {/* Jagged edge */}
                    <div className="absolute right-0 top-0 bottom-0 w-2 flex flex-col justify-between translate-x-1/2 py-1">
                        {[...Array(12)].map((_, j) => (
                            <div key={j} className="w-2.5 h-2.5 bg-zinc-50 dark:bg-[#0a0a0b] rounded-full my-0.5"></div>
                        ))}
                    </div>
                </div>
                
                {/* Right section - Details */}
                <div className="p-4 flex-1 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-zinc-900 ml-[5px]">
                    <div>
                        <h3 className="font-bold text-lg mb-1 text-zinc-900 dark:text-zinc-100">{c.code}</h3>
                        <p className="text-xs text-zinc-500">
                            {c.minOrderAmount > 0 ? `For orders over ${formatPrice(c.minOrderAmount)}` : "No minimum order amount"}
                            {c.expiresAt && <span className={`block mt-1 ${isExpired ? 'text-red-500 font-bold' : ''}`}>{isExpired ? "EXPIRED" : `Valid until: ${new Date(c.expiresAt).toLocaleDateString()}`}</span>}
                        </p>
                    </div>
                    
                    <button 
                        onClick={() => !isClaimed && !isExpired && !isUsed && handleClaim(c.id)}
                        disabled={isExpired || isClaimed || isUsed}
                        className={`whitespace-nowrap px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider disabled:opacity-50 active:scale-95 transition-all relative z-0 ${isClaimed || isUsed ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500' : 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900'}`}
                    >
                      {isUsed ? "Used" : isClaimed ? "Claimed" : isExpired ? "Expired" : "Claim"}
                    </button>
                </div>
            </div>
        )})}
        {filteredCoupons.length === 0 && (
            <div className="py-20 text-center">
                <p className="text-zinc-500">No active coupons available at the moment.</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default Coupon;
