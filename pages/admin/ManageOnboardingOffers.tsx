import React, { useState, useEffect } from "react";
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "../../firebase";
import { OnboardingOffer } from "../../types";
import { uploadToImgbb } from "../../services/imgbb";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Textarea } from "../../components/ui/textarea";
import { Switch } from "../../components/ui/switch";
import { Plus, Trash2, Edit2, MoveUp, MoveDown, Save, X } from "lucide-react";
import { toast } from "sonner";

export default function ManageOnboardingOffers() {
  const [offers, setOffers] = useState<OnboardingOffer[]>([]);
  const [editOffer, setEditOffer] = useState<Partial<OnboardingOffer> | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "onboardingOffers"), orderBy("order", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: OnboardingOffer[] = [];
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as OnboardingOffer);
      });
      setOffers(data);
    });
    return unsubscribe;
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editOffer) return;

    if (!editOffer.imageUrl) {
      toast.error("Image is required");
      return;
    }

    try {
      const offerData = { ...editOffer };
      if (!offerData.order) offerData.order = offers.length + 1;

      if (offerData.id) {
        const docRef = doc(db, "onboardingOffers", offerData.id);
        delete offerData.id;
        await updateDoc(docRef, offerData);
        toast.success("Onboarding offer updated");
      } else {
        await addDoc(collection(db, "onboardingOffers"), offerData);
        toast.success("Onboarding offer added");
      }
      setEditOffer(null);
    } catch (error) {
      console.error("Error saving offer:", error);
      toast.error("Failed to save offer");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    setUploading(true);
    try {
      const file = e.target.files[0];
      const url = await uploadToImgbb(file);
      setEditOffer((prev) => prev ? { ...prev, imageUrl: url } : null);
      toast.success("Image uploaded!");
    } catch (error) {
      console.error(error);
      toast.error("Error uploading image");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this offer?")) return;
    try {
      await deleteDoc(doc(db, "onboardingOffers", id));
      toast.success("Offer deleted");
    } catch {
      toast.error("Failed to delete offer");
    }
  };

  const updateOrder = async (id: string, newOrder: number, allData = offers) => {
    try {
      await updateDoc(doc(db, "onboardingOffers", id), { order: newOrder });
    } catch (error) {
       toast.error("Failed to reorder");
    }
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const current = offers[index];
    const prev = offers[index - 1];
    updateOrder(current.id, prev.order);
    updateOrder(prev.id, current.order);
  };

  const moveDown = (index: number) => {
    if (index === offers.length - 1) return;
    const current = offers[index];
    const next = offers[index + 1];
    updateOrder(current.id, next.order);
    updateOrder(next.id, current.order);
  };

  const defaultNewOffer: Partial<OnboardingOffer> = {
    title1: "Transform Your",
    title2: "Home with",
    highlightedWord: "Elegance!",
    description: "Elevate your space with timeless furniture designed for comfort & modern style.",
    glassTitle: "Update",
    glassDiscount: "25% Discount",
    imageUrl: "",
    active: true,
  };

  return (
    <div className="max-w-[1440px] mx-auto px-6 md:px-12 py-10 min-h-screen bg-zinc-50 dark:bg-zinc-800 animate-fade-in relative overflow-hidden">
      <div className="flex justify-between items-center mb-6 relative z-10">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Full-Screen Offers</h2>
        <Button onClick={() => setEditOffer(defaultNewOffer)} className="flex items-center gap-2 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900">
          <Plus size={16} /> Add Offer
        </Button>
      </div>

      {editOffer && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 mb-8 relative">
          <Button onClick={() => setEditOffer(null)} variant="ghost" size="icon" className="absolute top-4 right-4">
            <X size={20} />
          </Button>
          <h3 className="text-lg font-bold mb-4">{editOffer.id ? "Edit" : "New"} Offer</h3>
          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
               <div>
                  <label className="text-xs font-semibold mb-1 block">Title 1</label>
                  <Input value={editOffer.title1 || ""} onChange={e => setEditOffer({...editOffer, title1: e.target.value})} placeholder="Transform Your" required />
               </div>
               <div>
                  <label className="text-xs font-semibold mb-1 block">Title 2</label>
                  <Input value={editOffer.title2 || ""} onChange={e => setEditOffer({...editOffer, title2: e.target.value})} placeholder="Home with" required />
               </div>
               <div>
                  <label className="text-xs font-semibold mb-1 block">Highlighted Word (with underline)</label>
                  <Input value={editOffer.highlightedWord || ""} onChange={e => setEditOffer({...editOffer, highlightedWord: e.target.value})} placeholder="Elegance!" required />
               </div>
               <div>
                  <label className="text-xs font-semibold mb-1 block">Description</label>
                  <Textarea value={editOffer.description || ""} onChange={e => setEditOffer({...editOffer, description: e.target.value})} placeholder="Elevate your space..." required />
               </div>
            </div>
            
            <div className="space-y-4">
               <div>
                  <label className="text-xs font-semibold mb-1 block">Glass Title</label>
                  <Input value={editOffer.glassTitle || ""} onChange={e => setEditOffer({...editOffer, glassTitle: e.target.value})} placeholder="Update" required />
               </div>
               <div>
                  <label className="text-xs font-semibold mb-1 block">Glass Discount</label>
                  <Input value={editOffer.glassDiscount || ""} onChange={e => setEditOffer({...editOffer, glassDiscount: e.target.value})} placeholder="25% Discount" required />
               </div>
               <div>
                 <label className="text-xs font-semibold mb-1 block">Background Image</label>
                 <Input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                 {uploading && <p className="text-xs text-blue-500 mt-1">Uploading...</p>}
                 {editOffer.imageUrl && (
                   <img src={editOffer.imageUrl} alt="Preview" className="h-32 object-cover rounded-xl mt-2 border border-zinc-200 dark:border-zinc-800" />
                 )}
               </div>
               <div className="flex items-center justify-between">
                 <label className="font-semibold text-sm">Active Status</label>
                 <Switch checked={editOffer.active || false} onCheckedChange={(checked) => setEditOffer({...editOffer, active: checked})} />
               </div>
               <Button type="submit" className="w-full flex items-center justify-center gap-2">
                 <Save size={16} /> Save Offer
               </Button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {offers.map((offer, index) => (
          <div key={offer.id} className="flex items-center gap-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-2xl">
             <img src={offer.imageUrl} alt="Offer" className="w-20 h-20 bg-zinc-100 object-cover rounded-xl" />
             <div className="flex-1">
               <h4 className="font-bold text-zinc-900 dark:text-zinc-100">{offer.title1} {offer.title2}</h4>
               <p className="text-sm text-zinc-500">{offer.highlightedWord} - {offer.glassDiscount}</p>
             </div>
             <div className="flex items-center gap-2">
               <span className={`text-xs px-2 py-1 rounded-full ${offer.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                 {offer.active ? "Active" : "Inactive"}
               </span>
               <div className="flex flex-col gap-1 mx-2">
                 <button onClick={() => moveUp(index)} disabled={index === 0} className="text-zinc-400 hover:text-zinc-900 disabled:opacity-30"><MoveUp size={16} /></button>
                 <button onClick={() => moveDown(index)} disabled={index === offers.length - 1} className="text-zinc-400 hover:text-zinc-900 disabled:opacity-30"><MoveDown size={16} /></button>
               </div>
               <Button variant="outline" size="icon" onClick={() => setEditOffer(offer)}>
                 <Edit2 size={16} />
               </Button>
               <Button variant="outline" size="icon" className="text-red-500 hover:bg-red-50 hover:text-red-600" onClick={() => handleDelete(offer.id)}>
                 <Trash2 size={16} />
               </Button>
             </div>
          </div>
        ))}
        {offers.length === 0 && !editOffer && (
          <p className="text-zinc-500 text-center py-10">No onboarding offers found. Add one above.</p>
        )}
      </div>
    </div>
  );
}
