"use client";

import React, { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { 
  Plus, 
  X, 
  Share2, 
  ChevronUp,
  Play,
  Pause,
  Volume2,
  VolumeX
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "../../lib/utils";
import ReactPlayer from "react-player";
const Player: any = ReactPlayer;

interface Story {
  id: string;
  type: "image" | "video";
  category: string;
  mediaUrl: string;
  linkUrl?: string;
  audioUrl?: string;
  audioStart?: number;
  createdAt: string;
}

interface StoryViewerProps {
  stories: Story[];
  isAdmin: boolean;
}

const StoryViewer: React.FC<StoryViewerProps> = ({ stories, isAdmin }) => {
  const navigate = useNavigate();
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [currentSubIndex, setCurrentSubIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioPlayerRef = useRef<any>(null);
  const timerRef = useRef<any>(null);
  const holdTimeoutRef = useRef<any>(null);
  const isPressHold = useRef(false);

  // Group stories by category (acting as user/bucket)
  const groupedStories = React.useMemo(() => {
    const groups: { [key: string]: Story[] } = {};
    stories.forEach(story => {
      if (!groups[story.category]) groups[story.category] = [];
      groups[story.category].push(story);
    });
    return Object.entries(groups).map(([category, items]) => ({
      category,
      items: items.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    }));
  }, [stories]);

  const activeGroup = activeStoryIndex !== null ? groupedStories[activeStoryIndex] : null;
  const currentStory = activeGroup ? activeGroup.items[currentSubIndex] : null;

  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (event.reason && typeof event.reason.message === 'string' && event.reason.message.includes('play() request was interrupted')) {
        event.preventDefault();
      }
    };
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  useEffect(() => {
    if (activeStoryIndex === null || !currentStory) {
      setProgress(0);
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    if (isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const duration = currentStory.type === "video" ? 30000 : 15000;
    const interval = 50;
    
    if (timerRef.current) clearInterval(timerRef.current);
    
    timerRef.current = setInterval(() => {
      setProgress(prev => {
        const next = prev + (interval / duration) * 100;
        if (next >= 100) {
          handleNext();
          return 0;
        }
        return next;
      });
    }, interval);

    return () => clearInterval(timerRef.current);
  }, [activeStoryIndex, currentSubIndex, isPaused]);

  useEffect(() => {
    // Handling audio if present
    if (audioPlayerRef.current) {
      // react-player handles playing through the 'playing' prop natively
    }
  }, [isPaused, currentStory]);

  const handleNext = () => {
    if (activeStoryIndex === null || !activeGroup) return;

    if (currentSubIndex < activeGroup.items.length - 1) {
      setCurrentSubIndex(prev => prev + 1);
      setProgress(0);
    } else {
      // Go to next group
      if (activeStoryIndex < groupedStories.length - 1) {
        setActiveStoryIndex(prev => prev! + 1);
        setCurrentSubIndex(0);
        setProgress(0);
      } else {
        closeViewer();
      }
    }
  };

  const handlePrev = () => {
    if (activeStoryIndex === null || !activeGroup) return;

    if (currentSubIndex > 0) {
      setCurrentSubIndex(prev => prev - 1);
      setProgress(0);
    } else {
      // Go to prev group
      if (activeStoryIndex > 0) {
        setActiveStoryIndex(prev => prev! - 1);
        const prevGroup = groupedStories[activeStoryIndex - 1];
        setCurrentSubIndex(prevGroup.items.length - 1);
        setProgress(0);
      } else {
        // Just restart current story
        setProgress(0);
      }
    }
  };

  const handlePressStart = () => {
    isPressHold.current = false;
    holdTimeoutRef.current = setTimeout(() => {
      isPressHold.current = true;
      setIsPaused(true);
    }, 200);
  };

  const handlePressEnd = (e: React.PointerEvent) => {
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
    }
    if (isPressHold.current) {
      // It was a long press, so just unpause
      setIsPaused(false);
      isPressHold.current = false;
    } else {
      // It was a tap
      const x = e.clientX;
      const width = window.innerWidth;
      
      if (x < width * 0.3) {
        handlePrev();
      } else if (x > width * 0.7) {
        handleNext();
      } else {
        // Center tap
        setIsPaused(!isPaused);
      }
    }
  };

  const closeViewer = () => {
    setActiveStoryIndex(null);
    setCurrentSubIndex(0);
    setProgress(0);
    setIsPaused(false);
  };

  return (
    <div className="w-full">
      {/* Story List (Bubbles) */}
      <div className="flex items-center space-x-4 overflow-x-auto pb-4 px-1 scrollbar-hide no-scrollbar">
        {isAdmin && (
          <button 
            onClick={() => navigate("/admin/stories")}
            className="flex flex-col items-center space-y-1 group shrink-0"
          >
            <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center border-2 border-zinc-900 dark:border-zinc-100 border-dashed group-active:scale-95 transition-all">
              <Plus size={24} className="text-zinc-900 dark:text-zinc-100" />
            </div>
            <span className="text-[10px] font-bold text-zinc-500">Add Story</span>
          </button>
        )}
        
        {groupedStories.map((group, idx) => (
          <button
            key={group.category}
            onClick={() => {
              setActiveStoryIndex(idx);
              setCurrentSubIndex(0);
              setProgress(0);
            }}
            className="flex flex-col items-center space-y-1 shrink-0 group active:scale-95 transition-all"
          >
            <div className="relative p-[2.5px] rounded-full bg-gradient-to-tr from-yellow-400 via-rose-500 to-purple-600">
              <div className="w-[66px] h-[66px] rounded-full border-[2.5px] border-white dark:border-zinc-950 overflow-hidden bg-zinc-100">
                 {group.items[0].type === 'video' ? (
                   group.items[0].mediaUrl.match(/youtube\.com|youtu\.be/i) ? (
                     <img src={`https://img.youtube.com/vi/${group.items[0].mediaUrl.split('v=')[1]?.split('&')[0] || group.items[0].mediaUrl.split('/').pop()}/hqdefault.jpg`} className="w-full h-full object-cover bg-black" alt="" />
                   ) : (
                     <video src={group.items[0].mediaUrl} className="w-full h-full object-cover bg-black" muted />
                   )
                 ) : (
                   <img src={group.items[0].mediaUrl} alt="" className="w-full h-full object-cover bg-black" />
                 )}
              </div>
            </div>
            <span className="text-[10px] font-bold text-zinc-900 dark:text-zinc-100 truncate w-16 text-center">
              {group.category}
            </span>
          </button>
        ))}
      </div>

      {/* Full Screen Viewer */}
      <AnimatePresence>
        {activeStoryIndex !== null && currentStory && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="fixed inset-0 z-[200] bg-black flex items-center justify-center overflow-hidden"
          >
            <div className="relative w-full max-w-[450px] aspect-[9/16] bg-zinc-900 overflow-hidden md:rounded-2xl shadow-2xl">
              {/* Progress Bars */}
              <div className="absolute top-4 left-4 right-4 z-50 flex gap-1">
                {activeGroup?.items.map((_, i) => (
                  <div key={i} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-white transition-all duration-50 ease-linear"
                      style={{ 
                        width: i === currentSubIndex ? `${progress}%` : i < currentSubIndex ? '100%' : '0%' 
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Header */}
              <div className="absolute top-8 left-4 right-4 z-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-rose-500 flex items-center justify-center text-white text-[10px] font-bold shadow-lg">
                    {activeGroup?.category.charAt(0)}
                  </div>
                  <span className="text-white text-sm font-bold shadow-sm">{activeGroup?.category}</span>
                </div>
                <div className="flex items-center gap-2">
                   <button 
                    onClick={() => setIsMuted(!isMuted)}
                    className="p-2 text-white hover:bg-white/10 rounded-full transition-colors"
                  >
                    {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                  </button>
                   <button 
                    onClick={() => setIsPaused(!isPaused)}
                    className="p-2 text-white hover:bg-white/10 rounded-full transition-colors"
                  >
                    {isPaused ? <Play size={20} /> : <Pause size={20} />}
                  </button>
                  <button 
                    onClick={closeViewer}
                    className="p-2 text-white hover:bg-white/10 rounded-full transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Media */}
              <div 
                className="w-full h-full relative cursor-pointer"
                onContextMenu={(e) => e.preventDefault()}
                onPointerDown={handlePressStart}
                onPointerUp={handlePressEnd}
                onContextMenuCapture={(e) => { e.preventDefault(); e.stopPropagation(); }}
              >
                {isPaused && (
                  <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none">
                     <div className="p-6 bg-black/50 backdrop-blur-md rounded-full text-white shadow-xl animate-pulse">
                        <Play size={40} />
                     </div>
                  </div>
                )}
                {currentStory.type === "video" ? (
                  <div className="w-full h-full pointer-events-none">
                    {/* @ts-ignore */}
                    <Player
                      url={currentStory.mediaUrl}
                      playing={!isPaused}
                      muted={isMuted}
                      width="100%"
                      height="100%"
                      style={{ backgroundColor: 'black' }}
                      onEnded={handleNext}
                      controls={false}
                      className="absolute top-0 left-0"
                      playsinline
                      onProgress={({ played }) => setProgress(played * 100)}
                      config={{
                        file: { forceVideo: !!currentStory.mediaUrl && !currentStory.mediaUrl.match(/youtube\.com|youtu\.be|tiktok\.com|vimeo\.com/i) },
                        youtube: { playerVars: { controls: 0, showinfo: 0, modestbranding: 1, rel: 0, autoplay: 1, playsinline: 1, disablekb: 1, origin: window.location.origin } }
                      }}
                    />
                  </div>
                ) : (
                  <img 
                    src={currentStory.mediaUrl} 
                    alt="" 
                    className="w-full h-full object-contain bg-black"
                  />
                )}
                
                {currentStory.audioUrl && (
                  <div className="absolute top-[-9999px] left-[-9999px] w-[1px] h-[1px] overflow-hidden">
                    {/* @ts-ignore */}
                    <Player
                      ref={audioPlayerRef}
                      url={currentStory.audioUrl}
                      playing={!isPaused}
                      muted={isMuted}
                      width="200%"
                      height="200%"
                      onReady={(player: any) => {
                        if (currentStory.audioStart) {
                          player.seekTo(currentStory.audioStart, 'seconds');
                        }
                      }}
                      config={{
                        file: { forceAudio: !!currentStory.audioUrl && !currentStory.audioUrl.match(/youtube\.com|youtu\.be|tiktok\.com|vimeo\.com|soundcloud\.com/i) },
                        youtube: {
                          playerVars: { autoplay: 1, origin: window.location.origin }
                        }
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Info Overlay */}
              <div className="absolute bottom-24 left-6 right-6 z-40">
                 <h3 className="text-white text-xl font-bold mb-2">{currentStory.category}</h3>
                 <p className="text-white/80 text-sm">Tap to view next</p>
              </div>

              {/* CTA */}
              {currentStory.linkUrl && (
                <div className="absolute bottom-8 left-0 right-0 flex justify-center z-50">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(currentStory.linkUrl, '_blank');
                    }}
                    className="flex flex-col items-center text-white gap-1 group"
                  >
                    <div className="animate-bounce p-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
                      <ChevronUp size={20} />
                    </div>
                    <span className="text-[12px] font-bold uppercase tracking-wider group-hover:underline">Shop Now</span>
                  </button>
                </div>
              )}

              {/* Side Controls */}
              <div className="absolute right-6 bottom-32 flex flex-col gap-6 z-50">
                 <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    if (navigator.share) {
                      navigator.share({
                        title: 'Check out this story!',
                        url: currentStory?.linkUrl || window.location.href,
                      }).catch(console.error);
                    } else {
                      navigator.clipboard.writeText(currentStory?.linkUrl || window.location.href);
                    }
                  }}
                  className="flex flex-col items-center gap-1"
                 >
                   <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20">
                      <Share2 size={18} />
                   </div>
                 </button>
                 <button 
                  onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }}
                  className="flex flex-col items-center gap-1"
                >
                   <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20">
                      {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                   </div>
                 </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StoryViewer;
