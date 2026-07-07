import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { Users, Phone, PhoneOff, Mic, MicOff, X, Send, MousePointer2 } from 'lucide-react';
import { useNotify } from './Notifications';
import { doc, setDoc, onSnapshot, updateDoc, arrayUnion, getDoc, collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

const LiveCoShopping = () => {
  const [isActive, setIsActive] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [inCall, setInCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [messages, setMessages] = useState<{senderId: string, senderName: string, text: string}[]>([]);
  const [inputMsg, setInputMsg] = useState('');
  const [friends, setFriends] = useState<{id: string, name: string, scrollY: number}[]>([]);
  
  const location = useLocation();
  const notify = useNotify();
  const searchParams = new URLSearchParams(location.search);
  const isSession = searchParams.get('session');
  
  const myIdRef = useRef(Math.random().toString(36).substring(7));
  const sessionIdRef = useRef(isSession || '');
  
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  useEffect(() => {
    if (isSession) {
      setIsActive(true);
      setIsOpen(true);
      joinSession(isSession);
    }
  }, [isSession]);

  const joinSession = async (id: string) => {
    sessionIdRef.current = id;
    const docRef = doc(db, 'co_shopping_sessions', id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
      await setDoc(docRef, { messages: [], users: {} });
    }
    
    await updateDoc(docRef, {
      [`users.${myIdRef.current}`]: { name: isSession ? 'Friend' : 'Host', scrollY: window.scrollY, lastActive: Date.now() }
    });

    onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setMessages(data.messages || []);
        
        const otherUsers = Object.entries(data.users || {})
          .filter(([uid]) => uid !== myIdRef.current)
          .map(([uid, val]: [string, any]) => ({ id: uid, name: val.name, scrollY: val.scrollY || 0 }));
          
        setFriends(otherUsers);
      }
    });

    const handleScroll = () => {
      updateDoc(docRef, {
        [`users.${myIdRef.current}.scrollY`]: window.scrollY
      });
    };
    
    let scrollTimeout: any;
    window.addEventListener('scroll', () => {
      if (scrollTimeout) return;
      scrollTimeout = setTimeout(() => {
        handleScroll();
        scrollTimeout = null;
      }, 500);
    });
  };

  const handleInvite = async () => {
    const newSessionId = Math.random().toString(36).substring(7);
    sessionIdRef.current = newSessionId;
    const url = window.location.origin + window.location.pathname + '?session=' + newSessionId;
    navigator.clipboard.writeText(url);
    notify('Invite link copied! Send it to your friend.', 'success');
    setIsActive(true);
    setIsOpen(true);
    
    const docRef = doc(db, 'co_shopping_sessions', newSessionId);
    await setDoc(docRef, { messages: [], users: {} });
    joinSession(newSessionId);
  };

  const sendMessage = async () => {
    if (!inputMsg.trim() || !sessionIdRef.current) return;
    
    const docRef = doc(db, 'co_shopping_sessions', sessionIdRef.current);
    await updateDoc(docRef, {
      messages: arrayUnion({ senderId: myIdRef.current, senderName: isSession ? 'Friend' : 'You', text: inputMsg })
    });
    
    setInputMsg('');
  };

  const startCall = async () => {
    if (!sessionIdRef.current) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
      setInCall(true);
      setIsMuted(false);

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'] }]
      });
      pcRef.current = pc;

      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      pc.ontrack = (event) => {
        const remoteAudio = new Audio();
        remoteAudio.autoplay = true;
        remoteAudio.srcObject = event.streams[0];
        remoteAudio.play().catch(e => console.error("Audio play error", e));
      };

      const callDocRef = doc(db, 'co_shopping_sessions', sessionIdRef.current, 'calls', 'voice');
      
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          addDoc(collection(db, 'co_shopping_sessions', sessionIdRef.current, 'calls', 'voice', 'candidates'), {
            candidate: event.candidate.toJSON(),
            sender: myIdRef.current
          });
        }
      };

      if (!isSession) {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await setDoc(callDocRef, { offer: { type: offer.type, sdp: offer.sdp } });
        
        onSnapshot(callDocRef, (snap) => {
          const data = snap.data();
          if (data?.answer && !pc.currentRemoteDescription) {
            const rtcAnswer = new RTCSessionDescription(data.answer);
            pc.setRemoteDescription(rtcAnswer).catch(console.error);
          }
        });
      } else {
        const snap = await getDoc(callDocRef);
        const data = snap.data();
        if (data?.offer) {
          await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          await updateDoc(callDocRef, { answer: { type: answer.type, sdp: answer.sdp } });
        } else {
          onSnapshot(callDocRef, async (s) => {
            const d = s.data();
            if (d?.offer && !pc.currentRemoteDescription) {
              await pc.setRemoteDescription(new RTCSessionDescription(d.offer));
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);
              await updateDoc(callDocRef, { answer: { type: answer.type, sdp: answer.sdp } });
            }
          });
        }
      }

      onSnapshot(collection(db, 'co_shopping_sessions', sessionIdRef.current, 'calls', 'voice', 'candidates'), (snap) => {
        snap.docChanges().forEach(change => {
          if (change.type === 'added') {
            const data = change.doc.data();
            if (data.sender !== myIdRef.current) {
              pc.addIceCandidate(new RTCIceCandidate(data.candidate)).catch(console.error);
            }
          }
        });
      });
    } catch (err) {
      console.error("Mic error:", err);
      notify("Microphone access denied or error.", "error");
    }
  };

  const endCall = () => {
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    pcRef.current?.close();
    pcRef.current = null;
    setInCall(false);
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks()[0].enabled = isMuted;
      setIsMuted(!isMuted);
    }
  };

  useEffect(() => {
    return () => {
      localStreamRef.current?.getTracks().forEach(t => t.stop());
      pcRef.current?.close();
    };
  }, []);

  const isAllowedPage = location.pathname === "/" || location.pathname.startsWith("/product/");
  if (!isActive && !isSession && !isAllowedPage) return null;

  if (!isActive && !isSession) {
    return (
      <div className="fixed bottom-24 right-4 z-[90]">
        <button 
          onClick={handleInvite}
          className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 p-3.5 rounded-full shadow-2xl flex items-center justify-center hover:scale-105 transition-all"
        >
          <Users className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <>
      {friends.map(f => (
        <motion.div
          key={f.id}
          animate={{ y: f.scrollY - window.scrollY + (window.innerHeight / 2) }}
          transition={{ type: 'spring', stiffness: 50 }}
          className="fixed right-2 z-[80] pointer-events-none flex items-center gap-1 opacity-70"
        >
          <div className="bg-blue-500 text-white text-[10px] px-2 py-1 rounded-full font-bold shadow-md whitespace-nowrap">
            {f.name} here
          </div>
          <MousePointer2 className="w-4 h-4 text-blue-500 fill-blue-500" />
        </motion.div>
      ))}

      <div className="fixed bottom-24 right-4 z-[90] flex flex-col items-end pointer-events-none">
        <AnimatePresence>
          {isOpen && (
            <motion.div 
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className="bg-white dark:bg-zinc-900 w-80 rounded-[2rem] shadow-2xl border border-zinc-200 dark:border-zinc-800 mb-4 overflow-hidden flex flex-col pointer-events-auto h-[400px]"
            >
              <div className="bg-zinc-100 dark:bg-zinc-800 p-4 border-b border-zinc-200 dark:border-zinc-700 flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                      {friends.length > 0 ? friends[0].name.charAt(0) : 'F'}
                    </div>
                    {friends.length > 0 && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-zinc-800 rounded-full"></div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 leading-tight">Co-Shopping</p>
                    <p className="text-[10px] text-zinc-500 font-semibold">
                      {friends.length > 0 ? 'Online' : 'Waiting...'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {!inCall ? (
                    <button onClick={startCall} className="p-2 rounded-full bg-green-100 text-green-600 hover:bg-green-200 transition-colors">
                      <Phone className="w-4 h-4" />
                    </button>
                  ) : (
                    <>
                      <button onClick={toggleMute} className={`p-2 rounded-full transition-colors ${isMuted ? 'bg-orange-100 text-orange-600' : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300'}`}>
                        {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                      </button>
                      <button onClick={endCall} className="p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition-colors">
                        <PhoneOff className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  <button onClick={() => setIsOpen(false)} className="p-2 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-500 hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white dark:bg-zinc-900 relative">
                {inCall && (
                  <div className="sticky top-0 mb-4 bg-green-500/10 border border-green-500/20 text-green-600 text-[10px] font-bold text-center py-1.5 rounded-full flex items-center justify-center gap-1.5 backdrop-blur-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Call in progress
                  </div>
                )}
                {messages.length === 0 && (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center text-zinc-400 text-xs font-medium">
                      Send a message to your friend
                    </div>
                  </div>
                )}
                {messages.map((m, i) => {
                  const isMe = m.senderId === myIdRef.current;
                  return (
                    <div key={i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <div className={`px-3.5 py-2.5 rounded-2xl text-[13px] max-w-[85%] shadow-sm ${isMe ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-tl-sm'}`}>
                        {m.text}
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-3 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex gap-2">
                <input 
                  value={inputMsg}
                  onChange={e => setInputMsg(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                  placeholder="Message..." 
                  className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-full px-4 py-2 text-sm outline-none text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
                />
                <button 
                  onClick={sendMessage} 
                  disabled={!inputMsg.trim()}
                  className={`p-2.5 rounded-full flex items-center justify-center transition-colors ${inputMsg.trim() ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400'}`}
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-2 pointer-events-auto">
          {!isOpen && (
            <button 
              onClick={() => setIsOpen(true)}
              className="bg-blue-600 text-white px-5 py-3.5 rounded-full shadow-2xl flex items-center justify-center gap-2 hover:scale-105 transition-all"
            >
              {inCall && <div className="w-2 h-2 rounded-full bg-white animate-pulse" />}
              <Users className="w-4 h-4" />
              <span className="text-sm font-bold">Co-Shopping</span>
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default LiveCoShopping;
