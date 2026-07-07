import React, { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
} from "firebase/firestore";
import { Order, OrderStatus } from "../types";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { formatPrice } from "../lib/utils";
import { useNotify } from "../components/Notifications";
import Icon from "../components/Icon";

const StatusIconSmall = ({ status }: { status: OrderStatus }) => {
  const base =
    "w-10 h-10 rounded-full flex items-center justify-center text-xs shadow-inner ";
  switch (status) {
    case OrderStatus.HOLD:
      return (
        <div className={base + "bg-yellow-50 text-yellow-600"}>
          <Icon name="pause" />
        </div>
      );
    case OrderStatus.PROCESSING:
      return (
        <div className={base + "bg-blue-50 text-blue-600"}>
          <Icon name="sync-alt" className="animate-spin" />
        </div>
      );
    case OrderStatus.SHIPPED:
      return (
        <div className={base + "bg-orange-50 text-orange-600"}>
          <Icon name="truck-moving" />
        </div>
      );
    case OrderStatus.ON_THE_WAY:
      return (
        <div className={base + "bg-purple-50 text-purple-600"}>
          <Icon name="motorcycle" />
        </div>
      );
    case OrderStatus.DELIVERED:
      return (
        <div className={base + "bg-green-50 text-green-600"}>
          <Icon name="box-check" />
        </div>
      );
    case OrderStatus.CANCELLED:
      return (
        <div className={base + "bg-red-50 text-red-600"}>
          <Icon name="times" />
        </div>
      );
    default:
      return (
        <div className={base + "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"}>
          <Icon name="box" />
        </div>
      );
  }
};

const MyOrders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [activeTab, setActiveTab] = useState<"All orders" | "Active" | "Cancelled">("All orders");
  const navigate = useNavigate();
  const notify = useNotify();

  useEffect(() => {
    // Redirect if not logged in
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (!user) {
        navigate("/auth-selector");
      }
    });

    const uid = auth.currentUser?.uid || "guest";
    const q = query(collection(db, "orders"), where("userId", "==", uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() }) as Order,
      );
      data.sort((a, b) => b.createdAt - a.createdAt);
      setOrders(data);
      setLoading(false);
    });

    const timer = setInterval(() => setCurrentTime(Date.now()), 10000);
    return () => {
      unsubscribeAuth();
      unsubscribe();
      clearInterval(timer);
    };
  }, [navigate]);

  const handleCancelOrder = async (orderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await updateDoc(doc(db, "orders", orderId), {
        status: OrderStatus.CANCELLED,
      });
      notify("Order has been cancelled.", "info");
    } catch (err) {
      notify("Failed to cancel order.", "error");
    }
  };

  const isCancelable = (order: Order) => {
    if (order.status !== OrderStatus.PENDING) return false;
    const minutesPassed = (currentTime - order.createdAt) / (1000 * 60);
    return minutesPassed <= 5;
  };

  const filteredOrders = orders.filter(order => {
    if (activeTab === "Active") {
      return order.status !== OrderStatus.DELIVERED && order.status !== OrderStatus.CANCELLED;
    }
    if (activeTab === "Cancelled") {
      return order.status === OrderStatus.CANCELLED;
    }
    return true; // All orders
  });

  return (
    <div className="max-w-3xl mx-auto px-6 py-6 pb-[120px] md:pb-12 animate-fade-in min-h-screen bg-zinc-50 dark:bg-zinc-800">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="w-10"></div>
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">My Order</h1>
        <div className="w-10"></div>
      </div>

      <div className="flex bg-white dark:bg-zinc-900 rounded-[24px] p-1.5 mb-8 border border-zinc-100 dark:border-zinc-800 shadow-sm gap-1">
        {["All orders", "Active", "Cancelled"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`flex-1 text-center py-3 rounded-full text-sm font-bold transition-all ${
              activeTab === tab
                ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-md"
                : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 bg-transparent"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array(4)
            .fill(0)
            .map((_, i) => (
              <div
                key={i}
                className="bg-zinc-50 dark:bg-zinc-800 p-4 pr-6 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm flex items-center justify-between mb-4"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-zinc-200/50 dark:bg-zinc-700/50 rounded-full animate-pulse"></div>
                  <div>
                    <div className="h-2 w-16 bg-zinc-200/50 dark:bg-zinc-700/50 rounded mb-1.5 animate-pulse"></div>
                    <div className="h-4 w-24 bg-zinc-200/50 dark:bg-zinc-700/50 rounded-full animate-pulse"></div>
                  </div>
                </div>
                <div className="h-4 w-12 bg-zinc-200/50 dark:bg-zinc-700/50 rounded animate-pulse"></div>
              </div>
            ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-40 flex flex-col items-center">
          <div className="w-20 h-20 bg-zinc-50 dark:bg-zinc-800 rounded-full border border-zinc-100 dark:border-zinc-800 flex items-center justify-center mb-6">
            <Icon name="shopping-bag" className="text-lg text-zinc-300" />
          </div>
          <p className="text-[11px] font-bold text-zinc-400  tracking-normal mb-8">
            No order history found
          </p>
          <button
            onClick={() => navigate("/")}
            className="px-8 py-3.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-full text-[10px] font-bold  tracking-normal shadow-md hover:bg-zinc-800 transition-all"
          >
            Start Shopping
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            return (
              <motion.div
                whileTap={{ scale: 0.99 }}
                key={order.id}
                className="bg-white dark:bg-zinc-900 p-5 rounded-[24px] border border-zinc-100 dark:border-zinc-800 shadow-sm cursor-pointer"
              >
                <div className="flex justify-between items-start mb-6" onClick={() => navigate(`/track-order/${order.id}`)}>
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-zinc-50 dark:bg-zinc-800 overflow-hidden shrink-0 border border-zinc-100 dark:border-zinc-800 p-2">
                       <img src={order.items[0]?.image} alt="" className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal" />
                    </div>
                    <div>
                      <h4 className="font-bold text-zinc-900 dark:text-zinc-100 text-lg mb-0.5 tracking-tight line-clamp-1">{order.items[0]?.name || "Item"}</h4>
                      <p className="text-zinc-500 font-medium text-xs">
                        {formatPrice(order.total)} <span className="mx-1 text-zinc-300">|</span> {order.items.reduce((acc, item) => acc + item.quantity, 0)} Items
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-zinc-400">#{order.id.slice(0, 6).toUpperCase()}</span>
                </div>

                <div className="flex justify-end items-end mb-6" onClick={() => navigate(`/track-order/${order.id}`)}>
                  <div className="text-right">
                    <span className="text-[11px] font-semibold text-zinc-400 block mb-1">Status</span>
                    <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">{order.status}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button 
                    onClick={(e) => { e.stopPropagation(); navigate(`/e-receipt/${order.id}`) }}
                    className="flex-1 py-3.5 bg-transparent border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors rounded-full font-bold text-zinc-900 dark:text-zinc-100 text-sm"
                  >
                    Invoice
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); navigate(`/track-order/${order.id}`) }}
                    className="flex-[1.5] py-3.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors shadow-md rounded-full font-bold text-sm"
                  >
                    Track Order
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyOrders;
