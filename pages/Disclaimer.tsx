import React from "react";
import { useNavigate } from "react-router-dom";
import SEO from "../components/SEO";
import { ChevronLeft } from "lucide-react";

const Disclaimer: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="p-6 md:p-12 animate-fade-in bg-zinc-50 dark:bg-zinc-800 max-w-4xl mx-auto min-h-screen">
      <SEO
        title="Disclaimer"
        description="General disclaimer for DEEP SHOP."
      />
      
      <div className="space-y-8 text-sm md:text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Legal Disclaimer</h1>
          <p>Last Updated: {new Date().toLocaleDateString()}</p>
        </div>

        <section>
          <h2 className="text-black dark:text-white font-semibold text-xl mb-4">
            1. General Knowledge
          </h2>
          <p>
            The information provided by DEEP SHOP on our platform is for general informational purposes only. While we establish reasonable efforts to ensure the accuracy and reliability of all specifications, prices, and product details, we make no representation or warranty of any kind, express or implied, regarding the accuracy, adequacy, or completeness of any information on the site.
          </p>
        </section>

        <section>
          <h2 className="text-black dark:text-white font-semibold text-xl mb-4">
            2. External Links
          </h2>
          <p>
            Our site may contain links to other websites or content belonging to or originating from third parties. Such external links are not actively investigated, monitored, or checked for accuracy, adequacy, validity, reliability, availability, or completeness by us.
          </p>
        </section>

        <section>
          <h2 className="text-black dark:text-white font-semibold text-xl mb-4">
            3. Product Capabilities
          </h2>
          <p>
            Any AI features or smart capabilities advertised for physical products are determined solely by the original manufacturer’s software and hardware constraints. DEEP SHOP is not responsible for the future discontinuation of third-party companion apps or software updates related to the devices sold.
          </p>
        </section>
      </div>
    </div>
  );
};

export default Disclaimer;
