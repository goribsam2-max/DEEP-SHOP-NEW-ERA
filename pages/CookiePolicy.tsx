import React from "react";
import { useNavigate } from "react-router-dom";
import SEO from "../components/SEO";
import { ChevronLeft } from "lucide-react";

const CookiePolicy: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="p-6 md:p-12 animate-fade-in bg-zinc-50 dark:bg-zinc-800 max-w-4xl mx-auto min-h-screen">
      <SEO
        title="Cookie Policy"
        description="Learn about the cookies we use and why we use them to enhance your experience."
      />
      
      <div className="space-y-8 text-sm md:text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Cookie Policy</h1>
          <p>Last Updated: {new Date().toLocaleDateString()}</p>
        </div>

        <section>
          <h2 className="text-black dark:text-white font-semibold text-xl mb-4">
            1. What Are Cookies?
          </h2>
          <p>
            Cookies are small text files that are stored on your device (computer or mobile device) when you visit our website. They are widely used to make websites work more efficiently and to provide information to the owners of the site. They help us understand how you interact with our platform, improve functionality, and secure your account.
          </p>
        </section>

        <section>
          <h2 className="text-black dark:text-white font-semibold text-xl mb-4">
            2. How and Why We Use Cookies
          </h2>
          <p className="mb-4">
            We use cookies to enhance your shopping experience, secure your navigation, and build trust. Here are the main ways we use them:
          </p>
          <ul className="list-disc pl-5 space-y-3">
            <li>
              <strong>Authentication & Security:</strong> We use cookies and local storage items (such as Firebase auth tokens) to keep you logged in securely and protect your data. This ensures your account cannot be accessed by unauthorized users.
            </li>
            <li>
              <strong>Shopping Cart & Checkout:</strong> Cookies or local storage (`f_cart`) are used to remember the items in your shopping cart across different pages until you checkout.
            </li>
            <li>
              <strong>Preferences & Themes:</strong> We store your UI preferences (like Dark Mode settings) to provide a consistent visual experience whenever you visit.
            </li>
            <li>
              <strong>Analytics & Performance (Google Trust):</strong> To follow Google’s best practices for trusted merchants, we use minimal analytical data formats to understand user traffic. This allows us to improve site speed, optimize the layout, and fix any errors.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-black dark:text-white font-semibold text-xl mb-4">
            3. Types of Cookies We Use
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-bold text-black dark:text-white">Strictly Necessary Cookies</h3>
              <p>These are essential for the website to function. Without them, tasks like logging in, adding items to the cart, or securely checking out cannot be performed. You cannot opt out of these.</p>
            </div>
            <div>
              <h3 className="font-bold text-black dark:text-white">Functionality Cookies</h3>
              <p>These allow our store to remember the choices you make (such as language or region) and provide enhanced, more personal features.</p>
            </div>
            <div>
              <h3 className="font-bold text-black dark:text-white">Analytics Cookies</h3>
              <p>These help us measure website performance and ensure Google Search indexing correctly reads our pages to serve you the most relevant products.</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-black dark:text-white font-semibold text-xl mb-4">
            4. Managing Your Cookies
          </h2>
          <p>
            Most web browsers allow you to control cookies through their settings preferences. However, if you limit the ability of websites to set cookies, you may worsen your overall user experience or lose your cart items mid-session.
          </p>
        </section>
        
        <section>
          <h2 className="text-black dark:text-white font-semibold text-xl mb-4">
            5. Contact Us
          </h2>
          <p>
            If you have any questions about our use of cookies, please contact our support team.
          </p>
        </section>
      </div>
    </div>
  );
};

export default CookiePolicy;
