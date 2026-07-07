import React, { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { useNotify, useConfirm } from "../../components/Notifications";
import Icon from "../../components/Icon";

const ManagePasswordResets: React.FC = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const notify = useNotify();
  const confirm = useConfirm();

  useEffect(() => {
    const q = query(collection(db, "passwordResets"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setRequests(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  const markResolved = async (id: string, currentStatus: string) => {
    try {
      await updateDoc(doc(db, "passwordResets", id), {
        status: currentStatus === "pending" ? "resolved" : "pending"
      });
      notify(currentStatus === "pending" ? "Marked as resolved" : "Marked as pending", "success");
    } catch (e) {
      notify("Failed to update status", "error");
    }
  };

  const deleteRequest = async (id: string) => {
    if (await confirm("Are you sure you want to delete this log?")) {
      await deleteDoc(doc(db, "passwordResets", id));
      notify("Deleted successfully", "success");
    }
  };

  if (loading) return <div className="p-10 text-center text-sm font-bold opacity-50">Loading requests...</div>;

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
         <h1 className="text-2xl font-bold tracking-tight">Password Reset Requests</h1>
      </div>

      <div className="grid gap-4">
        {requests.length === 0 && (
           <div className="p-10 text-center text-sm font-bold opacity-50 border border-dashed rounded-2xl">
              No reset requests found.
           </div>
        )}
        {requests.map(req => (
          <div key={req.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
             <div>
                <p className="font-bold text-sm mb-1">{req.displayName} <span className="opacity-50 font-normal">({req.status})</span></p>
                <p className="text-xs font-mono opacity-70 mb-1">📞 {req.phoneNumber || 'N/A'}</p>
                <p className="text-xs font-mono opacity-70 mb-3">📧 {req.email}</p>
                <p className="text-[10px] opacity-50 uppercase tracking-widest">{new Date(req.createdAt).toLocaleString()}</p>
             </div>
             
             <div className="flex items-center gap-2">
                <button
                   onClick={() => markResolved(req.id, req.status)}
                   className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors ${req.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}
                >
                   {req.status === 'pending' ? 'Mark Resolved' : 'Mark Pending'}
                </button>
                <button
                   onClick={() => deleteRequest(req.id)}
                   className="p-2 border border-red-200 text-red-500 rounded-xl hover:bg-red-50 transition-colors"
                >
                   <Icon name="trash" />
                </button>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ManagePasswordResets;
