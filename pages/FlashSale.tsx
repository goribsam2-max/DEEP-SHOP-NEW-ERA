import React, { useState, useEffect } from "react";
import { collection, query, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { Product } from "../types";
import { ProductCard } from "../components/ui/ProductCard";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ProductSkeleton } from "../components/Skeletons";

export default function FlashSale() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const qProds = query(collection(db, "products"));
    const unsubscribeProds = onSnapshot(
      qProds,
      (snapshot) => {
        const prods = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as Product,
        );
        setProducts(prods.filter((p) => p.isOffer));
        setLoading(false);
      },
      (err) => {
        console.warn("Products fetch error:", err.message);
        setLoading(false);
      },
    );
    return () => unsubscribeProds();
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 pb-20">
      <div className="bg-[#ff0800] text-white pt-8 pb-12 px-4 rounded-b-[40px] relative overflow-hidden shadow-lg border-b border-red-500">
        <div className="absolute top-0 right-10 w-32 h-[200%] bg-yellow-400 rotate-[35deg] transform -translate-y-1/4 opacity-90 blur-[1px]"></div>
        <div className="absolute top-10 right-0 w-8 h-[200%] bg-white rotate-[35deg] transform -translate-y-1/4 opacity-60 blur-[1px]"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#ff0800] via-[#ff0800]/90 to-[#ff0800]/50 pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex items-center mb-6">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <span className="text-yellow-400 font-black text-3xl">⚡</span> 
              Flash Sale
            </h1>
          </div>
          <p className="text-white/90 text-sm md:text-base font-medium max-w-lg mb-2 leading-relaxed">
            Grab our exclusive limited-time deals before they run out! 
            Discounts on premium gadgets, accessories, and more.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-6 relative z-20">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
          {loading ? (
            Array(10)
              .fill(0)
              .map((_, i) => <ProductSkeleton key={i} />)
          ) : products.length > 0 ? (
            products.map((product, index) => (
              <div key={product.id} className="bg-white rounded-xl shadow-sm overflow-hidden flex flex-col justify-between">
                <ProductCard product={product} index={index} />
              </div>
            ))
          ) : (
            <div className="col-span-full py-16 text-center text-zinc-500 font-medium bg-white rounded-2xl shadow-sm border border-zinc-100">
              <div className="text-4xl mb-3">🕒</div>
              <p>No flash sales available at the moment.</p>
              <p className="text-sm mt-1">Check back later for exciting offers!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
