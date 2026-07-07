import React, { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { useNotify } from "../../components/Notifications";
import { Save, Plus, Trash2, Image as ImageIcon, Film, BarChart3, TrendingUp, Users, Clock, Percent, MapPin, Tag } from "lucide-react";
import { uploadToImgbb } from "../../services/imgbb";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area } from "recharts";

interface AdMedia {
  url: string;
  ratio: string;
}

interface VideoAdConfig {
  id: string;
  active: boolean;
  videos: AdMedia[];
  timerDuration: number;
  showCloseAfterVideos: number;
  targetCategory?: string;
  targetRegion?: string;
  rewardCoins?: number;
  shoppableProducts?: string[];
  isSponsored?: boolean;
}

interface PhotoAdConfig {
  id: string;
  active: boolean;
  images: AdMedia[];
  title: string;
  text: string;
  buttonText: string;
  buttonLink: string;
  targetCategory?: string;
  targetRegion?: string;
  shoppableProducts?: string[];
}

const RATIO_OPTIONS = [
  { label: 'Auto (Original)', value: 'auto' },
  { label: '1:1 (Square)', value: '1/1' },
  { label: '4:3 (Landscape)', value: '4/3' },
  { label: '3:4 (Portrait)', value: '3/4' },
  { label: '16:9 (Widescreen)', value: '16/9' },
  { label: '9:16 (Vertical/Reels)', value: '9/16' },
];

const ManageAds: React.FC = () => {
  const [videoAds, setVideoAds] = useState<VideoAdConfig[]>([]);
  const [photoAds, setPhotoAds] = useState<PhotoAdConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'campaigns' | 'analytics'>('campaigns');
  const [analyticsData, setAnalyticsData] = useState<Record<string, any>>({});
  const [selectedAdId, setSelectedAdId] = useState<string>('');
  const notify = useNotify();

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch("/api/ads/analytics");
        if (res.ok) {
          const data = await res.json();
          setAnalyticsData(data);
        }
      } catch (err) {
        console.error("Failed to load ads analytics:", err);
      }
    };
    fetchAnalytics();
  }, []);

  useEffect(() => {
    const fetchAds = async () => {
      const snap = await getDoc(doc(db, "settings", "ads"));
      if (snap.exists()) {
        const data = snap.data();
        if (data.videoAds) {
          setVideoAds(data.videoAds);
          if (data.videoAds.length > 0) {
            setSelectedAdId(data.videoAds[0].id);
          }
        } else if (data.videoAd) {
          setVideoAds([{
            id: 'legacy-video',
            active: data.videoAd.active,
            videos: [{ url: data.videoAd.url, ratio: '16/9' }],
            timerDuration: 5,
            showCloseAfterVideos: 1
          }]);
        }

        if (data.photoAds) {
          const migrated = data.photoAds.map((ad: any) => ({
            ...ad,
            images: ad.images || (ad.image ? [{ url: ad.image, ratio: '4/3' }] : []),
          }));
          setPhotoAds(migrated);
        }
      }
    };
    fetchAds();
  }, []);

  const saveAds = async () => {
    setLoading(true);
    try {
      await setDoc(doc(db, "settings", "ads"), {
        videoAds,
        photoAds
      });
      notify("Ads settings saved", "success");
    } catch (err) {
      notify("Failed to save ads settings", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleMediaUpload = async (file: File) => {
    try {
      const url = await uploadToImgbb(file);
      return url || null;
    } catch (error) {
      notify("Upload failed", "error");
      return null;
    }
  };

  // Video Ads Functions
  const addVideoAd = () => {
    setVideoAds([...videoAds, {
      id: Date.now().toString(),
      active: true,
      videos: [{ url: '', ratio: '16/9' }],
      timerDuration: 5,
      showCloseAfterVideos: 1,
      isSponsored: false
    }]);
  };

  const updateVideoAd = (index: number, field: keyof VideoAdConfig, value: any) => {
    const newAds = [...videoAds];
    newAds[index] = { ...newAds[index], [field]: value };
    setVideoAds(newAds);
  };

  const removeVideoAd = (index: number) => {
    const newAds = [...videoAds];
    newAds.splice(index, 1);
    setVideoAds(newAds);
  };

  const addMediaToVideoAd = (adIndex: number) => {
    const newAds = [...videoAds];
    newAds[adIndex].videos.push({ url: '', ratio: '16/9' });
    setVideoAds(newAds);
  };

  const updateVideoMedia = (adIndex: number, mediaIndex: number, field: keyof AdMedia, value: string) => {
    const newAds = [...videoAds];
    newAds[adIndex].videos[mediaIndex] = { ...newAds[adIndex].videos[mediaIndex], [field]: value };
    setVideoAds(newAds);
  };

  const removeVideoMedia = (adIndex: number, mediaIndex: number) => {
    const newAds = [...videoAds];
    newAds[adIndex].videos.splice(mediaIndex, 1);
    setVideoAds(newAds);
  };

  // Photo Ads Functions
  const addPhotoAd = () => {
    setPhotoAds([...photoAds, {
      id: Date.now().toString(),
      active: true,
      images: [{ url: '', ratio: '4/3' }],
      title: "",
      text: "",
      buttonText: "",
      buttonLink: ""
    }]);
  };

  const updatePhotoAd = (index: number, field: keyof PhotoAdConfig, value: any) => {
    const newAds = [...photoAds];
    newAds[index] = { ...newAds[index], [field]: value };
    setPhotoAds(newAds);
  };

  const removePhotoAd = (index: number) => {
    const newAds = [...photoAds];
    newAds.splice(index, 1);
    setPhotoAds(newAds);
  };

  const addMediaToPhotoAd = (adIndex: number) => {
    const newAds = [...photoAds];
    newAds[adIndex].images.push({ url: '', ratio: '4/3' });
    setPhotoAds(newAds);
  };

  const updatePhotoMedia = async (adIndex: number, mediaIndex: number, field: keyof AdMedia, value: string, file?: File) => {
    const newAds = [...photoAds];
    if (file) {
      newAds[adIndex].images[mediaIndex].url = "Uploading...";
      setPhotoAds([...newAds]);
      const url = await handleMediaUpload(file);
      if (url) {
        newAds[adIndex].images[mediaIndex].url = url;
      } else {
        newAds[adIndex].images[mediaIndex].url = "";
      }
    } else {
      newAds[adIndex].images[mediaIndex] = { ...newAds[adIndex].images[mediaIndex], [field]: value };
    }
    setPhotoAds(newAds);
  };

  const removePhotoMedia = (adIndex: number, mediaIndex: number) => {
    const newAds = [...photoAds];
    newAds[adIndex].images.splice(mediaIndex, 1);
    setPhotoAds(newAds);
  };

  return (
    <div className="space-y-6 px-1 sm:px-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
        <div>
          <h2 className="text-2xl font-bold">Promotions & Advertising</h2>
          <p className="text-xs text-zinc-500 mt-1">Configure shoppable video ads, geo-targeted photo campaigns, and trace real-time viewer engagement analytics.</p>
        </div>
        {activeTab === 'campaigns' && (
          <button
            onClick={saveAds}
            disabled={loading}
            className="w-full md:w-auto bg-black dark:bg-white text-white dark:text-black px-6 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-80 disabled:opacity-50 text-sm shadow-sm transition"
          >
            {loading ? "Saving..." : <><Save className="w-4 h-4" /> Save All Configs</>}
          </button>
        )}
      </div>

      {/* Tabs - Horizontally scrollable on small viewports to prevent overflow */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 gap-1 overflow-x-auto whitespace-nowrap scrollbar-none pb-px">
        <button
          onClick={() => setActiveTab('campaigns')}
          className={"flex-shrink-0 px-5 py-3 font-bold text-sm border-b-2 transition-all flex items-center gap-2 " + (activeTab === 'campaigns' ? 'border-[#1cdb5e] text-[#1cdb5e]' : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200')}
        >
          <Film className="w-4 h-4" />
          Campaign Configurator
        </button>
        <button
          onClick={() => {
            setActiveTab('analytics');
            // Refresh analytics data on tab switch
            fetch("/api/ads/analytics")
              .then(res => res.ok ? res.json() : {})
              .then(data => setAnalyticsData(data))
              .catch(err => console.error(err));
          }}
          className={"flex-shrink-0 px-5 py-3 font-bold text-sm border-b-2 transition-all flex items-center gap-2 " + (activeTab === 'analytics' ? 'border-[#1cdb5e] text-[#1cdb5e]' : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200')}
        >
          <BarChart3 className="w-4 h-4" />
          Advanced Analytics Dashboard
        </button>
      </div>

      {activeTab === 'campaigns' && (
        <div className="space-y-6">
          {/* Video Ads Section */}
          <div className="bg-white dark:bg-zinc-900 p-4 sm:p-6 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-6">
               <h3 className="text-xl font-bold">Video Ads</h3>
               <button onClick={addVideoAd} className="w-full sm:w-auto bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white px-4 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-200">
                 <Plus className="w-4 h-4" /> Add Video Ad
               </button>
            </div>

            <div className="space-y-6">
              {videoAds.map((ad, adIndex) => (
                <div key={ad.id} className="p-4 sm:p-6 border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 flex flex-col gap-4">
                   {/* Clean Responsive Header for each Video Campaign - no absolute overlays */}
                   <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 border-b border-zinc-200 dark:border-zinc-800/60">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono bg-zinc-200 dark:bg-zinc-800 px-2.5 py-1 rounded-lg text-xs font-bold text-zinc-700 dark:text-zinc-300">
                          ID: {ad.id}
                        </span>
                        {ad.isSponsored && (
                          <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 px-2 py-1 rounded-lg border border-amber-200 dark:border-amber-800/30 text-[10px] font-bold">
                            Sponsored
                          </span>
                        )}
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${ad.active ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}>
                          {ad.active ? 'Active' : 'Disabled'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-zinc-500">
                        <span className="bg-white dark:bg-zinc-900 px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700">Views: {Math.max(ad.impressions || 0, analyticsData[ad.id]?.impressions || 0)}</span>
                        <span className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">Conv: {Math.max(ad.conversions || 0, analyticsData[ad.id]?.conversions || 0)} ({(Math.max(ad.impressions || 0, analyticsData[ad.id]?.impressions || 0) ? ((Math.max(ad.conversions || 0, analyticsData[ad.id]?.conversions || 0) / Math.max(ad.impressions || 0, analyticsData[ad.id]?.impressions || 0)) * 100).toFixed(1) : 0)}%)</span>
                        {((ad as any).closes > 0 || analyticsData[ad.id]?.closes > 0) && (
                           <span className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-800">
                             Avg Watch: {(Math.max((ad as any).totalWatchTime || 0, analyticsData[ad.id]?.totalWatchTime || 0) / Math.max((ad as any).closes || 0, analyticsData[ad.id]?.closes || 1)).toFixed(1)}s
                           </span>
                        )}
                        <button onClick={() => removeVideoAd(adIndex)} className="text-red-500 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition ml-auto lg:ml-2" title="Remove Campaign">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-wrap items-center gap-4">
                         <label className="flex items-center gap-2 text-sm font-bold cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={ad.active}
                              onChange={(e) => updateVideoAd(adIndex, "active", e.target.checked)}
                              className="accent-black h-4 w-4"
                            />
                            Active Promotion
                         </label>
                         <label className="flex items-center gap-2 text-sm font-bold text-amber-600 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={ad.isSponsored || false}
                              onChange={(e) => updateVideoAd(adIndex, "isSponsored", e.target.checked)}
                              className="accent-amber-500 h-4 w-4"
                            />
                            Watch-to-Earn (Sponsored)
                         </label>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                           <label className="block text-xs font-bold mb-1 text-zinc-500">Target Category (Browsing History)</label>
                           <input
                             type="text"
                             value={ad.targetCategory || ''}
                             onChange={(e) => updateVideoAd(adIndex, "targetCategory", e.target.value)}
                             className="w-full bg-white dark:bg-zinc-900 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm outline-none"
                             placeholder="e.g. Smartwatches"
                           />
                        </div>
                        <div>
                           <label className="block text-xs font-bold mb-1 text-zinc-500">Target Region / City</label>
                           <input
                             type="text"
                             value={ad.targetRegion || ''}
                             onChange={(e) => updateVideoAd(adIndex, "targetRegion", e.target.value)}
                             className="w-full bg-white dark:bg-zinc-900 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm outline-none"
                             placeholder="e.g. Dhaka"
                           />
                        </div>
                      </div>

                      <div>
                         <label className="block text-xs font-bold mb-1 text-zinc-500">Required Watch Timer (seconds)</label>
                         <input
                           type="number"
                           value={ad.timerDuration}
                           onChange={(e) => updateVideoAd(adIndex, "timerDuration", Number(e.target.value))}
                           className="w-full bg-white dark:bg-zinc-900 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm outline-none"
                         />
                      </div>

                      <div>
                         <label className="block text-xs font-bold mb-1 text-zinc-500">Reward Coins (For watch-to-earn ending)</label>
                         <input
                           type="number"
                           value={ad.rewardCoins || 0}
                           onChange={(e) => updateVideoAd(adIndex, "rewardCoins", Number(e.target.value))}
                           className="w-full bg-white dark:bg-zinc-900 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm outline-none"
                         />
                      </div>

                      <div className="md:col-span-2">
                         <label className="block text-xs font-bold mb-1 text-zinc-500">Shoppable Products Inside Video (Slugs, comma-separated)</label>
                         <input
                           type="text"
                           placeholder="e.g. apple-watch-s8, airpods-pro-2"
                           value={ad.shoppableProducts?.join(', ') || ''}
                           onChange={(e) => updateVideoAd(adIndex, "shoppableProducts", e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                           className="w-full bg-white dark:bg-zinc-900 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm outline-none"
                         />
                      </div>

                      <div className="md:col-span-2 space-y-4">
                        <div className="flex justify-between items-center">
                          <label className="text-xs font-bold text-zinc-500">Video Playlists (Fallbacks)</label>
                          <button onClick={() => addMediaToVideoAd(adIndex)} className="text-xs font-bold text-[#1cdb5e] hover:underline flex items-center gap-1">
                             <Plus className="w-3 h-3" /> Add Alternative Video
                          </button>
                        </div>

                        {ad.videos.map((media, mIndex) => (
                          <div key={mIndex} className="flex flex-col sm:flex-row gap-2 sm:items-center bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700">
                             <input
                               type="text"
                               value={media.url}
                               onChange={(e) => updateVideoMedia(adIndex, mIndex, "url", e.target.value)}
                               className="w-full sm:flex-1 bg-transparent text-sm outline-none py-1 border-b sm:border-none border-zinc-100 dark:border-zinc-800"
                               placeholder="Video File URL (e.g., direct .mp4 link)"
                             />
                             <div className="flex items-center justify-between sm:justify-start gap-2 mt-2 sm:mt-0 w-full sm:w-auto">
                               <select
                                 value={media.ratio}
                                 onChange={(e) => updateVideoMedia(adIndex, mIndex, "ratio", e.target.value)}
                                 className="bg-zinc-100 dark:bg-zinc-800 p-2 rounded-lg text-xs font-bold outline-none border-none cursor-pointer"
                               >
                                 {RATIO_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                               </select>
                               {ad.videos.length > 1 && (
                                 <button onClick={() => removeVideoMedia(adIndex, mIndex)} className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition ml-auto sm:ml-0">
                                   <Trash2 className="w-4 h-4" />
                                 </button>
                               )}
                             </div>
                          </div>
                        ))}
                      </div>
                   </div>
                </div>
              ))}
              {videoAds.length === 0 && (
                <div className="text-center py-8 text-zinc-500 text-sm">
                   No video ad campaigns defined. Click "Add Video Ad" to start.
                </div>
              )}
            </div>
          </div>

          {/* Photo Banner Ads Section */}
          <div className="bg-white dark:bg-zinc-900 p-4 sm:p-6 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-6">
               <h3 className="text-xl font-bold">Banner & Image Ads</h3>
               <button onClick={addPhotoAd} className="w-full sm:w-auto bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white px-4 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-200">
                 <Plus className="w-4 h-4" /> Add Photo Ad
               </button>
            </div>

            <div className="space-y-6">
              {photoAds.map((ad, adIndex) => (
                <div key={ad.id} className="p-4 sm:p-6 border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 flex flex-col gap-4">
                   {/* Clean Responsive Header for each Photo Campaign - no absolute overlays */}
                   <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 border-b border-zinc-200 dark:border-zinc-800/60">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono bg-zinc-200 dark:bg-zinc-800 px-2.5 py-1 rounded-lg text-xs font-bold text-zinc-700 dark:text-zinc-300">
                          ID: {ad.id}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${ad.active ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}>
                          {ad.active ? 'Active' : 'Disabled'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-zinc-500">
                        <span className="bg-white dark:bg-zinc-900 px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700">Views: {Math.max(ad.impressions || 0, analyticsData[ad.id]?.impressions || 0)}</span>
                        <span className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">Conv: {Math.max(ad.conversions || 0, analyticsData[ad.id]?.conversions || 0)} ({(Math.max(ad.impressions || 0, analyticsData[ad.id]?.impressions || 0) ? ((Math.max(ad.conversions || 0, analyticsData[ad.id]?.conversions || 0) / Math.max(ad.impressions || 0, analyticsData[ad.id]?.impressions || 0)) * 100).toFixed(1) : 0)}%)</span>
                        <button onClick={() => removePhotoAd(adIndex)} className="text-red-500 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition ml-auto lg:ml-2" title="Remove Campaign">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                         <label className="flex items-center gap-2 text-sm font-bold cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={ad.active}
                              onChange={(e) => updatePhotoAd(adIndex, "active", e.target.checked)}
                              className="accent-black h-4 w-4"
                            />
                            Active Promotion
                         </label>
                      </div>

                      <div className="md:col-span-2 space-y-4">
                        <div className="flex justify-between items-center">
                          <label className="text-xs font-bold text-zinc-500">Banner Images (Carousel fallbacks)</label>
                          <button onClick={() => addMediaToPhotoAd(adIndex)} className="text-xs font-bold text-[#1cdb5e] hover:underline flex items-center gap-1">
                             <Plus className="w-3 h-3" /> Add Alternative Image
                          </button>
                        </div>

                        {ad.images.map((media, mediaIndex) => (
                          <div key={mediaIndex} className="flex flex-col sm:flex-row gap-2 sm:items-center bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700">
                            <input
                              type="text"
                              value={media.url}
                              onChange={(e) => updatePhotoMedia(adIndex, mediaIndex, 'url', e.target.value)}
                              className="w-full sm:flex-1 bg-transparent text-sm outline-none py-1 border-b sm:border-none border-zinc-100 dark:border-zinc-800"
                              placeholder="Image URL"
                            />
                            <div className="flex items-center justify-between sm:justify-start gap-2 mt-2 sm:mt-0 w-full sm:w-auto">
                              <label className="bg-zinc-100 dark:bg-zinc-800 px-3 py-2 rounded-lg cursor-pointer flex-shrink-0 text-xs font-bold flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-700 transition">
                                Upload
                                <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && updatePhotoMedia(adIndex, mediaIndex, 'url', '', e.target.files[0])} />
                              </label>
                              <select
                                value={media.ratio}
                                onChange={(e) => updatePhotoMedia(adIndex, mediaIndex, 'ratio', e.target.value)}
                                className="bg-zinc-100 dark:bg-zinc-800 p-2 rounded-lg text-xs font-bold outline-none border-none cursor-pointer"
                              >
                                {RATIO_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                              </select>
                              {ad.images.length > 1 && (
                                <button onClick={() => removePhotoMedia(adIndex, mediaIndex)} className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition ml-auto sm:ml-0"><Trash2 className="w-4 h-4" /></button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div>
                         <label className="block text-xs font-bold mb-1 text-zinc-500">Title (HTML allowed)</label>
                         <input
                           type="text"
                           value={ad.title}
                           onChange={(e) => updatePhotoAd(adIndex, "title", e.target.value)}
                           className="w-full bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm outline-none"
                           placeholder="e.g. Special Offer!"
                         />
                      </div>

                      <div>
                         <label className="block text-xs font-bold mb-1 text-zinc-500">Button Text</label>
                         <input
                           type="text"
                           value={ad.buttonText}
                           onChange={(e) => updatePhotoAd(adIndex, "buttonText", e.target.value)}
                           className="w-full bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm outline-none"
                           placeholder="e.g. Shop Now"
                         />
                      </div>

                      <div className="md:col-span-2">
                         <label className="block text-xs font-bold mb-1 text-zinc-500">Body Text (HTML allowed for links)</label>
                         <textarea
                           value={ad.text}
                           onChange={(e) => updatePhotoAd(adIndex, "text", e.target.value)}
                           className="w-full bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm outline-none h-20"
                           placeholder="e.g. Use code <a href='/'>XYZ</a> to get 10% off!"
                         />
                      </div>

                      <div>
                         <label className="block text-xs font-bold mb-1 text-zinc-500">Button Link</label>
                         <input
                           type="text"
                           value={ad.buttonLink}
                           onChange={(e) => updatePhotoAd(adIndex, "buttonLink", e.target.value)}
                           className="w-full bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm outline-none"
                           placeholder="e.g. /all-products or https://..."
                         />
                      </div>

                      <div className="md:col-span-2 flex flex-col sm:flex-row flex-wrap items-center gap-4 mt-2 bg-zinc-100/30 dark:bg-zinc-800/20 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700">
                        <div className="w-full sm:flex-1 min-w-[200px]">
                          <label className="text-xs font-bold text-zinc-500 mb-1 block">Target Category (Behavioral):</label>
                          <input type="text" placeholder="e.g. Smartwatches" value={ad.targetCategory || ''} onChange={(e) => updatePhotoAd(adIndex, 'targetCategory', e.target.value)} className="w-full bg-white dark:bg-zinc-800 p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm outline-none" />
                        </div>
                        <div className="w-full sm:flex-1 min-w-[200px]">
                          <label className="text-xs font-bold text-zinc-500 mb-1 block">Target Region (Geo):</label>
                          <input type="text" placeholder="e.g. Dhaka" value={ad.targetRegion || ''} onChange={(e) => updatePhotoAd(adIndex, 'targetRegion', e.target.value)} className="w-full bg-white dark:bg-zinc-800 p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm outline-none" />
                        </div>
                        <div className="w-full">
                          <label className="text-xs font-bold text-zinc-500 mb-1 block">Shoppable Products (Slugs, comma separated):</label>
                          <input type="text" placeholder="e.g. apple-watch-s8, airpods-pro-2" value={ad.shoppableProducts?.join(', ') || ''} onChange={(e) => updatePhotoAd(adIndex, 'shoppableProducts', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} className="w-full bg-white dark:bg-zinc-800 p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm outline-none" />
                        </div>
                      </div>

                   </div>
                </div>
              ))}
              {photoAds.length === 0 && (
                <div className="text-center py-8 text-zinc-500 text-sm">
                   No photo ads configured. Click "Add Photo Ad" to create one.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex-shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-zinc-500 truncate">Total Impressions</p>
                <h4 className="text-xl font-bold mt-1 truncate">
                  {videoAds.reduce((acc, ad) => acc + Math.max(ad.impressions || 0, analyticsData[ad.id]?.impressions || 0), 0) +
                   photoAds.reduce((acc, ad) => acc + Math.max(ad.impressions || 0, analyticsData[ad.id]?.impressions || 0), 0)}
                </h4>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl flex-shrink-0">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-zinc-500 truncate">Total Conversions</p>
                <h4 className="text-xl font-bold mt-1 truncate">
                  {videoAds.reduce((acc, ad) => acc + Math.max(ad.conversions || 0, analyticsData[ad.id]?.conversions || 0), 0) +
                   photoAds.reduce((acc, ad) => acc + Math.max(ad.conversions || 0, analyticsData[ad.id]?.conversions || 0), 0)}
                </h4>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl flex-shrink-0">
                <Percent className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-zinc-500 truncate">Avg. Conversion Rate</p>
                <h4 className="text-xl font-bold mt-1 truncate">
                  {(() => {
                    const totalImps = videoAds.reduce((acc, ad) => acc + Math.max(ad.impressions || 0, analyticsData[ad.id]?.impressions || 0), 0) +
                                      photoAds.reduce((acc, ad) => acc + Math.max(ad.impressions || 0, analyticsData[ad.id]?.impressions || 0), 0);
                    const totalConvs = videoAds.reduce((acc, ad) => acc + Math.max(ad.conversions || 0, analyticsData[ad.id]?.conversions || 0), 0) +
                                       photoAds.reduce((acc, ad) => acc + Math.max(ad.conversions || 0, analyticsData[ad.id]?.conversions || 0), 0);
                    return totalImps ? ((totalConvs / totalImps) * 100).toFixed(1) + "%" : "0.0%";
                  })()}
                </h4>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl flex-shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-zinc-500 truncate">Avg. Watch Time</p>
                <h4 className="text-xl font-bold mt-1 truncate">
                  {(() => {
                    const totalWatch = videoAds.reduce((acc, ad) => acc + Math.max((ad as any).totalWatchTime || 0, analyticsData[ad.id]?.totalWatchTime || 0), 0);
                    const totalCloses = videoAds.reduce((acc, ad) => acc + Math.max((ad as any).closes || 0, analyticsData[ad.id]?.closes || 0), 0);
                    return totalCloses ? (totalWatch / totalCloses).toFixed(1) + "s" : "0s";
                  })()}
                </h4>
              </div>
            </div>
          </div>

          {/* Ad Selection and Retention drop-off analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-zinc-900 p-4 sm:p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 lg:col-span-1 shadow-sm flex flex-col">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-[#1cdb5e]" /> Active Video Ads
              </h3>
              <div className="space-y-3 overflow-y-auto max-h-[400px] pr-1">
                {videoAds.map(ad => {
                  const localStats = analyticsData[ad.id] || {};
                  const imps = Math.max(ad.impressions || 0, localStats.impressions || 0);
                  const convs = Math.max(ad.conversions || 0, localStats.conversions || 0);
                  const rate = imps ? ((convs / imps) * 100).toFixed(1) : '0';

                  return (
                    <button
                      key={ad.id}
                      onClick={() => setSelectedAdId(ad.id)}
                      className={"w-full text-left p-4 rounded-2xl border transition-all flex flex-col justify-between " + (selectedAdId === ad.id ? 'border-[#1cdb5e] bg-[#1cdb5e]/5 dark:bg-[#1cdb5e]/10' : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/30')}
                    >
                      <div className="flex justify-between items-center w-full mb-2 gap-2">
                        <span className="font-bold text-sm text-zinc-800 dark:text-zinc-200 truncate max-w-[150px]">Ad ID: {ad.id}</span>
                        <span className={"px-2 py-0.5 rounded text-[10px] font-bold flex-shrink-0 " + (ad.active ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500')}>
                          {ad.active ? 'Active' : 'Disabled'}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-[11px] font-medium text-zinc-500 mt-1">
                        <div>
                          <p>Views</p>
                          <p className="font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">{imps}</p>
                        </div>
                        <div>
                          <p>Convs</p>
                          <p className="font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">{convs}</p>
                        </div>
                        <div>
                          <p>Conv. %</p>
                          <p className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{rate}%</p>
                        </div>
                      </div>

                      {ad.targetRegion && (
                        <div className="mt-3 pt-2 border-t border-zinc-100 dark:border-zinc-800/50 flex items-center gap-1 text-[10px] text-zinc-400">
                          <MapPin className="w-3 h-3 text-red-400" />
                          <span>Region: <strong className="text-zinc-600 dark:text-zinc-300">{ad.targetRegion}</strong></span>
                        </div>
                      )}
                    </button>
                  );
                })}
                {videoAds.length === 0 && (
                  <p className="text-sm text-zinc-500 text-center py-6">No video ads available for analytics.</p>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-4 sm:p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 lg:col-span-2 shadow-sm flex flex-col justify-between min-h-[400px]">
              <div>
                <h3 className="text-lg font-bold mb-1">Interactive Drop-off & Retention</h3>
                <p className="text-xs text-zinc-500 mb-6">Real-time analysis identifying at exactly which second users drop off and close the video ad.</p>
              </div>

              {(() => {
                const rawCloseSeconds = analyticsData[selectedAdId]?.closeSeconds || {};
                const chartData = [];
                const maxSec = Math.max(10, ...Object.keys(rawCloseSeconds).map(Number));

                let totalRecordedCloses = 0;
                for (let s = 1; s <= maxSec; s++) {
                  const count = rawCloseSeconds[s] || 0;
                  totalRecordedCloses += count;
                  chartData.push({
                    second: s + 's',
                    closes: count
                  });
                }

                let peakSec = 0;
                let peakVal = 0;
                Object.entries(rawCloseSeconds).forEach(([s, count]) => {
                  if (Number(count) > peakVal) {
                    peakVal = Number(count);
                    peakSec = Number(s);
                  }
                });

                if (totalRecordedCloses === 0) {
                  return (
                    <div className="flex-1 flex flex-col items-center justify-center text-center py-12 text-zinc-400">
                      <Clock className="w-12 h-12 stroke-1 mb-2 text-zinc-300 dark:text-zinc-700" />
                      <p className="text-sm font-medium">No close timing data available yet</p>
                      <p className="text-xs text-zinc-500 max-w-sm mt-1">Drop-off events will be recorded second-by-second once users play and close video promotions.</p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-6 flex-1 flex flex-col justify-between">
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorCloses" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#1cdb5e" stopOpacity={0.4}/>
                              <stop offset="95%" stopColor="#1cdb5e" stopOpacity={0.0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eaeaea" className="dark:stroke-zinc-800" />
                          <XAxis dataKey="second" stroke="#888888" fontSize={11} tickLine={false} />
                          <YAxis stroke="#888888" fontSize={11} tickLine={false} />
                          <RechartsTooltip contentStyle={{ borderRadius: '12px', background: '#121212', color: '#fff', border: 'none' }} />
                          <Area type="monotone" dataKey="closes" name="Closes" stroke="#1cdb5e" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCloses)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="bg-zinc-50 dark:bg-zinc-800/40 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 text-xs flex flex-col gap-1.5">
                      <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200">
                        <TrendingUp className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        <span className="font-bold">Drop-off Hotspot Identified:</span>
                        <span>Second <strong className="text-[#1cdb5e] font-bold">{peakSec + 's'}</strong> with {peakVal} user drops.</span>
                      </div>
                      <p className="text-zinc-500 leading-relaxed pl-6">
                        {peakSec <= 5
                          ? "Critical Drop-off: Most users are exiting immediately after loading. Consider shortening the required watch timer or enhancing the hook in the first 3 seconds."
                          : "Strong Engagement: Drop-off is localized in the later parts of the video. The intro hook is working well!"}
                      </p>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageAds;
