import React from "react";
import { useNavigate } from "react-router-dom";
import SEO from "../components/SEO";
import Icon from "../components/Icon";

const AboutUs: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="p-6 md:p-12 animate-fade-in bg-zinc-50 dark:bg-zinc-800 max-w-4xl mx-auto min-h-screen">
      <SEO
        title="About Us"
        description="Learn about DEEP SHOP, Bangladesh's trusted platform for Border Cross Products & genuine mobiles."
      />
      

      <div className="space-y-8 text-sm md:text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
        <section>
          <h2 className="text-black dark:text-white font-semibold text-xl mb-4">
            Welcome to DEEP SHOP
          </h2>
          <p>
            DEEP SHOP is Bangladesh's trusted platform where you can get Border Cross Products + genuine mobiles. We offer 100% authentic devices, trusted global imports, and premium accessories. Our mission is to provide high-quality, trusted global products and genuine smartphones securely to tech lovers in Bangladesh.
          </p>
        </section>

        <section>
          <h2 className="text-black dark:text-white font-semibold text-xl mb-4">
            Why We Are Trusted
          </h2>
          <p>
            As a certified and verified e-commerce platform, we adhere to strict
            standards to ensure every transaction is safe and every product is
            authentic. We integrate with world-class secure authentication
            providers like Google to make sure your data is never compromised.
            We are recognized globally as a secure and reliable platform for
            tech enthusiasts.
          </p>
        </section>

        <section>
          <h2 className="text-black dark:text-white font-semibold text-xl mb-4">
            Our Commitment
          </h2>
          <p>
            We believe in full transparency. Due to the high-value nature of
            electronics, please make sure you read the product details carefully
            before making a purchase. As outlined in our Terms & Conditions, we
            do not offer general return or money-back policies. Warranties are
            only applicable to specific items that explicitly mention them. This
            allows us to offer you the best possible prices on brand-new,
            unopened products.
          </p>
        </section>
      </div>
    </div>
  );
};

export default AboutUs;
