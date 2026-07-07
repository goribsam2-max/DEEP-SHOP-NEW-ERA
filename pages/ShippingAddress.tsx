import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useNotify } from "../components/Notifications";
import Icon from "../components/Icon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { auth, db } from "../firebase";
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { cn } from "@/lib/utils";

const ShippingAddress: React.FC = () => {
  const navigate = useNavigate();
  const notify = useNotify();
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newAddress, setNewAddress] = useState({ 
    name: "", 
    phone: "", 
    district: "", 
    street: "", 
    landmark: "", 
    category: "Home", 
    isDefault: true 
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (auth.currentUser) {
      getDoc(doc(db, "users", auth.currentUser.uid)).then((snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (data.addresses && Array.isArray(data.addresses)) {
            setSavedAddresses(data.addresses);
            if (data.addresses.length > 0) setSelectedAddressId(data.addresses[0].id);
          }
        }
        setLoading(false);
      });
    } else {
      const localAddresses = JSON.parse(localStorage.getItem("vibe_shipping_addresses_v2") || "[]");
      setSavedAddresses(localAddresses);
      if (localAddresses.length > 0) setSelectedAddressId(localAddresses[0].id);
      setLoading(false);
    }
  }, []);

  const handleAdd = async () => {
    if (!newAddress.name || !newAddress.phone || !newAddress.district || !newAddress.street) {
      return notify("Please complete all required fields.", "error");
    }
    const computedAddress = `${newAddress.street}, ${newAddress.district}${newAddress.landmark ? `, ${newAddress.landmark}` : ""}`;
    const newAddrObj = { 
      id: Math.random().toString(36).substring(7), 
      ...newAddress,
      address: computedAddress
    };
    if (auth.currentUser) {
      try {
        const { setDoc } = await import("firebase/firestore");
        await setDoc(doc(db, "users", auth.currentUser.uid), { addresses: arrayUnion(newAddrObj) }, { merge: true });
        setSavedAddresses([...savedAddresses, newAddrObj]);
        setSelectedAddressId(newAddrObj.id);
        setIsAdding(false);
        setNewAddress({ name: "", phone: "", district: "", street: "", landmark: "", category: "Home", isDefault: true });
        notify("Address saved!", "success");
      } catch (e) {
        notify("Error saving address.", "error");
      }
    } else {
      const newAddrs = [...savedAddresses, newAddrObj];
      setSavedAddresses(newAddrs);
      setSelectedAddressId(newAddrObj.id);
      setIsAdding(false);
      localStorage.setItem("vibe_shipping_addresses_v2", JSON.stringify(newAddrs));
      notify("Address saved Locally!", "success");
    }
  };

  const handleRemove = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newAddrs = savedAddresses.filter(a => a.id !== id);
    if (auth.currentUser) {
       try {
         await updateDoc(doc(db, "users", auth.currentUser.uid), { addresses: newAddrs });
         setSavedAddresses(newAddrs);
         if (selectedAddressId === id) setSelectedAddressId(newAddrs.length > 0 ? newAddrs[0].id : null);
         notify("Address removed", "success");
       } catch(e) {
         notify("Error removing address", "error");
       }
    } else {
       setSavedAddresses(newAddrs);
       if (selectedAddressId === id) setSelectedAddressId(newAddrs.length > 0 ? newAddrs[0].id : null);
       localStorage.setItem("vibe_shipping_addresses_v2", JSON.stringify(newAddrs));
    }
  };

  if (loading) return null;

  return (
    <div className="p-6 animate-fade-in min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-800 max-w-lg mx-auto">
      <div className="space-y-6 flex-1">
        {savedAddresses.length > 0 && !isAdding ? (
          <div className="space-y-4">
             {savedAddresses.map((addr) => (
                <div
                  key={addr.id}
                  onClick={() => setSelectedAddressId(addr.id)}
                  className={cn(
                    "p-4 rounded-2xl border-2 cursor-pointer transition-all bg-white dark:bg-zinc-900",
                    selectedAddressId === addr.id 
                      ? "border-zinc-900 dark:border-zinc-100 shadow-sm" 
                      : "border-transparent border-zinc-200 dark:border-zinc-800 opacity-70 hover:opacity-100"
                  )}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center", selectedAddressId === addr.id ? "border-zinc-900 dark:border-zinc-100" : "border-zinc-300")}>
                        {selectedAddressId === addr.id && <div className="w-2 h-2 rounded-full bg-zinc-900 dark:bg-zinc-100" />}
                      </div>
                      <h4 className="font-bold text-zinc-900 dark:text-zinc-100">{addr.name}</h4>
                    </div>
                    <button onClick={(e) => handleRemove(addr.id, e)} className="text-[10px] uppercase font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-2 py-1 rounded">Remove</button>
                  </div>
                  <div className="pl-7">
                    <p className="text-sm font-medium text-zinc-500">{addr.phone}</p>
                    <p className="text-sm mt-1 text-zinc-700 dark:text-zinc-300">{addr.address}</p>
                  </div>
                </div>
             ))}
             <Button variant="outline" className="w-full border-dashed py-6" onClick={() => setIsAdding(true)}>+ Add New Address</Button>
          </div>
        ) : !isAdding && (
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
            <Icon
              name="map-marker"
              className="text-lg mb-4 text-zinc-900 dark:text-zinc-100"
            />
            <p className="text-sm font-bold tracking-tight">
              No address saved.
            </p>
            <Button variant="outline" className="mt-4" onClick={() => setIsAdding(true)}>+ Add Delivery Address</Button>
          </div>
        )}

        {isAdding && (
          <div className="flex flex-col gap-5 animate-fade-in bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2">Add shipping address</h3>
            
            {/* Contact name */}
            <div className="space-y-2">
              <Label className="font-semibold text-zinc-700 dark:text-zinc-300">Contact name <span className="text-rose-500">*</span></Label>
              <Input className="py-6 rounded-xl border-zinc-200 dark:border-zinc-800 focus-visible:ring-emerald-500 bg-transparent text-base" placeholder="Please input the receiver's full name" value={newAddress.name} onChange={(e) => setNewAddress({...newAddress, name: e.target.value})} />
            </div>

            {/* Contact number */}
            <div className="space-y-2">
              <Label className="font-semibold text-zinc-700 dark:text-zinc-300">Contact number <span className="text-rose-500">*</span></Label>
              <div className="flex border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden focus-within:ring-1 focus-within:ring-emerald-500">
                <div className="flex items-center gap-2 px-4 bg-zinc-50 dark:bg-zinc-800/50 border-r border-zinc-200 dark:border-zinc-800">
                  <div className="w-5 h-3.5 bg-green-600 relative overflow-hidden flex items-center justify-center rounded-[2px]"><div className="w-2 h-2 bg-red-500 rounded-full"></div></div>
                  <span className="text-base font-medium">+880</span>
                </div>
                <input 
                  type="tel"
                  placeholder="Please input the receiver's phone number" 
                  value={newAddress.phone} 
                  onChange={(e) => setNewAddress({...newAddress, phone: e.target.value})}
                  className="flex-1 px-4 py-3 text-base bg-transparent outline-none text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
                />
              </div>
            </div>

            <div className="pt-2 pb-1 border-t border-zinc-100 dark:border-zinc-800 mt-2">
              <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-base">Address information</h3>
            </div>

            {/* District / Zone / Area */}
            <div className="space-y-2">
              <Label className="font-semibold text-zinc-700 dark:text-zinc-300">District / Zone / Area <span className="text-rose-500">*</span></Label>
              <Input className="py-6 rounded-xl border-zinc-200 dark:border-zinc-800 focus-visible:ring-emerald-500 bg-transparent text-base" placeholder="Please select a District/Zone/Area" value={newAddress.district} onChange={(e) => setNewAddress({...newAddress, district: e.target.value})} />
            </div>

            {/* Street Name... */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="font-semibold text-zinc-700 dark:text-zinc-300">Street Name, Building, Apartment No <span className="text-rose-500">*</span></Label>
                <button type="button" onClick={() => setNewAddress({...newAddress, street: ""})} className="text-xs text-rose-500 font-bold hover:underline">Clear</button>
              </div>
              <textarea 
                className="w-full min-h-[100px] p-4 text-base rounded-xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-zinc-900 dark:text-zinc-100 outline-none focus:ring-1 focus:ring-emerald-500 placeholder:text-zinc-400 resize-none" 
                placeholder="Building & Apartment No." 
                value={newAddress.street} 
                onChange={(e) => setNewAddress({...newAddress, street: e.target.value})} 
              />
            </div>

            {/* Landmark */}
            <div className="space-y-2">
              <Label className="font-semibold text-zinc-700 dark:text-zinc-300">Landmark (Optional)</Label>
              <Input className="py-6 rounded-xl border-zinc-200 dark:border-zinc-800 focus-visible:ring-emerald-500 bg-transparent text-base" placeholder="Add additional info" value={newAddress.landmark} onChange={(e) => setNewAddress({...newAddress, landmark: e.target.value})} />
            </div>

            {/* Category */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-2 pt-2 gap-3">
              <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Address category</span>
              <div className="flex gap-4">
                {['Home', 'Office', 'Others'].map(cat => (
                  <label key={cat} className="flex items-center gap-2 cursor-pointer group">
                    <div className="relative flex items-center justify-center w-5 h-5 rounded-full border-2 border-zinc-300 dark:border-zinc-700 group-hover:border-indigo-500 transition-colors">
                      {newAddress.category === cat && <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full" />}
                    </div>
                    <input type="radio" name="addressCat" checked={newAddress.category === cat} onChange={() => setNewAddress({...newAddress, category: cat})} className="sr-only" />
                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{cat}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Default */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-1 gap-3">
              <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Default shipping address</span>
              <div className="flex gap-4">
                {['On', 'Off'].map(opt => (
                  <label key={opt} className="flex items-center gap-2 cursor-pointer group">
                    <div className="relative flex items-center justify-center w-5 h-5 rounded-full border-2 border-zinc-300 dark:border-zinc-700 group-hover:border-indigo-500 transition-colors">
                      {(newAddress.isDefault ? 'On' : 'Off') === opt && <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full" />}
                    </div>
                    <input type="radio" name="isDefaultAddr" checked={(newAddress.isDefault ? 'On' : 'Off') === opt} onChange={() => setNewAddress({...newAddress, isDefault: opt === 'On'})} className="sr-only" />
                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{opt}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-2">
              <Button
                onClick={handleAdd}
                className="w-full tracking-normal py-7 text-lg bg-[#ce1274] hover:bg-[#a60f5e] text-white font-bold rounded-full shadow-lg shadow-pink-500/20"
              >
                Save
              </Button>
              <Button
                variant="ghost"
                onClick={() => setIsAdding(false)}
                className="w-full py-6 mt-2 rounded-full font-semibold"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      <Button
        onClick={() => navigate("/checkout")}
        disabled={!selectedAddressId}
        className="w-full mt-10 shadow-sm shadow-black/20 disabled:opacity-50 tracking-normal py-6 rounded-2xl text-lg bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900"
      >
        Proceed to Checkout
      </Button>
    </div>
  );
};

export default ShippingAddress;
