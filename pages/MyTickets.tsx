import React, { useState, useEffect } from "react";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db, auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import Icon from "../components/Icon";
import { HelpTicket } from "../types";

const MyTickets: React.FC = () => {
  const [tickets, setTickets] = useState<HelpTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTickets = async () => {
      if (!auth.currentUser) {
        setLoading(false);
        return;
      }
      try {
        const q = query(
          collection(db, "helpdesk"),
          where("userId", "==", auth.currentUser.uid)
        );
        const snap = await getDocs(q);
        const data = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as HelpTicket)).sort((a, b) => b.createdAt - a.createdAt);
        setTickets(data);
      } catch (error) {
        console.error("Error fetching tickets:", error);
      }
      setLoading(false);
    };

    fetchTickets();
  }, []);

  return (
    <div className="bg-zinc-50 dark:bg-[#121212] min-h-screen font-sans pb-24">
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 pt-10 pb-16 px-6 text-center">
        <h1 className="text-3xl md:text-4xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight mb-4">
          My Support Tickets
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm md:text-base max-w-md mx-auto">
          View and track your support inquiries.
        </p>
      </div>

      <div className="max-w-3xl mx-auto px-6 -mt-8">
        {loading ? (
          <div className="flex justify-center p-10">
            <Icon name="spinner" className="animate-spin text-2xl text-zinc-500" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 rounded-[2rem] shadow-sm border border-zinc-100 dark:border-zinc-800 p-10 text-center">
            <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4 text-zinc-400">
              <Icon name="ticket-alt" className="text-2xl" />
            </div>
            <h3 className="font-bold text-zinc-900 dark:text-zinc-100 mb-2">No tickets yet</h3>
            <p className="text-sm text-zinc-500 mb-6">You haven't submitted any support requests.</p>
            <button
              onClick={() => navigate("/help-center")}
              className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold px-6 py-2.5 rounded-full text-sm"
            >
              Contact Support
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {tickets.map((ticket) => (
              <div
                key={ticket.id}
                onClick={() => navigate(`/ticket/${ticket.id}`)}
                className="bg-white dark:bg-zinc-900 rounded-[2rem] shadow-sm border border-zinc-100 dark:border-zinc-800 p-5 md:p-6 cursor-pointer hover:shadow-md transition-shadow group flex items-start gap-4"
              >
                <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex flex-col items-center justify-center shrink-0">
                  <Icon name="envelope-open-text" className="text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold text-base text-zinc-900 dark:text-zinc-100 truncate pr-4">
                      {ticket.subject}
                    </h4>
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wide whitespace-nowrap ${
                        ticket.status === "Open"
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                          : ticket.status === "Replied"
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                          : ticket.status === "Resolved"
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                          : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
                      }`}
                    >
                      {ticket.status}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-1 mb-2">
                    {ticket.message}
                  </p>
                  <div className="flex items-center gap-3 text-[11px] font-semibold text-zinc-400">
                    <span>
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </span>
                    {ticket.adminReply && !ticket.viewedByUser && (
                      <span className="flex items-center text-red-500 bg-red-100 dark:bg-red-900/20 px-2 py-0.5 rounded-md">
                        <Icon name="bell" className="text-[10px] mr-1" /> New Reply
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyTickets;
