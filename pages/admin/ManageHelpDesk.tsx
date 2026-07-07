import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  setDoc,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../../firebase";
import { useNotify } from "../../components/Notifications";
import Icon from "../../components/Icon";
import { HelpTicket } from "../../types";

const ManageHelpDesk: React.FC = () => {
  const navigate = useNavigate();
  const notify = useNotify();
  const [tickets, setTickets] = useState<HelpTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "helpdesk"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setTickets(
        snap.docs.map((d) => ({ id: d.id, ...d.data() }) as HelpTicket),
      );
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, "helpdesk", id), {
        status: newStatus,
        updatedAt: Date.now(),
      });
      notify(`Ticket marked as ${newStatus}`, "success");
      fetchTickets();
    } catch (e) {
      notify("Error updating ticket", "error");
    }
  };

  const handleSendReply = async (ticket: HelpTicket) => {
    if (!replyText.trim())
      return notify("Please enter a reply message.", "error");

    try {
      await updateDoc(doc(db, "helpdesk", ticket.id), {
        status: "Replied",
        adminReply: replyText,
        updatedAt: Date.now(),
        viewedByUser: false,
      });

      // Send Notification to user
      const notifId = doc(collection(db, "notifications")).id;
      await setDoc(doc(db, "notifications", notifId), {
        id: notifId,
        userId: ticket.userId,
        title: "Support Ticket Update",
        message: `Admin replied to your ticket: #${ticket.id.slice(0, 6)}`,
        type: "ticket",
        link: `/ticket/${ticket.id}`,
        isRead: false,
        createdAt: Date.now(),
      });

      notify("Reply sent successfully!", "success");
      setReplyingTo(null);
      setReplyText("");
      fetchTickets();
    } catch (e) {
      notify("Failed to send reply", "error");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-10 min-h-screen bg-zinc-50 dark:bg-zinc-800/50">
      

      <div className="space-y-6">
        {loading ? (
          <div className="py-20 text-center">
            <Icon
              name="spinner"
              className="animate-spin text-zinc-900 dark:text-zinc-100 text-3xl"
            />
          </div>
        ) : tickets.length > 0 ? (
          <div className="flex flex-col gap-6">
            {tickets.map((t) => (
              <div
                key={t.id}
                className="bg-white dark:bg-zinc-900 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col"
              >
                <div className="p-6 md:p-8 flex items-start gap-4 flex-col md:flex-row">
                  <div className="flex-1 min-w-0 w-full">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className="font-mono text-[10px] uppercase font-bold text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-md mb-2 inline-block">
                          #{t.id.slice(0, 8)}
                        </span>
                        <h3 className="text-xl font-bold text-zinc-900 dark:text-white tracking-tight mb-1">
                          {t.subject}
                        </h3>
                        <div className="flex items-center gap-2 text-xs font-medium text-zinc-500">
                           <Icon name="user" className="text-[10px]" /> {t.userName || "Unknown User"}
                           <span className="text-zinc-300 dark:text-zinc-700">•</span>
                           <span>{t.userEmail}</span>
                           <span className="text-zinc-300 dark:text-zinc-700">•</span>
                           <span>{new Date(t.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <span
                        className={`px-4 py-1.5 rounded-full text-xs font-bold shrink-0 ${t.status === "Open" ? "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400" : t.status === "Replied" ? "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400" : t.status === "Resolved" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400" : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"}`}
                      >
                        {t.status || "Open"}
                      </span>
                    </div>

                    <div className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed font-medium whitespace-pre-wrap bg-zinc-50 dark:bg-zinc-800/50 p-5 rounded-2xl mb-4 border border-zinc-100 dark:border-zinc-800">
                      {t.message}
                    </div>

                    <div className="flex flex-wrap gap-3 items-center">
                      <select
                        value={t.status || "Open"}
                        onChange={(e) =>
                          handleUpdateStatus(t.id, e.target.value)
                        }
                        className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-xs font-bold py-2.5 px-4 rounded-full cursor-pointer hover:border-zinc-300 focus:outline-none"
                      >
                        <option value="Open">Status: Open</option>
                        <option value="In Progress">Status: In Progress</option>
                        <option value="Replied">Status: Replied</option>
                        <option value="Resolved">Status: Resolved</option>
                        <option value="Closed">Status: Closed</option>
                      </select>

                      <button
                        onClick={() => {
                          setReplyingTo(replyingTo === t.id ? null : t.id);
                          setReplyText(replyingTo === t.id ? "" : (t.adminReply || ""));
                        }}
                        className={`px-6 py-2.5 text-xs font-bold rounded-full transition-colors border ${replyingTo === t.id ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-zinc-900 dark:border-white shadow-md" : "bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white"}`}
                      >
                        {replyingTo === t.id
                          ? "Cancel Reply"
                          : t.adminReply
                            ? "Edit Reply"
                            : "Write Reply"}
                      </button>

                      {t.adminReply && (
                         <div className="flex items-center gap-2 text-xs font-bold ml-auto">
                            {t.viewedByUser ? (
                              <span className="flex items-center text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1.5 rounded-full">
                                <Icon name="eye" className="mr-1.5 text-[10px]" /> User Viewed
                              </span>
                            ) : (
                              <span className="flex items-center text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-3 py-1.5 rounded-full">
                                <Icon name="eye-slash" className="mr-1.5 text-[10px]" /> Not Viewed
                              </span>
                            )}
                            {t.feedback && (
                               <span
                                 className={`flex items-center px-3 py-1.5 rounded-full border ${t.feedback === "Satisfied" ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 border-transparent" : "bg-red-50 text-red-600 border-red-200"}`}
                               >
                                 <Icon
                                   name={t.feedback === "Satisfied" ? "smile" : "frown"}
                                   className="mr-1.5 text-[10px]"
                                 />{" "}
                                 {t.feedback}
                               </span>
                            )}
                         </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Existing Admin Reply View (If not editing right now) */}
                {t.adminReply && replyingTo !== t.id && (
                   <div className="bg-emerald-50 dark:bg-emerald-500/5 px-6 md:px-8 py-5 border-t border-emerald-100 dark:border-emerald-500/10">
                      <div className="text-[10px] uppercase tracking-widest font-bold text-emerald-600 dark:text-emerald-500 mb-2">Our Reply</div>
                      <div className="text-sm font-medium text-emerald-900 dark:text-emerald-100 whitespace-pre-wrap leading-relaxed">
                         {t.adminReply}
                      </div>
                   </div>
                )}

                {/* Reply Editor */}
                {replyingTo === t.id && (
                  <div className="bg-zinc-50 dark:bg-zinc-900/50 p-6 md:p-8 border-t border-zinc-200 dark:border-zinc-800">
                    <div className="w-full">
                      <label className="block text-[11px] uppercase tracking-widest font-black text-zinc-500 mb-3">
                        {t.adminReply ? "Edit your response" : "Write your response"}
                      </label>
                      <textarea
                        rows={5}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Hello, thanks for reaching out..."
                        className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-5 text-sm font-medium text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-zinc-900 dark:focus:border-white focus:ring-4 focus:ring-zinc-900/10 transition-all resize-y mb-4 shadow-sm"
                      />
                      <div className="flex justify-end">
                        <button
                          onClick={() => handleSendReply(t)}
                          className="px-8 py-3.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-full font-bold text-sm tracking-wide shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all"
                        >
                          Send Response
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="py-24 text-center text-zinc-400 bg-white dark:bg-zinc-900 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <Icon name="inbox" className="text-4xl mb-4 text-zinc-300 dark:text-zinc-700" />
            <p className="font-bold text-lg tracking-tight text-zinc-900 dark:text-white">
              No support tickets
            </p>
            <p className="text-sm mt-1">When users need help, they'll appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageHelpDesk;
