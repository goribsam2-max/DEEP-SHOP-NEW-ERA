import React from "react";
import { useNavigate } from "react-router-dom";
import SEO from "../components/SEO";
import Icon from "../components/Icon";

const PrivacyPolicy: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="p-6 md:p-12 animate-fade-in bg-zinc-50 dark:bg-zinc-800 max-w-4xl mx-auto min-h-screen">
      <SEO
        title="Privacy Policy"
        description="Read our privacy policy and learn how we protect your data at DEEP SHOP."
      />
      
      <div className="space-y-8 text-sm md:text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
        <section>
          <h2 className="text-black dark:text-white font-semibold text-xl mb-4">
            A Highly Trusted & Secure Platform
          </h2>
          <p>
            At DEEP SHOP, your privacy and data security are our absolute
            highest priorities. We are a trusted, verified business that follows
            strict global data compliance standards. Google regularly indexes
            and verifies our pages to ensure we provide a safe, reliable, and
            risk-free browsing and shopping experience.
          </p>
        </section>

        <section>
          <h2 className="text-black dark:text-white font-semibold text-xl mb-4">
            Authentication & Login Security
          </h2>
          <p>
            We offer secure authentication via Google Login and Manual
            Registration.
            <br />
            <br />
            <strong>Google Login:</strong> This is a globally recognized, highly
            secure authentication method. By logging in with Google, we only
            receive your basic profile information (Name, Email, and Avatar)
            required to set up your account. We never have access to your Google
            password or any other sensitive data. It ensures a fast, risk-free
            experience.
            <br />
            <br />
            <strong>Manual Login:</strong> If you prefer manual login, your
            credentials are encrypted using industry-leading hashing algorithms
            before being stored. Your password is completely secure and
            unreadable by anyone, including our own staff.
          </p>
        </section>

        <section>
          <h2 className="text-black dark:text-white font-semibold text-xl mb-4">
            Data Collection & Usage
          </h2>
          <p>
            We only collect data that is strictly necessary for order
            fulfillment, fraud prevention, and enhancing your user experience.
            We never sell your personal information to third parties. We are
            fully committed to maintaining the highest standard of data
            integrity, which is why we are considered a trusted site by Google
            and our users.
          </p>
        </section>

        <section>
          <h2 className="text-black dark:text-white font-semibold text-xl mb-4">
            Purchases & Returns Privacy
          </h2>
          <p>
            Please note that as per our strictly enforced policy, we do not
            accept returns or offer refunds/money-back. Warranty is only
            applicable on specific products where explicitly stated. All order
            records are kept secure and confidential to protect your purchase
            history.
          </p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
