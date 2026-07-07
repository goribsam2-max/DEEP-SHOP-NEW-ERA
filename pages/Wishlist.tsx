import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import { motion, AnimatePresence } from "framer-motion";
import { useNotify } from "../components/Notifications";
import Icon from "../components/Icon";
import { CustomSectionEmbed } from "../components/CustomSectionEmbed";
import { useRegion } from "../components/RegionContext";
import { useTheme } from "../components/ThemeContext";
import { useLanguage } from "../components/LanguageContext";

const Wishlist: React.FC = () => {
  const navigate = useNavigate();
  const notify = useNotify();
  const { isDark, toggleTheme } = useTheme();
  const { formatPrice } = useRegion();
  const { t } = useLanguage();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "users", auth.currentUser.uid, "wishlist"),
      orderBy("addedAt", "desc"),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setItems(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const removeFromWishlist = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!auth.currentUser) return;
    try {
      await deleteDoc(doc(db, "users", auth.currentUser.uid, "wishlist", id));
      notify("Removed from wishlist", "info");
    } catch (err) {
      notify("Failed to remove item", "error");
    }
  };

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-800">
        <div className="w-10 h-10 border-4 border-zinc-900 dark:border-white border-t-transparent rounded-full animate-spin"></div>
      </div>
    );

  return (
    <div className="w-full bg-zinc-50 dark:bg-[#000000] min-h-screen pb-[120px] md:pb-10">
      <div className="px-6 md:px-12 py-10 max-w-7xl mx-auto">
      

      {!auth.currentUser ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-24 h-24 bg-white dark:bg-zinc-900 rounded-2xl flex items-center justify-center mb-8 border border-zinc-200 dark:border-zinc-800">
            <Icon
              name="lock"
              className="text-2xl text-zinc-400 dark:text-zinc-500"
            />
          </div>
          <h2 className="text-xl font-semibold mb-2 tracking-tight text-zinc-900 dark:text-zinc-100">
            {t('Sign In Required') || 'Sign In Required'}
          </h2>
          <p className="text-sm font-medium text-zinc-500 mb-10 max-w-xs mx-auto">
            {t('Please login to view and manage your saved tech essentials.') || 'Please login to view and manage your saved tech essentials.'}
          </p>
          <button
            onClick={() => navigate("/auth-selector")}
            className="px-8 py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-full font-semibold text-sm hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center space-x-3 mx-auto"
          >
            <span>{t('Sign In Now') || 'Sign In Now'}</span>
          </button>
        </div>
      ) : items.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-32 text-center"
        >
          <div className="w-24 h-24 bg-white dark:bg-zinc-900 rounded-2xl flex items-center justify-center mb-6 border border-zinc-200 dark:border-zinc-800">
            <Icon
              name="heart"
              className="text-2xl text-zinc-400 dark:text-zinc-500"
            />
          </div>
          <p className="text-sm font-medium text-zinc-500">{t('Nothing saved yet') || 'Nothing saved yet'}</p>
          <button
            onClick={() => navigate("/")}
            className="mt-8 px-8 py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-full font-semibold text-sm hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            {t('Start Exploring') || 'Start Exploring'}
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
          <AnimatePresence mode="popLayout">
            {items.map((item) => (
              <motion.div
                layout
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={() => navigate(`/product/${item.productId}`)}
                className="group cursor-pointer relative bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2 md:p-3 rounded-2xl hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
              >
                <div className="aspect-[4/5] flex items-center justify-center bg-zinc-50 dark:bg-zinc-800/50 rounded-xl mb-4 overflow-hidden relative transition-all duration-300">
                  <img
                    src={item.image || (item.images && item.images[0]) || "https://via.placeholder.com/150"}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500 ease-out mix-blend-multiply dark:mix-blend-normal"
                    alt={item.name}
                  />
                  <button
                    onClick={(e) => removeFromWishlist(item.id, e)}
                    className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md text-red-500 rounded-2xl shadow-sm hover:bg-red-50 hover:dark:bg-red-900/20 transition-colors z-10 opacity-0 group-hover:opacity-100"
                  >
                    <Icon name="trash-alt" className="text-[10px]" />
                  </button>
                </div>
                <div className="px-1 pb-1">
                  <h4 className="font-semibold text-xs md:text-sm truncate mb-1 Tracking-tight text-zinc-900 dark:text-zinc-100">
                    {item.name || "Unknown Product"}
                  </h4>
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-400">
                    {item.price != null ? formatPrice(item.price) : "Price not available"}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
      <CustomSectionEmbed location="wishlist_bottom" />
      </div>
    </div>
  );
};

export default Wishlist;
