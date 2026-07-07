import React, { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../firebase";
import { useNotify } from "../../components/Notifications";
import { motion } from "framer-motion";
import Icon from "../../components/Icon";
import Modal from "../../components/ui/modal-drop";

const ManageStaff: React.FC = () => {
  const navigate = useNavigate();
  const notify = useNotify();
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  // RBAC Permissions List
  const ALL_MODULES = [
    { id: "dashboard", name: "Dashboard Analytics" },
    { id: "products", name: "Products Catalog" },
    { id: "orders", name: "Order Management" },
    { id: "users", name: "User Database" },
    { id: "riders", name: "Delivery Riders" },
    { id: "withdrawals", name: "Withdrawals" },
    { id: "reviews", name: "Reviews" },
    { id: "banners", name: "Banners" },
    { id: "onboarding-offers", name: "Onboarding Offers" },
    { id: "stories", name: "Stories" },
    { id: "custom-sections", name: "UI builder" },
    { id: "chats", name: "Live Chats" },
    { id: "helpdesk", name: "Help Desk" },
    { id: "vghelpline", name: "VG Helpline" },
    { id: "notifications", name: "Notifications" },
    { id: "config", name: "Config & Settings" }
  ];

  const [form, setForm] = useState({
    email: "",
    roleName: "Support Agent",
    permissions: ["helpdesk"] as string[],
  });

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "staff"));
      setStaff(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleTogglePermission = (modId: string) => {
    if (form.permissions.includes(modId)) {
      setForm({
        ...form,
        permissions: form.permissions.filter((p) => p !== modId),
      });
    } else {
      setForm({ ...form, permissions: [...form.permissions, modId] });
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email) return;

    try {
      // Use email as doc ID for easy lookup during login/RBAC checks
      const staffId = form.email.toLowerCase().trim();
      await setDoc(doc(db, "staff", staffId), {
        email: form.email,
        roleName: form.roleName,
        permissions: form.permissions,
        createdAt: Date.now(),
        isActive: true,
      });
      notify(`Staff role added for ${form.email}`, "success");
      setShowAdd(false);
      setForm({
        email: "",
        roleName: "Support Agent",
        permissions: ["helpdesk"],
      });
      fetchStaff();
    } catch (err) {
      notify("Error adding staff", "error");
    }
  };

  const handleRemoveStaff = async (id: string) => {
    try {
      await deleteDoc(doc(db, "staff", id));
      notify("Staff member removed", "success");
      fetchStaff();
    } catch (err) {
      notify("Error removing staff", "error");
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto px-6 md:px-12 py-10 min-h-screen bg-zinc-50 dark:bg-zinc-800 animate-fade-in relative overflow-hidden">
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900/5 rounded-full blur-[100px] pointer-events-none z-0"></div>
      <div className="flex items-center justify-between mb-12 relative z-10 animate-stagger-1">
        <div className="flex items-center space-x-6">
          <div>
            <h1 className="text-xl md:text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 mb-1.5 text-shine">
              Staff Roles
            </h1>
            <p className="text-zinc-400 text-[10px] md:text-xs font-bold tracking-normal ">
              RBAC & Permissions
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className={`px-6 py-3 rounded-full font-bold text-[10px] tracking-normal shadow-lg transition-all active:scale-95 border hover-tilt hover-glow ${showAdd ? "bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-200 dark:border-zinc-700" : "bg-zinc-900 text-white border-zinc-900 hover:bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900"}`}
        >
          {showAdd ? "Cancel" : "Add Staff"}
        </button>
      </div>

      <Modal
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        title="Configure Staff Access"
        animationType="scale"
      >
        <form onSubmit={handleAddStaff} className="w-full space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400 mb-2 block">
                Staff Email
              </label>
              <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="agent@vibe.shop"
                      className="w-full bg-zinc-50 dark:bg-zinc-800 p-4 rounded-2xl text-sm outline-none border border-zinc-200 dark:border-zinc-700 focus:border-black transition-colors"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400 mb-2 block">
                      Role Title
                    </label>
                    <input
                      type="text"
                      value={form.roleName}
                      onChange={(e) =>
                        setForm({ ...form, roleName: e.target.value })
                      }
                      placeholder="e.g. Content Manager"
                      className="w-full bg-zinc-50 dark:bg-zinc-800 p-4 rounded-2xl text-sm outline-none border border-zinc-200 dark:border-zinc-700 focus:border-black transition-colors"
                      required
                    />
                  </div>
                </div>

                <div className="mb-8">
                  <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400 mb-4 block">
                    Module Permissions
                  </label>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                    {ALL_MODULES.map((mod) => (
                      <div
                        key={mod.id}
                        onClick={() => handleTogglePermission(mod.id)}
                        className={`p-4 rounded-2xl border-2 flex items-center space-x-3 cursor-pointer transition-all ${form.permissions.includes(mod.id) ? "border-black dark:border-white bg-zinc-100 dark:bg-zinc-800" : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600"}`}
                      >
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors ${form.permissions.includes(mod.id) ? "bg-black dark:bg-white text-white dark:text-black" : "bg-zinc-200 dark:bg-zinc-700 text-zinc-400"}`}
                        >
                          {form.permissions.includes(mod.id) && (
                            <Icon name="check" className="text-xs" />
                          )}
                        </div>
                        <span
                          className={`text-sm font-bold truncate ${form.permissions.includes(mod.id) ? "text-zinc-900 dark:text-white" : "text-zinc-600 dark:text-zinc-400"}`}
                        >
                          {mod.name}
                        </span>
                      </div>
                    ))}
                  </div>
                  {form.permissions.length === 0 && (
                    <p className="text-[10px] text-red-500 font-bold mt-2">
                    <Icon name="exclamation-triangle" className="mr-1" /> Select
                    at least one module
                  </p>
                )}
              </div>

              <div className="flex justify-end pt-4 gap-3">
                <button
                  type="button"
                  onClick={() => setShowAdd(false)}
                  className="px-8 py-3 bg-zinc-200 dark:bg-zinc-800 text-zinc-900 border-none dark:text-zinc-100 rounded-lg font-bold tracking-wide transition-all outline-none!"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={form.permissions.length === 0}
                  className="px-8 py-3 bg-zinc-900 border-none text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-lg font-bold tracking-wide shadow-xl active:scale-95 transition-all disabled:opacity-50 outline-none!"
                >
                  Confirm & Add User
                </button>
              </div>
            </form>
          </Modal>
 
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
        {/* Master Admin Card (Cannot be deleted) */}
        <div className="bg-zinc-900 dark:bg-zinc-100 p-6 rounded-2xl border border-[#0a4a2b] shadow-sm text-white dark:text-zinc-900 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900/20 rounded-2xl blur-2xl"></div>
          <div>
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-zinc-50 dark:bg-zinc-900/10 rounded-full flex items-center justify-center border border-white/20">
                <Icon
                  name="crown"
                  className="text-zinc-800 dark:text-zinc-200 text-sm"
                />
              </div>
              <div>
                <h3 className="font-semibold text-lg tracking-tight">
                  Super Admin
                </h3>
                <p className="text-[10px] text-emerald-200  tracking-normal font-bold">
                  admin@vibe.shop
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900/20 text-emerald-300 rounded-md text-[9px] font-bold  tracking-normal border border-zinc-900 dark:border-zinc-100/30">
                All Access
              </span>
            </div>
          </div>
        </div>

        {/* Sub Admins */}
        {staff.map((member) => (
          <div
            key={member.id}
            className="bg-zinc-50 dark:bg-zinc-800 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center border border-zinc-200 dark:border-zinc-700 text-zinc-500">
                    <Icon name="user-shield" className="text-sm" />
                  </div>
                  <div>
                    <h3 className="font-bold text-zinc-900 dark:text-zinc-100 truncate">
                      {member.roleName}
                    </h3>
                    <p className="text-[10px] text-zinc-400 font-bold max-w-[150px] truncate">
                      {member.email}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveStaff(member.id)}
                  className="w-8 h-8 rounded-full bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-colors flex items-center justify-center"
                >
                  <Icon name="trash" className="text-xs" />
                </button>
              </div>

              <div className="mt-4 border-t border-zinc-100 dark:border-zinc-800 pt-4">
                <p className="text-[9px] font-bold  tracking-normal text-zinc-400 mb-3">
                  Permissions
                </p>
                <div className="flex flex-wrap gap-2">
                  {member.permissions?.map((p: string) => (
                    <span
                      key={p}
                      className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded text-[9px] font-bold  tracking-normal border border-zinc-200 dark:border-zinc-700"
                    >
                      {ALL_MODULES.find((m) => m.id === p)?.name || p}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ManageStaff;
