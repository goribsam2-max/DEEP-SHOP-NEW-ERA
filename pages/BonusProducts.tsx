import React, { useState, useEffect } from "react";
import { collection, onSnapshot, query, limit } from "firebase/firestore";
import { db } from "../firebase";
import { Product } from "../types";
import { ProductCard } from "../components/ui/ProductCard";
import { ProductSkeleton } from "../components/Skeletons";
import { getProductCoinReward } from "../lib/coinRewards";
import { CircleDollarSign } from "lucide-react";

const BonusProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Just fetch some products and filter by ones that have coin rewards today
    const q = query(collection(db, "products"), limit(50));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const allProds = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Product);
        const rewardProds = allProds.filter(p => getProductCoinReward(p.id) > 0);
        setProducts(rewardProds);
        setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="max-w-[1440px] mx-auto px-6 py-10 min-h-screen">
        <div className="flex items-center gap-4 mb-8 bg-zinc-900 dark:bg-white p-8 rounded-[32px] text-white dark:text-zinc-900">
            <div>
                <h1 className="text-2xl font-black">VG Coin Rewards</h1>
                <p className="opacity-80 text-sm font-medium">Buy these specific products today to earn bonus VG Coins!</p>
            </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 lg:gap-6">
            {loading ? (
                Array(10).fill(0).map((_, i) => <ProductSkeleton key={i} />)
            ) : products.length > 0 ? (
                products.map((product, index) => <ProductCard key={product.id} product={product} index={index} />)
            ) : (
                <div className="col-span-full py-20 text-center text-zinc-500">
                    <p className="font-bold">No bonus products available today. Check back tomorrow!</p>
                </div>
            )}
        </div>
    </div>
  );
};

export default BonusProducts;
