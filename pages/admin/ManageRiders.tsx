import React, { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../../firebase";
import { useNotify } from "../../components/Notifications";
import { motion } from "framer-motion";
import Icon from "../../components/Icon";
import Modal from "../../components/ui/modal-drop";

const ManageRiders: React.FC = () => {
  const navigate = useNavigate();
  const notify = useNotify();
  const [riders, setRiders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    zone: "Dhaka",
    vehicle: "Motorcycle",
  });

  useEffect(() => {
    fetchRiders();
  }, []);

  const fetchRiders = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "riders"));
      setRiders(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleAddRider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone) return;

    try {
      const riderId = Date.now().toString();
      await setDoc(doc(db, "riders", riderId), {
        name: form.name,
        phone: form.phone,
        zone: form.zone,
        vehicle: form.vehicle,
        status: "Available",
        deliveriesCompleted: 0,
        createdAt: Date.now(),
      });
      notify(`Rider added successfully`, "success");
      setShowAdd(false);
      setForm({ name: "", phone: "", zone: "Dhaka", vehicle: "Motorcycle" });
      fetchRiders();
    } catch (err) {
      notify("Error adding rider", "error");
    }
  };

  const handleRemoveRider = async (id: string) => {
    try {
      await deleteDoc(doc(db, "riders", id));
      notify("Rider removed", "success");
      fetchRiders();
    } catch (err) {
      notify("Error removing rider", "error");
    }
  };

  const zones = ["Dhaka", "Chattogram", "Sylhet", "Rajshahi"];

  return (
    <div className="max-w-[1440px] mx-auto px-6 md:px-12 py-10 min-h-screen bg-zinc-50 dark:bg-zinc-800 animate-fade-in relative overflow-hidden">
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900/5 rounded-full blur-[100px] pointer-events-none z-0"></div>
      <div className="flex items-center justify-between mb-12 relative z-10 animate-stagger-1">
        <div className="flex items-center space-x-6">
          <div>
            <h1 className="text-xl md:text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 mb-1.5 text-shine">
              Rider Fleet
            </h1>
            <p className="text-zinc-400 text-[10px] md:text-xs font-bold tracking-normal ">
              Delivery Personnel
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className={`px-6 py-3 rounded-full font-bold text-[10px] tracking-normal shadow-lg transition-all active:scale-95 border hover-tilt hover-glow ${showAdd ? "bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-200 dark:border-zinc-700" : "bg-zinc-900 text-white border-zinc-900 hover:bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900"}`}
        >
          {showAdd ? "Cancel" : "Add Rider"}
        </button>
      </div>

      <Modal
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        title="Register Delivery Rider"
        animationType="scale"
      >
        <form onSubmit={handleAddRider} className="w-full space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400 mb-2 block">
                Full Name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Rahim Miah"
                className="w-full bg-zinc-50 dark:bg-zinc-800 p-4 rounded-2xl text-sm outline-none border border-zinc-200 dark:border-zinc-700 focus:border-black transition-colors"
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400 mb-2 block">
                Phone Number
              </label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="01XXXXXXXXX"
                className="w-full bg-zinc-50 dark:bg-zinc-800 p-4 rounded-2xl text-sm outline-none border border-zinc-200 dark:border-zinc-700 focus:border-black transition-colors"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400 mb-2 block">
                Operating Zone
              </label>
              <select
                value={form.zone}
                onChange={(e) => setForm({ ...form, zone: e.target.value })}
                className="w-full bg-zinc-50 dark:bg-zinc-800 p-4 rounded-2xl text-sm outline-none border border-zinc-200 dark:border-zinc-700 focus:border-black transition-colors hover:cursor-pointer"
              >
                {zones.map((z) => (
                  <option key={z} value={z}>
                    {z}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400 mb-2 block">
                Vehicle Type
              </label>
              <select
                value={form.vehicle}
                onChange={(e) =>
                  setForm({ ...form, vehicle: e.target.value })
                }
                className="w-full bg-zinc-50 dark:bg-zinc-800 p-4 rounded-2xl text-sm outline-none border border-zinc-200 dark:border-zinc-700 focus:border-black transition-colors hover:cursor-pointer"
              >
                <option value="Motorcycle">Motorcycle</option>
                <option value="Bicycle">Bicycle</option>
                <option value="Van">Van</option>
              </select>
            </div>
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
              className="px-8 py-3 bg-zinc-900 border-none text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-lg font-bold tracking-wide shadow-xl active:scale-95 transition-all outline-none!"
            >
              Register Rider
            </button>
          </div>
        </form>
      </Modal>

      <div className="flex flex-col space-y-3 max-w-4xl mx-auto">
        {riders.map((rider) => (
          <div
            key={rider.id}
            className="flex items-center justify-between gap-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 shadow-sm group hover:border-pink-300 dark:hover:border-pink-800 transition-colors"
          >
            <div className="flex items-start gap-4 pl-2">
              <div className="w-12 h-12 bg-pink-50 dark:bg-zinc-800 text-pink-600 dark:text-pink-400 rounded-xl flex items-center justify-center shrink-0 border border-pink-100 dark:border-zinc-700 shadow-sm">
                <Icon name="motorcycle" className="text-xl" />
              </div>
              <div>
                <div className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                  {rider.name}
                </div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400 font-medium flex gap-2 items-center mt-1">
                  <span>{rider.phone}</span>
                  <span>•</span>
                  <span>Zone: {rider.zone}</span>
                  <span>•</span>
                  <span>Trips: {rider.deliveriesCompleted || 0}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3 pr-2">
              <span className="px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-[10px] font-bold text-zinc-600 dark:text-zinc-300">
                {rider.status}
              </span>
              <button
                onClick={() => handleRemoveRider(rider.id)}
                className="flex items-center justify-center size-8 rounded-full bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors opacity-0 group-hover:opacity-100"
              >
                <Icon name="trash" className="text-xs text-red-500" />
              </button>
            </div>
          </div>
        ))}

        {riders.length === 0 && !loading && (
          <div className="py-20 text-center bg-zinc-50 dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-sm text-zinc-400">
            <Icon name="motorcycle" className="text-lg mb-4 text-zinc-300" />
            <p className="font-bold text-xs tracking-normal">
              No riders recorded yet
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageRiders;
