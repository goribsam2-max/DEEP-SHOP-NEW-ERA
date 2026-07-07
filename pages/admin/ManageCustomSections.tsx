import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  onSnapshot,
  doc,
  deleteDoc,
  setDoc,
} from "firebase/firestore";
import { db } from "../../firebase";
import { useNotify, useConfirm } from "../../components/Notifications";
import Icon from "../../components/Icon";
import { Play } from "lucide-react";
import { Item, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle, ItemActions } from "../../components/ui/item";
import { Button } from "../../components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

import Modal from "../../components/ui/modal-drop";

const ManageCustomSections: React.FC = () => {
  const notify = useNotify();
  const confirmPopup = useConfirm();
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingState, setEditingState] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    id: "",
    location: "home_top",
    html: "",
    isActive: true,
  });

  useEffect(() => {
    const q = query(collection(db, "custom_sections"));
    const unsub = onSnapshot(q, (snap) => {
      setSections(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleSave = async () => {
    try {
      const id = formData.id || Math.random().toString(36).substr(2, 9);
      await setDoc(doc(db, "custom_sections", id), {
        location: formData.location,
        html: formData.html,
        isActive: formData.isActive,
      });
      notify("Custom section saved!", "success");
      setEditingState(null);
      setFormData({ id: "", location: "home_top", html: "", isActive: true });
    } catch (e: any) {
      notify(e.message, "error");
    }
  };

  const handleDelete = async (id: string) => {
    confirmPopup({
      title: "Delete Section",
      message: "Are you sure you want to delete this section?",
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, "custom_sections", id));
          notify("Section deleted", "success");
        } catch (e: any) {
          notify(e.message, "error");
        }
      }
    });
  };

  const availableLocations = [
    "home_top",
    "home_bottom",
    "cart_bottom",
    "checkout_bottom",
    "profile_bottom",
    "product_bottom",
    "wishlist_bottom",
  ];

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 min-h-screen">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-lg font-semibold">Custom Sections</h1>
          <p className="text-xs text-zinc-500  font-bold tracking-normal mt-1">
            Inject dynamic HTML/CSS anywhere
          </p>
        </div>
        <button
          onClick={() => {
            setEditingState("new");
            setFormData({
              id: "",
              location: "home_top",
              html: "",
              isActive: true,
            });
          }}
          className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-white px-5 py-2.5 rounded-full text-[10px] font-bold  tracking-normal shadow-lg hover:shadow-sm hover:-translate-y-0.5 transition-all flex items-center"
        >
          <Icon name="plus" className="mr-2" /> Add New
        </button>
      </div>

      <Modal
        isOpen={!!editingState}
        onClose={() => setEditingState(null)}
        title={editingState === "new" ? "New Section" : "Edit Section"}
        animationType="scale"
      >
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-bold tracking-normal text-zinc-500 mb-2 block">
              Placement Location
            </label>
            <select
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              className="w-full bg-zinc-50 dark:bg-zinc-900 p-4 rounded-2xl border border-transparent outline-none text-sm focus:border-zinc-900 dark:border-zinc-100"
            >
              {availableLocations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold tracking-normal text-zinc-500 mb-2 block">
              HTML Content
            </label>
            <textarea
              value={formData.html}
              onChange={(e) =>
                setFormData({ ...formData, html: e.target.value })
              }
              className="w-full h-48 bg-zinc-50 dark:bg-zinc-900 p-4 rounded-2xl border border-transparent outline-none font-mono text-xs focus:border-zinc-900 dark:border-zinc-100"
              placeholder="<div class='bg-red-500 p-4'>Sale!</div>"
            />
          </div>
          <div className="flex items-center space-x-3">
             <button
                onClick={() =>
                  setFormData({ ...formData, isActive: !formData.isActive })
                }
                className={`w-12 h-6 rounded-full relative transition-colors ${formData.isActive ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900" : "bg-zinc-300 dark:bg-zinc-600"}`}
              >
                <div
                  className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${formData.isActive ? "left-7" : "left-1"}`}
                ></div>
              </button>
              <span className="text-[10px] font-bold tracking-normal">
                Active
              </span>
          </div>

          <div className="flex justify-end gap-3 mt-8">
            <button
              onClick={() => setEditingState(null)}
              className="px-6 py-3 rounded-full font-bold text-[10px] tracking-normal transition-all active:scale-95 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-3 rounded-full font-bold text-[10px] tracking-normal shadow-lg transition-all active:scale-95 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"
            >
              Save Section
            </button>
          </div>
        </div>
      </Modal>

      {loading ? (
        <div className="py-20 text-center">
          <Icon name="spinner-third" className="animate-spin text-lg" />
        </div>
      ) : sections.length === 0 ? (
        <div className="py-32 text-center text-zinc-400 font-bold text-xs  tracking-normal">
          No custom sections
        </div>
      ) : (
        <ItemGroup className="flex flex-col gap-4">
          {sections.map((sec) => (
            <details key={sec.id} className="group border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden [&_summary::-webkit-details-marker]:hidden bg-white dark:bg-zinc-900 shadow-sm transition-all duration-300" open={false}>
              <summary className="flex cursor-pointer items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                <div className="flex items-center gap-4 w-full">
                  <ItemMedia variant="icon" className="size-12 shrink-0 border border-border p-1 bg-muted relative rounded-md">
                     <span className={`w-3 h-3 rounded-full absolute -top-1 -right-1 ${sec.isActive ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-zinc-400"}`}></span>
                     <Icon name="code" className="text-zinc-600 dark:text-zinc-400 size-5" />
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle className="font-mono">{sec.location}</ItemTitle>
                    <ItemDescription className="truncate max-w-[200px] sm:max-w-md bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded text-xs font-mono">
                      {sec.html}
                    </ItemDescription>
                  </ItemContent>
                  <ItemActions className="opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity justify-end shrink-0 ml-auto">
                    <Button size="icon" variant="outline" className="h-8 w-8" onClick={(e) => { e.preventDefault(); setFormData(sec); setEditingState(sec.id); }}>
                      <Icon name="edit" className="size-3" />
                    </Button>
                    <Button size="icon" variant="destructive" className="h-8 w-8" onClick={(e) => { e.preventDefault(); handleDelete(sec.id); }}>
                      <Icon name="trash" className="size-3" />
                    </Button>
                  </ItemActions>
                </div>
              </summary>
              <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                <div className="text-xs text-zinc-500 bg-zinc-50 dark:bg-zinc-900 p-4 rounded-lg font-mono overflow-auto max-h-64 whitespace-pre-wrap border border-zinc-200 dark:border-zinc-800">
                  {sec.html}
                </div>
              </div>
            </details>
          ))}
        </ItemGroup>
      )}
    </div>
  );
};

export default ManageCustomSections;
