import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { animate, motion, useMotionValue } from "framer-motion";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export interface CardData {
  id: number | string;
  title: string;
  description: string;
  category: string;
  image: string;
  author?: {
    name: string;
    avatar: string;
  };
  date?: string;
  readTime?: string;
  actionText?: string;
}

const defaultCards: CardData[] = [
  {
    id: 1,
    title: "Liquid Motion",
    description:
      "Experience the fluid dynamics of modern web interactions with physics-based animations.",
    category: "Animation",
    image:
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80",
    author: { name: "Alex Rivera", avatar: "https://github.com/shadcn.png" },
    date: "Dec 12, 2024",
    readTime: "5 min read",
  },
  {
    id: 2,
    title: "Glassmorphism",
    description:
      "Blur the lines between layers with advanced backdrop filters and transparency effects.",
    category: "Design",
    image:
      "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&q=80",
    author: { name: "Sarah Chen", avatar: "https://github.com/shadcn.png" },
    date: "Dec 10, 2024",
    readTime: "4 min read",
  },
  {
    id: 3,
    title: "Dark Mode",
    description:
      "Easy on the eyes, elegant in appearance. A seamless transition to the dark side.",
    category: "Theme",
    image:
      "https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?w=800&q=80",
    author: { name: "Mike Johnson", avatar: "https://github.com/shadcn.png" },
    date: "Dec 8, 2024",
    readTime: "6 min read",
  },
  {
    id: 4,
    title: "Micro-Interactions",
    description:
      "Delightful details that make the difference between good and great user experience.",
    category: "UX",
    image:
      "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=800&q=80",
    author: { name: "Emily Davis", avatar: "https://github.com/shadcn.png" },
    date: "Dec 5, 2024",
    readTime: "3 min read",
  },
  {
    id: 5,
    title: "Responsive Layouts",
    description:
      "Fluid grids that adapt to any screen size, ensuring your content looks perfect everywhere.",
    category: "Layout",
    image:
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80",
    author: { name: "David Kim", avatar: "https://github.com/shadcn.png" },
    date: "Dec 3, 2024",
    readTime: "7 min read",
  },
];

export function CardsSlider({ cards = defaultCards, autoSlide = false }: { cards?: CardData[], autoSlide?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const x = useMotionValue(0);

  useEffect(() => {
    if (containerRef.current) {
      setWidth(
        containerRef.current.scrollWidth - containerRef.current.offsetWidth
      );
    }
  }, [cards]);

  useEffect(() => {
    if (autoSlide && width > 0) {
      const controls = animate(x, [-width, 0], {
        type: "tween",
        ease: "linear",
        duration: width / 30, // Adjust speed based on width
        repeat: Infinity,
        repeatType: "reverse",
      });
      return controls.stop;
    }
  }, [autoSlide, width, x]);

  const scrollTo = (direction: "left" | "right") => {
    const currentX = x.get();
    const containerWidth = containerRef.current?.offsetWidth || 0;
    const scrollAmount = containerWidth * 0.8;

    let newX =
      direction === "left" ? currentX + scrollAmount : currentX - scrollAmount;

    newX = Math.max(Math.min(newX, 0), -width);

    animate(x, newX, {
      type: "spring",
      stiffness: 300,
      damping: 30,
      mass: 1,
    });
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-8 relative group/slider">
      <div className="absolute top-1/2 -translate-y-1/2 left-2 z-20 opacity-0 group-hover/slider:opacity-100 transition-opacity duration-300">
        <button
          onClick={() => scrollTo("left")}
          className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-background/80 backdrop-blur-md border border-border/50 shadow-lg flex items-center justify-center hover:bg-background hover:scale-110 transition-all active:scale-95 text-foreground"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
        </button>
      </div>
      <div className="absolute top-1/2 -translate-y-1/2 right-2 z-20 opacity-0 group-hover/slider:opacity-100 transition-opacity duration-300">
        <button
          onClick={() => scrollTo("right")}
          className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-background/80 backdrop-blur-md border border-border/50 shadow-lg flex items-center justify-center hover:bg-background hover:scale-110 transition-all active:scale-95 text-foreground"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
        </button>
      </div>

      <motion.div
        ref={containerRef}
        className="cursor-grab active:cursor-grabbing overflow-hidden px-2 py-4 md:px-4 md:py-8 -mx-2 -my-4 md:-mx-4 md:-my-8"
        whileTap={{ cursor: "grabbing" }}
      >
        <motion.div
          drag="x"
          dragConstraints={{ right: 0, left: -width }}
          dragElastic={0.1}
          style={{ x }}
          className="flex gap-4 md:gap-6"
        >
          {cards.map((card, i) => (
            <motion.div
              key={card.id || i}
              className="min-w-[280px] max-w-[280px] md:min-w-[320px] md:max-w-[320px] h-[380px] md:h-[420px]"
              whileHover={{ y: -5, transition: { duration: 0.3 } }}
            >
              <Card className="group relative h-full overflow-hidden rounded-[20px] md:rounded-3xl border-border/50 bg-card/30 backdrop-blur-md transition-all duration-500 hover:border-zinc-900 dark:border-zinc-100/50 hover:shadow-2xl hover:shadow-zinc-900/10 dark:hover:shadow-zinc-100/10">
                <div className="relative h-40 md:h-48 overflow-hidden bg-muted">
                  <motion.img
                    src={card.image}
                    alt={card.title}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-60 transition-opacity duration-300 group-hover:opacity-40" />

                  <div className="absolute top-4 left-4">
                    <Badge
                      variant="secondary"
                      className="bg-background/80 backdrop-blur-md border-white/10 text-[10px] md:text-xs font-bold px-3 py-1 shadow-sm text-foreground"
                    >
                      {card.category}
                    </Badge>
                  </div>

                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[2px] opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center gap-2 rounded-full bg-white/90 px-5 py-2 text-sm font-semibold text-black shadow-lg"
                    >
                      {card.actionText || "View Details"}
                    </motion.button>
                  </div>
                </div>

                <div className="p-5 md:p-6 flex flex-col h-[calc(100%-10rem)] md:h-[calc(100%-12rem)] justify-between">
                  <div className="space-y-2 md:space-y-3">
                    <h3 className="text-lg md:text-xl font-bold leading-tight tracking-tight text-foreground transition-colors group-hover:text-zinc-900 dark:text-zinc-100 line-clamp-1">
                      {card.title}
                    </h3>
                    <p className="line-clamp-2 md:line-clamp-3 text-xs md:text-sm text-muted-foreground leading-relaxed font-medium">
                      {card.description}
                    </p>
                  </div>

                  <div className="pt-4 mt-auto border-t border-border/50 flex items-center justify-between">
                    {card.author ? (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8 border border-border/50 ring-2 ring-background">
                          <AvatarImage
                            src={card.author.avatar}
                            alt={card.author.name}
                          />
                          <AvatarFallback>{card.author.name[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-foreground">
                            {card.author.name}
                          </span>
                          <span className="text-[10px] font-semibold text-muted-foreground">
                            {card.date}
                          </span>
                        </div>
                      </div>
                    ) : (
                       <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 dark:text-zinc-700 dark:text-zinc-300">Available Now</span>
                    )}
                    {card.readTime && (
                      <div className="flex items-center gap-1.5 text-[10px] md:text-xs font-bold text-muted-foreground bg-secondary/50 px-2.5 py-1 rounded-full">
                        <Clock className="h-3 w-3" />
                        <span>{card.readTime}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
