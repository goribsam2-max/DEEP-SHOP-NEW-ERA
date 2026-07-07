import React, { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { Blog } from "../types";
import { useNavigate } from "react-router-dom";
import Icon from "../components/Icon";
import SEO from "../components/SEO";
import { PostCard } from "../components/ui/post-card";
import { motion } from "framer-motion";
import { useConfirm } from "../components/Notifications";

const BlogList: React.FC = () => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const confirm = useConfirm();

  useEffect(() => {
    // Check if current user is admin
    const checkAdmin = async () => {
      import("../firebase").then(({ auth, db }) => {
        import("firebase/auth").then(({ onAuthStateChanged }) => {
          onAuthStateChanged(auth, async (user) => {
            if (user) {
              import("firebase/firestore").then(async ({ doc, getDoc }) => {
                const udoc = await getDoc(doc(db, "users", user.uid));
                if (
                  udoc.exists() &&
                  (udoc.data().role === "admin" ||
                    udoc.data().role === "staff" ||
                    udoc.data().email === "admin@vibe.shop")
                ) {
                  setIsAdmin(true);
                }
              });
            }
          });
        });
      });
    };
    checkAdmin();

    const q = query(collection(db, "blogs"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setBlogs(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Blog));
      setLoading(false);
    });
    return unsub;
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Tech Blog & Gadget Reviews | DEEP SHOP"
        description="Read our latest top 5 gadget lists, tech tips, and product reviews."
      />

      <div className="bg-zinc-900 dark:bg-zinc-950 text-white p-8 md:p-12 mb-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-zinc-900/20 z-0"></div>
        <div className="relative z-10 max-w-6xl mx-auto flex justify-between items-start">
          <div>
            
            <h1 className="text-xl md:text-3xl font-semibold tracking-tight mb-2 text-white truncate max-w-2xl">
              Tech Insights & Hacks
            </h1>
            <p className="text-zinc-300 max-w-2xl text-sm md:text-base leading-relaxed opacity-90 truncate">
              Stay updated with our latest gadgets review, tips to extend your battery life, smart home tutorials, and more.
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={() => navigate("/blog/create")}
              className="mt-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-6 py-3 rounded-full text-xs font-bold tracking-wider hover:bg-zinc-800 dark:bg-zinc-200 transition-colors shadow-lg flex items-center space-x-2 relative z-20"
            >
              <Icon name="plus" />
              <span>New Post</span>
            </button>
          )}
        </div>
        <div className="absolute -bottom-10 -right-10 text-9xl opacity-5 pointer-events-none text-white">
          <Icon name="newspaper" />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 md:px-8 mb-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground whitespace-nowrap">
            Latest Posts
          </h2>
        </div>
        {loading ? (
          <div className="flex justify-center p-20">
            <div className="w-10 h-10 border-4 border-zinc-900 dark:border-zinc-100 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {blogs.map((blog, i) => (
              <motion.div
                key={blog.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <PostCard
                  blog={blog}
                  isAdmin={isAdmin}
                  onEdit={() => navigate(`/blog/edit/${blog.slug}`)}
                  onDelete={() => {
                    confirm({
                      title: "Delete Blog Post",
                      message: "Are you sure you want to delete this post?",
                      onConfirm: async () => {
                        const { deleteDoc, doc } = await import("firebase/firestore");
                        await deleteDoc(doc(db, "blogs", blog.id));
                      }
                    });
                  }}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
export default BlogList;
