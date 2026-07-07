import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  collection,
  query,
  where,
  getDocs,
  limit,
  orderBy,
} from "firebase/firestore";
import { db, auth } from "../firebase";
import { Blog } from "../types";
import Icon from "../components/Icon";
import SEO from "../components/SEO";
import { StatusBadge } from "../components/ui/status-badge";
import { useNotify, useConfirm } from "../components/Notifications";
import Markdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import { motion } from "framer-motion";
import { CalendarDays, Pen, Trash2 } from "lucide-react";
import { useRegion } from "../components/RegionContext";

const BlogDetails: React.FC = () => {
  const { formatPrice } = useRegion();
  const { slug } = useParams();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [recentBlogs, setRecentBlogs] = useState<Blog[]>([]);
  const [pillProducts, setPillProducts] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  const notify = useNotify();
  const confirm = useConfirm();

  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        import("firebase/firestore").then(async ({ doc, getDoc }) => {
          const udoc = await getDoc(doc(db, "users", user.uid));
          if (
            udoc.exists() &&
            (udoc.data().role === "admin" ||
              udoc.data().role === "staff" ||
              udoc.data().email === "admin@vibe.shop" ||
              user.email === "vibegadgetfeni@gmail.com" ||
              user.email === "deepshop@gmail.com" ||
              user.email === "deepshopbysam@gmail.com")
          ) {
            setIsAdmin(true);
          }
        });
      } else {
        setIsAdmin(false);
      }
    });
    return unsubAuth;
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchBlog = async () => {
      try {
        const { doc, getDoc } = await import("firebase/firestore");
        const q = query(
          collection(db, "blogs"),
          where("slug", "==", slug),
          limit(1),
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          const bData = { id: snap.docs[0].id, ...snap.docs[0].data() } as Blog;
          setBlog(bData);

          // Fetch product pills content
          const pIds = Array.from(
            bData.content.matchAll(/\[\[product:([A-Za-z0-9_-]+)\]\]/g),
          ).map((m) => m[1]);
          if (pIds.length > 0) {
            const fetchedProds: Record<string, any> = {};
            await Promise.all(
              pIds.map(async (pid) => {
                const pdoc = await getDoc(doc(db, "products", pid));
                if (pdoc.exists())
                  fetchedProds[pid] = { id: pdoc.id, ...pdoc.data() };
              }),
            );
            setPillProducts(fetchedProds);
          }
        }

        const qRecent = query(
          collection(db, "blogs"),
          orderBy("createdAt", "desc"),
          limit(4),
        );
        const snapRecent = await getDocs(qRecent);
        setRecentBlogs(
          snapRecent.docs
            .map((d) => ({ id: d.id, ...d.data() }) as Blog)
            .filter((b) => b.slug !== slug)
            .slice(0, 3),
        );
      } catch (e) {}
      setLoading(false);
    };
    fetchBlog();
  }, [slug]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-800 border-t-transparent rounded-full">
        <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-center px-6 dark:bg-zinc-800">
        <Icon
          name="newspaper"
          className="text-xl text-zinc-200 dark:text-zinc-800 dark:text-zinc-200 mb-6"
        />
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 dark:text-zinc-50 mb-2">
          Article Not Found
        </h2>
        <p className="text-sm text-zinc-500 mb-8 max-w-sm">
          The article you are looking for does not exist or has been removed.
        </p>
      </div>
    );
  }

  const processedContent = blog.content.replace(/\[\[product:([A-Za-z0-9_-]+)\]\]/g, "prod://$1");

  return (
    <div className="min-h-screen bg-background text-foreground font-sans">
      <SEO title={blog.title} description={blog.excerpt} />
      
      <div className="bg-zinc-900 rounded-3xl mx-2 md:mx-6 mt-4 md:mt-6 overflow-hidden relative">
        {blog.image && (
          <img
            src={blog.image}
            className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay"
            alt=""
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/60 to-transparent"></div>
        <div className="relative z-10 p-6 md:p-12 md:pb-16 max-w-4xl w-full mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="mb-4">
              <StatusBadge leftIcon={CalendarDays} leftLabel={new Date(blog.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })} />
            </div>
            <h1 className="text-xl md:text-lg lg:text-xl font-semibold text-white tracking-tight leading-[1.1] ">
              {blog.title}
            </h1>
          </motion.div>
        </div>
      </div>

      {isAdmin && (
        <div className="max-w-4xl w-full mx-auto px-6 mt-6">
          <div className="bg-amber-500/10 border border-amber-500/25 text-amber-800 dark:text-amber-200 p-4 rounded-2xl flex flex-wrap gap-4 items-center justify-between">
            <div className="flex items-center gap-2 font-semibold text-xs uppercase tracking-wider">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shrink-0"></span>
              <span>Admin Actions</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate(`/blog/edit/${blog.slug}`)}
                className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors shadow flex items-center gap-1.5"
              >
                <Pen className="w-3.5 h-3.5" />
                <span>Edit Post</span>
              </button>
              <button
                onClick={() => {
                  confirm({
                    title: "Delete Blog Post?",
                    message: "Are you sure you want to permanently delete this blog post? This action cannot be undone.",
                    onConfirm: async () => {
                      const { deleteDoc, doc } = await import("firebase/firestore");
                      await deleteDoc(doc(db, "blogs", blog.id));
                      notify("Blog post removed successfully.", "info");
                      navigate("/blog");
                    }
                  });
                }}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors shadow flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Post</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-4xl w-full mx-auto px-6 py-12 md:py-16 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-16">
        <article className="prose prose-zinc dark:prose-invert prose-lg md:prose-xl max-w-none">
          <div className="markdown-body text-zinc-700 dark:text-zinc-300 font-medium leading-relaxed">
            <Markdown
              rehypePlugins={[rehypeRaw]}
              components={{
                a: ({ node, ...props }) => {
                  if (props.href?.startsWith("prod://")) {
                    const pid = props.href.replace("prod://", "");
                    const p = pillProducts[pid];
                    if (!p) return null;
                    return (
                      <Link
                        to={`/product/${pid}`}
                        className="not-prose flex items-center gap-4 p-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl hover:border-zinc-900 dark:border-zinc-100 transition-colors shadow-sm my-6 cursor-pointer group no-underline"
                      >
                        <div className="w-20 h-20 bg-zinc-50 dark:bg-zinc-800 rounded-full p-2 shrink-0 border border-zinc-100 dark:border-zinc-800 group-hover:scale-105 transition-transform">
                          <img
                            src={p.image}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 dark:text-zinc-50 truncate">
                            {p.name}
                          </h4>
                          <p className="text-[10px]  font-bold text-zinc-800 dark:text-zinc-200 tracking-normal mb-1">
                            {p.category}
                          </p>
                          <p className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">
                            {formatPrice(p.isOffer ? p.offerPrice : p.price)}
                          </p>
                        </div>
                        <div className="hidden md:flex w-10 h-10 rounded-full bg-zinc-50 dark:bg-zinc-900 dark:bg-emerald-900/40 text-zinc-800 dark:text-zinc-200 dark:text-zinc-800 dark:text-zinc-200 items-center justify-center -translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all shrink-0">
                          <Icon name="arrow-right" />
                        </div>
                      </Link>
                    );
                  }
                  return (
                    <a
                      {...props}
                      className="text-zinc-800 dark:text-zinc-200 dark:text-zinc-800 dark:text-zinc-200 no-underline border-b-2 border-emerald-600/30 hover:border-emerald-600 hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-emerald-900/40 transition-colors"
                      target="_blank"
                      rel="noopener noreferrer"
                    />
                  );
                },
                img: ({ node, ...props }) => (
                  <span className="not-prose block my-8">
                    <img
                      {...props}
                      className="w-full rounded-full shadow-lg border border-zinc-100 dark:border-zinc-800"
                    />
                  </span>
                ),
                p: ({ node, ...props }) => (
                  <p {...props} className="mb-6 whitespace-pre-wrap" />
                ),
              }}
            >
              {processedContent}
            </Markdown>
          </div>

          <div className="mt-16 pt-8 border-t border-zinc-200 dark:border-zinc-700 dark:border-zinc-800 flex items-center justify-between">
            <div>
              <h4 className="text-[10px] font-bold text-zinc-400  tracking-normal mb-1">
                Share this article
              </h4>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    notify("Link copied to clipboard!", "success");
                  }}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 transition-colors"
                >
                  <Icon name="link" />
                </button>
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(blog.title)}&url=${encodeURIComponent(window.location.href)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 transition-colors"
                >
                  <Icon name="twitter" />
                </a>
              </div>
            </div>
          </div>
        </article>

        <aside>
          <h3 className="text-xs font-semibold  tracking-normal text-zinc-400 mb-6 border-b border-zinc-200 dark:border-zinc-700 dark:border-zinc-800 pb-2">
            Recent Posts
          </h3>
          <div className="space-y-6">
            {recentBlogs.map((rb) => (
              <Link to={`/blog/${rb.slug}`} key={rb.id} className="group block">
                <div className="aspect-video bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden mb-3">
                  <img
                    src={rb.image}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    alt={rb.title}
                  />
                </div>
                <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-tight group-hover:text-zinc-800 dark:text-zinc-200 transition-colors">
                  {rb.title}
                </h4>
                <p className="text-[10px] text-zinc-500 font-bold  tracking-normal mt-2">
                  {new Date(rb.createdAt).toLocaleDateString()}
                </p>
              </Link>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
};
export default BlogDetails;
