import React, { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../../firebase";
import { useNotify } from "../../components/Notifications";
import { motion } from "framer-motion";
import Icon from "../../components/Icon";
import Modal from "../../components/ui/modal-drop";

const ManageCoupons: React.FC = () => {
  const navigate = useNavigate();
  const notify = useNotify();
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newCoupon, setNewCoupon] = useState({
    code: "",
    discountInfo: "",
    type: "percent",
    maxUses: 100,
    minOrderAmount: 0,
    expiresAt: "",
  });

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "coupons"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setCoupons(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
      notify("Failed to load coupons", "error");
    }
    setLoading(false);
  };

  const handleAddCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCoupon.code || !newCoupon.discountInfo) return;

    try {
      await addDoc(collection(db, "coupons"), {
        code: newCoupon.code.toUpperCase(),
        discount: Number(newCoupon.discountInfo),
        type: newCoupon.type,
        maxUses: Number(newCoupon.maxUses),
        minOrderAmount: Number(newCoupon.minOrderAmount),
        expiresAt: newCoupon.expiresAt ? new Date(newCoupon.expiresAt).getTime() : null,
        usedCount: 0,
        isActive: true,
        createdAt: Date.now(),
      });
      notify("Coupon added successfully", "success");
      setShowAddForm(false);
      setNewCoupon({
        code: "",
        discountInfo: "",
        type: "percent",
        maxUses: 100,
        minOrderAmount: 0,
        expiresAt: "",
      });
      fetchCoupons();
    } catch (err) {
      notify("Error adding coupon", "error");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "coupons", id));
      notify("Coupon removed", "success");
      fetchCoupons();
    } catch (err) {
      notify("Error deleting coupon", "error");
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto px-6 md:px-12 py-10 min-h-screen bg-zinc-50 dark:bg-zinc-800 animate-fade-in relative overflow-hidden">
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900/5 rounded-full blur-[100px] pointer-events-none z-0"></div>
      <div className="flex items-center justify-between mb-12 relative z-10 animate-stagger-1">
        <div className="flex items-center space-x-6">
          <div>
            <h1 className="text-xl md:text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 mb-1.5 text-shine">
              Promotions
            </h1>
            <p className="text-zinc-400 text-[10px] md:text-xs font-bold tracking-normal ">
              Discount Management
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className={`px-6 py-3 rounded-full font-bold text-[10px] tracking-normal shadow-lg transition-all active:scale-95 border hover-tilt hover-glow ${showAddForm ? "bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-200 dark:border-zinc-700" : "bg-zinc-900 text-white border-zinc-900 hover:bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900"}`}
        >
          {showAddForm ? "Cancel" : "New Coupon"}
        </button>
      </div>

      <Modal
        isOpen={showAddForm}
        onClose={() => setShowAddForm(false)}
        title="Create Discount Code"
        animationType="scale"
      >
        <form onSubmit={handleAddCoupon} className="w-full space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
            <div>
              <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400 mb-2 block">
                Coupon Code
              </label>
              <input
                      type="text"
                      value={newCoupon.code || ""}
                      onChange={(e) =>
                        setNewCoupon({
                          ...newCoupon,
                          code: e.target.value.toUpperCase(),
                        })
                      }
                      placeholder="e.g. SUMMER20"
                      className="w-full bg-zinc-50 dark:bg-zinc-800 p-4 rounded-2xl text-sm outline-none border border-zinc-200 dark:border-zinc-700 focus:border-black transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400 mb-2 block">
                      Discount Amount
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="number"
                        value={newCoupon.discountInfo || ""}
                        onChange={(e) =>
                          setNewCoupon({ ...newCoupon, discountInfo: e.target.value })
                        }
                        placeholder="Amount"
                        className="w-full bg-zinc-50 dark:bg-zinc-800 p-4 rounded-l-2xl rounded-r-none text-sm outline-none border border-zinc-200 dark:border-zinc-700 focus:border-black transition-colors"
                        required
                      />
                      <select
                        value={newCoupon.type}
                        onChange={(e) =>
                          setNewCoupon({ ...newCoupon, type: e.target.value })
                        }
                        className="bg-zinc-50 dark:bg-zinc-800 p-4 rounded-r-2xl rounded-l-none text-sm outline-none border border-zinc-200 dark:border-zinc-700 border-l-0 cursor-pointer"
                      >
                        <option value="percent">% Off</option>
                        <option value="fixed">৳ Off</option>
                      </select>
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400 mb-2 block">
                      Max Uses
                    </label>
                    <input
                      type="number"
                      value={newCoupon.maxUses || ""}
                      onChange={(e) =>
                        setNewCoupon({
                          ...newCoupon,
                          maxUses: Number(e.target.value),
                        })
                      }
                      className="w-full bg-zinc-50 dark:bg-zinc-800 p-4 rounded-2xl text-sm outline-none border border-zinc-200 dark:border-zinc-700 focus:border-black transition-colors"
                      required
                    />
                  </div>
                  <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 mt-4">
                    <div>
                      <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400 mb-2 block">
                        Min Order Amount (৳)
                      </label>
                      <input
                        type="number"
                        value={newCoupon.minOrderAmount || ""}
                        onChange={(e) =>
                          setNewCoupon({
                            ...newCoupon,
                            minOrderAmount: Number(e.target.value),
                          })
                        }
                        className="w-full bg-zinc-50 dark:bg-zinc-800 p-4 rounded-2xl text-sm outline-none border border-zinc-200 dark:border-zinc-700 focus:border-black transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400 mb-2 block">
                        Expiry Date
                      </label>
                      <input
                        type="date"
                        value={newCoupon.expiresAt || ""}
                        onChange={(e) =>
                          setNewCoupon({
                            ...newCoupon,
                            expiresAt: e.target.value,
                          })
                        }
                        className="w-full bg-zinc-50 dark:bg-zinc-800 p-4 rounded-2xl text-sm outline-none border border-zinc-200 dark:border-zinc-700 focus:border-black transition-colors"
                      />
                    </div>
                  </div>
            <div className="md:col-span-2 mt-4 flex items-end justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="w-full md:w-auto px-8 py-3 bg-zinc-200 dark:bg-zinc-800 text-zinc-900 border-none dark:text-zinc-100 rounded-lg font-bold tracking-wide transition-all outline-none!"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-full md:w-auto px-8 py-3 bg-zinc-900 border-none text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-lg font-bold tracking-wide shadow-xl hover-lift active:scale-95 transition-all outline-none!"
              >
                Create Promo
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {loading ? (
        <div className="py-20 text-center">
          <Icon
            name="spinner"
            className="animate-spin text-zinc-900 dark:text-zinc-100 text-xl"
          />
        </div>
      ) : (
        <div className="flex flex-col space-y-3 max-w-4xl mx-auto">
          {coupons.map((coupon) => (
            <div
              key={coupon.id}
              className="flex items-center justify-between gap-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 shadow-sm group hover:border-pink-300 dark:hover:border-pink-800 transition-colors"
            >
              <div className="flex items-start gap-4 pl-2">
                <div className="rounded-xl bg-pink-50 dark:bg-zinc-800 p-3 text-pink-600 dark:text-pink-400 shrink-0 border border-pink-100 dark:border-zinc-700 shadow-sm">
                  <Icon name="ticket-alt" />
                </div>
                <div>
                  <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 tracking-tight uppercase">
                    {coupon.code}
                  </div>
                  <div className="text-xs text-neutral-500 dark:text-neutral-400 font-medium flex gap-2 items-center mt-1">
                    <span className="text-zinc-800 dark:text-zinc-200 dark:text-zinc-700 dark:text-zinc-300 font-bold">
                      {coupon.type === "percent" ? `${coupon.discount}% OFF` : `৳${coupon.discount} OFF`}
                    </span>
                    <span>•</span>
                    <span>
                      Usage: {coupon.usedCount || 0} / {coupon.maxUses}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 pr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleDelete(coupon.id)}
                  className="flex items-center justify-center size-8 rounded-full bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                >
                  <Icon name="trash" className="text-xs text-red-500" />
                </button>
              </div>
            </div>
          ))}
          {coupons.length === 0 && (
            <div className="py-20 text-center bg-zinc-50 dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-sm text-zinc-400">
              <Icon name="ticket-alt" className="text-lg mb-4 text-zinc-300" />
              <p className="font-bold text-xs tracking-normal">
                No active coupons
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ManageCoupons;
