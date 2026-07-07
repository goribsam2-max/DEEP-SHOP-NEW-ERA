import React from "react";
import { useNavigate } from "react-router-dom";
import SEO from "../components/SEO";
import Icon from "../components/Icon";

const Terms: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="p-6 md:p-12 animate-fade-in bg-zinc-50 dark:bg-zinc-800 max-w-4xl mx-auto min-h-screen">
      <SEO
        title="Terms & Conditions"
        description="Terms and Conditions and return policy of DEEP SHOP."
      />
      
      <div className="space-y-8 text-sm md:text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
        <section>
          <h2 className="text-black dark:text-white font-semibold text-xl mb-4">
            1. Acceptance of Terms
          </h2>
          <p>
            By accessing and shopping at DEEP SHOP, you agree to be bound by
            these Terms and Conditions. Our platform is a secure,
            Google-verified service designed for your trust and convenience.
          </p>
        </section>

        <section>
          <h2 className="text-black dark:text-white font-semibold text-xl mb-4">
            2. Multi-Seller Platform & Returns Policy
          </h2>
          <p>
            DEEP SHOP is a multi-seller marketplace where independent third-party sellers list and sell their products. DEEP SHOP does not have a general return or refund policy. All return, refund, and exchange terms are strictly set, managed, and resolved by the individual seller from whom you purchase. Buyers must contact the seller directly for any inquiries regarding return or refund policies.
          </p>
        </section>

        <section>
          <h2 className="text-black dark:text-white font-semibold text-xl mb-4">
            3. Warranty Information
          </h2>
          <p>
            DEEP SHOP does not provide any warranties for the products listed on the platform. Any warranty coverage, guarantee, or replacement support is offered strictly by the individual seller as indicated on their product page or as communicated by them. If no warranty details are specified by the seller, the product is sold "as is."
          </p>
        </section>

        <section>
          <h2 className="text-black dark:text-white font-semibold text-xl mb-4">
            4. Account Security
          </h2>
          <p>
            We provide state-of-the-art secure authentication (including Google
            and robust Manual Login) ensuring your account is safe from
            unauthorized access. You are responsible for keeping your login
            credentials confidential.
          </p>
        </section>
      </div>
    </div>
  );
};

export default Terms;
