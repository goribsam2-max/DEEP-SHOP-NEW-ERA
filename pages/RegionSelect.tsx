import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent } from "../components/ui/card";
import { ChevronLeft, Globe } from "lucide-react";
import { useRegion } from "../components/RegionContext";
import { auth, db } from "../firebase";
import { doc, updateDoc } from "firebase/firestore";
import { getRegionFlagSvg } from "../components/RegionFlags";

const regions = [
  { id: "BD", name: "Bangladesh", currency: "BDT (৳)" },
  { id: "IN", name: "India", currency: "INR (₹)" },
  { id: "PK", name: "Pakistan", currency: "PKR (Rs)" },
];

export default function RegionSelect() {
  const navigate = useNavigate();
  const { region, setRegion } = useRegion();

  const handleSelect = (rId: "BD" | "IN" | "PK") => {
    setRegion(rId);
    
    // Attempt to update firestore if user is logged in
    if (auth.currentUser) {
      updateDoc(doc(db, "users", auth.currentUser.uid), {
        region: rId
      }).catch((err) => {
        console.error("Failed to update user region in DB:", err);
      });
    }
    
    // Always navigate to home, avoid going back to signup/login screens
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-inter py-8 px-4">
      <div className="max-w-md mx-auto space-y-6 pt-10">
        <div className="flex items-center justify-center pb-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="font-bold flex items-center gap-2 text-zinc-900 dark:text-zinc-100 text-xl">
            <Globe className="w-6 h-6" /> Select Your Region
          </div>
        </div>

        <div className="space-y-4 pt-4">
          <p className="text-sm font-medium text-zinc-500 text-center">
            Select your region to adjust currency and shipping policies.
          </p>

          <div className="space-y-3">
            {regions.map((r) => (
              <Card
                key={r.id}
                onClick={() => handleSelect(r.id as any)}
                className={`cursor-pointer hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors ${region === r.id ? 'border-zinc-900 dark:border-zinc-100 bg-zinc-100 dark:bg-zinc-800' : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900'}`}
              >
                <CardContent className="p-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-6 overflow-hidden flex items-center justify-center shrink-0">
                      {getRegionFlagSvg(r.id)}
                    </div>
                    <div>
                      <div className="font-bold text-lg text-zinc-900 dark:text-zinc-100">{r.name}</div>
                      <div className="text-xs text-zinc-500">Currency: {r.currency}</div>
                    </div>
                  </div>
                  {region === r.id && (
                    <div className="w-4 h-4 rounded-full bg-zinc-900 dark:bg-zinc-100" />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
