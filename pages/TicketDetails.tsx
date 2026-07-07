import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db, auth } from "../firebase";
import { HelpTicket } from "../types";
import { useNotify } from "../components/Notifications";
import Icon from "../components/Icon";

const TicketDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const notify = useNotify();
  const [ticket, setTicket] = useState<HelpTicket | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTicket = async () => {
      if (!id || !auth.currentUser) return;
      try {
        const snap = await getDoc(doc(db, "helpdesk", id));
        if (snap.exists()) {
          const data = { id: snap.id, ...snap.data() } as HelpTicket;
          setTicket(data);

          // Mark as viewed
          if (!data.viewedByUser && data.adminReply) {
            await updateDoc(doc(db, "helpdesk", id), { viewedByUser: true });
          }
        } else {
          notify("Ticket not found", "error");
          navigate("/help-center");
        }
      } catch (err) {
        console.error(err);
        notify("Error loading ticket", "error");
      }
      setLoading(false);
    };
    fetchTicket();
  }, [id, navigate, notify]);

  const handleFeedback = async (feedback: "Satisfied" | "Not Satisfied") => {
    if (!ticket) return;
    try {
      await updateDoc(doc(db, "helpdesk", ticket.id), {
        feedback,
        updatedAt: Date.now(),
      });
      setTicket({ ...ticket, feedback });
      notify("Thank you for your feedback!", "success");
    } catch (e) {
      notify("Error submitting feedback", "error");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-800/30">
        <Icon
          name="spinner"
          className="animate-spin text-zinc-900 dark:text-zinc-100 text-xl"
        />
      </div>
    );
  }

  if (!ticket) return null;

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 min-h-screen bg-zinc-50 dark:bg-zinc-800 font-inter">
      

      <div className="space-y-6">
        {/* User Original Request */}
        <div className="bg-zinc-50 dark:bg-zinc-800 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-bold text-sm tracking-tight text-zinc-900 dark:text-zinc-100 mb-1">
                {ticket.subject}
              </h3>
              <p className="text-[9px] font-bold  tracking-normal text-zinc-400">
                {new Date(ticket.createdAt).toLocaleString()}
              </p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-[9px] font-bold  tracking-normal ${ticket.status === "Open" ? "bg-orange-100 text-orange-600" : ticket.status === "Replied" ? "bg-blue-100 text-blue-600" : ticket.status === "Resolved" ? "bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200" : "bg-zinc-200 text-zinc-600 dark:text-zinc-400"}`}
            >
              {ticket.status}
            </span>
          </div>
          <div className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium whitespace-pre-wrap">
            {ticket.message}
          </div>
        </div>

        {/* Admin Reply */}
        {ticket.adminReply ? (
          <div className="bg-zinc-50 dark:bg-zinc-900/50 p-6 rounded-2xl border border-zinc-200 shadow-sm">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center shrink-0">
                <Icon
                  name="headset"
                  className="text-zinc-800 dark:text-zinc-200 text-sm"
                />
              </div>
              <div>
                <h3 className="font-bold text-sm tracking-tight text-emerald-900 dark:text-emerald-400">
                  Support Team
                </h3>
                <p className="text-[9px] font-bold  tracking-normal text-zinc-800 dark:text-zinc-400">
                  {ticket.updatedAt
                    ? new Date(ticket.updatedAt).toLocaleString()
                    : "Recently"}
                </p>
              </div>
            </div>
            <div className="text-xs text-emerald-900/80 dark:text-emerald-200/90 leading-relaxed font-medium whitespace-pre-wrap mb-6">
              {ticket.adminReply}
            </div>

            {/* Feedback Section */}
            <div className="border-t border-zinc-200 dark:border-zinc-800/50 pt-5">
              <h4 className="text-[10px] font-bold  tracking-normal text-emerald-800 dark:text-emerald-500 mb-3 text-center">
                HOW WAS OUR SUPPORT?
              </h4>

              {ticket.feedback ? (
                <div className="text-center bg-zinc-50 dark:bg-zinc-800 py-3 rounded-full border border-zinc-200">
                  <span className="text-xs font-bold text-zinc-950 dark:text-zinc-50">
                    You marked this as:{" "}
                    <Icon
                      name={ticket.feedback === "Satisfied" ? "smile" : "frown"}
                      className="ml-1 mr-1"
                    />{" "}
                    {ticket.feedback}
                  </span>
                </div>
              ) : (
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => handleFeedback("Satisfied")}
                    className="flex-1 py-3 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-800 dark:bg-zinc-200 hover:text-white rounded-full font-bold text-[10px]  tracking-normal transition-colors flex items-center justify-center"
                  >
                    <Icon name="smile" className="text-sm mr-2" /> Satisfied
                  </button>
                  <button
                    onClick={() => handleFeedback("Not Satisfied")}
                    className="flex-1 py-3 bg-zinc-50 dark:bg-zinc-800 text-red-600 border border-red-200 hover:bg-red-600 hover:text-white rounded-full font-bold text-[10px]  tracking-normal transition-colors flex items-center justify-center"
                  >
                    <Icon name="frown" className="text-sm mr-2" /> Not Satisfied
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 px-6 bg-zinc-50 dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-800 border-solid">
            <Icon
              name="hourglass-half"
              className="text-lg text-zinc-300 mb-3"
            />
            <p className="text-xs font-bold tracking-normal  text-zinc-400">
              Please Wait
            </p>
            <p className="text-[10px] mt-1 text-zinc-400 font-medium leading-relaxed max-w-[200px] mx-auto">
              Our support team is reviewing your ticket and will reply here
              soon.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketDetails;
