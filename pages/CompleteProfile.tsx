import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNotify } from "../components/Notifications";
import { auth, db } from "../firebase";
import { doc, updateDoc } from "firebase/firestore";
import Icon from "../components/Icon";
import { Button } from "@/components/ui/button";

const CompleteProfile: React.FC = () => {
  const navigate = useNavigate();
  const notify = useNotify();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: auth.currentUser?.displayName || "",
    phone: "",
    gender: "",
  });

  const handleComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    setLoading(true);
    try {
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        displayName: formData.name,
        phoneNumber: formData.phone,
        gender: formData.gender,
        profileCompleted: true,
      });
      notify("Profile updated!", "success");
      navigate("/location");
    } catch (error) {
      notify("Failed to update profile", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 animate-fade-in flex flex-col h-screen bg-zinc-50 dark:bg-zinc-800">
      

      <div className="text-center mb-10">
        <h1 className="text-lg font-bold mb-4">Complete Your Profile</h1>
        <p className="text-zinc-500 text-sm">
          Don't worry, only you can see your personal data. No one else will be
          able to see it.
        </p>
      </div>

      <div className="flex-1">
        <div className="flex justify-center mb-10">
          <div className="relative">
            <div className="w-24 h-24 bg-[#f4f4f5] dark:bg-zinc-800/80 rounded-full flex items-center justify-center">
              <Icon name="user" className="w-12 h-12 text-zinc-400" />
            </div>
            <button className="absolute bottom-0 right-0 p-1.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-full border-2 border-white">
              <Icon name="plus" className="text-xs" />
            </button>
          </div>
        </div>
        <form onSubmit={handleComplete} className="space-y-6">
          <div>
            <label className="block text-sm font-bold mb-2">Name</label>
            <input
              type="text"
              placeholder="John Doe"
              className="w-full bg-[#f4f4f5] dark:bg-zinc-800/80 p-4 rounded-2xl outline-none border border-transparent focus:border-zinc-900 dark:border-white transition-all"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-2">Phone Number</label>
            <div className="flex space-x-2">
              <div className="bg-[#f4f4f5] dark:bg-zinc-800/80 p-4 rounded-2xl font-bold text-sm">
                +880
              </div>
              <input
                type="tel"
                placeholder="1XXXXXXXXX"
                className="flex-1 bg-[#f4f4f5] dark:bg-zinc-800/80 p-4 rounded-2xl outline-none border border-transparent focus:border-zinc-900 dark:border-white transition-all"
                required
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold mb-2">Gender</label>
            <select
              className="w-full bg-[#f4f4f5] dark:bg-zinc-800/80 p-4 rounded-2xl outline-none border border-transparent focus:border-zinc-900 dark:border-white transition-all appearance-none"
              required
              value={formData.gender}
              onChange={(e) =>
                setFormData({ ...formData, gender: e.target.value })
              }
            >
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <Button
            variant="primary"
            disabled={loading}
            className="w-full mt-10 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Complete Profile"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default CompleteProfile;
