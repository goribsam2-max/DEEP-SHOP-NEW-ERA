import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNotify } from "../components/Notifications";
import { collection, addDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import SEO from "../components/SEO";
import Icon from "../components/Icon";

const ContactUs: React.FC = () => {
  const navigate = useNavigate();
  const notify = useNotify();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      return notify("Please fill all fields", "error");
    }

    setLoading(true);
    try {
      await addDoc(collection(db, "helpdesk"), {
        userId: auth.currentUser?.uid || "guest",
        userName: formData.name,
        userEmail: formData.email,
        subject: "Contact Us Inquiry",
        message: formData.message,
        status: "open",
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      notify(
        "Your message has been sent successfully. We will get back to you soon.",
        "success",
      );
      setFormData({ name: "", email: "", message: "" });
    } catch (e) {
      notify("Failed to send message", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-zinc-50 dark:bg-[#121212] min-h-screen font-sans pb-24">
      <SEO
        title="Contact Us | DEEP SHOP"
        description="Contact DEEP SHOP for inquiries, support, and help. Bangladesh's trusted platform for Border Cross Products + genuine mobiles."
      />
      
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 pt-10 pb-16 px-6 text-center">
         <h1 className="text-3xl md:text-4xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight mb-4">
           Get in touch
         </h1>
         <p className="text-zinc-500 dark:text-zinc-400 text-sm md:text-base max-w-md mx-auto leading-relaxed">
           We're here to help. Reach out for order inquiries, support, or general questions, and our team will get back to you shortly.
         </p>
      </div>

      <div className="max-w-3xl mx-auto px-6 -mt-8">
         <div className="grid md:grid-cols-[1fr_1fr] gap-6">
            
            {/* Contact Info Cards */}
            <div className="space-y-4">
              <a href="mailto:support@deepshop.com.bd" className="p-6 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-[2rem] hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-600 transition-all flex items-start gap-4 group text-left block">
                <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 group-hover:bg-zinc-900 group-hover:text-white dark:group-hover:bg-zinc-100 dark:group-hover:text-zinc-900 transition-colors">
                  <Icon name="envelope" className="text-lg" />
                </div>
                <div>
                  <h4 className="font-bold text-base text-zinc-900 dark:text-zinc-100 tracking-tight">Email Us</h4>
                  <p className="text-xs text-zinc-500 mt-1 font-semibold">support@deepshop.com.bd</p>
                </div>
              </a>
              
              <a href="tel:01778953114" className="p-6 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-[2rem] hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-600 transition-all flex items-start gap-4 group text-left block">
                <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 group-hover:bg-zinc-900 group-hover:text-white dark:group-hover:bg-zinc-100 dark:group-hover:text-zinc-900 transition-colors">
                  <Icon name="phone-alt" className="text-lg" />
                </div>
                <div>
                  <h4 className="font-bold text-base text-zinc-900 dark:text-zinc-100 tracking-tight">Call Us</h4>
                  <p className="text-xs text-zinc-500 mt-1 font-semibold">01778953114 (10 AM to 10 PM)</p>
                </div>
              </a>
              
              <a href="https://wa.me/8801778953114" target="_blank" rel="noreferrer" className="p-6 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-[2rem] hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-800 transition-all flex items-start gap-4 group text-left block">
                <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <Icon name="whatsapp" className="text-lg" />
                </div>
                <div>
                  <h4 className="font-bold text-base text-zinc-900 dark:text-zinc-100 tracking-tight">WhatsApp</h4>
                  <p className="text-xs text-zinc-500 mt-1 font-semibold">Message for quick support</p>
                </div>
              </a>
            </div>

            {/* Form */}
            <div className="bg-white dark:bg-zinc-900 rounded-[2rem] shadow-sm border border-zinc-100 dark:border-zinc-800 p-6 md:p-8">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-[13px] font-bold text-zinc-500 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-2xl px-5 py-3.5 outline-none focus:border-zinc-900 dark:focus:border-white transition-all text-sm font-semibold text-zinc-900 dark:text-zinc-100"
                    placeholder="Your Name"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-zinc-500 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-2xl px-5 py-3.5 outline-none focus:border-zinc-900 dark:focus:border-white transition-all text-sm font-semibold text-zinc-900 dark:text-zinc-100"
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <label className="block text-[13px] font-bold text-zinc-500 mb-2">
                    Message
                  </label>
                  <textarea
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 rounded-2xl px-5 py-3.5 outline-none focus:border-zinc-900 dark:focus:border-white transition-all text-sm font-medium text-zinc-800 dark:text-zinc-200 h-32 resize-none"
                    placeholder="How can we help you?"
                  ></textarea>
                </div>
                <div className="pt-2">
                  <button
                    disabled={loading}
                    type="submit"
                    className="w-full py-4 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold text-sm tracking-wide shadow-lg hover:shadow-xl active:scale-[0.98] transition-all disabled:opacity-70 disabled:pointer-events-none flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <Icon name="spinner" className="animate-spin text-lg" />
                    ) : null}
                    {loading ? "Sending..." : "Send Message"}
                  </button>
                </div>
              </form>
            </div>

         </div>
      </div>
    </div>
  );
};

export default ContactUs;
