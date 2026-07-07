import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  orderBy,
  updateDoc,
  setDoc,
  getDoc,
} from "firebase/firestore";
import { db } from "../../firebase";
import { uploadToImgbb } from "../../services/imgbb";
import { useNotify, useConfirm } from "../../components/Notifications";
import Icon from "../../components/Icon";
import { Item, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle, ItemActions } from "../../components/ui/item";
import { Button } from "../../components/ui/button";
import Modal from "../../components/ui/modal-drop";

interface Banner {
  id: string;
  imageUrl: string;
  title: string;
  description: string;
  link?: string;
  createdAt: number;
  bannerType?: 'hero' | 'popup' | 'gif' | 'profile' | 'category' | 'bottom';
}

const ManageBanners: React.FC = () => {
  const navigate = useNavigate();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [featuredCategory, setFeaturedCategory] = useState("");

  const [savingSettings, setSavingSettings] = useState(false);
  const notify = useNotify();
  const confirm = useConfirm();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    link: "",
    imageFile: null as File | null,
    bannerType: "hero" as "hero" | "popup" | "gif" | "profile" | "category" | "bottom",
  });

  const fetchBanners = async () => {
    const q = query(collection(db, "banners"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    setBanners(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Banner));
  };

  const fetchSettings = async () => {
    const snap = await getDoc(doc(db, "settings", "platform"));
    if (snap.exists()) {
      setFeaturedCategory(snap.data().featuredCategory || "");
    }
  };

  useEffect(() => {
    fetchBanners();
    fetchSettings();
  }, []);

  const saveSettings = async () => {
    setSavingSettings(true);
    try {
      await setDoc(
        doc(db, "settings", "platform"),
        { featuredCategory },
        { merge: true },
      );
      notify("Homepage showcase category updated", "success");
    } catch (err) {
      notify("Failed to save settings", "error");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleEdit = (banner: Banner) => {
    setEditingId(banner.id);
    setFormData({
      title: banner.title,
      description: banner.description,
      link: banner.link || "",
      imageFile: null,
      bannerType: banner.bannerType || "hero",
    });
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    try {
      let imageUrl = "";
      if (formData.imageFile) {
        imageUrl = await uploadToImgbb(formData.imageFile);
      }

      const bannerData: any = {
        title: formData.title,
        description: formData.description,
        link: formData.link,
        bannerType: formData.bannerType,
      };

      if (imageUrl) bannerData.imageUrl = imageUrl;

      if (editingId) {
        await updateDoc(doc(db, "banners", editingId), bannerData);
        notify("Banner updated successfully", "success");
      } else {
        if (!imageUrl) throw new Error("An image is required for new banners");
        bannerData.createdAt = Date.now();
        await addDoc(collection(db, "banners"), bannerData);
        notify("New banner published", "success");
      }

      setEditingId(null);
      setFormData({ title: "", description: "", link: "", imageFile: null, bannerType: "hero" });
      fetchBanners();
    } catch (err: any) {
      notify(err.message || "Failed to save banner", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = (id: string) => {
    confirm({
      title: "Remove Banner?",
      message: "Are you sure you want to remove this banner from the homepage?",
      onConfirm: async () => {
        await deleteDoc(doc(db, "banners", id));
        notify("Banner removed", "info");
        fetchBanners();
      },
    });
  };

  return (
    <div className="max-w-[1440px] mx-auto px-6 md:px-12 py-10 min-h-screen bg-zinc-50 dark:bg-zinc-800 animate-fade-in relative overflow-hidden">
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900/5 rounded-full blur-[100px] pointer-events-none z-0"></div>
      <div className="flex items-center justify-between mb-12 relative z-10 animate-stagger-1">
        <div className="flex items-center space-x-6">
          <div>
            <h1 className="text-xl md:text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 mb-1.5 text-shine">
              Store Banners
            </h1>
            <p className="text-zinc-400 text-[10px] md:text-xs font-bold tracking-normal">
              Homepage Visuals
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            setShowAdd(true);
            setEditingId(null);
            setFormData({ title: "", description: "", link: "", imageFile: null, bannerType: "hero" });
          }}
          className="px-6 py-3 rounded-full font-bold text-[10px] tracking-normal shadow-lg transition-all active:scale-95 border hover-tilt hover-glow bg-zinc-900 text-white border-zinc-900 hover:bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900"
        >
          Add Banner
        </button>
      </div>

      <Modal
        isOpen={showAdd || !!editingId}
        onClose={() => {
          setShowAdd(false);
          setEditingId(null);
        }}
        title={editingId ? "Edit Banner" : "Create New Banner"}
        animationType="scale"
      >
        <form
          onSubmit={handleAdd}
          className="w-full space-y-4"
        >
          <div>
            <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400 mb-2 block">
                Main Title
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Smart Watch Sale"
                className="w-full bg-zinc-50 dark:bg-zinc-800 p-4 rounded-2xl text-sm outline-none border border-zinc-200 dark:border-zinc-700 focus:border-black transition-colors"
                value={formData.title || ""}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
              />
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400 mb-2 block">
                Description
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Up to 50% Off"
                className="w-full bg-zinc-50 dark:bg-zinc-800 p-4 rounded-2xl text-sm outline-none border border-zinc-200 dark:border-zinc-700 focus:border-black transition-colors"
                value={formData.description || ""}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400 mb-2 block">
                Action Link (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. /product/123 or /all-products"
                className="w-full bg-zinc-50 dark:bg-zinc-800 p-4 rounded-2xl text-sm outline-none border border-zinc-200 dark:border-zinc-700 focus:border-black transition-colors"
                value={formData.link || ""}
                onChange={(e) =>
                  setFormData({ ...formData, link: e.target.value })
                }
              />
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400 mb-2 block">
                Banner Type
              </label>
              <select
                title="Banner Type"
                className="w-full bg-zinc-50 dark:bg-zinc-800 p-4 rounded-2xl text-sm outline-none border border-zinc-200 dark:border-zinc-700 focus:border-black transition-colors"
                value={formData.bannerType || "hero"}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    bannerType: e.target.value as any,
                  })
                }
              >
                <option value="hero">Hero (Top Slider)</option>
                <option value="popup">Welcome Popup</option>
                <option value="gif">Thin GIF Banner</option>
                <option value="profile">Profile Slider</option>
                <option value="bottom">Home Bottom Banner</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-zinc-600 dark:text-zinc-400 mb-2 block">
                Banner Image (GIFs allowed)
              </label>
              <input
                title="Banner Image"
                type="file"
                accept="image/*"
                className="w-full bg-zinc-50 dark:bg-zinc-800 p-4 rounded-2xl text-sm outline-none border border-zinc-200 dark:border-zinc-700 focus:border-black transition-colors"
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    imageFile: e.target.files?.[0] || null,
                  })
                }
              />
            </div>

            <div className="pt-4 flex gap-4">
              <button
                disabled={uploading}
                type="submit"
                className="flex-1 py-4 bg-zinc-900 border-none text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-lg font-bold tracking-wide shadow-xl active:scale-95 transition-all disabled:opacity-50"
              >
                {uploading
                  ? "Uploading..."
                  : editingId
                    ? "Update Banner"
                    : "Create Banner"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAdd(false);
                  setEditingId(null);
                  setFormData({
                    title: "",
                    description: "",
                    link: "",
                    imageFile: null,
                    bannerType: "hero"
                  });
                }}
                className="py-4 px-6 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg font-bold shadow-sm active:scale-95 transition-all"
              >
                Cancel
              </button>
            </div>
        </form>
      </Modal>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 relative z-10">
        <div className="lg:col-span-1">
          <div className="bg-zinc-50 dark:bg-zinc-800 p-10 rounded-2xl border border-zinc-100 dark:border-zinc-800 mt-8 shadow-sm">
            <h2 className="text-xs font-semibold  tracking-normal text-zinc-400 mb-6">
              Home Slider Category
            </h2>
            <p className="text-[10px] font-bold text-zinc-500 mb-6 leading-relaxed">
              Select a category to display in the auto-slider below the header
              search bar on the homepage.
            </p>
            <div className="flex flex-col space-y-4">
              <select
                value={featuredCategory}
                onChange={(e) => setFeaturedCategory(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-800 p-5 rounded-2xl outline-none focus:ring-1 focus:ring-black transition-all font-bold shadow-inner  tracking-normal text-xs"
              >
                <option value="">-- No Slider --</option>
                <option value="Mobile">Mobile</option>
                <option value="Accessories">Accessories</option>
                <option value="Gadgets">Gadgets</option>
                <option value="Chargers">Chargers</option>
              </select>
              <button
                onClick={saveSettings}
                disabled={savingSettings}
                className="w-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-sm disabled:opacity-50 text-[10px] font-bold  tracking-normal py-4 rounded-full transition-all hover:bg-emerald-900"
              >
                {savingSettings ? "Saving..." : "Update Category"}
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <ItemGroup className="flex flex-col gap-4">
            {banners.map((banner) => (
              <Item key={banner.id} variant="outline" className="group flex-col items-start gap-0 p-0 sm:flex-row shadow-sm">
                <ItemMedia variant="image" className="h-48 w-full sm:h-32 sm:w-48 self-stretch rounded-b-none sm:rounded-r-none sm:rounded-l-md border-b sm:border-b-0 sm:border-r border-border opacity-90 group-hover:opacity-100 transition-opacity">
                  <img
                    src={banner.imageUrl}
                    alt={banner.title}
                  />
                </ItemMedia>
                <ItemContent className="p-4 py-3 sm:py-4 flex-1">
                  <div className="flex w-full items-start justify-between gap-4">
                    <div className="flex flex-col gap-1 w-full relative">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-[9px] font-bold tracking-wider px-2 py-0.5 rounded-sm shrink-0 uppercase">
                          {banner.bannerType === "popup"
                            ? "WELCOME POPUP"
                            : banner.bannerType === "gif"
                              ? "GIF BANNER"
                              : banner.bannerType === "profile"
                                ? "PROFILE SLIDER"
                                : banner.bannerType === "bottom"
                                    ? "BOTTOM BANNER"
                                    : "HERO SLIDER"}
                        </span>
                      </div>
                      <ItemTitle>{banner.title}</ItemTitle>
                      <ItemDescription>{banner.description}</ItemDescription>
                      {banner.link && (
                        <ItemDescription className="text-xs opacity-75 mt-1 font-mono break-all line-clamp-1">
                          Link: {banner.link}
                        </ItemDescription>
                      )}
                    </div>
                    <ItemActions className="opacity-100 sm:opacity-0 transition-opacity group-hover:opacity-100 shrink-0">
                      <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => handleEdit(banner)}>
                        <Icon name="pen" className="size-3" />
                      </Button>
                      <Button size="icon" variant="destructive" className="h-8 w-8" onClick={() => handleDelete(banner.id)}>
                        <Icon name="trash" className="size-3" />
                      </Button>
                    </ItemActions>
                  </div>
                </ItemContent>
              </Item>
            ))}
            {banners.length === 0 && (
              <div className="py-32 flex justify-center text-center text-zinc-300 font-semibold  tracking-normal">
                No banners active
              </div>
            )}
          </ItemGroup>
        </div>
      </div>
    </div>
  );
};

export default ManageBanners;
