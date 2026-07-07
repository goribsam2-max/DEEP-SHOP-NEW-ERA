import React, { useState, useEffect } from "react";
import { collection, query, where, getDocs, orderBy, limit, doc, onSnapshot } from "firebase/firestore";
import { db, auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import { Coins, ArrowRight, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { useRegion } from "../components/RegionContext";

export default function MyCoins() {
  const [userData, setUserData] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { formatPrice } = useRegion();

  useEffect(() => {
    if (!auth.currentUser) return;
    const unsub = onSnapshot(doc(db, "users", auth.currentUser.uid), (doc) => setUserData(doc.data()));
    return unsub;
  }, []);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!auth.currentUser) return;
      
      try {
        const historyArr = [];
        // Fetch recent deposits
        const dq = query(collection(db, "deposits"), where("userId", "==", auth.currentUser.uid), orderBy("createdAt", "desc"), limit(10));
        const dSnap = await getDocs(dq);
        dSnap.forEach(d => {
            const data = d.data();
            historyArr.push({
                id: d.id,
                type: 'deposit',
                title: 'Coin Deposit',
                amount: data.amount,
                status: data.status,
                createdAt: data.createdAt,
            });
        });
        
        // Fetch recent orders where VG coin was used or earned
        const oq = query(collection(db, "orders"), where("userId", "==", auth.currentUser.uid), orderBy("orderDate", "desc"), limit(20));
        const oSnap = await getDocs(oq);
        oSnap.forEach(d => {
            const data = d.data();
            // A simplified assumption: if payment method is vgcoin, it was used.
            // Note: In real app, we need explicit logs of coin earning/usage.
            if (data.paymentType === 'vgcoin') {
                historyArr.push({
                    id: d.id,
                    type: 'usage',
                    title: `Used for Order #${d.id.slice(-6)}`,
                    amount: data.totalAmount, // Rough estimate based on logic
                    status: 'completed',
                    createdAt: new Date(data.orderDate).getTime(),
                });
            }
        });

        // Sort combined history safely
        historyArr.sort((a, b) => b.createdAt - a.createdAt);
        setHistory(historyArr);
      } catch (err) {
        console.error("Failed to load history", err);
      }
      setLoading(false);
    };
    
    fetchHistory();
  }, []);

  return (
    <div className="max-w-xl mx-auto px-6 py-8 min-h-screen animate-fade-in">
        <h1 className="text-2xl font-black mb-6 text-zinc-900 dark:text-zinc-100">My DP Coins</h1>
        
        <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-[32px] p-8 text-white mb-8 shadow-xl shadow-orange-500/20 relative overflow-hidden">
            <div className="absolute -right-8 -top-8 opacity-20 transform rotate-12">
               <Coins className="w-48 h-48" />
            </div>
            
            <p className="text-amber-100 font-bold mb-1 relative z-10 flex items-center gap-2">
                Available Balance
            </p>
            <div className="font-black text-5xl tracking-tight relative z-10 flex items-baseline gap-2">
                {userData?.coins || 0} <span className="text-2xl opacity-80">DP</span>
            </div>
            <div className="mt-6 flex items-center gap-3 relative z-10">
                <span className="bg-black/20 backdrop-blur-md px-4 py-2 rounded-xl text-sm font-bold">1 DP Coin = {formatPrice(1)}</span>
            </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
            <button onClick={() => navigate('/deposit')} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors active:scale-95 shadow-sm">
                <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                    <ArrowDownLeft className="w-5 h-5"/>
                </div>
                <span className="font-bold text-sm">Deposit</span>
            </button>
            <button onClick={() => navigate('/bonus')} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors active:scale-95 shadow-sm">
                <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center">
                    <span className="font-black">V</span>
                </div>
                <span className="font-bold text-sm">Earn More</span>
            </button>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[32px] p-6 shadow-sm mb-8">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2">Coin Expiry</h2>
            {userData?.coinBatches && userData.coinBatches.length > 0 ? (
                <div className="flex flex-col gap-4">
                    {userData.coinBatches.map((batch: any, i: number) => (
                        <div key={i} className="flex justify-between items-center py-3 border-b border-zinc-100 dark:border-zinc-800 last:border-0 last:pb-0">
                            <div>
                                <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{batch.type === 'deposit' ? 'Deposit Coins' : 'Earned from Purchase'}</div>
                                <div className="text-xs font-medium text-red-500">Expires: {new Date(batch.expiresAt).toLocaleDateString()}</div>
                            </div>
                            <div className="font-bold text-green-500">
                                {batch.amount} DP
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="py-4 text-center text-zinc-500 font-medium text-sm">No coins with expiry dates.</div>
            )}
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[32px] p-6 shadow-sm">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2">Recent History</h2>
            
            {loading ? (
                <div className="py-10 text-center text-zinc-500 font-medium">Loading history...</div>
            ) : history.length > 0 ? (
                <div className="flex flex-col gap-4">
                    {history.map((h, i) => (
                        <div key={i} className="flex justify-between items-center py-3 border-b border-zinc-100 dark:border-zinc-800 last:border-0 last:pb-0">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${h.type === 'deposit' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                    {h.type === 'deposit' ? <ArrowDownLeft className="w-5 h-5"/> : <ArrowUpRight className="w-5 h-5"/>}
                                </div>
                                <div>
                                    <div className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{h.title}</div>
                                    <div className="text-xs font-medium text-zinc-500">{new Date(h.createdAt).toLocaleDateString()} &middot; {h.status}</div>
                                </div>
                            </div>
                            <div className={`font-bold ${h.type === 'deposit' ? 'text-green-500' : 'text-zinc-900 dark:text-zinc-100'}`}>
                                {h.type === 'deposit' ? '+' : '-'}{h.amount} DP
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="py-10 text-center text-zinc-500 font-medium text-sm">No recent transations found.</div>
            )}
        </div>
    </div>
  );
}
