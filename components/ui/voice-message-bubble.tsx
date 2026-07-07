"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Play, Pause } from "lucide-react"
import { cn } from "@/lib/utils"

interface VoiceMessageBubbleProps {
  audioSrc: string
  duration: number // in seconds
  bubbleColor?: string
  waveColor?: string
  className?: string
}

export default function VoiceMessageBubble({
  audioSrc,
  duration,
  bubbleColor = "#fff",
  waveColor = "#000",
  className,
}: VoiceMessageBubbleProps) {
  // Use state for Audio to avoid SSR issues if used in Next.js, though this is Vite.
  // Delay instantiation until mounted, or just use ref.
  const [isPlaying, setIsPlaying] = React.useState(false)
  const [progress, setProgress] = React.useState(0)
  const audioRef = React.useRef<HTMLAudioElement | null>(null)

  React.useEffect(() => {
    audioRef.current = new Audio(audioSrc)
  }, [audioSrc])

  React.useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    
    const handleTimeUpdate = () => {
      setProgress((audio.currentTime / (audio.duration || duration)) * 100)
    }

    const handleEnded = () => {
      setIsPlaying(false)
      setProgress(0)
      audio.currentTime = 0
    }

    audio.addEventListener("timeupdate", handleTimeUpdate)
    audio.addEventListener("ended", handleEnded)
    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate)
      audio.removeEventListener("ended", handleEnded)
      audio.pause()
    }
  }, [duration])

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
    } else {
      audio.play()
    }
    setIsPlaying(!isPlaying)
  }

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl shadow-sm border border-zinc-100 dark:border-zinc-800",
        className
      )}
      style={{ backgroundColor: bubbleColor }}
    >
      {/* Play/Pause Button */}
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8 rounded-full shrink-0 border-current"
        style={{ color: waveColor }}
        onClick={togglePlay}
      >
        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
      </Button>

      {/* Waveform */}
      <div className="flex-1 h-6 relative cursor-pointer flex items-center min-w-[120px]" onClick={(e) => {
        const audio = audioRef.current
        if (!audio) return

        const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
        const clickX = e.clientX - rect.left
        audio.currentTime = (clickX / rect.width) * (audio.duration || duration)
        setProgress((clickX / rect.width) * 100)
      }}>
        <div className="absolute inset-0 flex justify-between items-center px-0.5 gap-0.5">
          {Array.from({ length: 30 }).map((_, idx) => (
            <div
              key={idx}
              className="rounded-sm flex-1"
              style={{
                height: `${4 + Math.random() * 12}px`,
                backgroundColor: waveColor,
                opacity: 0.2
              }}
            />
          ))}
        </div>

        {/* Progress Overlay */}
        <div
          className="absolute top-0 left-0 h-full overflow-hidden"
          style={{ width: `${progress}%` }}
        >
          <div className="absolute inset-0 flex justify-between items-center px-0.5 gap-0.5 w-[120px] sm:w-[150px] md:w-auto min-w-full">
            {Array.from({ length: 30 }).map((_, idx) => (
              <div
                key={`prog-${idx}`}
                className="rounded-sm flex-1"
                style={{
                  height: `${4 + Math.random() * 12}px`,
                  backgroundColor: waveColor,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Duration */}
      <span className="text-xs font-medium shrink-0" style={{ color: waveColor }}>
        {Math.round(duration)}s
      </span>
    </div>
  )
}
