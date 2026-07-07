import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { QrCode, Copy, ShieldCheck, Smartphone } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useNotify } from "../components/Notifications";
import { formatPrice } from "@/lib/utils";
import { sendOrderToTelegram } from "../services/telegram";

const Payment: React.FC = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const notify = useNotify();
  const [order, setOrder] = useState<any>(null);
  const [sellerProfile, setSellerProfile] = useState<any>(null);
  const [paymentSettings, setPaymentSettings] = useState<any>(null);
  const [senderNumber, setSenderNumber] = useState("");
  const [trxId, setTrxId] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!orderId) {
      navigate("/");
      return;
    }

    const fetchData = async () => {
      try {
        const orderSnap = await getDoc(doc(db, "orders", orderId));
        if (orderSnap.exists()) {
          const orderData = orderSnap.data();
          setOrder(orderData);
          
          const firstSellerId = orderData.items?.find((i: any) => i.sellerId)?.sellerId;
          if (firstSellerId) {
            const sellerSnap = await getDoc(doc(db, "users", firstSellerId));
            if (sellerSnap.exists()) {
              setSellerProfile(sellerSnap.data());
            }
          }
        }

        const paySnap = await getDoc(doc(db, "settings", "payments"));
        if (paySnap.exists()) {
          setPaymentSettings(paySnap.data());
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [orderId, navigate]);

  const handleSubmitPayment = async () => {
    if (!senderNumber.trim() || !trxId.trim()) {
      notify("Please enter Sender Number and Transaction ID", "error");
      return;
    }

    setSubmitting(true);
    try {
      await updateDoc(doc(db, "orders", orderId as string), {
        accountNameSender: senderNumber.trim(),
        transactionId: trxId.trim(),
        status: "processing"
      });
      // Re-fetch or merge to send to telegram
      await sendOrderToTelegram({
        ...order,
        id: orderId,
        accountNameSender: senderNumber.trim(),
        transactionId: trxId.trim(),
        status: "processing"
      });
      notify("Payment submitted successfully", "success");
      navigate(`/success?orderId=${orderId}`);
    } catch (e) {
      notify("Failed to submit payment details", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">Loading...</div>;
  }

  if (!order) {
    return <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">Order not found.</div>;
  }

  const amountToPay = order.paymentOption === "Full Payment" ? order.total : 150; // assuming default delivery is 150 if not specified

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#000000] flex flex-col items-center py-12 px-4">
      <div className="w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-3xl p-6 md:p-10 shadow-sm border border-zinc-200 dark:border-zinc-800 space-y-8">
        <div className="text-center space-y-2">
          <ShieldCheck className="w-12 h-12 text-[#1cdb5e] mx-auto" />
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white">Complete Your Payment</h1>
          <p className="text-zinc-500">Please complete the payment for your order to proceed.</p>
        </div>

        <div className="bg-[#1cdb5e]/10 border border-[#1cdb5e]/20 p-4 rounded-xl text-center">
          <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">Total Amount to Pay</p>
          <h2 className="text-3xl font-black text-[#1cdb5e] mt-1">{formatPrice(amountToPay)}</h2>
          <p className="text-xs text-zinc-500 mt-2">({order.paymentOption})</p>
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row gap-6 p-6 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-2xl items-center md:items-start">
            <div className="flex flex-col gap-4 w-full">
              <div>
                <h3 className="font-bold text-zinc-900 dark:text-white text-lg flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-[#1cdb5e]" /> bKash & Nagad Payment Only
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                  Send Money or Cash Out the required amount to our official bKash or Nagad numbers below.
                </p>
              </div>

              <div className="space-y-3 pt-4 border-t border-zinc-200 dark:border-zinc-700/50">
                {sellerProfile?.bkashNumber || sellerProfile?.nagadNumber ? (
                  <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    Pay directly to seller ({sellerProfile.shopName || "Seller"}):
                  </p>
                ) : (
                  <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">Transfer manually to:</p>
                )}
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center bg-white dark:bg-zinc-800 p-3 rounded-lg border border-zinc-200 dark:border-zinc-700">
                    <div>
                      <span className="text-[10px] font-bold text-[#E2125B] block">bKash (Send Money)</span>
                      <span className="font-bold text-zinc-900 dark:text-white">
                        {sellerProfile?.bkashNumber || paymentSettings?.npsbNumber || "01747708843"}
                      </span>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => {
                      navigator.clipboard.writeText(sellerProfile?.bkashNumber || paymentSettings?.npsbNumber || "01747708843");
                      notify("bKash number copied!", "success");
                    }}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex justify-between items-center bg-white dark:bg-zinc-800 p-3 rounded-lg border border-zinc-200 dark:border-zinc-700">
                    <div>
                      <span className="text-[10px] font-bold text-[#F57C20] block">Nagad (Send Money)</span>
                      <span className="font-bold text-zinc-900 dark:text-white">
                        {sellerProfile?.nagadNumber || paymentSettings?.pathaoPayNumber || "01747708843"}
                      </span>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => {
                      navigator.clipboard.writeText(sellerProfile?.nagadNumber || paymentSettings?.pathaoPayNumber || "01747708843");
                      notify("Nagad number copied!", "success");
                    }}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-zinc-900 dark:text-white">Verify Payment</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Sender Number</Label>
                <Input
                  placeholder="e.g. 01700000000"
                  value={senderNumber}
                  onChange={(e) => setSenderNumber(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Transaction ID (TrxID)</Label>
                <Input
                  placeholder="e.g. 9J4K2..."
                  value={trxId}
                  onChange={(e) => setTrxId(e.target.value)}
                />
              </div>
            </div>
          </div>
          
          <Button 
            onClick={handleSubmitPayment} 
            disabled={submitting}
            className="w-full bg-[#1cdb5e] hover:bg-[#17ba4f] text-white font-bold py-6 rounded-xl text-lg shadow-sm"
          >
            {submitting ? "Submitting..." : "Confirm Payment"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Payment;
