import { useState, useRef } from "react";
import { auth, db } from "../../firebase";
import { collection, addDoc, doc, updateDoc } from "firebase/firestore";
import { uploadToImgbb } from "../../services/imgbb";
import { useNotify } from "../Notifications";
import Icon from "../Icon";
import { Star, ImagePlus } from "lucide-react";

export function ReviewComposer({ productId, product, onReviewAdded }: { productId?: string, product: any, onReviewAdded?: () => void }) {
  const notify = useNotify();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    if (!auth.currentUser) return notify("Please login to leave a review.", "error");
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
      setComment("");
      setRating(0);
      setImageFiles([]);
      setIsExpanded(false);
      onReviewAdded?.();
    } catch (err) {
      notify("Failed to post review.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      if (imageFiles.length + files.length > 3) {
        notify("Maximum 3 images allowed", "error");
        return;
      }
      setImageFiles((prev) => [...prev, ...files]);
    }
  };

  if (!isExpanded) {
     return (
        <div className="w-full flex justify-center md:justify-end">
           <button
             onClick={() => setIsExpanded(true)}
             className="px-8 py-4 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-full text-xs font-semibold hover:scale-[1.02] active:scale-95 transition-all flex items-center space-x-3 group border border-zinc-900 dark:border-zinc-100 shadow-sm"
           >
             <div className="w-8 h-8 rounded-full bg-white/10 dark:bg-black/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
               <Icon name="pen" className="text-sm" />
             </div>
             <span>Write a Review</span>
           </button>
        </div>
     );
  }

  return (
    <div className="w-full bg-zinc-50 dark:bg-zinc-900/50 p-2 rounded-3xl border border-zinc-200 dark:border-zinc-800 animate-in fade-in zoom-in-95 shadow-sm">
      <div className="flex flex-col gap-2 relative">
        <div className="flex justify-between items-center px-2 pt-2">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="transition-transform hover:scale-110 p-1"
                >
                  <Star
                    className={star <= rating ? "text-yellow-400 w-5 h-5" : "text-zinc-300 dark:text-zinc-600 w-5 h-5"}
                    fill={star <= rating ? "currentColor" : "none"}
                  />
                </button>
              ))}
            </div>
            {/* Cancel Button */}
            <button onClick={() => setIsExpanded(false)} className="text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors p-1">
                <Icon name="times" className="text-xs" />
            </button>
        </div>
        
        <textarea 
          className="w-full bg-transparent border-none outline-none resize-none min-h-[80px] text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 p-3 font-medium"
          placeholder="Share your experience..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
        
        {imageFiles.length > 0 && (
          <div className="flex gap-2 px-3 pb-2 overflow-x-auto">
            {imageFiles.map((file, idx) => (
              <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-zinc-200 dark:border-zinc-700">
                <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setImageFiles(files => files.filter((_, i) => i !== idx))}
                  className="absolute top-1 right-1 w-5 h-5 bg-black/50 text-white rounded-full flex items-center justify-center backdrop-blur-sm hover:bg-red-500 transition-colors"
                >
                  <Icon name="times" className="text-[10px]" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-between items-center px-1 pb-1">
          <div className="flex items-center gap-1">
            <input 
              type="file" 
              accept="image/*" 
              multiple 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleImageSelect}
            />
            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()}
              className="w-9 h-9 flex items-center justify-center text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-200/50 dark:hover:bg-zinc-800 rounded-full transition-colors"
            >
              <ImagePlus className="w-5 h-5" />
            </button>
          </div>

          <button 
            type="button" 
            onClick={handleSubmit}
            disabled={loading || !comment.trim() || rating === 0}
            className="w-9 h-9 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
          >
            {loading ? (
               <div className="w-4 h-4 border-2 border-white dark:border-zinc-900 border-t-transparent rounded-full animate-spin" />
            ) : (
               <svg fill="none" viewBox="0 0 24 24" height="18" width="18" xmlns="http://www.w3.org/2000/svg">
                 <path strokeLinejoin="round" strokeLinecap="round" strokeWidth="2.5" stroke="currentColor" d="M12 5L12 20"></path>
                 <path strokeLinejoin="round" strokeLinecap="round" strokeWidth="2.5" stroke="currentColor" d="M7 9L11.2929 4.70711C11.6262 4.37377 11.7929 4.20711 12 4.20711C12.2071 4.20711 12.3738 4.37377 12.7071 4.70711L17 9"></path>
               </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
