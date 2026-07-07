import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, User, Bot, Send, Headphones } from 'lucide-react';
import VoiceMessageBubble from './ui/voice-message-bubble';
import { db, auth } from '../firebase';
import { collection, query, orderBy, onSnapshot, doc, setDoc, getDoc, addDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { VoiceChat } from './ui/audio-chat';
import { useLocation } from 'react-router-dom';
import { useAlert } from './Notifications';

interface ChatMessage {
  id: string;
  type: 'text' | 'voice' | 'audio-room';
  text: string;
  audioSrc?: string;
  duration?: number;
  sender: 'admin' | 'user';
  createdAt: any;
}

interface PreWrittenOption {
  id: string;
  text: string;
  responseAudioSrc: string;
  responseDuration: number;
}

export function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [chatStatus, setChatStatus] = useState<'idle' | 'chatting' | 'busy'>('idle');
  const [options, setOptions] = useState<PreWrittenOption[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const alert = useAlert();

  useEffect(() => {
    async function fetchBotOptions() {
      try {
        const docRef = doc(db, 'settings', 'voiceBot');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
           const data = docSnap.data();
           if (data.options && Array.isArray(data.options)) {
              setOptions(data.options);
           }
        }
      } catch (err) {}
    }
    fetchBotOptions();
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    // Load active status
    const statusUnsub = onSnapshot(doc(db, 'settings', 'adminChatStatus'), (docSnap) => {
      if (docSnap.exists()) {
        const activeUserId = docSnap.data().activeUserId;
        const currentUser = auth.currentUser;
        if (!activeUserId) {
          setChatStatus('idle'); // Admin available
        } else if (currentUser && activeUserId === currentUser.uid) {
          setChatStatus('chatting'); // Admin is talking to you
        } else {
          setChatStatus('busy'); // Admin talking to someone else
        }
      } else {
         // Create if not exists
         setDoc(doc(db, 'settings', 'adminChatStatus'), { activeUserId: null });
      }
    });

    const currentUser = auth.currentUser;
    if (!currentUser) return; // Prompt to login or rely on anonymous (skipping anonymous for now)

    const chatRef = doc(db, 'userChats', currentUser.uid);
    // Ensure chat doc exists
    setDoc(chatRef, {
      userName: currentUser.displayName || 'Website User',
      userAvatar: currentUser.photoURL || '',
      updatedAt: serverTimestamp()
    }, { merge: true });

    const messagesQuery = query(collection(db, `userChats/${currentUser.uid}/messages`), orderBy('createdAt', 'asc'));
    const messagesUnsub = onSnapshot(messagesQuery, (snap) => {
      const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() } as ChatMessage));
      setMessages(msgs);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });

    return () => {
      statusUnsub();
      messagesUnsub();
    };
  }, [isOpen]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim()) return;
    
    const currentUser = auth.currentUser;
    if (!currentUser) {
       alert({ title: "Login Required", message: "Please login to chat." });
       return;
    }

    const newMsg = {
      type: 'text',
      text: inputText.trim(),
      sender: 'user',
      createdAt: serverTimestamp(),
    };

    setInputText('');

    await addDoc(collection(db, `userChats/${currentUser.uid}/messages`), newMsg);
    await updateDoc(doc(db, 'userChats', currentUser.uid), {
       lastMessage: newMsg.text,
       lastMessageTime: serverTimestamp(),
       updatedAt: serverTimestamp()
    });

    try {
      await fetch('/api/notify-telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName: currentUser.displayName || 'Website User',
          message: newMsg.text
        })
      });
    } catch (e) {
      console.error("Failed to notify TG", e);
    }

    // Auto replies if admin is busy or idle
    if (chatStatus === 'busy') {
      setTimeout(async () => {
        await addDoc(collection(db, `userChats/${currentUser.uid}/messages`), {
          type: 'text',
          text: 'The admin is currently speaking with another user. Please wait a moment.',
          sender: 'admin',
          createdAt: serverTimestamp()
        });
      }, 1500);
    }
  };

  const handleOptionClick = async (opt: PreWrittenOption) => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
       alert({ title: "Login Required", message: "Please login to interact." });
       return;
    }

    const newMsg = {
      type: 'text',
      text: opt.text,
      sender: 'user',
      createdAt: serverTimestamp(),
    };

    await addDoc(collection(db, `userChats/${currentUser.uid}/messages`), newMsg);
    await updateDoc(doc(db, 'userChats', currentUser.uid), {
       lastMessage: newMsg.text,
       lastMessageTime: serverTimestamp(),
       updatedAt: serverTimestamp()
    });

    // Simulate type delay then respond
    setTimeout(async () => {
      const botVoiceMsg = {
        type: 'voice',
        text: 'Voice Message',
        audioSrc: opt.responseAudioSrc,
        duration: opt.responseDuration,
        sender: 'admin',
        createdAt: serverTimestamp(),
      };
      await addDoc(collection(db, `userChats/${currentUser.uid}/messages`), botVoiceMsg);
      await updateDoc(doc(db, 'userChats', currentUser.uid), {
         lastMessage: '🎙️ Voice Message',
         lastMessageTime: serverTimestamp(),
         updatedAt: serverTimestamp()
      });
    }, 1000);
  };

  if (location.pathname !== '/') return null;

  return (
    <>
      {/* Floating Chat Icon - smaller, positioned higher */}
      <motion.button
        className="fixed bottom-[100px] sm:bottom-[100px] right-4 sm:right-6 w-12 h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-2xl flex items-center justify-center z-[99]"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        initial={false}
        animate={{ scale: isOpen ? 0 : 1, opacity: isOpen ? 0 : 1 }}
      >
        <MessageCircle className="w-5 h-5" />
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed top-20 bottom-[100px] sm:bottom-[100px] right-4 sm:right-6 w-[340px] sm:w-[380px] bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col overflow-hidden z-[100]"
          >
            {/* Header */}
            <div className="bg-indigo-600 p-3 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <Headphones className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold flex items-center gap-2 text-sm">
                    Vibe Gadget Chat
                  </h3>
                  <p className="text-indigo-100 text-[10px] text-left">
                     {chatStatus === 'chatting' ? "Admin is chatting with you..." : chatStatus === 'busy' ? "Please wait, admin is talking to someone else." : "Typically replies in minutes"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4 bg-zinc-50 dark:bg-zinc-950/50">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center text-zinc-500 opacity-60">
                   <MessageCircle className="w-12 h-12 mb-3 text-zinc-300" />
                   <p className="text-sm">Send a message to start chatting with us.</p>
                </div>
              )}
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <div className={`w-8 h-8 rounded-full flex shrink-0 items-center justify-center ${msg.sender === 'user' ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'}`}>
                    {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  
                  <div className={`flex flex-col gap-1 max-w-[80%] ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                    {msg.type === 'text' && (
                      <div className={`p-3 rounded-2xl text-[13px] ${
                        msg.sender === 'user' 
                          ? 'bg-indigo-600 text-white rounded-tr-sm' 
                          : 'bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 shadow-sm border border-zinc-100 dark:border-zinc-700/50 rounded-tl-sm'
                      }`}>
                        {msg.text}
                      </div>
                    )}

                    {msg.type === 'voice' && msg.audioSrc && (
                      <VoiceMessageBubble
                        audioSrc={msg.audioSrc}
                        duration={msg.duration || 10}
                        bubbleColor={msg.sender === 'user' ? '#4f46e5' : 'var(--card)'} 
                        waveColor={msg.sender === 'user' ? '#fff' : '#6366f1'} 
                        className={msg.sender === 'user' ? 'rounded-tr-sm' : 'bg-white dark:bg-zinc-800 shadow-sm border border-zinc-100 dark:border-zinc-700/50 rounded-tl-sm dark:text-white shrink-0 scale-90 origin-left'}
                      />
                    )}
                    {msg.type === 'audio-room' && (
                        <div className="scale-[0.80] origin-left -my-2">
                           <VoiceChat participants={[
                              { id: "admin", name: "Admin", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Admin&backgroundColor=4f46e5", isSpeaking: true },
                              { id: auth.currentUser?.uid || "user", name: auth.currentUser?.displayName || "You", avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${auth.currentUser?.displayName || 'User'}` },
                           ]} />
                        </div>
                    )}
                    <span className="text-[10px] text-zinc-400 px-1">
                      {msg.createdAt ? new Date(msg.createdAt.toDate()).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Just now'}
                    </span>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Replies Options */}
            {options.length > 0 && chatStatus === 'idle' && (
              <div className="p-3 bg-indigo-50/50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-800 flex flex-wrap gap-2 overflow-x-auto shrink-0 max-h-32">
                <p className="w-full text-[11px] text-zinc-500 font-medium mb-1">Frequently asked questions:</p>
                {options.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => handleOptionClick(opt)}
                    className="text-left text-[12px] bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-indigo-700 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20 rounded-full px-3 py-1.5 transition-colors whitespace-nowrap shadow-sm"
                  >
                    {opt.text}
                  </button>
                ))}
              </div>
            )}

            {/* Input Area */}
            <div className="p-3 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800 shrink-0">
               {auth.currentUser ? (
                  <form onSubmit={handleSend} className="flex gap-2 items-center">
                    <input
                      type="text"
                      className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-full px-4 py-2 text-sm outline-none border border-transparent focus:border-indigo-500/50 transition-colors"
                      placeholder="Type a message..."
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                    />
                    <button
                      type="submit"
                      disabled={!inputText.trim()}
                      className="w-10 h-10 shrink-0 bg-indigo-600 text-white rounded-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-opacity hover:bg-indigo-700"
                    >
                      <Send className="w-4 h-4 ml-[-2px]" />
                    </button>
                  </form>
               ) : (
                  <div className="text-center py-2 text-xs text-zinc-500">
                    Please log in to chat with us.
                  </div>
               )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
