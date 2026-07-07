import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../firebase";
import { useNotify } from "../components/Notifications";
import { motion } from "framer-motion";
import Icon from "../components/Icon";
import { getFriendlyErrorMessage } from "../lib/firebaseErrorMapper";
import { AuthLayout } from "../components/AuthLayout";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { validateInput } from "../lib/utils";

const ForgotPassword: React.FC = () => {
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const notify = useNotify();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail)
      return notify("Please enter your email or phone number", "error");

    const isPhoneNumber = /^[0-9+]+$/.test(resetEmail.replace(/[-.\s]/g, ""));
    const type = isPhoneNumber ? 'phone' : 'email';
    
    // Only validate if it's not the admin
    if (resetEmail !== "admin@vibe.shop") {
      const error = validateInput(resetEmail, type);
      if (error) return notify(error, "error");
    }

    setResetLoading(true);
    try {
      if (isPhoneNumber) {
        // Just show success state, admin will manually give the password
        const res = await fetch('/api/reset-password-request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier: resetEmail })
        });
        const data = await res.json();
        if (!data.success) {
           return notify(data.error || "Failed to request password reset", "error");
        }
        setSuccess(true);
      } else {
        const actionCodeSettings = {
          url: window.location.origin + "/signin", // will redirect here after reset
          handleCodeInApp: true,
        };
        await sendPasswordResetEmail(auth, resetEmail, actionCodeSettings);
        setSuccess(true);
      }
    } catch (err: any) {
      notify(getFriendlyErrorMessage(err), "error");
    } finally {
      setResetLoading(false);
    }
  };

  if (success) {
    const isPhoneNumber = /^\+?[0-9]{8,15}$/.test(
      resetEmail.replace(/[-.\s]/g, ""),
    );

    return (
      <AuthLayout
        title={isPhoneNumber ? "Check your Phone" : "Check your email"}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          className="text-center"
        >
          <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
            {isPhoneNumber ? (
              <>
                Check your Whatsapp or text message to get one time password for{" "}
                <strong className="text-foreground">{resetEmail}</strong>.
              </>
            ) : (
              <>
                We've sent a password reset link to{" "}
                <strong className="text-foreground">{resetEmail}</strong>.
                Please check your inbox and spam folder.
              </>
            )}
          </p>
          <Button
            onClick={() => navigate("/signin")}
            size="lg"
            className="w-full"
          >
            Back to Sign In
          </Button>
        </motion.div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Reset Password"
      subtitle="Enter your email or phone number to reset your password."
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email or Phone</Label>
            <Input
              id="email"
              type="text"
              required
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              placeholder="Email address or Phone number"
            />
          </div>

          <Button
            disabled={resetLoading}
            type="submit"
            size="lg"
            className="w-full"
          >
            {resetLoading ? (
              <Icon name="spinner" className="mr-2 animate-spin" />
            ) : null}
            {resetLoading ? "Sending Link..." : "Send Reset Link"}
          </Button>
        </form>
      </motion.div>
    </AuthLayout>
  );
};

export default ForgotPassword;
