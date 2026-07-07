import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { auth, db } from "../firebase";
import { collection, addDoc, doc, getDoc, updateDoc } from "firebase/firestore";
import { useNotify } from "../components/Notifications";
import { Product } from "../types";
import { uploadToImgbb } from "../services/imgbb";
import Icon from "../components/Icon";
import { Box, Star, ImagePlus } from "lucide-react";

import { StatusBadge } from "../components/ui/status-badge";

const LeaveReview: React.FC = () => {
  const navigate = useNavigate();
  const notify = useNotify();
  const [searchParams] = useSearchParams();
  const productId = searchParams.get("productId");

  const [product, setProduct] = useState<Product | null>(null);
  const [errorLoading, setErrorLoading] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!productId) {
        setErrorLoading(true);
        return;
      }
      try {
        const snap = await getDoc(doc(db, "products", productId));
        if (snap.exists()) {
          setProduct({ id: snap.id, ...snap.data() } as Product);
        } else {
          setErrorLoading(true);
        }
      } catch (err) {
        setErrorLoading(true);
      }
    };
    fetchProduct();
  }, [productId]);

  const handleSubmit = async () => {
    if (!auth.currentUser)
      return notify("Please login to leave a review.", "error");
    if (rating === 0) return notify("Please select a rating.", "error");
    if (!comment.trim()) return notify("Please write a review.", "error");
    if (!productId || !product) return;

    setLoading(true);
    try {
      let imageUrls: string[] = [];
      for (const file of imageFiles) {
        const url = await uploadToImgbb(file);
        imageUrls.push(url);
      }

      await addDoc(collection(db, "reviews"), {
        productId,
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || "Vibe Customer",
        userPhoto: auth.currentUser.photoURL || "",
        rating,
        comment: comment.trim(),
        images: imageUrls,
        createdAt: Date.now(),
      });

      const oldRating = product.rating || 0;
      const oldNumReviews = product.numReviews || 0;
      const newNumReviews = oldNumReviews + 1;
      const newRating = (oldRating * oldNumReviews + rating) / newNumReviews;

      await updateDoc(doc(db, "products", productId), {
        rating: Number(newRating.toFixed(1)),
        numReviews: newNumReviews,
      });

      notify("Review posted!", "success");

      navigate(`/product/${productId}`);
    } catch (err) {
      notify("Failed to post review.", "error");
    } finally {
      setLoading(false);
    }
  };

  if (errorLoading)
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-900">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Product not found.</h2>
        <button onClick={() => navigate('/orders')} className="mt-4 px-4 py-2 bg-black text-white rounded-lg">Go Back</button>
      </div>
    );

  if (!product)
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
      </div>
    );

  return (
    <div className="p-8 animate-fade-in min-h-screen flex flex-col max-w-2xl mx-auto bg-zinc-50 dark:bg-zinc-800">
      

      <div className="bg-white dark:bg-zinc-900 p-6 md:p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex items-center space-x-6 mb-8 shadow-sm shadow-zinc-200/20 dark:shadow-none relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900/5 rounded-full blur-2xl pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
        <div className="w-24 h-24 bg-zinc-50 dark:bg-zinc-800 rounded-full overflow-hidden p-3 border border-zinc-100 dark:border-zinc-700 shadow-inner group-hover:scale-105 transition-transform duration-500 relative z-10">
          <img
            src={product.image}
            className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal"
            alt=""
          />
        </div>
        <div className="flex-1 min-w-0 relative z-10">
          <div className="mb-3">
            <StatusBadge leftIcon={Box} leftLabel={product.category} />
          </div>
          <h4 className="font-semibold text-lg md:text-xl truncate tracking-tight text-zinc-900 dark:text-zinc-100 truncate leading-tight">
            {product.name}
          </h4>
        </div>
      </div>

      <div className="text-center mb-8 bg-zinc-900 dark:bg-zinc-50 p-10 md:p-12 rounded-2xl border border-transparent shadow-[0_20px_50px_-12px_rgba(0,0,0,0.2)] dark:shadow-none relative overflow-hidden text-white dark:text-black hover-tilt">
        <div className="absolute inset-x-0 bottom-0 top-1/2 bg-gradient-to-t from-emerald-500/20 to-transparent pointer-events-none"></div>
        <h3 className="text-lg md:text-xl font-semibold mb-3 tracking-tight  relative z-10">
          Rate your experience
        </h3>
        <p className="text-zinc-400 dark:text-zinc-500 text-[10px] font-semibold  tracking-normal mb-10 relative z-10">
          How much do you love it?
        </p>
        <div className="flex justify-center space-x-3 md:space-x-5 relative z-10 pb-6">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              className={`relative w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center transition-all duration-300 ${star <= rating ? "bg-yellow-400 text-yellow-900 shadow-[0_0_30px_rgba(250,204,21,0.6)] scale-110 -translate-y-2 border-2 border-yellow-200" : "bg-zinc-800 dark:bg-zinc-200 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-700 dark:hover:bg-zinc-300 hover:scale-[1.02] transition-transform"}`}
            >
              <Star
                className="w-6 h-6 md:w-7 md:h-7"
                fill={star <= rating ? "currentColor" : "none"}
              />
              {star <= rating && (
                <div className="absolute inset-0 bg-yellow-400 rounded-full animate-ping opacity-20 pointer-events-none"></div>
              )}
            </button>
          ))}
        </div>
        {rating > 0 && (
          <p className="text-xs font-semibold text-emerald-900 dark:text-emerald-50 tracking-normal mt-8 animate-fade-in relative z-10 bg-emerald-100 dark:bg-emerald-900 inline-block px-4 py-1.5 rounded-full">
            {
              [
                "Not for me",
                "Could be better",
                "It is alright",
                "Pretty good",
                "Absolutely amazing!",
              ][rating - 1]
            }
          </p>
        )}
      </div>

      <div
        className="flex-1 space-y-6 md:space-y-8 animate-slide-up"
        style={{ animationDelay: "0.1s" }}
      >
        <div className="bg-white dark:bg-zinc-900 rounded-[28px] p-2 shadow-sm border border-zinc-200 dark:border-zinc-800 transition-colors relative group mt-4">
          <textarea
            placeholder="Write a review..."
            className="w-full bg-transparent p-4 min-h-[120px] outline-none border-none font-medium text-sm leading-relaxed text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 resize-none z-10"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <div className="flex justify-between items-center px-3 pb-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-3">
              <button type="button" className="text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors">
                <svg fill="none" viewBox="0 0 24 24" height="20" width="20" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinejoin="round" strokeLinecap="round" strokeWidth="2.5" stroke="currentColor" d="M5 6C5 4.58579 5 3.87868 5.43934 3.43934C5.87868 3 6.58579 3 8 3H12.5789C15.0206 3 17 5.01472 17 7.5C17 9.98528 15.0206 12 12.5789 12H5V6Z" clipRule="evenodd" fillRule="evenodd"></path>
                </svg>
              </button>
              <button type="button" className="text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors">
                <svg fill="none" viewBox="0 0 24 24" height="20" width="20" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeWidth="2.5" stroke="currentColor" d="M12 4H19"></path>
                  <path strokeLinecap="round" strokeWidth="2.5" stroke="currentColor" d="M8 20L16 4"></path>
                  <path strokeLinecap="round" strokeWidth="2.5" stroke="currentColor" d="M5 20H12"></path>
                </svg>
              </button>
              <label className="text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors cursor-pointer">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={(e) =>
                    e.target.files && setImageFiles(Array.from(e.target.files))
                  }
                />
                <ImagePlus className="w-5 h-5" />
              </label>
            </div>
          </div>
        </div>
        
        {imageFiles.length > 0 && (
          <div className="flex gap-3 mt-4 overflow-x-auto p-1">
             {imageFiles.map((file, i) => (
                <div key={i} className="relative w-16 h-16 rounded-xl border border-zinc-200 dark:border-zinc-700 overflow-hidden shrink-0">
                  <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" alt="" />
                </div>
             ))}
          </div>
        )}
      </div>

      <div className="pt-8 mb-4">
        <button
          disabled={loading}
          onClick={handleSubmit}
          className="w-full py-5 bg-zinc-900 dark:bg-zinc-100 text-emerald-300 rounded-2xl font-semibold text-sm  tracking-normal shadow-sm shadow-emerald-900/30 hover:scale-[1.02] transition-transform hover:shadow-emerald-900/40 hover:bg-zinc-900 active:scale-95 disabled:opacity-50 disabled:hover:translate-y-0 disabled:active:scale-100 flex items-center justify-center gap-3 transition-all group border border-zinc-900 dark:border-white dark:border-emerald-900/30"
        >
          {loading ? (
            <Icon
              name="spinner-third"
              className="animate-spin text-xl text-zinc-800 dark:text-zinc-200"
            />
          ) : (
            <>
              <span>Submit Review</span>
              <Icon
                name="paper-plane"
                className="group-hover:translate-x-1 group-hover:scale-[1.02] transition-transform transition-transform"
              />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default LeaveReview;
