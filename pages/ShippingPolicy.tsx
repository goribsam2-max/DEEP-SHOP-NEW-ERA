import React from "react";
import { useNavigate } from "react-router-dom";
import SEO from "../components/SEO";
import { ChevronLeft } from "lucide-react";

const ShippingPolicy: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="p-6 md:p-12 animate-fade-in bg-zinc-50 dark:bg-zinc-800 max-w-4xl mx-auto min-h-screen">
      <SEO
        title="Shipping Policy"
        description="Learn about our shipping rates, delivery times, and dispatch processes."
      />
      
      <div className="space-y-8 text-sm md:text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Shipping Policy</h1>
          <p>Last Updated: {new Date().toLocaleDateString()}</p>
        </div>

        <section>
          <h2 className="text-black dark:text-white font-semibold text-xl mb-4">
            1. Fast & Reliable Delivery
          </h2>
          <p>
            DEEP SHOP is committed to delivering your premium items and devices safely and efficiently. We use top-rated delivery partners to ensure your orders reach you in pristine condition.
          </p>
        </section>

        <section>
          <h2 className="text-black dark:text-white font-semibold text-xl mb-4">
            2. Processing Times
          </h2>
          <p>
            All orders are processed within 1 to 2 business days (excluding weekends and holidays) after receiving your order confirmation email. You will receive another notification when your order has shipped, complete with tracking information.
          </p>
        </section>

        <section>
          <h2 className="text-black dark:text-white font-semibold text-xl mb-4">
            3. Shipping Rates & Delivery Estimates
          </h2>
          <p className="mb-4">
            Shipping charges for your order will be calculated and displayed at checkout. Estimated delivery times depend on your location within Bangladesh:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Inside Dhaka:</strong> 1 - 2 Business Days</li>
            <li><strong>Outside Dhaka:</strong> 2 - 4 Business Days</li>
          </ul>
        </section>

        <section>
          <h2 className="text-black dark:text-white font-semibold text-xl mb-4">
            4. Order Tracking
          </h2>
          <p>
            You can track your order directly from your account's "My Orders" page. Enter your tracking number to view real-time shipping updates.
          </p>
        </section>
        
        <section>
          <h2 className="text-black dark:text-white font-semibold text-xl mb-4">
            5. Delivery Issues
          </h2>
          <p>
            If you experience any issues with your delivery or have not received your package within the estimated timeframe, please contact our support desk immediately so we can investigate and assist you.
          </p>
        </section>
      </div>
    </div>
  );
};

export default ShippingPolicy;
