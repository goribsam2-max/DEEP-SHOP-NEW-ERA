import React, { useState, useEffect } from "react";
import { db } from "../../firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import Icon from "../../components/Icon";
import { useNotify, useConfirm } from "../../components/Notifications";

const ManageAffiliateVideos: React.FC = () => {
  const notify = useNotify();
  const confirmPopup = useConfirm();
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, "creator_videos"),
      orderBy("createdAt", "desc"),
    );
    const unsub = onSnapshot(q, (snapshot) => {
      const v: any[] = [];
      snapshot.forEach((d) => v.push({ id: d.id, ...d.data() }));
      setVideos(v);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleAction = async (
    videoId: string,
    userId: string,
    action: "approve" | "reject",
    reward: number,
  ) => {
    confirmPopup({
      title: `${action === 'approve'? 'Approve' : 'Reject'} Video`,
      message: `Are you sure you want to ${action} this video submission?`,
      onConfirm: async () => {
        try {
          await updateDoc(doc(db, "creator_videos", videoId), {
            status: action === "approve" ? "approved" : "rejected",
            updatedAt: Date.now(),
          });

          if (action === "approve") {
            const userRef = doc(db, "users", userId);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
              await updateDoc(userRef, {
                walletBalance: (userSnap.data().walletBalance || 0) + reward,
              });
            }
          }
          notify(`Video submission ${action}d successfully.`, "success");
        } catch (e) {
          notify("Action failed", "error");
        }
      }
    });
  };

  if (loading)
    return (
      <div className="p-10 flex justify-center">
        <Icon name="spinner-third" className="animate-spin text-2xl" />
      </div>
    );

  return (
    <div className="p-6 max-w-6xl mx-auto pb-32">
      <h1 className="text-2xl font-semibold mb-6 flex items-center gap-3">
        <Icon name="video" className="text-zinc-900 dark:text-zinc-100" /> Manage
        Creator Videos
      </h1>
      <div className="bg-white dark:bg-zinc-900 rounded-full border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800  text-[9px] font-bold text-zinc-500 tracking-wider">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Video Info</th>
                <th className="px-6 py-4">Reward</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
              {videos.map((v) => (
                <tr
                  key={v.id}
                  className="hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-colors"
                >
                  <td className="px-6 py-4">
                    <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                      {v.userName}
                    </p>
                    <p className="text-[10px] text-zinc-500">
                      {v.userCode || "No Code"}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2 items-center">
                      <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[10px] font-bold">
                        {v.platform}
                      </span>
                      <a
                        href={v.videoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-500 hover:underline"
                      >
                        {v.videoUrl}
                      </a>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-bold text-zinc-800 dark:text-zinc-200 dark:text-zinc-800 dark:text-zinc-200">
                    ৳{v.rewardAmount}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded text-[10px] font-bold  ${v.status === "pending" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" : v.status === "approved" ? "bg-zinc-200 dark:bg-zinc-700 text-zinc-950 dark:text-zinc-50 dark:bg-emerald-900/30 dark:text-zinc-800 dark:text-zinc-200" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}
                    >
                      {v.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-zinc-500">
                    {new Date(v.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    {v.status === "pending" && (
                      <>
                        <button
                          onClick={() =>
                            handleAction(
                              v.id,
                              v.userId,
                              "approve",
                              v.rewardAmount,
                            )
                          }
                          className="px-3 py-1.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:bg-zinc-200 text-white rounded text-[10px] font-bold transition-colors"
                        >
                          Approve & Pay
                        </button>
                        <button
                          onClick={() =>
                            handleAction(
                              v.id,
                              v.userId,
                              "reject",
                              v.rewardAmount,
                            )
                          }
                          className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded text-[10px] font-bold transition-colors"
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {videos.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-10 text-center text-zinc-500 font-medium"
                  >
                    No videos submitted yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ManageAffiliateVideos;
