import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, collection, query, where, onSnapshot } from "firebase/firestore";
import { db, auth } from "../firebase";
import { Product, Review } from "../types";
import { ChevronLeft, Star } from "lucide-react";
import { Tr } from "../components/Tr";
import { ReviewCard } from "../components/ui/review-card";

const ProductReviews: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filter, setFilter] = useState<"all" | "photos" | "5-stars" | "4-stars" | "3-stars" | "2-stars" | "1-star">("all");

  useEffect(() => {
    if (!id) return;
    getDoc(doc(db, "products", id)).then(snap => {
      if (snap.exists()) setProduct({ id: snap.id, ...snap.data() } as Product);
    });

    const q = query(collection(db, "reviews"), where("productId", "==", id));
    const unsub = onSnapshot(q, (snapshot) => {
      const reviewList = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() }) as Review,
      );
      reviewList.sort((a, b) => b.createdAt - a.createdAt);
      setReviews(reviewList);
    });

    return () => unsub();
  }, [id]);

  const filteredReviews = useMemo(() => {
    if (filter === "photos") {
      return reviews.filter(r => (r as any).images && (r as any).images.length > 0);
    }
    if (filter.includes("-star")) {
      const targetStars = parseInt(filter.charAt(0));
      return reviews.filter(r => Math.round(r.rating) === targetStars);
    }
    return reviews;
  }, [reviews, filter]);

  if (!product) return <div className="min-h-screen bg-white dark:bg-zinc-950" />;

  const averageRating = reviews.length > 0
    ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1)
    : "0.0";

  return (
    <div className="max-w-3xl mx-auto min-h-screen bg-white dark:bg-zinc-950 pb-12">
      
      {/* Header Context */}
      <div className="sticky top-[56px] md:top-[64px] bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl border-b border-zinc-100 dark:border-zinc-900 z-40 pt-4">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(`/product/${id}`)}
              className="w-10 h-10 flex items-center shrink-0 justify-center rounded-full bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="min-w-0 pr-2">
              <h1 className="text-[17px] font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 line-clamp-1">
                {product.name}
              </h1>
              <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 mt-0.5 font-medium">
                <span>{reviews.length} reviews</span>
                <span>•</span>
                <span>{averageRating}</span>
                <Star className="w-3.5 h-3.5 text-[#FF7D2B] fill-[#FF7D2B] -ml-1" />
              </div>
            </div>
          </div>
          {product.images && product.images[0] && (
            <img 
               src={product.images[0]} 
               alt={product.name} 
               className="w-14 h-14 rounded-xl object-cover shrink-0 border border-zinc-100 dark:border-zinc-800 hidden sm:block"
            />
          )}
        </div>

        {/* Filter Chips */}
        <div className="px-4 pb-3 flex gap-2 overflow-x-auto custom-scrollbar">
           <button 
              onClick={() => setFilter('all')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap border ${filter === 'all' ? 'bg-zinc-900 border-zinc-900 text-white dark:bg-zinc-100 dark:border-zinc-100 dark:text-zinc-900' : 'bg-transparent border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400 hover:text-zinc-900'}`}
           >
              All
           </button>
           <button 
              onClick={() => setFilter('photos')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap border ${filter === 'photos' ? 'bg-zinc-900 border-zinc-900 text-white dark:bg-zinc-100 dark:border-zinc-100 dark:text-zinc-900' : 'bg-transparent border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400 hover:text-zinc-900'}`}
           >
              With photos
           </button>
           <button 
              onClick={() => setFilter('5-stars')}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap border ${filter === '5-stars' ? 'bg-zinc-900 border-zinc-900 text-white dark:bg-zinc-100 dark:border-zinc-100 dark:text-zinc-900' : 'bg-transparent border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400 hover:text-zinc-900'}`}
           >
              5 stars
           </button>
        </div>
      </div>

      <div className="px-4 md:px-8 py-2 flex flex-col">
        {filteredReviews.length === 0 ? (
           <p className="text-zinc-500 text-center py-12">No reviews match your filter.</p>
        ) : (
           filteredReviews.map((review) => (
             <ReviewCard
               key={review.id}
               name={review.userName}
               review={review.comment}
               rating={review.rating}
               images={(review as any).images}
               createdAt={review.createdAt}
             />
           ))
        )}
      </div>
    </div>
  );
};

export default ProductReviews;
