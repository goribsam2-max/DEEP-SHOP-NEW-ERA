import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./button";
import { useNavigate } from "react-router-dom";

interface Card {
  id: string;
  title: string;
  description: string;
  category: string;
  image: string;
  date: string;
  actionText: string;
}

interface HeroSliderProps {
  cards: Card[];
  autoSlideDelay?: number;
  pauseDurationAfterInteract?: number;
}

export function HeroSlider({
  cards,
  autoSlideDelay = 3000,
  pauseDurationAfterInteract = 10000,
}: HeroSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [direction, setDirection] = useState(1);
  const navigate = useNavigate();

  const interactTimeRef = useRef<number>(0);
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [progress, setProgress] = useState(0);

  const nextSlide = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % cards.length);
    setProgress(0);
  };

  const prevSlide = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
    setProgress(0);
  };

  const handleInteract = () => {
    setIsAutoPlaying(false);
    interactTimeRef.current = Date.now();
    setProgress(0);
  };

  // Main autoplay loop
  useEffect(() => {
    if (cards.length === 0) return;

    const checkAutoPlay = () => {
      const now = Date.now();
      if (
        !isAutoPlaying &&
        now - interactTimeRef.current > pauseDurationAfterInteract
      ) {
        setIsAutoPlaying(true);
      }
    };

    const interval = setInterval(checkAutoPlay, 1000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, pauseDurationAfterInteract, cards.length]);

  useEffect(() => {
    if (!isAutoPlaying || cards.length === 0) {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      return;
    }

    const intervalMs = 50;
    const totalSteps = autoSlideDelay / intervalMs;

    setProgress(0);

    progressTimerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          nextSlide();
          return 0;
        }
        return prev + 100 / totalSteps;
      });
    }, intervalMs);

    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, [currentIndex, isAutoPlaying, autoSlideDelay, cards.length]);

  if (cards.length === 0) return null;

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.95,
    }),
    center: {
      z: 1,
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (direction: number) => ({
      z: 0,
      x: direction < 0 ? 300 : -300,
      opacity: 0,
      scale: 0.95,
    }),
  };

  return (
    <div
      className="relative w-full overflow-hidden bg-zinc-50 dark:bg-zinc-900 rounded-3xl"
      onMouseEnter={handleInteract}
      onTouchStart={handleInteract}
    >
      <div className="relative h-[250px] md:h-[400px] w-full flex items-center justify-center">
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.3 },
              scale: { duration: 0.3 },
            }}
            className="absolute inset-0 flex flex-col md:flex-row items-center justify-between p-6 md:p-12 w-full h-full cursor-pointer"
            onClick={() => navigate(`/product/${cards[currentIndex].id}`)}
          >
            <div className="flex-1 text-center md:text-left z-10">
              <span className="inline-block px-3 py-1 rounded-full bg-zinc-900/10 dark:bg-zinc-100/10 text-zinc-800 dark:text-zinc-200 text-[10px] font-bold tracking-wider mb-2 uppercase">
                {cards[currentIndex].category}
              </span>
              <h2
                className="text-xl md:text-4xl font-bold text-zinc-900 dark:text-zinc-100 mb-2 md:mb-4 tracking-tight leading-tight line-clamp-2"
                style={{ fontFamily: "'Comfortaa', cursive" }}
              >
                {cards[currentIndex].title}
              </h2>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm md:text-base line-clamp-1 md:line-clamp-2 overflow-hidden text-ellipsis mb-4 md:mb-6 max-w-lg hidden md:[display:-webkit-box]">
                {cards[currentIndex].description?.replace(/<[^>]*>?/gm, "")}
              </p>
              <div className="flex items-center justify-center md:justify-start gap-4">
                <span className="text-lg md:text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                  {cards[currentIndex].date}
                </span>
                <Button
                  size="sm"
                  className="rounded-full bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 shadow-lg shadow-black/20 dark:shadow-white/10"
                >
                  {cards[currentIndex].actionText}
                </Button>
              </div>
            </div>

            <div className="flex-1 w-full h-full relative z-0 flex justify-center items-center mt-4 md:mt-0">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 dark:from-emerald-900/40 dark:to-teal-900/40 blur-3xl rounded-full scale-110 -z-10" />
              <img
                src={cards[currentIndex].image}
                alt={cards[currentIndex].title}
                className="max-h-[120px] md:max-h-[250px] w-auto object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-500"
              />
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Arrows */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-20 rounded-full bg-white/50 dark:bg-zinc-800/50 backdrop-blur-md opacity-0 hover:opacity-100 md:opacity-100 md:hover:bg-white dark:md:hover:bg-zinc-800 transition-all shadow-sm"
          onClick={(e) => {
            e.stopPropagation();
            handleInteract();
            prevSlide();
          }}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-20 rounded-full bg-white/50 dark:bg-zinc-800/50 backdrop-blur-md opacity-0 hover:opacity-100 md:opacity-100 md:hover:bg-white dark:md:hover:bg-zinc-800 transition-all shadow-sm"
          onClick={(e) => {
            e.stopPropagation();
            handleInteract();
            nextSlide();
          }}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* Pagination indicators */}
      <div className="absolute bottom-4 left-0 w-full flex items-center justify-center p-4 gap-2 z-20">
        {cards.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${i === currentIndex ? "w-8 bg-zinc-900 dark:bg-white" : "w-2 bg-zinc-400 dark:bg-zinc-600 hover:bg-zinc-600 dark:hover:bg-zinc-400"}`}
            onClick={() => {
              handleInteract();
              setDirection(i > currentIndex ? 1 : -1);
              setCurrentIndex(i);
            }}
          />
        ))}
      </div>
    </div>
  );
}
