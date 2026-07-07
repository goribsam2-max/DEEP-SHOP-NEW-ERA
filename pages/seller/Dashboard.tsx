import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  query,
  where,
  getDoc,
  onSnapshot
} from "firebase/firestore";
import { db, auth } from "../../firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { OrderStatus } from "../../types";
import { uploadToImgbb } from "../../services/imgbb";
import { useNotify, useConfirm } from "../../components/Notifications";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, Edit, Trash2, Package, Eye, ShoppingBag, TrendingUp, Music, 
  Store, Camera, Film, Link2, ShieldCheck, Check, DollarSign, ListPlus, Loader2,
  X, ArrowLeft as LucideArrowLeft, ShieldAlert, Award
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SellerBadge, VerifiedIcon } from "../../components/SellerBadge";
import { AlertCircle } from "lucide-react";

const PRESET_SONGS = [
  {
    name: "LoFi Chill",
    url: "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3",
  },
  {
    name: "Upbeat Corporate",
    url: "https://cdn.pixabay.com/download/audio/2022/10/24/audio_34b4ce6dcb.mp3?filename=uplifting-upbeat-corporate-125086.mp3",
  },
  {
    name: "Cyberpunk Action",
    url: "https://cdn.pixabay.com/download/audio/2022/03/15/audio_249ea36566.mp3?filename=cyberpunk-2099-10701.mp3",
  },
  {
    name: "Epic Cinematic",
    url: "https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=epic-hollywood-trailer-9489.mp3",
  },
  {
    name: "Pop Vibe",
    url: "https://cdn.pixabay.com/download/audio/2021/08/04/audio_c6ccf3232f.mp3?filename=summer-nights-tropical-house-music-11440.mp3",
  },
];

const SellerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const notify = useNotify();
  const confirm = useConfirm();
  const [user, setUser] = useState<User | null>(null);
  const [sellerProfile, setSellerProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"products" | "stories" | "orders" | "settings">("products");

  // Store Settings states
  const [shopName, setShopName] = useState("");
  const [shopLogo, setShopLogo] = useState("");
  const [tiktokId, setTiktokId] = useState("");
  const [bkashNumber, setBkashNumber] = useState("");
  const [nagadNumber, setNagadNumber] = useState("");
  const [defaultAdvanceAmount, setDefaultAdvanceAmount] = useState<number | string>("");
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // View modes: full-screen separate views
  const [viewMode, setViewMode] = useState<"dashboard" | "add-product" | "add-story">("dashboard");
  const [customCategoryName, setCustomCategoryName] = useState("");
  const [showKycBanner, setShowKycBanner] = useState(true);
  const [isKycWizardOpen, setIsKycWizardOpen] = useState(false);

  // Data states
  const [products, setProducts] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal / Form states
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);
  const [productEditingId, setProductEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Product Form State
  const [productForm, setProductForm] = useState({
    name: "",
    price: "",
    description: "",
    category: "Border Cross Products",
    stock: "10",
    isOffer: false,
    offerPrice: "",
    modelUrl: "",
    videoUrl: "",
    imageFiles: [] as File[],
    coinReward: "0",
    isCodEnabled: true,
    advanceAmount: "",
  });

  // Story Form State
  const [storyForm, setStoryForm] = useState({
    type: "image" as "image" | "video",
    mediaUrl: "",
    videoUrl: "",
    category: "Border Cross",
    linkUrl: "",
    songUrl: PRESET_SONGS[0].url,
    mediaFile: null as File | null,
  });

  useEffect(() => {
    let unsubProfile: (() => void) | null = null;
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        
        // Setup onSnapshot for real-time user role and kycStatus checking
        unsubProfile = onSnapshot(doc(db, "users", u.uid), (snap) => {
          if (snap.exists()) {
            const profile = snap.data();
            if (profile.role !== "seller" && profile.role !== "admin") {
              notify("Access Denied. Only registered sellers can view this dashboard.", "error");
              navigate("/");
              return;
            }
            setSellerProfile(profile);
            fetchSellerData(u.uid);
          } else {
            notify("Seller profile not found.", "error");
            navigate("/");
          }
        });

      } else {
        navigate("/signin");
      }
    });
    return () => {
      unsub();
      if (unsubProfile) unsubProfile();
    };
  }, [navigate]);

  useEffect(() => {
    if (sellerProfile) {
      setShopName(sellerProfile.shopName || "");
      setShopLogo(sellerProfile.photoURL || sellerProfile.avatarUrl || "");
      setTiktokId(sellerProfile.tiktokId || "");
      setBkashNumber(sellerProfile.bkashNumber || "");
      setNagadNumber(sellerProfile.nagadNumber || "");
      setDefaultAdvanceAmount(sellerProfile.defaultAdvanceAmount ?? "");
    }
  }, [sellerProfile]);

  const saveStoreSettings = async () => {
    if (!user) return;
    setIsSavingSettings(true);
    try {
      const { updateDoc, doc } = await import("firebase/firestore");
      await updateDoc(doc(db, "users", user.uid), {
        shopName: shopName,
        photoURL: shopLogo,
        avatarUrl: shopLogo,
        tiktokId: tiktokId,
        bkashNumber: bkashNumber,
        nagadNumber: nagadNumber,
        defaultAdvanceAmount: defaultAdvanceAmount === "" ? "" : Number(defaultAdvanceAmount)
      });
      notify("Store settings updated successfully!", "success");
    } catch (err: any) {
      console.error(err);
      notify("Failed to save store settings.", "error");
    } finally {
      setIsSavingSettings(false);
    }
  };

  const fetchSellerData = async (sellerId: string) => {
    setLoading(true);
    try {
      // 1. Fetch Products
      const prodQuery = query(collection(db, "products"), where("sellerId", "==", sellerId));
      const prodSnap = await getDocs(prodQuery);
      const prodList = prodSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setProducts(prodList);

      // 2. Fetch Stories
      const storyQuery = query(collection(db, "stories"), where("sellerId", "==", sellerId));
      const storySnap = await getDocs(storyQuery);
      setStories(storySnap.docs.map(d => ({ id: d.id, ...d.data() })));

      // 3. Fetch Orders
      const orderSnap = await getDocs(collection(db, "orders"));
      const allOrders = orderSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Filter orders that have items belonging to this seller
      const sellerOrders = allOrders.filter((ord: any) => 
        ord.items?.some((item: any) => prodList.some((p: any) => p.id === item.productId))
      );
      setOrders(sellerOrders);

    } catch (err) {
      console.error(err);
      notify("Failed to fetch dashboard data.", "error");
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    try {
      let updateData: any = { status };
      if (status === OrderStatus.CANCELLED) {
        const reason = window.prompt("Reason for rejection:");
        if (reason === null) return;
        updateData.rejectReason = reason;
      }
      
      await updateDoc(doc(db, "orders", orderId), updateData);
      notify(`Order status: ${status}`, "success");
      
      // Update local state
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...updateData } : o));
      
      // Notify customer of order status update!
      const orderObj = orders.find(o => o.id === orderId);
      if (orderObj && orderObj.userId && orderObj.userId !== "guest") {
        const title = `📦 Order Status Update: ${status}`;
        const message = `Your order #${orderId.slice(0, 8)} status has been updated to "${status}".`;
        // Save to notifications collection
        await addDoc(collection(db, "notifications"), {
          userId: orderObj.userId,
          title,
          message,
          createdAt: Date.now(),
          isRead: false,
          type: "order",
          link: `/profile`
        });
        
        // Trigger web push
        fetch("/api/send-push-user", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: orderObj.userId,
            title,
            body: message,
            link: "/profile"
          })
        }).catch(e => console.error("Push notify user failed:", e));
      }
    } catch (e) {
      notify("Update failed", "error");
    }
  };

  const updateOrderTrackingId = async (orderId: string, trackingId: string) => {
    try {
      await updateDoc(doc(db, "orders", orderId), {
        trackingId: trackingId.trim(),
      });
      notify("Tracking ID synced", "success");
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, trackingId: trackingId.trim() } : o));
    } catch (e) {
      notify("Update failed", "error");
    }
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name || !productForm.price) {
      notify("Product Name and Price are required", "error");
      return;
    }

    setSubmitting(true);
    try {
      let imageUrls: string[] = [];
      if (productForm.imageFiles.length > 0) {
        for (const file of productForm.imageFiles) {
          const url = await uploadToImgbb(file);
          imageUrls.push(url);
        }
      }

      const productData: any = {
        name: productForm.name,
        price: Number(productForm.price),
        description: productForm.description,
        category: productForm.category,
        stock: Number(productForm.stock || 10),
        isOffer: Boolean(productForm.isOffer),
        offerPrice: productForm.isOffer ? Number(productForm.offerPrice || 0) : 0,
        modelUrl: productForm.modelUrl || "",
        videoUrl: productForm.videoUrl || "",
        sellerId: user?.uid,
        sellerShopName: sellerProfile?.shopName || "Genuine Seller",
        coinReward: Number(productForm.coinReward || 0),
        isCodEnabled: Boolean(productForm.isCodEnabled),
        advanceAmount: productForm.advanceAmount ? Number(productForm.advanceAmount) : null,
        updatedAt: Date.now()
      };

      if (imageUrls.length > 0) {
        productData.image = imageUrls[0];
        productData.images = imageUrls;
      }

      if (productEditingId) {
        await updateDoc(doc(db, "products", productEditingId), productData);
        notify("Product updated successfully", "success");
      } else {
        productData.rating = 5;
        productData.numReviews = 0;
        productData.createdAt = Date.now();
        await addDoc(collection(db, "products"), productData);
        notify("New product added successfully", "success");
      }

      setViewMode("dashboard");
      setProductEditingId(null);
      resetProductForm();
      if (user) fetchSellerData(user.uid);
    } catch (err: any) {
      notify(err.message || "Failed to save product", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const resetProductForm = () => {
    setProductForm({
      name: "",
      price: "",
      description: "",
      category: "Border Cross Products",
      stock: "10",
      isOffer: false,
      offerPrice: "",
      modelUrl: "",
      videoUrl: "",
      imageFiles: [] as File[],
      coinReward: "0",
      isCodEnabled: true,
      advanceAmount: "",
    });
  };

  const handleEditProduct = (prod: any) => {
    setProductEditingId(prod.id);
    setProductForm({
      name: prod.name || "",
      price: String(prod.price || ""),
      description: prod.description || "",
      category: prod.category || "Border Cross Products",
      stock: String(prod.stock || 10),
      isOffer: prod.isOffer || false,
      offerPrice: String(prod.offerPrice || ""),
      modelUrl: prod.modelUrl || "",
      videoUrl: prod.videoUrl || "",
      imageFiles: [],
      coinReward: String(prod.coinReward || "0"),
      isCodEnabled: prod.isCodEnabled !== undefined ? prod.isCodEnabled : true,
      advanceAmount: prod.advanceAmount !== undefined && prod.advanceAmount !== null ? String(prod.advanceAmount) : "",
    });
    setViewMode("add-product");
    // If the category is a custom one (not in preset categories), set customCategoryName
    if (!["Border Cross Products", "Mobile", "Smart Watch", "Earbuds", "Accessories"].includes(prod.category)) {
      setCustomCategoryName(prod.category);
    } else {
      setCustomCategoryName("");
    }
  };

  const handleDeleteProduct = (id: string) => {
    if (sellerProfile?.kycStatus !== "verified") {
      notify("পণ্য মুছে ফেলার জন্য আপনাকে অবশ্যই ভেরিফাইড বিক্রেতা হতে হবে। হোয়াটসঅ্যাপ / কল করুন: 01778953114", "error");
      confirm({
        title: "যোগাযোগ করুন / Contact Admin",
        message: "পণ্য মুছে ফেলার জন্য আপনাকে অবশ্যই একজন ভেরিফাইড বিক্রেতা হতে হবে। অনুগ্রহ করে এডমিনের সাথে যোগাযোগ করুন।\n\nমোবাইল এবং হোয়াটসঅ্যাপ নম্বর: 01778953114",
        onConfirm: () => {
          window.open("https://wa.me/8801778953114", "_blank");
        }
      });
      return;
    }
    confirm({
      title: "Delete Product?",
      message: "This will permanently delete your product from the shop.",
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, "products", id));
          notify("Product deleted successfully", "success");
          if (user) fetchSellerData(user.uid);
        } catch {
          notify("Failed to delete product", "error");
        }
      }
    });
  };

  const toggleProductSoldStatus = async (p: any) => {
    try {
      const newSoldState = !p.isSold;
      await updateDoc(doc(db, "products", p.id), {
        isSold: newSoldState
      });
      notify(newSoldState ? "পণ্যটি বিক্রি হয়েছে হিসেবে চিহ্নিত করা হয়েছে (Sold Out)" : "পণ্যটি এভেইলেবল হিসেবে চিহ্নিত করা হয়েছে (Available)", "success");
      if (user) fetchSellerData(user.uid);
    } catch {
      notify("Failed to update status", "error");
    }
  };

  const handleStorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      let finalMediaUrl = storyForm.mediaUrl;
      if (storyForm.mediaFile) {
        finalMediaUrl = await uploadToImgbb(storyForm.mediaFile);
      }

      if (!finalMediaUrl && storyForm.type === "image") {
        notify("Please upload or provide an image URL for your story", "error");
        setSubmitting(false);
        return;
      }

      const storyData = {
        type: storyForm.type,
        mediaUrl: finalMediaUrl || storyForm.videoUrl,
        category: storyForm.category,
        linkUrl: storyForm.linkUrl,
        audioUrl: storyForm.type === "image" ? storyForm.songUrl : "",
        audioStart: 0,
        createdAt: Date.now(),
        sellerId: user?.uid,
        sellerShopName: sellerProfile?.shopName || "Genuine Seller",
      };

      await addDoc(collection(db, "stories"), storyData);
      notify("Story posted successfully!", "success");
      setViewMode("dashboard");
      setStoryForm({
        type: "image",
        mediaUrl: "",
        videoUrl: "",
        category: "Border Cross",
        linkUrl: "",
        songUrl: PRESET_SONGS[0].url,
        mediaFile: null,
      });
      if (user) fetchSellerData(user.uid);
    } catch {
      notify("Failed to post story", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteStory = (id: string) => {
    confirm({
      title: "Remove Story?",
      message: "Are you sure you want to remove this story?",
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, "stories", id));
          notify("Story removed successfully", "success");
          if (user) fetchSellerData(user.uid);
        } catch {
          notify("Failed to remove story", "error");
        }
      }
    });
  };

  // Helper stats
  const totalEarnings = orders.reduce((sum, ord) => sum + (ord.total || 0), 0);

  // Early return for Add/Edit Product separate full-screen page
  if (viewMode === "add-product") {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-24 font-sans">
        <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 p-5 sticky top-0 z-50 shadow-sm">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <button 
              type="button"
              onClick={() => {
                setViewMode("dashboard");
                setProductEditingId(null);
                resetProductForm();
              }} 
              className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white font-bold text-sm transition-colors"
            >
              <LucideArrowLeft className="w-5 h-5" /> Back to Dashboard
            </button>
            <h2 className="font-black text-lg md:text-xl text-zinc-900 dark:text-white uppercase tracking-tight">
              {productEditingId ? "Edit Store Product" : "List Brand New Product"}
            </h2>
            <div className="w-20 hidden md:block" /> {/* Spacer */}
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 mt-8">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 md:p-8 shadow-xl space-y-6">
            <div className="border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <h3 className="font-extrabold text-lg text-zinc-900 dark:text-white">Product Catalog Listing</h3>
              <p className="text-xs text-zinc-500 mt-1">Please provide accurate details of your border cross items or authentic gadgets for customer safety.</p>
            </div>

            <form onSubmit={handleProductSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase tracking-wider text-zinc-500">Product Name</Label>
                <Input 
                  required
                  placeholder="e.g. iPhone 15 Pro Max Border Cross (Int. Version)" 
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="h-12 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-800 rounded-xl font-medium"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-black uppercase tracking-wider text-zinc-500">Price (৳)</Label>
                  <Input 
                    required
                    type="number"
                    placeholder="e.g. 110000" 
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    className="h-12 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-800 rounded-xl font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-black uppercase tracking-wider text-zinc-500">Stock Amount</Label>
                  <Input 
                    required
                    type="number"
                    placeholder="e.g. 10" 
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                    className="h-12 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-800 rounded-xl font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase tracking-wider text-zinc-500">Product Category</Label>
                <select 
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 p-3 h-12 rounded-xl text-sm font-semibold text-zinc-850 dark:text-zinc-200"
                  value={["Border Cross Products", "Mobile", "Smart Watch", "Earbuds", "Accessories"].includes(productForm.category) ? productForm.category : "custom"}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "custom") {
                      setProductForm({ ...productForm, category: "custom" });
                    } else {
                      setProductForm({ ...productForm, category: val });
                    }
                  }}
                >
                  <option value="Border Cross Products">Border Cross Products</option>
                  <option value="Mobile">Genuine Mobiles</option>
                  <option value="Smart Watch">Smart Watch</option>
                  <option value="Earbuds">Earbuds</option>
                  <option value="Accessories">Accessories</option>
                  <option value="custom">+ Add Custom Category...</option>
                </select>
              </div>

              {/* Custom Category Input Field */}
              {(productForm.category === "custom" || !["Border Cross Products", "Mobile", "Smart Watch", "Earbuds", "Accessories"].includes(productForm.category)) && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-black uppercase tracking-wider text-zinc-500">Enter Custom Category Name</Label>
                  <Input 
                    required
                    placeholder="e.g. Premium Powerbanks"
                    value={productForm.category === "custom" ? customCategoryName : productForm.category}
                    onChange={(e) => {
                      setCustomCategoryName(e.target.value);
                      setProductForm({ ...productForm, category: e.target.value });
                    }}
                    className="h-12 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-800 rounded-xl font-medium"
                  />
                </div>
              )}

              <div className="space-y-3 border border-zinc-100 dark:border-zinc-800 p-5 rounded-2xl bg-zinc-50/50 dark:bg-zinc-850/30">
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox"
                    id="isOffer"
                    checked={productForm.isOffer}
                    onChange={(e) => setProductForm({ ...productForm, isOffer: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-500 border-zinc-300 focus:ring-emerald-400"
                  />
                  <Label htmlFor="isOffer" className="font-bold cursor-pointer text-zinc-850 dark:text-zinc-200 text-sm">Active Special Offer Price?</Label>
                </div>
                {productForm.isOffer && (
                  <div className="space-y-1.5 pt-2">
                    <Label className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Offer Price (৳)</Label>
                    <Input 
                      required
                      type="number"
                      placeholder="e.g. 98000" 
                      value={productForm.offerPrice}
                      onChange={(e) => setProductForm({ ...productForm, offerPrice: e.target.value })}
                      className="h-12 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-800 rounded-xl font-medium"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase tracking-wider text-zinc-500">Upload Product Images</Label>
                <Input 
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    setProductForm({ ...productForm, imageFiles: files });
                  }}
                  className="bg-zinc-50 dark:bg-zinc-850 border-zinc-200 dark:border-zinc-800 file:bg-zinc-200 dark:file:bg-zinc-700 file:text-xs file:font-bold file:rounded-lg"
                />
                <p className="text-[10px] text-zinc-400 font-semibold">Images are uploaded securely to premium cloud storage. First selected image will serve as cover image.</p>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase tracking-wider text-zinc-500">Product Description</Label>
                <Textarea 
                  placeholder="Details about product warranty, item specifications, boxes content etc."
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="min-h-[140px] bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-800 rounded-xl p-4 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-black uppercase tracking-wider text-zinc-500">3D Model URL (Optional)</Label>
                  <Input 
                    placeholder="Sketchfab URL link" 
                    value={productForm.modelUrl}
                    onChange={(e) => setProductForm({ ...productForm, modelUrl: e.target.value })}
                    className="h-12 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-800 rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-black uppercase tracking-wider text-zinc-500">Review Video URL (Optional)</Label>
                  <Input 
                    placeholder="YouTube video link" 
                    value={productForm.videoUrl}
                    onChange={(e) => setProductForm({ ...productForm, videoUrl: e.target.value })}
                    className="h-12 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-800 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border border-zinc-100 dark:border-zinc-800 p-5 rounded-2xl bg-zinc-50/50 dark:bg-zinc-850/30">
                <div className="space-y-1.5">
                  <Label className="text-xs font-black uppercase tracking-wider text-zinc-500">Coin Reward for Buyer</Label>
                  <Input 
                    type="number"
                    placeholder="e.g. 50 (Coins received on purchase)" 
                    value={productForm.coinReward}
                    onChange={(e) => setProductForm({ ...productForm, coinReward: e.target.value })}
                    className="h-12 bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-800 rounded-xl"
                  />
                  <p className="text-[10px] text-zinc-400 font-bold">How many coins the buyer will receive upon purchase of this product.</p>
                </div>
                <div className="flex flex-col justify-center space-y-2 pl-2">
                  <Label className="text-xs font-black uppercase tracking-wider text-zinc-500">Cash On Delivery (COD)</Label>
                  <div className="flex items-center gap-2 pt-1">
                    <input 
                      type="checkbox"
                      id="isCodEnabled"
                      checked={productForm.isCodEnabled}
                      onChange={(e) => setProductForm({ ...productForm, isCodEnabled: e.target.checked })}
                      className="w-4 h-4 rounded text-emerald-500 border-zinc-300 focus:ring-emerald-400 cursor-pointer"
                    />
                    <Label htmlFor="isCodEnabled" className="font-bold cursor-pointer text-zinc-850 dark:text-zinc-200 text-sm">Enable Cash On Delivery?</Label>
                  </div>
                  <p className="text-[10px] text-zinc-400 font-bold">If disabled, buyer must pay in full at checkout.</p>
                </div>
              </div>

              {/* Product Advance Payment Block */}
              <div className="space-y-3 border border-zinc-100 dark:border-zinc-800 p-5 rounded-2xl bg-zinc-50/50 dark:bg-zinc-850/30">
                <div className="space-y-1.5">
                  <Label className="text-xs font-black uppercase tracking-wider text-zinc-500">Custom Advance Payment Amount (৳ - Optional)</Label>
                  <Input 
                    type="number"
                    placeholder="e.g. 500 (Leave empty to use store default advance)" 
                    value={productForm.advanceAmount || ""}
                    onChange={(e) => setProductForm({ ...productForm, advanceAmount: e.target.value })}
                    className="h-12 bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-800 rounded-xl font-semibold"
                  />
                  <p className="text-[10px] text-zinc-400 font-medium">
                    এই নির্দিষ্ট পণ্যের জন্য ক্রেতার থেকে অগ্রিম কত টাকা বুকিং মানি নিতে চান তা এখানে লিখুন। ফাকা রাখলে আপনার স্টোরের সাধারণ অগ্রিম টাকার পরিমাণ (Default Advance) ব্যবহৃত হবে।
                  </p>
                </div>
              </div>

              <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800 flex gap-3">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => {
                    setViewMode("dashboard");
                    setProductEditingId(null);
                    resetProductForm();
                  }}
                  className="flex-1 py-6 rounded-xl border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold"
                >
                  Cancel & Exit
                </Button>
                <Button 
                  type="submit" 
                  disabled={submitting}
                  className="flex-[2] bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-black py-6 rounded-xl shadow-lg flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (productEditingId ? "Save Changes" : "Publish Listing")}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Early return for Add Story separate full-screen page
  if (viewMode === "add-story") {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-24 font-sans">
        <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 p-5 sticky top-0 z-50 shadow-sm">
          <div className="max-w-xl mx-auto flex items-center justify-between">
            <button 
              type="button"
              onClick={() => {
                setViewMode("dashboard");
              }} 
              className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white font-bold text-sm transition-colors"
            >
              <LucideArrowLeft className="w-5 h-5" /> Back to Dashboard
            </button>
            <h2 className="font-black text-lg text-zinc-900 dark:text-white uppercase tracking-tight">
              Publish Story
            </h2>
            <div className="w-20 hidden md:block" /> {/* Spacer */}
          </div>
        </div>

        <div className="max-w-xl mx-auto px-4 mt-8">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 md:p-8 shadow-xl space-y-6">
            <div className="border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <h3 className="font-extrabold text-lg text-zinc-900 dark:text-white">Store Social Story</h3>
              <p className="text-xs text-zinc-500 mt-1">Publish an interactive photo or video story showing real reviews or border clearance snapshots to entice active shoppers.</p>
            </div>

            <form onSubmit={handleStorySubmit} className="space-y-5">
              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase tracking-wider text-zinc-500">Story Media Format</Label>
                <div className="grid grid-cols-2 gap-2 bg-zinc-100 dark:bg-zinc-800 p-1.5 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setStoryForm({ ...storyForm, type: "image" })}
                    className={`py-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${storyForm.type === "image" ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white" : "text-zinc-500"}`}
                  >
                    <Camera className="w-4 h-4" /> Photo Story
                  </button>
                  <button
                    type="button"
                    onClick={() => setStoryForm({ ...storyForm, type: "video" })}
                    className={`py-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${storyForm.type === "video" ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-white" : "text-zinc-500"}`}
                  >
                    <Film className="w-4 h-4" /> Video Story
                  </button>
                </div>
              </div>

              {storyForm.type === "image" ? (
                <div className="space-y-5 animate-fade-in">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-black uppercase tracking-wider text-zinc-500">Select Image File</Label>
                    <Input 
                      type="file"
                      accept="image/*"
                      required
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setStoryForm({ ...storyForm, mediaFile: file });
                      }}
                      className="bg-zinc-50 dark:bg-zinc-850 border-zinc-200 dark:border-zinc-800"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-black uppercase tracking-wider text-zinc-500">Background Soundtrack</Label>
                    <select
                      className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 p-3 h-12 rounded-xl text-sm font-semibold"
                      value={storyForm.songUrl}
                      onChange={(e) => setStoryForm({ ...storyForm, songUrl: e.target.value })}
                    >
                      {PRESET_SONGS.map((song) => (
                        <option key={song.name} value={song.url}>{song.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5 animate-fade-in">
                  <Label className="text-xs font-black uppercase tracking-wider text-zinc-500">Video Streaming Link (MP4 or Youtube)</Label>
                  <Input 
                    required
                    placeholder="https://example.com/demo.mp4" 
                    value={storyForm.videoUrl}
                    onChange={(e) => setStoryForm({ ...storyForm, videoUrl: e.target.value })}
                    className="h-12 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-800 rounded-xl"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase tracking-wider text-zinc-500">Story Category / Hashtag</Label>
                <Input 
                  required
                  placeholder="e.g. New Arrivals, Clearance, Genuine" 
                  value={storyForm.category}
                  onChange={(e) => setStoryForm({ ...storyForm, category: e.target.value })}
                  className="h-12 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-800 rounded-xl font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-black uppercase tracking-wider text-zinc-500">Call-to-Action Link (Optional)</Label>
                <Input 
                  placeholder="e.g. /all-products or specific ID" 
                  value={storyForm.linkUrl}
                  onChange={(e) => setStoryForm({ ...storyForm, linkUrl: e.target.value })}
                  className="h-12 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-800 rounded-xl"
                />
              </div>

              <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800 flex gap-3">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setViewMode("dashboard")}
                  className="flex-1 py-6 rounded-xl border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={submitting}
                  className="flex-[2] bg-emerald-600 hover:bg-emerald-500 text-white font-black py-6 rounded-xl shadow-lg flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Post Live Story"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 pb-20">
      {/* Upper Brand Section */}
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 p-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-emerald-500 text-white text-[10px] uppercase font-extrabold px-2 py-0.5 rounded">Seller</span>
              <h1 className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tight flex items-center gap-1.5">
                {sellerProfile?.shopName || "Seller Portal"}
                {sellerProfile?.kycStatus === "verified" ? (
                  <VerifiedIcon className="w-5 h-5 text-emerald-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-500" />
                )}
              </h1>
              {sellerProfile?.kycStatus === "verified" ? (
                <span className="inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-900/30">
                  <VerifiedIcon className="w-3 h-3" /> Verified Merchant
                </span>
              ) : sellerProfile?.kycStatus === "pending" ? (
                <span className="inline-flex items-center gap-1 bg-yellow-50 dark:bg-yellow-950/20 text-yellow-600 dark:text-yellow-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-yellow-100 dark:border-yellow-900/30">
                  <Loader2 className="w-3 h-3 animate-spin" /> KYC Pending
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-100 dark:border-rose-900/30">
                  <AlertCircle className="w-3 h-3" /> Not Verified
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Welcome, <span className="font-bold">{sellerProfile?.nidOwnerName || user?.email}</span>. Shop number: {sellerProfile?.shopNumber || "N/A"}
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => { resetProductForm(); setProductEditingId(null); setViewMode("add-product"); }}
              className="bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold px-4 py-2 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add Product
            </Button>
            <Button 
              onClick={() => {
                setStoryForm({
                  type: "image",
                  mediaUrl: "",
                  videoUrl: "",
                  category: "Border Cross",
                  linkUrl: "",
                  songUrl: PRESET_SONGS[0].url,
                  mediaFile: null,
                });
                setViewMode("add-story");
              }}
              className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold px-4 py-2 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Post Story
            </Button>
          </div>
        </div>
      </div>

      {/* KYC Alert Banner right below header */}
      {showKycBanner && sellerProfile?.kycStatus !== "verified" && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-600/10 to-amber-500/10 border-b border-amber-200 dark:border-amber-900/30 px-6 py-3.5 flex items-center justify-between text-amber-800 dark:text-amber-300">
          <div className="max-w-6xl mx-auto w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-amber-500 text-white rounded-lg animate-pulse shrink-0">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <span className="font-bold block sm:inline">KYC Identity Verification Required!</span>
                <span className="opacity-90 block sm:inline sm:ms-1.5">
                  Complete your verification to display the "Verified Partner" badge, secure your payouts, and prevent buyer scams.
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <Button 
                onClick={() => navigate("/kyc-verification")} 
                className="bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-[11px] font-bold px-3 py-1.5 h-8"
              >
                {sellerProfile?.kycStatus === "pending" ? "Check Status" : "Verify Account Now"}
              </Button>
              <button 
                onClick={() => setShowKycBanner(false)} 
                className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition text-amber-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 mt-8">
        {/* Verification CTA section */}
        {sellerProfile?.kycStatus !== "verified" && (
          <div className="mb-8 bg-gradient-to-br from-emerald-900/10 to-[#EF8020]/5 border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
            <div className="flex items-start">
              <div>
                <h3 className="font-black text-zinc-900 dark:text-white uppercase tracking-tight text-base">
                  {sellerProfile?.kycStatus === "pending" ? "KYC Verification Under Review" : "Boost Your Store Credibility"}
                </h3>
                <p className="text-xs text-zinc-500 mt-1 max-w-xl leading-relaxed">
                  {sellerProfile?.kycStatus === "pending" 
                    ? "Our compliance team is auditing your NID records and face scans. Your verification check is securely queued and completes in 24 hours." 
                    : "Unverified accounts cannot display buyer confidence badges. Complete our seamless 3D interactive liveness & NID scan to become a fully verified brand partner."
                  }
                </p>
              </div>
            </div>
            <Button 
              onClick={() => navigate("/kyc-verification")}
              className="bg-[#EF8020] hover:bg-[#EF8020]/90 text-white rounded-xl font-bold px-6 py-5 shrink-0 shadow-lg shadow-[#EF8020]/10 flex items-center gap-2"
            >
              {sellerProfile?.kycStatus === "pending" ? "Check/Update Identity" : "Start KYC Wizard"}
            </Button>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex items-center gap-4">
            <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-600 dark:text-zinc-400">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">My Products</span>
              <span className="text-xl font-black">{products.length}</span>
            </div>
          </div>
          <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex items-center gap-4">
            <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-600 dark:text-zinc-400">
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">Stories Published</span>
              <span className="text-xl font-black">{stories.length}</span>
            </div>
          </div>
          <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex items-center gap-4">
            <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-600 dark:text-zinc-400">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">Total Orders</span>
              <span className="text-xl font-black">{orders.length}</span>
            </div>
          </div>
          <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/30 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">Order Revenue</span>
              <span className="text-xl font-black text-emerald-500">৳{totalEarnings}</span>
            </div>
          </div>
        </div>

        {/* Tabs Control */}
        <div className="flex overflow-x-auto flex-nowrap scrollbar-none border-b border-zinc-200 dark:border-zinc-800 mb-6 gap-6">
          <button 
            onClick={() => setActiveTab("products")}
            className={`pb-3 font-bold text-sm tracking-tight transition-colors whitespace-nowrap shrink-0 ${activeTab === "products" ? "border-b-2 border-black dark:border-white text-black dark:text-white" : "text-zinc-400 hover:text-zinc-600"}`}
          >
            My Products ({products.length})
          </button>
          <button 
            onClick={() => setActiveTab("stories")}
            className={`pb-3 font-bold text-sm tracking-tight transition-colors whitespace-nowrap shrink-0 ${activeTab === "stories" ? "border-b-2 border-black dark:border-white text-black dark:text-white" : "text-zinc-400 hover:text-zinc-600"}`}
          >
            My Stories ({stories.length})
          </button>
          <button 
            onClick={() => setActiveTab("orders")}
            className={`pb-3 font-bold text-sm tracking-tight transition-colors whitespace-nowrap shrink-0 ${activeTab === "orders" ? "border-b-2 border-black dark:border-white text-black dark:text-white" : "text-zinc-400 hover:text-zinc-600"}`}
          >
            Customer Orders ({orders.length})
          </button>
          <button 
            onClick={() => setActiveTab("settings")}
            className={`pb-3 font-bold text-sm tracking-tight transition-colors whitespace-nowrap shrink-0 ${activeTab === "settings" ? "border-b-2 border-black dark:border-white text-black dark:text-white" : "text-zinc-400 hover:text-zinc-600"}`}
          >
            Store Settings
          </button>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
            <p className="text-xs text-zinc-500 mt-2">Loading data...</p>
          </div>
        ) : (
          <div>
            {/* Products Tab */}
            {activeTab === "products" && (
              <div>
                {products.length === 0 ? (
                  <div className="text-center py-16 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl">
                    <Store className="w-12 h-12 text-zinc-400 mx-auto mb-3" />
                    <h3 className="text-lg font-bold">No Products Yet</h3>
                    <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">Start listing genuine border cross items or mobile gadgets in the store catalog.</p>
                    <Button onClick={() => setIsProductModalOpen(true)} className="mt-4 bg-zinc-900 text-white rounded-xl text-xs font-semibold">
                      Add Your First Product
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.map((p) => (
                      <div key={p.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between">
                        <div>
                          <div className="h-44 bg-zinc-100 dark:bg-zinc-800 relative">
                            {p.image ? (
                              <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-zinc-400">No Image</div>
                            )}
                            {p.isOffer && (
                              <span className="absolute top-3 left-3 bg-red-500 text-white text-[9px] uppercase font-black px-2 py-0.5 rounded-full shadow-sm">
                                Offer
                              </span>
                            )}
                            {p.isSold && (
                              <span className="absolute top-3 right-3 bg-red-600 text-white text-[9px] uppercase font-black px-2 py-0.5 rounded-full shadow-sm">
                                Sold Out
                              </span>
                            )}
                          </div>
                          <div className="p-4 space-y-2">
                            <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest block">{p.category}</span>
                            <h4 className="font-bold text-zinc-950 dark:text-zinc-50 text-base line-clamp-1">{p.name}</h4>
                            <div className="flex items-baseline gap-2">
                              <span className="font-black text-zinc-900 dark:text-white">৳{p.isOffer ? p.offerPrice : p.price}</span>
                              {p.isOffer && (
                                <span className="text-xs text-zinc-400 line-through">৳{p.price}</span>
                              )}
                            </div>
                            <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">{p.description}</p>
                          </div>
                        </div>
                        <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-between gap-2">
                          <span className="text-[10px] font-bold text-zinc-400 self-center">Stock: {p.stock}</span>
                          <div className="flex gap-1 items-center">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => toggleProductSoldStatus(p)} 
                              className={`text-[9px] h-7 px-2 font-bold rounded-lg transition-all ${p.isSold ? "bg-rose-50 hover:bg-rose-100 text-rose-600 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900" : "bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-350 dark:border-zinc-700"}`}
                            >
                              {p.isSold ? "Mark Available" : "Mark Sold"}
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleEditProduct(p)} className="p-2 h-8 w-8 text-zinc-500 hover:text-zinc-900">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleDeleteProduct(p.id)} className="p-2 h-8 w-8 text-rose-500 hover:text-rose-700">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Stories Tab */}
            {activeTab === "stories" && (
              <div>
                {stories.length === 0 ? (
                  <div className="text-center py-16 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl">
                    <Camera className="w-12 h-12 text-zinc-400 mx-auto mb-3" />
                    <h3 className="text-lg font-bold">No Stories Posted</h3>
                    <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">Publish video/photo stories showing real border cross products, or product demonstrations to drive customer interest.</p>
                    <Button onClick={() => setIsStoryModalOpen(true)} className="mt-4 bg-zinc-900 text-white rounded-xl text-xs font-semibold">
                      Post Your First Story
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {stories.map((story) => (
                      <div key={story.id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm relative group aspect-[9/16]">
                        {story.type === "image" ? (
                          <img src={story.mediaUrl} alt="story" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-black flex items-center justify-center relative">
                            <Film className="w-8 h-8 text-white/50" />
                            <span className="absolute bottom-3 left-3 text-[10px] bg-black/60 text-white px-2 py-0.5 rounded">Video</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-between text-white">
                          <span className="text-[9px] uppercase font-bold tracking-widest">{story.category}</span>
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] text-white/70">{new Date(story.createdAt).toLocaleDateString()}</span>
                            <button 
                              onClick={() => handleDeleteStory(story.id)}
                              className="p-1.5 bg-rose-600/90 rounded-full hover:bg-rose-700 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-white" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === "orders" && (
              <div className="space-y-4 max-w-4xl mx-auto">
                {orders.length === 0 ? (
                  <div className="text-center py-16 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl">
                    <ShoppingBag className="w-12 h-12 text-zinc-400 mx-auto mb-3" />
                    <h3 className="text-lg font-bold">No Customer Orders Yet</h3>
                    <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">When customers order your listed products, they will appear here with shipping details.</p>
                  </div>
                ) : (
                  orders.map((order) => (
                    <div
                      key={order.id}
                      className="flex flex-col rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm group hover:border-emerald-300 dark:hover:border-emerald-800 transition-colors overflow-hidden"
                    >
                      {/* Header / Clickable Area */}
                      <div 
                        className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 p-4 cursor-pointer"
                        onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                      >
                        <div className="flex items-start lg:items-center gap-4">
                          <div className="rounded-xl bg-emerald-50 dark:bg-zinc-800 p-3 text-emerald-600 dark:text-emerald-400 shrink-0">
                            <ShoppingBag className="text-xl w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                {order.customerName}
                              </span>
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${order.status === OrderStatus.DELIVERED ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"}`}
                              >
                                {order.status}
                              </span>
                            </div>
                            <div className="text-neutral-500 dark:text-neutral-400 text-xs font-medium flex gap-2 items-center flex-wrap mt-1">
                              <span>#{order.id.slice(0, 8)}</span>
                              <span>•</span>
                              <span>৳{order.total}</span>
                              <span>•</span>
                              <span>{order.contactNumber}</span>
                              <span>•</span>
                              <span>
                                {new Date(order.createdAt).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric"
                                })}
                              </span>
                            </div>
                            
                            <div className="mt-2 text-xs text-zinc-400 italic line-clamp-1">
                              {order.items?.map((i: any) => `${i.quantity}x ${i.name}`).join(', ')}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 pr-2" onClick={e => e.stopPropagation()}>
                          <div className="relative">
                            <select
                              className="appearance-none pl-3 pr-8 py-1.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold outline-none cursor-pointer rounded-lg transition-all"
                              value={order.status}
                              onChange={(e) =>
                                updateOrderStatus(order.id, e.target.value as OrderStatus)
                              }
                            >
                              {Object.values(OrderStatus).map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-xs text-zinc-400">▼</span>
                          </div>
                          <span className="text-zinc-400 ml-2 text-xs">{expandedOrderId === order.id ? "▲" : "▼"}</span>
                        </div>
                      </div>

                      {/* Expanded Content */}
                      <AnimatePresence>
                        {expandedOrderId === order.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="border-t border-zinc-100 dark:border-zinc-800"
                          >
                            <div className="p-4 bg-zinc-50 dark:bg-zinc-950/50 space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <h4 className="text-xs font-bold text-zinc-500 uppercase mb-2">Shipping Information</h4>
                                  <div className="text-sm bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-1">
                                    <p><span className="font-medium text-zinc-400">Name:</span> {order.customerName}</p>
                                    <p><span className="font-medium text-zinc-400">Phone:</span> {order.contactNumber}</p>
                                    <p><span className="font-medium text-zinc-400">Address:</span> {order.shippingAddress}</p>
                                    {order.altNumber && <p><span className="font-medium text-zinc-400">Alt Phone:</span> {order.altNumber}</p>}
                                    <p><span className="font-medium text-zinc-400">Payment:</span> {order.paymentMethod} ({order.paymentOption})</p>
                                    {order.transactionId && <p><span className="font-medium text-zinc-400">Transaction ID:</span> {order.transactionId}</p>}
                                  </div>
                                </div>
                                <div>
                                  <h4 className="text-xs font-bold text-zinc-500 uppercase mb-2">Order Items</h4>
                                  <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800">
                                    {order.items?.map((item: any, idx: number) => (
                                      <div key={idx} className="p-3 flex items-center gap-3 text-sm">
                                        <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded bg-cover bg-center" style={{ backgroundImage: `url(${item.image})`}}></div>
                                        <div className="flex-1">
                                          <div className="font-semibold">{item.name}</div>
                                          <div className="text-xs text-zinc-500 tracking-wide">
                                            {item.quantity} x ৳{item.priceAtPurchase || item.price}
                                          </div>
                                        </div>
                                        <div className="font-bold">৳{item.quantity * (item.priceAtPurchase || item.price)}</div>
                                      </div>
                                    ))}
                                    <div className="p-3 text-sm font-bold flex justify-between bg-zinc-50 dark:bg-zinc-900/50 rounded-b-xl">
                                      <span>Total (inc. shipping, less discount)</span>
                                      <span>৳{order.total}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Tracking ID details */}
                              <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800">
                                <h4 className="text-xs font-bold text-zinc-500 uppercase mb-2">Fulfillment Details</h4>
                                <div className="flex items-center gap-3 flex-wrap">
                                  <input
                                    type="text"
                                    placeholder="Enter courier/rider tracking ID..."
                                    className="px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg text-xs outline-none max-w-xs flex-1"
                                    defaultValue={order.trackingId || ""}
                                    onBlur={(e) => updateOrderTrackingId(order.id, e.target.value)}
                                  />
                                  <span className="text-[10px] text-zinc-400 font-medium">Type and click outside to sync tracking ID.</span>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === "settings" && (
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-3xl max-w-2xl mx-auto shadow-sm">
                <h3 className="text-lg font-black text-zinc-900 dark:text-white uppercase tracking-tight mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-[#EF8020]" /> Customize Store Profile
                </h3>
                <div className="space-y-5">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-500 uppercase">Shop Name</label>
                    <input 
                      type="text"
                      className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm outline-none focus:border-[#EF8020] transition dark:text-white"
                      placeholder="e.g. Trendy Gadget Store"
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-500 uppercase">Shop Logo/Avatar URL</label>
                    <div className="flex gap-3">
                      <input 
                        type="text"
                        className="flex-1 px-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm outline-none focus:border-[#EF8020] transition dark:text-white"
                        placeholder="Paste image URL or upload below..."
                        value={shopLogo}
                        onChange={(e) => setShopLogo(e.target.value)}
                      />
                      <input 
                        type="file" 
                        id="logo-upload" 
                        className="hidden" 
                        accept="image/*" 
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          notify("Uploading logo...", "info");
                          try {
                            const url = await uploadToImgbb(file);
                            setShopLogo(url);
                            notify("Logo uploaded successfully!", "success");
                          } catch (err) {
                            console.error(err);
                            notify("Logo upload failed.", "error");
                          }
                        }}
                      />
                      <label 
                        htmlFor="logo-upload"
                        className="px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 rounded-xl text-xs font-bold flex items-center justify-center cursor-pointer select-none border border-zinc-200 dark:border-zinc-700 dark:text-white"
                      >
                        Upload
                      </label>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-500 uppercase">TikTok ID (Optional)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-zinc-400 font-semibold">@</span>
                      <input 
                        type="text"
                        className="w-full pl-8 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm outline-none focus:border-[#EF8020] transition font-medium dark:text-white"
                        placeholder="tiktok.username"
                        value={tiktokId}
                        onChange={(e) => setTiktokId(e.target.value)}
                      />
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-0.5">Allow users to click straight to your TikTok videos from your store page.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-zinc-100 dark:border-zinc-800 pt-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#E2125B]" />
                        bKash Personal/Merchant Number
                      </label>
                      <input 
                        type="text"
                        className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm outline-none focus:border-[#E2125B] transition font-medium dark:text-white"
                        placeholder="e.g. 017XXXXXXXX"
                        value={bkashNumber}
                        onChange={(e) => setBkashNumber(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-[#F57C20]" />
                        Nagad Personal/Merchant Number
                      </label>
                      <input 
                        type="text"
                        className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm outline-none focus:border-[#F57C20] transition font-medium dark:text-white"
                        placeholder="e.g. 017XXXXXXXX"
                        value={nagadNumber}
                        onChange={(e) => setNagadNumber(e.target.value)}
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-0.5">Note: These numbers will be automatically presented to buyers as direct payment options during checkout.</p>

                  <div className="space-y-1 border-t border-zinc-100 dark:border-zinc-800 pt-4">
                    <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-[#EF8020]" />
                      Default Store-wide Advance Payment Amount (৳ - অগ্রিম বুকিং টাকা)
                    </label>
                    <input 
                      type="number"
                      className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm outline-none focus:border-[#EF8020] transition font-medium dark:text-white"
                      placeholder="e.g. 150"
                      value={defaultAdvanceAmount}
                      onChange={(e) => setDefaultAdvanceAmount(e.target.value)}
                    />
                    <p className="text-[10px] text-zinc-400 mt-0.5">
                      যদি কোনো নির্দিষ্ট পণ্যের জন্য আলাদা অগ্রিম টাকা সেট করা না থাকে, তবে ক্রেতাকে অর্ডার করার সময় এই পরিমাণ টাকা অগ্রিম বুকিং ফি হিসেবে দিতে হবে।
                    </p>
                  </div>

                  <div className="pt-2">
                    <Button 
                      onClick={saveStoreSettings}
                      disabled={isSavingSettings}
                      className="bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 w-full rounded-xl py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md hover:bg-zinc-800"
                    >
                      {isSavingSettings ? "Saving Settings..." : "Save Store Details"}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 1. Add/Edit Product Modal */}
      <AnimatePresence>
        {isProductModalOpen && (
          <div className="fixed inset-0 bg-black/60 z-[110] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                <h3 className="font-black text-xl text-zinc-900 dark:text-white uppercase tracking-tight">
                  {productEditingId ? "Edit Product" : "List New Product"}
                </h3>
                <button 
                  onClick={() => setIsProductModalOpen(false)}
                  className="w-8 h-8 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleProductSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
                <div className="space-y-1">
                  <Label>Product Name</Label>
                  <Input 
                    required
                    placeholder="e.g. iPhone 15 Pro Max Border Cross" 
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>Price (৳)</Label>
                    <Input 
                      required
                      type="number"
                      placeholder="e.g. 110000" 
                      value={productForm.price}
                      onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Stock Amount</Label>
                    <Input 
                      type="number"
                      placeholder="e.g. 10" 
                      value={productForm.stock}
                      onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label>Category</Label>
                  <select 
                    className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 p-3 rounded-lg text-sm"
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                  >
                    <option value="Border Cross Products">Border Cross Products</option>
                    <option value="Mobile">Genuine Mobiles</option>
                    <option value="Smart Watch">Smart Watch</option>
                    <option value="Earbuds">Earbuds</option>
                    <option value="Accessories">Accessories</option>
                  </select>
                </div>

                <div className="space-y-2 border border-zinc-100 dark:border-zinc-800 p-4 rounded-xl">
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox"
                      id="isOffer"
                      checked={productForm.isOffer}
                      onChange={(e) => setProductForm({ ...productForm, isOffer: e.target.checked })}
                      className="rounded text-emerald-500 border-zinc-300 focus:ring-emerald-400"
                    />
                    <Label htmlFor="isOffer" className="font-bold cursor-pointer">Active Offer Price?</Label>
                  </div>
                  {productForm.isOffer && (
                    <div className="pt-2">
                      <Label>Offer Price (৳)</Label>
                      <Input 
                        type="number"
                        placeholder="e.g. 98000" 
                        value={productForm.offerPrice}
                        onChange={(e) => setProductForm({ ...productForm, offerPrice: e.target.value })}
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <Label>Upload Product Image(s)</Label>
                  <Input 
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      setProductForm({ ...productForm, imageFiles: files });
                    }}
                  />
                  <p className="text-[10px] text-zinc-400">Upload high-quality images of the product. First image is display cover.</p>
                </div>

                <div className="space-y-1">
                  <Label>Product Description</Label>
                  <Textarea 
                    placeholder="Details about product warranty, border clearance status, box components etc."
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>3D Model Link (Optional)</Label>
                    <Input 
                      placeholder="Sketchfab URL" 
                      value={productForm.modelUrl}
                      onChange={(e) => setProductForm({ ...productForm, modelUrl: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Review Video Link (Optional)</Label>
                    <Input 
                      placeholder="YouTube URL" 
                      value={productForm.videoUrl}
                      onChange={(e) => setProductForm({ ...productForm, videoUrl: e.target.value })}
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  disabled={submitting}
                  className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-bold py-6 rounded-xl mt-4 flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : (productEditingId ? "Update Product" : "Publish Product")}
                </Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. Add Story Modal */}
      <AnimatePresence>
        {isStoryModalOpen && (
          <div className="fixed inset-0 bg-black/60 z-[110] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
                <h3 className="font-black text-xl text-zinc-900 dark:text-white uppercase tracking-tight">
                  Publish New Story
                </h3>
                <button 
                  onClick={() => setIsStoryModalOpen(false)}
                  className="w-8 h-8 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleStorySubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-2 bg-zinc-100 dark:bg-zinc-800 p-1.5 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setStoryForm({ ...storyForm, type: "image" })}
                    className={`py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${storyForm.type === "image" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500"}`}
                  >
                    <Camera className="w-3.5 h-3.5" /> Photo Story
                  </button>
                  <button
                    type="button"
                    onClick={() => setStoryForm({ ...storyForm, type: "video" })}
                    className={`py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${storyForm.type === "video" ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500"}`}
                  >
                    <Film className="w-3.5 h-3.5" /> Video Story
                  </button>
                </div>

                {storyForm.type === "image" ? (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <Label>Upload Image File</Label>
                      <Input 
                        type="file"
                        accept="image/*"
                        required
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          setStoryForm({ ...storyForm, mediaFile: file });
                        }}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Background Music Soundtrack</Label>
                      <select
                        className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 p-3 rounded-lg text-xs"
                        value={storyForm.songUrl}
                        onChange={(e) => setStoryForm({ ...storyForm, songUrl: e.target.value })}
                      >
                        {PRESET_SONGS.map((song) => (
                          <option key={song.name} value={song.url}>{song.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <Label>Video Streaming URL (MP4 / YouTube)</Label>
                    <Input 
                      required
                      placeholder="e.g. https://domain.com/video.mp4" 
                      value={storyForm.videoUrl}
                      onChange={(e) => setStoryForm({ ...storyForm, videoUrl: e.target.value })}
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <Label>Story Category Tag</Label>
                  <Input 
                    placeholder="e.g. New Arrival, Demonstration, Review" 
                    value={storyForm.category}
                    onChange={(e) => setStoryForm({ ...storyForm, category: e.target.value })}
                  />
                </div>

                <div className="space-y-1">
                  <Label>Swipe Up / Button Link (Optional)</Label>
                  <Input 
                    placeholder="e.g. /all-products or absolute link" 
                    value={storyForm.linkUrl}
                    onChange={(e) => setStoryForm({ ...storyForm, linkUrl: e.target.value })}
                  />
                </div>

                <Button 
                  type="submit" 
                  disabled={submitting}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-6 rounded-xl mt-4 flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Publish Story"}
                </Button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      
    </div>
  );
};

export default SellerDashboard;
