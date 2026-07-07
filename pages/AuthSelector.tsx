import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { doc, onSnapshot, setDoc, getDoc } from "firebase/firestore";
import {
  GoogleAuthProvider,
  FacebookAuthProvider,
  OAuthProvider,
  signInWithPopup,
  signInWithCredential
} from "firebase/auth";
import { db, auth } from "../firebase";
import { useNotify } from "../components/Notifications";
import { Button } from "../components/ui/button";
import { AuthLayout, AuthSeparator } from "../components/AuthLayout";
import Icon from "../components/Icon";
import { GoogleIcon, AppleIcon, FacebookIcon } from "../components/ui/BrandIcons";
import { GoogleOAuthProvider, useGoogleLogin } from "@react-oauth/google";

// To make this work directly with Google without a Firebase popup, you need your own Google Client ID.
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "50155075863-uj02i6n96ipeqaurkf7au0jnpnse84pd.apps.googleusercontent.com";

const CustomGoogleButton = ({ onLogin }: { onLogin: (accessToken: string) => void }) => {
   const login = useGoogleLogin({
      onSuccess: tokenResponse => onLogin(tokenResponse.access_token),
      onError: () => console.log('Login Failed'),
   });
   return (
      <Button 
        type="button" 
        variant="outline"
        size="lg" 
        className="w-full justify-start px-4 bg-white dark:bg-zinc-900 shadow-sm"
        onClick={() => login()}
      >
        <GoogleIcon className='h-5 w-5 mr-3 text-zinc-900 dark:text-white' />
        <span className="font-semibold text-zinc-800 dark:text-zinc-200">Continue with Google</span>
      </Button>
   );
};

const AuthSelector: React.FC = () => {
  const navigate = useNavigate();
  const notify = useNotify();
  const [config, setConfig] = useState<any>(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "platform"), (snap) => {
      if (snap.exists()) {
        setConfig(snap.data());
      } else {
        setConfig({});
      }
    });
    return unsub;
  }, []);

  const captureUserDetails = async (user: any) => {
    try {
      const userRef = doc(db, "users", user.uid);
      const snap = await getDoc(userRef);

      let ipAddress = "Unknown";
      try {
        const ipRes = await fetch("https://api.ipify.org?format=json");
        if (ipRes.ok) {
           const ipData = await ipRes.json();
           ipAddress = ipData.ip;
        }
      } catch (e) {}

      if (!snap.exists()) {
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email || "",
          displayName: user.displayName || "Guest User",
          photoURL: user.photoURL || "",
          role: "user",
          isBanned: false,
          createdAt: Date.now(),
          registrationDate: Date.now(),
          ipAddress: ipAddress,
          lastActive: Date.now(),
        });
      } else {
        await setDoc(
          userRef,
          {
            lastActive: Date.now(),
            ipAddress: ipAddress,
          },
          { merge: true },
        );
      }
    } catch (e) {
      console.error("Profile error:", e);
    }
  };

  const handleDirectGoogleLogin = async (accessToken: string) => {
    try {
       const credential = GoogleAuthProvider.credential(null, accessToken);
       const result = await signInWithCredential(auth, credential);
       await captureUserDetails(result.user);
       
       let accounts: any[] = [];
       try {
         const str = localStorage.getItem("vibe_saved_accounts");
         if (str) accounts = JSON.parse(str);
       } catch (e) {}
       accounts = accounts.filter((a: any) => a.uid !== result.user.uid);
       accounts.push({
           uid: result.user.uid,
           email: result.user.email,
           password: "",
           displayName: result.user.displayName || "User",
           photoURL: result.user.photoURL || "",
           provider: "google"
       });
       localStorage.setItem("vibe_saved_accounts", JSON.stringify(accounts));
       notify(`Welcome, ${result.user.displayName || "User"}!`, "success");
       navigate("/");
    } catch(err: any) {
       console.error("Direct Google error:", err);
       notify(err.message, "error");
    }
  };

  const handleSocialLogin = async (providerName: string, enabled: boolean) => {
    if (!enabled) {
      notify(`${providerName} login is currently disabled by admin.`, "info");
      return;
    }

    try {
      let provider;
      if (providerName === "Google") provider = new GoogleAuthProvider();
      else if (providerName === "Facebook")
        provider = new FacebookAuthProvider();
      else if (providerName === "Apple")
        provider = new OAuthProvider("apple.com");
      else return;

      const result = await signInWithPopup(auth, provider);
      await captureUserDetails(result.user);
      
      // Save to Account Center
      let accounts: any[] = [];
      try {
        const str = localStorage.getItem("vibe_saved_accounts");
        if (str) accounts = JSON.parse(str);
      } catch (e) {}
      accounts = accounts.filter((a: any) => a.uid !== result.user.uid);
      accounts.push({
          uid: result.user.uid,
          email: result.user.email,
          password: "",
          displayName: result.user.displayName || "User",
          photoURL: result.user.photoURL || "",
          provider: providerName.toLowerCase()
      });
      localStorage.setItem("vibe_saved_accounts", JSON.stringify(accounts));

      notify(`Welcome, ${result.user.displayName || "User"}!`, "success");
      navigate("/");
    } catch (err: any) {
      console.error(err);
      if (err.code !== "auth/popup-closed-by-user") {
        notify(err.message, "error");
      }
    }
  };

  const finalGoogleClientId = config?.googleClientId || GOOGLE_CLIENT_ID;

  return (
    <GoogleOAuthProvider clientId={finalGoogleClientId || "dummy_id"}>
      <AuthLayout
        title="Sign In or Join Now!"
        subtitle="Login or create your DEEP SHOP account."
      >
        <div className="space-y-3">
          {!config ? (
            <div className="space-y-3 animate-pulse">
               <div className="w-full h-12 bg-zinc-200 dark:bg-zinc-800 rounded-lg"></div>
               <div className="w-full h-12 bg-zinc-200 dark:bg-zinc-800 rounded-lg"></div>
               <div className="w-full h-12 bg-zinc-200 dark:bg-zinc-800 rounded-lg"></div>
            </div>
          ) : (
            <>
              {config.googleLogin !== false && (
                (finalGoogleClientId && finalGoogleClientId !== "YOUR_GOOGLE_CLIENT_ID_HERE") ? (
                  <CustomGoogleButton onLogin={handleDirectGoogleLogin} />
                ) : (
                  <Button 
                    type="button" 
                    variant="outline"
                    size="lg" 
                    className="w-full justify-start px-4 bg-white dark:bg-zinc-900 shadow-sm"
                    onClick={() => handleSocialLogin("Google", true)}
                  >
                    <GoogleIcon className='h-5 w-5 mr-3 text-zinc-900 dark:text-white' />
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">Continue with Google</span>
                  </Button>
                )
              )}
            
            {config.facebookLogin && (
              <Button 
                type="button" 
                variant="outline"
                size="lg" 
                className="w-full justify-start px-4 bg-white dark:bg-zinc-900 shadow-sm"
                onClick={() => handleSocialLogin("Facebook", true)}
              >
                <FacebookIcon className='h-5 w-5 mr-3' />
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">Continue with Facebook</span>
              </Button>
            )}

            {config.appleLogin && (
              <Button 
                type="button" 
                variant="outline"
                size="lg" 
                className="w-full justify-start px-4 bg-white dark:bg-zinc-900 shadow-sm"
                onClick={() => handleSocialLogin("Apple", true)}
              >
                <AppleIcon className='h-5 w-5 mr-3 text-black dark:text-white' />
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">Continue with Apple</span>
              </Button>
            )}
          </>
        )}
      </div>

      <AuthSeparator />

      <div className="space-y-3">
        <Button 
          type="button" 
          size="lg"
          className="w-full bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-semibold shadow-md"
          onClick={() => navigate("/signup?role=customer")}
        >
          Become a Customer
        </Button>
        <Button 
          type="button" 
          variant="outline"
          size="lg"
          className="w-full font-semibold border-emerald-500/30 dark:border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-100/50 dark:hover:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
          onClick={() => navigate("/signup?role=seller")}
        >
          Become a Seller (Partner)
        </Button>
        <Button 
          type="button" 
          variant="ghost"
          size="lg"
          className="w-full font-semibold border border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md hover:bg-white dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
          onClick={() => navigate("/signin")}
        >
          Sign In with Email
        </Button>
      </div>

      <p className="text-muted-foreground mt-8 text-xs text-center">
        By clicking continue, you agree to our{' '}
        <Link to="/terms" className="hover:text-zinc-900 dark:text-zinc-100 underline underline-offset-4">
          Terms of Service
        </Link>{' '}
        and{' '}
        <Link to="/privacy" className="hover:text-zinc-900 dark:text-zinc-100 underline underline-offset-4">
          Privacy Policy
        </Link>
        .
      </p>
    </AuthLayout>
    </GoogleOAuthProvider>
  );
};

export default AuthSelector;
