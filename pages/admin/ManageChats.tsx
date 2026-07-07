import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from '../../firebase';
import { collection, query, orderBy, onSnapshot, doc, getDoc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { Send, User, ChevronLeft, Bot, Mic, Radio } from 'lucide-react';
import { Button } from '../../components/ui/button';
import VoiceMessageBubble from '../../components/ui/voice-message-bubble';
import { VoiceChat } from '../../components/ui/audio-chat';

interface ChatSession {
  id: string; // userId
  userName: string;
  userAvatar: string;
  lastMessage: string;
  updatedAt: any;
}

interface ChatMessage {
  id: string;
  type: 'text' | 'voice' | 'audio-room';
  text: string;
  audioSrc?: string;
  duration?: number;
  sender: 'admin' | 'user';
  createdAt: any;
}

export default function ManageChats() {
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  
  // Audio state
  const [voiceUrl, setVoiceUrl] = useState('');
  const [voiceDuration, setVoiceDuration] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load all user chats
    const q = query(collection(db, 'userChats'), orderBy('updatedAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      const chatList = snap.docs.map(d => ({ id: d.id, ...d.data() } as ChatSession));
      setChats(chatList);
    });
    return unsub;
  }, []);

  useEffect(() => {
    // When a chat is selected, mark activeUserId and load messages
    if (!selectedChat) {
      updateDoc(doc(db, 'settings', 'adminChatStatus'), { activeUserId: null }).catch(console.error);
      return;
    }

    updateDoc(doc(db, 'settings', 'adminChatStatus'), { activeUserId: selectedChat.id }).catch(console.error);

    const msgQ = query(collection(db, `userChats/${selectedChat.id}/messages`), orderBy('createdAt', 'asc'));
    const msgsUnsub = onSnapshot(msgQ, (snap) => {
      const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() } as ChatMessage));
      setMessages(msgs);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });

    return () => {
      msgsUnsub();
    };
  }, [selectedChat]);

  const handleSendText = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || !selectedChat) return;
    
    const newMsg = {
      type: 'text',
      text: inputText.trim(),
      sender: 'admin',
      createdAt: serverTimestamp(),
    };

    setInputText('');

    await addDoc(collection(db, `userChats/${selectedChat.id}/messages`), newMsg);
    await updateDoc(doc(db, 'userChats', selectedChat.id), {
       lastMessage: newMsg.text,
       updatedAt: serverTimestamp()
    });
  };

  const handleSendVoice = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!voiceUrl.trim() || !selectedChat) return;
    
    const newMsg = {
      type: 'voice',
      text: 'Voice Message',
      audioSrc: voiceUrl.trim(),
      duration: parseInt(voiceDuration) || 10,
      sender: 'admin',
      createdAt: serverTimestamp(),
    };

    setVoiceUrl('');
    setVoiceDuration('');

    await addDoc(collection(db, `userChats/${selectedChat.id}/messages`), newMsg);
    await updateDoc(doc(db, 'userChats', selectedChat.id), {
       lastMessage: '🎙️ Voice Message',
       updatedAt: serverTimestamp()
    });
  };

  const handleSendAudioRoom = async () => {
    if (!selectedChat) return;
    
    const newMsg = {
      type: 'audio-room',
      text: 'Live Audio Room',
      sender: 'admin',
      createdAt: serverTimestamp(),
    };

    await addDoc(collection(db, `userChats/${selectedChat.id}/messages`), newMsg);
    await updateDoc(doc(db, 'userChats', selectedChat.id), {
       lastMessage: '🎙️ Live Audio Room',
       updatedAt: serverTimestamp()
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] -mx-4 -mt-4 md:m-0 md:h-[calc(100vh-100px)]">
      <div className="md:h-auto h-14 flex justify-between items-center shrink-0 px-4 pt-2 md:p-0 md:mb-6">
        <h2 className="text-xl md:text-2xl font-bold tracking-tight">Support Chats</h2>
      </div>

      <div className="flex-1 bg-white dark:bg-zinc-900 md:rounded-3xl border-y md:border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden flex">
        {/* Sidebar */}
        <div className={`w-full md:w-1/3 border-r border-zinc-100 dark:border-zinc-800 flex flex-col ${selectedChat ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 shrink-0">
            <h3 className="font-semibold px-2">Active Conversations</h3>
          </div>
          <div className="flex-1 overflow-y-auto w-full p-2 space-y-1">
             {chats.map(chat => (
               <div 
                 key={chat.id} 
                 onClick={() => setSelectedChat(chat)}
                 className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-colors ${selectedChat?.id === chat.id ? 'bg-indigo-50 dark:bg-zinc-800' : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50'}`}
               >
                 <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden shrink-0">
                   {chat.userAvatar ? (
                     <img src={chat.userAvatar} alt="" className="w-full h-full object-cover" />
                   ) : (
                     <div className="w-full h-full flex items-center justify-center text-zinc-500">
                       <User size={20} />
                     </div>
                   )}
                 </div>
                 <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">{chat.userName}</h4>
                    <p className="text-xs text-zinc-500 truncate">{chat.lastMessage}</p>
                 </div>
               </div>
             ))}
             {chats.length === 0 && (
               <div className="p-6 text-center text-sm text-zinc-500">
                 No active chats
               </div>
             )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`flex-1 flex flex-col ${!selectedChat ? 'hidden md:flex' : 'flex'}`}>
          {selectedChat ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex items-center gap-3 shrink-0">
                <button 
                  onClick={() => setSelectedChat(null)}
                  className="md:hidden p-2 -ml-2 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800"
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden shrink-0">
                   {selectedChat.userAvatar ? (
                     <img src={selectedChat.userAvatar} alt="" className="w-full h-full object-cover" />
                   ) : (
                     <div className="w-full h-full flex items-center justify-center text-zinc-500">
                       <User size={20} />
                     </div>
                   )}
                </div>
                <div>
                   <h3 className="font-semibold text-sm">{selectedChat.userName}</h3>
                   <span className="text-xs text-green-500 font-medium">Chatting (Active)</span>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-zinc-50/50 dark:bg-zinc-950/20">
                 {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 max-w-[70%] ${msg.sender === 'admin' ? 'ml-auto flex-row-reverse' : 'mr-auto flex-row'}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex shrink-0 items-center justify-center ${msg.sender === 'admin' ? 'bg-indigo-100 text-indigo-600' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'}`}>
                      {msg.sender === 'admin' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                    </div>
                    
                    <div className={`flex flex-col gap-1 ${msg.sender === 'admin' ? 'items-end' : 'items-start'}`}>
                      {msg.type === 'text' && (
                        <div className={`p-3 rounded-2xl text-sm ${
                          msg.sender === 'admin' 
                            ? 'bg-indigo-600 text-white rounded-tr-sm' 
                            : 'bg-white dark:bg-zinc-800 shadow-sm border border-zinc-100 dark:border-zinc-700/50 rounded-tl-sm'
                        }`}>
                          {msg.text}
                        </div>
                      )}

                      {msg.type === 'voice' && msg.audioSrc && (
                         <div className="bg-white dark:bg-zinc-800 p-2 rounded-2xl border border-zinc-100 dark:border-zinc-700 shadow-sm">
                           <VoiceMessageBubble
                              audioSrc={msg.audioSrc}
                              duration={msg.duration || 10}
                              bubbleColor={msg.sender === 'admin' ? '#4f46e5' : 'var(--card)'} 
                              waveColor={msg.sender === 'admin' ? '#fff' : '#6366f1'} 
                              className="border-none shadow-none"
                           />
                         </div>
                      )}
                      
                      {msg.type === 'audio-room' && (
                         <div className="-my-2 scale-90 origin-right">
                           <VoiceChat participants={[
                              { id: "admin", name: "Admin", avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Admin&backgroundColor=4f46e5", isSpeaking: true },
                              { id: selectedChat.id, name: selectedChat.userName, avatar: selectedChat.userAvatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedChat.userName}` },
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

              {/* Input */}
              <div className="p-4 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800 shrink-0">
                 {/* Voice Send Area */}
                 <form onSubmit={handleSendVoice} className="mb-3 flex gap-2 items-center bg-zinc-50 dark:bg-zinc-900/50 p-2 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-700">
                    <Mic className="text-zinc-400 w-5 h-5 ml-2" />
                    <input 
                       type="url" 
                       placeholder="Audio URL (GitHub raw link or mp3)..." 
                       className="flex-1 bg-transparent text-xs outline-none px-2"
                       value={voiceUrl}
                       onChange={(e) => setVoiceUrl(e.target.value)}
                    />
                    <input 
                       type="number" 
                       placeholder="Secs" 
                       className="w-16 bg-transparent text-xs outline-none px-2 border-l border-zinc-200 dark:border-zinc-700"
                       value={voiceDuration}
                       onChange={(e) => setVoiceDuration(e.target.value)}
                    />
                    <Button type="submit" size="sm" variant="secondary" disabled={!voiceUrl.trim()}>Send Voice</Button>
                 </form>

                 {/* Text Send Area */}
                 <div className="flex gap-2">
                   <Button onClick={handleSendAudioRoom} variant="outline" size="icon" className="shrink-0 h-11 w-11 rounded-full border-zinc-200 dark:border-zinc-700">
                     <Radio className="w-5 h-5 text-indigo-600" />
                   </Button>
                   <form onSubmit={handleSendText} className="flex-1 flex gap-2 items-center">
                      <input
                        type="text"
                        className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-full px-4 py-3 text-sm outline-none border border-transparent focus:border-indigo-500/50 transition-colors"
                        placeholder="Type a message..."
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                      />
                      <button
                        type="submit"
                        disabled={!inputText.trim()}
                        className="w-11 h-11 shrink-0 bg-indigo-600 text-white rounded-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700"
                      >
                        <Send className="w-5 h-5 ml-[-2px]" />
                      </button>
                   </form>
                 </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-500">
               <Bot className="w-16 h-16 mb-4 text-zinc-300 dark:text-zinc-700" />
               <p>Select a conversation to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
