import React, { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { OnboardingOffer } from "../types";
import { ArrowRight, X } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";

export default function OnboardingOffersModal() {
  const [offers, setOffers] = useState<OnboardingOffer[]>([]);
  const [show, setShow] = useState(false);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });

  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => {
      setSelectedIndex(emblaApi.selectedScrollSnap());
    };
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi]);

  useEffect(() => {
    // Check if we should show it
    const sessionSkipped = sessionStorage.getItem("onboarding_skipped");
    const localSkippedTime = localStorage.getItem("onboarding_skipped_time");

    if (sessionSkipped === "1") {
      return;
    }

    if (localSkippedTime) {
      const timePassed = Date.now() - parseInt(localSkippedTime, 10);
      if (timePassed < 24 * 60 * 60 * 1000) {
        return;
      }
    }

    // Fetch active offers
    const q = query(collection(db, "onboardingOffers"), orderBy("order", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: OnboardingOffer[] = [];
      snapshot.forEach((doc) => {
        const item = { id: doc.id, ...doc.data() } as OnboardingOffer;
        if (item.active) data.push(item);
      });
      if (data.length > 0) {
        setOffers(data);
        setShow(true);
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (show) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [show]);

  const handleSkip = () => {
    setShow(false);
    sessionStorage.setItem("onboarding_skipped", "1");
    localStorage.setItem("onboarding_skipped_time", Date.now().toString());
  };

  const handleNext = () => {
     if (emblaApi) {
        if (emblaApi.canScrollNext()) {
            emblaApi.scrollNext();
        } else {
            handleSkip(); // if it's the last one
        }
     }
  }

  if (!show || offers.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[99999] bg-black">
      <div className="relative w-full h-full overflow-hidden" ref={emblaRef}>
        <div className="flex w-full h-full">
          {offers.map((offer) => (
            <div key={offer.id} className="relative flex-[0_0_100%] w-full h-full">
              <img
                src={offer.imageUrl}
                alt="Offer"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/30" />

              <div className="relative z-10 w-full h-full flex flex-col p-6 pt-20">
                <div className="flex justify-end mb-4">
                  <button
                    onClick={handleSkip}
                    className="flex items-center bg-white/20 hover:bg-white/30 backdrop-blur-md transition-colors rounded-full px-5 py-2 text-white font-medium shadow-sm"
                  >
                    Skip <ArrowRight className="ml-2 w-4 h-4" />
                  </button>
                </div>

                <div className="mt-8 md:mt-24 max-w-2xl">
                  <h1 className="text-5xl md:text-6xl text-white font-bold leading-tight drop-shadow-md">
                    {offer.title1} <br />
                    {offer.title2}{" "}
                    <span className="relative inline-block whitespace-nowrap">
                      {offer.highlightedWord}
                      <svg
                        className="absolute -bottom-3 left-0 w-full h-4 text-white"
                        viewBox="0 0 200 20"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        preserveAspectRatio="none"
                      >
                        <path
                          d="M2 15C40 5 120 -5 198 12"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                        />
                      </svg>
                    </span>
                  </h1>
                  <p className="text-white/90 mt-6 text-lg max-w-md drop-shadow-sm font-medium">
                    {offer.description}
                  </p>
                </div>

                <div className="absolute bottom-32 right-8 md:right-32 md:bottom-32 rotate-[-8deg] bg-white/20 backdrop-blur-lg border border-white/40 shadow-2xl rounded-3xl p-6 text-center text-white scale-110">
                  <div className="text-sm font-semibold uppercase tracking-wider text-white/90">{offer.glassTitle}</div>
                  <div className="text-3xl font-extrabold mt-1">{offer.glassDiscount}</div>
                </div>

                <div className="absolute bottom-12 right-6 z-20">
                    <button onClick={handleNext} className="bg-white text-zinc-900 rounded-full px-8 py-3 font-bold shadow-xl flex items-center gap-2">
                        {selectedIndex < offers.length - 1 ? "Next" : "Get Started"} <ArrowRight className="w-5 h-5" />
                    </button>
                </div>

              </div>
            </div>
          ))}
        </div>
        
        {offers.length > 1 && (
            <div className="absolute bottom-12 left-0 right-0 flex justify-center gap-2 z-20">
                {offers.map((_, i) => (
                    <div key={i} className={`w-2 h-2 rounded-full transition-all duration-300 ${selectedIndex === i ? "bg-white w-6" : "bg-white/50"}`} />
                ))}
            </div>
        )}
      </div>
      
      <div className="fixed bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black/80 to-transparent pointer-events-none z-[8]" />
    </div>
  );
}
