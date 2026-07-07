import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  getDocs,
  doc,
  deleteDoc,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import { db } from "../../firebase";
import { useNotify, useConfirm } from "../../components/Notifications";
import Icon from "../../components/Icon";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router-dom";

interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  rating: number;
  comment: string;
  images?: string[];
  createdAt: number;
}

const ManageReviews = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const notify = useNotify();
  const confirm = useConfirm();
  const navigate = useNavigate();

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "reviews"));
      const querySnapshot = await getDocs(q);
      const reviewsList: Review[] = [];
      querySnapshot.forEach((doc) => {
        reviewsList.push({ id: doc.id, ...doc.data() } as Review);
      });
      reviewsList.sort((a, b) => b.createdAt - a.createdAt);
      setReviews(reviewsList);
    } catch (error) {
      notify("Failed to fetch reviews", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (review: Review) => {
    confirm({
      title: "Delete Review",
      message: "Are you sure you want to delete this review?",
      onConfirm: async () => {
        try {
          // 1. Get the product to recalculate rating
          const productRef = doc(db, "products", review.productId);
          const productSnap = await getDoc(productRef);

          if (productSnap.exists()) {
            const productData = productSnap.data();
            const oldRating = productData.rating || 0;
            const oldNumReviews = productData.numReviews || 0;

            let newNumReviews = Math.max(0, oldNumReviews - 1);
            let newRating = 0;

            if (newNumReviews > 0) {
              newRating =
                (oldRating * oldNumReviews - review.rating) / newNumReviews;
            }

            await updateDoc(productRef, {
              rating: Number(newRating.toFixed(1)),
              numReviews: newNumReviews,
            });
          }

          // 2. Delete the review
          await deleteDoc(doc(db, "reviews", review.id));
          setReviews(reviews.filter((r) => r.id !== review.id));
          notify("Review deleted successfully", "success");
        } catch (error) {
          notify("Failed to delete review", "error");
        }
      }
    });
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto min-h-screen">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
          Manage Reviews
        </h1>
      </div>

      <div>
        {loading ? (
          <div className="py-20 text-center text-zinc-500">Loading...</div>
        ) : reviews.length === 0 ? (
          <div className="py-20 text-center text-zinc-500 font-medium">
            No reviews.
          </div>
        ) : (
          <div className="space-y-4 max-w-4xl">
            <AnimatePresence>
              {reviews.map((review) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="flex justify-between items-start p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm group hover:border-zinc-300 dark:hover:border-zinc-700 transition"
                >
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 truncate">
                        {review.userName}
                      </span>
                      <div className="flex items-center text-yellow-400">
                        {Array.from({ length: review.rating }).map((_, i) => (
                          <Icon key={i} name="star" className="text-[10px]" />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1 line-clamp-2">
                      {review.comment}
                    </p>
                    <div className="text-[10px] text-zinc-400 mt-2 font-medium">
                      Product ID: {review.productId} • {new Date(review.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleDelete(review)}
                      className="flex items-center justify-center size-8 rounded-full bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors shrink-0"
                    >
                      <Icon name="trash" className="text-red-500 text-xs" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageReviews;
