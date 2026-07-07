import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { db, auth } from "../firebase";
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  query,
  collection,
  getDocs,
} from "firebase/firestore";
import { Product } from "../types";
import { useNotify } from "../components/Notifications";
import { uploadToImgbb } from "../services/imgbb";
import Icon from "../components/Icon";

const CreateBlog: React.FC = () => {
  const navigate = useNavigate();
  const { slug } = useParams();
  const notify = useNotify();

  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [existingImage, setExistingImage] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDesc, setSeoDesc] = useState("");

  const [saving, setSaving] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [showProductSelect, setShowProductSelect] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inlineImgInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchProductsAndBlog = async () => {
      const snap = await getDocs(query(collection(db, "products")));
      setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Product));

      if (slug) {
        const bDoc = await getDoc(doc(db, "blogs", slug));
        if (bDoc.exists()) {
          const b = bDoc.data();
          setTitle(b.title || "");
          setExcerpt(b.excerpt || "");
          setContent(b.content || "");
          setSeoTitle(b.seoTitle || "");
          setSeoDesc(b.seoDescription || "");
          setExistingImage(b.image || "");
        }
      }
    };
    fetchProductsAndBlog();
  }, [slug]);

  const insertText = (text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newContent =
      content.substring(0, start) + text + content.substring(end);
    setContent(newContent);
    // Focus and move cursor
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + text.length, start + text.length);
    }, 0);
  };

  const handleFormat = (format: string) => {
    switch (format) {
      case "h2":
        insertText("## Heading 2\n");
        break;
      case "h3":
        insertText("### Heading 3\n");
        break;
      case "h4":
        insertText("#### Heading 4\n");
        break;
      case "p":
        insertText("\n\nParagraph text here...\n\n");
        break;
      case "italic":
        insertText("*italic*");
        break;
      case "underline":
        insertText("<u>underline</u>");
        break;
      case "list":
        insertText("\n1. List item 1\n2. List item 2\n");
        break;
      case "link":
        insertText("[Link Name](https://...)");
        break;
    }
  };

  const handleInlineImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    notify("Uploading image...", "info");
    try {
      const url = await uploadToImgbb(file);
      insertText(`\n![Image](${url})\n`);
      notify("Image inserted", "success");
    } catch (err) {
      notify("Failed to upload info image", "error");
    }
  };

  const handleProductPill = (prodId: string) => {
    insertText(`\n[[product:${prodId}]]\n`);
    setShowProductSelect(false);
  };

  const generateSlug = (str: string) =>
    str
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

  const handleSave = async () => {
    if (!title || !excerpt || !content)
      return notify("Please fill title, excerpt and content", "error");
    setSaving(true);
    let imageUrl = existingImage;
    if (imageFile) {
      try {
        imageUrl = await uploadToImgbb(imageFile);
      } catch (e) {
        setSaving(false);
        return notify("Featured image upload failed", "error");
      }
    }

    try {
      if (slug) {
        // Update existing
        await updateDoc(doc(db, "blogs", slug), {
          title,
          excerpt,
          content,
          image: imageUrl,
          seoTitle: seoTitle || title,
          seoDescription: seoDesc || excerpt,
          metaImage: imageUrl,
        });
        notify("Blog Updated!", "success");
      } else {
        const newSlug =
          generateSlug(title) + "-" + Date.now().toString().slice(-4);
        await setDoc(doc(db, "blogs", newSlug), {
          title,
          slug: newSlug,
          excerpt,
          content,
          image: imageUrl,
          seoTitle: seoTitle || title,
          seoDescription: seoDesc || excerpt,
          metaImage: imageUrl,
          authorId: auth.currentUser?.uid || "admin",
          authorName: auth.currentUser?.displayName || "DeepShop Team",
          createdAt: Date.now(),
          views: 0,
        });
        notify("Blog Published!", "success");
      }
      navigate("/blog");
    } catch (e) {
      notify("Failed to save blog", "error");
    }
    setSaving(false);
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-10 min-h-screen bg-zinc-50 dark:bg-zinc-800 font-inter">
      

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <label className="text-xs font-bold  tracking-normal text-zinc-500 mb-2 block">
              Blog Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-4 font-bold outline-none text-zinc-900 dark:text-zinc-100"
              placeholder="e.g. Top 5 smartwatches in 2024"
            />
          </div>
          <div>
            <label className="text-xs font-bold  tracking-normal text-zinc-500 mb-2 block">
              Short Excerpt
            </label>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={3}
              className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-4 font-medium outline-none text-zinc-900 dark:text-zinc-100 resize-none"
              placeholder="A short description for the blog list card..."
            ></textarea>
          </div>

          <div className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-full shadow-sm overflow-hidden flex flex-col">
            <div className="bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-700 flex flex-wrap items-center p-2 gap-2">
              <button
                onClick={() => handleFormat("h2")}
                className="px-3 py-1.5 hover:bg-zinc-200 rounded-md text-xs font-bold text-zinc-600 dark:text-zinc-400"
              >
                H2
              </button>
              <button
                onClick={() => handleFormat("h3")}
                className="px-3 py-1.5 hover:bg-zinc-200 rounded-md text-xs font-bold text-zinc-600 dark:text-zinc-400"
              >
                H3
              </button>
              <button
                onClick={() => handleFormat("h4")}
                className="px-3 py-1.5 hover:bg-zinc-200 rounded-md text-xs font-bold text-zinc-600 dark:text-zinc-400"
              >
                H4
              </button>
              <div className="w-px h-4 bg-zinc-300"></div>
              <button
                onClick={() => handleFormat("italic")}
                className="px-3 py-1.5 hover:bg-zinc-200 rounded-md text-xs italic font-serif text-zinc-600 dark:text-zinc-400"
              >
                I
              </button>
              <button
                onClick={() => handleFormat("underline")}
                className="px-3 py-1.5 hover:bg-zinc-200 rounded-md text-xs underline text-zinc-600 dark:text-zinc-400"
              >
                U
              </button>
              <div className="w-px h-4 bg-zinc-300"></div>
              <button
                onClick={() => handleFormat("list")}
                className="px-3 py-1.5 hover:bg-zinc-200 rounded-md text-xs font-medium text-zinc-600 dark:text-zinc-400"
              >
                <Icon name="list-ol" />
              </button>
              <button
                onClick={() => handleFormat("link")}
                className="px-3 py-1.5 hover:bg-zinc-200 rounded-md text-xs font-medium text-zinc-600 dark:text-zinc-400"
              >
                <Icon name="link" />
              </button>
              <div className="w-px h-4 bg-zinc-300"></div>
              <button
                onClick={() => inlineImgInputRef.current?.click()}
                className="px-3 py-1.5 hover:bg-zinc-200 rounded-md text-xs font-medium text-zinc-600 dark:text-zinc-400 flex items-center gap-1"
              >
                <Icon name="image" /> Image
              </button>
              <input
                type="file"
                hidden
                ref={inlineImgInputRef}
                onChange={handleInlineImage}
                accept="image/*"
              />

              <div className="relative">
                <button
                  onClick={() => setShowProductSelect(!showProductSelect)}
                  className="px-3 py-1.5 bg-zinc-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:bg-zinc-700 rounded-md text-xs font-bold flex items-center gap-1"
                >
                  <Icon name="box" /> Product Pill
                </button>
                {showProductSelect && (
                  <div className="absolute top-10 left-0 w-64 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-sm rounded-2xl z-50 max-h-60 overflow-y-auto">
                    {products.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => handleProductPill(p.id)}
                        className="p-3 hover:bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-100 dark:border-zinc-800 cursor-pointer flex items-center gap-3"
                      >
                        <img
                          src={p.image}
                          className="w-8 h-8 rounded-md object-cover"
                        />
                        <span className="text-[10px] font-bold  truncate">
                          {p.name}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="flex-1 min-h-[500px] p-6 outline-none font-mono text-sm leading-relaxed text-zinc-800 dark:text-zinc-200"
              placeholder="Write your blog content here. Uses Markdown syntax. You can use HTML tags like <u>underline</u> too."
            />
          </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <div className="bg-zinc-50 dark:bg-zinc-800 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-700">
            <h3 className="text-xs font-bold  tracking-normal text-zinc-800 dark:text-zinc-200 mb-4">
              Featured Image
            </h3>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-full aspect-video border-2 border-solid border-zinc-300 rounded-full flex items-center justify-center cursor-pointer hover:bg-zinc-100 dark:bg-zinc-800 transition-colors overflow-hidden"
            >
              {imageFile ? (
                <img
                  src={URL.createObjectURL(imageFile)}
                  className="w-full h-full object-cover"
                />
              ) : existingImage ? (
                <img
                  src={existingImage}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center text-zinc-400">
                  <Icon name="cloud-upload" className="text-lg mb-2" />
                  <p className="text-[10px]  font-bold tracking-normal">
                    Upload Cover
                  </p>
                </div>
              )}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              hidden
              onChange={(e) => {
                if (e.target.files) setImageFile(e.target.files[0]);
              }}
              accept="image/*"
            />
          </div>

          <div className="bg-zinc-50 dark:bg-zinc-800 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-700 space-y-4">
            <h3 className="text-xs font-bold  tracking-normal text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Icon name="google" className="text-blue-500" /> SEO Settings
            </h3>
            <p className="text-[10px] text-zinc-500 font-medium">
              Meta data for Google indexing & Social Media shares.
            </p>
            <div>
              <label className="text-[10px] font-bold  tracking-wide text-zinc-500 block mb-1">
                SEO Title
              </label>
              <input
                type="text"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3 text-xs outline-none"
                placeholder="Default uses Blog Title"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold  tracking-wide text-zinc-500 block mb-1">
                Meta Description
              </label>
              <textarea
                value={seoDesc}
                onChange={(e) => setSeoDesc(e.target.value)}
                className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-3 text-xs outline-none resize-none"
                rows={3}
                placeholder="Default uses Excerpt"
              ></textarea>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-4 mt-4 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-full text-xs font-bold  tracking-normal hover:bg-zinc-800 transition-colors shadow-lg active:scale-95"
            >
              {saving ? "Publishing..." : slug ? "Update Blog" : "Publish Blog"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default CreateBlog;
