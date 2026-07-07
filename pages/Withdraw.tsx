import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import {
  doc,
  updateDoc,
  collection,
  addDoc,
  query,
  where,
  getDocs,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { UserProfile } from "../types";
import Icon from "../components/Icon";
import { useNotify } from "../components/Notifications";
import { sendWithdrawalRequestToTelegram } from "../services/telegram";
import { formatPrice } from "../lib/utils";

import { Wallet, CheckCircle2, History, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const WithdrawPage: React.FC<{ userData: UserProfile | null }> = ({
  userData,
}) => {
  const navigate = useNavigate();
  const notify = useNotify();
  const [withdrawAmount, setWithdrawAmount] = useState("");
  
  // Method state
  const [method, setMethod] = useState("bkash");
  
  // Fields for bkash/nagad
  const [mobileNumber, setMobileNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  
  // Fields for bank
  const [bankName, setBankName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [routingNumber, setRoutingNumber] = useState("");
  
  const [submittingWithdraw, setSubmittingWithdraw] = useState(false);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [configs, setConfigs] = useState<any>(null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  const region = localStorage.getItem("user_region") || "BD";
  const isForeign = region === "IN" || region === "PK";

  useEffect(() => {
    // Fetch configs
    import("firebase/firestore").then(({ getDoc, doc }) => {
      getDoc(doc(db, "settings", "platform")).then((snap) => {
        if (snap.exists()) setConfigs(snap.data());
      });
    });

    if (!userData) {
      if (!auth.currentUser) navigate("/auth-selector");
      return;
    }

    const unsub = onSnapshot(
      query(
        collection(db, "withdrawals"),
        where("userId", "==", userData.uid),
        orderBy("createdAt", "desc"),
      ),
      (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));
        setWithdrawals(list);
      },
    );

    if (isForeign) {
      setMethod("bank");
    }

    return () => unsub();
  }, [userData, navigate, isForeign]);

  const handleWithdraw = async () => {
    if (!userData) return;
    const amount = Number(withdrawAmount);
    const minWithdrawal = configs?.affiliateMinWithdrawal ?? 50;

    if (!amount || amount < minWithdrawal)
      return notify(`Minimum withdraw is ${formatPrice(minWithdrawal, region)}`, "error");
    if (amount > (userData.walletBalance || 0))
      return notify("Insufficient balance", "error");
      
    let withdrawData: any = {
      userId: userData.uid,
      amount,
      method,
      status: "Pending",
      createdAt: Date.now(),
    };

    if (isForeign || method === "bank") {
      if (!bankName) return notify("Enter bank name", "error");
      if (!accountName) return notify("Enter account name", "error");
      if (!bankAccountNumber) return notify("Enter account number", "error");
      if (!routingNumber) return notify("Enter routing number", "error");
      
      withdrawData = {
        ...withdrawData,
        bankName,
        accountName,
        bankAccountNumber,
        routingNumber,
      };
    } else {
      if (!mobileNumber || mobileNumber.length < 11)
        return notify("Enter valid mobile number", "error");
      if (!accountName) return notify("Enter account name", "error");
      
      withdrawData = {
        ...withdrawData,
        bkashNumber: mobileNumber,
        accountName,
      };
    }

    setSubmittingWithdraw(true);
    try {
      await addDoc(collection(db, "withdrawals"), withdrawData);
      await updateDoc(doc(db, "users", userData.uid), {
        walletBalance: (userData.walletBalance || 0) - amount,
      });

      sendWithdrawalRequestToTelegram({
        userId: userData.uid,
        userName: userData.displayName || "Unknown",
        amount,
        method: method,
        accountNumber: isForeign || method === "bank" ? bankAccountNumber : mobileNumber,
        createdAt: Date.now(),
      });

      setShowSuccessPopup(true);
      setWithdrawAmount("");
      setMobileNumber("");
      setAccountName("");
      setBankName("");
      setBankAccountNumber("");
      setRoutingNumber("");
    } catch (e) {
      notify("Failed to submit request", "error");
    }
    setSubmittingWithdraw(false);
  };

  if (!userData)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Icon name="spinner-third" className="animate-spin text-xl" />
      </div>
    );

  const totalWithdrawn = withdrawals.filter(w => w.status === 'Completed').reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#121212] font-sans relative">
      {/* Green Header Section */}
      <div className="bg-gradient-to-br from-[#1cdb5e] to-[#0ba340] dark:from-[#1cdb5e]/90 dark:to-[#0ba340]/90 pt-6 pb-20 px-6 rounded-b-[2rem] text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 opacity-10 pointer-events-none">
           <svg width="400" height="400" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
              <path fill="#ffffff" d="M45.7,-76.4C58.9,-69.3,69.1,-55.3,77.7,-40.7C86.3,-26.1,93.4,-10.8,92.6,4.1C91.8,19,83.1,33.5,72.6,45.4C62.1,57.3,49.8,66.6,35.6,73.1C21.4,79.6,5.3,83.3,-9.7,81.1C-24.7,78.9,-38.6,70.8,-48.9,59.9C-59.2,49,-65.9,35.3,-71.4,20.8C-76.9,6.3,-81.1,-9,-77.8,-22.4C-74.5,-35.8,-63.7,-47.3,-50.9,-54.8C-38.1,-62.3,-23.3,-65.8,-8,-66.4C7.3,-67,24,-64.7,32.5,-83.5L45.7,-76.4Z" transform="translate(100 100) scale(1.1)" />
           </svg>
        </div>
        
        <div className="max-w-3xl mx-auto relative z-10">
          <div className="flex items-center justify-between mb-8">
            <button 
              onClick={() => navigate('/affiliate')} 
              className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white/20 hover:bg-white/30 backdrop-blur-md transition-colors active:scale-95"
            >
               <Icon name="arrow-left" className="text-white text-sm" />
            </button>
            <span className="font-semibold text-lg tracking-tight">Withdraw Funds</span>
            <div className="w-10"></div>
          </div>

          <div className="flex justify-between items-end mb-4">
            <div>
              <p className="text-white/80 font-medium text-sm mb-1 tracking-wide">Available Balance</p>
              <h1 className="text-[2.75rem] font-black tracking-tight leading-none">
                {formatPrice(userData.walletBalance || 0, region)}
              </h1>
            </div>
            <div className="text-right">
              <p className="text-white/80 font-medium text-sm mb-1 tracking-wide">Withdrawn</p>
              <h2 className="text-2xl font-bold tracking-tight">
                {formatPrice(totalWithdrawn, region)}
              </h2>
            </div>
          </div>
          
          <div className="flex justify-between items-center bg-white/20 rounded-2xl p-4 backdrop-blur-sm">
             <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-white" />
                <span className="font-semibold text-sm">Verified Account</span>
             </div>
             <div className="flex items-center gap-3">
                <History className="w-5 h-5 text-white" />
                <span className="font-semibold text-sm">{withdrawals.length} Requests</span>
             </div>
          </div>
        </div>
      </div>

      {/* Main Content Card positioned to overlap header */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 relative -mt-8 z-20 pb-20">
        <div className="bg-white dark:bg-[#1e1e1e] rounded-[2rem] shadow-xl p-6 sm:p-8 border border-gray-100 dark:border-zinc-800">
          <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-6">Request Payout</h3>
          
          <div className="space-y-6">
            <div>
              <label className="text-sm font-semibold text-zinc-500 tracking-wide mb-2 block">
                Amount to Withdraw
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={configs?.affiliateMinWithdrawal ?? 50}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-zinc-50 dark:bg-[#121212] border-2 border-transparent focus:border-[#1cdb5e] dark:focus:border-[#1cdb5e] px-5 py-4 rounded-2xl outline-none font-bold text-2xl text-zinc-900 dark:text-white transition-all"
                />
                <span className="absolute right-5 top-1/2 -translate-y-1/2 font-bold text-zinc-400">
                  {region === "BD" ? "BDT" : region === "IN" ? "INR" : region === "PK" ? "PKR" : "USD"}
                </span>
              </div>
            </div>
            
            {isForeign ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-zinc-500 tracking-wide uppercase mb-2 block">Bank Name</label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="Bank Name"
                    className="w-full bg-zinc-50 dark:bg-[#121212] border border-zinc-200 dark:border-zinc-800 px-4 py-3.5 rounded-xl outline-none font-medium text-zinc-900 dark:text-white focus:border-[#1cdb5e]"
                  />
                </div>
                <div>
                   <label className="text-xs font-semibold text-zinc-500 tracking-wide uppercase mb-2 block">Account Name</label>
                   <input
                     type="text"
                     value={accountName}
                     onChange={(e) => setAccountName(e.target.value)}
                     placeholder="Account Name"
                     className="w-full bg-zinc-50 dark:bg-[#121212] border border-zinc-200 dark:border-zinc-800 px-4 py-3.5 rounded-xl outline-none font-medium text-zinc-900 dark:text-white focus:border-[#1cdb5e]"
                   />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-500 tracking-wide uppercase mb-2 block">Account Number</label>
                  <input
                    type="text"
                    value={bankAccountNumber}
                    onChange={(e) => setBankAccountNumber(e.target.value)}
                    placeholder="Account Number"
                    className="w-full bg-zinc-50 dark:bg-[#121212] border border-zinc-200 dark:border-zinc-800 px-4 py-3.5 rounded-xl outline-none font-medium text-zinc-900 dark:text-white focus:border-[#1cdb5e]"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-500 tracking-wide uppercase mb-2 block">Routing/IFSC</label>
                  <input
                    type="text"
                    value={routingNumber}
                    onChange={(e) => setRoutingNumber(e.target.value)}
                    placeholder="Routing Code"
                    className="w-full bg-zinc-50 dark:bg-[#121212] border border-zinc-200 dark:border-zinc-800 px-4 py-3.5 rounded-xl outline-none font-medium text-zinc-900 dark:text-white focus:border-[#1cdb5e]"
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="flex bg-zinc-100 dark:bg-[#121212] p-1 rounded-2xl mb-4">
                  <button 
                    onClick={() => setMethod("bkash")}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${method === 'bkash' ? 'bg-white dark:bg-[#2a2a2a] text-pink-600 shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                  >
                    bKash
                  </button>
                  <button 
                    onClick={() => setMethod("nagad")}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${method === 'nagad' ? 'bg-white dark:bg-[#2a2a2a] text-orange-600 shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                  >
                    Nagad
                  </button>
                  <button 
                    onClick={() => setMethod("bank")}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${method === 'bank' ? 'bg-white dark:bg-[#2a2a2a] text-blue-600 shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                  >
                    Bank
                  </button>
                </div>

                {method === "bank" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <input
                        type="text"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        placeholder="Bank Name"
                        className="w-full bg-zinc-50 dark:bg-[#121212] border border-zinc-200 dark:border-zinc-800 px-4 py-3.5 rounded-xl outline-none font-medium text-zinc-900 dark:text-white focus:border-[#1cdb5e]"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={accountName}
                        onChange={(e) => setAccountName(e.target.value)}
                        placeholder="Account Name"
                        className="w-full bg-zinc-50 dark:bg-[#121212] border border-zinc-200 dark:border-zinc-800 px-4 py-3.5 rounded-xl outline-none font-medium text-zinc-900 dark:text-white focus:border-[#1cdb5e]"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={bankAccountNumber}
                        onChange={(e) => setBankAccountNumber(e.target.value)}
                        placeholder="Account Number"
                        className="w-full bg-zinc-50 dark:bg-[#121212] border border-zinc-200 dark:border-zinc-800 px-4 py-3.5 rounded-xl outline-none font-medium text-zinc-900 dark:text-white focus:border-[#1cdb5e]"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={routingNumber}
                        onChange={(e) => setRoutingNumber(e.target.value)}
                        placeholder="Routing Code"
                        className="w-full bg-zinc-50 dark:bg-[#121212] border border-zinc-200 dark:border-zinc-800 px-4 py-3.5 rounded-xl outline-none font-medium text-zinc-900 dark:text-white focus:border-[#1cdb5e]"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-zinc-500 tracking-wide uppercase mb-2 block">
                        Mobile Number ({method})
                      </label>
                      <input
                        type="tel"
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value)}
                        placeholder="01XXXXXXXXX"
                        className="w-full bg-zinc-50 dark:bg-[#121212] border border-zinc-200 dark:border-zinc-800 px-4 py-3.5 rounded-xl outline-none font-medium text-zinc-900 dark:text-white focus:border-[#1cdb5e]"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-zinc-500 tracking-wide uppercase mb-2 block">
                        Account Name
                      </label>
                      <input
                        type="text"
                        value={accountName}
                        onChange={(e) => setAccountName(e.target.value)}
                        placeholder="Account Name"
                        className="w-full bg-zinc-50 dark:bg-[#121212] border border-zinc-200 dark:border-zinc-800 px-4 py-3.5 rounded-xl outline-none font-medium text-zinc-900 dark:text-white focus:border-[#1cdb5e]"
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            <button
              onClick={handleWithdraw}
              disabled={submittingWithdraw}
              className="w-full bg-[#1cdb5e] hover:bg-[#18c454] text-white py-4 rounded-xl font-bold tracking-wide transition-colors disabled:opacity-50 flex items-center justify-center mt-2 shadow-sm shadow-[#1cdb5e]/20"
            >
              {submittingWithdraw ? (
                <Icon name="spinner-third" className="animate-spin text-xl" />
              ) : (
                "Withdraw"
              )}
            </button>
          </div>
        </div>
        
        {/* Withdrawals List */}
        <div className="mt-8">
           <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-4 px-2 tracking-tight">Recent Payouts</h3>
           <div className="bg-white dark:bg-[#1e1e1e] rounded-[2rem] shadow-sm border border-gray-100 dark:border-zinc-800 overflow-hidden">
             {withdrawals.length === 0 ? (
                <div className="p-8 text-center text-zinc-500">
                   No withdrawals yet.
                </div>
             ) : (
                <div className="divide-y divide-gray-100 dark:divide-zinc-800">
                   {withdrawals.map((w, index) => (
                      <div key={w.id} className="p-4 sm:p-5 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-[#252525] transition-colors">
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-zinc-400">
                               {index + 1}
                            </div>
                            <div>
                               <p className="font-bold text-zinc-900 dark:text-white text-sm">
                                  {w.method === "bank" ? w.bankAccountNumber : w.bkashNumber}
                               </p>
                               <span className={`text-[10px] font-bold uppercase tracking-wider ${w.status === "Completed" ? "text-[#1cdb5e]" : w.status === "Rejected" ? "text-red-500" : "text-orange-500"}`}>
                                  {w.status}
                               </span>
                            </div>
                         </div>
                         <div className="text-right">
                            <p className="font-bold text-zinc-900 dark:text-white">
                               {formatPrice(w.amount, region)}
                            </p>
                            <p className="text-xs text-zinc-500 font-medium">
                               {new Date(w.createdAt).toLocaleDateString()}
                            </p>
                         </div>
                      </div>
                   ))}
                </div>
             )}
           </div>
        </div>
      </div>

      <AnimatePresence>
        {showSuccessPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-zinc-900 rounded-[2rem] p-8 max-w-sm w-full text-center relative shadow-2xl"
            >
              <button 
                onClick={() => setShowSuccessPopup(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              
              <div className="w-20 h-20 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                 <Icon name="check-circle" className="text-5xl text-[#1cdb5e]" />
              </div>
              
              <h2 className="text-2xl font-black text-zinc-900 dark:text-white mb-2">Payout Request Sent!</h2>
              <p className="text-zinc-600 dark:text-zinc-400 font-medium text-sm mb-8 leading-relaxed">
                Your request has been placed successfully and will be processed shortly. Allow up to 24-48 hours.
              </p>
              
              <div className="flex gap-3">
                 <button 
                   onClick={() => setShowSuccessPopup(false)}
                   className="flex-1 py-3.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-bold rounded-xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                 >
                   Close
                 </button>
                 <button 
                   onClick={() => {
                     setShowSuccessPopup(false);
                     navigate('/affiliate');
                   }}
                   className="flex-1 py-3.5 bg-[#1cdb5e] text-white font-bold rounded-xl shadow-sm hover:bg-[#18c454] transition-colors"
                 >
                   Dashboard
                 </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WithdrawPage;

