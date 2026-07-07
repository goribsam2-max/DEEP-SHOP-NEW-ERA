import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../firebase";
import { Order, OrderStatus } from "../../types";
import { useNavigate } from "react-router-dom";
import { useNotify } from "../../components/Notifications";
import { motion } from "framer-motion";
import Icon from "../../components/Icon";

const ManageFakeOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const notify = useNotify();

  useEffect(() => {
    // Only fetch orders flagged as suspicious
    const q = query(
      collection(db, "orders"),
      where("isSuspicious", "==", true),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as Order,
        );
        // Sort by creation desc locally to avoid requiring composite index
        data.sort((a, b) => b.createdAt - a.createdAt);
        setOrders(data);
        setLoading(false);
      },
      (error) => {
        console.error("ManageFakeOrders onSnapshot error:", error);
        setLoading(false);
        notify("Error loading suspicious orders", "error");
      },
    );

    return () => unsubscribe();
  }, []);

  const markAsSafe = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await updateDoc(doc(db, "orders", id), {
        isSuspicious: false,
        riskReason: "",
      });
      notify("Order marked as safe.", "success");
    } catch (err) {
      notify("Failed to update risk status.", "error");
    }
  };

  const cancelOrder = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await updateDoc(doc(db, "orders", id), { status: OrderStatus.CANCELLED });
      notify("Order cancelled.", "info");
    } catch (err) {
      notify("Failed to cancel order.", "error");
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 min-h-screen bg-zinc-50 dark:bg-zinc-800">
      <div className="flex items-center space-x-6 mb-12">
        <div>
          <h1 className="text-xl md:text-lg font-semibold tracking-tight text-red-600 mb-1.5">
            Risk Review
          </h1>
          <p className="text-zinc-500 text-[10px] md:text-xs font-bold tracking-normal ">
            Auto-detected Fake/Suspicious Orders
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-20">
          <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-zinc-50 dark:bg-zinc-900 rounded-full mx-auto flex items-center justify-center mb-6">
            <Icon
              name="shield-check"
              className="text-lg text-zinc-900 dark:text-zinc-100"
            />
          </div>
          <p className="text-[10px] font-bold text-zinc-400  tracking-normal">
            No suspicious orders detected.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={order.id}
              className="bg-red-50/30 border border-red-100 p-6 rounded-2xl shadow-sm relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 py-1.5 px-4 bg-red-500 text-white text-[8px] font-semibold  tracking-normal rounded-bl-xl shadow-sm">
                Suspicious Flag
              </div>

              <div className="mb-6 mt-2">
                <h3 className="text-sm font-semibold text-red-600  tracking-normal">
                  {order.customerName}
                </h3>
                <p className="text-[10px] font-bold text-red-400 mt-1  max-w-sm leading-relaxed">
                  <Icon name="exclamation-triangle" className="mr-2" />
                  {order.riskReason}
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 pt-6 border-t border-red-100/50">
                <div>
                  <p className="text-[8px]  tracking-normal font-bold text-zinc-400 mb-1">
                    Phone
                  </p>
                  <p className="text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100">
                    {order.contactNumber}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-[8px]  tracking-normal font-bold text-zinc-400 mb-1">
                    Shipping Address
                  </p>
                  <p className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300 leading-relaxed max-w-[200px] truncate">
                    {order.shippingAddress}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[8px]  tracking-normal font-bold text-zinc-400 mb-1">
                    Total
                  </p>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    ৳{order.total}
                  </p>
                  <p className="text-[9px] font-bold text-blue-500 mt-0.5  tracking-normal">
                    {order.paymentMethod}
                  </p>
                </div>
              </div>

              <div className="flex flex-col space-y-4">
                <p className="text-[9px] font-bold text-zinc-400  tracking-normal">
                  Ordered Items ({order.items.length})
                </p>
                <div className="flex space-x-2 overflow-x-auto pb-4 no-scrollbar">
                  {order.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex-none p-3 bg-zinc-50 dark:bg-zinc-800 border border-red-100/50 rounded-2xl flex items-center space-x-4 max-w-[250px]"
                    >
                      <div className="w-10 h-10 bg-zinc-50 dark:bg-zinc-800 rounded-full p-1 shrink-0">
                        <img
                          src={item.image}
                          className="w-full h-full object-contain"
                          alt=""
                        />
                      </div>
                      <div className="min-w-0 pr-4">
                        <p className="text-[9px] font-bold text-zinc-800 dark:text-zinc-200  tracking-tight truncate">
                          {item.name}
                        </p>
                        <p className="text-[8px] font-bold text-zinc-400">
                          Qty: {item.quantity}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-4 pt-6 border-t border-red-100/50">
                <button
                  onClick={(e) => cancelOrder(order.id, e)}
                  disabled={order.status === OrderStatus.CANCELLED}
                  className="px-6 py-3 bg-red-500 text-white rounded-full text-[9px] font-semibold  tracking-normal hover:bg-zinc-900 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {order.status === OrderStatus.CANCELLED
                    ? "Already Cancelled"
                    : "Cancel & Block"}
                </button>
                <button
                  onClick={(e) => markAsSafe(order.id, e)}
                  className="px-6 py-3 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:text-zinc-100 hover:border-zinc-200 dark:border-zinc-800 rounded-full text-[9px] font-semibold  tracking-normal transition-all shadow-sm"
                >
                  Mark as Safe
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ManageFakeOrders;
