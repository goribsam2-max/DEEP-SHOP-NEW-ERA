import { useRegion } from "@/components/RegionContext";
import { getRegionFlagSvg } from "@/components/RegionFlags";
import React, { useState, useEffect } from "react";
import { UserProfile, Order, OrderStatus } from "../types";
import { useNavigate, Link } from "react-router-dom";
import { auth, db } from "../firebase";
import { signOut, updateProfile } from "firebase/auth";
import { doc, updateDoc, collection, query, where, getDocs, orderBy, onSnapshot } from "firebase/firestore";
import { useNotify } from "../components/Notifications";
import { uploadToImgbb } from "../services/imgbb";
import { cn } from "../lib/utils";
import { AvatarUploader } from "../components/ui/avatar-uploader";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import Icon from "../components/Icon";
import { motion } from "framer-motion";
import { MessageSquare, Settings, UserPlus, Star, Shield, Globe, ShoppingBag, FileText, Heart, Headphones, Lock, Info, Mail, LogOut, ShieldCheck, ChevronRight, Wallet, TrendingUp, Diamond, Gift, CreditCard, Truck, Package, MessageSquareShare, Clock, Ticket, Store, CircleDollarSign, Sparkles, Link as LinkIcon, MoreVertical, Presentation, AlertCircle, Phone } from "lucide-react";
import { useTheme } from "../components/ThemeContext";
import SEO from "../components/SEO";
import { TourProvider, TourAlertDialog, useTour } from "@/components/ui/tour";
import { ProductCard } from "../components/ui/ProductCard";
import { SellerBadge, VerifiedIcon, RegisteredBadge } from "../components/SellerBadge";

const ProfileTourSteps = () => {
    const { setSteps } = useTour();
    useEffect(() => {
        setSteps([
            {
                selectorId: "profile-info",
                content: (
                    <div className="space-y-2">
                        <h3 className="font-bold text-lg">Your Profile</h3>
                        <p className="text-sm text-zinc-500">Quickly see your saved items and total order counts.</p>
                    </div>
                ),
                position: "bottom"
            },
            {
                selectorId: "profile-member",
                content: (
                    <div className="space-y-2">
                        <h3 className="font-bold text-lg">Member Status</h3>
                        <p className="text-sm text-zinc-500">Check your current membership tier for exclusive benefits.</p>
                    </div>
                ),
                position: "bottom"
            },
            {
                selectorId: "profile-referral",
                content: (
                    <div className="space-y-2">
                        <h3 className="font-bold text-lg">Refer & Earn</h3>
                        <p className="text-sm text-zinc-500">Share with friends to earn real money! Click here to open your dashboard.</p>
                    </div>
                ),
                position: "top"
            },
            {
                selectorId: "profile-menu",
                content: (
                    <div className="space-y-2">
                        <h3 className="font-bold text-lg">Settings & More</h3>
                        <p className="text-sm text-zinc-500">Access your past orders, wishlist, addresses and app settings here.</p>
                    </div>
                ),
                position: "top"
            }
        ]);
    }, [setSteps]);
    return null;
};

const Profile: React.FC<{ userData: UserProfile | null }> = ({
  userData: initialUserData,
}) => {
  const { formatPrice, region } = useRegion();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const notify = useNotify();
  const [updating, setUpdating] = useState(false);
  const [localUserData, setLocalUserData] = useState<UserProfile | null>(
    initialUserData,
  );
  const [orderCount, setOrderCount] = useState(0);
  const [orders, setOrders] = useState<Order[]>([]);
  const [recommendedProducts, setRecommendedProducts] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [activeBanner, setActiveBanner] = useState(0);
  
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    const unsubUser = onSnapshot(doc(db, "users", user.uid), (snapshot) => {
      if (snapshot.exists()) {
        setLocalUserData(snapshot.data() as UserProfile);
      }
    });
    return () => unsubUser();
  }, []);

  useEffect(() => {
    setLocalUserData(initialUserData);
  }, [initialUserData]);

  useEffect(() => {
    const qBanners = query(collection(db, "banners"), orderBy("createdAt", "desc"));
    const unsubscribeBanners = onSnapshot(qBanners, (snapshot) => {
        setBanners(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribeBanners();
  }, []);

  useEffect(() => {
    let heroBanners = [];
    if (banners && banners.length > 0) {
      heroBanners = banners.filter(b => b.bannerType === "profile");
    }
    if (heroBanners.length > 1) {
      const interval = setInterval(
        () => setActiveBanner((prev) => (prev + 1) % heroBanners.length),
        4000
      );
      return () => clearInterval(interval);
    }
  }, [banners]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;
    
    try {
      const q = query(collection(db, "orders"), where("userId", "==", user.uid));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const userOrders = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
        setOrders(userOrders);
        setOrderCount(userOrders.length);
      }, (error) => {
        console.error("Error fetching orders:", error);
      });
      return () => unsubscribe();
    } catch (error) {
      console.error("Error setting up orders listener:", error);
    }
  }, [auth.currentUser]);

  useEffect(() => {
    try {
      const q = query(collection(db, "products"));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        // Shuffle or just pick a few for recommendations
        const shuffled = docs.sort(() => 0.5 - Math.random());
        setRecommendedProducts(shuffled.slice(0, 6));
      }, (error) => {
        console.error("Error fetching recommended products:", error);
      });
      return () => unsubscribe();
    } catch (error) {
      console.error("Error setting up recommended products listener:", error);
    }
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      notify("Logged out successfully", "success");
      navigate("/");
    } catch (error) {
      notify("Failed to log out", "error");
    }
  };

  const handleAvatarUpload = async (file: File) => {
    if (!auth.currentUser) return { success: false };
    
    setUpdating(true);
    try {
      const url = await uploadToImgbb(file);
      await updateDoc(doc(db, "users", auth.currentUser.uid), {
        photoURL: url
      });
      await updateProfile(auth.currentUser, {
        photoURL: url
      });
      setLocalUserData((prev) => prev ? { ...prev, photoURL: url } : null);
      notify("Profile picture updated", "success");
      return { success: true };
    } catch (e: any) {
      notify(e.message || "Failed to update profile picture", "error");
      return { success: false };
    } finally {
      setUpdating(false);
    }
  };

  if (!localUserData) {
    return (
        <div className="flex flex-col items-center justify-center text-center py-40 animate-fade-in bg-zinc-50 dark:bg-[#000000] min-h-screen">
          <div className="w-24 h-24 bg-white dark:bg-zinc-900 rounded-[15px] flex items-center justify-center mb-6 border border-zinc-200 dark:border-zinc-800">
            <Icon
              name="user"
              className="text-2xl text-zinc-400 dark:text-zinc-500"
            />
          </div>
          <h2 className="text-xl font-semibold mb-2 tracking-tight text-zinc-900 dark:text-zinc-100">
            Sign In to Continue
          </h2>
          <p className="text-sm font-medium text-zinc-500 mb-10 max-w-xs leading-relaxed">
            Log in to view your profile, track orders, and manage wishlist.
          </p>
          <button
            onClick={() => navigate("/auth-selector")}
            className="px-8 py-4 bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900 rounded-[15px] font-semibold text-sm hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center space-x-3"
          >
            <span>Sign In</span>
            <Icon name="arrow-right" className="text-xs" />
          </button>
        </div>
    );
  }

  const isAdmin =
    localUserData?.role === "admin" ||
    localUserData?.email?.toLowerCase().trim() === "admin@vibe.shop" ||
    localUserData?.email?.toLowerCase().trim() === "vibegadgetfeni@gmail.com" ||
    localUserData?.email?.toLowerCase().trim() === "deepshop@gmail.com" ||
    localUserData?.email?.toLowerCase().trim() === "deepshopbysam@gmail.com" ||
    localUserData?.role === "staff";

  const isSeller = localUserData?.role === "seller";

  return (
    <div className="bg-[#F0F2F5] dark:bg-zinc-950 font-sans min-h-screen pb-[120px] md:pb-4">
      <SEO 
        title="My Profile" 
        description="Manage your Vibe Gadget profile and track your orders." 
        noindex={true} 
      />
      <div className="bg-[#0a2e15] dark:bg-[#071f0f] pt-12 pb-24 px-6 rounded-b-[40px] relative overflow-hidden">
          {/* Geometric shapes */}
          <div className="absolute top-10 left-4 w-16 h-16 bg-[#1cdb5e]/20 rounded-t-full rounded-br-full -rotate-45 pointer-events-none"></div>
          <div className="absolute bottom-4 left-10 w-24 h-12 bg-[#1cdb5e]/10 rounded-t-full pointer-events-none"></div>
          <div className="absolute top-20 right-8 w-10 h-10 bg-[#1cdb5e]/20" style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}></div>
          <div className="absolute bottom-12 right-0 w-20 h-20 bg-[#1cdb5e]/10 rounded-full translate-x-1/2 pointer-events-none"></div>
          
          <div className="flex justify-between items-center relative z-20 mb-8 max-w-lg mx-auto">
              <h2 className="text-white text-2xl font-bold tracking-tight">Profile</h2>
              <button onClick={() => navigate('/settings')} className="w-10 h-10 border-2 border-white/50 hover:bg-white/10 rounded-full flex items-center justify-center transition-colors shadow-sm">
                  <MoreVertical className="text-white w-5 h-5" />
              </button>
          </div>
          
          <div className="relative z-20 flex flex-col items-center max-w-lg mx-auto text-center">
              <div className="relative inline-block mt-4 mb-3">
                 <AvatarUploader onUpload={handleAvatarUpload}>
                     <Avatar className="w-24 h-24 rounded-full border-[4px] border-[#0a2e15] object-cover bg-white cursor-pointer shadow-xl relative z-10">
                         <AvatarImage src={localUserData?.photoURL || `https://ui-avatars.com/api/?name=${localUserData.displayName}&background=000&color=fff`} className="object-cover"/>
                         <AvatarFallback className="text-3xl font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
                         {localUserData.displayName?.charAt(0) || "U"}
                         </AvatarFallback>
                     </Avatar>
                     <div className="absolute bottom-0 right-0 w-8 h-8 bg-[#EF8020] rounded-full flex items-center justify-center cursor-pointer border-2 border-white shadow-md z-20 transform hover:scale-110 active:scale-95 transition-transform">
                        <Icon name="pen" className="text-white text-[11px]" />
                     </div>
                 </AvatarUploader>
              </div>
              <div className="flex flex-col items-center gap-1.5 mb-1 justify-center relative">
                <div className="flex items-center gap-2 justify-center relative">
                  <h3 className="text-xl md:text-2xl font-bold text-white shadow-sm flex items-center gap-1.5">
                    {localUserData.displayName || "User"}
                  </h3>
                  <div className="w-[18px] h-[13px] rounded-[2px] shadow-sm overflow-hidden shrink-0">
                    {getRegionFlagSvg(region)}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 justify-center mt-1">
                  {localUserData.isRegisteredBadge && (
                    <RegisteredBadge />
                  )}
                  {(isSeller || localUserData.kycStatus === "verified" || localUserData.isVerifiedBadge) && (
                    <SellerBadge kycStatus={localUserData.kycStatus || (localUserData.isVerifiedBadge ? "verified" : "none")} />
                  )}
                </div>
              </div>
              <p className="text-white/80 font-medium text-sm">
                  {localUserData.email?.includes('@phone.deepshop.top') 
                  ? '+' + localUserData.email.replace('@phone.deepshop.top', '') 
                  : localUserData.email?.includes('@phone.vibegadget.com')
                  ? '+' + localUserData.email.replace('@phone.vibegadget.com', '') 
                  : localUserData.email?.includes('@gmail.com') && /^\+?[0-9]{10,15}@gmail\.com$/.test(localUserData.email) 
                    ? localUserData.email.replace('@gmail.com', '')
                    : localUserData.email}
              </p>
          </div>
      </div>

      <div className="-mt-10 px-4 md:px-6 relative z-30 max-w-lg lg:max-w-4xl mx-auto pb-8 space-y-6">
          <div className="bg-white dark:bg-[#1e1e1e] rounded-[32px] p-5 sm:p-6 shadow-xl border border-gray-100 dark:border-zinc-800">
              <div className="flex items-center justify-between mb-5 px-1">
                  <h4 className="text-[15px] font-bold text-zinc-900 dark:text-white tracking-tight">My Orders</h4>
                  <span onClick={() => navigate('/orders')} className="text-sm font-semibold text-zinc-500 cursor-pointer hover:underline">View All</span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                  <div onClick={() => navigate('/orders/pay')} className="flex flex-col items-center justify-center cursor-pointer active:scale-95 transition-transform group">
                      <div className="relative mb-2">
                          <CreditCard className="w-6 h-6 text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-200 transition-colors" />
                          {orders.filter(o => o.status === OrderStatus.PENDING).length > 0 && (
                            <span className="absolute -top-2 -right-2 bg-[#1cdb5e] text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-white dark:border-[#1e1e1e]">
                                {orders.filter(o => o.status === OrderStatus.PENDING).length}
                            </span>
                          )}
                      </div>
                      <span className="text-[12px] font-medium text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-200">To Pay</span>
                  </div>
                  
                  <div onClick={() => navigate('/orders/ship')} className="flex flex-col items-center justify-center cursor-pointer active:scale-95 transition-transform group">
                      <div className="relative mb-2">
                          <Truck className="w-6 h-6 text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-200 transition-colors" />
                          {orders.filter(o => o.status === OrderStatus.SHIPPED || o.status === OrderStatus.ON_THE_WAY).length > 0 && (
                            <span className="absolute -top-2 -right-2 bg-[#1cdb5e] text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-white dark:border-[#1e1e1e]">
                                {orders.filter(o => o.status === OrderStatus.SHIPPED || o.status === OrderStatus.ON_THE_WAY).length}
                            </span>
                          )}
                      </div>
                      <span className="text-[12px] font-medium text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-200">To Ship</span>
                  </div>

                  <div onClick={() => navigate('/orders/receive')} className="flex flex-col items-center justify-center cursor-pointer active:scale-95 transition-transform group">
                      <div className="relative mb-2">
                          <Package className="w-6 h-6 text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-200 transition-colors" />
                          {orders.filter(o => o.status === OrderStatus.DELIVERED && (Date.now() - ((o as any).updatedAt || o.createdAt)) <= 24 * 60 * 60 * 1000).length > 0 && (
                            <span className="absolute -top-2 -right-2 bg-[#1cdb5e] text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-white dark:border-[#1e1e1e]">
                                {orders.filter(o => o.status === OrderStatus.DELIVERED && (Date.now() - ((o as any).updatedAt || o.createdAt)) <= 24 * 60 * 60 * 1000).length}
                            </span>
                          )}
                      </div>
                      <span className="text-[12px] font-medium text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-200">To Receive</span>
                  </div>

                  <div onClick={() => navigate('/orders/review')} className="flex flex-col items-center justify-center cursor-pointer active:scale-95 transition-transform group">
                      <div className="relative mb-2">
                          <MessageSquareShare className="w-6 h-6 text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-200 transition-colors" />
                          {orders.filter(o => o.status === OrderStatus.DELIVERED).length > 0 && (
                            <span className="absolute -top-2 -right-2 bg-[#1cdb5e] text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-white dark:border-[#1e1e1e]">
                                {orders.filter(o => o.status === OrderStatus.DELIVERED).length}
                            </span>
                          )}
                      </div>
                      <span className="text-[12px] font-medium text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-200">To Review</span>
                  </div>
              </div>
          </div>

          <div id="profile-referral" onClick={() => {
              if (!localUserData) navigate("/auth-selector");
              else navigate("/affiliate");
            }} className="bg-gradient-to-r from-[#FF6611] to-[#FF8C00] rounded-[32px] shadow-xl p-6 relative overflow-hidden flex flex-col justify-center cursor-pointer w-full text-white">
              <div className="relative z-10 w-2/3">
                  <h3 className="font-bold text-[20px] mb-2 leading-tight">
                    {!localUserData ? 'Log in to refer & earn' : localUserData.affiliateStatus !== 'approved' ? 'Apply for partner to earn' : 'Refer a friend'}
                  </h3>
                  <p className="text-white/90 text-sm mb-4 font-medium">Earn up to {formatPrice(200)} per successful referral</p>
                  <span className="bg-white text-[#FF6611] px-4 py-2 rounded-xl text-[13px] font-bold inline-block shadow-sm">
                    {!localUserData ? 'Login to Earn' : localUserData.affiliateStatus !== 'approved' ? 'Apply Now' : 'Invite Now'}
                  </span>
              </div>
              <div className="absolute right-0 bottom-0 h-[120px] w-1/3 pointer-events-none z-10 flex items-end justify-end">
                  <img src="https://api.dicebear.com/7.x/bottts/svg?seed=Panda1&backgroundColor=transparent&primaryColor=ffffff" alt="Mascot" className="w-24 h-24 object-contain drop-shadow-md mr-2 mb-2" />
              </div>
              <div className="absolute right-4 top-4 w-12 h-12 rounded-full border-2 border-white/20" />
              <div className="absolute right-12 -bottom-4 w-20 h-20 rounded-full border-2 border-white/20" />
          </div>

          <div className="bg-white dark:bg-[#1e1e1e] rounded-[32px] p-6 sm:p-8 shadow-xl border border-gray-100 dark:border-zinc-800">
              <h4 className="text-[15px] font-bold text-zinc-900 dark:text-white mb-6 tracking-tight">Account Center</h4>
              
              <div className="space-y-2">
                 <NewMenuItem icon="user" label="My Profile" color="text-blue-500" bg="bg-blue-50 dark:bg-blue-900/20" onClick={() => navigate('/profile/edit')} />
                 <NewMenuItem icon="users" label="Saved Accounts / Switch" color="text-purple-500" bg="bg-purple-50 dark:bg-purple-900/20" onClick={() => window.dispatchEvent(new CustomEvent('openAccountCenter'))} />
                 <NewMenuItem icon="lock" label="Change Password" color="text-[#EF8020]" bg="bg-orange-50 dark:bg-orange-900/20" onClick={() => navigate('/settings/password')} />
              </div>
          </div>
          
          <div className="bg-white dark:bg-[#1e1e1e] rounded-[32px] p-6 sm:p-8 shadow-xl border border-gray-100 dark:border-zinc-800">
              <h4 className="text-[15px] font-bold text-zinc-900 dark:text-white mb-6 tracking-tight">Orders & Shopping</h4>
              
              <div className="space-y-2">
                 <NewMenuItem icon="box" label="My Orders" color="text-[#1cdb5e]" bg="bg-[#1cdb5e]/10 dark:bg-[#1cdb5e]/10" onClick={() => navigate('/orders')} />
                 <NewMenuItem icon="heart" label="Wishlist" color="text-rose-500" bg="bg-rose-50 dark:bg-rose-900/20" onClick={() => navigate('/wishlist')} />
                 <NewMenuItem icon="ticket" label="Coupons & Vouchers" color="text-amber-500" bg="bg-amber-50 dark:bg-amber-900/20" onClick={() => navigate('/coupon')} />
                 <NewMenuItem icon="envelope-open-text" label="My Support Tickets" color="text-emerald-500" bg="bg-emerald-50 dark:bg-emerald-900/20" onClick={() => navigate('/my-tickets')} />
                 <NewMenuItem icon="coins" label="My Coins" color="text-yellow-500" bg="bg-yellow-50 dark:bg-yellow-900/20" onClick={() => navigate('/my-coins')} />
              </div>
          </div>
          
          <div className="bg-white dark:bg-[#1e1e1e] rounded-[32px] p-6 sm:p-8 shadow-xl border border-gray-100 dark:border-zinc-800">
              <h4 className="text-[15px] font-bold text-zinc-900 dark:text-white mb-6 tracking-tight">Tools & Hub</h4>
              
              <div className="space-y-2">
                 <NewMenuItem icon={<LinkIcon className="w-5 h-5 text-emerald-500" />} label="Affiliate Dashboard" color="text-emerald-500" bg="bg-emerald-50 dark:bg-emerald-900/20" onClick={() => navigate('/affiliate/dashboard')} />
                 <NewMenuItem icon={<Presentation className="w-5 h-5 text-indigo-500" />} label="Creator Hub" color="text-indigo-500" bg="bg-indigo-50 dark:bg-indigo-900/20" onClick={() => navigate('/affiliate/creator_hub')} />
                 <NewMenuItem icon={<Gift className="w-5 h-5 text-pink-500" />} label="Small Creators" color="text-pink-500" bg="bg-pink-50 dark:bg-pink-900/20" onClick={() => navigate('/affiliate/small_creators')} />
                 {isAdmin && (
                    <NewMenuItem icon={<Shield className="w-5 h-5" />} label="Admin Panel" color="text-indigo-500" bg="bg-indigo-50 dark:bg-indigo-900/20" onClick={() => navigate('/admin')} />
                 )}
                 {isSeller && (
                   <>
                     <NewMenuItem icon={<Store className="w-5 h-5 text-emerald-500" />} label="Seller Dashboard" color="text-emerald-500" bg="bg-emerald-50 dark:bg-emerald-900/20" onClick={() => navigate('/seller/dashboard')} />
                     <NewMenuItem 
                       icon={localUserData?.kycStatus === "verified" ? <VerifiedIcon className="w-5 h-5 text-emerald-500" /> : <AlertCircle className="w-5 h-5 text-amber-500" />} 
                       label={localUserData?.kycStatus === "verified" ? "KYC Verified (Get Verified Badge)" : localUserData?.kycStatus === "pending" ? "KYC Pending Verification" : "Get Verified Badge"} 
                       color={localUserData?.kycStatus === "verified" ? "text-emerald-500" : "text-amber-500"}
                        bg={localUserData?.kycStatus === "verified" ? "bg-emerald-50 dark:bg-emerald-900/20" : "bg-amber-50 dark:bg-amber-900/20"}
                        onClick={() => {
                         if (localUserData?.kycStatus === "verified") {
                           notify("You are already verified!", "success");
                         } else {
                           navigate("/kyc-verification");
                         }
                       }} 
                     />
                   </>
                 )}
                 <NewMenuItem icon={<MessageSquare className="w-5 h-5 text-blue-500" />} label="Messages (Inbox)" color="text-blue-500" bg="bg-blue-50 dark:bg-blue-900/20" onClick={() => navigate('/messages')} />
              </div>
          </div>
          
          <div className="bg-white dark:bg-[#1e1e1e] rounded-[32px] p-6 sm:p-8 shadow-xl border border-gray-100 dark:border-zinc-800">
              <h4 className="text-[15px] font-bold text-zinc-900 dark:text-white mb-6 tracking-tight">Support & Legal</h4>
              
              <div className="space-y-2">
                 <NewMenuItem icon="info-circle" label="FAQs" color="text-zinc-600 dark:text-zinc-400" bg="bg-zinc-100 dark:bg-zinc-800" onClick={() => navigate('/faq')} />
                 <NewMenuItem icon="shield-check" label="Privacy Policy" color="text-zinc-600 dark:text-zinc-400" bg="bg-zinc-100 dark:bg-zinc-800" onClick={() => navigate('/privacy')} />
                 <NewMenuItem icon="file-contract" label="Terms & Conditions" color="text-zinc-600 dark:text-zinc-400" bg="bg-zinc-100 dark:bg-zinc-800" onClick={() => navigate('/terms')} />
                 <NewMenuItem icon="shield-check" label="Cookie Policy" color="text-zinc-600 dark:text-zinc-400" bg="bg-zinc-100 dark:bg-zinc-800" onClick={() => navigate('/cookie-policy')} />
                 <NewMenuItem icon="file-contract" label="Refund Policy" color="text-zinc-600 dark:text-zinc-400" bg="bg-zinc-100 dark:bg-zinc-800" onClick={() => navigate('/refund-policy')} />
                 <NewMenuItem icon="truck" label="Shipping Policy" color="text-zinc-600 dark:text-zinc-400" bg="bg-zinc-100 dark:bg-zinc-800" onClick={() => navigate('/shipping-policy')} />
                 <NewMenuItem icon="info-circle" label="Disclaimer" color="text-zinc-600 dark:text-zinc-400" bg="bg-zinc-100 dark:bg-zinc-800" onClick={() => navigate('/disclaimer')} />
                 <NewMenuItem icon="info-circle" label="About Us" color="text-zinc-600 dark:text-zinc-400" bg="bg-zinc-100 dark:bg-zinc-800" onClick={() => navigate('/about')} />
                 <NewMenuItem icon="envelope" label="Contact Us" color="text-zinc-600 dark:text-zinc-400" bg="bg-zinc-100 dark:bg-zinc-800" onClick={() => navigate('/contact')} />
              </div>
          </div>
          
          <div className="bg-white dark:bg-[#1e1e1e] rounded-[20px] p-2 sm:p-3 shadow-md border border-gray-100 dark:border-zinc-800">
             <div 
                onClick={handleLogout}
                className="flex items-center justify-between p-3 cursor-pointer rounded-xl"
             >
                <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                       <Icon name="sign-out-alt" className="text-red-500" />
                    </div>
                    <span className="font-bold text-[15px] text-red-500 tracking-tight">Log Out</span>
                </div>
             </div>
          </div>
      </div>

      {/* Recommended Products */}
      {recommendedProducts.length > 0 && (
        <div className="max-w-lg lg:max-w-6xl mx-auto px-5 mt-8 pb-10">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-6 tracking-tight">You Might Also Like</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 lg:gap-6 gap-4 xl:grid-cols-5 2xl:grid-cols-6">
            {recommendedProducts.map((product: any, index: number) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        </div>
      )}

      {/* Kyc wizard modal popup */}
      

    </div>
  );
};

function NewMenuItem({ icon, label, color, bg, onClick }: { icon: React.ReactNode | string, label: string, color: string, bg: string, onClick: () => void }) {
    return (
        <div 
            onClick={onClick}
            className="flex items-center justify-between p-3 sm:p-4 cursor-pointer rounded-2xl"
        >
            <div className="flex items-center space-x-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${bg}`}>
                   {typeof icon === 'string' ? <Icon name={icon} className={color} /> : <div className={color}>{icon}</div>}
                </div>
                <span className="font-bold text-[14px] sm:text-[15px] text-zinc-800 dark:text-zinc-200">{label}</span>
            </div>
            <Icon name="chevron-right" className="text-zinc-300 dark:text-zinc-600 px-2" />
        </div>
    )
}

function ProfileMenuItem({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick: () => void }) {
    return (
        <div 
            onClick={onClick}
            className="flex items-center justify-between p-4 cursor-pointer border-b border-zinc-100 dark:border-zinc-800/50 last:border-b-0"
        >
            <div className="flex items-center space-x-4">
                <div className="w-10 h-10 rounded-full bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center shadow-sm">
                   {icon}
                </div>
                <span className="font-medium text-[15px] text-zinc-900 dark:text-zinc-100">{label}</span>
            </div>
            <ChevronRight className="w-5 h-5 text-zinc-400" strokeWidth={2} />
        </div>
    )
}

export default Profile;

