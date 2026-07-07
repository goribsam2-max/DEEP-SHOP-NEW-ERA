import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

const slides = [
  {
    image: "/favicon.png",
    title: "Let's find the Best & Latest Mobiles",
    desc: "Discover premium quality border cross phones and mobile accessories tailored to your tech lifestyle.",
  },
  {
    image: "/favicon.png",
    title: "Experience Seamless Delivery Monitoring",
    desc: "Track your orders in real-time and get updates instantly right at your doorstep.",
  },
  {
    image: "/favicon.png",
    title: "Explore Our Vast Mobile Products We Offer",
    desc: "Browse a huge variety of products from top brands and find the best deals every day.",
  },
  {
    image: "/favicon.png",
    title: "Build Your Exclusive Favorites List",
    desc: "Save the phones you love and create a personalized wishlist for easy shopping later.",
  },
];

const Onboarding: React.FC<{ onFinish: () => void }> = ({ onFinish }) => {
  const [current, setCurrent] = useState(0);
  const navigate = useNavigate();

  const handleFinish = () => {
    localStorage.setItem("vibe_onboarded", "true");
    onFinish();
    navigate("/auth-selector");
  };

  const next = () => {
    if (current === slides.length - 1) {
      handleFinish();
    } else {
      setCurrent(current + 1);
    }
  };

  return (
    <div className="h-screen flex flex-col p-8 bg-zinc-50 dark:bg-zinc-800 max-w-md mx-auto">
      <div className="flex justify-end mb-6">
        <button
          onClick={handleFinish}
          className="text-xs font-bold tracking-normal text-zinc-400 hover:text-black dark:text-white transition-colors"
        >
          Skip
        </button>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="w-full flex flex-col items-center max-w-md mx-auto"
          >
            <div className="w-full max-w-[280px] lg:max-w-[320px] aspect-[4/5] bg-zinc-50 dark:bg-zinc-800 rounded-[40px] mb-8 overflow-hidden shadow-sm shadow-zinc-100 flex-shrink-0 flex items-center justify-center">
              <img src={slides[current].image} className="w-[80%] h-[80%] object-contain" alt="" />
            </div>
            <h1 className="text-2xl md:text-xl font-bold font-outfit text-center mb-3 tracking-tight leading-tight text-zinc-900 dark:text-zinc-100">
              {slides[current].title}
            </h1>
            <p className="text-zinc-500 text-sm md:text-base text-center leading-relaxed mb-8 px-6 font-medium">
              {slides[current].desc}
            </p>
          </motion.div>
        </AnimatePresence>
        <div className="flex space-x-2 mb-10">
          {slides.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-500 \${i === current ? "w-8 bg-zinc-900" : "w-2 bg-zinc-200"}`}
            ></div>
          ))}
        </div>
      </div>
      <div className="space-y-4 w-full max-w-md mx-auto relative z-10">
        <Button
          variant="primary"
          onClick={next}
          className="w-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] py-6 rounded-2xl text-base tracking-wide font-medium bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 transition-all active:scale-[0.98]"
        >
          {current === slides.length - 1 ? "Start Shopping" : "Continue"}
        </Button>

        {current === 0 && (
          <p className="text-center text-sm font-medium text-zinc-500 dark:text-zinc-400 mt-6">
            Already a member?{" "}
            <button
              onClick={() => navigate("/auth-selector")}
              className="text-zinc-900 dark:text-white font-bold hover:underline underline-offset-4"
            >
              Sign In
            </button>
          </p>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
