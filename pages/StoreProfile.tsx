import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { collection, query, where, getDocs, doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { db, auth } from "../firebase";
import { useRegion } from "../components/RegionContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star, MessageSquare, Phone, ArrowLeft, ShieldAlert, Calendar, LayoutGrid, Layers, Award, AlertCircle } from "lucide-react";
import { VerifiedIcon } from "../components/SellerBadge";
import { ProductCard } from "../components/ui/ProductCard";

interface SellerProfile {
  id: string;
  shopName?: string;
  displayName?: string;
  photoURL?: string;
  avatarUrl?: string;
  kycStatus?: "verified" | "pending" | "unverified";
  tiktokId?: string;
  shopNumber?: string;
}

export default function StoreProfile() {
  const { sellerId } = useParams();
  const navigate = useNavigate();
  const { formatPrice } = useRegion();
  const [seller, setSeller] = useState<SellerProfile | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [userReviews, setUserReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminEditModal, setShowAdminEditModal] = useState(false);
  const [adminEditingReview, setAdminEditingReview] = useState<any | null>(null);
  const [adminEditRating, setAdminEditRating] = useState(5);
  const [adminEditText, setAdminEditText] = useState("");

  useEffect(() => {
    const checkAdmin = async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const uDoc = await getDoc(doc(db, "users", currentUser.uid));
        if (uDoc.exists() && uDoc.data()?.isAdmin) {
          setIsAdmin(true);
        }
      }
    };
    checkAdmin();
  }, []);

  const handleDeleteReview = async (reviewId: string, isProductReview: boolean) => {
    if (!window.confirm("Are you sure you want to delete this review?")) return;
    try {
      const collectionName = isProductReview ? "reviews" : "user_reviews";
      await deleteDoc(doc(db, collectionName, reviewId));
      if (isProductReview) {
        setReviews(prev => prev.filter(r => r.id !== reviewId));
      } else {
        setUserReviews(prev => prev.filter(r => r.id !== reviewId));
      }
      alert("Review deleted successfully!");
    } catch (err) {
      console.error("Error deleting review:", err);
      alert("Failed to delete review");
    }
  };

  const handleOpenAdminEdit = (review: any, isProductReview: boolean) => {
    setAdminEditingReview({ ...review, isProductReview });
    setAdminEditRating(review.rating || 5);
    setAdminEditText(review.comment || review.text || "");
    setShowAdminEditModal(true);
  };

  const handleSaveAdminEdit = async () => {
    if (!adminEditingReview) return;
    try {
      const collectionName = adminEditingReview.isProductReview ? "reviews" : "user_reviews";
      const reviewDocRef = doc(db, collectionName, adminEditingReview.id);
      
      const updateData: any = {
        rating: adminEditRating,
        comment: adminEditText
      };

      await updateDoc(reviewDocRef, updateData);

      if (adminEditingReview.isProductReview) {
        setReviews(prev => prev.map(r => r.id === adminEditingReview.id ? { ...r, ...updateData } : r));
      } else {
        setUserReviews(prev => prev.map(r => r.id === adminEditingReview.id ? { ...r, ...updateData } : r));
      }

      setShowAdminEditModal(false);
      setAdminEditingReview(null);
      alert("Review updated successfully!");
    } catch (err) {
      console.error("Error updating review:", err);
      alert("Failed to update review");
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!sellerId) return;

    const loadStore = async () => {
      setLoading(true);
      try {
        // 1. Fetch Seller User Doc
        if (sellerId === "system") {
          setSeller({
            id: "system",
            shopName: "DEEP SHOP HQ",
            displayName: "DEEP SHOP",
            kycStatus: "verified",
            tiktokId: "deepshop.official"
          });
        } else {
          const userSnap = await getDoc(doc(db, "users", sellerId));
          if (userSnap.exists()) {
            setSeller({ id: userSnap.id, ...userSnap.data() } as SellerProfile);
          } else {
            // Fallback mock/defaults if user doc not fully created
            setSeller({
              id: sellerId,
              shopName: "Genuine DEEP SHOP Merchant",
              displayName: "Verified Seller",
              kycStatus: "unverified"
            });
          }
        }

        // 2. Fetch Seller's Products
        const q = query(
          collection(db, "products"),
          where("sellerId", "==", sellerId === "system" ? null : sellerId)
        );
        const snap = await getDocs(q);
        const plist = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        
        // If system, and no products matched, fetch default products
        if (sellerId === "system" && plist.length === 0) {
          const allSnap = await getDocs(collection(db, "products"));
          const systemList = allSnap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .filter((p: any) => !p.sellerId);
          setProducts(systemList);
        } else {
          setProducts(plist);
        }

        // 3. Fetch Seller's Reviews (both by sellerId and falling back to productIds)
        let rList: any[] = [];
        const rQuery = query(
          collection(db, "reviews"),
          where("sellerId", "==", sellerId)
        );
        const rSnap = await getDocs(rQuery);
        rList = rSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        if (rList.length === 0 && plist.length > 0) {
          const productIds = plist.map(p => p.id);
          const allReviewsSnap = await getDocs(collection(db, "reviews"));
          rList = allReviewsSnap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .filter(r => productIds.includes(r.productId));
        }
        setReviews(rList);

        // 4. Fetch Chat/User reviews
        const urQuery = query(
          collection(db, "user_reviews"),
          where("revieweeId", "==", sellerId)
        );
        const urSnap = await getDocs(urQuery);
        const urList = urSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setUserReviews(urList);

      } catch (err) {
        console.error("Error loading store:", err);
      } finally {
        setLoading(false);
      }
    };

    loadStore();
  }, [sellerId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-zinc-500 mt-4 font-medium">Opening Store Entrance...</p>
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-6">
        <ShieldAlert className="w-16 h-16 text-rose-500 mb-4" />
        <h1 className="text-xl font-bold">Store Not Found</h1>
        <p className="text-sm text-zinc-500 text-center max-w-xs mt-2">The store you are trying to visit does not exist or has been suspended.</p>
        <Button onClick={() => navigate("/")} className="mt-6 bg-zinc-900 text-white rounded-xl">Go Home</Button>
      </div>
    );
  }

  // Group products by Categories
  const categoriesMap: Record<string, any[]> = {};
  products.forEach((p) => {
    const cat = p.category || "General Gear";
    if (!categoriesMap[cat]) categoriesMap[cat] = [];
    categoriesMap[cat].push(p);
  });

  // Latest products section (sorted by date desc)
  const latestProducts = [...products]
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
    .slice(0, 6);

  // Offers products
  const offerProducts = products.filter((p) => p.isOffer);

  const getSellerRatingValue = () => {
    if (seller && (seller as any).customRating !== undefined && (seller as any).customRating !== null && String((seller as any).customRating).trim() !== "") {
      return Number((seller as any).customRating);
    }
    const combined = [...reviews, ...userReviews];
    if (combined.length > 0) {
      const sum = combined.reduce((acc, r) => acc + (r.rating || 0), 0);
      return Number((sum / combined.length).toFixed(1));
    }
    return 0;
  };

  const sellerRating = getSellerRatingValue();

  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const filledCount = rating % 1 > 0.7 ? fullStars + 1 : fullStars;
    
    return (
      <div className="flex items-center justify-center sm:justify-start gap-0.5 mt-2">
        {Array.from({ length: 5 }).map((_, i) => {
          const isFilled = i < filledCount;
          return (
            <Star
              key={i}
              className={`w-3.5 h-3.5 ${
                isFilled ? "text-amber-500 fill-amber-500" : "text-zinc-300 dark:text-zinc-700"
              }`}
            />
          );
        })}
        <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400 ml-1.5">
          {rating > 0 ? `${rating} Store Rating` : "0.0 Store Rating"}
        </span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-20">
      {/* Upper Brand Cover */}
      <div className="relative h-44 bg-gradient-to-r from-emerald-600 via-emerald-800 to-zinc-900 overflow-hidden">
        <div className="absolute inset-0 bg-black/10 backdrop-blur-xs"></div>
      </div>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-4 -mt-16 relative z-10">
        
        {/* Profile Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-6 shadow-xl border border-zinc-200/50 dark:border-zinc-800/80 mb-8 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 flex-1 min-w-0">
            <Avatar className="h-20 w-20 border-4 border-white dark:border-zinc-900 shadow-md bg-zinc-100 dark:bg-zinc-800 shrink-0 mx-auto sm:mx-0">
              {seller.photoURL || seller.avatarUrl ? (
                <img src={seller.photoURL || seller.avatarUrl} alt={seller.shopName || "Seller"} className="w-full h-full object-cover" />
              ) : (
                <AvatarFallback className="bg-zinc-200 dark:bg-zinc-700 text-zinc-950 dark:text-zinc-50 font-bold text-xl uppercase">
                  {(seller.shopName || seller.displayName || "VG").slice(0, 2)}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="flex-1 min-w-0 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
                <h1 className="text-xl md:text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tight break-words">
                  {seller.shopName || seller.displayName || "Vibe Merchant"}
                </h1>
                {seller.kycStatus === "verified" ? (
                  <span className="inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-900/30 whitespace-nowrap">
                    <VerifiedIcon className="w-3.5 h-3.5" /> Verified Store
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-100 dark:border-rose-900/30 whitespace-nowrap">
                    <AlertCircle className="w-3.5 h-3.5" /> Not Verified
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-500 mt-1 break-words">
                Shop number: {seller.shopNumber || "Online Presence"} • Registered Partner
              </p>
              {renderStars(sellerRating)}

              {/* TikTok ID link */}
              {seller.tiktokId && (
                <a 
                  href={`https://tiktok.com/@${seller.tiktokId}`}
                  target="_blank"
                  referrerPolicy="no-referrer"
                  className="inline-flex items-center gap-1.5 mt-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 px-2.5 py-1 rounded-full text-[11px] font-bold text-zinc-800 dark:text-zinc-200 transition break-all"
                >
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.02 1.59 4.23.95 1.2 2.27 2 3.76 2.27v3.93c-1.89-.04-3.72-.67-5.26-1.78-.18-.13-.35-.27-.51-.42v6.19c.01 1.76-.48 3.48-1.42 4.93-.94 1.46-2.29 2.56-3.87 3.17-1.58.61-3.32.74-4.97.37-1.66-.36-3.17-1.28-4.32-2.61-1.16-1.34-1.81-3.05-1.87-4.81-.06-1.76.45-3.49 1.44-4.93.99-1.44 2.39-2.5 4.01-3.04 1.62-.54 3.38-.6 5.04-.17v4.03c-1.09-.27-2.25-.19-3.28.25-.1.04-.19.09-.29.15-.71.43-1.26 1.09-1.57 1.88-.31.79-.34 1.66-.08 2.47.26.81.79 1.5 1.5 1.96.71.46 1.56.66 2.4.55.84-.11 1.62-.53 2.19-1.19.57-.66.86-1.5.82-2.37V.02h.11z"/>
                  </svg>
                  @{seller.tiktokId}
                </a>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-row md:flex-col items-center gap-3 w-full md:w-auto shrink-0 justify-center md:justify-end flex-wrap sm:flex-nowrap">
            <Button
              onClick={() => navigate(`/messages?chatId=${seller.id}&autoCall=true`)}
              className="flex-1 sm:flex-initial bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white rounded-xl text-xs font-extrabold px-4 py-2.5 flex items-center justify-center gap-2 border border-zinc-200 dark:border-zinc-700 h-10 whitespace-nowrap"
            >
              <Phone className="w-4 h-4 text-emerald-500 fill-emerald-500" /> Audio Call
            </Button>
            <Button
              onClick={() => navigate(`/messages?chatId=${seller.id}`)}
              className="flex-1 sm:flex-initial bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold px-4 py-2.5 flex items-center justify-center gap-2 h-10 whitespace-nowrap"
            >
              <MessageSquare className="w-4 h-4 text-white" /> Message Store
            </Button>
          </div>
        </div>

        {/* Promo Offers section if present */}
        {offerProducts.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <span className="bg-rose-500 text-white font-extrabold text-[10px] uppercase px-2 py-0.5 rounded">Promo</span>
              <h2 className="text-lg font-extrabold text-zinc-950 dark:text-zinc-50 tracking-tight uppercase">Special Flash Deals</h2>
            </div>
            {/* Horizontal Scroll Layout */}
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none snap-x">
              {offerProducts.map((p) => (
                <div key={p.id} className="w-64 shrink-0 snap-start">
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Latest Products section */}
        {latestProducts.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4.5 h-4.5 text-[#EF8020]" />
                <h2 className="text-lg font-extrabold text-zinc-950 dark:text-zinc-50 tracking-tight uppercase">Newly Arrived Products</h2>
              </div>
              <span className="text-xs font-semibold text-zinc-400">By date added</span>
            </div>
            {/* Grid layout */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {latestProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}

        {/* Categorized sections */}
        <div className="space-y-10">
          {Object.entries(categoriesMap).map(([category, catProds], index) => {
            // Alternate layouts for visual variety!
            // Layout 0: Standard Grid, Layout 1: Thin list rows, Layout 2: Wide grid
            const layoutType = index % 3;

            return (
              <div key={category} className="border-t border-zinc-200/60 dark:border-zinc-800/60 pt-8">
                <div className="flex items-center gap-2.5 mb-5">
                  <div className="w-1.5 h-5 bg-[#EF8020] rounded-full"></div>
                  <h3 className="text-lg font-extrabold text-zinc-900 dark:text-white uppercase tracking-tight">{category}</h3>
                  <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-500 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {catProds.length} Items
                  </span>
                </div>

                {layoutType === 0 ? (
                  // Classic Grid
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {catProds.map((p) => (
                      <ProductCard key={p.id} product={p} />
                    ))}
                  </div>
                ) : layoutType === 1 ? (
                  // Thin row lists
                  <div className="space-y-3">
                    {catProds.map((p) => (
                      <div 
                        key={p.id} 
                        onClick={() => navigate(`/${p.id}`)}
                        className="flex items-center gap-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-[#EF8020]/40 p-3 rounded-2xl cursor-pointer transition shadow-xs"
                      >
                        <div className="w-14 h-14 bg-zinc-100 dark:bg-zinc-800 rounded-xl bg-cover bg-center shrink-0" style={{ backgroundImage: `url(${p.image})` }}></div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm text-zinc-900 dark:text-white truncate">{p.name}</h4>
                          <p className="text-xs text-zinc-400 mt-0.5 line-clamp-1">{p.description}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-bold text-sm text-zinc-950 dark:text-zinc-50">
                            {formatPrice(p.price)}
                          </span>
                          {p.isOffer && (
                            <span className="text-[10px] line-through text-zinc-400 block mt-0.5">
                              {formatPrice(p.offerPrice)}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  // Dense bento style
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
                    {catProds.map((p) => (
                      <ProductCard key={p.id} product={p} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Empty state */}
        {products.length === 0 && (
          <div className="text-center py-24 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl mt-6">
            <LayoutGrid className="w-12 h-12 text-zinc-400 mx-auto mb-3 animate-pulse" />
            <h3 className="text-lg font-bold">This Store is Stocking Up</h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">This merchant hasn't published any items for sale yet. Check back shortly!</p>
          </div>
        )}

        {/* MERCHANT REVIEWS SECTION (Stylish Horizontal Scroll) */}
        <div className="mt-12 pt-8 border-t border-zinc-200/60 dark:border-zinc-800/60">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-1.5 h-5 bg-amber-500 rounded-full"></div>
              <h3 className="text-lg font-extrabold text-zinc-900 dark:text-white uppercase tracking-tight">Merchant Reviews</h3>
              <span className="bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {reviews.length + userReviews.length} Reviews
              </span>
            </div>
            {sellerRating > 0 && (
              <div className="flex items-center gap-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-black px-2.5 py-1 rounded-xl">
                <Star className="w-3.5 h-3.5 fill-amber-500" />
                <span>{sellerRating} Rating</span>
              </div>
            )}
          </div>

          {reviews.length + userReviews.length === 0 ? (
            <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 text-center">
              <Star className="w-8 h-8 text-zinc-300 dark:text-zinc-700 mx-auto mb-2 animate-spin" style={{ animationDuration: '4s' }} />
              <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">No Reviews Yet</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs mx-auto">
                After a conversation reaches 4+ messages in chat, both parties can leave rating reviews!
              </p>
            </div>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-4 pt-1 snap-x scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
              {[
                ...reviews.map(r => ({ ...r, isProductReview: true })),
                ...userReviews.map(r => ({ ...r, isProductReview: false }))
              ]
                .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
                .map((r, i) => {
                  const ratingVal = r.rating || 5;
                  const commentVal = r.comment || r.text || "No detailed feedback provided.";
                  const dateString = r.createdAt ? new Date(r.createdAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" }) : "Recent";
                  
                  return (
                    <div 
                      key={r.id || i} 
                      className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800/80 rounded-2xl p-4 w-[290px] sm:w-[320px] shrink-0 snap-start shadow-xs hover:shadow-md transition relative flex flex-col justify-between"
                    >
                      <div>
                        {/* Header details with potential admin actions */}
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-9 h-9 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 text-xs font-black text-zinc-700 dark:text-zinc-300 uppercase overflow-hidden border border-zinc-200/50 dark:border-zinc-700/50">
                              {r.reviewerPhoto || r.userPhoto ? (
                                <img src={r.reviewerPhoto || r.userPhoto} alt="Reviewer" className="w-full h-full object-cover" />
                              ) : (
                                <span>{(r.reviewerName || r.userName || "U")[0]}</span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <h5 className="font-bold text-xs text-zinc-900 dark:text-zinc-100 truncate">
                                {r.reviewerName || r.userName || "Verified User"}
                              </h5>
                              <span className="text-[10px] text-zinc-400 font-medium block">
                                {dateString}
                              </span>
                            </div>
                          </div>

                          {/* Review category label & admin buttons */}
                          <div className="flex items-center gap-1.5 shrink-0">
                            {isAdmin && (
                              <div className="flex items-center gap-1">
                                <button 
                                  onClick={() => handleOpenAdminEdit(r, r.isProductReview)}
                                  className="p-1 rounded bg-zinc-100 hover:bg-amber-100 text-zinc-500 hover:text-amber-600 dark:bg-zinc-850 dark:hover:bg-amber-950 transition"
                                  title="Edit review"
                                >
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                  </svg>
                                </button>
                                <button 
                                  onClick={() => handleDeleteReview(r.id, r.isProductReview)}
                                  className="p-1 rounded bg-zinc-100 hover:bg-rose-100 text-zinc-500 hover:text-rose-600 dark:bg-zinc-850 dark:hover:bg-rose-950 transition"
                                  title="Delete review"
                                >
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Stars */}
                        <div className="flex items-center gap-0.5 mb-2.5">
                          {Array.from({ length: 5 }).map((_, starIdx) => (
                            <Star 
                              key={starIdx} 
                              className={`w-3.5 h-3.5 ${starIdx < ratingVal ? "text-amber-500 fill-amber-500" : "text-zinc-200 dark:text-zinc-800"}`} 
                            />
                          ))}
                        </div>

                        {/* Comment text */}
                        <p className="text-xs text-zinc-650 dark:text-zinc-350 leading-relaxed line-clamp-3 italic mb-3">
                          "{commentVal}"
                        </p>
                      </div>

                      {/* Tag specifying source of review */}
                      <div className="mt-auto flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800/60 pt-2 text-[9px] font-bold uppercase tracking-wider">
                        {r.isProductReview ? (
                          <span className="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/25 px-2 py-0.5 rounded-md">
                            📦 Product Order
                          </span>
                        ) : (
                          <span className="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/25 px-2 py-0.5 rounded-md">
                            💬 Chat Trade
                          </span>
                        )}
                        {r.chatId && !r.isProductReview && (
                          <span className="text-zinc-400">P2P ID: {r.chatId.substring(0,6)}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* ADMIN EDIT REVIEW MODAL */}
        {showAdminEditModal && adminEditingReview && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-inter">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 w-full max-w-md shadow-2xl relative">
              <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-wider mb-4">
                Admin: Edit Merchant Review
              </h3>
              
              <div className="mb-4">
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wide mb-1.5">Rating Stars</label>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} type="button" onClick={() => setAdminEditRating(star)}>
                      <Star className={`w-8 h-8 ${star <= adminEditRating ? "text-amber-500 fill-amber-500" : "text-zinc-200 dark:text-zinc-800"}`} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-5">
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wide mb-1.5">Review Comment</label>
                <textarea 
                  value={adminEditText}
                  onChange={(e) => setAdminEditText(e.target.value)}
                  rows={4}
                  className="w-full text-xs p-3 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950 outline-none focus:ring-1 ring-amber-500 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => setShowAdminEditModal(false)}
                  className="flex-1 py-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-bold rounded-xl text-zinc-900 dark:text-white"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveAdminEdit}
                  className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
