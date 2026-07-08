import { formatPrice } from "@/lib/utils";
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Product } from "../../types";
import { Heart, ShoppingBag, Star } from "lucide-react";
import { auth, db } from "../../firebase";
import { doc, setDoc, deleteDoc, onSnapshot } from "firebase/firestore";
import { PixelImage } from "./PixelImage";
import { getProductCoinReward } from "../../lib/coinRewards";
import { triggerHaptic } from "../../lib/haptics";

export const ProductCard = ({ product, index }: { product: Product, index?: number }) => {
  const navigate = useNavigate();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const getActualCoinReward = (p: any): number => {
    if (p.coinReward !== undefined && p.coinReward !== null && String(p.coinReward).trim() !== "") {
      return Number(p.coinReward);
    }
    return getProductCoinReward(p.id);
  };
  const actualReward = getActualCoinReward(product);
  const hasDiscount =
    product.isOffer && product.offerPrice && product.offerPrice < product.price;

  const displayPrice =
    product.isOffer && product.offerPrice ? product.offerPrice : product.price;
    
  const discountPercentage = hasDiscount && product.price > 0
    ? Math.round(((product.price - displayPrice!) / product.price) * 100)
    : 0;
    
  const productSlug = product.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  // Determine if it should span two columns on mobile
  const isLarge = index !== undefined && index % 3 === 2;
  const baseCardClasses = isLarge ? "col-span-2 md:col-span-1 w-full group relative" : "col-span-1 w-full group relative";

  useEffect(() => {
    let unsubscribe = () => {};
    if (auth.currentUser && product.id) {
      const wishlistRef = doc(
        db,
        "users",
        auth.currentUser.uid,
        "wishlist",
        product.id,
      );
      unsubscribe = onSnapshot(
        wishlistRef,
        (snap) => {
          setIsWishlisted(snap.exists());
        },
        (err) => {
          // silently ignore snapshot errors
        },
      );
    }
    return () => unsubscribe();
  }, [product.id]);

  const handleAdd = (e: React.MouseEvent) => {
    triggerHaptic();
    e.preventDefault();
    e.stopPropagation();
    navigate(`/product/${productSlug}/${product.id}`);
  };

  const toggleWishlist = async (e: React.MouseEvent) => {
    triggerHaptic();
    e.preventDefault();
    e.stopPropagation();

    if (!auth.currentUser) return;
    if (!product.id) return;

    const wishlistRef = doc(
      db,
      "users",
      auth.currentUser.uid,
      "wishlist",
      product.id,
    );
    try {
      if (isWishlisted) {
        await deleteDoc(wishlistRef);
      } else {
        await setDoc(wishlistRef, {
          productId: product.id,
          addedAt: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error("Error toggling wishlist:", error);
    }
  };

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }}
      className={baseCardClasses}
    >
      <Link
        to={`/product/${productSlug}/${product.id}`}
        title={product.name}
        className={`flex ${isLarge ? "flex-row md:flex-col" : "flex-col"} h-full bg-white dark:bg-zinc-900 overflow-hidden group relative rounded-[15px] shadow-sm border border-zinc-100 dark:border-zinc-800`}
      >
        {/* Image Container */}
        <div className={`relative ${isLarge ? "w-[45%] md:w-full" : "w-full"} shrink-0 ${isLarge ? "min-h-[140px] md:h-44 sm:h-52" : "h-44 sm:h-52"} overflow-hidden bg-white dark:bg-zinc-800 flex items-center justify-center isolation-auto border-r border-zinc-100 dark:border-zinc-800 md:border-r-0`}>
          <PixelImage
            src={product.image}
            alt={product.name}
            className="w-full h-full z-10"
            imgClassName={`group-hover:scale-105 transition-transform duration-500 object-contain p-3 rounded-[15px]`}
          />

          {/* Top Left/Right Discount Badge */}
          {hasDiscount && discountPercentage > 0 && (
            <div className="absolute top-2.5 right-2.5 sm:right-auto sm:left-2.5 bg-[#1cdb5e] rounded-full px-2 py-1 z-10 shadow-sm flex items-center justify-center">
              <span className="text-[10px] sm:text-xs font-bold text-white leading-none">-{discountPercentage}%</span>
            </div>
          )}

          {/* Top Right Heart Outline (Only when large we might want it differently, but keep it here) */}
          <button
            onClick={toggleWishlist}
            className="absolute top-2.5 left-2.5 sm:left-auto sm:right-2.5 bg-white/70 backdrop-blur-sm dark:bg-zinc-900/70 rounded-full p-2 flex items-center justify-center transition-colors hover:bg-orange-50 dark:hover:bg-zinc-800 z-10 cursor-pointer shadow-sm"
          >
            <Heart
              className={`w-4 h-4 sm:w-5 sm:h-5 transition-colors ${isWishlisted ? "text-[#ea580c] fill-[#ea580c]" : "text-[#ea580c] fill-none"}`}
            />
          </button>

          {/* If NOT large, show the price cutout on the image */}
          {!isLarge && (
            <div className="absolute bottom-0 right-0 bg-white dark:bg-zinc-900 rounded-tl-[15px] pl-3 pt-2.5 pb-0 pr-0 flex items-center justify-center z-10">
              {/* DP Coin Badge */}
              {actualReward > 0 && (
                  <div className="absolute bottom-full right-2 mb-1 flex items-center bg-zinc-900/80 backdrop-blur-md rounded-full px-1.5 py-0.5">
                      <div className="h-3 w-3 flex items-center justify-center font-black text-[7px] text-amber-500 border border-amber-500 rounded-full mr-1 bg-white">D</div>
                      <span className="text-[9px] font-bold text-amber-400">+{actualReward}</span>
                  </div>
              )}
              {/* Inverted curves using SVG */}
              <svg
                className="absolute right-0 bottom-full w-4 h-4 text-white dark:text-zinc-900 translate-y-[0.5px]"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M24 24H0C13.2548 24 24 13.2548 24 0V24Z" />
              </svg>
              <svg
                className="absolute right-full bottom-0 w-4 h-4 text-white dark:text-zinc-900 translate-x-[0.5px]"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M24 24H0C13.2548 24 24 13.2548 24 0V24Z" />
              </svg>

              {/* Price Inner */}
              <div className="flex flex-row items-center justify-center min-w-min pl-1 pr-1.5 pb-1.5 pt-1 relative z-20 bg-white dark:bg-zinc-900 rounded-tl-[15px] max-w-[85%]">
                <div className="flex flex-row items-center justify-center gap-1.5 bg-[#1cdb5e] py-1 px-2.5 w-full rounded-full shadow-sm overflow-hidden">
                  <span className="text-[12px] sm:text-[13px] font-black text-white tracking-tight leading-none shrink-0 truncate">
                    {formatPrice(displayPrice)}
                  </span>
                  {hasDiscount && (
                    <span className="text-[9px] text-white/75 font-bold line-through leading-none shrink truncate">
                      {formatPrice(product.price)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Product Details */}
        <div className={`px-3 pt-3 pb-4 ${isLarge ? 'flex flex-col justify-center flex-grow' : ''}`}>
          <h3 className={`text-xs sm:text-sm font-bold text-zinc-900 dark:text-zinc-100 leading-snug line-clamp-2 ${isLarge ? 'text-sm md:text-sm' : ''}`}>
            {product.name}
          </h3>
          <div className="flex items-center gap-1 mt-1.5 mb-2">
            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
            <span className="text-[10px] sm:text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
              {product.rating ? product.rating.toFixed(1) : "4.9"}
            </span>
            <span className="text-[10px] sm:text-[11px] text-zinc-400 ml-1 truncate">
              • {product.category || "Border Cross Phone"}
            </span>
          </div>
          
          {/* If Large, show price here instead of cutout */}
          {isLarge && (
            <div className="flex flex-col items-start mt-2 max-w-full">
              <div className="flex flex-row items-center justify-start gap-1.5 bg-[#1cdb5e] py-1.5 px-3 rounded-full shadow-sm max-w-full overflow-hidden">
                <span className="text-[14px] md:text-[15px] font-black text-white tracking-tight leading-none shrink-0 truncate">
                  {formatPrice(displayPrice)}
                </span>
                {hasDiscount && (
                  <span className="text-[10px] text-white/75 font-bold line-through leading-none shrink truncate">
                    {formatPrice(product.price)}
                  </span>
                )}
              </div>
              {actualReward > 0 && (
                <div className="mt-2 flex items-center bg-zinc-900/80 dark:bg-zinc-100 backdrop-blur-md rounded-full px-2 py-0.5 self-start">
                  <div className="h-3 w-3 flex items-center justify-center font-black text-[7px] text-amber-500 border border-amber-500 rounded-full mr-1 bg-white">D</div>
                  <span className="text-[10px] font-bold text-amber-400 dark:text-amber-600">+{actualReward}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
};
