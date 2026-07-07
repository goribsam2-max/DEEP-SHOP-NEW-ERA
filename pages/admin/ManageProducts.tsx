import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../firebase";
import { uploadToImgbb } from "../../services/imgbb";
import { useNotify, useConfirm } from "../../components/Notifications";
import { Product } from "../../types";
import { motion, AnimatePresence } from "framer-motion";
import Icon from "../../components/Icon";
import { Pen, Trash2, Box, Store } from "lucide-react";

import { Button as UIButton } from "@/components/ui/button";
import { Item, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle, ItemActions } from "../../components/ui/item";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

import Modal from "../../components/ui/modal-drop";

const ManageProducts: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const notify = useNotify();
  const confirm = useConfirm();

  const [formData, setFormData] = useState({
    name: "",
    price: 0,
    description: "",
    category: "Mobile",
    customCategory: "",
    stock: 10,
    imageFiles: [] as File[],
    isOffer: false,
    offerPrice: 0,
    modelUrl: "",
    videoUrl: "",
  });

  const fetchProducts = async () => {
    const snap = await getDocs(collection(db, "products"));
    setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Product));
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setFormData({
      name: product.name || "",
      price: product.price || 0,
      description: product.description || "",
      category: product.category || "Mobile",
      customCategory: "",
      stock: product.stock || 0,
      imageFiles: [],
      isOffer: product.isOffer || false,
      offerPrice: product.offerPrice || 0,
      modelUrl: product.modelUrl || "",
      videoUrl: product.videoUrl || "",
    });
    setIsAdding(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let imageUrls: string[] = [];
      if (formData.imageFiles.length > 0) {
        for (const file of formData.imageFiles) {
          const url = await uploadToImgbb(file);
          imageUrls.push(url);
        }
      }

      const productData: any = {
        name: formData.name,
        price: Number(formData.price),
        description: formData.description,
        category: formData.category === "Custom" ? formData.customCategory : formData.category,
        stock: Number(formData.stock),
        isOffer: Boolean(formData.isOffer),
        offerPrice: Number(formData.offerPrice || 0),
        modelUrl: formData.modelUrl || "",
        videoUrl: formData.videoUrl || "",
      };

      if (imageUrls.length > 0) {
        productData.image = imageUrls[0];
        productData.images = imageUrls;
      }

      if (editingId) {
        await updateDoc(doc(db, "products", editingId), productData);
        notify("Product updated successfully", "success");
      } else {
        productData.rating = 5;
        productData.numReviews = 0;
        await addDoc(collection(db, "products"), productData);
        notify("Product added to catalog", "success");
      }

      setIsAdding(false);
      setEditingId(null);
      setFormData({
        name: "",
        price: 0,
        description: "",
        category: "Mobile",
        customCategory: "",
        stock: 10,
        imageFiles: [],
        isOffer: false,
        offerPrice: 0,
        modelUrl: "",
        videoUrl: "",
      });
      fetchProducts();
    } catch (err: any) {
      notify(err.message || "Failed to save product", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    confirm({
      title: "Delete Product?",
      message: "This product will be permanently removed from the store.",
      onConfirm: async () => {
        await deleteDoc(doc(db, "products", id));
        notify("Product deleted", "info");
        fetchProducts();
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
              Products Inventory
            </h1>
            <p className="text-zinc-400 text-[10px] md:text-xs font-bold tracking-normal ">
              Catalog Management
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            setIsAdding(!isAdding);
            setEditingId(null);
            setFormData({
              name: "",
              price: 0,
              description: "",
              category: "Mobile",
              customCategory: "",
              stock: 10,
              imageFiles: [],
              isOffer: false,
              offerPrice: 0,
              modelUrl: "",
              videoUrl: "",
            });
          }}
          className={`px-6 py-3 rounded-full font-bold  text-[10px] tracking-normal shadow-lg transition-all active:scale-95 border hover-tilt hover-glow ${isAdding ? "bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:bg-zinc-800" : "bg-zinc-900 text-white border-zinc-900 hover:bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900"}`}
        >
          {isAdding ? "Cancel" : "Add Product"}
        </button>
      </div>

      <Modal
        isOpen={isAdding}
        onClose={() => {
          setIsAdding(false);
          setEditingId(null);
        }}
        title={editingId ? "Edit Product" : "Add New Product"}
        animationType="scale"
      >
        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div className="space-y-4 md:space-y-6">
            <div className="md:flex md:items-center md:space-x-4">
              <div className="md:w-1/2">
                <Label htmlFor="name" className="font-medium text-xs text-zinc-500 mb-2 block">
                  Product Name
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="mt-4 md:mt-0 md:w-1/2">
                <Label htmlFor="category" className="font-medium text-xs text-zinc-500 mb-2 block">
                  Category
                </Label>
                <div className="flex gap-2">
                <select
                  id="category"
                  className="w-full bg-zinc-50 dark:bg-[#121212] p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 outline-none text-sm appearance-none cursor-pointer"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  {Array.from(new Set(["Mobile", "Border Cross", "Mobiles", "Original Phones", "Chargers", ...products.map((p) => p.category).filter(Boolean)])).filter(cat => cat !== "Gadgets" && cat !== "Accessories").map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="Custom">Custom...</option>
                </select>
                {formData.category === "Custom" && (
                  <Input
                    placeholder="Enter Custom Category..."
                    value={formData.customCategory}
                    onChange={(e) => setFormData({ ...formData, customCategory: e.target.value })}
                    required
                  />
                )}
                </div>
              </div>
            </div>

                  <div className="md:flex md:items-center md:space-x-4">
                    <div className="md:w-1/2">
                      <Label htmlFor="price" className="font-medium text-xs text-zinc-500 mb-2 block">
                        Price (৳)
                      </Label>
                      <Input
                        id="price"
                        type="number"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                        required
                      />
                    </div>
                    <div className="mt-4 md:mt-0 md:w-1/2">
                      <Label htmlFor="stock" className="font-medium text-xs text-zinc-500 mb-2 block">
                        Stock Amount
                      </Label>
                      <Input
                        id="stock"
                        type="number"
                        value={formData.stock}
                        onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="font-medium text-xs text-zinc-500 mb-2 block">
                      Upload Images
                    </Label>
                    <Input
                      type="file"
                      accept="image/*"
                      multiple
                      className="cursor-pointer file:cursor-pointer"
                      onChange={(e) => {
                        if (e.target.files)
                          setFormData({
                            ...formData,
                            imageFiles: Array.from(e.target.files),
                          });
                      }}
                    />
                    {editingId && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Leave empty to keep existing images.
                      </p>
                    )}
                  </div>

                  <div className="md:flex md:items-center md:space-x-4">
                    <div className="md:w-1/2">
                      <Label htmlFor="modelUrl" className="font-medium text-xs text-zinc-500 mb-2 block">
                        3D Model URL (GLB)
                      </Label>
                      <Input
                        id="modelUrl"
                        type="url"
                        placeholder="https://example.com/model.glb"
                        value={formData.modelUrl || ""}
                        onChange={(e) => setFormData({ ...formData, modelUrl: e.target.value })}
                      />
                    </div>
                    <div className="mt-4 md:mt-0 md:w-1/2">
                      <Label htmlFor="videoUrl" className="font-medium text-xs text-zinc-500 mb-2 block">
                        Video Review URL
                      </Label>
                      <Input
                        id="videoUrl"
                        type="url"
                        placeholder="https://youtube.com/watch?v=..."
                        value={formData.videoUrl || ""}
                        onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                      />
                    </div>
                  </div>

                  <Card className="bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900/50 shadow-none">
                    <CardContent className="p-4 flex flex-col gap-4">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="isOfferCheckbox"
                          checked={formData.isOffer || false}
                          onCheckedChange={(checked) => setFormData({ ...formData, isOffer: !!checked })}
                          className="border-red-300 data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500"
                        />
                        <Label htmlFor="isOfferCheckbox" className="text-red-700 dark:text-red-400 font-semibold cursor-pointer">
                          Special Offer Product
                        </Label>
                      </div>
                      <AnimatePresence>
                        {formData.isOffer && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <Label htmlFor="offerPrice" className="font-medium text-xs text-red-500 mb-2 block">
                              Offer Price (৳)
                            </Label>
                            <Input
                              id="offerPrice"
                              type="number"
                              required={formData.isOffer}
                              value={formData.offerPrice || ""}
                              onChange={(e) => setFormData({ ...formData, offerPrice: Number(e.target.value) })}
                              className="border-red-200 focus-visible:ring-red-200"
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </CardContent>
                  </Card>

                  <div>
                    <Label htmlFor="description" className="font-medium text-xs text-zinc-500 mb-2 block">
                      Product Description
                    </Label>
                    <Textarea
                      id="description"
                      className="min-h-[140px]"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                </div>
                
                <Separator className="my-8" />
                <div className="flex items-center gap-4 justify-end">
                  <Button type="button" variant="ghost" onClick={() => setIsAdding(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading} className="px-8 bg-zinc-900 hover:bg-zinc-800 text-white rounded-full">
                    {loading ? "Processing..." : editingId ? "Update Product" : "Save Product"}
                  </Button>
                </div>
              </form>
            </Modal>

      <div className="flex flex-col space-y-3 relative z-10 animate-stagger-3 max-w-4xl mx-auto">
        <ItemGroup className="flex flex-col gap-4">
          {products.map((p) => (
            <Item key={p.id} variant="outline" className="group">
              <ItemMedia variant="image" className="size-16 md:size-20 shrink-0 border border-border p-2 bg-pink-50 dark:bg-zinc-800 rounded-md">
                <img src={p.image} className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal" alt={p.name} />
              </ItemMedia>
              <ItemContent>
                <ItemTitle className="max-w-[200px] md:max-w-md truncate">{p.name}</ItemTitle>
                <ItemDescription className="font-medium flex items-center flex-wrap gap-x-2 mt-1">
                  <span>৳{p.isOffer && p.offerPrice ? p.offerPrice : p.price}</span>
                  <span>•</span>
                  <span>{p.stock} in stock</span>
                  {p.isOffer && (
                    <>
                       <span>•</span>
                       <span className="text-red-500 font-bold">Offer</span>
                    </>
                  )}
                </ItemDescription>
              </ItemContent>
              <ItemActions className="opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity justify-end shrink-0 ml-auto">
                <Button size="icon" variant="secondary" className="h-9 w-9 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700" onClick={() => handleEdit(p)}>
                  <Pen className="size-4" />
                </Button>
                <Button size="icon" variant="destructive" className="h-9 w-9 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-500" onClick={() => handleDelete(p.id)}>
                  <Trash2 className="size-4" />
                </Button>
              </ItemActions>
            </Item>
          ))}
          {products.length === 0 && (
            <div className="py-32 text-center flex flex-col items-center bg-zinc-50 dark:bg-zinc-800 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
              <Box className="w-8 h-8 text-zinc-300 mb-4" />
              <p className="text-zinc-400 font-bold tracking-normal text-xs">
                Inventory is empty
              </p>
            </div>
          )}
        </ItemGroup>
      </div>
    </div>
  );
};

export default ManageProducts;
