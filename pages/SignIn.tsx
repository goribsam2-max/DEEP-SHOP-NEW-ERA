import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";
import { useNotify } from "../components/Notifications";
import { getFriendlyErrorMessage } from "../lib/firebaseErrorMapper";
import { AuthLayout, AuthSeparator } from "../components/AuthLayout";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { AuthInputs } from "../components/AuthInputs";
import { VibeMascot, MascotState } from "../components/ui/VibeMascot";
import SEO from "../components/SEO";
import { validateInput } from "../lib/utils";

const SignIn: React.FC = () => {
  const [authType, setAuthType] = useState<"email" | "phone">("email");
  const [email, setEmail] = useState("");
  const [countryCode, setCountryCode] = useState("+880");
  const [phoneNumber, setPhoneNumber] = useState("");
  
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mascotFocus, setMascotFocus] = useState<'idle' | 'email' | 'password' | 'success' | 'error'>('idle');
  const navigate = useNavigate();

  let mascotState: MascotState = 'idle';
  if (mascotFocus === 'email') mascotState = 'email';
  else if (mascotFocus === 'password') mascotState = 'password';
  else if (mascotFocus === 'success') mascotState = 'success';
  else if (mascotFocus === 'error') mascotState = 'error';
  const notify = useNotify();

  React.useEffect(() => {
    // Removed auto redirect
  }, [navigate]);

  const getAuthEmail = () => {
    if (authType === "phone") {
      const cleanPhone = phoneNumber.startsWith("0") ? phoneNumber.substring(1) : phoneNumber;
      return `${countryCode.replace('+', '')}${cleanPhone}@phone.deepshop.top`;
    }
    return email;
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authType === "email" && 
        email !== "admin@vibe.shop" && 
        email !== "admin@deepshop.top" && 
        email !== "deepshop@gmail.com" && 
        email !== "deepshopbysam@gmail.com") {
      const error = validateInput(email, 'email');
      if (error) return notify(error, "error");
    } else if (authType === "phone") {
      const error = validateInput(phoneNumber, 'phone');
      if (error) return notify(error, "error");
    }
    
    // Also validate password to catch generic bots trying dictionary attacks
    const passError = validateInput(password, 'password');
    if (passError) return notify(passError, "error");

    setLoading(true);
    let authEmail = getAuthEmail();
    try {
      try {
         const userCred = await signInWithEmailAndPassword(auth, authEmail, password);
         await finalizeLogin(userCred.user, authEmail);
         return;
      } catch (err: any) {
         if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-email') {
            // Try lookup the underlying auth email
            const identifier = authType === 'phone' ? (countryCode + phoneNumber.replace(/^0+/, '')) : email;
            const res = await fetch('/api/lookup-auth-email', {
               method: 'POST',
               headers: {'Content-Type': 'application/json'},
               body: JSON.stringify({ identifier })
            });
            const data = await res.json();
             
            if (data && data.authEmail && data.authEmail !== authEmail) {
                authEmail = data.authEmail; // Override carefully
                const retryCred = await signInWithEmailAndPassword(auth, authEmail, password);
                await finalizeLogin(retryCred.user, authEmail);
                return;
            }
         }
         throw err;
      }
    } catch (err: any) {
      setMascotFocus("error");
      notify(getFriendlyErrorMessage(err), "error");
    } finally {
      setLoading(false);
    }
  };

  const finalizeLogin = async (user: any, loginEmail: string) => {
      // Save to Account Center
      try {
          const accountsStr = localStorage.getItem("vibe_saved_accounts");
          let accounts = accountsStr ? JSON.parse(accountsStr) : [];
          accounts = accounts.filter((a: any) => a.uid !== user.uid);
          accounts.push({
              uid: user.uid,
              email: loginEmail,
              password: password,
              displayName: user.displayName || "User",
              photoURL: user.photoURL || "",
              lastPasswordChange: null,
          });
          localStorage.setItem("vibe_saved_accounts", JSON.stringify(accounts));
      } catch (e) {
          console.error(e);
      }

      await setDoc(
        doc(db, "users", user.uid),
        { lastActive: Date.now() },
        { merge: true },
      );

      setMascotFocus("success");
      notify("Welcome back!", "success");
      setTimeout(() => navigate("/"), 1000);
  }

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Sign in to your account to continue."
    >
      <SEO 
        title="Sign In" 
        description="Sign in to your DEEP SHOP account to track orders, earn rewards, and shop premium border cross mobiles in Bangladesh." 
        canonical="/signin"
      />
      <VibeMascot state={mascotState} showPassword={showPassword} />
      <form onSubmit={handleSignIn} className="space-y-4 relative z-20">
        <div className="space-y-4">
        
          <div onFocus={() => setMascotFocus('email')} onBlur={() => setMascotFocus('idle')} tabIndex={-1} className="outline-none">
            <AuthInputs 
              authType={authType}
              setAuthType={setAuthType}
              email={email}
              setEmail={setEmail}
              countryCode={countryCode}
              setCountryCode={setCountryCode}
              phoneNumber={phoneNumber}
              setPhoneNumber={setPhoneNumber}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-xs font-semibold text-zinc-800 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                onFocus={() => setMascotFocus('idle')}
              >
                Forgot Password?
              </Link>
            </div>
            <div className="relative h-max">
              <Input
                placeholder="••••••••"
                className="peer ps-10 pe-10 h-12 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setMascotFocus('password')}
                onBlur={() => setMascotFocus('idle')}
                required
              />
              <div className="text-muted-foreground pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3.5 peer-disabled:opacity-50">
                <Lock className="size-4" aria-hidden="true" />
              </div>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
                onFocus={() => setMascotFocus('password')}
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>
        </div>

        <Button
          disabled={loading}
          className="w-full h-12 mt-6 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 rounded-xl font-semibold shadow-lg shadow-black/20 dark:shadow-white/10"
        >
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {loading ? "Signing in..." : "Sign In"}
        </Button>
      </form>

      <AuthSeparator text="NEW HERE?" />
      
      <Button 
        type="button" 
        variant="outline"
        className="w-full h-12 font-semibold border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md rounded-xl"
        onClick={() => navigate("/signup")}
      >
        Create an Account
      </Button>
    </AuthLayout>
  );
};

export default SignIn;
