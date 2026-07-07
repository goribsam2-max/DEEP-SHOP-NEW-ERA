import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebase";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
  updateDoc,
} from "firebase/firestore";
import { Order, OrderStatus } from "../../types";
import { useNotify } from "../../components/Notifications";
import { AnimatePresence, motion } from "framer-motion";
import Icon from "../../components/Icon";
import { OrderSkeleton } from "../../components/Skeletons";

const ManageOrders: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const notify = useNotify();

  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setOrders(
        snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Order),
      );
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const updateStatus = async (orderId: string, status: OrderStatus) => {
    try {
      let updateData: any = { status };
      if (status === OrderStatus.CANCELLED) {
        const reason = window.prompt("Reason for rejection:");
        if (reason === null) return;
        updateData.rejectReason = reason;
      }
      
      const order = orders.find((o) => o.id === orderId);
      await updateDoc(doc(db, "orders", orderId), updateData);
      notify(`Order status: ${status}`, "success");

      // Affiliate Commission Logic
      if (
        status === OrderStatus.DELIVERED &&
        order?.affiliateRef &&
        !order.commissionPaid
      ) {
        try {
          const {
            where,
            getDocs,
            limit,
            addDoc,
            doc: f_doc,
            updateDoc: f_updateDoc,
            increment,
            getDoc: f_getDoc,
          } = await import("firebase/firestore");
          // Get configs
          const reqConfigSnap = await f_getDoc(
            f_doc(db, "settings", "platform"),
          );
          const configs = reqConfigSnap.exists() ? reqConfigSnap.data() : {};

          const t1Limit = configs.affiliateTier1Threshold ?? 3;
          const t1Comm = configs.affiliateTier1Commission ?? 50;
          const t2Limit = configs.affiliateTier2Threshold ?? 10;
          const t2Comm = configs.affiliateTier2Commission ?? 100;
          const t3Limit = configs.affiliateTier3Threshold ?? 20;
          const t3Comm = configs.affiliateTier3Commission ?? 150;
          const t4Limit = configs.affiliateTier4Threshold ?? 30;
          const t4Comm = configs.affiliateTier4Commission ?? 200;

          // Find user with this affiliateCode
          const q = query(
            collection(db, "users"),
            where("affiliateCode", "==", order.affiliateRef),
            limit(1),
          );
          const snap = await getDocs(q);
          if (!snap.empty) {
            const affiliateDoc = snap.docs[0];
            const affiliateId = affiliateDoc.id;

            const logsQ = query(
              collection(db, "affiliates_log"),
              where("affiliateId", "==", affiliateId),
            );
            const logsSnap = await getDocs(logsQ);
            const salesCount = logsSnap.docs.length; // Approximate enough for now

            let currentCommission = t1Comm;
            if (salesCount >= t3Limit) currentCommission = t4Comm;
            else if (salesCount >= t2Limit) currentCommission = t3Comm;
            else if (salesCount >= t1Limit) currentCommission = t2Comm;

            // Add balance
            await f_updateDoc(f_doc(db, "users", affiliateId), {
              walletBalance: increment(currentCommission),
            });
            // Log
            await addDoc(collection(db, "affiliates_log"), {
              affiliateId,
              orderId: order.id,
              customerName: order.customerName,
              commission: currentCommission,
              createdAt: Date.now(),
            });
            // Mark order as paid
            await f_updateDoc(f_doc(db, "orders", order.id), {
              commissionPaid: true,
            });
          }
        } catch (e) {
          console.error("Affiliate sync failed:", e);
        }
      }
    } catch (e) {
      notify("Update failed", "error");
    }
  };

  const updateTrackingId = async (orderId: string, trackingId: string) => {
    try {
      await updateDoc(doc(db, "orders", orderId), {
        trackingId: trackingId.trim(),
      });
      notify("Tracking ID synced", "success");
    } catch (e) {
      notify("Update failed", "error");
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto px-6 py-10 min-h-screen bg-zinc-50 dark:bg-zinc-800">
      <div className="flex items-center space-x-6 mb-12">
        <div>
          <h1 className="text-xl md:text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 mb-1.5">
            Orders Overview
          </h1>
          <p className="text-zinc-400 text-[10px] md:text-xs font-bold tracking-normal ">
            Manual Logistics Management
          </p>
        </div>
      </div>

      <div className="space-y-4 max-w-4xl mx-auto">
        {loading
          ? Array(5)
              .fill(0)
              .map((_, i) => <OrderSkeleton key={i} />)
          : orders.map((order) => (
              <div
                key={order.id}
                className="flex flex-col rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm group hover:border-pink-300 dark:hover:border-pink-800 transition-colors overflow-hidden"
              >
                {/* Header / Clickable Area */}
                <div 
                  className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 p-4 cursor-pointer"
                  onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                >
                  <div className="flex items-start lg:items-center gap-4">
                    <div className="rounded-xl bg-pink-50 dark:bg-zinc-800 p-3 text-pink-600 dark:text-pink-400 shrink-0">
                      <Icon name="box" className="text-xl" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                          {order.customerName}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${order.status === OrderStatus.DELIVERED ? "bg-zinc-200 dark:bg-zinc-700/50 text-emerald-800 dark:text-emerald-300" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"}`}
                        >
                          {order.status}
                        </span>
                      </div>
                      <div className="text-xs text-neutral-500 dark:text-neutral-400 font-medium flex gap-2 items-center flex-wrap mt-1">
                        <span>#{order.id.slice(0, 8)}</span>
                        <span>•</span>
                        <span>৳{order.total}</span>
                        <span>•</span>
                        <span>{order.contactNumber}</span>
                        <span>•</span>
                        <span>
                          {new Date(order.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric"
                          })}
                        </span>
                      </div>
                      
                      <div className="mt-2 text-xs text-zinc-400 italic line-clamp-1">
                         {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 pr-2" onClick={e => e.stopPropagation()}>
                    <div className="relative">
                      <select
                        className="appearance-none pl-3 pr-8 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold outline-none cursor-pointer rounded-lg transition-all"
                        value={order.status}
                        onChange={(e) =>
                          updateStatus(order.id, e.target.value as OrderStatus)
                        }
                      >
                        {Object.values(OrderStatus).map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      <Icon
                        name="chevron-down"
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-zinc-400 pointer-events-none"
                      />
                    </div>
                    <Icon name={expandedOrderId === order.id ? "chevron-up" : "chevron-down"} className="text-zinc-400 ml-2" />
                  </div>
                </div>

                {/* Expanded Content */}
                <AnimatePresence>
                  {expandedOrderId === order.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t border-zinc-100 dark:border-zinc-800"
                    >
                      <div className="p-4 bg-zinc-50 dark:bg-zinc-950/50 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-xs font-bold text-zinc-500 uppercase mb-2">Shipping Information</h4>
                            <div className="text-sm bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800">
                              <p><span className="font-medium text-zinc-400">Name:</span> {order.customerName}</p>
                              <p><span className="font-medium text-zinc-400">Phone:</span> {order.contactNumber}</p>
                              <p><span className="font-medium text-zinc-400">Address:</span> {typeof order.shippingAddress === 'string' ? order.shippingAddress : `${(order.shippingAddress as any).address}, ${(order.shippingAddress as any).city}, ${(order.shippingAddress as any).zone}`}</p>
                              {typeof order.shippingAddress !== 'string' && (order.shippingAddress as any).area && <p><span className="font-medium text-zinc-400">Area:</span> {(order.shippingAddress as any).area}</p>}
                            </div>
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-zinc-500 uppercase mb-2">Order Items</h4>
                            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800">
                              {order.items.map((item: any, idx) => (
                                <div key={idx} className="p-3 flex items-center gap-3 text-sm">
                                  <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded bg-cover bg-center" style={{ backgroundImage: `url(${item.image})`}}></div>
                                  <div className="flex-1">
                                    <div className="font-semibold">{item.name}</div>
                                    <div className="text-xs text-zinc-500 tracking-wide">
                                      {item.quantity} x ৳{item.priceAtPurchase || item.price}
                                      {item.selectedVariants && Object.entries(item.selectedVariants).map(([k,v]) => (
                                        <span key={k} className="ml-2 px-1 border border-zinc-200 dark:border-zinc-700 rounded bg-zinc-50 dark:bg-zinc-800">{String(v)}</span>
                                      ))}
                                    </div>
                                  </div>
                                  <div className="font-bold">৳{item.quantity * (item.priceAtPurchase || item.price)}</div>
                                </div>
                              ))}
                              <div className="p-3 text-sm font-bold flex justify-between bg-zinc-50 dark:bg-zinc-900/50 rounded-b-xl">
                                <span>Total (inc. shipping, less discount)</span>
                                <span>৳{order.total}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Tracker Details */}
                        {order.status === OrderStatus.ON_THE_WAY && (
                          <div className="pt-2">
                            <h4 className="text-xs font-bold text-zinc-500 uppercase mb-2">Fulfillment Details</h4>
                            <div className="flex items-center gap-3 flex-wrap">
                              <input
                                type="text"
                                placeholder="Tracking ID"
                                className="bg-white dark:bg-zinc-900 text-sm px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 w-40 outline-none focus:border-pink-500"
                                defaultValue={order.trackingId || ""}
                                onBlur={(e) => updateTrackingId(order.id, e.target.value)}
                              />
                              <input
                                type="text"
                                placeholder="Courier Name"
                                className="bg-white dark:bg-zinc-900 text-sm px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 w-40 outline-none focus:border-pink-500"
                                defaultValue={order.courierName || ""}
                                onBlur={(e) => updateDoc(doc(db, "orders", order.id), { courierName: e.target.value.trim() })}
                              />
                              <input
                                type="text"
                                placeholder="Rider Number"
                                className="bg-white dark:bg-zinc-900 text-sm px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 w-40 outline-none focus:border-pink-500"
                                defaultValue={order.riderNumber || ""}
                                onBlur={(e) => updateDoc(doc(db, "orders", order.id), { riderNumber: e.target.value.trim() })}
                              />
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between text-xs text-zinc-400 mt-2 border-t border-zinc-100 dark:border-zinc-800 pt-3">
                           <span>Order ID: {order.id}</span>
                           <span>User ID: {order.userId}</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
        {!loading && orders.length === 0 && (
          <div className="py-32 text-center text-zinc-400 font-bold  tracking-normal text-[11px]">
            No log found in database
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageOrders;
