import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { useNotify } from "../../components/Notifications";
import Icon from "../../components/Icon";
import { uploadToImgbb } from "../../services/imgbb";

const ManageSEO: React.FC = () => {
  const navigate = useNavigate();
  const notify = useNotify();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [seoData, setSeoData] = useState({
    metaTitle: "",
    metaDescription: "",
    metaKeywords: "",
    metaImage: "",
    robots: "index, follow",
    jsonLd: "",
    fbPixelId: "",
    fbConversionToken: "",
    faviconUrl: "",
    appIconUrl: "",
    siteAuthor: "",
    siteLanguage: "en",
    organizationName: "Vibe Gadget",
  });

  useEffect(() => {
    const fetchSEO = async () => {
      setLoading(true);
      try {
        const snap = await getDoc(doc(db, "settings", "seo"));
        if (snap.exists()) {
          setSeoData({ ...seoData, ...snap.data() });
        }
      } catch (err) {
        console.error(err);
        notify("Failed to load SEO settings", "error");
      }
      setLoading(false);
    };
    fetchSEO();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await setDoc(doc(db, "settings", "seo"), seoData);
      notify(
        "SEO & Marketing settings saved successfully! Note: Refresh the app to see immediate changes in the meta tags.",
        "success",
      );
    } catch (err) {
      console.error(err);
      notify("Failed to save settings", "error");
    }
    setSaving(false);
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "faviconUrl" | "appIconUrl" | "metaImage",
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    notify("Uploading icon, please wait...", "info");
    try {
      const url = await uploadToImgbb(file);
      setSeoData({ ...seoData, [field]: url });
      notify("Upload successful!", "success");
    } catch (err) {
      notify("Failed to upload image", "error");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center">
        <Icon
          name="spinner"
          className="animate-spin text-zinc-900 dark:text-zinc-100 text-xl"
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 min-h-screen bg-zinc-50 dark:bg-zinc-800/50">
      
      <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 p-5 rounded-2xl mb-8 flex gap-4 items-start shadow-sm">
         <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-800 rounded-full flex items-center justify-center shrink-0 text-emerald-600 dark:text-emerald-400">
            <Icon name="chart-line" className="text-xl" />
         </div>
         <div>
            <h3 className="text-sm font-bold text-emerald-800 dark:text-emerald-300 mb-1">Why is my site ranking low on Google?</h3>
            <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium leading-relaxed mb-3">
              If you just submitted your site to Search Console (or Google Publisher), it can take several weeks or months for Google to build trust and rank you higher. E-commerce ranking relies heavily on:
            </p>
            <ul className="list-disc pl-4 text-[11px] text-emerald-700 dark:text-emerald-400 space-y-1 mb-4 font-medium">
               <li><b>Content Quality:</b> Unique product descriptions (avoid copying from other sites).</li>
               <li><b>Backlinks:</b> Links pointing to your site from reputable tech blogs, Facebook, and YouTube descriptions.</li>
               <li><b>User Engagement:</b> If users click your site and leave immediately, Google drops your rank. Keep them engaged!</li>
               <li><b>Consistent Updates:</b> Regularly adding new products and blogs shows Google your site is alive.</li>
            </ul>
            <button type="button" onClick={() => window.open('https://www.google.com/ping?sitemap=https://www.deepshop.top/sitemap.xml', '_blank')} className="text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-full transition-colors inline-block">
               Ping Google (Force Recrawl)
            </button>
         </div>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Facebook Ads Section */}
        <div className="bg-zinc-50 dark:bg-zinc-800 p-6 md:p-8 rounded-2xl border border-blue-100 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-bl-[100px] z-0"></div>
          <div className="relative z-10 flex items-center mb-6">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mr-4">
              <Icon name="facebook" className="text-xl" />
            </div>
            <div>
              <h2 className="font-semibold text-lg text-zinc-900 dark:text-zinc-100">
                Facebook Pixel & Conversion Tracking
              </h2>
              <p className="text-[10px] text-zinc-500 font-bold tracking-normal  mt-0.5">
                Pay only for actual sales
              </p>
            </div>
          </div>
          <div className="relative z-10 space-y-5">
            <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 flex items-start space-x-3">
              <Icon name="info-circle" className="text-blue-500 mt-0.5" />
              <p className="text-xs text-blue-800 font-medium leading-relaxed">
                By connecting your Meta Pixel here, the system will track actual{" "}
                <b>"Purchase"</b> events when a user successfully checks out.
                This allows you to run Conversion Campaigns where Facebook
                optimizes and charges you based on real orders, rather than just
                link clicks.
              </p>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-zinc-500  tracking-normal mb-2">
                Meta Pixel ID (Required for tracking)
              </label>
              <input
                type="text"
                value={seoData.fbPixelId}
                onChange={(e) =>
                  setSeoData({ ...seoData, fbPixelId: e.target.value })
                }
                placeholder="e.g., 123456789012345"
                className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-3.5 text-sm font-bold text-zinc-800 dark:text-zinc-200 focus:border-blue-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-zinc-500  tracking-normal mb-2">
                Conversions API Token (Optional for accuracy)
              </label>
              <input
                type="text"
                value={seoData.fbConversionToken}
                onChange={(e) =>
                  setSeoData({ ...seoData, fbConversionToken: e.target.value })
                }
                placeholder="Paste your CAPI Token here"
                className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-3.5 text-sm font-bold text-zinc-800 dark:text-zinc-200 focus:border-blue-500 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Branding & App Icons */}
        <div className="bg-zinc-50 dark:bg-zinc-800 p-6 md:p-8 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-sm relative overflow-hidden">
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mr-4">
              <Icon name="image" className="text-xl" />
            </div>
            <div>
              <h2 className="font-semibold text-lg text-zinc-900 dark:text-zinc-100">
                Branding & PWA
              </h2>
              <p className="text-[10px] text-zinc-500 font-bold tracking-normal  mt-0.5">
                Favicon & Add to Home Screen Icons
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-[10px] font-bold text-zinc-500  tracking-normal mb-2">
                Favicon (Browser Tab Icon)
              </label>
              <div className="flex items-center space-x-4">
                {seoData.faviconUrl ? (
                  <div className="relative group w-12 h-12 shrink-0">
                    <img
                      src={seoData.faviconUrl}
                      className="w-full h-full object-cover rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm"
                      alt="favicon"
                    />
                    <button
                      type="button"
                      onClick={() => setSeoData({ ...seoData, faviconUrl: "" })}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-2xl p-1 shadow hover:bg-red-600"
                    >
                      <Icon name="times" className="text-[8px]" />
                    </button>
                  </div>
                ) : (
                  <div className="w-12 h-12 bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shrink-0">
                    <Icon name="globe" className="text-zinc-300" />
                  </div>
                )}
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, "faviconUrl")}
                    className="text-xs w-full file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-zinc-500  tracking-normal mb-2">
                App Icon (Add to Home Screen)
              </label>
              <div className="flex items-center space-x-4">
                {seoData.appIconUrl ? (
                  <div className="relative group w-16 h-16 shrink-0">
                    <img
                      src={seoData.appIconUrl}
                      className="w-full h-full object-cover rounded-full border border-zinc-200 dark:border-zinc-700 shadow-sm"
                      alt="app icon"
                    />
                    <button
                      type="button"
                      onClick={() => setSeoData({ ...seoData, appIconUrl: "" })}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-2xl p-1 shadow hover:bg-red-600"
                    >
                      <Icon name="times" className="text-[8px]" />
                    </button>
                  </div>
                ) : (
                  <div className="w-16 h-16 bg-zinc-50 dark:bg-zinc-800 rounded-full border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shrink-0">
                    <Icon name="mobile-alt" className="text-zinc-300 text-xl" />
                  </div>
                )}
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, "appIconUrl")}
                    className="text-xs w-full file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100 cursor-pointer"
                  />
                  <p className="text-[9px] text-zinc-400 mt-1">
                    Recommended size: 512x512px
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search Engine Tags */}
        <div className="bg-zinc-50 dark:bg-zinc-800 p-6 md:p-8 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-sm">
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 bg-zinc-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 rounded-full flex items-center justify-center mr-4">
              <Icon name="search" className="text-xl" />
            </div>
            <div>
              <h2 className="font-semibold text-lg text-zinc-900 dark:text-zinc-100">
                Search Engine Tags
              </h2>
              <p className="text-[10px] text-zinc-500 font-bold tracking-normal  mt-0.5">
                Control how Google sees your site
              </p>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-[10px] font-bold text-zinc-500  tracking-normal mb-2">
                Global Meta Title (Fallback)
              </label>
              <input
                type="text"
                value={seoData.metaTitle}
                onChange={(e) =>
                  setSeoData({ ...seoData, metaTitle: e.target.value })
                }
                placeholder="DEEP SHOP - Best Tech Store"
                className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-3.5 text-sm font-bold text-zinc-800 dark:text-zinc-200 focus:border-zinc-900 dark:border-zinc-100 transition-colors"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-zinc-500  tracking-normal mb-2">
                Meta Description
              </label>
              <textarea
                rows={3}
                value={seoData.metaDescription}
                onChange={(e) =>
                  setSeoData({ ...seoData, metaDescription: e.target.value })
                }
                placeholder="Shop the latest gadgets and accessories at the best prices..."
                className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-4 text-sm font-medium text-zinc-800 dark:text-zinc-200 focus:border-zinc-900 dark:border-zinc-100 transition-colors resize-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-zinc-500  tracking-normal mb-2">
                Meta Image (Link Preview)
              </label>
              <div className="flex items-center space-x-4">
                {seoData.metaImage ? (
                  <div className="relative group w-32 h-16 shrink-0">
                    <img
                      src={seoData.metaImage}
                      className="w-full h-full object-cover rounded-lg border border-zinc-200 dark:border-zinc-700 shadow-sm"
                      alt="Meta Image"
                    />
                    <button
                      type="button"
                      onClick={() => setSeoData({ ...seoData, metaImage: "" })}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-2xl p-1 shadow hover:bg-red-600"
                    >
                      <Icon name="times" className="text-[8px]" />
                    </button>
                  </div>
                ) : (
                  <div className="w-32 h-16 bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 flex items-center justify-center shrink-0">
                    <Icon name="image" className="text-zinc-300" />
                  </div>
                )}
                <label className="flex-1 cursor-pointer bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 py-3 rounded-lg text-[10px] font-bold  tracking-normal hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors text-center block">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageUpload(e, "metaImage")}
                  />
                  Upload Banner
                </label>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-zinc-500  tracking-normal mb-2">
                Keywords (Comma separated)
              </label>
              <input
                type="text"
                value={seoData.metaKeywords}
                onChange={(e) =>
                  setSeoData({ ...seoData, metaKeywords: e.target.value })
                }
                placeholder="gadgets, tech, mobile accessories, buy online"
                className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-3.5 text-sm font-bold text-zinc-800 dark:text-zinc-200 focus:border-zinc-900 dark:border-zinc-100 transition-colors"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-zinc-500  tracking-normal mb-2">
                Search Engine Visibility (Robots)
              </label>
              <select
                value={seoData.robots}
                onChange={(e) =>
                  setSeoData({ ...seoData, robots: e.target.value })
                }
                className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-3.5 text-sm font-bold text-zinc-800 dark:text-zinc-200 focus:border-zinc-900 dark:border-zinc-100 transition-colors cursor-pointer"
              >
                <option value="index, follow">
                  Allow Google to index completely (Recommended)
                </option>
                <option value="noindex, nofollow">
                  Hide site from Google completely
                </option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-[10px] font-bold text-zinc-500  tracking-normal mb-2">
                  Site Language
                </label>
                <input
                  type="text"
                  value={seoData.siteLanguage}
                  onChange={(e) =>
                    setSeoData({ ...seoData, siteLanguage: e.target.value })
                  }
                  placeholder="e.g., en, bn"
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-3.5 text-sm font-bold text-zinc-800 dark:text-zinc-200 focus:border-zinc-900 dark:border-zinc-100 transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-500  tracking-normal mb-2">
                  Site Author / Brand
                </label>
                <input
                  type="text"
                  value={seoData.siteAuthor}
                  onChange={(e) =>
                    setSeoData({ ...seoData, siteAuthor: e.target.value })
                  }
                  placeholder="DEEP SHOP Inc."
                  className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-3.5 text-sm font-bold text-zinc-800 dark:text-zinc-200 focus:border-zinc-900 dark:border-zinc-100 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-zinc-500  tracking-normal mb-2">
                Advanced: JSON-LD Structured Data Schema
              </label>
              <textarea
                rows={4}
                value={seoData.jsonLd}
                onChange={(e) =>
                  setSeoData({ ...seoData, jsonLd: e.target.value })
                }
                placeholder='{"@context": "https://schema.org", "@type": "WebSite", "name": "DEEP SHOP"}'
                className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-4 text-xs font-mono text-zinc-800 dark:text-zinc-200 focus:border-zinc-900 dark:border-zinc-100 transition-colors resize-none"
              />
              <p className="text-[9px] text-zinc-800 dark:text-zinc-200 mt-1  tracking-normal font-bold">
                Helps Google understand your e-commerce structure.
              </p>
            </div>
          </div>
        </div>

        {/* Answer Engine Optimization (AEO) */}
        <div className="bg-zinc-50 dark:bg-zinc-800 p-6 md:p-8 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-sm relative overflow-hidden">
          <div className="flex items-center mb-6">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mr-4">
              <Icon name="robot" className="text-xl" />
            </div>
            <div>
              <h2 className="font-semibold text-lg text-zinc-900 dark:text-zinc-100">
                AEO (Answer Engine Optimization)
              </h2>
              <p className="text-[10px] text-zinc-500 font-bold tracking-normal mt-0.5">
                Optimize for AI like ChatGPT, Perplexity, and Gemini
              </p>
            </div>
          </div>
          <div className="space-y-5">
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 tracking-normal mb-2">
                Organization / Store Name
              </label>
              <input
                type="text"
                value={seoData.organizationName}
                onChange={(e) =>
                  setSeoData({ ...seoData, organizationName: e.target.value })
                }
                placeholder="Vibe Gadgets"
                className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-3.5 text-sm font-bold text-zinc-800 dark:text-zinc-200 focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-4 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-full font-semibold  tracking-normal text-xs shadow-lg shadow-[#06331e]/30 hover:bg-zinc-900 transition-all disabled:opacity-50 flex items-center"
          >
            {saving ? (
              <Icon name="spinner" className="animate-spin mr-2" />
            ) : (
              <Icon name="save" className="mr-2" />
            )}
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ManageSEO;
