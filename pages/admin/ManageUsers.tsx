import React, { useState, useEffect } from "react";
import {
  collection,
  onSnapshot,
  updateDoc,
  doc,
  getDoc,
  query,
  orderBy,
} from "firebase/firestore";
import { db, auth } from "../../firebase";
import { UserProfile } from "../../types";
import { useNotify, useConfirm } from "../../components/Notifications";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Modal from "../../components/ui/modal-drop";
import Icon from "../../components/Icon";

const ManageUsers: React.FC = () => {
  const navigate = useNavigate();
  const notify = useNotify();
  const confirm = useConfirm();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState("");
  const [detailModal, setDetailModal] = useState<{
    isOpen: boolean;
    user: UserProfile | null;
  }>({ isOpen: false, user: null });
  const [customWalletAmount, setCustomWalletAmount] = useState<string>("");
  const [kycRequest, setKycRequest] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snap) => {
      setUsers(snap.docs.map((d) => ({ uid: d.id, ...d.data() }) as UserProfile));
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!detailModal.user) {
      setKycRequest(null);
      setRejectReason("");
      setShowRejectInput(false);
      return;
    }
    const fetchKyc = async () => {
      try {
        const snap = await getDoc(doc(db, "kyc_requests", detailModal.user!.uid));
        if (snap.exists()) {
          setKycRequest(snap.data());
        } else {
          setKycRequest(null);
        }
      } catch (err) {
        console.error("Failed to fetch kyc request", err);
      }
    };
    fetchKyc();
  }, [detailModal.user]);

  const toggleBan = async (uid: string, currentStatus: boolean) => {
    await updateDoc(doc(db, "users", uid), { isBanned: !currentStatus });
    notify(currentStatus ? "User unblocked" : "User blocked", "info");
  };

  const [userPasswordReset, setUserPasswordReset] = useState<string>("");

  const handleResetPassword = async (uid: string) => {
    if (!userPasswordReset || userPasswordReset.length < 6) {
      return notify("Password must be at least 6 characters", "error");
    }
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid,
          newPassword: userPasswordReset,
          adminToken: token,
        }),
      });
      const data = await res.json();
      if (data.success) {
        notify("Password changed successfully", "success");
        setUserPasswordReset("");
      } else {
        notify(data.error || "Failed to change password", "error");
      }
    } catch (e) {
      notify("Failed to change password", "error");
    }
  };

  const updateWalletBalance = async (uid: string, newBalance: number) => {
    try {
      await updateDoc(doc(db, "users", uid), {
        walletBalance: Math.max(0, newBalance),
      });
      if (detailModal.user && detailModal.user.uid === uid) {
        setDetailModal({
          ...detailModal,
          user: { ...detailModal.user, walletBalance: Math.max(0, newBalance) },
        });
      }
      notify("Wallet balance updated", "success");
    } catch (e) {
      notify("Failed to update wallet", "error");
    }
  };

  const removeAffiliate = async (uid: string) => {
    confirm({
      title: "Remove Affiliate",
      message:
        "Are you sure you want to remove this user from the affiliate program?",
      onConfirm: async () => {
        try {
          await updateDoc(doc(db, "users", uid), {
            isAffiliate: false,
            affiliateStatus: "rejected",
          });
          if (detailModal.user && detailModal.user.uid === uid) {
            setDetailModal({
              ...detailModal,
              user: {
                ...detailModal.user,
                isAffiliate: false,
                affiliateStatus: "rejected",
              },
            });
          }
          notify("User removed from affiliate program", "success");
        } catch (e) {
          notify("Error removing affiliate", "error");
        }
      },
    });
  };

  const addAffiliate = async (uid: string) => {
    confirm({
      title: "Add Affiliate",
      message:
        "Are you sure you want to add this user to the affiliate program?",
      onConfirm: async () => {
        try {
          await updateDoc(doc(db, "users", uid), {
            isAffiliate: true,
            affiliateStatus: "approved",
          });
          if (detailModal.user && detailModal.user.uid === uid) {
            setDetailModal({
              ...detailModal,
              user: {
                ...detailModal.user,
                isAffiliate: true,
                affiliateStatus: "approved",
              },
            });
          }
          notify("User added to affiliate program", "success");
        } catch (e) {
          notify("Error adding affiliate", "error");
        }
      },
    });
  };

  const updateRole = async (uid: string, newRole: 'user' | 'seller' | 'admin' | 'staff') => {
    try {
      await updateDoc(doc(db, "users", uid), { role: newRole });
      if (detailModal.user && detailModal.user.uid === uid) {
        setDetailModal({
          ...detailModal,
          user: { ...detailModal.user, role: newRole }
        });
      }
      notify(`Role updated to ${newRole}`, "success");
    } catch (e) {
      notify("Failed to update role", "error");
    }
  };

  const updateCustomRating = async (uid: string, ratingVal: number) => {
    try {
      // Keep rating between 0 and 5
      const rating = Math.min(5, Math.max(0, Number(ratingVal.toFixed(1))));
      await updateDoc(doc(db, "users", uid), { customRating: rating });
      if (detailModal.user && detailModal.user.uid === uid) {
        setDetailModal({
          ...detailModal,
          user: { ...detailModal.user, customRating: rating } as any
        });
      }
      notify(`Custom Rating updated to ${rating}`, "success");
    } catch (e) {
      notify("Failed to update custom rating", "error");
    }
  };

  const toggleRegisteredBadge = async (uid: string, current: boolean) => {
    try {
      await updateDoc(doc(db, "users", uid), { isRegisteredBadge: !current });
      if (detailModal.user && detailModal.user.uid === uid) {
        setDetailModal({
          ...detailModal,
          user: { ...detailModal.user, isRegisteredBadge: !current }
        });
      }
      notify(!current ? "Registered Badge granted" : "Registered Badge removed", "success");
    } catch (e) {
      notify("Failed to update Registered Badge", "error");
    }
  };

  const toggleVerifiedBadge = async (uid: string, current: boolean) => {
    try {
      const nextVal = !current;
      await updateDoc(doc(db, "users", uid), { 
        isVerifiedBadge: nextVal,
        kycStatus: nextVal ? "verified" : "none"
      });
      if (detailModal.user && detailModal.user.uid === uid) {
        setDetailModal({
          ...detailModal,
          user: { ...detailModal.user, isVerifiedBadge: nextVal, kycStatus: nextVal ? "verified" : "none" }
        });
      }
      notify(nextVal ? "Verified Badge granted" : "Verified Badge removed", "success");
    } catch (e) {
      notify("Failed to update Verified Badge", "error");
    }
  };

  const handleApproveKyc = async (uid: string) => {
    confirm({
      title: "Approve KYC Verification",
      message: "Are you sure you want to approve this seller's identity? They will receive a Verified Badge and their role will be updated to Seller.",
      onConfirm: async () => {
        try {
          await updateDoc(doc(db, "users", uid), {
            kycStatus: "verified",
            role: "seller"
          });
          await updateDoc(doc(db, "kyc_requests", uid), {
            status: "verified"
          });
          if (detailModal.user && detailModal.user.uid === uid) {
            setDetailModal({
              ...detailModal,
              user: {
                ...detailModal.user,
                kycStatus: "verified",
                role: "seller"
              }
            });
          }
          setKycRequest(prev => prev ? { ...prev, status: "verified" } : null);
          notify("KYC Verification approved successfully! User is now a registered Seller.", "success");
        } catch (e) {
          notify("Failed to approve KYC", "error");
        }
      }
    });
  };

  const handleRejectKyc = async (uid: string) => {
    if (!rejectReason.trim()) {
      setShowRejectInput(true);
      notify("Please provide a rejection reason", "error");
      return;
    }
    confirm({
      title: "Reject KYC Verification",
      message: `Are you sure you want to reject this seller's identity for the following reason?\n\n"${rejectReason}"`,
      onConfirm: async () => {
        try {
          await updateDoc(doc(db, "users", uid), {
            kycStatus: "rejected",
            kycRejectReason: rejectReason
          });
          await updateDoc(doc(db, "kyc_requests", uid), {
            status: "rejected",
            rejectReason: rejectReason
          });
          if (detailModal.user && detailModal.user.uid === uid) {
            setDetailModal({
              ...detailModal,
              user: {
                ...detailModal.user,
                kycStatus: "rejected"
              }
            });
          }
          setKycRequest(prev => prev ? { ...prev, status: "rejected", rejectReason } : null);
          setShowRejectInput(false);
          setRejectReason("");
          notify("KYC Verification rejected successfully with reason", "info");
        } catch (e) {
          notify("Failed to reject KYC", "error");
        }
      }
    });
  };

  const [filterType, setFilterType] = useState<"all" | "sellers" | "pending_kyc" | "affiliates">("all");

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.displayName?.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.ipAddress?.includes(search);
    
    const matchesFilter =
      filterType === "all" ||
      (filterType === "affiliates" && u.isAffiliate) ||
      (filterType === "sellers" && (u.role === "seller" || u.kycStatus === "verified")) ||
      (filterType === "pending_kyc" && u.kycStatus === "pending");
      
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="max-w-[1440px] mx-auto px-6 md:px-12 py-10 min-h-screen bg-[#FDFDFD]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-12">
        <div className="flex items-center space-x-6">
          <div>
            <h1 className="text-xl md:text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              User List
            </h1>
            <p className="text-[10px] text-zinc-400 font-bold tracking-normal mt-1">
              Manage Customer Access
            </p>
          </div>
          <div className="flex bg-zinc-100 dark:bg-zinc-800 p-1 rounded-xl flex-wrap gap-1">
            <button
              onClick={() => setFilterType("all")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${filterType === "all" ? "bg-white dark:bg-zinc-900 shadow-sm text-zinc-900 dark:text-zinc-100" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"}`}
            >
              All Users
            </button>
            <button
              onClick={() => setFilterType("sellers")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${filterType === "sellers" ? "bg-white dark:bg-zinc-900 shadow-sm text-zinc-900 dark:text-zinc-100" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"}`}
            >
              Sellers
            </button>
            <button
              onClick={() => setFilterType("pending_kyc")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${filterType === "pending_kyc" ? "bg-white dark:bg-zinc-900 shadow-sm text-zinc-900 dark:text-zinc-100" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"}`}
            >
              Pending KYC
            </button>
            <button
              onClick={() => setFilterType("affiliates")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${filterType === "affiliates" ? "bg-white dark:bg-zinc-900 shadow-sm text-zinc-900 dark:text-zinc-100" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"}`}
            >
              Affiliates
            </button>
          </div>
        </div>
        <div className="relative w-full sm:max-w-md group">
          <input
            type="text"
            placeholder="Search by name, email or IP..."
            className="w-full p-5 bg-zinc-50 dark:bg-zinc-800 rounded-2xl outline-none border border-zinc-100 dark:border-zinc-800 focus:border-zinc-900 transition-all font-bold text-sm pl-14 shadow-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Icon
            name="search"
            className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-300"
          />
        </div>
      </div>

      <div className="flex flex-col space-y-3 max-w-4xl mx-auto">
        {filteredUsers.map((user) => (
          <motion.div
            layout
            key={user.uid}
            className="flex flex-col md:flex-row md:items-center justify-between gap-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 shadow-sm group hover:border-pink-300 dark:hover:border-pink-800 transition-colors"
          >
            <div className="flex items-start gap-4 pl-2">
              <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-zinc-100 dark:border-zinc-800 shadow-sm">
                <img
                  src={
                    user.photoURL ||
                    `https://ui-avatars.com/api/?name=${user.displayName}&background=000&color=fff`
                  }
                  className="w-full h-full object-cover"
                  alt=""
                />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 truncate max-w-[140px] sm:max-w-xs">
                    {user.displayName}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${user.role === "admin" ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900" : "bg-zinc-100/50 text-zinc-500 dark:bg-zinc-800"}`}
                  >
                    {user.role}
                  </span>
                  {user.isRegisteredBadge && (
                    <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400">
                      Registered
                    </span>
                  )}
                  {(user.kycStatus === 'verified' || user.isVerifiedBadge) && (
                    <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400">
                      Verified
                    </span>
                  )}
                  {user.isBanned && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-600">
                      Banned
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-neutral-500 dark:text-neutral-400">
                  <span>{user.email}</span>
                  <span>•</span>
                  <span>IP: {user.ipAddress || "UNKNOWN"}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pr-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => setDetailModal({ isOpen: true, user })}
                className="flex items-center justify-center size-8 rounded-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                title="Profile"
              >
                <Icon
                  name="user"
                  className="text-zinc-600 dark:text-zinc-400 text-xs"
                />
              </button>
              <button
                onClick={() => toggleBan(user.uid, user.isBanned)}
                className={`flex items-center justify-center size-8 rounded-full transition-colors ${user.isBanned ? "bg-green-50 text-green-600 hover:bg-green-100" : "bg-red-50 text-red-500 hover:bg-red-100"}`}
                title={user.isBanned ? "Unban User" : "Ban User"}
              >
                <Icon
                  name={user.isBanned ? "unlock" : "ban"}
                  className="text-xs"
                />
              </button>
            </div>
          </motion.div>
        ))}
        {filteredUsers.length === 0 && (
          <div className="py-20 text-center text-zinc-400 font-bold tracking-normal text-xs">
            No users found
          </div>
        )}
      </div>

      <Modal
        zIndex={100}
        isOpen={detailModal.isOpen && detailModal.user !== null}
        onClose={() => setDetailModal({ isOpen: false, user: null })}
        title={detailModal.user?.displayName || "User Details"}
        subtitle={detailModal.user?.email || ""}
        animationType="scale"
        type="blur"
      >
        {detailModal.user && (
          <div className="flex-1 overflow-y-auto space-y-8">
            {/* Role & Badge Configuration */}
            <div className="bg-zinc-50 dark:bg-[#1A1A1A] rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800">
              <h4 className="text-xs font-semibold tracking-normal text-zinc-900 dark:text-zinc-100 mb-6 flex items-center gap-2">
                <Icon name="shield-check" className="text-indigo-500" />
                Role & Badge Configuration
              </h4>

              {/* Roles */}
              <div className="mb-6">
                <p className="text-xs font-bold text-zinc-500 mb-3 uppercase tracking-wider">User Role</p>
                <div className="flex flex-wrap gap-2">
                  {(['user', 'seller', 'staff', 'admin'] as const).map((r) => {
                    const isCurrent = detailModal.user?.role === r;
                    return (
                      <button
                        key={r}
                        onClick={() => updateRole(detailModal.user!.uid, r)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all ${
                          isCurrent
                            ? "bg-indigo-600 text-white shadow-md"
                            : "bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100"
                        }`}
                      >
                        {r}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-zinc-200 dark:border-zinc-800 pt-6">
                <div>
                  <p className="text-xs font-bold text-zinc-500 mb-3 uppercase tracking-wider">Registered Badge</p>
                  <button
                    onClick={() => toggleRegisteredBadge(detailModal.user!.uid, !!detailModal.user?.isRegisteredBadge)}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border ${
                      detailModal.user?.isRegisteredBadge
                        ? "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800/50 text-blue-600 dark:text-blue-400"
                        : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:bg-zinc-100"
                    }`}
                  >
                    <Icon name="shield-check" className="text-xs" />
                    {detailModal.user?.isRegisteredBadge ? "Remove Registered" : "Give Registered"}
                  </button>
                </div>

                <div>
                  <p className="text-xs font-bold text-zinc-500 mb-3 uppercase tracking-wider">Verified Badge</p>
                  <button
                    onClick={() => toggleVerifiedBadge(detailModal.user!.uid, detailModal.user?.kycStatus === 'verified' || !!detailModal.user?.isVerifiedBadge)}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border ${
                      (detailModal.user?.kycStatus === 'verified' || detailModal.user?.isVerifiedBadge)
                        ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50 text-emerald-600 dark:text-emerald-400"
                        : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:bg-zinc-100"
                    }`}
                  >
                    <Icon name="check" className="text-xs" />
                    {(detailModal.user?.kycStatus === 'verified' || detailModal.user?.isVerifiedBadge) ? "Remove Verified" : "Give Verified"}
                  </button>
                </div>
              </div>
            </div>

            {/* Custom Seller Rating Management */}
            {detailModal.user.role === 'seller' && (
              <div className="bg-zinc-50 dark:bg-[#1A1A1A] rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800">
                <h4 className="text-xs font-semibold tracking-normal text-zinc-900 dark:text-zinc-100 mb-6 flex items-center gap-2">
                  <Icon name="star" className="text-amber-500" solid={true} />
                  Seller Star Rating (Manage)
                </h4>
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-zinc-500">Current Rating</p>
                      <p className="text-2xl font-black text-zinc-900 dark:text-white mt-1">
                        {((detailModal.user as any).customRating !== undefined && (detailModal.user as any).customRating !== null) 
                          ? (detailModal.user as any).customRating 
                          : "0 (Using reviews default)"}
                      </p>
                    </div>
                    {/* Render visual stars */}
                    <div className="flex gap-1">
                      {Array.from({ length: 5 }).map((_, idx) => {
                        const currentVal = (detailModal.user as any).customRating || 0;
                        const isFilled = idx < Math.round(currentVal);
                        return (
                          <Icon 
                            key={idx} 
                            name="star" 
                            solid={isFilled}
                            className={`w-5 h-5 ${isFilled ? "text-amber-500" : "text-zinc-300 dark:text-zinc-700"}`} 
                          />
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 items-center">
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider shrink-0">Adjust Rating:</p>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => {
                          const current = (detailModal.user as any).customRating || 0;
                          updateCustomRating(detailModal.user!.uid, current - 0.5);
                        }}
                        className="flex-1 sm:flex-initial px-4 py-2.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-900/30 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30 rounded-xl text-xs font-bold transition-all"
                      >
                        -0.5 Stars
                      </button>
                      <button
                        onClick={() => {
                          const current = (detailModal.user as any).customRating || 0;
                          updateCustomRating(detailModal.user!.uid, current - 0.1);
                        }}
                        className="flex-1 sm:flex-initial px-4 py-2.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-900/30 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30 rounded-xl text-xs font-bold transition-all"
                      >
                        -0.1 Stars
                      </button>
                      <button
                        onClick={() => {
                          const current = (detailModal.user as any).customRating || 0;
                          updateCustomRating(detailModal.user!.uid, current + 0.1);
                        }}
                        className="flex-1 sm:flex-initial px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:hover:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 rounded-xl text-xs font-bold transition-all"
                      >
                        +0.1 Stars
                      </button>
                      <button
                        onClick={() => {
                          const current = (detailModal.user as any).customRating || 0;
                          updateCustomRating(detailModal.user!.uid, current + 0.5);
                        }}
                        className="flex-1 sm:flex-initial px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:hover:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 rounded-xl text-xs font-bold transition-all"
                      >
                        +0.5 Stars
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-2 items-center">
                    <button
                      onClick={() => updateCustomRating(detailModal.user!.uid, 0)}
                      className="px-4 py-2 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-bold transition-all"
                    >
                      Reset to 0
                    </button>
                    <button
                      onClick={() => updateCustomRating(detailModal.user!.uid, 5)}
                      className="px-4 py-2 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 rounded-xl text-xs font-bold transition-all"
                    >
                      Set to 5.0
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-zinc-50 dark:bg-[#1A1A1A] rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800">
              <h4 className="text-xs font-semibold tracking-normal text-zinc-900 dark:text-zinc-100 mb-6">
                Partner Management
              </h4>

              <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between mb-8">
                <div>
                  <p className="text-sm font-medium text-zinc-500 mb-1">
                    Affiliate Status
                  </p>
                  {detailModal.user.isAffiliate ? (
                    <span className="px-3 py-1 bg-zinc-200 dark:bg-zinc-700 dark:bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900/10 text-zinc-950 dark:text-zinc-50 dark:text-zinc-800 dark:text-zinc-200 rounded-full text-xs font-bold tracking-normal border border-zinc-200 dark:border-zinc-800 dark:border-emerald-800/30">
                      Active Affiliate
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-full text-xs font-bold tracking-normal border border-zinc-300 dark:border-zinc-700">
                      Not Enrolled
                    </span>
                  )}
                </div>
                {detailModal.user.isAffiliate ? (
                  <button
                    onClick={() => removeAffiliate(detailModal.user!.uid)}
                    className="px-5 py-2.5 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20 rounded-full text-xs font-bold tracking-normal hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors"
                  >
                    Remove Access
                  </button>
                ) : (
                  <button
                    onClick={() => addAffiliate(detailModal.user!.uid)}
                    className="px-5 py-2.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-full text-xs font-bold tracking-normal hover:bg-zinc-800 dark:hover:bg-white transition-colors"
                  >
                    Grant Access
                  </button>
                )}
              </div>

              <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6">
                <p className="text-sm font-medium text-zinc-500 mb-4">
                  Wallet Balance:{" "}
                  <span className="text-xl font-bold text-zinc-900 dark:text-zinc-100 ml-2">
                    ৳{detailModal.user.walletBalance || 0}
                  </span>
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="number"
                    placeholder="Amount..."
                    value={customWalletAmount}
                    onChange={(e) => setCustomWalletAmount(e.target.value)}
                    className="flex-1 bg-white dark:bg-[#121212] border border-zinc-200 dark:border-zinc-700 px-4 py-3 rounded-xl text-sm font-medium outline-none text-zinc-900 dark:text-zinc-100"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (customWalletAmount)
                          updateWalletBalance(
                            detailModal.user!.uid,
                            (detailModal.user!.walletBalance || 0) +
                              Number(customWalletAmount),
                          );
                        setCustomWalletAmount("");
                      }}
                      className="px-5 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-full text-xs font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                    >
                      + Add
                    </button>
                    <button
                      onClick={() => {
                        if (customWalletAmount)
                          updateWalletBalance(
                            detailModal.user!.uid,
                            (detailModal.user!.walletBalance || 0) -
                              Number(customWalletAmount),
                          );
                        setCustomWalletAmount("");
                      }}
                      className="px-5 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-full text-xs font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                    >
                      - Sub
                    </button>
                    <button
                      onClick={() => {
                        if (customWalletAmount)
                          updateWalletBalance(
                            detailModal.user!.uid,
                            Number(customWalletAmount),
                          );
                        setCustomWalletAmount("");
                      }}
                      className="px-5 py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-full text-xs font-bold hover:bg-zinc-800 dark:hover:bg-white transition-colors"
                    >
                      Set
                    </button>
                  </div>
                </div>
              </div>

              <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6 mt-6">
                <p className="text-sm font-medium text-zinc-500 mb-4">
                  Reset User Password
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    placeholder="New Password (min 6 chars)..."
                    value={userPasswordReset}
                    onChange={(e) => setUserPasswordReset(e.target.value)}
                    className="flex-1 bg-white dark:bg-[#121212] border border-zinc-200 dark:border-zinc-700 px-4 py-3 rounded-xl text-sm font-medium outline-none text-zinc-900 dark:text-zinc-100"
                  />
                  <button
                    onClick={() => handleResetPassword(detailModal.user!.uid)}
                    className="px-5 py-3 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20 rounded-xl text-xs font-bold hover:bg-red-100 transition-colors whitespace-nowrap"
                  >
                    Change Password
                  </button>
                </div>
              </div>

              {/* KYC Verification details */}
              {(detailModal.user.kycStatus || kycRequest) && (
                <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6 mt-6">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                      <Icon name="shield-check" className="text-[#EF8020]" />
                      KYC Identity Verification
                    </p>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-normal uppercase ${
                      detailModal.user.kycStatus === "verified" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400" :
                      detailModal.user.kycStatus === "pending" ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400" :
                      detailModal.user.kycStatus === "rejected" ? "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400" :
                      "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                    }`}>
                      {detailModal.user.kycStatus || "Not Submitted"}
                    </span>
                  </div>

                  {kycRequest ? (
                    <div className="space-y-4 bg-zinc-100/50 dark:bg-zinc-900/50 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-medium">
                        <div>
                          <p className="text-zinc-400 mb-1">NID Legal Name</p>
                          <p className="text-zinc-800 dark:text-zinc-200 font-bold text-sm">{kycRequest.nidName || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-zinc-400 mb-1">Date of Birth</p>
                          <p className="text-zinc-800 dark:text-zinc-200 font-bold text-sm">{kycRequest.dob || "N/A"}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                        <div>
                          <p className="text-[10px] text-zinc-400 font-bold mb-1">NID Front Side</p>
                          <a href={kycRequest.nidFrontUrl} target="_blank" rel="noreferrer" className="block relative aspect-[4/3] rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 group/img">
                            <img src={kycRequest.nidFrontUrl} className="w-full h-full object-cover group-hover/img:scale-105 transition-transform" alt="NID Front" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-[10px]">
                              View Original
                            </div>
                          </a>
                        </div>
                        <div>
                          <p className="text-[10px] text-zinc-400 font-bold mb-1">NID Back Side</p>
                          <a href={kycRequest.nidBackUrl} target="_blank" rel="noreferrer" className="block relative aspect-[4/3] rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 group/img">
                            <img src={kycRequest.nidBackUrl} className="w-full h-full object-cover group-hover/img:scale-105 transition-transform" alt="NID Back" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-[10px]">
                              View Original
                            </div>
                          </a>
                        </div>
                        <div>
                          <p className="text-[10px] text-zinc-400 font-bold mb-1">Facial Biometric</p>
                          <a href={kycRequest.faceUrl} target="_blank" rel="noreferrer" className="block relative aspect-[4/3] rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 group/img">
                            <img src={kycRequest.faceUrl} className="w-full h-full object-cover group-hover/img:scale-105 transition-transform" alt="Face Biometric" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-[10px]">
                              View Original
                            </div>
                          </a>
                        </div>
                      </div>

                      {kycRequest.status === "pending" && !showRejectInput && (
                        <div className="flex gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                          <button
                            onClick={() => handleApproveKyc(detailModal.user!.uid)}
                            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                          >
                            <Icon name="check" className="text-white text-xs" />
                            Approve
                          </button>
                          <button
                            onClick={() => setShowRejectInput(true)}
                            className="flex-1 py-2.5 bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                          >
                            <Icon name="times" className="text-red-500 text-xs" />
                            Reject
                          </button>
                        </div>
                      )}

                      {showRejectInput && (
                        <div className="mt-3 space-y-2 p-3 bg-red-50/50 dark:bg-red-950/20 rounded-xl border border-red-100 dark:border-red-950/40">
                          <label className="block text-[11px] font-bold text-red-700 dark:text-red-400">Decline Rejection Reason</label>
                          <textarea
                            className="w-full p-2 bg-white dark:bg-zinc-900 border border-red-200 dark:border-red-950/40 rounded-lg text-xs outline-none text-zinc-900 dark:text-zinc-100"
                            placeholder="Please explain why this KYC request was declined..."
                            rows={2}
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => {
                                setShowRejectInput(false);
                                setRejectReason("");
                              }}
                              className="px-3 py-1 bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 rounded-md text-[11px] font-bold"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleRejectKyc(detailModal.user!.uid)}
                              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-md text-[11px] font-bold"
                            >
                              Confirm Reject
                            </button>
                          </div>
                        </div>
                      )}

                      {kycRequest.rejectReason && (
                        <div className="p-3 bg-red-50/50 dark:bg-red-950/10 rounded-xl border border-red-100/50 dark:border-red-950/20 mt-2">
                          <p className="text-[10px] text-red-500 font-bold mb-1">Rejection Reason:</p>
                          <p className="text-xs text-zinc-700 dark:text-zinc-300">{kycRequest.rejectReason}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-6 bg-zinc-50 dark:bg-zinc-900/20 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                      <p className="text-xs text-zinc-400 font-bold">No identity documents submitted yet.</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <h4 className="text-xs font-semibold tracking-normal text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800 pb-3 mb-4">
                Device & Session Data
              </h4>
              <div className="space-y-1">
                <DetailBit
                  label="IP Address"
                  value={detailModal.user.ipAddress}
                />
                <DetailBit label="ISP" value={detailModal.user.isp} />
                <DetailBit
                  label="Time Zone"
                  value={detailModal.user.timeZone}
                />
                <DetailBit label="OS" value={detailModal.user.osName} />
                <DetailBit
                  label="Browser"
                  value={detailModal.user.browserName}
                />
                <DetailBit
                  label="Location"
                  value={detailModal.user.locationName}
                />
                <DetailBit
                  label="Joined"
                  value={new Date(detailModal.user.createdAt).toLocaleString()}
                />
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

const DetailBit = ({ label, value }: { label: string; value?: any }) => (
  <div className="flex justify-between items-center py-3 border-b border-zinc-100 dark:border-zinc-800/50 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/20 px-4 rounded-lg transition-colors mx-[-1rem]">
    <span className="text-[10px] font-medium text-zinc-500  tracking-normal">
      {label}
    </span>
    <span className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
      {value || "N/A"}
    </span>
  </div>
);

export default ManageUsers;
