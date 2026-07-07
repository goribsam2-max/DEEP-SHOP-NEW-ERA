import { useRegion } from "@/components/RegionContext";
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useParams, useNavigate } from "react-router-dom";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  onSnapshot,
  deleteDoc,
  setDoc,
  getDocs,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import { Product, Review } from "../types";
import { useNotify, useConfirm } from "../components/Notifications";
import {
  motion,
  AnimatePresence,
  useScroll,
  useMotionValueEvent,
} from "framer-motion";
import Icon from "../components/Icon";
import { triggerHaptic } from "../lib/haptics";
import SEO from "../components/SEO";
import { PixelImage } from "../components/ui/PixelImage";
import { getProductCoinReward } from "../lib/coinRewards";
import { CustomSectionEmbed } from "../components/CustomSectionEmbed";
import { useTheme } from "../components/ThemeContext";
import { CommentReply } from "../components/ui/comment-reply";
import { ReviewComposer } from "../components/ui/review-composer";
import { SellerBadge, VerifiedIcon } from "../components/SellerBadge";
import { AlertCircle, MessageSquare } from "lucide-react";

import {
  ReviewFilterGroup,
  ReviewFilterItem,
} from "../components/ui/review-filter-bars";
import { ReviewCard } from "../components/ui/review-card";
import {
  ChevronRight,
  ChevronLeft,
  Star,
  Heart,
  Share2,
  ShoppingCart,
  Camera,
  Zap,
  CheckCircle2,
  Box,
  ShieldCheck,
  Bell,
  X,
  Trash2,
  Plus,
  Minus,
  Pen,
} from "lucide-react";
import { ImageLightbox } from "../components/ui/image-lightbox";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { StatusBadge } from "../components/ui/status-badge";
import { Tr } from "../components/Tr";
import { ProductCard } from "../components/ui/ProductCard";

const FlashSaleTimer = ({
  productId,
  reward,
}: {
  productId: string;
  reward: number;
}) => {
  // Generate a fixed end time for this product based on its ID for today
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [soldPercent, setSoldPercent] = useState(0);

  useEffect(() => {
    // Create a pseudo-random but consistent target end time for today based on productId
    // that reseths every 24 hours
    const now = new Date();
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    ).getTime();

    let hash = 0;
    for (let i = 0; i < productId.length; i++) {
      hash = (hash << 5) - hash + productId.charCodeAt(i);
      hash |= 0;
    }

    // Random duration between 12 and 24 hours
    const seed = Math.abs(hash) / 2147483647;
    const durationHours = 12 + seed * 12;
    let endTime = startOfDay + durationHours * 60 * 60 * 1000;

    // If it already ended today, it ends tomorrow
    if (endTime < now.getTime()) {
      endTime += 24 * 60 * 60 * 1000;
    }

    // Random sold percentage between 75% and 95%
    setSoldPercent(75 + seed * 20);

    const interval = setInterval(() => {
      const current = new Date().getTime();
      const distance = endTime - current;

      if (distance < 0) {
        // Time's up, wait for next tick to reset to next day
        clearInterval(interval);
        return;
      }

      setTimeLeft({
        hours: Math.floor(
          (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
        ),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [productId]);

  const formatNumber = (num: number) => num.toString().padStart(2, "0");

  return (
    <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl p-1 mb-4 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 right-10 bottom-0 w-20 bg-white/10 skew-x-12 translate-x-10 pointer-events-none" />
      <div className="border border-white/20 rounded-lg p-3 md:p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="bg-white text-emerald-600 font-bold px-2 py-0.5 rounded shadow-sm text-[10px] tracking-wider uppercase">
              Coin Reward
            </div>
            <span className="text-white font-black text-lg md:text-xl italic tracking-tighter shadow-sm flex items-center">
              <Zap className="w-4 h-4 fill-amber-300 text-amber-300 mr-1" />{" "}
              FLASH SALE
            </span>
          </div>
          <p className="text-white text-xs md:text-sm font-medium opacity-90">
            Purchase this now to earn{" "}
            <span className="font-bold underline decoration-wavy decoration-amber-300">
              +{reward} VG Coins
            </span>{" "}
            !
          </p>
        </div>

        <div className="flex flex-col items-start md:items-end gap-1">
          <span className="text-white text-[10px] font-bold uppercase tracking-wider">
            Ends in
          </span>
          <div className="flex items-center gap-1.5">
            <div className="bg-white text-emerald-600 font-black rounded shadow-md px-2 py-1 text-sm">
              {formatNumber(timeLeft.hours)}
            </div>
            <span className="text-white font-black">:</span>
            <div className="bg-white text-emerald-600 font-black rounded shadow-md px-2 py-1 text-sm">
              {formatNumber(timeLeft.minutes)}
            </div>
            <span className="text-white font-black">:</span>
            <div className="bg-white text-emerald-600 font-black rounded shadow-md px-2 py-1 text-sm bg-emerald-50 animate-pulse">
              {formatNumber(timeLeft.seconds)}
            </div>
          </div>
          <div className="w-full bg-white/30 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className="bg-amber-300 h-full rounded-full transition-all duration-1000"
              style={{ width: `${soldPercent}%` }}
            ></div>
          </div>
          <div className="text-white/80 text-[9px] text-right w-full mt-0.5">
            ALMOST SOLD OUT
          </div>
        </div>
      </div>
    </div>
  );
};
const ProductDetails: React.FC = () => {
  const { formatPrice } = useRegion();
  const { id, slug } = useParams();
  const { isDark, toggleTheme } = useTheme();
  const [product, setProduct] = useState<Product | null>(null);
  const [sellerInfo, setSellerInfo] = useState<any>(null);
  const [resolvedId, setResolvedId] = useState<string | null>(id || null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [activeImg, setActiveImg] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [bundleItems, setBundleItems] = useState<Product[]>([]);
  const [timeLeft, setTimeLeft] = useState<{
    d: number;
    h: number;
    m: number;
    s: number;
  } | null>(null);
  const [mysteryOffer, setMysteryOffer] = useState<{
    discountPrice: number;
    expiresAt: number;
    discountPct: number;
  } | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [affiliateCode, setAffiliateCode] = useState<string | null>(null);
  const [addingToCart, setAddingToCart] = useState(false);
  const [addingBundle, setAddingBundle] = useState(false);
  const [settings, setSettings] = useState<any>(null);
  const [notifying, setNotifying] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const [showSideCart, setShowSideCart] = useState(true);
  const [cartItems, setCartItems] = useState<any[]>([]);

  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem("f_cart") || "[]");
    setCartItems(cart);

    const handleStorage = () => {
      setCartItems(JSON.parse(localStorage.getItem("f_cart") || "[]"));
    };
    window.addEventListener("update_cart", handleStorage);
    return () => window.removeEventListener("update_cart", handleStorage);
  }, []);

  const notify = useNotify();
  const confirm = useConfirm();
  const navigate = useNavigate();

  const handleNotifyMe = async () => {
    if (!product) return;
    setNotifying(true);
    try {
      await setDoc(doc(collection(db, "restock_notifications")), {
        productId: product.id,
        productName: product.name,
        userEmail: auth.currentUser?.email || "guest",
        userId: auth.currentUser?.uid || "guest",
        createdAt: Date.now(),
      });
      notify("We'll notify you when it's back in stock!", "success");
    } catch (e) {
      notify("Could not set up notification.", "error");
    }
    setTimeout(() => setNotifying(false), 2000);
  };

  const toSlug = (name: string) =>
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        getDoc(doc(db, "users", user.uid)).then((d) => {
          if (d.exists()) {
            const data = d.data();
            if (data.isAffiliate && data.affiliateCode) {
              setAffiliateCode(data.affiliateCode);
            }
            if (
              data.role === "admin" ||
              data.role === "staff" ||
              user.email === "admin@vibe.shop" ||
              user.email === "vibegadgetfeni@gmail.com" ||
              user.email === "deepshop@gmail.com" ||
              user.email === "deepshopbysam@gmail.com"
            ) {
              setIsAdmin(true);
            }
          }
        });
      } else {
        setAffiliateCode(null);
        setIsAdmin(false);
      }
    });

    const unsubscribeSettings = onSnapshot(
      doc(db, "settings", "platform"),
      (snap) => {
        if (snap.exists()) setSettings(snap.data());
      },
    );

    return () => {
      unsubAuth();
      unsubscribeSettings();
    };
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    
    let unsubscribe: () => void;
    let didIncrement = false;
    
    if (id) {
      unsubscribe = onSnapshot(doc(db, "products", id), async (snap) => {
        if (snap.exists()) {
          const matchedProduct = { id: snap.id, ...snap.data() } as Product;
          setProduct(matchedProduct);
          setResolvedId(snap.id);
          if (!slug || slug !== toSlug(matchedProduct.name)) {
            window.history.replaceState(null, "", `/${toSlug(matchedProduct.name)}`);
          }
          if (!didIncrement) {
             didIncrement = true;
             try {
               const { increment, updateDoc } = await import("firebase/firestore");
               await updateDoc(doc(db, "products", snap.id), { views: increment(1) });
             } catch (e) {}
          }
        }
      });
    } else if (slug) {
      unsubscribe = onSnapshot(query(collection(db, "products")), async (snap) => {
        const allProducts = snap.docs.map(d => ({ id: d.id, ...d.data() }) as Product);
        const matchedProduct = allProducts.find(
          (p) => toSlug(p.name) === slug || p.name === decodeURIComponent(slug),
        );
        if (matchedProduct) {
          setProduct(matchedProduct);
          setResolvedId(matchedProduct.id);
          if (slug !== toSlug(matchedProduct.name)) {
            window.history.replaceState(null, "", `/${toSlug(matchedProduct.name)}`);
          }
          if (!didIncrement) {
              didIncrement = true;
              try {
                const { increment, updateDoc } = await import("firebase/firestore");
                await updateDoc(doc(db, "products", matchedProduct.id), { views: increment(1) });
              } catch (e) {}
          }
        } else {
          if (!id && slug) navigate("/");
        }
      });
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [id, slug]);

  useEffect(() => {
    if (product && product.sellerId) {
      getDoc(doc(db, "users", product.sellerId))
        .then((snap) => {
          if (snap.exists()) {
            setSellerInfo({ id: snap.id, ...snap.data() });
          } else {
            setSellerInfo(null);
          }
        })
        .catch((e) => {
          console.error("Error fetching seller info:", e);
          setSellerInfo(null);
        });
    } else {
      setSellerInfo(null);
    }
  }, [product]);

  useEffect(() => {
    if (!product) return;

    // Behavioral Targeting: Track browsed categories
    if (product.category) {
      try {
        const storedViews = localStorage.getItem("vibe_category_views");
        let views: Record<string, number> = {};
        if (storedViews) {
          views = JSON.parse(storedViews);
        }
        views[product.category] = (views[product.category] || 0) + 1;
        localStorage.setItem("vibe_category_views", JSON.stringify(views));

        // Find the category with maximum views
        let favorite = "";
        let maxViews = -1;
        for (const cat in views) {
          if (views[cat] > maxViews) {
            maxViews = views[cat];
            favorite = cat;
          }
        }
        if (favorite) {
          localStorage.setItem("vibe_favorite_category", favorite);
        }
      } catch (e) {}
    }
  }, [product, mysteryOffer]);

  useEffect(() => {
    if (resolvedId) {
      if (settings?.mysteryBoxActive === false) {
        if (mysteryOffer) setMysteryOffer(null);
      } else {
        try {
          const boxOffer = JSON.parse(
            localStorage.getItem("vibe_mystery_box") || "{}",
          );
          if (
            boxOffer.result === "win" &&
            !boxOffer.used &&
            boxOffer.productId === resolvedId &&
            boxOffer.expiresAt > Date.now()
          ) {
            setMysteryOffer({
              discountPrice: boxOffer.discountPrice,
              expiresAt: boxOffer.expiresAt,
              discountPct: boxOffer.discountPct,
            });
          }
        } catch (e) {}
      }

      const q = query(
        collection(db, "reviews"),
        where("productId", "==", resolvedId),
      );
      const unsubscribeReviews = onSnapshot(
        q,
        (snapshot) => {
          const reviewList = snapshot.docs.map(
            (doc) => ({ id: doc.id, ...doc.data() }) as Review,
          );
          reviewList.sort((a, b) => b.createdAt - a.createdAt);
          setReviews(reviewList);
        },
        (err) => console.warn("Reviews fetch error:", err.message),
      );

      let unsubscribeWishlist = () => {};
      if (auth.currentUser) {
        const wishlistRef = doc(
          db,
          "users",
          auth.currentUser.uid,
          "wishlist",
          resolvedId,
        );
        unsubscribeWishlist = onSnapshot(
          wishlistRef,
          (snap) => {
            setIsWishlisted(snap.exists());
          },
          (err) => console.warn("Wishlist fetch error:", err.message),
        );
      }

      return () => {
        unsubscribeReviews();
        unsubscribeWishlist();
      };
    }
  }, [resolvedId, auth.currentUser, settings?.mysteryBoxActive]);

  useEffect(() => {
    if (!product || !resolvedId) return;
    const productQ = query(
      collection(db, "products"),
      where("category", "==", product.category || ""),
    );
    const unsubscribeProducts = onSnapshot(productQ, (snap) => {
      const allProducts = snap.docs.map(
        (d) => ({ id: d.id, ...d.data() }) as Product,
      );
      let others = allProducts.filter((p) => p.id !== resolvedId);
      others = others.sort(() => 0.5 - Math.random());
      setBundleItems(others.slice(0, 4));
    });
    return () => unsubscribeProducts();
  }, [product?.category, resolvedId]);

  useEffect(() => {
    let interval: HTMLInputElement | null | number = null;

    const validateAndSetTime = (endTime: number) => {
      const now = Date.now();
      const distance = endTime - now;
      if (distance < 0) {
        setTimeLeft(null);
        if (mysteryOffer) setMysteryOffer(null); // Expire mystery offer
        clearInterval(interval as number);
      } else {
        setTimeLeft({
          d: Math.floor(distance / (1000 * 60 * 60 * 24)),
          h: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          m: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          s: Math.floor((distance % (1000 * 60)) / 1000),
        });
      }
    };

    if (mysteryOffer) {
      // Enforce Mystery Offer timer
      interval = window.setInterval(
        () => validateAndSetTime(mysteryOffer.expiresAt),
        1000,
      );
    } else if (product?.isOffer && product?.offerEndTime) {
      interval = window.setInterval(
        () => validateAndSetTime(product.offerEndTime!),
        1000,
      );
    }
    return () => {
      if (interval) clearInterval(interval as number);
    };
  }, [product, mysteryOffer]);

  const toggleWishlist = async () => {
    triggerHaptic();
    if (!auth.currentUser)
      return notify("Please sign in to save items", "info");
    if (!product || !resolvedId) return;

    const wishlistRef = doc(
      db,
      "users",
      auth.currentUser.uid,
      "wishlist",
      resolvedId,
    );
    try {
      if (isWishlisted) {
        await deleteDoc(wishlistRef);
        notify("Removed from wishlist.", "info");
      } else {
        await setDoc(wishlistRef, {
          productId: resolvedId,
          name: product.name,
          image: product.image || (product.images && product.images[0]) || "",
          price: product.price,
          rating: product.rating,
          addedAt: Date.now(),
        });
        notify("Added to wishlist!", "success");
      }
    } catch (e) {
      notify("Failed to update wishlist.", "error");
    }
  };

  const addToCart = (redirect = false) => {
    triggerHaptic();
    if (!product) return;
    if (!redirect) setAddingToCart(true);

    // We update local storage but do a small delay before navigating
    setTimeout(
      () => {
        let cart = JSON.parse(localStorage.getItem("f_cart") || "[]");
        if (redirect) {
          cart = []; // Clear other items for buy now
        }

        const existingIndex = cart.findIndex(
          (item: any) => item.id === product.id,
        );

        const offerPrice = mysteryOffer
          ? Number(mysteryOffer.discountPrice)
          : product.isOffer && product.offerPrice
            ? Number(product.offerPrice)
            : Number(product.price);

        if (existingIndex > -1) {
          cart[existingIndex].quantity += 1;
          cart[existingIndex].price = offerPrice; // Update to the correct price
        } else {
          cart.push({
            ...product,
            price: offerPrice,
            originalPrice: Number(product.price),
            quantity: 1,
            isMysteryOffer: !!mysteryOffer,
          });
        }

        localStorage.setItem("f_cart", JSON.stringify(cart));
        window.dispatchEvent(new Event("update_cart"));
        setShowSideCart(true);

        if (mysteryOffer) {
          try {
            const boxOffer = JSON.parse(
              localStorage.getItem("vibe_mystery_box") || "{}",
            );
            if (boxOffer.productId === product.id) {
              boxOffer.used = true;
              localStorage.setItem(
                "vibe_mystery_box",
                JSON.stringify(boxOffer),
              );
            }
          } catch (e) {}
        }

        if (redirect) {
          navigate("/checkout");
        } else {
          setAddingToCart(false);
          notify("Added to cart!", "success");
        }
      },
      redirect ? 0 : 200,
    );
  };

  const handleGroupBuy = () => {
    triggerHaptic();
    if (!product) return;
    
    let cart = [];
    try { cart = JSON.parse(localStorage.getItem('f_cart') || '[]'); } catch(e) {}
    
    const discountAmount = product.price * 0.02;
    const groupPrice = product.price - discountAmount;
    
    cart.push({
       ...product,
       price: groupPrice,
       quantity: 1,
       isGroupBuy: true
    });
    
    localStorage.setItem('f_cart', JSON.stringify(cart));
    window.dispatchEvent(new Event("storage"));
    notify('Group Buy complete! Item added to cart at discounted price.', 'success');
  };

  const changeImage = (index: number) => {
    setDirection(index > activeImg ? 1 : -1);
    setActiveImg(index);
  };

  const handleBundleAddToCart = () => {
    triggerHaptic();
    if (!product) return;
    setAddingBundle(true);

    setTimeout(() => {
      const itemsToAdd = [product, ...bundleItems];
      let cart: any[] = [];
      try {
        cart = JSON.parse(localStorage.getItem("f_cart") || "[]");
      } catch (e) {}

      itemsToAdd.forEach((item) => {
        const offerPrice =
          item.isOffer && item.offerPrice ? item.offerPrice : item.price;
        const existing = cart.find((c: any) => c.id === item.id);
        if (existing) {
          existing.quantity += 1;
        } else {
          cart.push({
            ...item,
            quantity: 1,
            originalPrice: item.price,
            price: offerPrice * 0.9,
          });
        }
      });
      localStorage.setItem("f_cart", JSON.stringify(cart));

      setTimeout(() => {
        setAddingBundle(false);
        navigate("/cart");
      }, 600);
    }, 200);
  };

  if (!product)
    return (
      <div className="h-screen flex items-center justify-center bg-zinc-50 dark:bg-[#121212]">
        <div className="w-8 h-8 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)] bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 animate-pulse mix-blend-screen" />
      </div>
    );

  const images =
    product.images && product.images.length > 0
      ? product.images
      : product.image
        ? [product.image]
        : ["https://placehold.co/600x600/png"];

  const basePrice = mysteryOffer
    ? mysteryOffer.discountPrice
    : product.isOffer && product.offerPrice
      ? product.offerPrice
      : product.price;

  const jsonLd = [
    {
      "@context": "https://schema.org/",
      "@type": "Product",
      name: product.name,
      image: images,
      description:
        product.description || `Buy ${product.name} at DEEP SHOP premium store.`,
      sku: product.id,
      offers: {
        "@type": "Offer",
        url: window.location.href,
        priceCurrency: "BDT",
        price: basePrice,
        availability:
          product.stock > 0
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
        itemCondition: "https://schema.org/NewCondition",
      },
      ...(product.rating && product.numReviews
        ? {
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: product.rating,
              reviewCount: product.numReviews,
            },
          }
        : {}),
      ...(reviews && reviews.length > 0
        ? {
            review: reviews.slice(0, 3).map((r) => ({
              "@type": "Review",
              "reviewRating": {
                "@type": "Rating",
                "ratingValue": r.rating,
                "bestRating": "5"
              },
              "author": {
                "@type": "Person",
                "name": r.userName || "Verified Buyer"
              },
              "reviewBody": r.comment
            }))
          }
        : {}),
      ...(product.videoUrl
        ? {
            subjectOf: {
              "@type": "VideoObject",
              "name": `${product.name} Video Review`,
              "description": `Video review and unboxing for ${product.name}`,
              "thumbnailUrl": product.images?.[0] || product.image,
              "uploadDate": new Date().toISOString(),
              "contentUrl": product.videoUrl
            }
          }
        : {})
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": window.location.origin,
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Products",
          "item": `${window.location.origin}/all-products`,
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": product.name,
          "item": window.location.href,
        },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": `Is the ${product.name} Authentic?`,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes, absolutely! We guarantee 100% authenticity for all our border cross phones, mobiles and accessories at DEEP SHOP."
          }
        },
        {
          "@type": "Question",
          "name": "What is the delivery time?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "We offer swift nationwide delivery within 1-3 business days inside Dhaka, and 3-5 days outside Dhaka."
          }
        }
      ]
    }
  ];

  return (
    <div className="w-full mx-auto min-h-screen bg-background text-foreground pb-32 overflow-x-hidden">
      <SEO
        title={product.name}
        description={product.description || `Buy ${product.name}`}
        image={product.image}
        jsonLd={jsonLd}
        price={basePrice}
        availability={product.stock > 0 ? "in stock" : "out of stock"}
        canonical={`/product/${product.id}`}
      />
      <div className="w-full max-w-7xl mx-auto p-4 md:p-8 animate-fade-in flex flex-col xl:flex-row gap-8 items-start">
        <article className="flex-1 min-w-0 flex flex-col w-full">
          {/* Breadcrumbs Navigation */}
          <nav
            aria-label="Breadcrumb"
            className="flex items-center text-sm text-zinc-500 dark:text-zinc-400 mb-6 whitespace-nowrap overflow-x-auto no-scrollbar"
          >
            <button
              onClick={() => navigate("/")}
              className="hover:text-zinc-900 dark:text-zinc-100 transition-colors"
            >
              Home
            </button>
            <ChevronRight className="h-4 w-4 mx-1 shrink-0" />
            <button
              onClick={() => navigate("/all-products")}
              className="hover:text-zinc-900 dark:text-zinc-100 transition-colors"
            >
              Products
            </button>
            <ChevronRight className="h-4 w-4 mx-1 shrink-0" />
            <span className="text-zinc-900 dark:text-zinc-100 font-medium truncate">
              {product.name}
            </span>
          </nav>

          {isAdmin && (
            <div className="bg-amber-500/10 border border-amber-500/25 text-amber-800 dark:text-amber-200 p-4 rounded-2xl mb-6 flex flex-wrap gap-4 items-center justify-between">
              <div className="flex items-center gap-2 font-semibold text-xs uppercase tracking-wider">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shrink-0"></span>
                <span>Admin Settings</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate(`/admin/products/edit/${resolvedId}`)}
                  className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors shadow flex items-center gap-1.5"
                >
                  <Pen className="w-3.5 h-3.5" />
                  <span>Edit Post</span>
                </button>
                <button
                  onClick={() => {
                    confirm({
                      title: "Delete Product Post?",
                      message: "Are you sure you want to permanently delete this product post? This action cannot be undone.",
                      onConfirm: async () => {
                        const { deleteDoc, doc } = await import("firebase/firestore");
                        await deleteDoc(doc(db, "products", resolvedId!));
                        notify("Product post removed successfully.", "info");
                        navigate("/all-products");
                      }
                    });
                  }}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors shadow flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Post</span>
                </button>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center mb-6">
            <div /> {/* Spacer */}
            <div className="flex items-center gap-2 relative z-20">
              <Button
                onClick={() => {
                  if (navigator.share) {
                    navigator
                      .share({ title: product.name, url: window.location.href })
                      .catch(() => {});
                  } else {
                    navigator.clipboard.writeText(window.location.href);
                    notify("Link copied!", "success");
                  }
                }}
                variant="ghost"
                size="icon"
              >
                <Share2 className="h-5 w-5" />
                <span className="sr-only">Share</span>
              </Button>
            </div>
          </div>

          {/* Main content grid */}
          <main className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
            {/* Image Gallery Section */}
            <div className="flex flex-col gap-4">
              <div className="relative aspect-square md:aspect-[4/5] w-full rounded-[32px] overflow-hidden bg-[#f5f5f5] dark:bg-zinc-800/80">
                <AnimatePresence mode="popLayout" custom={direction}>
                  <motion.div
                    key={activeImg}
                    initial={{ opacity: 0, x: direction > 0 ? 50 : -50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: direction < 0 ? 50 : -50 }}
                    transition={{ duration: 0.3 }}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={1}
                    onDragEnd={(e, { offset, velocity }) => {
                      const swipe = Math.abs(offset.x) * velocity.x;
                      if (swipe < -10000) {
                        changeImage(activeImg === images.length - 1 ? 0 : activeImg + 1);
                      } else if (swipe > 10000) {
                        changeImage(activeImg === 0 ? images.length - 1 : activeImg - 1);
                      }
                    }}
                    className="absolute inset-0 w-full h-full flex items-center justify-center cursor-zoom-in group"
                    onClick={() => setIsLightboxOpen(true)}
                  >
                    <PixelImage
                      src={images[activeImg]}
                      alt={`${product.name} image ${activeImg + 1}`}
                      imgClassName={`object-contain mix-blend-multiply dark:mix-blend-normal group-hover:scale-105 transition-transform duration-700 ${product.stock <= 0 ? "grayscale opacity-75" : ""}`}
                    />

                    {/* Top Right Heart Outline */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWishlist();
                      }}
                      className="absolute top-5 right-5 bg-white/70 backdrop-blur-md dark:bg-zinc-900/70 border border-white/20 dark:border-zinc-700/50 rounded-full p-3 flex items-center justify-center transition-colors hover:bg-orange-50 dark:hover:bg-zinc-800 z-10 cursor-pointer shadow-sm"
                    >
                      <Heart
                        className={`w-6 h-6 transition-colors ${isWishlisted ? "text-[#ea580c] fill-[#ea580c]" : "text-[#ea580c] fill-none"}`}
                      />
                    </button>

                    {/* Dynamic Price Corner Bottom Right */}
                    <div className="absolute bottom-0 right-0 bg-white dark:bg-zinc-950 rounded-tl-[32px] pl-6 pt-5 pb-4 pr-6 flex items-center justify-center min-w-[120px]">
                      {/* VG Coin Badge */}
                      {getProductCoinReward(product.id) > 0 && (
                        <div className="absolute bottom-full right-4 mb-2 flex items-center bg-zinc-900/80 backdrop-blur-md rounded-full px-2 py-1">
                          <div className="h-4 w-4 flex items-center justify-center font-black text-[9px] text-amber-500 border-2 border-amber-500 rounded-full mr-1.5 bg-white">
                            V
                          </div>
                          <span className="text-xs font-bold text-amber-400">
                            +{getProductCoinReward(product.id)}
                          </span>
                        </div>
                      )}
                      {/* Inverted curves using SVG */}
                      <svg
                        className="absolute right-0 bottom-full w-6 h-6 text-white dark:text-zinc-950 translate-y-[0.5px]"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M24 24H0C13.2548 24 24 13.2548 24 0V24Z" />
                      </svg>
                      <svg
                        className="absolute right-full bottom-0 w-6 h-6 text-white dark:text-zinc-950 translate-x-[0.5px]"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M24 24H0C13.2548 24 24 13.2548 24 0V24Z" />
                      </svg>

                      {/* Price Text directly on the cutout shape */}
                      <div className="flex items-center justify-center gap-2">
                        {product.isOffer && product.offerPrice ? (
                          <>
                            <span className="text-sm text-zinc-400 font-bold line-through">
                              {formatPrice(product.price)}
                            </span>
                            <span className="text-xl md:text-2xl font-black text-[#ea580c] tracking-tight">
                              {formatPrice(product.offerPrice)}
                            </span>
                          </>
                        ) : (
                          <span className="text-xl md:text-2xl font-black text-[#ea580c] tracking-tight">
                            {formatPrice(product.price)}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>

                {images.length > 1 && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        changeImage(activeImg === 0 ? images.length - 1 : activeImg - 1);
                      }}
                      className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/70 backdrop-blur-md dark:bg-zinc-900/70 border border-white/20 dark:border-zinc-700/50 hover:bg-white dark:hover:bg-zinc-800 transition-colors shadow-sm"
                    >
                      <ChevronLeft className="w-5 h-5 text-zinc-800 dark:text-zinc-200" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        changeImage(activeImg === images.length - 1 ? 0 : activeImg + 1);
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/70 backdrop-blur-md dark:bg-zinc-900/70 border border-white/20 dark:border-zinc-700/50 hover:bg-white dark:hover:bg-zinc-800 transition-colors shadow-sm"
                    >
                      <ChevronRight className="w-5 h-5 text-zinc-800 dark:text-zinc-200" />
                    </button>
                  </>
                )}

                {product.stock <= 0 && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
                    <div className="bg-zinc-900 text-white px-6 py-3 rounded-full border border-zinc-700 shadow-sm flex items-center space-x-2 animate-pulse">
                      <Icon name="clock" className="text-zinc-400" />
                      <span className="text-[10px] font-semibold tracking-normal whitespace-nowrap">
                        Restocking Soon
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {images.length > 1 && (
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    {images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => changeImage(index)}
                        className={`h-2 w-2 rounded-full transition-colors ${activeImg === index ? "bg-zinc-100 dark:bg-zinc-8000 w-4" : "bg-zinc-300 dark:bg-zinc-700 hover:bg-zinc-400 dark:hover:bg-zinc-500"}`}
                        aria-label={`View image ${index + 1}`}
                      />
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => setIsLightboxOpen(true)}
                  >
                    <Camera className="h-4 w-4" /> Full View
                  </Button>
                </div>
              )}
            </div>

            {/* Product Details Section */}
            <div className="flex flex-col">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2 text-zinc-900 dark:text-zinc-100">
                <Tr>{product.name}</Tr>
              </h1>

              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-4 w-4 ${star <= Math.round(product.rating || 0) ? "text-yellow-400 fill-yellow-400" : "text-zinc-300 dark:text-zinc-700"}`}
                    />
                  ))}
                  <span className="ml-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">
                    {(product.rating || 0).toFixed(1)} (
                    {product.numReviews || 0} <Tr>reviews</Tr>)
                  </span>
                </div>
              </div>

              <div className="mt-2 mb-6">
                {getProductCoinReward(product.id) > 0 && (
                  <FlashSaleTimer
                    productId={product.id}
                    reward={getProductCoinReward(product.id)}
                  />
                )}

                {mysteryOffer && (
                  <div className="flex justify-between items-center bg-zinc-900 border border-zinc-800 p-4 rounded-xl text-white">
                    <div>
                      <p className="text-xs font-semibold tracking-wide text-zinc-400 mb-1">
                        Mystery Box Offer active!
                      </p>
                      <div className="flex items-center gap-3">
                        <span className="text-4xl font-bold tracking-tighter text-zinc-700 dark:text-zinc-300">
                          {formatPrice(mysteryOffer.discountPrice.toLocaleString())}
                        </span>
                        <span className="text-sm line-through text-zinc-500 font-semibold">
                          {formatPrice(product.price.toLocaleString())}
                        </span>
                      </div>
                    </div>
                    <Icon
                      name="gift"
                      className="text-3xl text-zinc-700 dark:text-zinc-300 animate-pulse hidden sm:block"
                    />
                  </div>
                )}
              </div>

              {/* Tags/Badges based on product attributes */}
              <div className="flex flex-wrap gap-2 my-6">
                <StatusBadge leftIcon={CheckCircle2} leftLabel="Brand New" />
                {product.category && (
                  <StatusBadge leftIcon={Box} leftLabel={product.category} />
                )}
                <StatusBadge
                  leftIcon={ShieldCheck}
                  leftLabel="100% Authentic"
                />
                {((product as any).advanceAmount !== undefined && (product as any).advanceAmount !== null && (product as any).advanceAmount !== "") || (sellerInfo?.defaultAdvanceAmount !== undefined && sellerInfo?.defaultAdvanceAmount !== null && sellerInfo?.defaultAdvanceAmount !== "") ? (
                  <StatusBadge
                    leftIcon={ShieldCheck}
                    leftLabel={`৳${(product as any).advanceAmount !== undefined && (product as any).advanceAmount !== null && (product as any).advanceAmount !== "" ? (product as any).advanceAmount : sellerInfo?.defaultAdvanceAmount} Booking Fee`}
                    className="bg-amber-500/10 border-amber-500/20 text-[#EF8020] font-bold"
                  />
                ) : null}
              </div>

              {/* Description */}
              <section className="bg-white dark:bg-zinc-900/50 rounded-2xl p-5 md:p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm mt-2">
                <h2 className="text-sm font-bold mb-3 text-zinc-900 dark:text-zinc-100">
                  <Tr>Product Description</Tr>
                </h2>
                <div className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed whitespace-pre-wrap">
                  <Tr>
                    {product.description ||
                      "High-quality premium accessory designed for ultimate performance and style."}
                  </Tr>
                </div>
              </section>

              {/* Seller Information */}
              <div className="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-800">
                <div className="flex flex-row justify-between items-center p-3 sm:p-4 bg-white dark:bg-zinc-900/80 backdrop-blur-sm rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm gap-2">
                  <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                    <Avatar className="h-12 w-12 border-2 border-emerald-100 dark:border-emerald-900/50 bg-zinc-100 dark:bg-zinc-800 dark:bg-emerald-900/20 animate-none">
                      {sellerInfo?.photoURL ? (
                        <img src={sellerInfo.photoURL} alt={sellerInfo.shopName || "Seller"} className="w-full h-full object-cover rounded-full" />
                      ) : (
                        <AvatarFallback className="bg-zinc-200 dark:bg-zinc-700 text-zinc-950 dark:text-zinc-50 font-bold dark:bg-emerald-900/30 dark:text-zinc-700 dark:text-zinc-300">
                          {(sellerInfo?.shopName || sellerInfo?.displayName || "VG").slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                          {sellerInfo?.shopName || sellerInfo?.displayName || "Vibe Gadget"}
                        </p>
                        {sellerInfo ? (
                          sellerInfo.kycStatus === "verified" ? (
                            <VerifiedIcon className="w-4 h-4 text-emerald-500 shrink-0" />
                          ) : (
                            <div className="inline-flex items-center gap-1 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-[10px] font-bold px-1.5 py-0.5 rounded border border-rose-100 dark:border-rose-900/30">
                              <AlertCircle className="w-3 h-3" /> Not Verified
                            </div>
                          )
                        ) : (
                          // Default platform products are fully verified
                          <VerifiedIcon className="w-4 h-4 text-emerald-500 shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center space-x-1 mt-0.5">
                        <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                        <span className="text-xs font-medium text-zinc-500">
                          {sellerInfo ? "4.8 Store Rating" : "4.9 Seller Rating"}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-full w-9 h-9 flex items-center justify-center border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 shrink-0 shadow-sm"
                      onClick={() => {
                        const targetChatId = product?.sellerId || "system";
                        navigate(`/messages?chatId=${targetChatId}`);
                      }}
                    >
                      <MessageSquare className="w-4 h-4 text-[#EF8020]" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-zinc-800 dark:text-zinc-200 dark:text-zinc-300 text-xs font-bold"
                      onClick={() => {
                        const targetSellerId = product?.sellerId || "system";
                        navigate(`/store/${targetSellerId}`);
                      }}
                    >
                      Visit Store &rarr;
                    </Button>
                  </div>
                </div>
              </div>

              {/* FAQ Section */}
              <section className="mt-8 pt-6 border-t border-zinc-200 dark:border-zinc-800">
                <h2 className="text-lg font-bold mb-4 text-zinc-900 dark:text-zinc-100">
                  <Tr>Frequently Asked Questions</Tr>
                </h2>
                <div className="space-y-4">
                  <article className="bg-zinc-50 dark:bg-zinc-900/40 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800/60">
                    <h3 className="font-semibold text-sm text-zinc-800 dark:text-zinc-200 mb-1">
                      Is the {product.name} Authentic?
                    </h3>
                    <p className="text-xs md:text-sm text-zinc-600 dark:text-zinc-400">
                      Yes, absolutely! We guarantee 100% authenticity for all our border cross phones, mobiles and accessories at DEEP SHOP.
                    </p>
                  </article>
                  <article className="bg-zinc-50 dark:bg-zinc-900/40 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800/60">
                    <h3 className="font-semibold text-sm text-zinc-800 dark:text-zinc-200 mb-1">
                      What is the delivery time?
                    </h3>
                    <p className="text-xs md:text-sm text-zinc-600 dark:text-zinc-400">
                      We offer swift nationwide delivery within 1-3 business days inside Dhaka, and 3-5 days outside Dhaka.
                    </p>
                  </article>
                </div>
              </section>
            </div>
          </main>

          {/* Reviews Section */}
          <section className="mt-16 pt-8 border-t border-zinc-200 dark:border-zinc-800 pb-8">
            <div className="flex flex-col items-center justify-center mb-10 text-center">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                  <Tr>Customer Reviews</Tr>
                </h2>
                <p className="text-sm text-zinc-500 mt-1">
                  <Tr>Based on</Tr> {product.numReviews || reviews.length || 0}{" "}
                  <Tr>reviews</Tr>
                </p>
              </div>

              <div className="mt-6 flex flex-col md:flex-row items-center gap-6 w-full justify-center max-w-2xl mx-auto">
                {reviews.length > 0 && (
                  <div className="w-full sm:w-auto flex-1">
                    <ReviewFilterGroup defaultValue="all" className="w-full">
                      <ReviewFilterItem
                        value="5-stars"
                        stars={5}
                        count={
                          reviews.filter((r) => Math.round(r.rating) === 5)
                            .length
                        }
                        total={reviews.length}
                      />
                      <ReviewFilterItem
                        value="4-stars"
                        stars={4}
                        count={
                          reviews.filter((r) => Math.round(r.rating) === 4)
                            .length
                        }
                        total={reviews.length}
                      />
                      <ReviewFilterItem
                        value="3-stars"
                        stars={3}
                        count={
                          reviews.filter((r) => Math.round(r.rating) === 3)
                            .length
                        }
                        total={reviews.length}
                      />
                      <ReviewFilterItem
                        value="2-stars"
                        stars={2}
                        count={
                          reviews.filter((r) => Math.round(r.rating) === 2)
                            .length
                        }
                        total={reviews.length}
                      />
                      <ReviewFilterItem
                        value="1-star"
                        stars={1}
                        count={
                          reviews.filter((r) => Math.round(r.rating) === 1)
                            .length
                        }
                        total={reviews.length}
                      />
                    </ReviewFilterGroup>
                  </div>
                )}
                <div className="w-full sm:w-auto">
                  <ReviewComposer productId={product.id} product={product} />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {reviews.slice(0, 3).map((review) => (
                <ReviewCard
                  key={review.id}
                  name={review.userName}
                  handle={
                    review.userId === auth.currentUser?.uid
                      ? "You"
                      : "Verified Buyer"
                  }
                  review={review.comment}
                  rating={review.rating}
                  imageUrl={review.userPhoto}
                  createdAt={review.createdAt}
                  images={(review as any).images}
                />
              ))}
              {reviews.length > 3 && (
                <Button
                  onClick={() => navigate(`/product/${product.id}/reviews`)}
                  variant="outline"
                  className="w-full mt-2 rounded-full py-6 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm font-semibold text-zinc-900 dark:text-zinc-100 hover:scale-[1.02] transition-transform"
                >
                  <Tr>View All Reviews</Tr> ({reviews.length})
                </Button>
              )}
              {reviews.length === 0 && (
                <div className="py-12 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 text-center">
                  <p className="text-sm font-semibold text-zinc-500">
                    <Tr>No reviews yet. Be the first!</Tr>
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Related / Bundle section moved below Reviews */}
          {bundleItems.length > 0 && (
            <aside className="xl:hidden mt-16 pt-8 border-t border-zinc-200 dark:border-zinc-800">
              <div className="mb-6">
                <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                  <Tr>You May Like</Tr>
                </h2>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {bundleItems.map((item, index) => (
                  <ProductCard key={item.id} product={item} index={index} />
                ))}
              </div>
            </aside>
          )}

          {typeof product.videoUrl === "string" &&
            product.videoUrl.length > 0 && (
              <div className="mt-16 pt-8 border-t border-zinc-200 dark:border-zinc-800">
                <h2 className="text-2xl font-bold tracking-tight mb-6 text-zinc-900 dark:text-zinc-100">
                  Product Video
                </h2>
                <div className="rounded-3xl overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-lg bg-black relative aspect-video w-full">
                  <iframe
                    src={product.videoUrl
                      .replace("watch?v=", "embed/")
                      .replace("youtu.be/", "youtube.com/embed/")}
                    className="absolute inset-0 w-full h-full"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  ></iframe>
                </div>
              </div>
            )}
        </article>

        <aside className="hidden xl:block w-[350px] shrink-0 sticky top-24 h-max z-30">
          {showSideCart ? (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg flex items-center space-x-2 text-zinc-900 dark:text-zinc-100">
                  <ShoppingCart className="w-5 h-5" />
                  <span>Your Cart</span>
                </h3>
                <button
                  onClick={() => setShowSideCart(false)}
                  className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-zinc-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {cartItems.length === 0 ? (
                <div className="text-center py-10 flex flex-col items-center">
                  <ShoppingCart className="w-10 h-10 text-zinc-300 dark:text-zinc-700 mb-2" />
                  <p className="text-zinc-500 font-medium text-sm">
                    Your cart is empty.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 mb-4">
                  {cartItems.map((item, idx) => (
                    <div key={idx} className="flex gap-3">
                      <div className="w-16 h-16 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl flex items-center justify-center shrink-0 border border-zinc-100 dark:border-zinc-800 p-1">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm tracking-tight text-zinc-900 dark:text-zinc-100 line-clamp-2 leading-tight mb-1">
                          {item.name}
                        </h4>
                        <div className="flex justify-between items-end">
                          <span className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                            {formatPrice(item.price * item.quantity)}
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                const newItems = [...cartItems];
                                newItems[idx].quantity = Math.max(
                                  1,
                                  newItems[idx].quantity - 1,
                                );
                                setCartItems(newItems);
                                localStorage.setItem(
                                  "f_cart",
                                  JSON.stringify(newItems),
                                );
                                window.dispatchEvent(new Event("update_cart"));
                              }}
                              className="w-6 h-6 bg-zinc-100 dark:bg-zinc-800 rounded-md flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-sm font-bold">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => {
                                const newItems = [...cartItems];
                                newItems[idx].quantity += 1;
                                setCartItems(newItems);
                                localStorage.setItem(
                                  "f_cart",
                                  JSON.stringify(newItems),
                                );
                                window.dispatchEvent(new Event("update_cart"));
                              }}
                              className="w-6 h-6 bg-zinc-100 dark:bg-zinc-800 rounded-md flex items-center justify-center text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => {
                                const newItems = cartItems.filter(
                                  (_, i) => i !== idx,
                                );
                                setCartItems(newItems);
                                localStorage.setItem(
                                  "f_cart",
                                  JSON.stringify(newItems),
                                );
                                window.dispatchEvent(new Event("update_cart"));
                              }}
                              className="w-6 h-6 ml-1 text-zinc-400 hover:text-red-500 bg-zinc-50 dark:bg-zinc-800 rounded-md flex items-center justify-center transition-colors shrink-0"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {cartItems.length > 0 && (
                <div className="border-t border-zinc-100 dark:border-zinc-800 pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-zinc-500 font-medium text-sm">
                      Subtotal
                    </span>
                    <span className="font-bold text-zinc-900 dark:text-zinc-100">
                      {formatPrice(cartItems.reduce(
                        (acc, curr) => acc + curr.price * curr.quantity,
                        0,
                      ))}
                    </span>
                  </div>
                  <Button
                    onClick={() => navigate("/checkout")}
                    className="w-full rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-900 font-bold py-5"
                  >
                    Checkout Now
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm">
              <h3 className="font-bold text-lg mb-4 text-zinc-900 dark:text-zinc-100 tracking-tight">
                You May Like
              </h3>
              <div className="flex flex-col gap-4">
                {bundleItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-3 group cursor-pointer"
                    onClick={() => navigate(`/product/${item.id}`)}
                  >
                    <div className="w-20 h-20 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl flex items-center justify-center shrink-0 border border-zinc-100 dark:border-zinc-800 p-2 overflow-hidden">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal group-hover:scale-110 transition-transform"
                      />
                    </div>
                    <div className="flex-1 min-w-0 py-1">
                      <h4 className="font-bold text-[13px] tracking-tight text-zinc-900 dark:text-zinc-100 line-clamp-2 leading-snug mb-1 group-hover:text-orange-600 transition-colors">
                        {item.name}
                      </h4>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                          {item.isOffer && item.offerPrice ? (
                            <>{formatPrice(item.offerPrice)}</>
                          ) : (
                            <>{formatPrice(item.price)}</>
                          )}
                        </span>
                        {item.isOffer && item.offerPrice && (
                          <span className="text-zinc-400 line-through text-[11px] font-medium">
                            {formatPrice(item.price)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>

      <ImageLightbox
        images={images}
        initialIndex={activeImg}
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
      />
      <CustomSectionEmbed location="product_bottom" />

      {/* Fixed Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-[60] bg-white dark:bg-zinc-950 border-t border-zinc-100 dark:border-zinc-800 p-3 pb-[calc(12px+env(safe-area-inset-bottom))] shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)]">
        <div className="flex gap-3 max-w-7xl mx-auto w-full">
          {product.stock <= 0 ? (
            <Button
              size="lg"
              disabled
              className="flex-1 gap-2 rounded-2xl py-6 text-base bg-zinc-300 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-500 cursor-not-allowed"
            >
              <Icon name="times" className="text-lg" /> Out of Stock (স্টক নেই)
            </Button>
          ) : (
            <>
              <Button
                onClick={() => addToCart(false)}
                disabled={addingToCart}
                variant="outline"
                size="lg"
                className="flex-1 gap-2 rounded-2xl py-6 text-[15px] font-bold border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-sm transition-all active:scale-[0.98]"
              >
                {addingToCart ? (
                  <div className="w-5 h-5 border-2 border-zinc-900 dark:border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <ShoppingCart className="h-5 w-5" />
                )}
                Add to Cart
              </Button>
              <Button
                onClick={() => addToCart(true)}
                size="lg"
                className="flex-1 rounded-2xl py-6 text-[15px] font-bold shadow-lg shadow-[#1cdb5e]/20 bg-[#1cdb5e] hover:bg-[#17ba4f] text-white border-none transition-all active:scale-[0.98]"
              >
                Buy Now
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
