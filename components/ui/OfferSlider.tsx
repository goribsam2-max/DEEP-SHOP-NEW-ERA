import React, { useEffect, useCallback, useState } from "react";
import { ChevronLeft, ChevronRight, Star, Heart, ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Product } from "../../types";
import { useRegion } from "../RegionContext";
import { auth, db } from "../../firebase";
import { doc, onSnapshot, setDoc, deleteDoc } from "firebase/firestore";
import { useNotify } from "../Notifications";
import { cn } from "../../lib/utils";
import useEmblaCarousel from "embla-carousel-react";

function OfferProductCard({ product }: { product: Product }) {
  const navigate = useNavigate();
  const { formatPrice } = useRegion();
  const notify = useNotify();
  const [isWishlisted, setIsWishlisted] = useState(false);

  useEffect(() => {
    let unsubscribe = () => {};
    if (auth.currentUser && product.id) {
      const wishlistRef = doc(db, "users", auth.currentUser.uid, "wishlist", product.id);
      unsubscribe = onSnapshot(
        wishlistRef,
        (snap) => setIsWishlisted(snap.exists()),
        (err) => {}
      );
    }
    return () => unsubscribe();
  }, [product.id]);

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!auth.currentUser) {
      notify("Please sign in to add to wishlist", "error");
      return;
    }
    if (!product.id) return;

    const wishlistRef = doc(db, "users", auth.currentUser.uid, "wishlist", product.id);
    try {
      if (isWishlisted) {
        await deleteDoc(wishlistRef);
        notify("Removed from wishlist");
      } else {
        await setDoc(wishlistRef, {
          productId: product.id,
          addedAt: new Date().toISOString(),
        });
        notify("Added to wishlist", "success");
      }
    } catch (error) {
      console.error("Error toggling wishlist:", error);
    }
  };

  const addToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const cart = JSON.parse(localStorage.getItem("f_cart") || "[]");
    const existingIdx = cart.findIndex((i: any) => i.id === product.id);
    
    if (existingIdx > -1) {
       cart[existingIdx].quantity += 1;
    } else {
       cart.push({ ...product, quantity: 1, addedAt: Date.now() });
    }
    
    localStorage.setItem("f_cart", JSON.stringify(cart));
    notify("Added to cart successfully", "success");
    
    window.dispatchEvent(new CustomEvent('cartUpdated'));
  };

  const hasMultipleImages = product.images && product.images.length > 0;
  const imageUrl = hasMultipleImages ? product.images[0] : (product.image || "");
  const productSlug = product.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  return (
    <div
      className="pl-4 sm:pl-6 max-w-full flex-[0_0_220px] sm:flex-[0_0_250px] md:flex-[0_0_280px] cursor-pointer"
      onClick={() => navigate(`/product/${productSlug}/${product.id}`)}
    >
      <div className="relative h-[290px] sm:h-[320px] md:h-[350px] w-full overflow-hidden rounded-[15px] md:rounded-[15px] bg-zinc-100 dark:bg-zinc-800 shadow-lg border border-zinc-200/50 dark:border-zinc-800/50 group hover:-translate-y-1 transition-transform duration-300">
        <img
          src={imageUrl}
          alt={product.name}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          loading="lazy"
        />
        
        {/* Top Right Badge */}
        <div className="absolute top-3 right-3 z-10 bg-black/30 backdrop-blur-md border border-white/10 rounded-full px-3 py-1.5 flex items-center gap-1.5 text-white shadow-xl">
          <span className="text-xs font-semibold capitalize max-w-[80px] truncate">{product.category || "Offer"}</span>
          <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
          <span className="text-xs font-bold">{product.rating ? product.rating.toFixed(1) : "4.9"}</span>
        </div>

        {/* Bottom Pill Card */}
        <div className="absolute bottom-3 left-3 right-3 z-10 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-white/50 dark:border-zinc-800/50 rounded-[18px] p-2 flex flex-col shadow-[0_8px_30px_rgb(0,0,0,0.12)] gap-1">
          <span className="font-bold text-zinc-900 dark:text-zinc-100 text-[13px] sm:text-sm truncate px-1.5 pt-0.5">
            {product.name}
          </span>
          <div className="flex items-center justify-between px-1.5 pb-0.5">
            <div className="flex items-center gap-1.5">
                <span className="font-black text-[#ea580c] dark:text-[#ff8033] text-sm">
                  {formatPrice(product.offerPrice || product.price)}
                </span>
                {product.isOffer && product.offerPrice && (
                    <span className="font-bold text-zinc-400 dark:text-zinc-500 line-through text-[10px]">
                      {formatPrice(product.price)}
                    </span>
                )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button 
                  className={cn(
                    "w-7 h-7 rounded-full border bg-white dark:bg-zinc-900 flex items-center justify-center transition-all shadow-sm active:scale-95",
                    isWishlisted 
                      ? "text-red-500 border-red-500 bg-red-50 dark:bg-red-950/30" 
                      : "border-zinc-100 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-red-500 hover:border-red-100 dark:hover:border-red-900/50"
                  )}
                  onClick={toggleWishlist}
              >
                  <Heart className={cn("w-3.5 h-3.5", isWishlisted && "fill-current")} />
              </button>
              <button 
                  className="w-7 h-7 rounded-full border border-zinc-100 dark:border-zinc-800 bg-zinc-900 dark:bg-white flex items-center justify-center hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors shadow-sm active:scale-95 text-white dark:text-zinc-900"
                  onClick={addToCart}
              >
                  <ShoppingCart className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function OfferSlider({ products, autoSlide = true }: { products: Product[], autoSlide?: boolean }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    loop: true,
    dragFree: true,
  });

  useEffect(() => {
    if (!emblaApi || !autoSlide) return;
    const interval = setInterval(() => {
      emblaApi.scrollNext();
    }, 3000);
    return () => clearInterval(interval);
  }, [emblaApi, autoSlide]);

  const scrollTo = useCallback((direction: 'left' | 'right') => {
    if (emblaApi) {
      if (direction === 'left') emblaApi.scrollPrev();
      else emblaApi.scrollNext();
    }
  }, [emblaApi]);

  if (products.length === 0) return null;

  return (
    <div className="relative group/offer-slider overflow-hidden -mx-5 md:-mx-12 px-5 md:px-12 w-[calc(100%+40px)] md:w-[calc(100%+96px)]">
      <div className="absolute top-1/2 -translate-y-1/2 left-6 md:left-14 z-20 opacity-0 group-hover/offer-slider:opacity-100 transition-opacity duration-300 md:block hidden">
        <button
          onClick={() => scrollTo("left")}
          className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 shadow-lg flex items-center justify-center hover:bg-white transition-all active:scale-95 text-zinc-900 dark:text-zinc-100"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
        </button>
      </div>
      <div className="absolute top-1/2 -translate-y-1/2 right-6 md:right-14 z-20 opacity-0 group-hover/offer-slider:opacity-100 transition-opacity duration-300 md:block hidden">
        <button
          onClick={() => scrollTo("right")}
          className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 shadow-lg flex items-center justify-center hover:bg-white transition-all active:scale-95 text-zinc-900 dark:text-zinc-100"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
        </button>
      </div>

      <div className="overflow-hidden pb-8 pt-2" ref={emblaRef}>
        <div className="flex -ml-4 sm:-ml-6">
          {products.map((product) => (
            <OfferProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
}
