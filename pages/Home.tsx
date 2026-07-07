import { useRegion } from "@/components/RegionContext";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { StatusBadge } from "../components/ui/status-badge";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
} from "firebase/firestore";
import { db } from "../firebase";
import { Product } from "../types";
import { getReadableAddress } from "../services/location";
import { useNotify } from "../components/Notifications";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useSpring,
} from "framer-motion";
import Logo from "../components/Logo";
import Icon from "../components/Icon";
import SEO from "../components/SEO";
import { useTheme } from "../components/ThemeContext";
import { ProductSkeleton } from "../components/Skeletons";
import { CustomSectionEmbed } from "../components/CustomSectionEmbed";
import { FlashSaleCarousel } from "../components/ui/flash-sale-carousel";
import { VibeMascot, MascotState } from "../components/ui/VibeMascot";

import StoryViewer from "../components/ui/StoryViewer";
import { ProductCard } from "../components/ui/ProductCard";
import { OfferSlider } from "../components/ui/OfferSlider";
import { Tag, Zap, Crown, Users, Sparkles, Star, Play, MoreHorizontal, ChevronRight, ShoppingBag } from "lucide-react";
import { PixelImage } from "../components/ui/PixelImage";
import { HeroSlider } from "../components/ui/hero-slider";
import { LogoTimeline, type LogoItem } from "../components/ui/logo-timeline";
import { Footer } from "../components/Footer";

const BrandIcon = ({ brandName }: { brandName: string }) => {
  return (
    <img
      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(brandName)}&background=random&color=fff&rounded=true&font-size=0.4`}
      className="size-5"
      alt={brandName}
    />
  );
};

const ThinBanner = ({ banner, navigate }: { banner: any; navigate: any }) => {
  const [showAdLabel, setShowAdLabel] = useState(false);

  useEffect(() => {
    let timeout: any;
    if (showAdLabel) {
      timeout = setTimeout(() => setShowAdLabel(false), 3000);
    }
    return () => clearTimeout(timeout);
  }, [showAdLabel]);

  if (!banner) return null;

  return (
    <div
      className="relative overflow-hidden rounded-2xl cursor-pointer hover-tilt w-full mb-10 border border-zinc-100 dark:border-zinc-800 shadow-sm"
      onClick={() => banner.link && navigate(banner.link)}
    >
      <PixelImage src={banner.imageUrl} alt="banner" grid="8x3" />

      <div
        className="absolute top-3 right-3 z-20 flex items-center justify-end"
        onClick={(e) => {
          e.stopPropagation();
          setShowAdLabel(!showAdLabel);
        }}
      >
        <motion.div
          layout
          className="bg-zinc-900 dark:bg-white/60 backdrop-blur-md rounded-full flex items-center justify-center text-white overflow-hidden shadow-lg border border-white/20"
          initial={{ borderRadius: 999 }}
        >
          <AnimatePresence mode="wait">
            {showAdLabel ? (
              <motion.span
                key="text"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="pl-3 pr-4 py-1.5 text-[10px] font-bold  tracking-normal whitespace-nowrap"
              >
                Sponsored Ad
              </motion.span>
            ) : (
              <motion.div
                key="icon"
                className="w-8 h-8 flex items-center justify-center font-serif text-sm font-bold"
              >
                i
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

const Home: React.FC<{ userData?: any }> = ({ userData }) => {
  const { formatPrice } = useRegion();
  const isAdmin =
    userData?.role === "admin" || userData?.email === "admin@vibe.shop";
  const { isDark } = useTheme();
  const [products, setProducts] = useState<Product[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [activeBanner, setActiveBanner] = useState(0);
  const [activeCategoryBanner, setActiveCategoryBanner] = useState(0);
  const [activeBottomBanner, setActiveBottomBanner] = useState(0);
  const [activeCategory, setActiveCategory] = useState("All");
  const [displayedCount, setDisplayedCount] = useState(8);
  const [loadingMore, setLoadingMore] = useState(false);
  const [stories, setStories] = useState<any[]>([]);
  const [sellers, setSellers] = useState<any[]>([]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => activeCategory === "All" || p.category === activeCategory);
  }, [products, activeCategory]);

  useEffect(() => {
    setDisplayedCount(8);
  }, [activeCategory]);

  const handleLoadMore = () => {
    setLoadingMore(true);
    setTimeout(() => {
      setDisplayedCount(prev => prev + 8);
      setLoadingMore(false);
    }, 800);
  };

  const heroBanners = banners.filter(
    (b) => !b.bannerType || b.bannerType === "hero",
  );
  const gifBanners = banners.filter((b) => b.bannerType === "gif");
  const categoryBanners = banners.filter(
    (b) => b.bannerType === "category" || b.bannerType === "profile",
  );
  const bottomBanners = banners.filter((b) => b.bannerType === "bottom");

  useEffect(() => {
    if (heroBanners.length <= 1) return;
    const timer = setInterval(() => {
      setActiveBanner((prev) => (prev + 1) % heroBanners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [heroBanners.length]);

  useEffect(() => {
    if (categoryBanners.length <= 1) return;
    const timer = setInterval(() => {
      setActiveCategoryBanner((prev) => (prev + 1) % categoryBanners.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [categoryBanners.length]);

  useEffect(() => {
    if (bottomBanners.length <= 1) return;
    const timer = setInterval(() => {
      setActiveBottomBanner((prev) => (prev + 1) % bottomBanners.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [bottomBanners.length]);

  const [referState, setReferState] = useState<string>("refer-idle");

  useEffect(() => {
    const qProds = query(collection(db, "products"));
    const unsubscribeProds = onSnapshot(
      qProds,
      (snapshot) => {
        setProducts(
          snapshot.docs.map(
            (doc) => ({ id: doc.id, ...doc.data() }) as Product,
          ),
        );
      },
      (err) => {
        console.warn("Products fetch error:", err.message);
      },
    );

    const qBanners = query(
      collection(db, "banners"),
      orderBy("createdAt", "desc"),
    );
    const unsubscribeBanners = onSnapshot(
      qBanners,
      (snapshot) => {
        setBanners(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      },
    );

    const unsubscribeSettings = onSnapshot(
      doc(db, "settings", "platform"),
      (snap) => {
        if (snap.exists()) setSettings(snap.data());
      },
    );

    const unsubscribeStories = onSnapshot(collection(db, "stories"), (snap) => {
      setStories(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    const unsubscribeSellers = onSnapshot(collection(db, "users"), (snap) => {
      const list = snap.docs.map(doc => doc.data()).filter((u: any) => u.role === "seller");
      setSellers(list);
    });

    return () => {
      unsubscribeProds();
      unsubscribeBanners();
      unsubscribeSettings();
      unsubscribeStories();
      unsubscribeSellers();
    };
  }, []);

  const navigate = useNavigate();

  const brandLogos = useMemo(() => {
    const uniqueBrands = Array.from(
      new Set(products.map((p) => p.brand).filter(Boolean)),
    ) as string[];
    // Fill with default ones if there are no products holding brands
    const defaultBrands = [
      "Apple", "Samsung", "Sony", "Dji", "Bose", "Anker", "Logitech", "Xiaomi", "Oppo", "Vivo", "Realme", "OnePlus",
    ];
    const displayBrands =
      uniqueBrands.length >= 6
        ? uniqueBrands
        : Array.from(new Set([...uniqueBrands, ...defaultBrands]));

    const numRows = 3;
    const itemsPerRow = Math.ceil(displayBrands.length / numRows);

    return displayBrands.map((brand, idx) => {
      const rowNum = (idx % numRows) + 1;
      const rowIndex = Math.floor(idx / numRows);

      return {
        label: brand,
        icon: <BrandIcon brandName={brand} />,
        row: rowNum,
        animationDelay: -(rowIndex * (50 / itemsPerRow)),
        animationDuration: 50,
      } as LogoItem;
    });
  }, [products]);

  const sellerLogos = useMemo(() => {
    // Premium Bangladeshi tech stores as beautiful fallbacks/complements
    const defaultSellers = [
      { shopName: "Vibe Gadget Feni", displayName: "Feni Branch", photoURL: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150" },
      { shopName: "Dhaka Smart Hub", displayName: "Dhaka Central", photoURL: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150" },
      { shopName: "Chittagong Gear", displayName: "Port City Smart", photoURL: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150" },
      { shopName: "Sylhet Gadget Zone", displayName: "Sylhet Plaza", photoURL: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150" },
      { shopName: "Comilla Tech Store", displayName: "Comilla City", photoURL: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150" },
      { shopName: "Rajshahi Smart Gallery", displayName: "Rajshahi Market", photoURL: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150" },
      { shopName: "Barisal Gadget World", displayName: "Barisal Plaza", photoURL: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150" },
    ];

    const combinedSellers = [...sellers];
    
    // Add defaults to enrich the marquee
    defaultSellers.forEach(ds => {
      if (!combinedSellers.some(s => (s.shopName && s.shopName.toLowerCase() === ds.shopName.toLowerCase()) || (s.displayName && s.displayName.toLowerCase() === ds.displayName.toLowerCase()))) {
        combinedSellers.push(ds);
      }
    });

    const numRows = 2; // Two sleek scrolling rows of top sellers
    const itemsPerRow = Math.ceil(combinedSellers.length / numRows);

    return combinedSellers.map((seller, idx) => {
      const rowNum = (idx % numRows) + 1;
      const rowIndex = Math.floor(idx / numRows);
      const name = seller.shopName || seller.displayName || "Premium Seller";
      const avatarUrl = seller.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=10b981&color=fff&rounded=true&font-size=0.4`;

      return {
        label: name,
        icon: (
          <img
            src={avatarUrl}
            className="w-7 h-7 rounded-full object-cover border border-emerald-500/20 shadow-sm shrink-0 bg-zinc-100"
            alt={name}
            referrerPolicy="no-referrer"
          />
        ),
        row: rowNum,
        animationDelay: -(rowIndex * (40 / itemsPerRow)),
        animationDuration: 30, // medium elegant looping speed
      } as LogoItem;
    });
  }, [sellers]);

  // Helper for Section Headers
  const SectionHeader = ({ title }: { title: string }) => (
    <div className="flex justify-between items-center mb-4 pt-4">
      <h2
        className="text-[20px] font-bold text-zinc-900 dark:text-zinc-100 tracking-tight"
        style={{ fontFamily: "'Comfortaa', cursive", letterSpacing: "-0.02em" }}
      >
        {title}
      </h2>
    </div>
  );

  return (
    <div className="relative pt-4 px-5 md:px-12 bg-white dark:bg-[#121212] w-full min-h-screen font-sans pb-0">
      <div className="max-w-[1440px] mx-auto">
      <SEO
        title="DEEP SHOP | Border Cross Products & Genuine Mobiles Bangladesh"
        description="DEEP SHOP is Bangladesh's trusted platform for Border Cross Products & genuine mobiles. Find 100% authentic and trusted global tech products."
        canonical="/"
      />
      
      <CustomSectionEmbed location="home_top" />

      {/* Stories Section */}
      <div id="home-stories" className="mb-4 w-full">
        <SectionHeader title="Top Stories" />
        <StoryViewer stories={stories} isAdmin={isAdmin} />
      </div>

      {/* Hero Slider */}
      {heroBanners.length > 0 && (
        <div className="mb-8 w-full animate-fade-in group">
          <SectionHeader title="Hot Deals" />
          <motion.div
            id="home-hero"
            className="relative w-full aspect-[16/9] sm:aspect-[21/9] rounded-[24px] overflow-hidden shadow-sm cursor-pointer"
            onClick={() => heroBanners[activeBanner]?.link && navigate(heroBanners[activeBanner].link)}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={activeBanner}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="absolute inset-0 bg-zinc-100 dark:bg-[#1e1e1e]"
              >
                <img
                  src={heroBanners[activeBanner]?.imageUrl}
                  className="w-full h-full object-cover"
                  alt={heroBanners[activeBanner]?.title || "Banner"}
                />
              </motion.div>
            </AnimatePresence>

            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent z-10 pointer-events-none" />

            <div className="absolute inset-x-0 bottom-0 p-5 z-20 flex justify-between items-end">
              <div className="flex flex-col text-white max-w-[70%]">
                <h3 className="font-semibold text-lg leading-tight mb-1 truncate">
                  {heroBanners[activeBanner]?.title || "Discover the best products"}
                </h3>
                <p className="text-xs font-medium text-white/80 shrink-0">
                  Exclusive collection
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-white text-zinc-900 flex items-center justify-center shadow-lg active:scale-95 transition-transform backdrop-blur-sm shrink-0">
                 <Icon name="arrow-right" className="text-sm" />
              </div>
            </div>

            {heroBanners.length > 1 && (
              <div className="absolute top-4 right-4 flex gap-1.5 z-20">
                {heroBanners.map((_, i) => (
                  <button
                    key={i}
                    onClick={(e) => { e.stopPropagation(); setActiveBanner(i); }}
                    className={`h-1.5 rounded-full transition-all duration-300 ${activeBanner === i ? "bg-white w-4" : "bg-white/40 w-1.5"}`}
                    aria-label={`Go to slide ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* Refer & Earn (Only if not logged in) */}
      {!userData && (
        <div
          className="mb-8 w-full animate-fade-in flex justify-center px-0 md:px-4"
          onMouseEnter={() => setReferState("refer-hover")}
          onMouseLeave={() => setReferState("refer-idle")}
        >
          <div
            onClick={() => {
              navigate("/auth-selector");
            }}
            className="bg-[#FF6611] rounded-[24px] shadow-sm px-6 py-5 relative overflow-hidden flex flex-row items-center justify-between cursor-pointer active:scale-[0.98] transition-transform text-white w-full max-w-none md:max-w-4xl mx-auto min-h-[100px]"
          >
            <div className="flex flex-col space-y-3 z-20 w-2/3">
              <h3 className="font-extrabold text-lg md:text-xl m-0 leading-tight drop-shadow-sm">
                Log in to refer & earn
              </h3>

              <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-md border border-white/20 w-fit px-3 py-1.5 rounded-full shadow-inner shrink-0">
                <span className="text-[12px] md:text-[14px] font-bold text-white tracking-tight">
                  Login to Earn up to {formatPrice(200)}
                </span>
              </div>
            </div>

            <div className="absolute right-0 bottom-[-20px] h-[140%] w-[120px] pointer-events-none drop-shadow-xl z-20 flex flex-col justify-end items-center">
              <div className="transform scale-[0.6] origin-bottom mb-[-10px] w-full flex justify-center">
                <VibeMascot state={referState as MascotState} />
              </div>
            </div>

            <div className="absolute right-[50px] top-1/2 -translate-y-1/2 rounded-full border border-white/10 w-24 h-24 pointer-events-none" />
            <div className="absolute right-[80px] top-1/2 -translate-y-1/2 rounded-full border border-white/10 w-16 h-16 pointer-events-none z-0" />
          </div>
        </div>
      )}

      {/* Auto Product Slider */}
      {products.length > 0 && (
        <div id="home-products" className="mb-10 w-full animate-fade-in">
          <SectionHeader title="Trending Products" />
          <HeroSlider
            autoSlideDelay={3000}
            pauseDurationAfterInteract={10000}
            cards={products.map((p) => ({
              id: p.id,
              title: p.name,
              description:
                p.description || "Discover authentic products at DEEP SHOP.",
              category: p.category,
              image: p.image,
              date:
                p.isOffer && p.offerPrice
                  ? formatPrice(p.offerPrice)
                  : formatPrice(p.price),
              actionText: "Buy Now",
            }))}
          />
        </div>
      )}
      
      {/* Offfer Products Slider */}
      {products.filter(p => p.isOffer).length > 0 && (
        <div className="mb-10 w-full animate-fade-in group px-0 md:px-0">
          <SectionHeader title="Special Offers" />
          <OfferSlider products={products.filter(p => p.isOffer)} autoSlide={true} />
        </div>
      )}

      {/* Categories (Single Line Scrollable) */}
      <div className="mb-8 w-full animate-stagger-3 relative z-10 pt-2">
        <SectionHeader title="Categories" />
        <div className="flex items-center gap-4 overflow-x-auto pt-2 pb-6 px-1 scrollbar-hide snap-x">
          {[
            "All",
            ...Array.from(
              new Set(products.map((p) => p.category).filter(Boolean)),
            ),
          ].map((cat, i) => {
            let imageUrl = `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(cat)}&backgroundColor=f88c49`;
            if (cat === "All") {
              imageUrl =
                "https://ui-avatars.com/api/?name=User&background=000&color=fff";
            } else {
              const firstProduct = products.find((p) => p.category === cat);
              if (
                firstProduct &&
                firstProduct.images &&
                firstProduct.images.length > 0
              ) {
                imageUrl = firstProduct.images[0];
              }
            }

            return (
              <div
                key={i}
                className="flex flex-col items-center gap-2 snap-center shrink-0"
                onClick={() => {
                  setActiveCategory(cat);
                  document
                    .getElementById("popular-products")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                <div
                  className={`w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center p-0.5 cursor-pointer transition-transform ${activeCategory === cat ? "bg-gradient-to-tr from-[#FFC27A] to-[#FF8C00] scale-110 shadow-md shadow-orange-500/20" : "bg-transparent border border-zinc-200 dark:border-zinc-800 hover:scale-105"}`}
                >
                  <img
                    src={imageUrl}
                    alt={cat}
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      e.currentTarget.src = `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(cat)}&backgroundColor=f88c49`;
                    }}
                    className="w-full h-full rounded-full object-cover border-[1.5px] border-white dark:border-[#121212]"
                  />
                </div>
                <span
                  className={`text-[11px] md:text-xs font-semibold ${activeCategory === cat ? "text-orange-600 dark:text-orange-400" : "text-zinc-600 dark:text-zinc-400"} text-center w-match truncate max-w-[80px]`}
                >
                  {cat}
                </span>
              </div>
            );
          })}
        </div>

        {/* Border Cross / Phones Section - Elegant Horizontal Scroll Carousel style */}
        {products.filter((p) =>
          ["phone", "mobile", "cross", "border"].some((word) =>
            p.category?.toLowerCase().includes(word),
          ),
        ).length > 0 && (
          <div className="mb-10 w-full animate-fade-in group">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse"></span>
                <h2
                  className="text-[20px] font-bold text-zinc-900 dark:text-zinc-100 tracking-tight"
                  style={{
                    fontFamily: "'Comfortaa', cursive",
                    letterSpacing: "-0.02em",
                  }}
                >
                  Border Cross Phones
                </h2>
              </div>
              <button
                onClick={() => navigate("/all-products")}
                className="text-xs font-bold text-orange-600 dark:text-orange-400 hover:underline"
              >
                See All
              </button>
            </div>
            
            {/* Horizontal Scroll Layout with beautiful scaling snap cards */}
            <div className="flex gap-4 overflow-x-auto pb-4 pt-1 px-1 scrollbar-hide snap-x">
              {products
                .filter((p) =>
                  ["phone", "mobile", "cross", "border"].some((word) =>
                    p.category?.toLowerCase().includes(word),
                  ),
                )
                .slice(0, 10)
                .map((product, index) => (
                  <div key={product.id} className="min-w-[220px] sm:min-w-[260px] snap-center transform hover:scale-[1.02] transition-all duration-300">
                    <ProductCard product={product} index={index} />
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Original Mobiles & Gear Section - Skinny List Style Layout ("chikon shape list") */}
        {products.filter((p) =>
          ["accessories", "cover", "charger", "cable", "phone", "mobile"].some((word) =>
            p.category?.toLowerCase().includes(word),
          ),
        ).length > 0 && (
          <div className="mb-10 w-full animate-fade-in group">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <h2
                  className="text-[20px] font-bold text-zinc-900 dark:text-zinc-100 tracking-tight"
                  style={{
                    fontFamily: "'Comfortaa', cursive",
                    letterSpacing: "-0.02em",
                  }}
                >
                  Original Mobiles & Gear
                </h2>
              </div>
              <button
                onClick={() => navigate("/all-products")}
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                See All
              </button>
            </div>

            {/* Chikon Skinny horizontal list rows */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {products
                .filter((p) =>
                  ["accessories", "cover", "charger", "cable", "phone", "mobile"].some((word) =>
                    p.category?.toLowerCase().includes(word),
                  ),
                )
                .slice(0, 6)
                .map((product) => {
                  const price = product.isOffer && product.offerPrice ? product.offerPrice : product.price;
                  return (
                    <div 
                      key={product.id}
                      onClick={() => navigate(`/product/${product.id}`)}
                      className="flex items-center gap-4 bg-zinc-50 dark:bg-[#1c1c1e] hover:bg-zinc-100 dark:hover:bg-[#252528] p-3 rounded-2xl cursor-pointer transition border border-zinc-100 dark:border-zinc-800/80 group/row shadow-sm"
                    >
                      {/* Left Square Pic */}
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shrink-0">
                        <img 
                          src={product.image} 
                          alt={product.name} 
                          className="w-full h-full object-cover group-hover/row:scale-105 transition-transform duration-300" 
                        />
                      </div>
                      
                      {/* Center Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-[14px] text-zinc-950 dark:text-zinc-50 truncate group-hover/row:text-emerald-500 transition-colors">
                          {product.name}
                        </h4>
                        <p className="text-[10px] text-zinc-400 font-semibold mb-1 truncate">
                          {product.brand || "Authentic Accessory"}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-black text-emerald-600 dark:text-emerald-400">
                            {formatPrice(price)}
                          </span>
                          {product.isOffer && product.price && (
                            <span className="text-[10px] text-zinc-400 line-through">
                              {formatPrice(product.price)}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right View Arrow */}
                      <div className="w-8 h-8 rounded-full bg-white dark:bg-zinc-800 group-hover/row:bg-emerald-500 group-hover/row:text-white flex items-center justify-center border border-zinc-200/50 dark:border-zinc-700/50 shrink-0 shadow-sm transition">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {gifBanners.length > 0 && (
          <ThinBanner banner={gifBanners[0]} navigate={navigate} />
        )}

        {/* Popular Product Section */}
        <div id="popular-products" className="mb-10 w-full animate-fade-in group">
          <div className="flex justify-between items-center mb-6">
            <h2
              className="text-[20px] font-bold text-zinc-900 dark:text-zinc-100 tracking-tight"
              style={{
                fontFamily: "'Comfortaa', cursive",
                letterSpacing: "-0.02em",
              }}
            >
              Popular Products
            </h2>
            <button
              onClick={() => navigate("/all-products")}
              className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              See All
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 lg:gap-8 mb-6">
            {products.length === 0
              ? Array(4)
                  .fill(0)
                  .map((_, i) => <ProductSkeleton key={i} />)
              : filteredProducts
                  .slice(0, displayedCount)
                  .map((product, index) => (
                    <ProductCard key={product.id} product={product} index={index} />
                  ))}
          </div>
          
          {filteredProducts.length > displayedCount && (
            <div className="flex justify-center w-full">
               <button 
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="bg-black dark:bg-white text-white dark:text-black font-bold py-3 px-8 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center min-w-[150px]"
               >
                 {loadingMore ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      className="w-5 h-5 border-2 border-white/30 dark:border-black/30 border-t-white dark:border-t-black rounded-full"
                    />
                 ) : (
                    "Load More"
                 )}
               </button>
            </div>
          )}
        </div>
      </div>

      {gifBanners.length > 1 && (
        <ThinBanner banner={gifBanners[1]} navigate={navigate} />
      )}

      {sellerLogos.length > 0 && (
        <LogoTimeline
          items={sellerLogos}
          title="Top Sellers"
          height="h-[250px] md:h-[300px]"
          iconSize={24}
        />
      )}

      {gifBanners.length > 2 && (
        <ThinBanner banner={gifBanners[2]} navigate={navigate} />
      )}
      {gifBanners.length > 3 && (
        <ThinBanner banner={gifBanners[3]} navigate={navigate} />
      )}

      {categoryBanners.length > 0 && (
        <div className="mb-4 w-full animate-fade-in group px-0">
          <div
            className="rounded-[24px] overflow-hidden shadow-sm aspect-[21/9] relative group cursor-pointer"
            onClick={() =>
              navigate(
                categoryBanners[activeCategoryBanner]?.link || "/all-products",
              )
            }
          >
            <div
              className="flex transition-transform duration-700 ease-[cubic-bezier(0.23, 1, 0.32, 1)] h-full"
              style={{
                transform: `translateX(-${activeCategoryBanner * 100}%)`,
              }}
            >
              {categoryBanners.map((banner) => (
                <div key={banner.id} className="min-w-full h-full relative">
                  <img
                    src={banner.imageUrl}
                    alt="Banner"
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              ))}
            </div>
            {categoryBanners.length > 1 && (
              <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-md text-white text-[10px] font-semibold z-10">
                {activeCategoryBanner + 1} / {categoryBanners.length}
              </div>
            )}
          </div>
        </div>
      )}

      {bottomBanners.length > 0 && (
        <div className="mb-2 w-full animate-fade-in group px-0">
          <div
            className="rounded-[24px] overflow-hidden shadow-sm aspect-[21/9] relative group cursor-pointer"
            onClick={() =>
              navigate(
                bottomBanners[activeBottomBanner]?.link || "/all-products",
              )
            }
          >
            <div
              className="flex transition-transform duration-700 ease-[cubic-bezier(0.23, 1, 0.32, 1)] h-full"
              style={{ transform: `translateX(-${activeBottomBanner * 100}%)` }}
            >
              {bottomBanners.map((banner) => (
                <div key={banner.id} className="min-w-full h-full relative">
                  <img
                    src={banner.imageUrl}
                    alt="Banner"
                    className="w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              ))}
            </div>
            {bottomBanners.length > 1 && (
              <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-md text-white text-[10px] font-semibold z-10">
                {activeBottomBanner + 1} / {bottomBanners.length}
              </div>
            )}
          </div>
        </div>
      )}

      <CustomSectionEmbed location="home_bottom" />
      </div>
      <div className="w-full">
        <Footer />
      </div>
    </div>
  );
};

export default Home;
