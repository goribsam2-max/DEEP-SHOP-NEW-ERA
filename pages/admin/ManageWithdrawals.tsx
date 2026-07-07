import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  addDoc,
  getDoc,
} from "firebase/firestore";
import { db } from "../../firebase";
import { WithdrawRequest } from "../../types";
import Icon from "../../components/Icon";
import { useNavigate } from "react-router-dom";
import { useNotify, usePromptModal } from "../../components/Notifications";

const ManageWithdrawals: React.FC = () => {
  const [requests, setRequests] = useState<WithdrawRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const notify = useNotify();
  const prompt = usePromptModal();

  useEffect(() => {
    const q = query(
      collection(db, "withdrawals"),
      orderBy("createdAt", "desc"),
    );
    const unsub = onSnapshot(q, (snapshot) => {
      setRequests(
        snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as WithdrawRequest,
        ),
      );
      setLoading(false);
    });
    return unsub;
  }, []);

  const updateStatus = async (
    request: WithdrawRequest,
    status: "Pending" | "Completed" | "Rejected",
  ) => {
    if (status === "Rejected") {
      prompt({
        title: "Reject Withdrawal",
        message: "Please provide a reason for rejecting this withdrawal request.",
        placeholder: "Reason...",
        required: true,
        confirmText: "Reject",
        onConfirm: async (reason) => {
          try {
            await updateDoc(doc(db, "withdrawals", request.id), { status, reason });
            await addDoc(collection(db, "notifications"), {
              userId: request.userId,
              title: "Withdrawal Rejected",
              message: `Your withdrawal request of ৳${request.amount} has been rejected. \n\nReason: ${reason}`,
              isRead: false,
              createdAt: Date.now(),
              type: "system",
              variant: "rejected-withdrawal",
              reason: reason
            });
            // If they rejected it, should money go back? 
            // In a real app we'd probably refund, but we'll leave that to admin if needed depending on current app logic. 
            // User did not explicitly mention refund logic here, only reason.
            notify(`Status updated to ${status}`, "success");
          } catch (e) {
            notify("Failed to update", "error");
          }
        }
      });
      return;
    }

    try {
      await updateDoc(doc(db, "withdrawals", request.id), { status });
      if (status === "Completed") {
        await addDoc(collection(db, "notifications"), {
          userId: request.userId,
          title: "Withdrawal Completed",
          message: `Your withdrawal request of ৳${request.amount} has been completed successfully!`,
          isRead: false,
          createdAt: Date.now(),
          type: "system",
        });
      }
      notify(`Status updated to ${status}`, "success");
    } catch (e) {
      notify("Failed to update", "error");
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto px-6 py-10 min-h-screen">
      

      <div className="flex flex-col space-y-3 max-w-4xl mx-auto">
        {requests.map((req) => (
          <div
            key={req.id}
            className="flex items-center justify-between gap-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 shadow-sm group hover:border-pink-300 dark:hover:border-pink-800 transition-colors"
          >
            <div className="flex items-start gap-4 pl-2">
              <div className="w-12 h-12 bg-pink-50 dark:bg-zinc-800 text-pink-600 dark:text-pink-400 rounded-xl flex items-center justify-center shrink-0 border border-pink-100 dark:border-zinc-700 shadow-sm">
                <Icon name="money-bill-wave" className="text-xl" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                    ৳{req.amount}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${req.status === "Pending" ? "bg-yellow-100 text-yellow-700" : req.status === "Completed" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                  >
                    {req.status}
                  </span>
                </div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400 font-medium flex gap-2 items-center">
                  <span>{req.accountName}</span>
                  <span>•</span>
                  <span>bKash: {req.bkashNumber}</span>
                  <span>•</span>
                  <span>{new Date(req.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {req.status === "Pending" && (
              <div className="flex items-center space-x-2 pr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => updateStatus(req, "Completed")}
                  className="flex items-center justify-center size-8 rounded-full bg-zinc-100 dark:bg-zinc-800 dark:bg-emerald-900/20 hover:bg-zinc-200 dark:bg-zinc-700 dark:hover:bg-emerald-900/40 transition-colors"
                  title="Mark Completed"
                >
                  <Icon name="check" className="text-xs text-zinc-800 dark:text-zinc-200" />
                </button>
                <button
                  onClick={() => updateStatus(req, "Rejected")}
                  className="flex items-center justify-center size-8 rounded-full bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                  title="Reject"
                >
                  <Icon name="times" className="text-xs text-red-500" />
                </button>
              </div>
            )}
          </div>
        ))}
        {requests.length === 0 && (
          <div className="py-20 text-center text-zinc-400 font-bold tracking-normal text-xs">
            No withdrawal requests
          </div>
        )}
      </div>
    </div>
  );
};
export default ManageWithdrawals;
