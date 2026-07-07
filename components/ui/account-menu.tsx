"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { triggerHaptic } from "@/lib/haptics";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  User,
  LayoutDashboard,
  LogOut,
  ChevronDown,
  ShoppingBag,
  Bell,
  Heart,
  Check,
} from "lucide-react";
import { auth } from "@/firebase";
import { signOut, User as FirebaseUser } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function AccountMenu({
  scrolled,
  isPill,
}: {
  scrolled?: boolean;
  isPill?: boolean;
}) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem("f_cart");
    navigate("/");
    window.dispatchEvent(new CustomEvent("openAccountCenter"));
  };

  const displayName = user?.displayName || user?.email?.split("@")[0] || "User";
  const initials = displayName.substring(0, 2).toUpperCase();

  const triggerClass = isPill
    ? cn(
        "flex items-center justify-center p-0 md:pl-1 md:pr-4 gap-2 rounded-full font-medium transition-all duration-300 w-9 h-9 md:w-auto md:h-9 shrink-0 bg-transparent border-none text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 shadow-none",
      )
    : cn(
        "flex items-center justify-center p-0 md:pl-2 md:pr-4 md:py-2 gap-2 rounded-full font-medium transition-all duration-300 w-10 h-10 md:w-auto md:h-auto shrink-0 bg-transparent border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800",
      );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className={triggerClass} onClick={() => triggerHaptic()}>
          {user ? (
            <div className="relative w-fit shrink-0 p-[2px]">
              <Avatar className="w-8 h-8 md:w-7 md:h-7 rounded-full border-2 border-green-500 shrink-0">
                <AvatarImage
                  src={user.photoURL || undefined}
                  alt={displayName}
                  className="object-cover rounded-full"
                />
                <AvatarFallback className="text-[10px] font-bold bg-white dark:bg-zinc-100 text-zinc-900 rounded-full">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="absolute bottom-0 right-0 inline-flex size-2.5 rounded-full ring-2 ring-white dark:ring-zinc-900 bg-green-500 z-10"></span>
            </div>
          ) : (
            <div className={cn(
              "rounded-full flex items-center justify-center shrink-0 shadow-sm",
              isPill ? "w-8 h-8 md:w-7 md:h-7 bg-white" : "w-8 h-8 md:w-7 md:h-7 bg-zinc-100 dark:bg-zinc-800"
            )}>
              <User className={cn(
                "w-4 h-4 md:w-3.5 md:h-3.5",
                isPill ? "text-zinc-900" : "text-zinc-900 dark:text-zinc-100"
              )} />
            </div>
          )}

          <span className="hidden md:inline-block max-w-[80px] lg:max-w-[120px] truncate text-sm">
            {user ? displayName : "Sign in"}
          </span>
          <ChevronDown className="hidden md:block w-4 h-4 opacity-50 shrink-0" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={12}
        className="w-64 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-lg p-2 z-[9999] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-4"
      >
        {!user ? (
          <>
            <DropdownMenuLabel className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              Welcome
            </DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => {
                triggerHaptic();
                navigate("/auth-selector");
              }}
              className="flex items-center gap-2 py-2 px-2 rounded-lg cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <span className="flex-1 font-medium">Sign In / Sign Up</span>
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuLabel className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              My Account
            </DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => {
                triggerHaptic();
                navigate("/profile");
              }}
              className="flex items-center gap-2 rounded-lg py-2 px-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
            >
              <User className="w-4 h-4" />
              <span className="flex-1">Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                triggerHaptic();
                navigate("/orders");
              }}
              className="flex items-center gap-2 rounded-lg py-2 px-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="flex-1">My Orders</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                triggerHaptic();
                navigate("/wishlist");
              }}
              className="flex items-center gap-2 rounded-lg py-2 px-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
            >
              <Heart className="w-4 h-4" />
              <span className="flex-1">Wishlist</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                triggerHaptic();
                navigate("/notifications");
              }}
              className="flex items-center gap-2 rounded-lg py-2 px-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              <span className="flex-1">Notifications</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator className="my-1 border-zinc-100 dark:border-zinc-800" />

            <DropdownMenuItem
              onClick={() => {
                triggerHaptic();
                handleLogout();
              }}
              className="flex items-center gap-2 py-2 px-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span className="flex-1 font-medium">Log out</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
