import React, { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { useNotify } from "../../components/Notifications";

const ManageDeposits: React.FC = () => {
  const [deposits, setDeposits] = useState<any[]>([]);
  const notify = useNotify();

  useEffect(() => {
    const q = query(collection(db, "deposits"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        setDeposits(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const handleUpdate = async (id: string, status: string, userId: string, amount: number) => {
    if (status === 'rejected') {
      const reason = prompt("Enter rejection reason:");
      if (!reason) return;
      try {
        await updateDoc(doc(db, "deposits", id), { status, reason, updatedAt: Date.now() });
        notify("Deposit rejected", "info");
      } catch (err) {
        notify("Error", "error");
      }
    } else if (status === 'approved') {
        try {
            await updateDoc(doc(db, "deposits", id), { status, updatedAt: Date.now() });
            
            // Increment user's coins
            // Assuming user doc ID is userId (if not using auth uid as doc ID, need to fetch user doc)
            // This is a simplified approach, real app might need a transaction
            const userRef = doc(db, "users", userId);
            const { increment, arrayUnion } = await import("firebase/firestore");
            const expiryAt = Date.now() + (30 * 24 * 60 * 60 * 1000); // 30 days
            await updateDoc(userRef, {
                coins: increment(amount),
                coinBatches: arrayUnion({
                    id: Date.now().toString(),
                    amount: amount,
                    expiresAt: expiryAt,
                    type: "deposit"
                })
            });
            notify("Deposit approved and coins added", "success");
        } catch (err) {
            notify("Error", "error");
        }
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 animate-fade-in">
        <h2 className="text-xl font-bold mb-6">Manage Deposits</h2>
        <div className="bg-white dark:bg-zinc-900 rounded-3xl shadow-sm border border-zinc-100 dark:border-zinc-800 p-4">
            {deposits.map(dep => (
                <div key={dep.id} className="p-4 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                    <div>
                        <p className="font-bold text-sm">{dep.userEmail}</p>
                        <p className="text-xs text-zinc-500">Method: {dep.method.toUpperCase()} | TrxID: {dep.trxId}</p>
                        <p className="text-xs text-zinc-500">Amount: ৳{dep.amount}</p>
                        <p className="text-xs text-zinc-500">Status: <span className={`${dep.status === 'pending' ? 'text-amber-500' : dep.status === 'approved' ? 'text-green-500' : 'text-red-500'} font-bold uppercase`}>{dep.status}</span></p>
                        {dep.reason && <p className="text-xs text-red-500 mt-1">Reason: {dep.reason}</p>}
                    </div>
                    {dep.status === 'pending' && (
                        <div className="flex gap-2">
                            <button onClick={() => handleUpdate(dep.id, 'approved', dep.userId, dep.amount)} className="px-3 py-1 bg-green-500 text-white rounded text-xs font-bold">Approve</button>
                            <button onClick={() => handleUpdate(dep.id, 'rejected', dep.userId, dep.amount)} className="px-3 py-1 bg-red-500 text-white rounded text-xs font-bold">Reject</button>
                        </div>
                    )}
                </div>
            ))}
            {deposits.length === 0 && <div className="p-10 text-center text-zinc-500">No deposits found</div>}
        </div>
    </div>
  );
};
export default ManageDeposits;
