import React, { useEffect, useState } from 'react'
import { motion, useAnimation } from 'framer-motion'
import { PackageSearch } from 'lucide-react'

interface GridConfig {
    numCards: number
    cols: number
    xBase: number
    yBase: number
    xStep: number
    yStep: number
}

const AnimatedLoadingSkeleton = () => {
    const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024)
    const controls = useAnimation()

    const getGridConfig = (width: number): GridConfig => {
        const numCards = 6
        const cols = width >= 1024 ? 3 : width >= 640 ? 2 : 1
        return {
            numCards,
            cols,
            xBase: 40,
            yBase: 60,
            xStep: 210,
            yStep: 230
        }
    }

    const generateSearchPath = (config: GridConfig) => {
        const { numCards, cols, xBase, yBase, xStep, yStep } = config
        const rows = Math.ceil(numCards / cols)
        let allPositions = []

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                if ((row * cols + col) < numCards) {
                    allPositions.push({
                        x: xBase + (col * xStep),
                        y: yBase + (row * yStep)
                    })
                }
            }
        }

        const numRandomCards = 4
        const shuffledPositions = allPositions
            .sort(() => Math.random() - 0.5)
            .slice(0, numRandomCards)

        if (shuffledPositions.length > 0) {
            shuffledPositions.push(shuffledPositions[0])
        }

        return {
            x: shuffledPositions.map(pos => pos.x),
            y: shuffledPositions.map(pos => pos.y),
            scale: Array(shuffledPositions.length).fill(1.2),
            transition: {
                duration: shuffledPositions.length * 2,
                repeat: Infinity,
                ease: [0.4, 0, 0.2, 1],
                times: shuffledPositions.length > 0 ? shuffledPositions.map((_, i) => i / (shuffledPositions.length - 1)) : []
            }
        }
    }

    useEffect(() => {
        setWindowWidth(window.innerWidth)
        const handleResize = () => setWindowWidth(window.innerWidth)
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    useEffect(() => {
        const config = getGridConfig(windowWidth)
        controls.start(generateSearchPath(config))
    }, [windowWidth, controls])

    const frameVariants = {
        hidden: { opacity: 0, scale: 0.95 },
        visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } }
    }

    const cardVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: (i: number) => ({
            y: 0,
            opacity: 1,
            transition: { delay: i * 0.1, duration: 0.4 }
        })
    }

    const glowVariants = {
        animate: {
            boxShadow: [
                "0 0 20px rgba(16, 185, 129, 0.2)",
                "0 0 35px rgba(16, 185, 129, 0.4)",
                "0 0 20px rgba(16, 185, 129, 0.2)"
            ],
            scale: [1, 1.1, 1],
            transition: {
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
            }
        }
    }

    const config = getGridConfig(windowWidth)

    return (
        <motion.div
            className="w-full max-w-4xl mx-auto p-4 sm:p-6 bg-white dark:bg-[#121212] rounded-xl shadow-lg border border-zinc-100 dark:border-zinc-800/80"
            variants={frameVariants}
            initial="hidden"
            animate="visible"
        >
            <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900/50 dark:to-[#121212] p-4 sm:p-8 border border-zinc-100 dark:border-zinc-800/80">
                <motion.div
                    className="absolute z-10 pointer-events-none hidden sm:block"
                    animate={controls}
                    style={{ left: 24, top: 24 }}
                >
                    <motion.div
                        className="bg-zinc-900/20 dark:bg-zinc-100/20 p-3 rounded-full backdrop-blur-md border border-zinc-900/30 dark:border-zinc-100/30"
                        variants={glowVariants}
                        animate="animate"
                    >
                        <PackageSearch className="w-6 h-6 text-zinc-900 dark:text-zinc-100" />
                    </motion.div>
                </motion.div>

                <div className="flex flex-col items-center justify-center mb-8 gap-3 sm:hidden">
                    <motion.div 
                        className="bg-zinc-900/20 dark:bg-zinc-100/20 p-4 rounded-full"
                        animate={{ 
                            scale: [1, 1.1, 1],
                            opacity: [0.7, 1, 0.7]
                        }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        <PackageSearch className="w-8 h-8 text-zinc-900 dark:text-zinc-100" />
                    </motion.div>
                    <h3 className="text-lg font-medium text-zinc-900 dark:text-white animate-pulse">Loading premium phones & devices...</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(config.numCards)].map((_, i) => (
                        <motion.div
                            key={i}
                            variants={cardVariants}
                            initial="hidden"
                            animate="visible"
                            custom={i}
                            className="bg-white dark:bg-zinc-900/80 rounded-xl shadow-sm p-4 border border-zinc-100 dark:border-zinc-800/80"
                        >
                            <motion.div
                                className="aspect-[4/5] bg-zinc-200/50 dark:bg-zinc-800/50 rounded-lg mb-4"
                                animate={{
                                    background: ["var(--tw-colors-zinc-200)", "var(--tw-colors-zinc-300)", "var(--tw-colors-zinc-200)"],
                                    opacity: [0.5, 0.8, 0.5]
                                }}
                                transition={{ duration: 2, repeat: Infinity }}
                            />
                            <motion.div
                                className="h-4 w-3/4 bg-zinc-200/50 dark:bg-zinc-800/50 rounded mb-2"
                                animate={{ opacity: [0.5, 0.8, 0.5] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            />
                            <motion.div
                                className="h-3 w-1/2 bg-zinc-200/50 dark:bg-zinc-800/50 rounded"
                                animate={{ opacity: [0.5, 0.8, 0.5] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            />
                        </motion.div>
                    ))}
                </div>
            </div>
        </motion.div>
    )
}

export default AnimatedLoadingSkeleton
