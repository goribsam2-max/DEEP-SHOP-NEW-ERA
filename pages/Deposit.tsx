import React, { useState, useEffect } from "react";
import { collection, addDoc, getDoc, doc } from "firebase/firestore";
import { db, auth } from "../firebase";
import { useNotify } from "../components/Notifications";
import { useNavigate, useLocation } from "react-router-dom";
import { Copy, QrCode, Smartphone } from "lucide-react";
import { sendDepositRequestToTelegram } from "../services/telegram";

const Deposit: React.FC = () => {
  const location = useLocation();
  const [amount, setAmount] = useState<string>("");
  const [trxId, setTrxId] = useState("");
  const [senderNumber, setSenderNumber] = useState("");
  const [method, setMethod] = useState("bkash");
  const [loading, setLoading] = useState(false);
  const [adminNumbers, setAdminNumbers] = useState({ bkash: "", nagad: "" });
  const [bankSettings, setBankSettings] = useState<any>({});
  const [paymentSettings, setPaymentSettings] = useState<any>(null);
  
  const notify = useNotify();
  const navigate = useNavigate();
  
  const region = localStorage.getItem("user_region") || "BD";
  const isForeign = region === "IN" || region === "PK";

  useEffect(() => {
    if (location.state?.requiredDeposit) {
      setAmount(String(location.state.requiredDeposit));
    }
    if (isForeign) {
      setMethod("bank");
    } else {
      setMethod("bangla_qr");
    }
  }, [location.state, isForeign]);

  useEffect(() => {
    const fetchSettings = async () => {
      const docSnap = await getDoc(doc(db, "settings", "platform"));
      if (docSnap.exists()) {
        const data = docSnap.data();
        setAdminNumbers({
          bkash: data.bkashNumber || "Not Set",
          nagad: data.nagadNumber || "Not Set",
        });
        setBankSettings({
          bankName: data.bankName,
          bankAccountName: data.bankAccountName,
          bankAccountNumber: data.bankAccountNumber,
          bankRoutingNumber: data.bankRoutingNumber,
          bankAccountType: data.bankAccountType,
          bankAddress: data.bankAddress,
        });
      }
      const paySnap = await getDoc(doc(db, "settings", "payments"));
      if (paySnap.exists()) {
        setPaymentSettings(paySnap.data());
      }
    };
    fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || (!trxId && !isForeign)) return notify("Please fill all required fields", "error");
    if (!isForeign && !senderNumber) return notify("Please enter the sender number", "error");
    
    setLoading(true);
    try {
      const depositData = {
        userId: auth.currentUser?.uid,
        userEmail: auth.currentUser?.email,
        amount: Number(amount),
        trxId: trxId || "Bank Transfer",
        senderNumber: senderNumber || "",
        method,
        status: "pending",
        createdAt: Date.now()
      };
      await addDoc(collection(db, "deposits"), depositData);
      
      await sendDepositRequestToTelegram(depositData);

      notify("Deposit request sent. Wait for approval.", "success");
      navigate("/profile");
    } catch (err) {
      notify("Deposit failed. Try again.", "error");
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-8 animate-fade-in mb-20">
      <h2 className="text-2xl font-bold mb-6 text-zinc-900 dark:text-zinc-100">Deposit Money</h2>
      
      <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl shadow-sm border border-zinc-100 dark:border-zinc-800">
        <label className="block text-sm font-semibold mb-2">Payment Method</label>
        
        {isForeign ? (
          <div className="mb-6">
            <div className="py-3 px-4 rounded-xl border-2 font-bold border-zinc-900 dark:border-zinc-100 flex items-center justify-center">Bank Transfer</div>
            <div className="mt-4 flex flex-col gap-3">
              {[
                { label: "Bank Name", value: bankSettings?.bankName || "..." },
                { label: "Account Name", value: bankSettings?.bankAccountName || "..." },
                { label: "Account Number", value: bankSettings?.bankAccountNumber || "..." },
                { label: "Routing Number", value: bankSettings?.bankRoutingNumber || "..." },
                { label: "Account Type", value: bankSettings?.bankAccountType || "..." },
                { label: "Bank Address", value: bankSettings?.bankAddress || "..." }
              ].map((item, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 bg-zinc-100 dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm">
                  <div>
                    <div className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">{item.label}</div>
                    <div className="font-semibold text-zinc-900 dark:text-zinc-100 mt-1">{item.value}</div>
                  </div>
                  <button 
                    type="button"
                    className="flex items-center text-xs h-8 px-2 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-700 transition" 
                    onClick={() => navigator.clipboard.writeText(item.value)}
                  >
                    <Copy className="h-4 w-4 mr-1" /> Copy
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6 p-6 mb-6 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-2xl items-center md:items-start">
            <div className="flex flex-col gap-4 w-full">
              <div>
                 <h3 className="font-bold text-zinc-900 dark:text-white text-base md:text-lg flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-[#1cdb5e]" /> bKash & Nagad Payment Only
                </h3>
                <p className="text-xs md:text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                  Send Money or Cash Out the required amount to our official bKash or Nagad numbers below.
                </p>
              </div>

              <div className="space-y-3 pt-4 border-t border-zinc-200 dark:border-zinc-700/50">
                <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">Transfer manually to:</p>
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center bg-white dark:bg-zinc-800 p-3 rounded-lg border border-zinc-200 dark:border-zinc-700">
                    <div>
                      <span className="text-[10px] font-bold text-red-500 block">bKash (Send Money)</span>
                      <span className="font-bold text-zinc-900 dark:text-white">{paymentSettings?.npsbNumber || "01778953114"}</span>
                    </div>
                    <button 
                      type="button"
                      className="flex items-center text-xs h-8 px-2 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-700 transition" 
                      onClick={() => {
                        navigator.clipboard.writeText(paymentSettings?.npsbNumber || "01778953114");
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex justify-between items-center bg-white dark:bg-zinc-800 p-3 rounded-lg border border-zinc-200 dark:border-zinc-700">
                    <div>
                      <span className="text-[10px] font-bold text-orange-500 block">Nagad (Send Money)</span>
                      <span className="font-bold text-zinc-900 dark:text-white">{paymentSettings?.pathaoPayNumber || "01778953114"}</span>
                    </div>
                    <button 
                      type="button"
                      className="flex items-center text-xs h-8 px-2 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-700 transition" 
                      onClick={() => {
                        navigator.clipboard.writeText(paymentSettings?.pathaoPayNumber || "01778953114");
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">Amount Sent</label>
            <input 
              type="number" 
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-800 p-4 rounded-2xl text-sm border-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 outline-none"
              placeholder="e.g. 500"
            />
          </div>
          {!isForeign && (
            <div>
              <label className="block text-sm font-semibold mb-2">Sender Number</label>
              <input 
                type="text" 
                required
                value={senderNumber}
                onChange={(e) => setSenderNumber(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-800 p-4 rounded-2xl text-sm border-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 outline-none"
                placeholder="e.g. 01700000000"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-semibold mb-2">Transaction ID (TrxID) / Ref {isForeign && "(Optional)"}</label>
            <input 
              type="text" 
              required={!isForeign}
              value={trxId}
              onChange={(e) => setTrxId(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-800 p-4 rounded-2xl text-sm border-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 outline-none"
              placeholder="e.g. 8H3KJ2L9A"
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 mt-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-bold tracking-wide disabled:opacity-50 active:scale-95 transition-transform"
          >
            {loading ? "Submitting..." : "Submit Request"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Deposit;

