import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  getDoc,
  addDoc,
} from "firebase/firestore";
import { db } from "../../firebase";
import Icon from "../../components/Icon";
import { useNavigate } from "react-router-dom";
import { useNotify, usePromptModal, useConfirm } from "../../components/Notifications";
import { AffiliateRequest } from "../../types";

const ManageAffiliateRequests: React.FC = () => {
  const [requests, setRequests] = useState<AffiliateRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const notify = useNotify();
  const prompt = usePromptModal();
  const confirm = useConfirm();

  useEffect(() => {
    const q = query(
      collection(db, "affiliate_requests"),
      orderBy("createdAt", "desc"),
    );
    const unsub = onSnapshot(q, (snapshot) => {
      setRequests(
        snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as AffiliateRequest,
        ),
      );
      setLoading(false);
    });
    return unsub;
  }, []);

  const updateStatus = async (
    request: AffiliateRequest,
    newStatus: "approved" | "rejected",
  ) => {
    if (newStatus === "rejected") {
      prompt({
        title: "Reject Request",
        message: "Please provide a reason for rejecting this affiliate request.",
        placeholder: "Reason for rejection...",
        required: true,
        confirmText: "Reject",
        onConfirm: async (reason) => {
          try {
            await updateDoc(doc(db, "affiliate_requests", request.id!), {
              status: "rejected",
              reason: reason,
            });
            await updateDoc(doc(db, "users", request.userId), {
              isAffiliate: false,
              affiliateStatus: "rejected",
            });
            await addDoc(collection(db, "notifications"), {
              userId: request.userId,
              title: "Affiliate Application Rejected",
              message: `Unfortunately, your affiliate application was not approved. \n\nReason: ${reason}`,
              isRead: false,
              createdAt: Date.now(),
              type: "system",
              variant: "rejected-affiliate",
              reason: reason
            });
            notify("Application rejected", "success");
          } catch (e) {
            notify("Failed to reject request", "error");
          }
        }
      });
      return;
    }

    try {
      await updateDoc(doc(db, "affiliate_requests", request.id!), {
        status: newStatus,
      });

      if (newStatus === "approved") {
        const namePart = request.fullName
          .split(" ")[0]
          .toUpperCase()
          .replace(/[^A-Z]/g, "");
        const generatedCode =
          namePart.length >= 2
            ? `AFF-${namePart}`
            : `AFF-${request.userId.substring(0, 6).toUpperCase()}`;
        const userRef = doc(db, "users", request.userId);
        const uDoc = await getDoc(userRef);

        await updateDoc(userRef, {
          isAffiliate: true,
          affiliateStatus: "approved",
          affiliateCode: uDoc.data()?.affiliateCode || generatedCode,
          walletBalance: uDoc.data()?.walletBalance || 0,
        });

        if (!uDoc.data()?.affiliateCode) {
          await addDoc(collection(db, "coupons"), {
            code: generatedCode,
            discount: 5,
            type: "percent",
            maxUses: 999999,
            usedCount: 0,
            isActive: true,
            isAffiliate: true,
            affiliateId: request.userId,
            createdAt: Date.now(),
          });
        }

        await addDoc(collection(db, "notifications"), {
          userId: request.userId,
          title: "Affiliate Application Approved",
          message:
            "Congratulations! Your affiliate application has been approved. You can now start sharing your custom promo code to earn rewards.",
          isRead: false,
          createdAt: Date.now(),
          type: "system",
          variant: "approved-affiliate"
        });
      }
      notify(`Application ${newStatus}`, "success");
    } catch (e) {
      notify("Failed to update application status", "error");
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto px-6 py-10 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 max-w-4xl mx-auto gap-4">
        <div className="flex items-center space-x-6">
          <button
            onClick={() => navigate("/admin/dashboard")}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 transition"
          >
            <Icon name="arrow-left" />
          </button>
          <div>
            <h1 className="text-xl md:text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              Affiliate Requests
            </h1>
            <p className="text-[10px] text-zinc-400 font-bold tracking-normal mt-1">
              Manage Partner Applications
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col space-y-3 max-w-4xl mx-auto">
        {requests.map((req) => (
          <div
            key={req.id}
            className="flex flex-col md:flex-row md:items-center justify-between gap-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 shadow-sm group hover:border-pink-300 dark:hover:border-pink-800 transition-colors"
          >
            <div className="flex items-start gap-4 pl-2">
              <div className="w-12 h-12 bg-pink-50 dark:bg-zinc-800 text-pink-600 dark:text-pink-400 rounded-xl flex items-center justify-center shrink-0 border border-pink-100 dark:border-zinc-700 shadow-sm">
                <Icon name="users" className="text-xl" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                    {req.fullName}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${req.status === "pending" ? "bg-yellow-100 text-yellow-700" : req.status === "approved" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                  >
                    {req.status}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-neutral-500 dark:text-neutral-400">
                  <span>{req.email}</span>
                  <span>•</span>
                  <span>{req.phone}</span>
                  {req.socialUrl && (
                    <>
                      <span>•</span>
                      <a href={req.socialUrl} target="_blank" rel="noreferrer" className="text-indigo-500 hover:underline">{req.platform || 'Link'}</a>
                    </>
                  )}
                  {req.followerCount && (
                    <>
                      <span>•</span>
                      <span>{req.followerCount} followers</span>
                    </>
                  )}
                </div>
                {(req.promotionMethod || req.additionalInfo) && (
                  <div className="mt-2 text-xs text-neutral-500 dark:text-neutral-400 bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-lg border border-zinc-100 dark:border-zinc-800 mb-1">
                    {req.promotionMethod && (
                      <p className="mb-1"><strong>Methods:</strong> {Array.isArray(req.promotionMethod) ? req.promotionMethod.join(', ') : req.promotionMethod}</p>
                    )}
                    {req.additionalInfo && (
                      <p><strong>Info:</strong> {req.additionalInfo}</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {req.status === "pending" && (
              <div className="flex items-center space-x-2 pr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => updateStatus(req, "approved")}
                  className="flex items-center justify-center size-8 rounded-full bg-zinc-100 dark:bg-zinc-800 dark:bg-emerald-900/20 hover:bg-zinc-200 dark:bg-zinc-700 dark:hover:bg-emerald-900/40 transition-colors"
                  title="Approve"
                >
                  <Icon name="check" className="text-xs text-zinc-800 dark:text-zinc-200" />
                </button>
                <button
                  onClick={() => updateStatus(req, "rejected")}
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
            No applications found.
          </div>
        )}
      </div>
    </div>
  );
};
export default ManageAffiliateRequests;
