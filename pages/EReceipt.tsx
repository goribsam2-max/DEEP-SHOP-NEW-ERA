import { formatPrice } from "../lib/utils";
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { Order } from "../types";
import Icon from "../components/Icon";
import { Button } from "@/components/ui/button";

const EReceipt: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const unsubscribe = onSnapshot(
      doc(db, "orders", id),
      (docSnap) => {
        if (docSnap.exists()) {
          setOrder({ id: docSnap.id, ...docSnap.data() } as Order);
        }
        setLoading(false);
      },
      (error) => {
        console.error("Receipt error:", error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [id]);

  const handleDownload = () => {
    window.print();
  };

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-800">
        
      </div>
    );

  if (!order)
    return (
      <div className="h-screen flex flex-col items-center justify-center p-10 text-center">
        <p className="font-bold mb-4">Invoice not found.</p>
        <Button
          variant="default"
          onClick={() => navigate("/")}
          className="w-full px-10"
        >
          Return Home
        </Button>
      </div>
    );

  const subTotal = order.items.reduce(
    (acc, item) => acc + item.priceAtPurchase * item.quantity,
    0,
  );

  return (
    <div className="p-6 animate-fade-in min-h-screen bg-zinc-50 dark:bg-zinc-800 max-w-md mx-auto print:p-0">
      

      <div
        id="receipt-area"
        className="bg-zinc-50 dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-8 shadow-sm flex flex-col relative overflow-hidden print:border-0 print:bg-zinc-50 dark:bg-zinc-800 print:shadow-none print:rounded-none"
      >
        <div className="mb-10 w-full flex flex-col items-center relative">
          <div className="absolute top-0 right-0">
             <div className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-3 py-1.5 rounded-full flex items-center space-x-2">
                 <div className={`w-2 h-2 rounded-full ${order.status === 'processing' ? 'bg-amber-500 animate-pulse' : order.status === 'shipped' ? 'bg-blue-500' : order.status === 'delivered' ? 'bg-green-500' : order.status === 'cancelled' ? 'bg-red-500' : 'bg-green-500'}`} />
                 <span className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-widest">{order.status || 'Pending'}</span>
             </div>
          </div>
          <div className="w-14 h-14 bg-zinc-900 dark:bg-zinc-50 dark:text-black rounded-full flex items-center justify-center mb-6 shadow-sm mt-4">
            <Icon name="shopping-bag" className="text-white text-xl" />
          </div>
          <h2 className="text-lg font-semibold tracking-tight mb-1 text-zinc-900 dark:text-zinc-100">
            DEEP SHOP
          </h2>
          <p className="text-[9px] text-zinc-400 font-bold tracking-normal uppercase">
            Official E-Receipt
          </p>
        </div>

        <div className="w-full space-y-6 mb-8 border-b border-zinc-200 dark:border-zinc-700 pb-8">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-[9px] text-zinc-300 font-bold  tracking-normal">
                Customer
              </p>
              <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                {order.customerName}
              </p>
              <p className="text-[10px] text-zinc-500 font-bold mt-1">
                {order.contactNumber}
              </p>
            </div>
            <div className="text-right space-y-1">
              <p className="text-[9px] text-zinc-300 font-bold  tracking-normal">
                Order ID
              </p>
              <p className="text-[10px] font-mono font-semibold  bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-800 px-2 py-1 rounded">
                #{order.id.slice(0, 8).toUpperCase()}
              </p>
              <p className="text-[10px] text-zinc-500 font-bold mt-1">
                {new Date(order.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div>
            <p className="text-[9px] text-zinc-300 font-bold  tracking-normal mb-1">
              Shipping To
            </p>
            <p className="text-[10px] text-zinc-500 font-medium leading-relaxed">
              {order.shippingAddress}
            </p>
          </div>
        </div>

        <div className="w-full space-y-4 mb-8">
          <p className="text-[9px] text-zinc-300 font-bold  tracking-normal mb-1">
            Order Summary
          </p>
          {order.items.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center space-x-4 bg-zinc-50 dark:bg-zinc-800 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm"
            >
              <div className="w-10 h-10 bg-zinc-50 dark:bg-zinc-800 rounded-full overflow-hidden p-1 shrink-0">
                <img
                  src={item.image}
                  className="w-full h-full object-contain"
                  alt=""
                />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-[11px] truncate">{item.name}</h4>
                <p className="text-[9px] text-zinc-400 font-bold">
                  Qty: {item.quantity}{" "}
                  {order.isGift ? "" : `× ${formatPrice(item.priceAtPurchase)}`}
                </p>
              </div>
              <p className="font-semibold text-xs shrink-0">
                {order.isGift
                  ? "Gift"
                  : `${formatPrice(item.priceAtPurchase * item.quantity)}`}
              </p>
            </div>
          ))}
        </div>

        <div className="w-full bg-zinc-50 dark:bg-zinc-800 p-5 rounded-2xl border border-zinc-100 dark:border-zinc-800 mb-8 shadow-sm">
          <p className="text-[9px] text-zinc-300 font-bold  tracking-normal mb-3">
            Payment Info
          </p>
          <div className="space-y-2">
            <div className="flex justify-between items-center text-[10px]">
              <span className="font-bold text-zinc-400">Method</span>
              <span className="font-bold text-zinc-900 dark:text-zinc-100">
                {order.paymentMethod}
              </span>
            </div>
            <div className="flex justify-between items-center text-[10px]">
              <span className="font-bold text-zinc-400">Transaction ID</span>
              <span className="font-mono font-bold text-black dark:text-white ">
                {order.transactionId || "N/A"}
              </span>
            </div>
          </div>
        </div>

        <div className="w-full space-y-3 mb-6 border-t border-zinc-200 dark:border-zinc-700 pt-6">
          {order.isGift ? (
            <div className="text-center bg-pink-50 p-4 rounded-2xl border border-pink-100">
              <p className="text-[10px] font-semibold tracking-normal  text-pink-600 mb-1">
                A Special Gift
              </p>
              <p className="text-xs font-bold text-pink-900 mt-2 italic">
                {order.giftNote || "Enjoy!"}
              </p>
              <p className="text-[8px] mt-4 font-bold tracking-normal opacity-50 ">
                PAID IN ADVANCE
              </p>
            </div>
          ) : (
            <>
              <div className="flex justify-between text-[10px] font-bold text-zinc-400 ">
                <span>Sub-Total</span>
                <span className="text-zinc-900 dark:text-zinc-100">
                  {formatPrice(order.subTotal || subTotal)}
                </span>
              </div>
              {!!order.discount && (
                <div className="flex justify-between text-[10px] font-bold text-zinc-900 dark:text-zinc-100 ">
                  <span>
                    Discount {order.couponCode ? `(${order.couponCode})` : ""}
                  </span>
                  <span>-{formatPrice(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-[10px] font-bold text-zinc-400 ">
                <span>Delivery Charge</span>
                <span className="text-zinc-900 dark:text-zinc-100">
                  {formatPrice(order.total -
                    ((order.subTotal || subTotal) - (order.discount || 0)))}
                </span>
              </div>
              <div className="flex justify-between text-xl font-semibold pt-4 border-t border-zinc-100 dark:border-zinc-800 tracking-tight text-zinc-900 dark:text-zinc-100">
                <span>Total</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </>
          )}
        </div>

        <div className="w-full text-center">
          <p className="text-[8px] font-semibold  tracking-normal text-zinc-300">
            Thank you for shopping at DEEP SHOP
          </p>
        </div>
      </div>

      <button
        onClick={handleDownload}
        className="w-full mt-10 py-5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-full flex items-center justify-center space-x-3 text-[10px] font-semibold tracking-normal print:hidden shadow-lg active:scale-[0.98] transition-all"
      >
        <Icon name="print" />
        <span>Download Invoice / Print</span>
      </button>

      <style>
        {`
            @media print {
              body * { visibility: hidden; }
              #receipt-area, #receipt-area * { visibility: visible; }
              #receipt-area {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                margin: 0;
                padding: 40px;
                background: white !important;
                border: none !important;
              }
              .print\\:hidden { display: none !important; }
            }
          `}
      </style>
    </div>
  );
};

export default EReceipt;
