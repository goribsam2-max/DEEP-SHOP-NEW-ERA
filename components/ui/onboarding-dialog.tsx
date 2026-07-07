import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import useEmblaCarousel from "embla-carousel-react"

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ")
}

interface Banner {
  id: string;
  imageUrl: string;
  title: string;
  description: string;
  link?: string;
  bannerType?: 'hero' | 'popup' | 'gif';
}

export function OnboardingDialog({ defaultOpen = true, slides, onClose }: { defaultOpen?: boolean, slides: Banner[], onClose?: () => void }) {
  const [open, setOpen] = React.useState(defaultOpen)
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false })
  const [activeIndex, setActiveIndex] = React.useState(0)

  React.useEffect(() => {
    if (!emblaApi) return
    const onSelect = () => setActiveIndex(emblaApi.selectedScrollSnap())
    onSelect()
    emblaApi.on("select", onSelect)
    return () => { emblaApi.off("select", onSelect) }
  }, [emblaApi])

  if (slides.length === 0) return null;

  const isFirstSlide = activeIndex === 0
  const isLastSlide = activeIndex === slides.length - 1
  const currentSlide = slides[activeIndex] ?? slides[0]

  const handleNext = () => {
    if (isLastSlide) { 
        setOpen(false); 
        onClose && onClose()
        return 
    }
    emblaApi?.scrollNext()
  }

  const handlePrevious = () => emblaApi?.scrollPrev()

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setOpen(false); onClose && onClose(); }} />

      {/* Dialog */}
      <div className="relative w-full max-w-[90%] md:max-w-lg mx-auto rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95" onClick={e => e.stopPropagation()}>
        <div className="p-3 sm:p-4">
          {/* Carousel */}
          <div ref={emblaRef} className="overflow-hidden rounded-2xl relative">
            <div className="flex">
              {slides.map((slide) => (
                <div key={slide.id} className="flex-[0_0_100%] min-w-0">
                  <div className="p-1">
                    <img
                      src={slide.imageUrl}
                      alt={slide.title}
                      className="aspect-square sm:aspect-video w-full rounded-xl object-contain sm:object-cover bg-zinc-100 dark:bg-zinc-800/50"
                    />
                  </div>
                </div>
              ))}
            </div>
            
            <button 
                onClick={() => { setOpen(false); onClose && onClose() }}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-black/40 backdrop-blur-md text-white rounded-full hover:bg-black/60 transition-colors"
                aria-label="Close"
            >
                <svg className="w-4 h-4" fill="none" strokeWidth="2" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>

          {/* Dots */}
          <div className="flex items-center justify-center gap-2 mt-4">
            {slides.map((slide, index) => (
              <motion.div
                key={slide.id}
                animate={{
                  opacity: index === activeIndex ? 1 : 0.5,
                  width: index === activeIndex ? 24 : 8,
                }}
                initial={false}
                transition={{ duration: 0.22, ease: "easeOut" }}
              >
                <button
                  onClick={() => emblaApi?.scrollTo(index)}
                  aria-label={`Go to ${slide.title}`}
                  className={cn(
                    "h-2 w-full rounded-full transition-colors cursor-pointer",
                    index === activeIndex ? "bg-zinc-100 dark:bg-zinc-8000" : "bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700"
                  )}
                />
              </motion.div>
            ))}
          </div>

          {/* Title + Description — grid fade */}
          <div className="grid mt-5 px-2">
            {slides.map((slide) => (
              <motion.div
                key={slide.id}
                animate={{ opacity: currentSlide.id === slide.id ? 1 : 0 }}
                initial={false}
                className="col-start-1 row-start-1 text-center"
                style={{ pointerEvents: currentSlide.id === slide.id ? "auto" : "none" }}
                transition={{ duration: 0.24, ease: "easeOut" }}
              >
                <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{slide.title}</h2>
                {slide.description && <p className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 mt-2">{slide.description}</p>}
              </motion.div>
            ))}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-8 px-2 pb-2">
            <div>
              {!isFirstSlide ? (
                <button
                  onClick={handlePrevious}
                  className="px-4 py-2.5 rounded-xl text-sm font-bold text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
                >
                  Back
                </button>
              ) : (
                <button
                  onClick={() => { setOpen(false); onClose && onClose() }}
                  className="px-4 py-2.5 rounded-xl text-sm font-bold text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
                >
                  Skip
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleNext}
                className="px-6 py-2.5 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-lg shadow-emerald-500/30 text-sm font-bold hover:bg-zinc-800 dark:bg-zinc-200 transition-all cursor-pointer active:scale-95"
              >
                {isLastSlide ? "Get Started" : "Next"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
