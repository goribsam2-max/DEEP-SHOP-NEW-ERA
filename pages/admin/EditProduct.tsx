import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { useNotify } from "../../components/Notifications";
import { uploadToImgbb } from "../../services/imgbb";
import SEO from "../../components/SEO";
import { ChevronLeft, Loader2, Save, Image as ImageIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const EditProduct: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const notify = useNotify();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    price: 0,
    description: "",
    category: "Border Cross Products",
    customCategory: "",
    stock: 10,
    image: "",
    images: [] as string[],
    isOffer: false,
    offerPrice: 0,
    modelUrl: "",
    videoUrl: "",
    advanceAmount: "",
  });
  const [newImageFile, setNewImageFile] = useState<File | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, "products", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const product = docSnap.data();
          setFormData({
            name: product.name || "",
            price: product.price || 0,
            description: product.description || "",
            category: product.category || "Border Cross Products",
            customCategory: "",
            stock: product.stock || 10,
            image: product.image || "",
            images: product.images || [],
            isOffer: product.isOffer || false,
            offerPrice: product.offerPrice || 0,
            modelUrl: product.modelUrl || "",
            videoUrl: product.videoUrl || "",
            advanceAmount: product.advanceAmount !== undefined ? String(product.advanceAmount) : "",
          });
        } else {
          notify("Product not found", "error");
          navigate("/");
        }
      } catch (err: any) {
        notify("Failed to fetch product: " + err.message, "error");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id, navigate, notify]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSaving(true);
    try {
      let finalImageUrl = formData.image;
      let finalImages = [...formData.images];

      if (newImageFile) {
        finalImageUrl = await uploadToImgbb(newImageFile);
        if (finalImages.length > 0) {
          finalImages[0] = finalImageUrl;
        } else {
          finalImages.push(finalImageUrl);
        }
      }

      const categoryValue = formData.category === "Custom" ? formData.customCategory : formData.category;

      const productData: any = {
        name: formData.name,
        price: Number(formData.price),
        description: formData.description,
        category: categoryValue,
        stock: Number(formData.stock),
        isOffer: Boolean(formData.isOffer),
        offerPrice: Number(formData.offerPrice || 0),
        modelUrl: formData.modelUrl || "",
        videoUrl: formData.videoUrl || "",
        image: finalImageUrl,
        images: finalImages,
      };

      if (formData.advanceAmount.trim() !== "") {
        productData.advanceAmount = Number(formData.advanceAmount);
      } else {
        productData.advanceAmount = null;
      }

      await updateDoc(doc(db, "products", id), productData);
      notify("Product updated successfully", "success");
      navigate(`/${id}`);
    } catch (err: any) {
      notify(err.message || "Failed to update product", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-zinc-900 dark:text-zinc-100" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-12 animate-fade-in bg-zinc-50 dark:bg-zinc-900 max-w-4xl mx-auto min-h-screen font-sans pb-24">
      <SEO title={`Edit Product: ${formData.name}`} description="Edit product details directly." />
      
      <div className="max-w-2xl mx-auto bg-white dark:bg-zinc-800 p-6 md:p-8 rounded-3xl border border-zinc-200 dark:border-zinc-700 shadow-sm">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 mb-6 font-medium text-xs uppercase tracking-wider"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Go Back</span>
        </button>

        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">Edit Product Details</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Product Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price (BDT)</Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stock">Stock Quantity</Label>
              <Input
                id="stock"
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <div className="flex gap-2">
              <select
                id="category"
                className="w-full bg-zinc-50 dark:bg-zinc-900 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 outline-none text-sm appearance-none cursor-pointer text-zinc-900 dark:text-zinc-100"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="Border Cross Products">Border Cross Products</option>
                <option value="Mobile">Mobile</option>
                <option value="Accessories">Accessories</option>
                <option value="Custom">Custom...</option>
              </select>
              {formData.category === "Custom" && (
                <Input
                  placeholder="Enter custom category"
                  value={formData.customCategory}
                  onChange={(e) => setFormData({ ...formData, customCategory: e.target.value })}
                  required
                />
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Product Description</Label>
            <Textarea
              id="description"
              rows={5}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </div>

          <div className="border-t border-zinc-200 dark:border-zinc-700 pt-6 space-y-4">
            <h3 className="font-bold text-sm text-zinc-700 dark:text-zinc-300">Offer Settings</h3>
            
            <div className="flex items-center gap-2">
              <input
                id="isOffer"
                type="checkbox"
                checked={formData.isOffer}
                onChange={(e) => setFormData({ ...formData, isOffer: e.target.checked })}
                className="w-4 h-4 rounded text-zinc-900 bg-zinc-100 border-zinc-300 focus:ring-0 dark:bg-zinc-900 dark:border-zinc-700"
              />
              <Label htmlFor="isOffer" className="cursor-pointer">Enable Offer/Discount Price</Label>
            </div>

            {formData.isOffer && (
              <div className="space-y-2 animate-fade-in">
                <Label htmlFor="offerPrice">Offer Price (BDT)</Label>
                <Input
                  id="offerPrice"
                  type="number"
                  value={formData.offerPrice}
                  onChange={(e) => setFormData({ ...formData, offerPrice: Number(e.target.value) })}
                  required={formData.isOffer}
                />
              </div>
            )}
          </div>

          <div className="border-t border-zinc-200 dark:border-zinc-700 pt-6 space-y-4">
            <h3 className="font-bold text-sm text-zinc-700 dark:text-zinc-300">Booking / Advance Fee</h3>
            <div className="space-y-2">
              <Label htmlFor="advanceAmount">Advance Amount (Optional - Blank to use seller defaults)</Label>
              <Input
                id="advanceAmount"
                type="number"
                placeholder="e.g. 1000"
                value={formData.advanceAmount}
                onChange={(e) => setFormData({ ...formData, advanceAmount: e.target.value })}
              />
            </div>
          </div>

          <div className="border-t border-zinc-200 dark:border-zinc-700 pt-6 space-y-4">
            <h3 className="font-bold text-sm text-zinc-700 dark:text-zinc-300">Product Image</h3>
            
            {formData.image && !newImageFile && (
              <div className="relative w-32 h-32 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-zinc-50 flex items-center justify-center">
                <img src={formData.image} alt="Preview" className="w-full h-full object-contain" />
              </div>
            )}

            <div className="flex items-center gap-3">
              <label className="cursor-pointer bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-colors py-2 px-4 rounded-xl text-xs font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                <span>Choose New Image</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setNewImageFile(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />
              </label>
              {newImageFile && (
                <span className="text-xs text-zinc-500 font-medium truncate max-w-xs">{newImageFile.name}</span>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3.5 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 transition-colors rounded-2xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Product Details</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditProduct;
