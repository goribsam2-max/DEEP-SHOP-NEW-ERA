import { useState } from "react";
import { Send, Heart, Bookmark, Edit, Trash } from "lucide-react";
import { cn } from "../../lib/utils";
import { Link } from "react-router-dom";

export interface BlogItem {
  id: string;
  title: string;
  excerpt?: string;
  image: string;
  createdAt: number;
  slug: string;
}

interface PostCardProps {
  blog: BlogItem;
  isAdmin?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const PostCard: React.FC<PostCardProps> = ({ blog, isAdmin, onEdit, onDelete }) => {
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  const handleLike = () => {
    setLiked((prev) => !prev);
  };

  const handleBookmark = () => {
    setBookmarked((prev) => !prev);
  };

  return (
    <div className="w-full rounded-3xl bg-background border border-border shadow-xl/5 p-5 hover:shadow-2xl/10 transition-shadow relative group">
      {isAdmin && (
        <div className="absolute top-4 right-4 z-20 flex gap-2">
          <button
            onClick={onEdit}
            className="bg-white dark:bg-zinc-800/80 p-2 rounded-full shadow border border-zinc-200 dark:border-zinc-700 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors backdrop-blur-sm"
          >
            <Edit className="size-4" />
          </button>
          <button
            onClick={onDelete}
            className="bg-white dark:bg-zinc-800/80 p-2 rounded-full shadow border border-zinc-200 dark:border-zinc-700 text-zinc-600 hover:text-red-500 dark:text-zinc-400 dark:hover:text-red-500 transition-colors backdrop-blur-sm"
          >
            <Trash className="size-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img
            src="https://images.unsplash.com/photo-1542744094-3a31f272c490?w=100&h=100&fit=crop&q=80"
            alt="Author avatar"
            width={40}
            height={40}
            className="rounded-full object-cover"
          />
          <div>
            <h3 className="flex flex-col font-semibold text-foreground">
              DeepShop Team
              <span className="flex items-center gap-1 opacity-60 text-xs font-normal">
                <span>@deepshop.top</span>
                <span>&middot;</span>
                <span>
                  {new Date(blog.createdAt).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </span>
            </h3>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mt-5 flex flex-col gap-4">
        <Link to={`/blog/${blog.slug}`}>
          <h2 className="text-xl font-bold tracking-tight text-foreground hover:text-zinc-900 dark:text-zinc-100 transition-colors">
            {blog.title}
          </h2>
          <p className="whitespace-pre-wrap text-sm md:text-base text-muted-foreground leading-relaxed font-sans mt-2">
            {blog.excerpt}
          </p>
        </Link>
        <Link to={`/blog/${blog.slug}`}>
          <img
            src={blog.image}
            alt={blog.title}
            className="w-full rounded-2xl object-cover max-h-[400px] border border-border"
          />
        </Link>
      </div>

      {/* Actions */}
      <div className="mt-5 flex justify-evenly gap-2 border-t border-border pt-4">
        <button
          onClick={handleLike}
          className="flex grow items-center justify-center gap-2 rounded-xl px-4 py-2.5 transition-colors hover:bg-muted"
        >
          <Heart
            className={cn("size-5 transition-colors", liked ? "fill-red-500 text-red-500" : "text-muted-foreground")}
          />
          <span className={cn("font-medium text-sm max-sm:hidden", liked ? "text-red-500" : "text-muted-foreground")}>
            {liked ? "Liked" : "Like"}
          </span>
        </button>

        <button
          onClick={handleBookmark}
          className="flex grow items-center justify-center gap-2 rounded-xl px-4 py-2.5 transition-colors hover:bg-muted"
        >
          <Bookmark
            className={cn("size-5 transition-colors", bookmarked ? "fill-zinc-900 dark:fill-zinc-100 text-zinc-900 dark:text-zinc-100" : "text-muted-foreground")}
          />
          <span className={cn("font-medium text-sm max-sm:hidden", bookmarked ? "text-zinc-900 dark:text-zinc-100" : "text-muted-foreground")}>
            {bookmarked ? "Saved" : "Save"}
          </span>
        </button>

        <button className="flex grow items-center justify-center gap-2 rounded-xl px-4 py-2.5 transition-colors hover:bg-muted text-muted-foreground">
          <Send className="size-5" />
          <span className="font-medium text-sm max-sm:hidden">
            Share
          </span>
        </button>
      </div>
    </div>
  );
};
