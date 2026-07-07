import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, PhoneOff, Video, Volume2 } from 'lucide-react';
import { db, auth } from '../firebase';
import { doc, onSnapshot, updateDoc, arrayUnion, setDoc, query, collection, where, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { audioHelper } from '../lib/AudioHelper';
import { useNotify } from './Notifications';

export const GlobalCallReceiver: React.FC = () => {
  const notify = useNotify();
  const initialChatsLoaded = useRef<boolean>(false);
  const chatLastTimestamps = useRef<Record<string, number>>({});

  const [myId, setMyId] = useState<string>('');
  const [incomingCall, setIncomingCall] = useState<{
    id: string;
    type: 'audio' | 'video';
    dept: string;
    callerName: string;
    callerAvatar: string;
  } | null>(null);

  const [incomingP2PCall, setIncomingP2PCall] = useState<{
    id: string;
    type: 'audio' | 'video';
    callerId: string;
    callerName: string;
    callerAvatar: string;
  } | null>(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setMyId(user.uid);
      } else {
        let gid = localStorage.getItem('vg_guest_id');
        if (!gid) {
          gid = 'guest_' + Math.random().toString(36).substring(2, 9);
          localStorage.setItem('vg_guest_id', gid);
        }
        setMyId(gid);
      }
    });
    return () => unsub();
  }, []);

  // Update presence on site
  useEffect(() => {
    if (!myId) return;
    const updatePresence = async () => {
      try {
        await setDoc(doc(db, 'helpline_presence', myId), {
          status: 'online',
          updatedAt: Date.now()
        }, { merge: true });
      } catch (e) {
        console.error('Failed to update presence', e);
      }
    };
    updatePresence();
    const interval = setInterval(updatePresence, 5000);
    return () => clearInterval(interval);
  }, [myId]);

  useEffect(() => {
    if (!myId) return;
    if (window.location.pathname === '/help-center') return;
    
    const departments = ['general', 'tech', 'sales'];
    const unsubs = departments.map(dept => {
      const callId = `${myId}_${dept}`;
      return onSnapshot(doc(db, 'helpline_calls', callId), (snap) => {
        const data = snap.data();
        if (!data) return;

        if (data.callerId === 'admin') {
          if (data.status === 'calling') {
            // User is active on site! Change status to ringing so admin's sound shifts and user gets notified.
            updateDoc(doc(db, 'helpline_calls', callId), { status: 'ringing' }).catch(console.error);
          } else if (data.status === 'ringing') {
            setIncomingCall({
              id: callId,
              type: data.type || 'audio',
              dept,
              callerName: 'Vibe Gadget Support',
              callerAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + dept
            });
            audioHelper.playRingtone();
          } else if (data.status === 'ended') {
            if (incomingCall) {
              audioHelper.playEndBip();
            }
            setIncomingCall(null);
            audioHelper.stop();
          }
        }
      });
    });
    
    return () => {
      unsubs.forEach(unsub => unsub());
      audioHelper.stop();
    };
  }, [myId, incomingCall?.id]);

  useEffect(() => {
    if (!myId) return;

    // Simple query to avoid Firestore composite index requirement
    const q = query(
      collection(db, 'p2p_calls'),
      where('receiverId', '==', myId)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const activeDocs = snapshot.docs.filter(doc => {
        const status = doc.data().status;
        return status === 'calling' || status === 'ringing';
      });

      if (activeDocs.length === 0) {
        if (incomingP2PCall) {
          audioHelper.stop();
          setIncomingP2PCall(null);
        }
        return;
      }

      const activeCallDoc = activeDocs[0];
      const data = activeCallDoc.data();

      setIncomingP2PCall({
        id: activeCallDoc.id,
        type: data.type || 'audio',
        callerId: data.callerId,
        callerName: data.callerName || 'Someone',
        callerAvatar: data.callerAvatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + data.callerId
      });

      if (data.status === 'calling') {
        updateDoc(doc(db, 'p2p_calls', activeCallDoc.id), { status: 'ringing' }).catch(console.error);
      }

      audioHelper.playRingtone();
    });

    return () => {
      unsub();
    };
  }, [myId, incomingP2PCall?.id]);

  // Global message notification listener
  useEffect(() => {
    if (!myId) return;

    const q = query(
      collection(db, 'p2p_chats'),
      where('participants', 'array-contains', myId)
    );

    const unsub = onSnapshot(q, async (snapshot) => {
      const updates: Record<string, number> = {};
      
      for (const d of snapshot.docs) {
        const data = d.data();
        const chatId = d.id;
        const updatedAtVal = data.updatedAt?.toMillis ? data.updatedAt.toMillis() : (data.updatedAt || 0);
        
        updates[chatId] = updatedAtVal;

        if (initialChatsLoaded.current) {
          const prevTime = chatLastTimestamps.current[chatId] || 0;
          if (updatedAtVal > prevTime) {
            const isMe = data.lastSenderId === myId;
            const otherUid = data.participants.find((p: string) => p !== myId);
            const isCurrentChatPage = window.location.pathname === '/messages' && 
                                     new URLSearchParams(window.location.search).get('chatId') === otherUid;

            if (!isMe && !isCurrentChatPage) {
              let senderName = "Vibe Partner";
              if (otherUid) {
                try {
                  const uDoc = await getDoc(doc(db, 'users', otherUid));
                  if (uDoc.exists()) {
                    senderName = uDoc.data().displayName || uDoc.data().shopName || "Vibe Partner";
                  }
                } catch (e) {}
              }

              if (audioHelper && typeof audioHelper.play === 'function') {
                audioHelper.play('message');
              } else if (audioHelper && typeof audioHelper.playCalling === 'function') {
                audioHelper.playCalling();
              }

              const messageText = data.lastMessage || "Sent a message";
              notify(
                `New Message from ${senderName}`, 
                "info", 
                messageText.length > 50 ? messageText.substring(0, 50) + "..." : messageText
              );
            }
          }
        }
      }

      chatLastTimestamps.current = { ...chatLastTimestamps.current, ...updates };
      initialChatsLoaded.current = true;
    });

    return () => {
      unsub();
    };
  }, [myId]);

  const declineP2PCall = async () => {
    audioHelper.playEndBip();
    if (incomingP2PCall) {
      await updateDoc(doc(db, 'p2p_calls', incomingP2PCall.id), {
        status: 'ended'
      }).catch(console.error);
    }
    setIncomingP2PCall(null);
  };

  const acceptP2PCall = async () => {
    audioHelper.stop();
    if (incomingP2PCall) {
      await updateDoc(doc(db, 'p2p_calls', incomingP2PCall.id), {
        status: 'connected'
      }).catch(console.error);
      
      navigate(`/messages?chatId=${incomingP2PCall.callerId}&activeCallId=${incomingP2PCall.id}&callType=${incomingP2PCall.type}`);
    }
    setIncomingP2PCall(null);
  };

  const declineCall = async () => {
    audioHelper.playEndBip();
    if (incomingCall) {
      await updateDoc(doc(db, 'helpline_calls', incomingCall.id), {
        status: 'ended'
      }).catch(console.error);
      
      const docRef = doc(db, 'helpline_chats', incomingCall.id);
      await updateDoc(docRef, {
        messages: arrayUnion({
          senderId: 'system',
          text: 'Incoming Call Declined',
          isSystem: true,
          systemType: 'call_declined',
          timestamp: Date.now()
        })
      }).catch(console.error);
    }
    setIncomingCall(null);
  };

  const acceptCall = async () => {
    audioHelper.stop();
    if (incomingCall) {
      await updateDoc(doc(db, 'helpline_calls', incomingCall.id), {
        status: 'accepted'
      }).catch(console.error);
      
      navigate(`/help-center?dept=${incomingCall.dept}&accept_call=true&type=${incomingCall.type}`);
    }
    setIncomingCall(null);
  };

  return (
    <AnimatePresence>
      {incomingCall && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] bg-zinc-950/95 backdrop-blur-md text-white flex flex-col items-center justify-center p-6"
        >
          <div className="flex flex-col items-center max-w-sm w-full text-center">
            {/* Soft pulsing halo */}
            <div className="relative mb-8">
              <motion.div 
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 rounded-full bg-emerald-500/10 blur-xl"
              />
              <img 
                src={incomingCall.callerAvatar} 
                alt="Vibe Gadget" 
                className="w-28 h-28 rounded-full border-4 border-zinc-800/80 shadow-2xl relative z-10"
              />
              <div className="absolute -bottom-2 -right-2 bg-emerald-500 p-2.5 rounded-full border-4 border-zinc-950 z-20 shadow-lg">
                {incomingCall.type === 'video' ? <Video className="w-5 h-5 text-white" /> : <Phone className="w-5 h-5 text-white" />}
              </div>
            </div>

            <h2 className="text-3xl font-black tracking-tight text-white mb-2">Vibe Gadget</h2>
            <p className="text-emerald-400 font-semibold text-sm uppercase tracking-wider mb-1 flex items-center gap-1.5 justify-center">
              <Volume2 className="w-4 h-4 animate-bounce" />
              Incoming Support Call
            </p>
            <p className="text-zinc-400 text-sm font-medium mb-16 capitalize">
              {incomingCall.dept} Department
            </p>

            <div className="flex justify-around w-full max-w-xs gap-8">
              {/* Decline Button (Size normalized to match standard control buttons) */}
              <button 
                onClick={declineCall}
                className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center shadow-lg shadow-red-600/30 transition-transform active:scale-95"
              >
                <PhoneOff className="w-6 h-6 text-white" />
              </button>

              {/* Accept Button */}
              <button 
                onClick={acceptCall}
                className="w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/40 transition-transform active:scale-95 animate-pulse"
              >
                <Phone className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {incomingP2PCall && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] bg-zinc-950/95 backdrop-blur-md text-white flex flex-col items-center justify-center p-6"
        >
          <div className="flex flex-col items-center max-w-sm w-full text-center">
            {/* Soft pulsing halo */}
            <div className="relative mb-8">
              <motion.div 
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 rounded-full bg-emerald-500/10 blur-xl"
              />
              <img 
                src={incomingP2PCall.callerAvatar} 
                alt={incomingP2PCall.callerName} 
                className="w-28 h-28 rounded-full border-4 border-zinc-800/80 shadow-2xl relative z-10"
              />
              <div className="absolute -bottom-2 -right-2 bg-emerald-500 p-2.5 rounded-full border-4 border-zinc-950 z-20 shadow-lg">
                {incomingP2PCall.type === 'video' ? <Video className="w-5 h-5 text-white" /> : <Phone className="w-5 h-5 text-white" />}
              </div>
            </div>

            <h2 className="text-3xl font-black tracking-tight text-white mb-2">{incomingP2PCall.callerName}</h2>
            <p className="text-emerald-400 font-semibold text-sm uppercase tracking-wider mb-1 flex items-center gap-1.5 justify-center">
              <Volume2 className="w-4 h-4 animate-bounce" />
              Incoming Call
            </p>

            <div className="flex justify-around w-full max-w-xs gap-8 mt-16">
              {/* Decline Button */}
              <button 
                onClick={declineP2PCall}
                className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center shadow-lg shadow-red-600/30 transition-transform active:scale-95"
              >
                <PhoneOff className="w-6 h-6 text-white" />
              </button>

              {/* Accept Button */}
              <button 
                onClick={acceptP2PCall}
                className="w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/40 transition-transform active:scale-95 animate-pulse"
              >
                <Phone className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
