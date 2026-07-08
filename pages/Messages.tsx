import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Video, VideoOff, Paperclip, Send, X, PhoneOff, Mic, MicOff, Volume2, Image as ImageIcon, CheckCheck, Clock, ChevronLeft, User, Search, AlertCircle, MessageSquareShare, Star, Sparkles } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { subscribeToWebPush } from '../lib/push';
import SEO from '../components/SEO';
import { audioHelper } from '../lib/AudioHelper';
import { useNotify } from '../components/Notifications';
import { db, auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, onSnapshot, updateDoc, arrayUnion, collection, addDoc, getDoc, query, where, orderBy, serverTimestamp, getDocs, limit } from 'firebase/firestore';

const CallBubble = ({ msg }: { msg: any }) => {
  const isVideo = msg.text?.toLowerCase().includes('video') || msg.systemType === 'video';
  const timestamp = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  let icon = <Phone className="w-4 h-4 text-emerald-500" />;
  let title = "Voice Call";
  let subtitle = "Call logged";
  let bgClass = "bg-zinc-100 dark:bg-zinc-800 border-zinc-200/50 dark:border-zinc-700/50";

  if (msg.text?.includes('Missed')) {
      icon = <PhoneOff className="w-4 h-4 text-rose-500" />;
      title = "Missed Call";
      bgClass = "bg-rose-50 dark:bg-rose-900/10 border-rose-100 dark:border-rose-900/20";
  } else if (isVideo) {
      icon = <Video className="w-4 h-4 text-blue-500" />;
      title = "Video Call";
  }

  return (
      <div className={`flex items-center gap-3 p-3 rounded-2xl border ${bgClass} w-64 my-1`}>
          <div className="w-10 h-10 rounded-full bg-white dark:bg-zinc-900 flex items-center justify-center shadow-sm shrink-0">
             {icon}
          </div>
          <div className="flex-1 min-w-0">
             <p className="font-semibold text-[13px] text-zinc-900 dark:text-zinc-100">{title}</p>
             <p className="text-[11px] text-zinc-500">{subtitle}</p>
          </div>
          <span className="text-[9px] font-bold text-zinc-400 mt-auto">{timestamp}</span>
      </div>
  );
};

export default function Messages() {
  const [user, setUser] = useState<any>(auth.currentUser);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsub();
  }, []);
  const notify = useNotify();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const chatIdParam = searchParams.get('chatId');

  const [chats, setChats] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<any | null>(null);
  
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Call states
  const [isCalling, setIsCalling] = useState(false);
  const [callType, setCallType] = useState<'audio' | 'video'>('audio');
  const [callDuration, setCallDuration] = useState(0);
  const [callStatus, setCallStatus] = useState<'connecting' | 'ringing' | 'connected'>('connecting');
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);

  // Review states
  const [hasReviewed, setHasReviewed] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    if (!user || !activeChat || !activeChat.otherUser?.id) {
      setHasReviewed(false);
      return;
    }
    
    const checkReview = async () => {
      try {
        const q = query(
          collection(db, "user_reviews"),
          where("reviewerId", "==", user.uid),
          where("revieweeId", "==", activeChat.otherUser.id)
        );
        const snap = await getDocs(q);
        setHasReviewed(!snap.empty);
      } catch (err) {
        console.error("Error checking review:", err);
      }
    };
    
    checkReview();
  }, [activeChat, user]);

  // Effect 1: Listen for user's chats (No orderBy in query to avoid index requirements, sorted in memory)
  useEffect(() => {
    if (!user) return;
    
    const q1 = query(
      collection(db, 'p2p_chats'), 
      where('participants', 'array-contains', user.uid)
    );
    
    const unsub = onSnapshot(q1, async (snapshot) => {
        const chatsList = await Promise.all(snapshot.docs.map(async d => {
            const data = d.data();
            const otherUid = data.participants.find((p: string) => p !== user.uid);
            
            let otherUser = { displayName: 'Unknown', photoURL: '', id: otherUid };
            if (otherUid) {
                if (otherUid === 'system') {
                    otherUser = {
                        id: 'system',
                        displayName: 'Vibe Gadget HQ',
                        photoURL: ''
                    };
                } else {
                    const uDoc = await getDoc(doc(db, 'users', otherUid));
                    if (uDoc.exists()) {
                        otherUser = { ...uDoc.data(), id: uDoc.id } as any;
                    } else {
                        otherUser = {
                            id: otherUid,
                            displayName: 'Verified Seller',
                            photoURL: ''
                        };
                    }
                }
            }
            
            return {
                id: d.id,
                ...data,
                otherUser
            };
        }));

        // Sort in memory by updatedAt descending safely
        chatsList.sort((a, b) => {
          const tA = a.updatedAt?.toMillis ? a.updatedAt.toMillis() : (a.updatedAt || 0);
          const tB = b.updatedAt?.toMillis ? b.updatedAt.toMillis() : (b.updatedAt || 0);
          return tB - tA;
        });
        
        setChats(chatsList);
    });
    
    return () => unsub();
  }, [user]);

  // Effect 2: Synchronize activeChat with chatIdParam and loaded chats
  useEffect(() => {
    if (!user) return;

    const syncActiveChat = async () => {
      if (chatIdParam) {
        const existingChat = chats.find(c => c.otherUser?.id === chatIdParam);
        if (existingChat) {
          if (!activeChat || activeChat.id !== existingChat.id) {
            setActiveChat(existingChat);
          }
        } else {
          if (!activeChat || activeChat.otherUser?.id !== chatIdParam) {
            try {
              if (chatIdParam === "system") {
                setActiveChat({
                  isNew: true,
                  otherUser: {
                    id: "system",
                    displayName: "Vibe Gadget HQ",
                    shopName: "Vibe Gadget HQ",
                    photoURL: ""
                  }
                });
              } else {
                const uDoc = await getDoc(doc(db, 'users', chatIdParam));
                if (uDoc.exists()) {
                  setActiveChat({
                    isNew: true,
                    otherUser: { ...uDoc.data(), id: uDoc.id }
                  });
                } else {
                  setActiveChat({
                    isNew: true,
                    otherUser: {
                      id: chatIdParam,
                      displayName: "Verified Seller",
                      shopName: "Verified Seller",
                      photoURL: ""
                    }
                  });
                }
              }
            } catch (err) {
              console.error("Error fetching user for new chat:", err);
              setActiveChat({
                isNew: true,
                otherUser: {
                  id: chatIdParam,
                  displayName: "Verified Seller",
                  shopName: "Verified Seller",
                  photoURL: ""
                }
              });
            }
          }
        }
      } else {
        if (activeChat) {
          setActiveChat(null);
        }
      }
    };

    syncActiveChat();
  }, [chatIdParam, chats, user, activeChat]);

  // Auto-trigger call if autoCall parameter is present
  useEffect(() => {
    const autoCallParam = searchParams.get('autoCall');
    if (activeChat && autoCallParam === 'true') {
      const params = new URLSearchParams(searchParams);
      params.delete('autoCall');
      setSearchParams(params, { replace: true });
      
      startCall('audio');
    }
  }, [activeChat, searchParams, setSearchParams]);

  useEffect(() => {
    if (!activeChat || activeChat.isNew) {
        setMessages([]);
        return;
    }
    
    const q = query(
      collection(db, 'p2p_chats', activeChat.id, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });

    // Request notification permission to show push notifications for new messages
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => unsub();
  }, [activeChat]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        notify("File must be less than 5MB", "error");
        return;
      }
      setAttachment(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch(`https://api.imgbb.com/1/upload?key=e0b1df667ddc10816a3036a7edb7e289`, {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if (!data.success) throw new Error("Upload failed");
    return data.data.url;
  };

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && !attachment) || !user || !activeChat) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    
    let imageUrl = null;
    if (attachment) {
      try {
        notify("Uploading image...", "info");
        imageUrl = await uploadImage(attachment);
        setAttachment(null);
        setPreviewUrl('');
      } catch (e) {
        notify("Failed to upload image", "error");
        return;
      }
    }
    
    let chatId = activeChat.id;
    
    // If it's a new chat, create it first
    if (activeChat.isNew) {
        const chatRef = await addDoc(collection(db, 'p2p_chats'), {
            participants: [user.uid, activeChat.otherUser.id],
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            lastMessage: messageText || 'Sent an image',
            lastSenderId: user.uid
        });
        chatId = chatRef.id;
        setActiveChat({ ...activeChat, id: chatId, isNew: false });
    } else {
        await updateDoc(doc(db, 'p2p_chats', chatId), {
            updatedAt: serverTimestamp(),
            lastMessage: messageText || 'Sent an image',
            lastSenderId: user.uid
        });
    }

    await addDoc(collection(db, 'p2p_chats', chatId, 'messages'), {
      text: messageText,
      imageUrl,
      senderId: user.uid,
      timestamp: Date.now(),
    });
    
    // Send a real push notification to the recipient!
    const recipientId = activeChat.otherUser?.id || activeChat.otherUser?.uid;
    if (recipientId && recipientId !== "system") {
      fetch("/api/send-push-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: recipientId,
          title: user.displayName || "New Message",
          body: messageText || "Sent an image",
          link: `/messages?chatId=${user.uid}`
        })
      }).catch(err => console.error("Message push notification failed:", err));
    }
    
    // Local push notification simulation for the other user receiving it (this would normally be Cloud Functions)
    if (Notification.permission === 'granted') {
        // Just for demo, we don't send notification to ourselves
    }
  };

  // --- Calling Logic (Real-time P2P) ---
  const [currentCallId, setCurrentCallId] = useState<string | null>(null);

  // Sync with activeCallIdParam (if accepted from incoming call overlay)
  useEffect(() => {
    const activeCallIdParam = searchParams.get('activeCallId');
    const callTypeParam = searchParams.get('callType') as 'audio' | 'video' | null;
    if (activeCallIdParam) {
      setCurrentCallId(activeCallIdParam);
      setIsCalling(true);
      setCallStatus('connected');
      if (callTypeParam) setCallType(callTypeParam);
      
      // Clean query params so we don't trigger it again
      const params = new URLSearchParams(searchParams);
      params.delete('activeCallId');
      params.delete('callType');
      setSearchParams(params, { replace: true });
    }
  }, [searchParams]);

  // Listen to the active call doc
  useEffect(() => {
    if (!currentCallId) return;

    const unsub = onSnapshot(doc(db, 'p2p_calls', currentCallId), (snap) => {
      const data = snap.data();
      if (!data) return;

      if (data.status === 'ringing') {
        setCallStatus('ringing');
      } else if (data.status === 'connected') {
        if (callStatus !== 'connected') {
          setCallStatus('connected');
          if (audioHelper && typeof audioHelper.stop === 'function') {
            audioHelper.stop();
          }
          setCallDuration(0);
          
          // Log start of call in chat if we are the caller
          if (data.callerId === user?.uid && activeChat && !activeChat.isNew) {
            addDoc(collection(db, 'p2p_chats', activeChat.id, 'messages'), {
              text: `Started ${data.type} call`,
              senderId: user?.uid,
              systemType: data.type,
              timestamp: Date.now()
            }).catch(console.error);
          }
        }
      } else if (data.status === 'ended') {
        setIsCalling(false);
        if (audioHelper && typeof audioHelper.stop === 'function') {
          audioHelper.stop();
        }
        if (audioHelper && typeof audioHelper.playEndBip === 'function') {
          audioHelper.playEndBip();
        }
        
        // Log end of call in chat if we are the caller and we were connected
        if (data.callerId === user?.uid && activeChat && !activeChat.isNew && callStatus === 'connected') {
          addDoc(collection(db, 'p2p_chats', activeChat.id, 'messages'), {
            text: `${callType} call ended (${Math.floor(callDuration / 60)}m ${callDuration % 60}s)`,
            senderId: user?.uid,
            systemType: callType,
            timestamp: Date.now()
          }).catch(console.error);
        }
        
        setCurrentCallId(null);
      }
    });

    return () => unsub();
  }, [currentCallId, callStatus, activeChat, user, callType, callDuration]);

  const startCall = async (type: 'audio' | 'video') => {
    if (!user || !activeChat || activeChat.isNew) {
      notify("Please open an active chat to make a call.", "error");
      return;
    }

    setCallType(type);
    setIsCalling(true);
    setCallStatus('connecting');

    if (audioHelper && typeof audioHelper.play === 'function') {
      audioHelper.play('calling');
    } else if (audioHelper && typeof audioHelper.playCalling === 'function') {
      audioHelper.playCalling();
    }

    try {
      const callRef = await addDoc(collection(db, 'p2p_calls'), {
        callerId: user.uid,
        callerName: user.displayName || 'Vibe Gadget Customer',
        callerAvatar: user.photoURL || '',
        receiverId: activeChat.otherUser.id,
        status: 'calling',
        type,
        timestamp: Date.now()
      });
      setCurrentCallId(callRef.id);

      // Send push notification to receiver!
      fetch("/api/send-push-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: activeChat.otherUser?.id || activeChat.otherUser?.uid,
          title: `Incoming ${type === 'audio' ? 'Voice' : 'Video'} Call...`,
          body: `${user.displayName || 'Someone'} is calling you on Vibe Gadget.`,
          link: `/messages?chatId=${user.uid}&autoCall=true`
        })
      }).catch(err => console.error("Call push notification failed:", err));
    } catch (e) {
      console.error("Failed to start call:", e);
      setIsCalling(false);
      if (audioHelper && typeof audioHelper.stop === 'function') {
        audioHelper.stop();
      }
    }
  };

  useEffect(() => {
    let interval: any;
    if (callStatus === 'connected') {
        interval = setInterval(() => setCallDuration(p => p + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [callStatus]);

  const endCall = async () => {
    setIsCalling(false);
    if (audioHelper && typeof audioHelper.stop === 'function') {
      audioHelper.stop();
    }
    if (audioHelper && typeof audioHelper.playEndBip === 'function') {
      audioHelper.playEndBip();
    }

    if (currentCallId) {
      await updateDoc(doc(db, 'p2p_calls', currentCallId), {
        status: 'ended'
      }).catch(console.error);
      setCurrentCallId(null);
    }
  };
  
  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleSubmitReview = async () => {
    if (!user || !activeChat || !activeChat.otherUser?.id) return;
    setIsSubmittingReview(true);
    try {
      await addDoc(collection(db, "user_reviews"), {
        reviewerId: user.uid,
        reviewerName: user.displayName || user.email?.split("@")[0] || "Someone",
        reviewerPhoto: user.photoURL || "",
        revieweeId: activeChat.otherUser.id,
        rating: reviewRating,
        comment: reviewText.trim(),
        createdAt: Date.now(),
        chatId: activeChat.id || "p2p"
      });

      const reviewerName = user.displayName || "Someone";
      const revieweeName = activeChat.otherUser.displayName || activeChat.otherUser.shopName || "User";

      fetch("/api/send-push-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: activeChat.otherUser.id,
          title: "New Review Received! ⭐",
          body: `${reviewerName} gave you a ${reviewRating}-star rating: "${reviewText.trim() || 'Excellent!'}"`,
          link: `/store/${activeChat.otherUser.id}`
        })
      }).catch(err => console.error("Push to reviewee failed:", err));

      fetch("/api/send-push-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.uid,
          title: "Review Submitted! 🎉",
          body: `You successfully rated ${revieweeName} ${reviewRating} Stars!`,
          link: "/messages"
        })
      }).catch(err => console.error("Push to reviewer failed:", err));

      setHasReviewed(true);
      setShowReviewModal(false);
      setReviewText("");
      notify("Review submitted successfully!", "success");
    } catch (err) {
      console.error("Error submitting review:", err);
      notify("Failed to submit review", "error");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (!user) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] bg-zinc-50 dark:bg-zinc-950 font-inter">
            <AlertCircle className="w-12 h-12 text-zinc-400 mb-4" />
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Please Sign In</h2>
            <p className="text-sm text-zinc-500 mt-2">You need to log in to access messages.</p>
            <button onClick={() => navigate('/auth-selector')} className="mt-6 px-6 py-3 bg-zinc-900 text-white rounded-xl font-bold text-sm">
                Sign In
            </button>
        </div>
    );
  }

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950 font-inter overflow-hidden">
      <SEO title="Messages" description="Chat with sellers and support" noindex />
      
      {/* Sidebar: Chat List */}
      <div className={`w-full md:w-[350px] bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col ${activeChat ? 'hidden md:flex' : 'flex'}`}>
         <div className="p-4 pb-2 flex items-center gap-2">
             <button onClick={() => navigate('/')} className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition" title="Go Back">
                 <ChevronLeft className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
             </button>
             <div className="relative flex-1">
                 <input type="text" placeholder="Search chats..." className="w-full bg-zinc-100 dark:bg-zinc-800/50 rounded-xl py-3 pl-10 pr-4 text-sm font-medium outline-none focus:ring-2 ring-emerald-500/50" />
                 <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-zinc-400" />
             </div>
         </div>

         <div className="flex-1 overflow-y-auto">
             {chats.length === 0 && !chatIdParam ? (
                 <div className="flex flex-col items-center justify-center h-full text-zinc-400 p-6 text-center">
                     <MessageSquareShare className="w-12 h-12 mb-3 text-zinc-300 dark:text-zinc-700" />
                     <p className="font-medium text-sm">No messages yet</p>
                     <p className="text-xs mt-1">Start a conversation with a seller to see it here.</p>
                 </div>
             ) : (
                 chats.map(chat => (
                     <div 
                        key={chat.id} 
                        onClick={() => setSearchParams({ chatId: chat.otherUser?.id || "" })}
                        className={`flex items-center gap-3 p-4 cursor-pointer transition-colors border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 ${activeChat?.id === chat.id ? 'bg-zinc-50 dark:bg-zinc-800' : ''}`}
                     >
                         <div className="w-12 h-12 rounded-full overflow-hidden bg-zinc-200 dark:bg-zinc-800 shrink-0 border border-zinc-200 dark:border-zinc-700">
                             {chat.otherUser?.photoURL ? (
                                 <img src={chat.otherUser.photoURL} alt={chat.otherUser.displayName} className="w-full h-full object-cover" />
                             ) : (
                                 <div className="w-full h-full flex items-center justify-center bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-bold text-lg">
                                     {(chat.otherUser?.displayName || chat.otherUser?.shopName || 'U')[0].toUpperCase()}
                                 </div>
                             )}
                         </div>
                         <div className="flex-1 min-w-0">
                             <div className="flex justify-between items-center mb-0.5">
                                 <h4 className="font-bold text-[15px] text-zinc-900 dark:text-zinc-100 truncate">
                                     {chat.otherUser?.shopName || chat.otherUser?.displayName || 'Unknown User'}
                                 </h4>
                                 {chat.updatedAt && (
                                     <span className="text-[10px] font-bold text-zinc-400">
                                         {new Date(chat.updatedAt?.toMillis ? chat.updatedAt.toMillis() : Date.now()).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                     </span>
                                 )}
                             </div>
                             <p className="text-[13px] text-zinc-500 truncate">{chat.lastMessage}</p>
                         </div>
                     </div>
                 ))
             )}
         </div>
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 bg-[#F0F2F5] dark:bg-[#0a0a0a] flex-col ${!activeChat ? 'hidden md:flex' : 'flex'}`}>
         {!activeChat ? (
             <div className="flex-1 flex flex-col items-center justify-center text-zinc-400">
                 <div className="w-20 h-20 rounded-full bg-white dark:bg-zinc-900 shadow-sm flex items-center justify-center mb-4">
                     <svg className="w-8 h-8 text-zinc-300 dark:text-zinc-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                     </svg>
                 </div>
                 <p className="font-bold text-lg text-zinc-600 dark:text-zinc-300">Your Messages</p>
                 <p className="text-sm mt-1">Select a chat to start messaging</p>
             </div>
         ) : (
             <>
                 {/* Active Chat Header */}
                 <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-4 sm:px-6 py-3 flex items-center justify-between shrink-0 z-10 shadow-sm">
                     <div className="flex items-center gap-3 min-w-0">
                         <button 
                           type="button"
                           onClick={() => setSearchParams({})} 
                           className="md:hidden p-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition shrink-0"
                           title="Back to Chats"
                         >
                             <ChevronLeft className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                         </button>
                         
                         <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-200 dark:bg-zinc-800 shrink-0 border border-zinc-200 dark:border-zinc-700">
                             {activeChat.otherUser?.photoURL ? (
                                 <img src={activeChat.otherUser.photoURL} alt={activeChat.otherUser.displayName} className="w-full h-full object-cover" />
                             ) : (
                                 <div className="w-full h-full flex items-center justify-center bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-bold text-sm">
                                     {(activeChat.otherUser?.displayName || activeChat.otherUser?.shopName || 'U')[0].toUpperCase()}
                                 </div>
                             )}
                         </div>
                         
                         <div className="min-w-0">
                             <h3 className="font-bold text-[15px] text-zinc-900 dark:text-zinc-100 truncate">
                                 {activeChat.otherUser?.shopName || activeChat.otherUser?.displayName || 'Unknown User'}
                             </h3>
                             <p className="text-[10px] text-emerald-500 font-bold flex items-center gap-1">
                                 <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                 Active Now
                             </p>
                         </div>
                     </div>

                     <div className="flex items-center gap-1.5 shrink-0">
                         <button 
                           type="button"
                           onClick={() => startCall('audio')} 
                           className="p-2.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-xl transition" 
                           title="Voice Call"
                         >
                             <Phone className="w-4.5 h-4.5" />
                         </button>
                     </div>
                 </div>

                 {/* Messages Area */}
                 <div className="flex-1 overflow-y-auto p-4 space-y-4 relative">
                     <div className="flex justify-center my-6">
                         <span className="text-[10px] font-bold text-zinc-400 bg-black/5 dark:bg-white/5 px-3 py-1 rounded-full uppercase tracking-wider">
                             End-to-End Encrypted
                         </span>
                     </div>
                     
                     {messages.map((msg, idx) => {
                         const isMe = msg.senderId === user.uid;
                         const showAvatar = !isMe && (idx === 0 || messages[idx-1]?.senderId !== msg.senderId);
                         const isSystem = !!msg.systemType;

                         if (isSystem) {
                             return (
                                 <div key={msg.id} className="flex justify-center my-4">
                                     <CallBubble msg={msg} />
                                 </div>
                             );
                         }

                         return (
                             <div key={msg.id} className={`flex gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                                 {!isMe && (
                                     <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 shrink-0 self-end overflow-hidden mb-1">
                                         {showAvatar && (
                                             activeChat.otherUser?.photoURL ? 
                                                 <img src={activeChat.otherUser.photoURL} alt="Avatar" className="w-full h-full object-cover" /> :
                                                 <div className="w-full h-full flex items-center justify-center bg-emerald-100 text-emerald-700 font-bold text-xs">
                                                     {(activeChat.otherUser?.displayName || 'U')[0].toUpperCase()}
                                                 </div>
                                         )}
                                     </div>
                                 )}
                                 
                                 <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                                     {msg.imageUrl && (
                                         <div className="mb-1 rounded-2xl overflow-hidden border border-black/5 dark:border-white/5 shadow-sm max-w-[240px]">
                                             <img src={msg.imageUrl} alt="Attachment" className="w-full object-cover" />
                                         </div>
                                     )}
                                     
                                     {msg.text && (
                                         <div className={`px-4 py-2.5 rounded-2xl shadow-sm ${isMe ? 'bg-emerald-600 text-white rounded-br-sm' : 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 rounded-bl-sm border border-zinc-200 dark:border-zinc-800'}`}>
                                             <p className="text-[14px] leading-relaxed whitespace-pre-wrap break-words">{msg.text}</p>
                                         </div>
                                     )}
                                     <span className="text-[9px] font-semibold text-zinc-400 mt-1 mx-1">
                                         {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                     </span>
                                 </div>
                             </div>
                         );
                     })}
                     {!hasReviewed && activeChat.otherUser?.id !== "system" && (messages.length >= 4 || (messages.length > 0 && (Date.now() - messages[messages.length - 1].timestamp) > 3600000)) && (
                       <div className="flex justify-center my-6">
                         <div 
                           className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-zinc-900/90 dark:to-zinc-950/90 border border-amber-200 dark:border-zinc-800 rounded-2xl p-4 max-w-sm w-full text-center shadow-md hover:shadow-lg transition cursor-pointer border-dashed" 
                           onClick={() => { setShowReviewModal(true); }}
                         >
                           <div className="flex items-center justify-center gap-1.5 mb-2 text-amber-500">
                             <Star className="w-5 h-5 fill-amber-500 animate-bounce" />
                             <Star className="w-5 h-5 fill-amber-500 animate-bounce" />
                             <Star className="w-5 h-5 fill-amber-500 animate-bounce" />
                             <Star className="w-5 h-5 fill-amber-500 animate-bounce" />
                             <Star className="w-5 h-5 fill-amber-500 animate-bounce" />
                           </div>
                           <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center justify-center gap-1">
                             <Sparkles className="w-4 h-4 text-amber-500" />
                             <span>Give a Review</span>
                           </h4>
                           <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                             Rate your experience with <strong className="text-[#EF8020]">{activeChat.otherUser?.shopName || activeChat.otherUser?.displayName || "Verified Seller"}</strong>. It will be styled beautifully on their profile page!
                           </p>
                         </div>
                       </div>
                     )}
                     <div ref={messagesEndRef} />
                 </div>

                 {/* Input Area */}
                 <div className="bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 p-3 sm:p-4 shrink-0 z-10">
                     <AnimatePresence>
                         {previewUrl && (
                             <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} className="mb-3 relative inline-block">
                                 <div className="w-24 h-24 rounded-xl overflow-hidden border-2 border-emerald-500 shadow-md">
                                     <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                 </div>
                                 <button onClick={() => { setAttachment(null); setPreviewUrl(''); }} className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-sm">
                                     <X className="w-3.5 h-3.5" />
                                 </button>
                             </motion.div>
                         )}
                     </AnimatePresence>
                     
                     <div className="flex items-end gap-2 bg-zinc-100 dark:bg-zinc-800/50 p-1.5 sm:p-2 rounded-[24px] border border-zinc-200 dark:border-zinc-700 focus-within:border-emerald-500/50 focus-within:ring-2 ring-emerald-500/20 transition-all">
                         <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" accept="image/*" />
                         
                         <button onClick={() => fileInputRef.current?.click()} className="p-3 text-zinc-400 hover:text-emerald-500 hover:bg-white dark:hover:bg-zinc-800 rounded-full transition-colors shrink-0" title="Attach Image">
                             <Paperclip className="w-5 h-5" />
                         </button>
                         
                         
                         
                         <textarea
                             value={newMessage}
                             onChange={(e) => setNewMessage(e.target.value)}
                             onKeyDown={(e) => {
                                 if (e.key === 'Enter' && !e.shiftKey) {
                                     e.preventDefault();
                                     handleSendMessage();
                                 }
                             }}
                             placeholder={`Message ${activeChat?.otherUser?.shopName || activeChat?.otherUser?.displayName || 'Seller'}...`}
                             className="flex-1 max-h-32 min-h-[44px] bg-transparent border-none focus:ring-0 resize-none py-3 px-2 text-[15px] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 placeholder:font-medium leading-tight"
                             rows={1}
                         />
                         
                         <button 
                             onClick={handleSendMessage}
                             disabled={!newMessage.trim() && !attachment}
                             className={`p-3 rounded-full shrink-0 transition-all ${(newMessage.trim() || attachment) ? 'bg-emerald-600 text-white shadow-md hover:bg-emerald-500 active:scale-95' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400'}`}
                         >
                             <Send className="w-5 h-5 ml-0.5" />
                         </button>
                     </div>
                 </div>
             </>
         )}
      </div>

      {/* Full Screen Call UI Overlay */}
      <AnimatePresence>
        {isCalling && (
          <motion.div 
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[9999] bg-zinc-900 flex flex-col font-inter"
          >
            {/* Background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
               <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vw] h-[120vw] bg-emerald-500/10 rounded-full blur-3xl" />
               <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-gradient-to-t from-black/80 to-transparent" />
            </div>
            
            <div className="relative z-10 flex flex-col h-full pt-16 pb-12 px-6">
                <div className="flex justify-between items-center mb-8">
                    <button onClick={endCall} className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white backdrop-blur-md">
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <span className="text-white/60 text-[11px] font-bold uppercase tracking-[0.2em] px-3 py-1.5 rounded-full bg-white/5 backdrop-blur-md">
                        End-to-End Encrypted
                    </span>
                    <div className="w-10 h-10"></div>
                </div>

                <div className="flex flex-col items-center flex-1 justify-center -mt-16">
                    <div className="relative mb-8">
                        {callStatus === 'ringing' && (
                            <>
                                <div className="absolute inset-0 rounded-full border-2 border-emerald-500/50 animate-ping" style={{ animationDuration: '2s' }} />
                                <div className="absolute inset-[-20px] rounded-full border border-emerald-500/20 animate-ping" style={{ animationDuration: '2.5s', animationDelay: '0.2s' }} />
                            </>
                        )}
                        <div className="w-32 h-32 rounded-full overflow-hidden border-[4px] border-emerald-500 shadow-2xl relative z-10 bg-zinc-800">
                             {activeChat?.otherUser?.photoURL ? (
                                 <img src={activeChat.otherUser.photoURL} alt="User" className="w-full h-full object-cover" />
                             ) : (
                                 <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-white font-bold text-4xl">
                                     {(activeChat?.otherUser?.displayName || 'U')[0].toUpperCase()}
                                 </div>
                             )}
                        </div>
                    </div>
                    
                    <h2 className="text-3xl font-black text-white mb-2 tracking-tight">
                        {activeChat?.otherUser?.shopName || activeChat?.otherUser?.displayName || 'User'}
                    </h2>
                    
                    <p className="text-emerald-400 font-bold tracking-wide">
                        {callStatus === 'connecting' && "Connecting..."}
                        {callStatus === 'ringing' && "Ringing..."}
                        {callStatus === 'connected' && formatDuration(callDuration)}
                    </p>
                </div>
                
                <div className="flex items-center justify-center gap-6 mt-auto">
                    <button onClick={() => setIsMuted(!isMuted)} className={`w-[68px] h-[68px] rounded-full flex items-center justify-center transition-all backdrop-blur-md ${isMuted ? 'bg-white text-black' : 'bg-white/15 text-white hover:bg-white/25'}`}>
                        {isMuted ? <MicOff className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
                    </button>
                    
                    <button onClick={endCall} className="w-[84px] h-[84px] rounded-full bg-rose-600 hover:bg-rose-500 flex items-center justify-center text-white shadow-xl shadow-rose-600/30 transition-transform active:scale-95">
                        <PhoneOff className="w-8 h-8" />
                    </button>
                    
                    <button onClick={() => setIsSpeaker(!isSpeaker)} className={`w-[68px] h-[68px] rounded-full flex items-center justify-center transition-all backdrop-blur-md ${isSpeaker ? 'bg-white text-black' : 'bg-white/15 text-white hover:bg-white/25'}`}>
                        <Volume2 className="w-7 h-7" />
                    </button>
                </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Review Dialog Modal */}
      <AnimatePresence>
        {showReviewModal && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 w-full max-w-md shadow-2xl relative overflow-hidden font-inter"
            >
              <button 
                type="button"
                onClick={() => setShowReviewModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 transition"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center mb-6">
                <div className="inline-flex p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/20 text-amber-500 mb-3 animate-pulse">
                  <Star className="w-8 h-8 fill-amber-500" />
                </div>
                <h3 className="text-lg font-black text-zinc-900 dark:text-white uppercase tracking-tight">
                  Leave a Review
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  How was your experience trading or chatting with {activeChat?.otherUser?.shopName || activeChat?.otherUser?.displayName || "Verified Seller"}?
                </p>
              </div>

              {/* Star Selection */}
              <div className="flex items-center justify-center gap-2 mb-6">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    className="p-1 hover:scale-110 active:scale-95 transition"
                  >
                    <Star 
                      className={`w-10 h-10 ${
                        star <= reviewRating ? "text-amber-500 fill-amber-500" : "text-zinc-300 dark:text-zinc-700"
                      }`}
                    />
                  </button>
                ))}
              </div>

              {/* Comment Text */}
              <div className="mb-6">
                <label className="block text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                  Review Text (Optional)
                </label>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Tell us more about the trade, behavior, response time..."
                  rows={4}
                  className="w-full text-sm bg-zinc-50 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 outline-none focus:ring-2 ring-emerald-500/50 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 resize-none"
                />
              </div>

              {/* Submit / Cancel Buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="flex-1 py-3 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white rounded-2xl font-bold text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSubmittingReview}
                  onClick={handleSubmitReview}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold text-sm transition-all shadow-md shadow-emerald-600/10 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-55"
                >
                  {isSubmittingReview ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <span>Submit Review</span>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
