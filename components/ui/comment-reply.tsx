import { cn } from "@/lib/utils";
import { useState, useRef } from "react";
import Icon from "../Icon";
import { ImagePlus, X, Send } from "lucide-react";
import { uploadToImgbb } from "@/services/imgbb";

export interface ReviewComment {
  id: string;
  userName: string;
  userPhoto: string;
  rating: number;
  comment: string;
  createdAt: number;
  images?: string[];
  replies?: any[];
}

export const CommentReply = ({ 
  review, 
  onReply 
}: { 
  review: ReviewComment;
  onReply?: (text: string, image?: string) => void;
}) => {
  const [replyText, setReplyText] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [replyImg, setReplyImg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setIsUploading(true);
    try {
      const url = await uploadToImgbb(e.target.files[0]);
      setReplyImg(url);
    } catch (e) {
      console.error(e);
    }
    setIsUploading(false);
  };

  return (
    <div className="w-full bg-white dark:bg-zinc-900 rounded-[28px] p-6 shadow-sm border border-zinc-200 dark:border-zinc-800 mb-6 flex flex-col gap-6">
      <div className="flex gap-4">
        {/* Profile Picture */}
        <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 bg-zinc-100 flex items-center justify-center border border-zinc-200">
          {review.userPhoto ? (
            <img src={review.userPhoto} alt={review.userName} className="w-full h-full object-cover" />
          ) : (
            <svg fill="none" viewBox="0 0 24 24" height="24" width="24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinejoin="round" fill="#707277" strokeLinecap="round" strokeWidth="2" stroke="#707277" d="M6.57757 15.4816C5.1628 16.324 1.45336 18.0441 3.71266 20.1966C4.81631 21.248 6.04549 22 7.59087 22H16.4091C17.9545 22 19.1837 21.248 20.2873 20.1966C22.5466 18.0441 18.8372 16.324 17.4224 15.4816C14.1048 13.5061 9.89519 13.5061 6.57757 15.4816Z"></path>
              <path strokeWidth="2" fill="#707277" stroke="#707277" d="M16.5 6.5C16.5 8.98528 14.4853 11 12 11C9.51472 11 7.5 8.98528 7.5 6.5C7.5 4.01472 9.51472 2 12 2C14.4853 2 16.5 4.01472 16.5 6.5Z"></path>
            </svg>
          )}
        </div>

        {/* Comment Details */}
        <div className="flex-1">
          <div className="flex flex-col mb-2">
            <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{review.userName}</h4>
            <span className="text-xs text-zinc-400 font-medium">
              {new Date(review.createdAt).toLocaleDateString()}
            </span>
          </div>
          
          <div className="flex space-x-1 mb-3">
            {[...Array(5)].map((_, i) => (
              <svg key={i} className={`w-3 h-3 ${i < review.rating ? "text-yellow-400" : "text-zinc-200 dark:text-zinc-700"}`} fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
              </svg>
            ))}
          </div>
          
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-4">
            {review.comment}
          </p>

          {review.images && review.images.length > 0 && (
             <div className="flex gap-3 mb-4 overflow-x-auto no-scrollbar pb-2">
               {review.images.map((img, idx) => (
                 <div key={idx} className="w-48 h-48 sm:w-56 sm:h-56 rounded-[24px] overflow-hidden shrink-0 border border-zinc-200 dark:border-zinc-800 shadow-sm cursor-zoom-in group hover:opacity-90 transition-opacity">
                    <img src={img} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                 </div>
               ))}
             </div>
          )}

          {review.replies && review.replies.length > 0 && (
            <div className="mt-4 flex flex-col gap-3">
               {review.replies.map((reply: any, idx: number) => (
                  <div key={idx} className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 flex gap-3">
                     <div className="w-8 h-8 rounded-full overflow-hidden bg-zinc-200 dark:bg-zinc-800 shrink-0">
                         {reply.userPhoto ? (
                           <img src={reply.userPhoto} className="w-full h-full object-cover" />
                         ) : (
                           <div className="w-full h-full flex items-center justify-center text-xs font-bold">{reply.userName?.slice(0,1)}</div>
                         )}
                     </div>
                     <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                           <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{reply.userName}</span>
                           <span className="text-[10px] text-zinc-400">{new Date(reply.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">{reply.text}</p>
                        {reply.image && (
                           <div className="mt-3 w-36 h-36 sm:w-48 sm:h-48 rounded-[20px] overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-sm cursor-zoom-in">
                              <img src={reply.image} className="w-full h-full object-cover" />
                           </div>
                        )}
                     </div>
                  </div>
               ))}
            </div>
          )}

          <div className="flex gap-4 items-center mt-4">
             <button 
              className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors flex items-center gap-1.5 active:scale-95"
              onClick={() => setIsReplying(!isReplying)}
            >
              <svg fill="none" viewBox="0 0 24 24" height="16" width="16" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinejoin="round" strokeLinecap="round" strokeWidth="2.5" stroke="currentColor" d="M12.4286 12H13.6667C16.0599 12 18 14.0147 18 16.5C18 18.9853 16.0599 21 13.6667 21H8C6.58579 21 5.87868 21 5.43934 20.5607C5 20.1213 5 19.4142 5 18V12"></path>
              </svg>
              Reply
            </button>
          </div>
        </div>
      </div>

      {isReplying && (
        <div className="w-full bg-zinc-50 dark:bg-zinc-950/50 p-2 rounded-2xl border border-zinc-200 dark:border-zinc-800 animate-in fade-in zoom-in-95 mt-2">
          <div className="flex flex-col gap-2">
            <textarea 
              className="w-full bg-transparent border-none outline-none resize-none min-h-[60px] text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 p-2 font-medium"
              placeholder="Write your reply..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
            />
            
            {replyImg && (
              <div className="relative w-20 h-20 rounded-xl overflow-hidden mb-2 ml-2">
                 <img src={replyImg} className="w-full h-full object-cover" />
                 <button onClick={() => setReplyImg(null)} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5">
                   <X className="w-3 h-3" />
                 </button>
              </div>
            )}

            <div className="flex justify-between items-center px-1">
              <div className="flex items-center gap-2">
                 <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                 <button type="button" onClick={() => fileInputRef.current?.click()} className="text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors p-2">
                   {isUploading ? <div className="w-4 h-4 border-2 border-zinc-400 dark:border-zinc-500 border-t-transparent rounded-full animate-spin" /> : <ImagePlus className="w-5 h-5" />}
                 </button>
              </div>
              <button 
                type="button" 
                className="px-4 py-2 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 font-bold text-xs gap-2"
                disabled={!replyText.trim() && !replyImg}
                onClick={() => {
                  if (onReply) onReply(replyText, replyImg || undefined);
                  setReplyText("");
                  setReplyImg(null);
                  setIsReplying(false);
                }}
              >
                Send <Send className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
