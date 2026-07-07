import React from "react";
import { Sparkles, ShoppingBag, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ShoppingCredits: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="max-w-[1440px] mx-auto px-6 py-10 min-h-screen flex flex-col items-center">
        <div className="text-center max-w-2xl mt-12 mb-16">
            <div className="mx-auto w-20 h-20 bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mb-6">
                <Sparkles className="w-10 h-10" />
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight leading-tight mb-4">
                Shopping Credits <br/> Coming Soon
            </h1>
            <p className="text-zinc-500 text-lg font-medium">
                We are crafting an exciting new way to earn and spend credits. Complete tasks, refer friends, and unlock exclusive discounts. Stay tuned!
            </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-3xl">
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-[32px] border border-zinc-200 dark:border-zinc-800 flex flex-col items-start shadow-sm">
                <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-6">
                   <span className="font-black text-xl">V</span>
                </div>
                <h3 className="font-bold text-xl mb-2 text-zinc-900 dark:text-zinc-100">Earn VG Coins</h3>
                <p className="text-zinc-500 text-sm mb-6 flex-1">Instead of waiting, you can already start earning VG Coins by purchasing eligible bonus products or depositing funds.</p>
                <button onClick={() => navigate('/bonus')} className="flex items-center gap-2 text-sm font-bold text-zinc-900 dark:text-zinc-100 hover:gap-3 transition-all">
                    View Bonus Products <ArrowRight className="w-4 h-4"/>
                </button>
            </div>
            
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-[32px] border border-zinc-200 dark:border-zinc-800 flex flex-col items-start shadow-sm">
                <div className="w-12 h-12 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center mb-6">
                   <ShoppingBag className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-xl mb-2 text-zinc-900 dark:text-zinc-100">Bundle Deals</h3>
                <p className="text-zinc-500 text-sm mb-6 flex-1">Maximize your savings instantly by checking out our dynamic bundle offers combining the best products.</p>
                <button onClick={() => navigate('/all-products?deal=bundle')} className="flex items-center gap-2 text-sm font-bold text-zinc-900 dark:text-zinc-100 hover:gap-3 transition-all">
                    Shop Bundles <ArrowRight className="w-4 h-4"/>
                </button>
            </div>
        </div>
    </div>
  );
};
export default ShoppingCredits;
