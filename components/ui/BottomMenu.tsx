import {
  Notification03Icon,
  Search01Icon,
  Sun03Icon,
  UserEdit01Icon,
  Home01Icon,
  ShoppingBag01Icon,
  PackageIcon,
  Ticket01Icon,
  Settings02Icon,
  Logout01Icon,
  FavouriteIcon,
  AiSearchIcon,
  FilterVerticalIcon,
  DashboardCircleIcon,
  CreditCardIcon,
  Location01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import React, { useMemo, useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import useMeasure from "react-use-measure";
import { cn } from "../../lib/utils";
import { useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "../../components/ThemeContext";
import { useLanguage } from "../../components/LanguageContext";
import { signOut, onAuthStateChanged } from "firebase/auth";
import type { User } from "firebase/auth";
import { auth, db } from "../../firebase";
import { ArrowRight } from "lucide-react";
import { triggerHaptic } from "../../lib/haptics";
import { doc, onSnapshot as firestoreOnSnapshot } from "firebase/firestore";

const MAIN_NAV = [
  { icon: Home01Icon, name: "home" },
  { icon: Search01Icon, name: "search" },
  { icon: ShoppingBag01Icon, name: "cart" },
  { icon: Notification03Icon, name: "notifications" },
];

const SHOPPING_HOME_ITEMS = [
  { icon: ShoppingBag01Icon, text: "All Products", path: "/all-products" },
  { icon: PackageIcon, text: "New Arrivals", path: "/all-products?sort=newest" },
  { icon: FavouriteIcon, text: "My Wishlist", path: "/wishlist" },
];

const SEARCH_OPTIONS = [
  { icon: FilterVerticalIcon, text: "Filters", path: "/search" },
  { icon: AiSearchIcon, text: "Trending", path: "/search" },
];

const NOTIFICATION_TYPES = [
  { text: "Order Updates", path: "/notifications" },
  { text: "Flash Sales", path: "/notifications" },
  { text: "System Alerts", path: "/notifications" },
];

const PROFILE_LINKS = [
  { icon: DashboardCircleIcon, text: "My Account", path: "/profile" },
  { icon: PackageIcon, text: "My Orders", path: "/orders" },
  { icon: Location01Icon, text: "Addresses", path: "/shipping-address" },
  { icon: CreditCardIcon, text: "Payment", path: "/payment-methods" },
  { icon: Settings02Icon, text: "Settings", path: "/settings" },
];

const BottomMenu = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();
  const { t } = useLanguage();
  
  const [elementRef] = useMeasure();
  const [hiddenRef, hiddenBounds] = useMeasure();
  const [view, setView] = useState<
    "default" | "home" | "search" | "notifications" | "profile" | "theme"
  >("default");

  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    let unsubProfile: (() => void) | null = null;
    const unsubscribe = onAuthStateChanged(auth, u => {
      setUser(u);
      if (u) {
        unsubProfile = firestoreOnSnapshot(doc(db, "users", u.uid), (snap) => {
          if (snap.exists()) {
            setUserRole(snap.data().role || null);
          }
        });
      } else {
        setUserRole(null);
        if (unsubProfile) unsubProfile();
      }
    });
    return () => {
      unsubscribe();
      if (unsubProfile) unsubProfile();
    };
  }, []);

  const profileLinks = useMemo(() => {
    const base = [...PROFILE_LINKS];
    if (userRole === "seller" || userRole === "admin") {
      base.unshift({ icon: DashboardCircleIcon, text: "Seller Dashboard", path: "/seller/dashboard" });
    }
    return base;
  }, [userRole]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setView("default");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleNavigate = (path: string) => {
    triggerHaptic();
    navigate(path);
    setView("default");
  };

  const handleLogout = async () => {
    triggerHaptic();
    try {
      await signOut(auth);
      navigate("/");
      window.dispatchEvent(new CustomEvent('openAccountCenter'));
      setView("default");
    } catch (error) {
      console.error("Logout error", error);
    }
  };

  const sharedHover =
    "group transition-all duration-75 px-3 py-2.5 text-[14px] text-zinc-500 dark:text-zinc-400 w-full text-left rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/50 hover:text-zinc-900 dark:hover:text-zinc-100";

  const content = useMemo(() => {
    switch (view) {
      case "default":
        return null;

      case "home":
        return (
          <div className="space-y-0.5 min-w-[210px] p-[6px] py-1">
            {SHOPPING_HOME_ITEMS.map(({ icon: Icon, text, path }) => (
              <button
                key={text}
                onClick={() => handleNavigate(path)}
                className={`${sharedHover} flex items-center gap-3`}
              >
                <HugeiconsIcon
                  icon={Icon}
                  size={18}
                  className="text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-all duration-75"
                />
                <span className="font-medium">{text}</span>
              </button>
            ))}
          </div>
        );

      case "search":
        return (
          <div className="space-y-2.5 min-w-[280px] p-[10px] py-2">
            <div className="relative">
              <HugeiconsIcon
                icon={Search01Icon}
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
              />
              <input
                type="text"
                placeholder="Search products..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleNavigate(`/search?q=${(e.target as HTMLInputElement).value}`);
                  }
                }}
                className="w-full pl-10 pr-4 py-2.5 text-[14px] text-zinc-900 dark:text-zinc-100 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:ring-zinc-100/20 focus:border-zinc-900 dark:border-zinc-100/50 placeholder:text-zinc-400"
              />
            </div>
            <div className="flex gap-2">
              {SEARCH_OPTIONS.map(({ icon: Icon, text, path }) => (
                <button
                  key={text}
                  onClick={() => handleNavigate(path)}
                  className="flex-1 flex items-center justify-center gap-2 py-2 text-[13px] font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
                >
                  <HugeiconsIcon icon={Icon} size={15} />
                  <span>{text}</span>
                </button>
              ))}
            </div>
          </div>
        );

      case "notifications":
        return (
          <div className="space-y-0.5 min-w-[220px] p-[6px] py-1">
            <div className="px-3 py-2 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              Recent Alerts
            </div>
            {NOTIFICATION_TYPES.map((t) => (
              <button key={t.text} onClick={() => handleNavigate(t.path)} className={sharedHover}>
                <span className="font-medium">{t.text}</span>
              </button>
            ))}
          </div>
        );

      case "profile":
        return (
          <div className="space-y-0.5 min-w-[240px] p-[6px] py-1">
            {profileLinks.map(({ icon: Icon, text, path }) => (
              <button
                key={text}
                onClick={() => handleNavigate(path)}
                className={`${sharedHover} flex items-center gap-3`}
              >
                <HugeiconsIcon
                  icon={Icon}
                  size={18}
                  className="text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100"
                />
                <span className="font-medium">{text}</span>
              </button>
            ))}
            <div className="border-t border-zinc-100 dark:border-zinc-800 my-1.5" />
            <button 
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2.5 text-[14px] font-semibold text-rose-500 w-full text-left rounded-xl hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all"
            >
              <HugeiconsIcon icon={Logout01Icon} size={18} />
              <span>Sign Out</span>
            </button>
          </div>
        );

      case "theme":
        return (
          <div className="flex items-center justify-between gap-2 min-w-[280px] p-[6px]">
            <button
              onClick={(e) => { triggerHaptic(); if (isDark) toggleTheme(e); setView("default"); }}
              className={`flex-1 flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 transition-all font-medium text-[13px] ${
                !isDark
                  ? "bg-zinc-100 text-zinc-900 border border-zinc-200"
                  : "text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              }`}
            >
              <HugeiconsIcon icon={Sun03Icon} size={18} />
              <span>Light</span>
            </button>
            <button
              onClick={(e) => { triggerHaptic(); if (!isDark) toggleTheme(e); setView("default"); }}
              className={`flex-1 flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 transition-all font-medium text-[13px] ${
                isDark
                  ? "bg-zinc-800 text-zinc-100 border border-zinc-700"
                  : "text-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              }`}
            >
              <HugeiconsIcon icon={Sun03Icon} size={18} />
              <span>Dark</span>
            </button>
          </div>
        );

      default:
        return null;
    }
  }, [view, isDark]);

  return (
    <div
      ref={containerRef}
      className={cn("fixed bottom-2 left-2 right-2 sm:left-5 sm:right-5 z-[100] flex items-end justify-between md:hidden gap-1.5 sm:gap-3 pointer-events-none mb-[env(safe-area-inset-bottom)]")}
    >
      {/* Hidden for measurement */}
      <div
        ref={hiddenRef}
        className="absolute left-[-9999px] top-[-9999px] invisible pointer-events-none"
      >
        <div className="rounded-[32px] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 py-1">
          {content}
        </div>
      </div>

      {/* Animated submenu */}
      <AnimatePresence mode="wait">
        {view !== "default" && (
          <motion.div
            key="submenu"
            initial={{
              opacity: 0,
              scaleY: 0.9,
              scaleX: 0.95,
              height: 0,
              width: 0,
              originY: 1,
              x: view === "profile" || view === "theme" ? "0%" : "-50%",
            }}
            animate={{
              opacity: 1,
              scaleY: 1,
              scaleX: 1,
              height: hiddenBounds.height || "auto",
              width: hiddenBounds.width || "auto",
              originY: 1,
              x: view === "profile" || view === "theme" ? "0%" : "-50%",
            }}
            exit={{
              opacity: 0,
              scaleY: 0.9,
              scaleX: 0.95,
              height: 0,
              width: 0,
              originY: 1,
              x: view === "profile" || view === "theme" ? "0%" : "-50%",
            }}
            transition={{
              duration: 0.4,
              type: "spring",
              damping: 25,
              stiffness: 300
            }}
            style={{
              transformOrigin: view === "profile" || view === "theme" ? "bottom right" : "bottom center",
            }}
            className={cn(
              "absolute bottom-[calc(100%+16px)] overflow-hidden rounded-[32px] shadow-2xl z-[101] pointer-events-auto",
              view === "profile" || view === "theme" ? "right-0" : "left-1/2"
            )}
          >
            <div
              ref={elementRef}
              className="rounded-[32px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 relative overflow-hidden shadow-xl"
            >
              <AnimatePresence initial={false} mode="popLayout">
                <motion.div
                  key={view}
                  initial={{
                    opacity: 0,
                    scale: 0.96,
                    filter: "blur(10px)",
                  }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    filter: "blur(0px)",
                  }}
                  exit={{
                    opacity: 0,
                    scale: 0.95,
                    filter: "blur(12px)",
                  }}
                  transition={{
                    duration: 0.2,
                  }}
                  className="py-1"
                >
                  {content}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Nav Container */}
      <div className="flex-1 relative pointer-events-auto">

        {/* Floating Toolbar */}
        <div className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 py-1.5 flex items-center justify-around px-1 sm:px-2 shadow-2xl relative rounded-full">
          {MAIN_NAV.map(({ icon: Icon, name }) => {
            const isActive = view === name || (name === 'home' && location.pathname === '/');
            return (
              <button
                key={name}
                className={cn(
                  "relative px-1.5 sm:px-3 py-1 rounded-full transition-all active:scale-95 flex flex-col items-center justify-center gap-[2px] flex-1 max-w-[68px]",
                  isActive ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
                )}
                onClick={() => {
                  triggerHaptic();
                  if (name === 'cart') {
                    navigate('/cart');
                    setView("default");
                  } else if (name === 'home' && location.pathname === '/') {
                    setView(view === name ? "default" : (name as any));
                  } else if (name === 'home') {
                    navigate('/');
                    setView("default");
                  } else {
                    setView(view === name ? "default" : (name as any));
                  }
                }}
              >
                {isActive && (
                   <motion.div layoutId="nav-pill" className="absolute inset-0 bg-zinc-100 dark:bg-zinc-800/80 rounded-full -z-10" />
                )}
                <HugeiconsIcon
                  icon={Icon}
                  size={20}
                  className={cn("relative z-10 transition-colors mb-0.5", isActive ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-500 dark:text-zinc-400")}
                />
                <span className={cn("text-[9px] font-semibold z-10 capitalize", isActive ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-500 dark:text-zinc-400")}>
                  {t(name)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Floating Profile / Auth Button */}
      <div className="pointer-events-auto">
        {user ? (
          <button
            onClick={() => {
               triggerHaptic();
               setView(view === "profile" ? "default" : "profile");
            }}
            className="w-[60px] h-[60px] rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl flex items-center justify-center transition-transform active:scale-95"
          >
            <div className="w-[44px] h-[44px] rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center m-auto">
               <HugeiconsIcon icon={UserEdit01Icon} size={22} className={cn(view === "profile" ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-500 dark:text-zinc-400")} />
            </div>
          </button>
        ) : (
          <button
            onClick={() => {
               triggerHaptic();
               window.dispatchEvent(new CustomEvent('openAccountCenter'));
               setView("default");
            }}
            className="w-[60px] h-[60px] rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl flex items-center justify-center transition-transform active:scale-95 hover:bg-zinc-50 dark:hover:bg-zinc-800/80"
          >
            <div className="w-[44px] h-[44px] rounded-full bg-indigo-500 text-white flex items-center justify-center shadow-inner hover:bg-indigo-600 transition-colors m-auto flex-shrink-0">
              <ArrowRight className="text-white w-5 h-5" />
            </div>
          </button>
        )}
      </div>
    </div>
  );
};

export default BottomMenu;

