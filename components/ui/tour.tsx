"use client"

import { AnimatePresence, motion } from "framer-motion"
import type React from "react"
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react"

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import { Torus } from "lucide-react"

// Constants
export const TOUR_STEP_IDS = {
  TEAM_SWITCHER: "team-switcher",
  WRITING_AREA: "writing-area",
  ASK_AI: "ask-ai",
  FAVORITES: "favorites",
} as const

export interface TourStep {
  content: React.ReactNode
  selectorId: string
  width?: number
  height?: number
  onClickWithinArea?: () => void
  position?: "top" | "bottom" | "left" | "right" | "center"
}

interface TourContextType {
  currentStep: number
  totalSteps: number
  nextStep: () => void
  previousStep: () => void
  endTour: () => void
  isActive: boolean
  startTour: () => void
  setSteps: (steps: TourStep[]) => void
  steps: TourStep[]
  isTourCompleted: boolean
  setIsTourCompleted: (completed: boolean) => void
}

interface TourProviderProps {
  children: React.ReactNode
  onComplete?: () => void
  className?: string
  isTourCompleted?: boolean
  tourId?: string // Add tourId for persistence
}

const TourContext = createContext<TourContextType | null>(null)


const PADDING = 16;
const CONTENT_WIDTH = 300;
const CONTENT_HEIGHT = 174;

function getElementPosition(id: string) {
  const element = document.getElementById(id)
  if (!element) return null
  const rect = element.getBoundingClientRect()
  return {
    top: rect.top,
    left: rect.left,
    width: rect.width,
    height: rect.height,
  }
}

function calculateContentPosition(
  elementPos: { top: number; left: number; width: number; height: number },
  position: "top" | "bottom" | "left" | "right" | "center" = "bottom",
) {
  let left = elementPos.left
  let top = elementPos.top

  switch (position) {
    case "top":
      top = elementPos.top - CONTENT_HEIGHT - PADDING
      left = elementPos.left + elementPos.width / 2 - CONTENT_WIDTH / 2
      break
    case "bottom":
      top = elementPos.top + elementPos.height + PADDING
      left = elementPos.left + elementPos.width / 2 - CONTENT_WIDTH / 2
      break
    case "left":
      left = elementPos.left - CONTENT_WIDTH - PADDING
      top = elementPos.top + elementPos.height / 2 - CONTENT_HEIGHT / 2
      break
    case "right":
      left = elementPos.left + elementPos.width + PADDING
      top = elementPos.top + elementPos.height / 2 - CONTENT_HEIGHT / 2
      break
    case "center":
      left = elementPos.left + elementPos.width / 2 - CONTENT_WIDTH / 2
      top = elementPos.top + elementPos.height / 2 - CONTENT_HEIGHT / 2
      break
  }

  // Add boundary constraints
  if (typeof window !== 'undefined') {
    const margin = 16;
    if (left < margin) left = margin;
    if (left + CONTENT_WIDTH > window.innerWidth - margin) {
      left = window.innerWidth - CONTENT_WIDTH - margin;
    }
    if (top < margin) top = margin;
    // Don't constrain bottom too aggressively as it might be scrolled
  }

  return {
    top,
    left,
    width: CONTENT_WIDTH,
    height: CONTENT_HEIGHT,
  }
}

export function TourProvider({
  children,
  onComplete,
  className,
  isTourCompleted = false,
  tourId,
}: TourProviderProps & { tourId?: string }) {
  const [steps, setSteps] = useState<TourStep[]>([])
  const [currentStep, setCurrentStep] = useState(-1)
  const [elementPosition, setElementPosition] = useState<{
    top: number
    left: number
    width: number
    height: number
  } | null>(null)
  
  const getInitialCompleted = () => {
      if (typeof window !== 'undefined') {
          try {
              if (localStorage.getItem(`tour_global_completed`) === 'true') return true;
              if (tourId && localStorage.getItem(`tour_${tourId}_completed`) === 'true') return true;
          } catch(e) {}
      }
      return isTourCompleted;
  };

  const [isCompleted, setIsCompleted] = useState(getInitialCompleted())

  const updateElementPosition = useCallback(() => {
    if (currentStep >= 0 && currentStep < steps.length) {
      const position = getElementPosition(steps[currentStep]?.selectorId ?? "")
      if (position) {
        setElementPosition(position)
      } else {
        // Fallback for missing elements
        setElementPosition({ top: window.innerHeight / 2, left: window.innerWidth / 2, width: 0, height: 0 })
      }
    }
  }, [currentStep, steps])

  useEffect(() => {
    updateElementPosition()
    let ticking = false;
    const handleScrollOrResize = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          updateElementPosition();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("resize", handleScrollOrResize, { passive: true })
    window.addEventListener("scroll", handleScrollOrResize, { passive: true })

    return () => {
      window.removeEventListener("resize", handleScrollOrResize)
      window.removeEventListener("scroll", handleScrollOrResize)
    }
  }, [updateElementPosition])

  useEffect(() => {
    // Attempt re-positioning when steps or step changes (to wait for dom)
    const timeout = setTimeout(updateElementPosition, 100);
    return () => clearTimeout(timeout);
  }, [currentStep, steps, updateElementPosition]);

  const nextStep = useCallback(async () => {
    setCurrentStep((prev) => {
      if (prev >= steps.length - 1) {
        return -1
      }
      return prev + 1
    })

    if (currentStep === steps.length - 1) {
      setIsCompleted(true);
      if (typeof window !== 'undefined') {
        localStorage.setItem(`tour_global_completed`, 'true');
        if (tourId) localStorage.setItem(`tour_${tourId}_completed`, 'true');
      }
      onComplete?.();
    }
  }, [steps.length, onComplete, currentStep])

  const previousStep = useCallback(() => {
    setCurrentStep((prev) => (prev > 0 ? prev - 1 : prev))
  }, [])

  const endTour = useCallback(() => {
    setCurrentStep(-1)
  }, [])

  const startTour = useCallback(() => {
    if (isTourCompleted) {
      return
    }
    setCurrentStep(0)
  }, [isTourCompleted])

  const handleClick = useCallback(
    (e: MouseEvent) => {
      if (
        currentStep >= 0 &&
        elementPosition &&
        steps[currentStep]?.onClickWithinArea
      ) {
        const clickX = e.clientX + window.scrollX
        const clickY = e.clientY + window.scrollY

        const isWithinBounds =
          clickX >= elementPosition.left &&
          clickX <=
            elementPosition.left +
              (steps[currentStep]?.width || elementPosition.width) &&
          clickY >= elementPosition.top &&
          clickY <=
            elementPosition.top +
              (steps[currentStep]?.height || elementPosition.height)

        if (isWithinBounds) {
          steps[currentStep].onClickWithinArea?.()
        }
      }
    },
    [currentStep, elementPosition, steps],
  )

  useEffect(() => {
    window.addEventListener("click", handleClick)
    return () => {
      window.removeEventListener("click", handleClick)
    }
  }, [handleClick])

  const setIsTourCompletedState = useCallback((completed: boolean) => {
    setIsCompleted(completed)
    if (completed && typeof window !== 'undefined') {
        try {
            localStorage.setItem(`tour_global_completed`, 'true');
            if (tourId) localStorage.setItem(`tour_${tourId}_completed`, 'true');
        } catch(e) {}
    }
  }, [tourId])

  return (
    <TourContext.Provider
      value={{
        currentStep,
        totalSteps: steps.length,
        nextStep,
        previousStep,
        endTour,
        isActive: currentStep >= 0,
        startTour,
        setSteps,
        steps,
        isTourCompleted: isCompleted,
        setIsTourCompleted: setIsTourCompletedState,
      }}
    >
      {children}
      <AnimatePresence>
        {currentStep >= 0 && elementPosition && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[1000] overflow-hidden bg-black/60 pointer-events-none"
              style={{
                clipPath: `polygon(
                  0% 0%,
                  0% 100%,
                  100% 100%,
                  100% 0%,
                  
                  ${elementPosition.left - 4}px 0%,
                  ${elementPosition.left - 4}px ${elementPosition.top - 4}px,
                  ${elementPosition.left + (steps[currentStep]?.width || elementPosition.width) + 4}px ${elementPosition.top - 4}px,
                  ${elementPosition.left + (steps[currentStep]?.width || elementPosition.width) + 4}px ${elementPosition.top + (steps[currentStep]?.height || elementPosition.height) + 4}px,
                  ${elementPosition.left - 4}px ${elementPosition.top + (steps[currentStep]?.height || elementPosition.height) + 4}px,
                  ${elementPosition.left - 4}px 0%
                )`,
              }}
            />
            {/* Click blocking overlay to prevent clicking under tour */}
            <div className="fixed inset-0 z-[999] opacity-0" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{
                position: "fixed",
                top: elementPosition.top - 4,
                left: elementPosition.left - 4,
                width: elementPosition.width + 8,
                height: elementPosition.height + 8,
              }}
              className={cn("z-[1001] border-2 border-[#109E92] rounded-[24px] pointer-events-none", className)}
            />

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{
                opacity: 1,
                y: 0,
                ...calculateContentPosition(
                  elementPosition,
                  steps[currentStep]?.position,
                ),
              }}
              transition={{
                duration: 0.3,
                ease: "easeOut",
              }}
              exit={{ opacity: 0, y: 10 }}
              style={{
                position: "fixed",
                zIndex: 1002,
                width: `min(${CONTENT_WIDTH}px, calc(100vw - 32px))`,
                maxWidth: "calc(100vw - 32px)",
              }}
              className="bg-white dark:bg-zinc-900 rounded-[24px] border border-zinc-200 dark:border-zinc-800 p-5 shadow-xl min-h-[120px] pointer-events-auto"
            >
              <div className="text-zinc-500 absolute right-5 top-4 text-xs font-semibold">
                {currentStep + 1} / {steps.length}
              </div>
              <AnimatePresence mode="wait">
                <div>
                  <motion.div
                    key={`tour-content-${currentStep}`}
                    initial={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }}
                    animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }}
                    className="overflow-hidden pt-2"
                    transition={{
                      duration: 0.2,
                      height: {
                        duration: 0.4,
                      },
                    }}
                  >
                    {steps[currentStep]?.content}
                  </motion.div>
                  <div className="mt-6 flex justify-between items-center">
                      <Button
                        onClick={() => {
                            setIsCompleted(true);
                            if (typeof window !== 'undefined') {
                              localStorage.setItem(`tour_global_completed`, 'true');
                              if (tourId) localStorage.setItem(`tour_${tourId}_completed`, 'true');
                            }
                            endTour();
                        }}
                        variant="ghost"
                        className="text-sm font-semibold text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                      >
                        Skip
                      </Button>

                    <div className="flex items-center space-x-2">
                        {currentStep > 0 && (
                          <Button
                            onClick={previousStep}
                            variant="outline"
                            disabled={currentStep === 0}
                            className="text-sm h-9 rounded-full px-4 border-zinc-200 dark:border-zinc-800 font-semibold"
                          >
                            Back
                          </Button>
                        )}
                        <Button
                          onClick={nextStep}
                          className={cn("text-sm h-9 rounded-full px-5 bg-[#109E92] hover:bg-[#0D8A7D] text-white font-bold", !currentStep && "ml-auto")}
                        >
                          {currentStep === steps.length - 1 ? "Finish" : "Next"}
                        </Button>
                    </div>
                  </div>
                </div>
              </AnimatePresence>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </TourContext.Provider>
  )
}

export function useTour() {
  const context = useContext(TourContext)
  if (!context) {
    throw new Error("useTour must be used within a TourProvider")
  }
  return context
}

export function TourAlertDialog({
  isOpen,
  setIsOpen,
}: {
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
}) {
  const { startTour, steps, isTourCompleted, currentStep, setIsTourCompleted } = useTour()

  if (isTourCompleted || steps.length === 0 || currentStep > -1) {
    return null
  }

  const handleSkip = async () => {
    setIsTourCompleted(true);
    setIsOpen(false)
  }

  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent className="w-[90vw] md:max-w-md p-6 bg-white dark:bg-zinc-900 border-none sm:rounded-[32px] rounded-[32px]">
        <AlertDialogHeader className="flex flex-col items-center justify-center">
          <div className="relative mb-4">
            <motion.div
              initial={{ scale: 0.7, filter: "blur(10px)" }}
              animate={{
                scale: 1,
                filter: "blur(0px)",
                y: [0, -8, 0],
                rotate: [42, 48, 42],
              }}
              transition={{
                duration: 0.4,
                ease: "easeOut",
                y: {
                  duration: 2.5,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                },
                rotate: {
                  duration: 3,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                },
              }}
            >
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center">
                  <Torus className="size-10 stroke-[2.5] text-[#109E92]" />
              </div>
            </motion.div>
          </div>
          <AlertDialogTitle className="text-center text-xl font-black text-zinc-900 dark:text-zinc-100">
            Welcome to the Tour
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center text-[15px] font-medium text-zinc-500 mt-2">
            Let's take a quick look around! We'll show you the most important features on this page so you know exactly where everything is.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="mt-8 space-y-3">
          <Button onClick={() => { setIsOpen(false); startTour(); }} className="w-full bg-[#109E92] hover:bg-[#0D8A7D] text-white rounded-xl h-12 text-[15px] font-bold">
            Start Tour
          </Button>
          <Button onClick={handleSkip} variant="ghost" className="w-full text-zinc-500 font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl h-12 text-[15px]">
            Skip Tour
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
