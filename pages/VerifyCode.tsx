import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useNotify } from "../components/Notifications";
import { Loader2 } from "lucide-react";
import { updateProfile, EmailAuthProvider, linkWithCredential } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { getFriendlyErrorMessage } from "../lib/firebaseErrorMapper";

const VerifyCode: React.FC = () => {
  const navigate = useNavigate();
  const notify = useNotify();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState("");

  useEffect(() => {
    const signupPhone = sessionStorage.getItem('signup_phone');
    if (signupPhone) setPhone(signupPhone);
    
    if (!window.confirmationResult) {
      notify("OTP session expired or invalid. Please sign up again.", "error");
      navigate("/signup");
    }
  }, [navigate, notify]);

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (code.length !== 6) return notify("Please enter a 6-digit code.", "error");
    if (!window.confirmationResult) return navigate("/signup");

    setLoading(true);
    try {
      const result = await window.confirmationResult.confirm(code);
      const user = result.user;
      
      const name = sessionStorage.getItem('signup_name') || "";
      
      // Update display name if it's new
      if (!user.displayName && name) {
        await updateProfile(user, { displayName: name });
      }

      // Try to link email credential if password was set
      const signupPassword = sessionStorage.getItem('signup_password');
      if (signupPassword && user.phoneNumber) {
        try {
           const fakeEmail = `${user.phoneNumber.replace('+', '')}@phone.deepshop.top`;
           const cred = EmailAuthProvider.credential(fakeEmail, signupPassword);
           await linkWithCredential(user, cred);
           
           // Keep saved accounts list updated
           try {
             const accountsStr = localStorage.getItem("vibe_saved_accounts");
             let accounts = accountsStr ? JSON.parse(accountsStr) : [];
             accounts = accounts.filter((a: any) => a.uid !== user.uid);
             accounts.push({
                 uid: user.uid,
                 email: fakeEmail,
                 password: signupPassword,
                 displayName: name || user.displayName,
                 photoURL: user.photoURL || "",
                 lastPasswordChange: null,
             });
             localStorage.setItem("vibe_saved_accounts", JSON.stringify(accounts));
           } catch (e) {}
        } catch (linkError) {
           console.log("Could not link email password:", linkError);
        }
      }

      // Create or update Firestore profile
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) {
        const userData = {
          uid: user.uid,
          email: user.email || "",
          phoneNumber: user.phoneNumber || phone,
          displayName: name,
          role: "user",
          isBanned: false,
          createdAt: Date.now(),
          registrationDate: Date.now(),
          lastActive: Date.now(),
        };
        await setDoc(doc(db, "users", user.uid), userData);
        notify("Account created successfully!", "success");
      } else {
        notify("Logged in successfully!", "success");
      }
      
      // Clear session data
      sessionStorage.removeItem('signup_name');
      sessionStorage.removeItem('signup_phone');
      sessionStorage.removeItem('signup_password');
      delete window.confirmationResult;

      navigate("/");
    } catch (err: any) {
      notify(getFriendlyErrorMessage(err), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 animate-fade-in h-screen flex flex-col bg-white dark:bg-zinc-950">
      <div className="text-center flex-1 max-w-md mx-auto w-full pt-12">
        <h1 className="text-2xl font-bold mb-4 text-zinc-900 dark:text-zinc-100">Verify Code</h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-10">
          Please enter the 6-digit code we sent to{" "}
          <span className="text-black dark:text-white font-bold block mt-1 text-lg">
            {phone || "your phone"}
          </span>
        </p>

        <form onSubmit={handleVerify} className="space-y-8">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            className="w-full text-center text-4xl tracking-[1em] font-bold bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl h-24 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all"
            autoFocus
          />

          <Button
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full h-14 text-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-900 text-white rounded-xl font-semibold transition-all"
          >
            {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
            {loading ? "Verifying..." : "Verify & Continue"}
          </Button>
        </form>

        <p className="text-sm mt-10 text-zinc-500">
          Didn't receive OTP?{" "}
          <button 
            type="button"
            onClick={() => navigate("/signup")}
            className="font-bold text-black dark:text-white underline hover:opacity-80 transition-opacity"
          >
            Go back and try again
          </button>
        </p>
      </div>
    </div>
  );
};

export default VerifyCode;
