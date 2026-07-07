import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { Order, OrderStatus } from "../types";
import { motion } from "framer-motion";
import Icon from "../components/Icon";
import { Button } from "@/components/ui/button";

const StatusIcon = ({ status }: { status: OrderStatus }) => {
  const base =
    "w-14 h-14 rounded-full flex items-center justify-center shadow-inner ";
  switch (status) {
    case OrderStatus.HOLD:
      return (
        <div className={base + "bg-yellow-100 text-yellow-600"}>
          <Icon name="pause" className="text-xl" />
        </div>
      );
    case OrderStatus.PROCESSING:
      return (
        <div className={base + "bg-blue-100 text-blue-600"}>
          <Icon name="sync-alt" className="text-xl animate-spin" />
        </div>
      );
    case OrderStatus.PACKAGING:
      return (
        <div className={base + "bg-purple-100 text-purple-600"}>
          <Icon name="box" className="text-xl" />
        </div>
      );
    case OrderStatus.SHIPPED:
      return (
        <div className={base + "bg-orange-100 text-orange-600"}>
          <Icon name="truck-moving" className="text-xl" />
        </div>
      );
    case OrderStatus.DELIVERED:
      return (
        <div className={base + "bg-green-100 text-green-600"}>
          <Icon name="check" className="text-xl" />
        </div>
      );
    default:
      return (
        <div className={base + "bg-zinc-100 dark:bg-zinc-800 text-zinc-400"}>
          <Icon name="box-open" className="text-xl" />
        </div>
      );
  }
};

const TrackOrder: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const unsubscribe = onSnapshot(
      doc(db, "orders", id),
      (snap) => {
        if (snap.exists()) setOrder({ id: snap.id, ...snap.data() } as Order);
        setLoading(false);
      },
      (err) => {
        console.warn("Order fetch error:", err.message);
        setLoading(false);
      },
    );
    return unsubscribe;
  }, [id]);

  if (loading)
    return (
      <div className="max-w-[1440px] mx-auto px-6 py-12 md:p-12 animate-fade-in min-h-screen bg-zinc-50 dark:bg-zinc-800 flex justify-center">
        <div className="w-full max-w-2xl bg-white dark:bg-zinc-800 rounded-2xl p-8 border border-zinc-100 dark:border-zinc-800">
          <div className="flex justify-between items-center mb-8">
            <div className="w-12 h-12 rounded-full bg-zinc-200 dark:bg-zinc-700 animate-pulse"></div>
            <div className="w-24 h-6 rounded-full bg-zinc-200 dark:bg-zinc-700 animate-pulse"></div>
          </div>
          <div className="space-y-4 mb-12">
            <div className="w-full h-16 rounded-2xl bg-zinc-200 dark:bg-zinc-700 animate-pulse"></div>
            <div className="w-full h-16 rounded-2xl bg-zinc-200 dark:bg-zinc-700 animate-pulse"></div>
            <div className="w-full h-16 rounded-2xl bg-zinc-200 dark:bg-zinc-700 animate-pulse"></div>
          </div>
        </div>
      </div>
    );

  if (!order)
    return (
      <div className="h-screen flex flex-col items-center justify-center p-10 text-center">
        <div className="w-20 h-20 bg-zinc-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-6 text-lg border border-zinc-100 dark:border-zinc-800">
          ?
        </div>
        <p className="font-bold text-sm  tracking-normal mb-10 text-zinc-400">
          Order not found
        </p>
        <Button
          variant="primary"
          onClick={() => navigate("/")}
          className="w-full px-10"
        >
          Return to Store
        </Button>
      </div>
    );

  return (
    <div className="p-6 md:p-12 min-h-screen bg-zinc-50 dark:bg-zinc-800 max-w-lg mx-auto animate-fade-in">
      

      <div className="bg-zinc-50 dark:bg-zinc-800 rounded-2xl p-10 flex flex-col items-center text-center border border-zinc-100 dark:border-zinc-800 mb-12 shadow-sm relative overflow-hidden">
        {order.status === OrderStatus.ON_THE_WAY &&
          (order.riderNumber || order.courierName) && (
            <div className="absolute top-0 left-0 right-0 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-white py-2 px-4 flex justify-between items-center text-[10px] font-bold  tracking-normal shadow-md">
              <span>
                <Icon name="motorcycle" className="mr-2" />
                {order.courierName || "Courier"}
              </span>
              {order.riderNumber && (
                <a
                  href={`tel:${order.riderNumber}`}
                  className="bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 px-3 py-1 rounded-full flex items-center whitespace-nowrap"
                >
                  <Icon name="phone-alt" className="mr-2 hover:animate-pulse" />
                  {order.riderNumber}
                </a>
              )}
            </div>
          )}
        <div className="mb-6 mt-4">
          <StatusIcon status={order.status} />
        </div>
        <h2 className="text-xl font-semibold mb-2 tracking-tight  text-zinc-900 dark:text-zinc-100">
          {order.status}
        </h2>
        <div className="flex items-center space-x-3 bg-zinc-50 dark:bg-zinc-800 px-5 py-2.5 rounded-full border border-zinc-100 dark:border-zinc-800 mt-4">
          <span className="text-[10px] font-bold text-zinc-400  tracking-normal">
            Tracking ID:
          </span>
          <span className="text-[11px] font-mono font-semibold text-zinc-900 dark:text-zinc-100">
            {order.trackingId || "Preparing"}
          </span>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-[10px] font-bold  tracking-normal text-zinc-300 px-2">
          Delivery Progress
        </h3>
        <div className="bg-zinc-50 dark:bg-zinc-800 rounded-2xl p-8 border border-zinc-100 dark:border-zinc-800 space-y-10 shadow-sm">
          <Step label="Order Placed" sub="We received your order." active />
          <Step
            label="Quality Check"
            sub="Testing your items before packing."
            active={
              order.status !== OrderStatus.PENDING &&
              order.status !== OrderStatus.CANCELLED
            }
          />
          <Step
            label="Order Packed"
            sub="Your items are ready to ship."
            active={[
              OrderStatus.PACKAGING,
              OrderStatus.SHIPPED,
              OrderStatus.ON_THE_WAY,
              OrderStatus.DELIVERED,
            ].includes(order.status)}
          />
          <Step
            label="Handed to Courier"
            sub="Sent via Steadfast Courier."
            active={[
              OrderStatus.SHIPPED,
              OrderStatus.ON_THE_WAY,
              OrderStatus.DELIVERED,
            ].includes(order.status)}
          />
          <Step
            label="Delivered"
            sub="Product delivered to your address."
            active={order.status === OrderStatus.DELIVERED}
          />
        </div>
      </div>

      <button
        onClick={() => navigate(`/e-receipt/${order.id}`)}
        className="w-full mt-10 py-5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-full font-bold text-[10px]  tracking-normal hover:bg-zinc-900 hover:text-white transition-all active:scale-[0.98]"
      >
        View Invoice
      </button>
    </div>
  );
};

const Step = ({ label, sub, active }: any) => (
  <div className="flex space-x-6 relative">
    <div className="flex flex-col items-center">
      <div
        className={`w-3.5 h-3.5 rounded-full border-4 transition-all duration-500 ${active ? "bg-zinc-900 border-zinc-50" : "bg-zinc-100 dark:bg-zinc-800 border-white"}`}
      ></div>
      <div
        className={`w-0.5 h-full transition-colors duration-500 ${active ? "bg-zinc-900/10" : "bg-zinc-50 dark:bg-zinc-800"}`}
      ></div>
    </div>
    <div className="-translate-y-1 flex-1">
      <h4
        className={`text-[11px] font-bold  tracking-normal ${active ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-300"}`}
      >
        {label}
      </h4>
      <p className="text-[10px] font-medium text-zinc-400 mt-1 leading-relaxed">
        {sub}
      </p>
    </div>
  </div>
);

export default TrackOrder;
