import React, { useState, useEffect } from "react";
import { Order, OrderStatus } from "../types";
import { useNavigate, useParams } from "react-router-dom";
import { auth, db } from "../firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { motion } from "framer-motion";
import { formatPrice } from "../lib/utils";
import { ArrowLeft, Clock, CreditCard, LayoutGrid, PackageCheck, PackageOpen, Truck, XCircle } from "lucide-react";
import { Tr } from "../components/Tr";

const StatusBadge = ({ status }: { status: OrderStatus }) => {
  switch (status) {
    case OrderStatus.PENDING:
      return <div className="px-3 py-1 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 border border-yellow-200 dark:border-yellow-800/50 rounded-full text-xs font-bold flex items-center gap-1"><Clock className="w-3 h-3" /> <Tr>Pending</Tr></div>;
    case OrderStatus.SHIPPED:
    case OrderStatus.ON_THE_WAY:
      return <div className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 border border-blue-200 dark:border-blue-800/50 rounded-full text-xs font-bold flex items-center gap-1"><Truck className="w-3 h-3" /> <Tr>On The Way</Tr></div>;
    case OrderStatus.DELIVERED:
      return <div className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 border border-emerald-200 dark:border-emerald-800/50 rounded-full text-xs font-bold flex items-center gap-1"><PackageCheck className="w-3 h-3" /> <Tr>Delivered</Tr></div>;
    case OrderStatus.CANCELLED:
      return <div className="px-3 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 border border-red-200 dark:border-red-800/50 rounded-full text-xs font-bold flex items-center gap-1"><XCircle className="w-3 h-3" /> <Tr>Cancelled</Tr></div>;
    default:
      return <div className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 border border-zinc-200 dark:border-zinc-700 rounded-full text-xs font-bold flex items-center gap-1"><LayoutGrid className="w-3 h-3" /> <Tr>{status}</Tr></div>;
  }
};

const OrderActionPage: React.FC = () => {
  const { actionName } = useParams<{ actionName: string }>(); // 'pay', 'ship', 'receive', 'review'
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const uid = auth.currentUser?.uid || "guest";
    const q = query(collection(db, "orders"), where("userId", "==", uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Order);
      
      const now = Date.now();
      
      // Filter based on action
      if (actionName === "pay") {
        data = data.filter(o => o.status === OrderStatus.PENDING);
      } else if (actionName === "ship") {
        data = data.filter(o => o.status === OrderStatus.SHIPPED || o.status === OrderStatus.ON_THE_WAY);
      } else if (actionName === "receive") {
        data = data.filter(o => {
            const updatedAt = (o as any).updatedAt || o.createdAt;
            return o.status === OrderStatus.DELIVERED && (now - updatedAt) <= 24 * 60 * 60 * 1000;
        });
      } else if (actionName === "review") {
        data = data.filter(o => o.status === OrderStatus.DELIVERED);
      }

      data.sort((a, b) => b.createdAt - a.createdAt);
      setOrders(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [actionName]);

  const getPageTitle = () => {
    switch (actionName) {
      case "pay": return "To Pay";
      case "ship": return "To Ship";
      case "receive": return "To Receive";
      case "review": return "To Review";
      default: return "Orders";
    }
  };

  const getPageSubtitle = () => {
    switch (actionName) {
      case "pay": return "Orders pending payment or confirmation";
      case "ship": return "Orders currently on their way";
      case "receive": return "Recently delivered orders";
      case "review": return "Share your experience with these items";
      default: return "";
    }
  };

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-24 h-24 bg-white dark:bg-zinc-900 shadow-sm border border-zinc-100 dark:border-zinc-800 rounded-full flex items-center justify-center mb-6">
        <PackageOpen className="w-10 h-10 text-zinc-300 dark:text-zinc-600" strokeWidth={1} />
      </div>
      <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2"><Tr>No orders found</Tr></h3>
      <p className="text-sm text-zinc-500 mb-8 max-w-[250px]"><Tr>You don't have any orders in this state right now.</Tr></p>
      <button 
        onClick={() => navigate('/all-products')}
        className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-8 py-3.5 rounded-full font-bold text-sm hover:scale-105 active:scale-95 transition-transform"
      >
        <Tr>Start Shopping</Tr>
      </button>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 py-8 min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="flex items-center mb-8 relative z-10">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            <Tr>{getPageTitle()}</Tr>
          </h1>
          <p className="text-sm font-medium text-zinc-500 mt-1">
            <Tr>{getPageSubtitle()}</Tr>
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-zinc-900 p-6 rounded-[24px] border border-zinc-100 dark:border-zinc-800 animate-pulse flex items-center h-32"></div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <motion.div
              whileTap={{ scale: 0.98 }}
              key={order.id}
              onClick={() => {
                if (actionName === 'review') {
                  navigate(`/leave-review?productId=${order.items[0]?.productId || order.items[0]?.id}`);
                } else if (actionName === 'pay') {
                  const cartItems = order.items.map(item => ({
                    ...item,
                    id: item.productId || item.id,
                    price: item.price !== undefined ? Number(item.price) : Number((item as any).priceAtPurchase || 0)
                  }));
                  localStorage.setItem("f_cart", JSON.stringify(cartItems));
                  navigate('/checkout');
                } else {
                  navigate(`/track-order/${order.id}`);
                }
              }}
              className="bg-white dark:bg-zinc-900 p-5 rounded-[24px] border border-zinc-200 dark:border-zinc-800 shadow-sm hover:border-zinc-300 hover:shadow-md transition-all cursor-pointer block group"
            >
              <div className="flex justify-between items-center mb-4 pb-4 border-b border-zinc-100 dark:border-zinc-800/50">
                 <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-400 dark:text-zinc-500 bg-zinc-100 dark:bg-zinc-800/50 px-2 py-1 rounded-md tracking-wider">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </span>
                    <span className="text-[11px] font-medium text-zinc-400">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                 </div>
                 <StatusBadge status={order.status} />
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 flex items-center justify-center p-2 shrink-0 group-hover:bg-zinc-100 dark:group-hover:bg-zinc-800 transition-colors">
                  <img
                    src={order.items[0]?.image}
                    className="w-full h-full object-contain group-hover:scale-110 transition-transform mix-blend-multiply dark:mix-blend-normal"
                    alt=""
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-100 line-clamp-1 mb-1">
                    {order.items.length > 1 ? `${order.items[0]?.name} & ${order.items.length - 1} more` : order.items[0]?.name}
                  </p>
                  <p className="text-xs font-semibold text-zinc-500 flex items-center gap-1.5">
                    Total: <span className="text-zinc-900 dark:text-zinc-100">{formatPrice(order.total)}</span> • {order.items.reduce((acc, item) => acc + item.quantity, 0)} Items
                  </p>
                </div>
                <div className="flex flex-col items-end">
                  {actionName === 'review' && (
                    <button className="text-[11px] font-bold bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-4 py-2 rounded-full hover:scale-105 transition-transform shadow-sm">
                      <Tr>Review</Tr>
                    </button>
                  )}
                  {actionName === 'pay' && (
                    <button className="text-[11px] font-bold bg-[#FF5C01] text-white px-4 py-2 rounded-full hover:scale-105 transition-transform shadow-sm shadow-[#FF5C01]/20">
                      <Tr>Pay Now</Tr>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderActionPage;
