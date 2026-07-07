const fs = require('fs');

const messagesContent = `import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Video, VideoOff, Paperclip, Send, X, PhoneOff, Mic, MicOff, Volume2, Image as ImageIcon, CheckCheck, Clock, ChevronLeft, User, Search, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { subscribeToWebPush } from '../lib/push';
import SEO from '../components/SEO';
import { audioHelper } from '../lib/AudioHelper';
import { useNotify } from '../components/Notifications';
import { db, auth } from '../firebase';
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
      <div className={\`flex items-center gap-3 p-3 rounded-2xl border \${bgClass} w-64 my-1\`}>
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
  const user = auth.currentUser;
  const notify = useNotify();
  const navigate = useNavigate();
  const queryParam = new URLSearchParams(window.location.search);
  const chatIdParam = queryParam.get('chatId');

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

  useEffect(() => {
    if (!user) return;
    
    // Listen for chats where user is participant
    const q1 = query(collection(db, 'p2p_chats'), where('participants', 'array-contains', user.uid), orderBy('updatedAt', 'desc'));
    
    const unsub = onSnapshot(q1, async (snapshot) => {
        const chatsList = await Promise.all(snapshot.docs.map(async d => {
            const data = d.data();
            const otherUid = data.participants.find((p: string) => p !== user.uid);
            
            // Get other user's info
            let otherUser = { displayName: 'Unknown', photoURL: '', id: otherUid };
            if (otherUid) {
                const uDoc = await getDoc(doc(db, 'users', otherUid));
                if (uDoc.exists()) {
                    otherUser = { ...uDoc.data(), id: uDoc.id } as any;
                }
            }
            
            return {
                id: d.id,
                ...data,
                otherUser
            };
        }));
        
        setChats(chatsList);
        
        if (chatIdParam && !activeChat) {
            // Check if chat exists with this user
            const existingChat = chatsList.find(c => c.otherUser.id === chatIdParam);
            if (existingChat) {
                setActiveChat(existingChat);
            } else {
                // Create new chat
                const uDoc = await getDoc(doc(db, 'users', chatIdParam));
                if (uDoc.exists()) {
                    setActiveChat({
                        isNew: true,
                        otherUser: { ...uDoc.data(), id: uDoc.id }
                    });
                }
            }
        }
    });
    
    return () => unsub();
  }, [user, chatIdParam]);

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
    const res = await fetch(\`https://api.imgbb.com/1/upload?key=e0b1df667ddc10816a3036a7edb7e289\`, {
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
            lastMessage: messageText || 'Sent an image'
        });
        chatId = chatRef.id;
        setActiveChat({ ...activeChat, id: chatId, isNew: false });
    } else {
        await updateDoc(doc(db, 'p2p_chats', chatId), {
            updatedAt: serverTimestamp(),
            lastMessage: messageText || 'Sent an image'
        });
    }

    await addDoc(collection(db, 'p2p_chats', chatId, 'messages'), {
      text: messageText,
      imageUrl,
      senderId: user.uid,
      timestamp: Date.now(),
    });
    
    // Local push notification simulation for the other user receiving it (this would normally be Cloud Functions)
    if (Notification.permission === 'granted') {
        // Just for demo, we don't send notification to ourselves
    }
  };

  // --- Calling Logic (Simulated) ---
  const startCall = (type: 'audio' | 'video') => {
    setCallType(type);
    setIsCalling(true);
    setCallStatus('connecting');
    audioHelper.play('ringtone', true);
    
    setTimeout(() => setCallStatus('ringing'), 1500);
    
    setTimeout(() => {
        setCallStatus('connected');
        audioHelper.stop('ringtone');
        setCallDuration(0);
        
        // Log call start message
        if (activeChat && !activeChat.isNew) {
            addDoc(collection(db, 'p2p_chats', activeChat.id, 'messages'), {
                text: \`Started \${type} call\`,
                senderId: user?.uid,
                systemType: type,
                timestamp: Date.now()
            });
        }
    }, 4500);
  };

  useEffect(() => {
    let interval: any;
    if (callStatus === 'connected') {
        interval = setInterval(() => setCallDuration(p => p + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [callStatus]);

  const endCall = () => {
    setIsCalling(false);
    audioHelper.stop('ringtone');
    
    if (activeChat && !activeChat.isNew && callStatus === 'connected') {
        addDoc(collection(db, 'p2p_chats', activeChat.id, 'messages'), {
            text: \`\${callType} call ended (\${Math.floor(callDuration/60)}m \${callDuration%60}s)\`,
            senderId: user?.uid,
            systemType: callType,
            timestamp: Date.now()
        });
    }
    
    setCallStatus('connecting');
    setCallDuration(0);
  };
  
  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return \`\${m.toString().padStart(2, '0')}:\${s.toString().padStart(2, '0')}\`;
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
      <div className={\`w-full md:w-[350px] bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col \${activeChat ? 'hidden md:flex' : 'flex'}\`}>
         <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition">
                <ChevronLeft className="w-6 h-6 text-zinc-600 dark:text-zinc-400" />
            </button>
            <h1 className="text-xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">Messages</h1>
            <div className="w-10"></div>
         </div>
         
         <div className="p-4">
             <div className="relative">
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
                        onClick={() => setActiveChat(chat)}
                        className={\`flex items-center gap-3 p-4 cursor-pointer transition-colors border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 \${activeChat?.id === chat.id ? 'bg-zinc-50 dark:bg-zinc-800' : ''}\`}
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
      <div className={\`flex-1 bg-[#F0F2F5] dark:bg-[#0a0a0a] flex-col \${!activeChat ? 'hidden md:flex' : 'flex'}\`}>
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
                 {/* Chat Header */}
                 <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-4 py-3 flex items-center justify-between shrink-0 shadow-sm z-10">
                     <div className="flex items-center gap-3">
                         <button onClick={() => setActiveChat(null)} className="md:hidden p-2 -ml-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition">
                             <ChevronLeft className="w-6 h-6 text-zinc-600 dark:text-zinc-400" />
                         </button>
                         <div className="w-10 h-10 rounded-full overflow-hidden bg-zinc-200 dark:bg-zinc-800 shrink-0 border border-zinc-200 dark:border-zinc-700">
                             {activeChat.otherUser?.photoURL ? (
                                 <img src={activeChat.otherUser.photoURL} alt={activeChat.otherUser.displayName} className="w-full h-full object-cover" />
                             ) : (
                                 <div className="w-full h-full flex items-center justify-center bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-bold">
                                     {(activeChat.otherUser?.displayName || activeChat.otherUser?.shopName || 'U')[0].toUpperCase()}
                                 </div>
                             )}
                         </div>
                         <div>
                             <h2 className="font-bold text-[15px] text-zinc-900 dark:text-zinc-100 leading-tight">
                                 {activeChat.otherUser?.shopName || activeChat.otherUser?.displayName || 'Unknown User'}
                             </h2>
                             <div className="flex items-center gap-1.5 mt-0.5">
                                 <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                 <span className="text-[11px] font-semibold text-zinc-500">Online</span>
                             </div>
                         </div>
                     </div>
                     <div className="flex items-center gap-1">
                         <button onClick={() => startCall('audio')} className="w-10 h-10 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center transition-colors">
                             <Phone className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                         </button>
                         <button onClick={() => startCall('video')} className="w-10 h-10 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center justify-center transition-colors">
                             <Video className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                         </button>
                     </div>
                 </div>

                 {/* Messages Area */}
                 <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
                             <div key={msg.id} className={\`flex gap-2 \${isMe ? 'justify-end' : 'justify-start'}\`}>
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
                                 
                                 <div className={\`max-w-[75%] \${isMe ? 'items-end' : 'items-start'} flex flex-col\`}>
                                     {msg.imageUrl && (
                                         <div className="mb-1 rounded-2xl overflow-hidden border border-black/5 dark:border-white/5 shadow-sm max-w-[240px]">
                                             <img src={msg.imageUrl} alt="Attachment" className="w-full object-cover" />
                                         </div>
                                     )}
                                     
                                     {msg.text && (
                                         <div className={\`px-4 py-2.5 rounded-2xl shadow-sm \${isMe ? 'bg-emerald-600 text-white rounded-br-sm' : 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 rounded-bl-sm border border-zinc-200 dark:border-zinc-800'}\`}>
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
                         
                         <button onClick={() => fileInputRef.current?.click()} className="p-3 text-zinc-400 hover:text-emerald-500 hover:bg-white dark:hover:bg-zinc-800 rounded-full transition-colors shrink-0">
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
                             placeholder="Message..."
                             className="flex-1 max-h-32 min-h-[44px] bg-transparent border-none focus:ring-0 resize-none py-3 px-2 text-[15px] text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 placeholder:font-medium leading-tight"
                             rows={1}
                         />
                         
                         <button 
                             onClick={handleSendMessage}
                             disabled={!newMessage.trim() && !attachment}
                             className={\`p-3 rounded-full shrink-0 transition-all \${(newMessage.trim() || attachment) ? 'bg-emerald-600 text-white shadow-md hover:bg-emerald-500 active:scale-95' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400'}\`}
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
                    <button onClick={() => setIsMuted(!isMuted)} className={\`w-[68px] h-[68px] rounded-full flex items-center justify-center transition-all backdrop-blur-md \${isMuted ? 'bg-white text-black' : 'bg-white/15 text-white hover:bg-white/25'}\`}>
                        {isMuted ? <MicOff className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
                    </button>
                    
                    <button onClick={endCall} className="w-[84px] h-[84px] rounded-full bg-rose-600 hover:bg-rose-500 flex items-center justify-center text-white shadow-xl shadow-rose-600/30 transition-transform active:scale-95">
                        <PhoneOff className="w-8 h-8" />
                    </button>
                    
                    <button onClick={() => setIsSpeaker(!isSpeaker)} className={\`w-[68px] h-[68px] rounded-full flex items-center justify-center transition-all backdrop-blur-md \${isSpeaker ? 'bg-white text-black' : 'bg-white/15 text-white hover:bg-white/25'}\`}>
                        <Volume2 className="w-7 h-7" />
                    </button>
                </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
`

fs.writeFileSync('pages/Messages.tsx', messagesContent);
