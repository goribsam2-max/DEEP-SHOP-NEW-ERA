import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { verifyPasswordResetCode, confirmPasswordReset } from "firebase/auth";
import { auth } from "../firebase";
import { useNotify } from "../components/Notifications";
import Icon from "../components/Icon";
import { getFriendlyErrorMessage } from "../lib/firebaseErrorMapper";
import SEO from "../components/SEO";
import { Button } from "@/components/ui/button";

const NewPassword: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const notify = useNotify();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [oobCode, setOobCode] = useState("");

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const code = queryParams.get("oobCode");
    const mode = queryParams.get("mode");

    if (mode === "resetPassword" && code) {
      setOobCode(code);
      verifyPasswordResetCode(auth, code)
        .then((email) => {
          setEmail(email);
        })
        .catch((error) => {
          notify(
            "Invalid or expired reset link. Please try resetting your password again.",
            "error",
          );
          navigate("/signin");
        });
    } else {
      notify("Invalid reset link.", "error");
      navigate("/signin");
    }
  }, [location, notify, navigate]);

  const handleReset = async () => {
    if (!password) return notify("Please enter a new password", "error");
    if (password !== confirm) return notify("Passwords do not match", "error");
    if (password.length < 6)
      return notify("Password must be at least 6 characters", "error");

    setLoading(true);
    try {
      await confirmPasswordReset(auth, oobCode, password);
      notify("Password reset successful! You can now sign in.", "success");
      navigate("/signin");
    } catch (error: any) {
      notify(getFriendlyErrorMessage(error), "error");
    } finally {
      setLoading(false);
    }
  };

  if (!email)
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-800">
        <Icon
          name="spinner"
          className="animate-spin text-lg text-zinc-800 dark:text-zinc-200"
        />
      </div>
    );

  return (
    <div className="p-6 md:p-12 animate-fade-in bg-zinc-50 dark:bg-zinc-800 max-w-xl mx-auto min-h-screen font-inter">
      <SEO
        title="Reset Password"
        description="Create a new password for your DEEP SHOP account."
      />
      
      <div className="mb-10 text-center md:text-left">
        <h2 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight mb-3">
          Create New Password
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium leading-relaxed max-w-xl">
          Your new password must be different from previously used passwords.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1.5">
            New Password
          </label>
          <div className="flex bg-white dark:bg-[#121212] border border-zinc-200 dark:border-zinc-800 p-1.5 rounded-xl transition-all h-14">
            <div className="flex items-center justify-center w-12 text-zinc-400 dark:text-zinc-600">
              <Icon name="lock" />
            </div>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="flex-1 bg-transparent pr-4 text-sm font-semibold text-zinc-800 dark:text-zinc-200 outline-none w-full"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 block mb-1.5">
            Confirm Password
          </label>
          <div className="flex bg-white dark:bg-[#121212] border border-zinc-200 dark:border-zinc-800 p-1.5 rounded-xl transition-all h-14">
            <div className="flex items-center justify-center w-12 text-zinc-400 dark:text-zinc-600">
              <Icon name="lock" />
            </div>
            <input
              type="password"
              placeholder="••••••••"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="flex-1 bg-transparent pr-4 text-sm font-semibold text-zinc-800 dark:text-zinc-200 outline-none w-full"
            />
          </div>
        </div>
      </div>

      <Button
        disabled={loading}
        onClick={handleReset}
        variant="primary" className="w-full py-4 shadow-sm shadow-zinc-200 mt-12 disabled:opacity-50 flex items-center justify-center text-sm"
      >
        {loading ? <Icon name="spinner" className="mr-2 animate-spin" /> : null}
        {loading ? "Resetting..." : "Create New Password"}
      </Button>
    </div>
  );
};

export default NewPassword;
