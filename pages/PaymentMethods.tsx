import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useNotify } from "../components/Notifications";
import Icon from "../components/Icon";
import { Button } from "@/components/ui/button";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { Smartphone } from "lucide-react";

const PaymentMethods: React.FC = () => {
  const navigate = useNavigate();
  const notify = useNotify();
  const [selected, setSelected] = useState(
    localStorage.getItem("vibe_preferred_payment") || "bKash or Nagad",
  );
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    getDoc(doc(db, "settings", "platform")).then((snap) => {
      if (snap.exists()) setSettings(snap.data());
    });
  }, []);

  const methods = [
    {
      id: "bKash or Nagad",
      FallbackIcon: Smartphone
    },
    {
      id: "DP Coin",
      svg: (
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
      ),
    },
    {
      id: "Cash on Delivery",
      svg: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      ),
    },
  ];

  const handleSave = () => {
    localStorage.setItem("vibe_preferred_payment", selected);
    notify("Payment preference saved!", "success");
    navigate(-1);
  };

  return (
    <div className="p-6 animate-fade-in min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-800 max-w-md mx-auto">
      

      <div className="flex-1">
        <div className="mb-10">
          <h2 className="text-[10px] font-bold text-zinc-500 tracking-normal mb-2">
            Policy Notice
          </h2>
          <p className="text-xs leading-relaxed text-gray-500 font-medium">
            Digital payments (bKash & Nagad) help us process your order faster.
            Complete your payment to the corresponding mobile number to complete your transaction.
          </p>
        </div>

        <p className="text-[10px] font-bold text-gray-400  tracking-normal mb-4">
          Methods
        </p>
        <div className="space-y-4">
          {methods.map((m) => (
            <div
              key={m.id}
              onClick={() => setSelected(m.id)}
              className={`p-5 rounded-2xl border-2 flex items-center justify-between cursor-pointer transition-all ${selected === m.id ? "border-black bg-zinc-100 dark:bg-zinc-800 shadow-sm shadow-black/5" : "border-zinc-200 bg-zinc-50 dark:bg-zinc-800 hover:border-gray-200"}`}
            >
              <div className="flex items-center space-x-4">
                {m.image ? (
                  <div className="w-14 h-14 bg-zinc-50 dark:bg-zinc-800 rounded-full flex flex-shrink-0 flex-grow-0 items-center justify-center shadow-sm border border-gray-50 overflow-hidden">
                    <img src={m.image} alt={m.id} className="w-full h-full object-cover rounded-full" />
                  </div>
                ) : m.FallbackIcon ? (
                  <div className="w-14 h-14 bg-zinc-50 dark:bg-zinc-800 rounded-full flex flex-shrink-0 flex-grow-0  items-center justify-center p-3 border border-gray-50 shadow-sm">
                    <m.FallbackIcon className="w-full h-full text-zinc-400" />
                  </div>
                ) : (
                  <div className="w-14 h-14 bg-zinc-50 dark:bg-zinc-800 rounded-full flex flex-shrink-0 flex-grow-0  items-center justify-center border border-gray-50 shadow-sm">
                    <svg
                      className="w-6 h-6 text-black dark:text-white"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      {m.svg}
                    </svg>
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="font-bold text-sm">{m.id}</span>
                  <span className="text-[8px] font-bold text-gray-400  tracking-tight">
                    {m.id === "Cash on Delivery"
                      ? "Doorstep Pay"
                      : m.id === "bKash or Nagad" ? "Digital Payment" : "DP Coin Wallet"}
                  </span>
                </div>
              </div>
              <div
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${selected === m.id ? "border-black" : "border-gray-200"}`}
              >
                {selected === m.id && (
                  <div className="w-3 h-3 bg-zinc-900 dark:bg-zinc-50 dark:text-black rounded-full animate-fade-in"></div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Button
        onClick={handleSave}
        variant="primary" className="w-full mt-10 shadow-sm shadow-black/20"
      >
        Apply & Save
      </Button>
    </div>
  );
};

export default PaymentMethods;
