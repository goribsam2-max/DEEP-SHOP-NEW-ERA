import React from "react";
import { useNavigate } from "react-router-dom";
import SEO from "../components/SEO";
import { ChevronLeft } from "lucide-react";

const RefundPolicy: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="p-6 md:p-12 animate-fade-in bg-zinc-50 dark:bg-zinc-800 max-w-4xl mx-auto min-h-screen">
      <SEO
        title="Refund Policy | DEEP SHOP"
        description="Learn about refund, return, and warranty policies on DEEP SHOP, a multi-seller platform."
      />
      
      <div className="space-y-8 text-sm md:text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
        <div>
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 mb-6 font-medium text-xs uppercase tracking-wider"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Refund, Return & Warranty Policy</h1>
          <p>Last Updated: {new Date().toLocaleDateString()}</p>
        </div>

        <section className="bg-amber-50 dark:bg-amber-950/25 border border-amber-200 dark:border-amber-900/40 p-5 rounded-2xl">
          <h2 className="text-amber-800 dark:text-amber-200 font-bold text-lg mb-2">
            Important Information: Multi-Seller Marketplace
          </h2>
          <p className="text-amber-700 dark:text-amber-300">
            DEEP SHOP is a multi-seller platform where independent sellers list their products and buyers make purchases directly from them. DEEP SHOP does not own, stock, or sell any of the products listed on the platform, nor does it provide direct return, refund, or warranty policies. All transactions, guarantees, warranties, and return conditions are strictly determined and handled by the respective individual seller.
          </p>
        </section>

        <section>
          <h2 className="text-black dark:text-white font-semibold text-xl mb-4">
            1. No Platform-Wide Refund Policy
          </h2>
          <p>
            Because DEEP SHOP is a multi-seller marketplace where independent sellers list their products, there is no single platform-wide refund or return policy. Refund and return procedures depend entirely on the individual seller of the product. DEEP SHOP has no involvement in these seller-specific policies. Buyers are advised to directly contact and ask the seller before making a purchase. Whatever policy the seller states or agrees to will apply to your order.
          </p>
        </section>

        <section>
          <h2 className="text-black dark:text-white font-semibold text-xl mb-4">
            2. Warranty & Replacements
          </h2>
          <p>
            Any warranty, guarantee, or replacement coverage is offered solely by the individual seller from whom you bought the product. DEEP SHOP itself has nothing to do with product warranties. If you experience an issue or wish to make a warranty claim, please communicate directly with your seller. Their specific guidelines, timeline, and validation process will apply.
          </p>
        </section>

        <section>
          <h2 className="text-black dark:text-white font-semibold text-xl mb-4">
            3. Contacting Your Seller
          </h2>
          <p>
            If you need a refund, return, or wish to invoke a warranty, you must contact the seller directly. You can find seller contact information on the product details page or in your purchase history. Always ask the seller for clear written terms regarding return, refund, and warranty prior to completing your purchase.
          </p>
        </section>
      </div>
    </div>
  );
};

export default RefundPolicy;
