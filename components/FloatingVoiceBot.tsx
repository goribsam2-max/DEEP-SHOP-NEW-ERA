import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, User, Bot, Volume2 } from 'lucide-react';
import VoiceMessageBubble from './ui/voice-message-bubble';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

interface BotMessage {
  id: string;
  type: 'text' | 'voice';
  text: string;
  audioSrc?: string;
  duration?: number;
  sender: 'bot' | 'user';
}

interface PreWrittenOption {
  id: string;
  text: string;
  responseAudioSrc: string;
  responseDuration: number;
}

// Global fallback if not in firebase
const FALLBACK_OPTIONS = [
  {
    id: "opt1",
    text: "Welcome message sunte chai",
    responseAudioSrc: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    responseDuration: 15
  },
  {
    id: "opt2",
    text: "Apnader service gulo ki ki?",
    responseAudioSrc: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    responseDuration: 10
  }
]

export function FloatingVoiceBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<BotMessage[]>([
    {
      id: 'welcome',
      type: 'text',
      text: 'Assalamu Alaikum! Kemon achen? Nicher option theke jekono ekta select korte paren amader voice message shonar jonno.',
      sender: 'bot'
    }
  ]);
  const [options, setOptions] = useState<PreWrittenOption[]>(FALLBACK_OPTIONS);

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
      } catch (err) {
        console.log("Error loading voice bot settings:", err);
      }
    }
    fetchBotOptions();
  }, []);

  const handleOptionClick = (opt: PreWrittenOption) => {
    // Add User Message
    const userMsg: BotMessage = {
      id: Date.now().toString(),
      type: 'text',
      text: opt.text,
      sender: 'user'
    };
    
    setMessages(prev => [...prev, userMsg]);

    // Simulate typing delay before sending voice message
    setTimeout(() => {
      const botVoiceMsg: BotMessage = {
        id: (Date.now() + 1).toString(),
        type: 'voice',
        text: '',
        audioSrc: opt.responseAudioSrc,
        duration: opt.responseDuration,
        sender: 'bot'
      };
      setMessages(prev => [...prev, botVoiceMsg]);
    }, 1000);
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        className="fixed bottom-20 sm:bottom-6 right-6 w-14 h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-2xl shadow-indigo-600/30 flex items-center justify-center z-[99]"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        initial={false}
        animate={{ scale: isOpen ? 0 : 1, opacity: isOpen ? 0 : 1 }}
      >
        <Volume2 className="w-6 h-6" />
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-20 sm:bottom-24 right-4 sm:right-6 w-[340px] sm:w-[380px] bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col overflow-hidden z-[100]"
          >
            {/* Header */}
            <div className="bg-indigo-600 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    Voice Assistant
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  </h3>
                  <p className="text-indigo-100 text-xs text-left">Typically replies instantly</p>
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
            <div className="flex-1 p-4 overflow-y-auto max-h-[400px] flex flex-col gap-4 bg-zinc-50 dark:bg-zinc-950/50">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <div className={`w-8 h-8 rounded-full flex shrink-0 items-center justify-center ${msg.sender === 'user' ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'}`}>
                    {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>
                  
                  <div className={`flex flex-col gap-1 max-w-[80%] ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                    {msg.type === 'text' && (
                      <div className={`p-3 rounded-2xl text-sm ${
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
                        bubbleColor={msg.sender === 'user' ? '#4f46e5' : 'var(--card)'} // indigo-600 or background
                        waveColor={msg.sender === 'user' ? '#fff' : '#6366f1'} // white or indigo-500
                        className={msg.sender === 'user' ? 'rounded-tr-sm' : 'bg-white dark:bg-zinc-800 shadow-sm border border-zinc-100 dark:border-zinc-700/50 rounded-tl-sm dark:text-white'}
                      />
                    )}
                    <span className="text-[10px] text-zinc-400 px-1">Just now</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Pre-written Options Footer */}
            <div className="p-4 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800 flex flex-col gap-2">
              <p className="text-xs text-zinc-500 font-medium px-1 mb-1">Frequently asked questions:</p>
              <div className="flex flex-wrap gap-2">
                {options.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => handleOptionClick(opt)}
                    className="text-left text-sm bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20 rounded-xl px-3 py-2 transition-colors"
                  >
                    {opt.text}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
