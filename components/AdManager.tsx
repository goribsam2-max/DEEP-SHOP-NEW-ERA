import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, getDoc, collection, getDocs, runTransaction } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useNotify } from '../components/Notifications';
import { X, Play, Pause, Volume2, VolumeX, RotateCcw, RotateCw, Info, ExternalLink, Sparkles, ShoppingBag } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';

export const AdManager: React.FC = () => {
  const [videoAds, setVideoAds] = useState<any[]>([]);
  const [photoAds, setPhotoAds] = useState<any[]>([]);
  
  const [activeVideoAd, setActiveVideoAd] = useState<any>(null);
  const [activePhotoAd, setActivePhotoAd] = useState<any>(null);
  
  const [showVideo, setShowVideo] = useState(false);
  const [showPhoto, setShowPhoto] = useState(false);

  // Video Ad States
  const [currentVideoMediaIndex, setCurrentVideoMediaIndex] = useState(0);
  const [videoCountdown, setVideoCountdown] = useState(5);
  const [showCloseButton, setShowCloseButton] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [isSponsoredExpanded, setIsSponsoredExpanded] = useState(false);
  
  const [videoProgress, setVideoProgress] = useState(0);

  const [userRegion, setUserRegion] = useState<string>('');
  const [shoppableData, setShoppableData] = useState<any[]>([]);

  const [showCenterFeedback, setShowCenterFeedback] = useState<'play' | 'pause' | null>(null);
  const [feedbackKey, setFeedbackKey] = useState(0);
  const feedbackTimeoutRef = useRef<any>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const pageViews = useRef(0);

  const notify = useNotify();
  const watchTimeAccumulated = useRef<number>(0);

  const toSlug = (name: string) =>
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const loadShoppableProducts = async (ad: any) => {
    try {
      const querySnapshot = await getDocs(collection(db, 'products'));
      const allProducts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      let matched: any[] = [];
      
      // 1. Match by shoppableProducts (either ID or slug)
      if (ad.shoppableProducts && ad.shoppableProducts.length > 0) {
        const targetSlugsOrIds = ad.shoppableProducts.map((s: string) => s.toLowerCase().trim());
        matched = allProducts.filter((p: any) => {
          const pSlug = p.slug || (p.name ? toSlug(p.name) : '');
          return targetSlugsOrIds.includes(p.id.toLowerCase()) || targetSlugsOrIds.includes(pSlug.toLowerCase());
        });
      }
      
      // 2. If no explicit shoppableProducts but there is a targetCategory, show products from that category!
      if (matched.length === 0 && ad.targetCategory) {
        matched = allProducts.filter((p: any) => {
          return p.category && p.category.toLowerCase().trim() === ad.targetCategory.toLowerCase().trim();
        }).slice(0, 3); // Limit to top 3 products of that category
      }
      
      setShoppableData(matched);
    } catch (err) {
      console.error("Error loading shoppable products:", err);
      setShoppableData([]);
    }
  };

  // Photo Ad Carousel
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (emblaApi) {
      emblaApi.on('select', () => {
        setCurrentSlide(emblaApi.selectedScrollSnap());
      });
    }
  }, [emblaApi]);

  useEffect(() => {
    const fetchAds = async () => {
      const snap = await getDoc(doc(db, 'settings', 'ads'));
      if (snap.exists()) {
        const data = snap.data();
        let activeVideoAds = [];
        if (data.videoAds && data.videoAds.length > 0) {
          activeVideoAds = data.videoAds.filter((a: any) => a.active && a.videos?.length > 0).map((a: any, i: number) => ({...a, id: a.id || `video-${i}`}));
        } else if (data.videoAd && data.videoAd.active) {
          activeVideoAds = [{
            id: 'legacy-video',
            active: data.videoAd.active,
            videos: [{ url: data.videoAd.url, ratio: '16/9' }],
            timerDuration: 5,
            showCloseAfterVideos: 1
          }];
        }
        setVideoAds(activeVideoAds);
        
        if (data.photoAds && data.photoAds.length > 0) {
          setPhotoAds(data.photoAds.filter((a: any) => a.active).map((a: any, i: number) => ({...a, id: a.id || `photo-${i}`})));
        }
      }
    };
    fetchAds();
  }, []);

  
  useEffect(() => {
    const fetchGeo = async () => {
       const cached = sessionStorage.getItem('vibe_user_region');
       if (cached) {
         setUserRegion(cached);
         return;
       }
       try {
         const res = await fetch('https://ipapi.co/json/');
         const data = await res.json();
         const region = data.city || data.region || '';
         setUserRegion(region);
         sessionStorage.setItem('vibe_user_region', region);
       } catch(e) {}
    };
    fetchGeo();
  }, []);

  useEffect(() => {
    // Determine what to show on first load
    if (videoAds.length > 0 || photoAds.length > 0) {
      const sessionShown = sessionStorage.getItem('vibe_ad_session');
      
      if (!sessionShown) {
        setTimeout(() => {
          triggerRandomAd();
          sessionStorage.setItem('vibe_ad_session', 'true');
        }, 700); // Trigger within the first second
      }
    }
  }, [videoAds, photoAds]);

  useEffect(() => {
    // Page views tracker for triggering ads while surfing
    if (photoAds.length > 0 || videoAds.length > 0) {
      pageViews.current += 1;
      // Show ad after 4 pages
      if (pageViews.current >= 4) {
        if (!showVideo && !showPhoto) {
          triggerRandomAd();
          pageViews.current = 0; // Reset
        }
      }
    }
  }, [location.pathname]);

  useEffect(() => {
    // Show ad after 1 minute on the website
    const timer = setTimeout(() => {
       if (!showVideo && !showPhoto && !sessionStorage.getItem('vibe_1min_ad_shown')) {
         triggerRandomAd();
         sessionStorage.setItem('vibe_1min_ad_shown', 'true');
       }
    }, 60000); // 1 minute
    return () => clearTimeout(timer);
  }, [showVideo, showPhoto]);

  const recordAdAction = async (adId: string, type: 'video' | 'photo', action: 'impression' | 'conversion' | 'close', watchTime?: number) => {
    try {
      await fetch('/api/ads/record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adId, type, action, watchTime })
      });
    } catch (e) {}
  };

  const selectBestAd = (ads: any[]) => {
    // Geo Filtering
    let filteredAds = ads.filter(ad => {
       if (ad.targetRegion && userRegion) {
          return userRegion.toLowerCase().includes(ad.targetRegion.toLowerCase());
       }
       return true;
    });
    
    if (filteredAds.length === 0) return null;
    
    // Category Targeting Boost
    const favoriteCategory = localStorage.getItem('vibe_favorite_category') || '';
    
    // Epsilon-greedy A/B test selection: 20% random (explore), 80% best conversion rate (exploit)
    const explore = Math.random() < 0.2;
    if (explore) {
      return filteredAds[Math.floor(Math.random() * filteredAds.length)];
    }
    
    let bestAd = filteredAds[0];
    let bestScore = -1;
    
    filteredAds.forEach(ad => {
      const impressions = ad.impressions || 0;
      const conversions = ad.conversions || 0;
      let rate = impressions > 0 ? (conversions / impressions) : 0;
      
      // Boost rate if category matches
      if (ad.targetCategory && favoriteCategory && ad.targetCategory.toLowerCase() === favoriteCategory.toLowerCase()) {
         rate += 0.5; // Significant boost for behavioral match
      }
      
      if (rate > bestScore) {
        bestScore = rate;
        bestAd = ad;
      }
    });
    
    return bestAd;
  };

  const triggerRandomAd = () => {
    const now = Date.now();
    // Using 1-hour cooldown instead of 24-hours
    const shownAdsStr = localStorage.getItem('vibe_shown_ads_1h');
    let shownAds: Record<string, number> = {};
    if (shownAdsStr) {
      try {
        shownAds = JSON.parse(shownAdsStr);
      } catch (e) {}
    }

    // Filter out ads shown in the last 1 hour (1 * 60 * 60 * 1000 ms)
    const availableVideoAds = videoAds.filter(ad => !shownAds[ad.id] || now - shownAds[ad.id] > 1 * 60 * 60 * 1000);
    const availablePhotoAds = photoAds.filter(ad => !shownAds[ad.id] || now - shownAds[ad.id] > 1 * 60 * 60 * 1000);

    const types = [];
    if (availableVideoAds.length > 0) types.push('video');
    if (availablePhotoAds.length > 0) types.push('photo');
    
    if (types.length === 0) return; // All ads are on cooldown
    
    const selectedType = types[Math.floor(Math.random() * types.length)];
    
    if (selectedType === 'video') {
      const ad = selectBestAd(availableVideoAds);
      if (!ad) return;
      setActiveVideoAd(ad);
      setCurrentVideoMediaIndex(0);
      setVideoCountdown(ad.timerDuration !== undefined ? ad.timerDuration : 5);
      setShowCloseButton(ad.showCloseAfterVideos <= 1 && (ad.timerDuration === 0 || !ad.timerDuration));
      setIsVideoLoaded(false);
      setIsSponsoredExpanded(false);
      setVideoProgress(0); // Reset video progress
      setShowVideo(true);
      watchTimeAccumulated.current = 0; // Reset cumulative watch time
      
      recordAdAction(ad.id, 'video', 'impression');

      loadShoppableProducts(ad);
      
      // Mark as shown
      shownAds[ad.id] = now;
      localStorage.setItem('vibe_shown_ads_1h', JSON.stringify(shownAds));
    } else {
      const ad = selectBestAd(availablePhotoAds);
      if (!ad) return;
      const migratedAd = {
        ...ad,
        images: ad.images || (ad.image ? [{ url: ad.image, ratio: '4/3' }] : [])
      };
      setActivePhotoAd(migratedAd);
      setCurrentSlide(0);
      setShowPhoto(true);
      if (emblaApi) emblaApi.scrollTo(0);
      
      recordAdAction(ad.id, 'photo', 'impression');

      loadShoppableProducts(migratedAd);
      
      // Mark as shown
      shownAds[ad.id] = now;
      localStorage.setItem('vibe_shown_ads_1h', JSON.stringify(shownAds));
    }
  };

  // Explicit Autoplay Handler
  useEffect(() => {
    if (showVideo && videoRef.current && isVideoLoaded) {
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          setIsPlaying(true);
        }).catch(error => {
          console.log("Autoplay prevented or interrupted:", error);
          // If unmuted autoplay was blocked, automatically mute and play
          if (!isMuted) {
            setIsMuted(true);
            if (videoRef.current) {
              videoRef.current.muted = true;
              videoRef.current.play().then(() => {
                setIsPlaying(true);
              }).catch(e => {
                console.error("Muted autoplay fallback failed:", e);
              });
            }
          }
        });
      }
    }
  }, [showVideo, currentVideoMediaIndex, isVideoLoaded]);

  // Video Timer logic
  useEffect(() => {
    let timer: any;
    if (showVideo && activeVideoAd && isVideoLoaded && isPlaying) {
      if (!showCloseButton) {
        const threshold = activeVideoAd.showCloseAfterVideos || 1;
        if (currentVideoMediaIndex + 1 >= threshold) {
          if (videoCountdown > 0) {
            timer = setInterval(() => {
              setVideoCountdown(prev => {
                if (prev <= 1) {
                  setShowCloseButton(true);
                  return 0;
                }
                return prev - 1;
              });
            }, 1000);
          } else {
             setShowCloseButton(true);
          }
        }
      }
    }
    return () => clearInterval(timer);
  }, [showVideo, activeVideoAd, videoCountdown, currentVideoMediaIndex, showCloseButton, isVideoLoaded, isPlaying]);

  const handleVideoEnded = () => {
    if (videoRef.current) {
      watchTimeAccumulated.current += videoRef.current.currentTime;
    }
    if (activeVideoAd && currentVideoMediaIndex < activeVideoAd.videos.length - 1) {
      setCurrentVideoMediaIndex(prev => prev + 1);
      setIsVideoLoaded(false);
    } else {
       // All videos ended
       setShowCloseButton(true);
       if (activeVideoAd && !activeVideoAd._conversionRecorded) {
         recordAdAction(activeVideoAd.id, 'video', 'conversion');
         activeVideoAd._conversionRecorded = true;
       }
       
       // Reward Watch-to-Earn
       if (activeVideoAd.rewardCoins && activeVideoAd.rewardCoins > 0 && activeVideoAd.timerDuration > 0) {
          const user = auth.currentUser;
          if (user && !activeVideoAd._rewardGiven) {
            activeVideoAd._rewardGiven = true;
            const userRef = doc(db, 'users', user.uid);
            runTransaction(db, async (t) => {
               const userSnap = await t.get(userRef);
               if (!userSnap.exists()) return;
               const currentCoins = userSnap.data().coins || 0;
               t.update(userRef, { coins: currentCoins + activeVideoAd.rewardCoins });
            }).then(() => {
               notify(`Earned ${activeVideoAd.rewardCoins} coins for watching!`, 'success');
            }).catch(console.error);
          }
       }
    }
  };

  const triggerCenterFeedback = (type: 'play' | 'pause') => {
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    setShowCenterFeedback(type);
    setFeedbackKey(prev => prev + 1);
    feedbackTimeoutRef.current = setTimeout(() => {
      setShowCenterFeedback(null);
    }, 600);
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        triggerCenterFeedback('pause');
      } else {
        videoRef.current.play();
        triggerCenterFeedback('play');
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVideoClick = (e: React.MouseEvent) => {
    // If clicking on buttons or controls, don't trigger play/pause
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('.player-controls')) {
      return;
    }
    togglePlay();
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const skip = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds;
    }
  };

  const closeVideo = () => {
    if (!showCloseButton) return;
    if (videoRef.current && activeVideoAd) {
      videoRef.current.pause();
      const totalSessionWatchTime = watchTimeAccumulated.current + videoRef.current.currentTime;
      recordAdAction(activeVideoAd.id, 'video', 'close', totalSessionWatchTime);
    }
    setShowVideo(false);
    setVideoProgress(0);
    setShowCenterFeedback(null);
    watchTimeAccumulated.current = 0; // Reset
  };

  const closePhoto = () => {
    setShowPhoto(false);
  };

  const getRatioStyle = (ratio: string) => {
    if (!ratio || ratio === 'auto') return undefined;
    // ratio is '1/1', '4/3', '16/9', etc.
    return { aspectRatio: ratio };
  };

  return (
    <>
      {/* Video Ad Popup */}
      <AnimatePresence>
        {showVideo && activeVideoAd && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-black rounded-3xl overflow-hidden shadow-2xl border border-zinc-800 relative max-w-3xl w-full"
            >
              {/* Header Info Area */}
              {activeVideoAd.isSponsored && (
                <div className="absolute top-4 left-4 z-50">
                  <motion.button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsSponsoredExpanded(!isSponsoredExpanded);
                    }}
                    layout
                    className="bg-black/85 hover:bg-black/95 backdrop-blur-md text-white text-[11px] font-bold h-8 px-2.5 rounded-full flex items-center gap-1.5 shadow-lg border border-white/10 tracking-wider uppercase transition-colors"
                  >
                    <Info className="w-3.5 h-3.5" />
                    <AnimatePresence initial={false} mode="wait">
                      {isSponsoredExpanded && (
                        <motion.span
                          initial={{ width: 0, opacity: 0 }}
                          animate={{ width: "auto", opacity: 1 }}
                          exit={{ width: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="whitespace-nowrap overflow-hidden inline-block"
                        >
                          Sponsored
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                </div>
              )}

              <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
                {!showCloseButton ? (
                   <div className="bg-black/50 backdrop-blur-md text-white text-xs font-bold px-4 py-2 rounded-full border border-white/10">
                     {(activeVideoAd.showCloseAfterVideos > currentVideoMediaIndex + 1) ? 
                        `Video ${currentVideoMediaIndex + 1}/${activeVideoAd.videos.length}` 
                        : `Skip in ${videoCountdown}s`
                     }
                   </div>
                ) : (
                  <button 
                    onClick={closeVideo}
                    className="bg-[#1cdb5e] hover:bg-[#18c253] text-black p-2.5 rounded-full transition-all shadow-[0_0_15px_rgba(28,219,94,0.4)] active:scale-95"
                  >
                    <X className="w-5 h-5 font-bold" />
                  </button>
                )}
              </div>

              {/* Interactive Multi-clip Selector */}
              {activeVideoAd.videos.length > 1 && (
                <div className="absolute top-16 left-4 z-50 flex flex-col gap-2 max-w-[150px] sm:max-w-[200px]">
                  <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest bg-black/50 backdrop-blur-md px-2 py-1 rounded border border-white/5 w-fit">
                    Select Part:
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {activeVideoAd.videos.map((vid: any, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => {
                          if (videoRef.current) {
                            watchTimeAccumulated.current += videoRef.current.currentTime;
                          }
                          setCurrentVideoMediaIndex(idx);
                          setIsVideoLoaded(false);
                          setVideoProgress(0);
                        }}
                        className={`text-left text-xs font-bold px-3 py-1.5 rounded-lg border backdrop-blur-md transition-all ${
                          idx === currentVideoMediaIndex
                            ? 'bg-[#1cdb5e] text-black border-[#1cdb5e] shadow-[0_0_12px_rgba(28,219,94,0.3)] scale-[1.03]'
                            : 'bg-black/60 text-white border-zinc-800 hover:bg-zinc-800/80 hover:border-zinc-700'
                        }`}
                      >
                        {vid.label || `Clip ${idx + 1}`}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div 
                className="relative w-full bg-black flex items-center justify-center min-h-[220px] cursor-pointer group"
                onClick={handleVideoClick}
                style={getRatioStyle(activeVideoAd.videos[currentVideoMediaIndex]?.ratio)}
              >
                {!isVideoLoaded && (
                   <div className="absolute inset-0 bg-zinc-950 flex items-center justify-center z-20">
                      <div className="w-10 h-10 border-4 border-zinc-800 border-t-[#1cdb5e] rounded-full animate-spin"></div>
                   </div>
                )}
                
                <video 
                  key={currentVideoMediaIndex} // Force remount on source change
                  ref={videoRef}
                  src={activeVideoAd.videos[currentVideoMediaIndex]?.url}
                  autoPlay
                  muted={isMuted}
                  onCanPlay={() => setIsVideoLoaded(true)}
                  onTimeUpdate={() => {
                    if (videoRef.current) {
                      setVideoProgress((videoRef.current.currentTime / videoRef.current.duration) * 100 || 0);
                    }
                  }}
                  playsInline
                  className={`w-full h-full object-cover transition-opacity duration-300 ${isVideoLoaded ? "opacity-100" : "opacity-0"}`}
                  onEnded={handleVideoEnded}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />

                {/* Centered Play/Pause Ripple Feedback */}
                <AnimatePresence mode="popLayout">
                  {showCenterFeedback && (
                    <motion.div
                      key={`${showCenterFeedback}-${feedbackKey}`}
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: [0.5, 1.1, 1], opacity: [0, 1, 1] }}
                      exit={{ scale: 1.3, opacity: 0 }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                      className="absolute flex items-center justify-center bg-black/60 backdrop-blur-md border border-white/10 p-5 rounded-full z-30 pointer-events-none"
                    >
                      {showCenterFeedback === 'play' ? (
                        <Play className="w-8 h-8 text-[#1cdb5e]" fill="currentColor" />
                      ) : (
                        <Pause className="w-8 h-8 text-white" fill="currentColor" />
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>


                
                {/* Persistent Mute Button */}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleMute();
                  }}
                  className="absolute bottom-4 right-4 z-50 text-white bg-black/60 backdrop-blur-md p-2.5 rounded-full hover:bg-black/80 transition border border-white/5 active:scale-90"
                >
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>

                {/* Custom Player Controls overlay */}
                {shoppableData.length > 0 && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-50">
              {shoppableData.map(product => {
                const imgUrl = product.images?.[0] || product.image || '';
                const price = product.price || 0;
                const name = product.name || product.title || '';
                return (
                  <div key={product.id} className="w-20 h-24 bg-white/10 backdrop-blur-md rounded-xl overflow-hidden shadow-lg border border-white/20 flex flex-col group relative items-center justify-between p-1">
                    <img 
                      src={imgUrl} 
                      onClick={() => {
                        const pSlug = product.slug || (name ? toSlug(name) : '');
                        const url = pSlug ? `/product/${pSlug}/${product.id}` : `/product/${product.id}`;
                        window.open(url, '_blank');
                      }} 
                      className="w-14 h-14 object-cover rounded-lg cursor-pointer" 
                      alt="" 
                    />
                    <button onClick={(e) => {
                       e.stopPropagation();
                       if (!activeVideoAd?._conversionRecorded) {
                          recordAdAction(activeVideoAd!.id, 'video', 'conversion');
                          activeVideoAd!._conversionRecorded = true;
                       }
                       // Add to cart logic
                       let cart = JSON.parse(localStorage.getItem("f_cart") || "[]");
                       const existing = cart.find((i: any) => i.id === product.id);
                       if (existing) {
                          existing.quantity += 1;
                       } else {
                          cart.push({
                             id: product.id,
                             title: name,
                             price: price,
                             image: imgUrl,
                             quantity: 1,
                             slug: product.slug || (name ? toSlug(name) : '')
                          });
                       }
                       localStorage.setItem("f_cart", JSON.stringify(cart));
                       window.dispatchEvent(new Event("update_cart"));
                       notify('Added to cart!', 'success');
                    }} className="w-full bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-bold py-1 rounded-md transition-colors flex items-center justify-center gap-1">
                      <ShoppingBag className="w-3 h-3" /> Add
                    </button>
                  </div>
                );
              })}
            </div>
          )}
          <div className="player-controls absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 hover:opacity-100 transition-opacity flex flex-col justify-end p-6 z-30">
                  <div className="flex items-center justify-center gap-6 mb-4">
                    <button 
                      onClick={(e) => { e.stopPropagation(); skip(-5); }} 
                      className="text-white hover:text-[#1cdb5e] transition active:scale-95"
                    >
                      <RotateCcw className="w-7 h-7" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); togglePlay(); }} 
                      className="text-white bg-white/10 p-3 rounded-full hover:bg-white/20 transition active:scale-90 border border-white/5"
                    >
                      {isPlaying ? <Pause className="w-6 h-6" fill="currentColor" /> : <Play className="w-6 h-6" fill="currentColor" />}
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); skip(5); }} 
                      className="text-white hover:text-[#1cdb5e] transition active:scale-95"
                    >
                      <RotateCw className="w-7 h-7" />
                    </button>
                  </div>
                  <div className="flex justify-between items-center">
                     <div></div>
                     <div className="text-white text-[11px] font-bold bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full border border-white/5">
                       {currentVideoMediaIndex + 1} / {activeVideoAd.videos.length}
                     </div>
                  </div>
                </div>

                {/* Dynamic Bottom Progress Seekbar */}
                {isVideoLoaded && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-800/40 overflow-hidden z-40">
                    <div 
                      className="h-full bg-gradient-to-r from-[#1cdb5e] to-emerald-400 transition-all duration-100 ease-linear shadow-[0_0_8px_#1cdb5e]"
                      style={{ width: `${videoProgress}%` }}
                    />
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Photo Ad Popup (New Design) */}
      <AnimatePresence>
        {showPhoto && activePhotoAd && (
          <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-[320px] overflow-hidden shadow-2xl flex flex-col items-center border border-transparent dark:border-zinc-800"
            >
              {activePhotoAd.images && activePhotoAd.images.length > 0 && (
                <div className="w-full relative overflow-hidden" ref={emblaRef}>
                  <div className="flex">
                    {activePhotoAd.images.map((img: any, idx: number) => (
                      <div 
                        key={idx} 
                        className="flex-[0_0_100%] min-w-0 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center min-h-[200px]"
                        style={getRatioStyle(img.ratio)}
                      >
                        <img src={img.url} alt={`Promo ${idx}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="px-6 pt-6 pb-4 text-center w-full">
                {activePhotoAd.title && (
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-2 tracking-tight" dangerouslySetInnerHTML={{__html: activePhotoAd.title}} />
                )}
                {activePhotoAd.text && (
                  <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-4 leading-relaxed" dangerouslySetInnerHTML={{__html: activePhotoAd.text}} />
                )}

                {/* Pagination Dots */}
                {activePhotoAd.images && activePhotoAd.images.length > 1 && (
                  <div className="flex justify-center gap-1.5 mb-6">
                    {activePhotoAd.images.map((_: any, index: number) => (
                      <div 
                        key={index} 
                        className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${index === currentSlide ? 'bg-zinc-800 dark:bg-zinc-200 scale-125' : 'bg-zinc-300 dark:bg-zinc-700'}`}
                      />
                    ))}
                  </div>
                )}
                
                <div className="flex w-full border-t border-zinc-100 dark:border-zinc-800 pt-1 mt-2">
                    <button 
                        onClick={closePhoto} 
                        className="flex-1 py-3 text-zinc-500 dark:text-zinc-400 font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition"
                    >
                        Cancel
                    </button>
                    {activePhotoAd.buttonText && (
                      <>
                        <div className="w-[1px] bg-zinc-100 dark:bg-zinc-800"></div>
                        <button 
                            onClick={() => {
                                closePhoto();
                                if (activePhotoAd && !activePhotoAd._conversionRecorded) {
                                  recordAdAction(activePhotoAd.id, 'photo', 'conversion');
                                  activePhotoAd._conversionRecorded = true;
                                }
                                if (activePhotoAd.buttonLink) {
                                  if (activePhotoAd.buttonLink.startsWith('http')) {
                                    window.open(activePhotoAd.buttonLink, '_blank');
                                  } else {
                                    navigate(activePhotoAd.buttonLink);
                                  }
                                }
                            }}
                            className="flex-1 py-3 text-[#1cdb5e] font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition"
                        >
                            {activePhotoAd.buttonText}
                        </button>
                      </>
                    )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

