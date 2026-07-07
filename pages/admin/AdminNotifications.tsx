import React, { useState } from "react";
import { db } from "../../firebase";
import { collection, addDoc } from "firebase/firestore";
import { useNotify } from "../../components/Notifications";
import { useNavigate } from "react-router-dom";
import Icon from "../../components/Icon";

const AdminNotifications: React.FC = () => {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const notify = useNotify();
  const navigate = useNavigate();

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Save to Firestore so it shows up in user's in-app notification center
      await addDoc(collection(db, "notifications"), {
        title,
        message,
        image: imageUrl || null,
        userId: "all", // Ensures it's delivered to all users via system notification page
        type: "global",
        readStatus: {},
        createdAt: Date.now(),
      });

      notify("Notification broadcasted successfully!", "success");
      setTitle("");
      setMessage("");
      setImageUrl("");
    } catch (error) {
      console.error(error);
      notify("Failed to send notification.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 min-h-screen bg-zinc-50 dark:bg-zinc-800/30">
      

      <div className="bg-zinc-50 dark:bg-zinc-800 p-8 md:p-10 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm max-w-2xl mx-auto">
        <div className="flex items-center space-x-4 mb-8">
          <div className="w-14 h-14 bg-zinc-50 dark:bg-zinc-900 rounded-full flex items-center justify-center border border-zinc-200">
            <Icon
              name="satellite-dish"
              className="text-zinc-900 dark:text-zinc-100 text-xl"
            />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Broadcast Alert
            </h2>
            <p className="text-xs font-semibold text-zinc-400 mt-0.5">
              Send push alerts to all opted-in devices
            </p>
          </div>
        </div>

        <form onSubmit={handleSendNotification} className="space-y-6">
          <div>
            <label className="block text-[10px] font-bold text-zinc-500  tracking-normal mb-2">
              Notification Title
            </label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              type="text"
              placeholder="e.g. Flash Sale Live Now!"
              className="w-full bg-zinc-50 dark:bg-zinc-800 px-5 py-4 rounded-xl outline-none border border-zinc-200 dark:border-zinc-700 focus:border-zinc-900 dark:border-white focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white transition-all font-medium text-sm"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-zinc-500  tracking-normal mb-2">
              Message Body
            </label>
            <textarea
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              placeholder="Enter the notification description here..."
              className="w-full bg-zinc-50 dark:bg-zinc-800 px-5 py-4 rounded-xl outline-none border border-zinc-200 dark:border-zinc-700 focus:border-zinc-900 dark:border-white focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white transition-all font-medium text-sm resize-none"
            ></textarea>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-zinc-500  tracking-normal mb-2">
              Image URL (Optional)
            </label>
            <input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              type="url"
              placeholder="https://example.com/image.jpg"
              className="w-full bg-zinc-50 dark:bg-zinc-800 px-5 py-4 rounded-xl outline-none border border-zinc-200 dark:border-zinc-700 focus:border-zinc-900 dark:border-white focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white transition-all font-medium text-sm"
            />
            {imageUrl && (
              <div className="mt-4 rounded-full overflow-hidden border border-zinc-200 dark:border-zinc-700 shadow-sm max-w-xs">
                <img
                  src={imageUrl}
                  alt="Attachment Preview"
                  className="w-full h-auto object-cover"
                />
              </div>
            )}
          </div>
          <div className="pt-4">
            <button
              disabled={loading}
              type="submit"
              className="w-full py-4 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-full font-bold text-xs  tracking-normal shadow-lg shadow-[#06331e]/20 hover:bg-[#0a4a2b] transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center space-x-3"
            >
              <Icon name="paper-plane" />
              <span>{loading ? "Sending..." : "Send Broadcast Now"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminNotifications;
