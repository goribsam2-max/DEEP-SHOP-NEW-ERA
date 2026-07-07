import { formatPrice } from "@/lib/utils";
import React, { useState, useEffect } from "react";
import { collection, onSnapshot, query, limit } from "firebase/firestore";
import { db } from "../firebase";
import { Product } from "../types";
import { useNavigate } from "react-router-dom";
import { ShoppingBag, ArrowRight, Zap, Gift, RefreshCw } from "lucide-react";

export default function BundleDeals() {
  const [products, setProducts] = useState<Product[]>([]);
  const [currentBundle, setCurrentBundle] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const q = query(collection(db, "products"), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const allProds = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Product);
        setProducts(allProds);
        setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const generateNewBundle = () => {
    if (products.length < 3) return;
    
    // Pick 3 random products
    const shuffled = [...products].sort(() => 0.5 - Math.random());
    setCurrentBundle(shuffled.slice(0, 3));
  };
  
  useEffect(() => {
      if (products.length > 0 && currentBundle.length === 0) {
          generateNewBundle();
      }
  }, [products]);

  const addToCartAndCheckout = () => {
      const cart = JSON.parse(localStorage.getItem("f_cart") || "[]");
      
      currentBundle.forEach(item => {
        const existingIndex = cart.findIndex((c: any) => c.id === item.id);
        const finalPrice = item.isOffer && item.offerPrice ? item.offerPrice : (item.price * 0.9); // 10% bundle discount

        if (existingIndex > -1) {
          cart[existingIndex].quantity += 1;
        } else {
          cart.push({
            ...item,
            price: Math.floor(finalPrice), 
            originalPrice: Number(item.price),
            quantity: 1,
          });
        }
      });
      
      localStorage.setItem("f_cart", JSON.stringify(cart));
      window.dispatchEvent(new Event("update_cart"));
      navigate('/checkout');
  };

  const totalPrice = currentBundle.reduce((acc, p) => acc + p.price, 0);
  const discountPrice = Math.floor(currentBundle.reduce((acc, p) => p.isOffer && p.offerPrice ? acc + p.offerPrice : acc + (p.price * 0.9), 0));
  const savings = totalPrice - discountPrice;

  return (
    <div className="max-w-[1440px] mx-auto px-6 py-10 min-h-screen">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8 bg-zinc-900 border border-zinc-800 dark:border-zinc-800 p-8 rounded-[32px] text-white">
            <div className="flex items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black flex items-center gap-2">Dynamic Bundles <Zap className="w-5 h-5 text-amber-400 fill-amber-400 animate-pulse"/></h1>
                    <p className="opacity-80 text-sm font-medium">Buy together and save big. Infinite generated bundles!</p>
                </div>
            </div>
            
            <button onClick={generateNewBundle} className="flex items-center gap-2 bg-white text-zinc-900 font-bold px-6 py-3 rounded-full hover:bg-zinc-200 transition-colors">
                <RefreshCw className="w-4 h-4" /> Next Bundle
            </button>
        </div>

        {loading ? (
            <div className="flex justify-center py-20"><RefreshCw className="w-8 h-8 animate-spin text-zinc-400"/></div>
        ) : currentBundle.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <div className="bg-white dark:bg-zinc-900 rounded-[32px] p-6 lg:p-10 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col gap-6 relative">
                    <div className="absolute top-0 right-10 -translate-y-1/2 bg-emerald-500 text-white font-black px-4 py-1.5 rounded-full shadow-lg -rotate-12">
                        SAVE {formatPrice(savings)}
                    </div>
                
                    {currentBundle.map((product, idx) => (
                        <React.Fragment key={product.id}>
                            <div className="flex gap-6 items-center">
                                <div className="w-24 h-24 md:w-32 md:h-32 bg-zinc-50 dark:bg-zinc-800/50 rounded-[20px] p-2 md:p-4 overflow-hidden border border-zinc-100 dark:border-zinc-800">
                                    <img src={product.image} className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal" alt={product.name}/>
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-base md:text-lg text-zinc-900 dark:text-zinc-100 leading-tight mb-2 line-clamp-2" onClick={() => navigate(`/product/${product.id}`)}>{product.name}</h3>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xl md:text-2xl font-black text-[#ea580c]">{formatPrice(Math.floor(product.isOffer && product.offerPrice ? product.offerPrice : (product.price * 0.9)))}</span>
                                        <span className="text-sm font-semibold text-zinc-400 line-through">{formatPrice(product.price)}</span>
                                    </div>
                                </div>
                            </div>
                            
                            {idx < currentBundle.length -1 && (
                                <div className="flex justify-center -my-2 opacity-50 relative z-10">
                                    <div className="bg-zinc-100 dark:bg-zinc-800 w-10 h-10 rounded-full flex items-center justify-center font-black text-zinc-500 text-xl border-4 border-white dark:border-zinc-900">+</div>
                                </div>
                            )}
                        </React.Fragment>
                    ))}
                </div>
                
                <div className="bg-blue-50 dark:bg-blue-900/10 rounded-[32px] p-8 md:p-12 sticky top-24 border border-blue-100 dark:border-blue-900/20">
                    <h2 className="text-2xl font-black mb-8 text-black dark:text-white flex items-center gap-2"><Gift className="text-blue-500 fill-blue-500"/> Bundle Order Summary</h2>
                    
                    <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm mb-6 flex flex-col gap-3">
                       <div className="flex justify-between font-medium text-zinc-600 dark:text-zinc-400">
                           <span>Total MSRP</span>
                           <span className="line-through">{formatPrice(totalPrice)}</span>
                       </div> 
                       <div className="flex justify-between font-bold text-base text-zinc-900 dark:text-zinc-100">
                           <span>Bundle Price</span>
                           <span>{formatPrice(discountPrice)}</span>
                       </div>
                    </div>
                    
                    <button onClick={addToCartAndCheckout} className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.98] transition-transform text-white rounded-full py-5 font-bold text-lg flex justify-center items-center gap-2 mb-4">
                        Buy Bundle Now <ArrowRight />
                    </button>
                    
                    <p className="text-center text-sm font-medium text-zinc-500">Items will be added to your cart with the bundle discount applied.</p>
                </div>
            </div>
        ) : (
            <div className="text-center py-20 font-bold text-zinc-500">Not enough products to create bundles right now.</div>
        )}
    </div>
  )
}
