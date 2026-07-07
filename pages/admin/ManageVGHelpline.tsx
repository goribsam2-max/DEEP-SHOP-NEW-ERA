import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../firebase';
import { collection, onSnapshot, doc, getDoc, updateDoc, arrayUnion, setDoc, addDoc, getDocs, deleteDoc } from 'firebase/firestore';
import { Phone, Video, VideoOff, Mic, MicOff, Volume2, PhoneOff, Send, MessageSquare, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { audioHelper } from '../../lib/AudioHelper';

const CallBubble = ({ msg }: { msg: any }) => {
  const isVideo = msg.text?.toLowerCase().includes('video') || msg.systemType === 'video';
  const timestamp = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  let icon = <Phone className="w-4 h-4 text-emerald-500" />;
  let title = "Voice Call";
  let subtitle = "Call logged";
  let bgClass = "bg-zinc-100 dark:bg-zinc-800 border-zinc-200/50 dark:border-zinc-700/50";
  let iconBg = "bg-emerald-500/10 dark:bg-emerald-500/20";

  if (isVideo) {
    icon = <Video className="w-4 h-4 text-blue-500" />;
    title = "Video Call";
    iconBg = "bg-blue-500/10 dark:bg-blue-500/20";
  }

  const isMissed = msg.systemType === 'missed' || msg.text?.toLowerCase().includes('missed');
  const isDeclined = msg.systemType === 'declined' || msg.systemType === 'call_declined' || msg.text?.toLowerCase().includes('declined');
  const isEnded = msg.systemType === 'ended' || msg.text?.toLowerCase().includes('ended');
  const isStarted = msg.systemType === 'started' || msg.text?.toLowerCase().includes('started');

  if (isStarted) {
    title = isVideo ? "Video Call Started" : "Voice Call Started";
    subtitle = "Connected";
    iconBg = isVideo ? "bg-blue-500/10 dark:bg-blue-500/20" : "bg-emerald-500/10 dark:bg-emerald-500/20";
    icon = isVideo ? <Video className="w-4 h-4 text-blue-500" /> : <Phone className="w-4 h-4 text-emerald-500" />;
  } else if (isEnded) {
    title = isVideo ? "Video Call Ended" : "Voice Call Ended";
    const dur = msg.duration || msg.text?.split(' - ')[1] || "Ended";
    subtitle = `Duration: ${dur}`;
    iconBg = "bg-zinc-500/10 dark:bg-zinc-500/20";
    icon = <PhoneOff className="w-4 h-4 text-zinc-500" />;
  } else if (isDeclined) {
    title = isVideo ? "Video Call Declined" : "Voice Call Declined";
    subtitle = "Declined";
    iconBg = "bg-red-500/10 dark:bg-red-500/20";
    icon = <PhoneOff className="w-4 h-4 text-red-500" />;
  } else if (isMissed) {
    title = isVideo ? "Missed Video Call" : "Missed Voice Call";
    subtitle = "No answer";
    iconBg = "bg-orange-500/10 dark:bg-orange-500/20";
    icon = <PhoneOff className="w-4 h-4 text-orange-500" />;
  }

  return (
    <div className="flex justify-center my-2 w-full">
      <div className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl max-w-xs w-full bg-white dark:bg-zinc-900 border ${bgClass} shadow-sm transition-all hover:shadow-md`}>
        <div className={`p-2 rounded-full ${iconBg} flex items-center justify-center shrink-0`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 truncate">{title}</p>
          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5 font-medium">{subtitle}</p>
        </div>
        <div className="text-[9px] text-zinc-400 self-end shrink-0 font-mono">
          {timestamp}
        </div>
      </div>
    </div>
  );
};

const ManageVGHelpline: React.FC = () => {
  const [chats, setChats] = useState<{ id: string, messages: any[], lastActive: number, unreadCountAdmin?: number, userName?: string, userEmail?: string, deviceInfo?: string }[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputMsg, setInputMsg] = useState('');
  
  // Call States
  const [callState, setCallState] = useState<'idle' | 'ringing' | 'calling' | 'active'>('idle');
  const [callType, setCallType] = useState<'audio' | 'video'>('audio');
  const [activeCallId, setActiveCallId] = useState<string | null>(null);
  const [activeCallCallerId, setActiveCallCallerId] = useState<string | null>(null);
  const [isIncoming, setIsIncoming] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  
  const [presences, setPresences] = useState<Record<string, { status: string, updatedAt: number }>>({});
  
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const callStartTimeRef = useRef<number>(Date.now());
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const candidateUnsubRef = useRef<(() => void) | null>(null);
  const offerAnswerUnsubRef = useRef<(() => void) | null>(null);

  const callStateRef = useRef(callState);
  useEffect(() => {
    callStateRef.current = callState;
  }, [callState]);

  const activeCallIdRef = useRef(activeCallId);
  useEffect(() => {
    activeCallIdRef.current = activeCallId;
  }, [activeCallId]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (localVideoRef.current && localStream && callType === 'video' && !isVideoOff) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, callType, isVideoOff, callState]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream && callType === 'video') {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, callType, callState]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'helpline_chats'), (snap) => {
      const chatList = snap.docs.map(d => {
        const data = d.data();
        const msgs = data.messages || [];
        return {
          id: d.id,
          messages: msgs,
          lastActive: msgs.length > 0 ? msgs[msgs.length - 1].timestamp : 0,
          unreadCountAdmin: data.unreadCountAdmin || 0,
          userName: data.userName || '',
          userEmail: data.userEmail || '',
          deviceInfo: data.deviceInfo || ''
        };
      }).sort((a, b) => b.lastActive - a.lastActive);
      setChats(chatList);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsubPresences = onSnapshot(collection(db, 'helpline_presence'), (snap) => {
      const presenceMap: any = {};
      snap.docs.forEach(d => {
        presenceMap[d.id] = d.data();
      });
      setPresences(presenceMap);
    });
    return () => unsubPresences();
  }, []);

  const isUserOnline = (chatId: string) => {
    const idx = chatId.lastIndexOf('_');
    const userId = idx !== -1 ? chatId.substring(0, idx) : chatId;
    const presence = presences[userId];
    if (!presence) return false;
    // Considered online if status is 'online' and updated within 15 seconds
    return presence.status === 'online' && (Date.now() - presence.updatedAt < 15000);
  };

  useEffect(() => {
    if (!selectedChat) return;
    const unsub = onSnapshot(doc(db, 'helpline_chats', selectedChat), (snap) => {
      if (snap.exists()) setMessages(snap.data().messages || []);
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    });
    return () => unsub();
  }, [selectedChat]);

  useEffect(() => {
    // Listen for calls across all chats
    const unsubCalls = onSnapshot(collection(db, 'helpline_calls'), (snap) => {
      let incomingCall = null;
      const currentCallState = callStateRef.current;
      const currentActiveCallId = activeCallIdRef.current;

      for (const d of snap.docs) {
        const data = d.data();
        if (!data) continue;

        // Ignore stale snapshots from previous calls
        if (data.timestamp && data.timestamp < callStartTimeRef.current) {
          continue;
        }

        if (data.callerId !== 'admin') {
          // Incoming call from user
          if (data.status === 'calling' && currentCallState === 'idle') {
            incomingCall = { id: d.id, ...data };
            // Admin is online! Symmetrically upgrade call to ringing instantly
            updateDoc(doc(db, 'helpline_calls', d.id), { status: 'ringing' }).catch(console.error);
          } else if (data.status === 'ringing' && currentCallState === 'idle') {
            incomingCall = { id: d.id, ...data };
          } else if (data.status === 'ended' && currentActiveCallId === d.id) {
            audioHelper.playEndBip();
            endCallLocal();
          }
        } else {
          // Outgoing call from admin
          if (currentActiveCallId === d.id) {
            if (data.status === 'ringing' && currentCallState === 'calling') {
              setCallState('ringing');
              audioHelper.playCalling(); // Ringing feedback
            } else if (data.status === 'accepted' && (currentCallState === 'calling' || currentCallState === 'ringing')) {
              setCallState('active');
              audioHelper.stop();
            } else if (data.status === 'ended' && currentCallState !== 'idle') {
              audioHelper.playEndBip();
              endCallLocal();
            }
          }
        }
      }
      
      if (incomingCall && callStateRef.current === 'idle') {
        setActiveCallId(incomingCall.id);
        setActiveCallCallerId(incomingCall.callerId);
        setCallType(incomingCall.type);
        setCallState('ringing');
        setIsIncoming(true);
        callStartTimeRef.current = incomingCall.timestamp || Date.now();
        audioHelper.playRingtone();
      }
    });
    
    return () => {
      unsubCalls();
      endCallLocal();
    };
  }, []);
  
  useEffect(() => {
    if (callState === 'active') {
      timerRef.current = setInterval(() => setCallDuration(p => p + 1), 1000);
    } else {
      clearInterval(timerRef.current);
      setCallDuration(0);
    }
    return () => clearInterval(timerRef.current);
  }, [callState]);

  const addSystemCallMessage = async (chatId: string, type: 'started' | 'ended' | 'declined' | 'missed', duration?: string) => {
    const docRef = doc(db, 'helpline_chats', chatId);
    const labelMap = {
      started: `Call started (${callType})`,
      ended: `Call ended - ${duration || '00:00'}`,
      declined: `Call declined`,
      missed: `Missed call`
    };
    
    await updateDoc(docRef, {
      messages: arrayUnion({
        senderId: 'system',
        text: labelMap[type],
        isSystem: true,
        systemType: type,
        duration: duration || null,
        timestamp: Date.now()
      })
    }).catch(console.error);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim() || !selectedChat) return;
    
    await updateDoc(doc(db, 'helpline_chats', selectedChat), {
      messages: arrayUnion({
        senderId: 'admin',
        text: inputMsg.trim(),
        timestamp: Date.now()
      })
    });
    setInputMsg('');
  };

  const clearCallSession = async (cId: string) => {
    try {
      const callRef = doc(db, 'helpline_calls', cId);
      await setDoc(callRef, { status: 'idle' }, { merge: true });
      const candRef = collection(db, 'helpline_calls', cId, 'candidates');
      const snap = await getDocs(candRef);
      const promises = snap.docs.map(d => deleteDoc(d.ref));
      await Promise.all(promises);
    } catch (e) {
      console.error('Error clearing call session:', e);
    }
  };

  const startCall = async (type: 'audio' | 'video') => {
    if (!selectedChat) return;
    setCallType(type);
    setCallState('calling');
    setActiveCallId(selectedChat);
    setActiveCallCallerId('admin');
    setIsIncoming(false);
    audioHelper.playCalling();
    const now = Date.now();
    callStartTimeRef.current = now;
    
    try {
      await clearCallSession(selectedChat);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: type === 'video' });
      localStreamRef.current = stream;
      setLocalStream(stream);
      
      const callRef = doc(db, 'helpline_calls', selectedChat);
      await setDoc(callRef, {
        status: 'calling', // Symmetrical presence status
        type,
        callerId: 'admin',
        timestamp: now
      });
      
      await addSystemCallMessage(selectedChat, 'started');

      const idx = selectedChat.lastIndexOf('_');
      const userId = idx !== -1 ? selectedChat.substring(0, idx) : selectedChat;
      fetch("/api/send-push-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId,
          title: "Incoming Call",
          body: `📞 Incoming ${type} call from Vibe Gadget Support`,
          link: `/help-center?dept=${idx !== -1 ? selectedChat.substring(idx + 1) : 'general'}`
        })
      }).catch(console.error);

      setupWebRTC(stream, type, true, selectedChat);
    } catch (err) {
      console.error(err);
      alert('Microphone/Camera access denied');
      audioHelper.stop();
      setCallState('idle');
    }
  };

  const acceptCall = async () => {
    if (!activeCallId) return;
    audioHelper.stop();
    try {
      const callRef = doc(db, 'helpline_calls', activeCallId);
      const callSnap = await getDoc(callRef);
      const callData = callSnap.data();
      const actualType = callData?.type || 'audio';
      setCallType(actualType);

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: actualType === 'video' 
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      setCallState('active');
      await setDoc(callRef, { status: 'accepted' }, { merge: true });

      setupWebRTC(stream, actualType, false, activeCallId);
    } catch (err) {
      console.error(err);
      declineCall();
    }
  };

  const setupWebRTC = async (stream: MediaStream, type: 'audio' | 'video', isCaller: boolean, callId: string) => {
    // Clean up any stale subscription
    if (offerAnswerUnsubRef.current) {
      try { offerAnswerUnsubRef.current(); } catch (e) {}
      offerAnswerUnsubRef.current = null;
    }
    if (candidateUnsubRef.current) {
      try { candidateUnsubRef.current(); } catch (e) {}
      candidateUnsubRef.current = null;
    }

    const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
    pcRef.current = pc;
    
    stream.getTracks().forEach(track => pc.addTrack(track, stream));
    
    pc.ontrack = (event) => {
      const typeStr = typeof type !== 'undefined' ? type : callType;
      const rStream = event.streams[0];
      remoteStreamRef.current = rStream;
      setRemoteStream(rStream);

      if (typeStr === 'video') {
        // Handled by state -> rendering video elements
      } else {
        if (remoteAudioRef.current) {
          try {
            remoteAudioRef.current.pause();
            remoteAudioRef.current.srcObject = null;
          } catch (e) {}
        }
        const audio = new Audio();
        remoteAudioRef.current = audio;
        audio.srcObject = rStream;
        audio.play().catch(console.error);
      }
    };
    
    const callRef = doc(db, 'helpline_calls', callId);
    const candidateRef = collection(db, 'helpline_calls', callId, 'candidates');

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        addDoc(candidateRef, {
          candidate: event.candidate.toJSON(),
          sender: 'admin'
        });
      }
    };

    const queuedCandidates: any[] = [];

    const applyCandidate = async (candidateInit: any) => {
      try {
        if (pc.remoteDescription && pc.remoteDescription.type) {
          await pc.addIceCandidate(new RTCIceCandidate(candidateInit));
        } else {
          queuedCandidates.push(candidateInit);
        }
      } catch (err) {
        console.warn('Error adding ICE candidate:', err);
      }
    };

    const drainCandidates = async () => {
      while (queuedCandidates.length > 0) {
        const cand = queuedCandidates.shift();
        if (cand) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(cand));
          } catch (err) {
            console.warn('Error draining ICE candidate:', err);
          }
        }
      }
    };

    if (isCaller) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await updateDoc(callRef, { offer: { type: offer.type, sdp: offer.sdp } });
      
      const unsubOfferAnswer = onSnapshot(callRef, async (snap) => {
        const data = snap.data();
        if (data?.answer && !pc.currentRemoteDescription) {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
            await drainCandidates();
            setCallState('active');
            audioHelper.stop();
          } catch (err) {
            console.error('Error setting remote description:', err);
          }
        }
      });
      offerAnswerUnsubRef.current = unsubOfferAnswer;
    } else {
      const snap = await getDoc(callRef);
      const data = snap.data();
      if (data?.offer) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
          await drainCandidates();
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          await updateDoc(callRef, { answer: { type: answer.type, sdp: answer.sdp } });
        } catch (err) {
          console.error('Error setting remote description:', err);
        }
      }
    }

    const unsubCand = onSnapshot(candidateRef, (snap) => {
      snap.docChanges().forEach(change => {
        if (change.type === 'added') {
          const data = change.doc.data();
          if (data.sender !== 'admin') {
            applyCandidate(data.candidate);
          }
        }
      });
    });
    candidateUnsubRef.current = unsubCand;
  };

  const declineCall = async () => {
    const originalCallId = activeCallId;
    endCallLocal();
    if (originalCallId) {
      try {
        const callRef = doc(db, 'helpline_calls', originalCallId);
        const snap = await getDoc(callRef);
        if (snap.exists()) {
          const cData = snap.data();
          if (cData.status === 'ringing' || cData.status === 'calling') {
            if (cData.callerId === 'admin') {
              await addSystemCallMessage(originalCallId, 'missed');
            } else {
              await addSystemCallMessage(originalCallId, 'declined');
            }
          } else if (callState === 'active') {
            await addSystemCallMessage(originalCallId, 'ended', formatTime(callDuration));
          }
        }
        await setDoc(callRef, { status: 'ended', timestamp: Date.now() }, { merge: true });
      } catch (e) {
        console.error(e);
      }
    }
  };

  const endCallLocal = () => {
    audioHelper.stop();
    
    // Stop local tracks
    if (localStreamRef.current) {
      try {
        localStreamRef.current.getTracks().forEach(t => t.stop());
      } catch (e) {}
      localStreamRef.current = null;
    }
    setLocalStream(null);

    // Stop remote tracks
    if (remoteStreamRef.current) {
      try {
        remoteStreamRef.current.getTracks().forEach(t => t.stop());
      } catch (e) {}
      remoteStreamRef.current = null;
    }
    setRemoteStream(null);

    // Pause remote audio
    if (remoteAudioRef.current) {
      try {
        remoteAudioRef.current.pause();
        remoteAudioRef.current.srcObject = null;
      } catch (e) {}
      remoteAudioRef.current = null;
    }

    // Unsubscribe from candidates snapshot
    if (candidateUnsubRef.current) {
      try {
        candidateUnsubRef.current();
      } catch (e) {}
      candidateUnsubRef.current = null;
    }

    // Unsubscribe from offer/answer snapshot
    if (offerAnswerUnsubRef.current) {
      try {
        offerAnswerUnsubRef.current();
      } catch (e) {}
      offerAnswerUnsubRef.current = null;
    }

    if (pcRef.current) {
      try {
        pcRef.current.getSenders().forEach(sender => {
          if (sender.track) {
            try { sender.track.stop(); } catch (e) {}
          }
        });
        pcRef.current.getReceivers().forEach(receiver => {
          if (receiver.track) {
            try { receiver.track.stop(); } catch (e) {}
          }
        });
        pcRef.current.close();
      } catch (e) {}
    }
    pcRef.current = null;
    
    callStartTimeRef.current = Date.now(); // Ignore any late snapshots from the previous call
    setCallState('idle');
    setActiveCallId(null);
    setActiveCallCallerId(null);
    setIsIncoming(false);
    setIsMuted(false);
    setIsVideoOff(false);
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(t => t.enabled = isMuted);
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(t => t.enabled = isVideoOff);
      setIsVideoOff(!isVideoOff);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const activeChatDetails = chats.find(c => c.id === selectedChat);

  return (
    <div className="h-[calc(100vh-80px)] flex relative overflow-hidden bg-zinc-50 dark:bg-zinc-950">
      {/* Sidebar List - Hidden on mobile if chat selected */}
      <div className={`w-full md:w-80 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-y-auto flex-shrink-0 ${selectedChat ? 'hidden md:block' : 'block'}`}>
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/50">
          <h2 className="font-bold text-lg text-zinc-900 dark:text-white">Helpline Chats</h2>
        </div>
        {chats.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 text-sm">No chats active</div>
        ) : (
          chats.map(chat => (
            <div 
              key={chat.id}
              onClick={() => {
                setSelectedChat(chat.id);
                updateDoc(doc(db, 'helpline_chats', chat.id), { unreadCountAdmin: 0 }).catch(() => {});
              }}
              className={`p-4 border-b border-zinc-100 dark:border-zinc-800 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors ${selectedChat === chat.id ? 'bg-zinc-100 dark:bg-zinc-800' : ''}`}
            >
              <div className="flex justify-between items-center mb-1">
                <div className="font-bold text-sm text-zinc-900 dark:text-white truncate flex items-center gap-1.5">
                  {isUserOnline(chat.id) && (
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                  )}
                  {chat.userName || chat.id.replace(/guest_/, 'Guest ')}
                </div>
                {chat.unreadCountAdmin && chat.unreadCountAdmin > 0 ? (
                  <div className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {chat.unreadCountAdmin}
                  </div>
                ) : null}
              </div>
              <div className="text-[11px] text-zinc-400 truncate mb-1">{chat.userEmail || 'Guest Session'}</div>
              <div className="text-xs text-zinc-500 truncate">{chat.messages.length > 0 ? chat.messages[chat.messages.length - 1].text : 'No messages'}</div>
            </div>
          ))
        )}
      </div>
      
      {/* Conversation Detail Area - Hidden on mobile if no chat selected */}
      <div className={`flex-1 flex flex-col bg-zinc-50 dark:bg-black relative ${selectedChat ? 'block' : 'hidden md:flex'}`}>
        {selectedChat ? (
          <>
            {/* Header */}
            <div className="p-4 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center z-10 shadow-sm">
              <div className="flex items-center gap-3">
                <button onClick={() => setSelectedChat(null)} className="md:hidden p-1 text-zinc-500 hover:text-zinc-800 dark:hover:text-white transition-colors">
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <div>
                  <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                    {activeChatDetails && isUserOnline(activeChatDetails.id) && (
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                    )}
                    {activeChatDetails?.userName || selectedChat.replace(/guest_/, 'Guest ')}
                    {activeChatDetails && isUserOnline(activeChatDetails.id) && (
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-1.5 py-0.5 rounded-full font-medium">On Site</span>
                    )}
                  </h3>
                  {activeChatDetails?.deviceInfo && (
                    <p className="text-[10px] text-zinc-400">Device: {activeChatDetails.deviceInfo}</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => startCall('audio')} 
                  disabled={callState !== 'idle'} 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
                  title="Call User"
                >
                  <Phone className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => startCall('video')} 
                  disabled={callState !== 'idle'} 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
                  title="Video Call User"
                >
                  <Video className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, i) => {
                if (msg.senderId === 'system' || msg.isSystem) {
                  return <CallBubble key={i} msg={msg} />;
                }
                const isMe = msg.senderId === 'admin';
                return (
                  <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`p-3 rounded-2xl max-w-[70%] text-sm shadow-sm ${isMe ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 rounded-tl-sm'}`}>
                      {msg.imageUrl && <img src={msg.imageUrl} alt="" className="max-w-xs rounded-lg mb-2" />}
                      <p>{msg.text}</p>
                      <div className={`text-[9px] text-right mt-1 ${isMe ? 'text-indigo-200' : 'text-zinc-400'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
            
            {/* Input Form */}
            <div className="p-4 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800">
              <form onSubmit={sendMessage} className="flex gap-2">
                <input 
                  type="text"
                  value={inputMsg}
                  onChange={e => setInputMsg(e.target.value)}
                  placeholder="Type message to user..."
                  className="flex-1 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-full outline-none text-sm text-zinc-900 dark:text-white border border-zinc-200/40 dark:border-zinc-700"
                />
                <button type="submit" disabled={!inputMsg.trim()} className="p-3 bg-indigo-600 text-white rounded-full disabled:opacity-50 hover:bg-indigo-700 transition-colors">
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-500">
            <MessageSquare className="w-16 h-16 mb-4 opacity-50 text-indigo-500" />
            <p className="font-medium">Select a helpline chat to manage</p>
          </div>
        )}
      </div>

      {/* Call Fullscreen UI Overlay */}
      <AnimatePresence>
        {callState !== 'idle' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowControls(p => !p)}
            className="fixed inset-0 z-[100] bg-zinc-950/95 text-white flex flex-col"
          >
            {callState === 'ringing' && isIncoming ? (
              // Incoming call screen for admin
              <div className="flex-1 flex flex-col items-center justify-center">
                <div className="w-32 h-32 rounded-full bg-emerald-500/20 flex items-center justify-center mb-8 animate-pulse relative">
                  <Phone className="w-12 h-12 text-emerald-500 relative z-10" />
                  <div className="absolute inset-0 rounded-full border-4 border-emerald-500/30 scale-125" />
                </div>
                <h2 className="text-3xl font-bold mb-1 font-sans tracking-tight">Incoming Call</h2>
                <p className="text-zinc-400 mb-2">User is calling support</p>
                <p className="text-sm text-emerald-400 font-mono tracking-wider mb-12 uppercase">
                  {chats.find(c => c.id === activeCallId)?.userName || 'Guest User'}
                </p>
                <div className="flex gap-8">
                  <button onClick={(e) => { e.stopPropagation(); declineCall(); }} className="w-14 h-14 rounded-full bg-red-600 flex items-center justify-center hover:scale-105 transition-transform shadow-lg shadow-red-600/30">
                    <PhoneOff className="w-6 h-6" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); acceptCall(); }} className="w-14 h-14 rounded-full bg-emerald-500 flex items-center justify-center hover:scale-105 transition-transform shadow-lg shadow-emerald-500/30 animate-pulse">
                    <Phone className="w-6 h-6" />
                  </button>
                </div>
              </div>
            ) : callState === 'calling' || callState === 'ringing' ? (
              // Outgoing call screen for admin
              <div className="flex-1 flex flex-col items-center justify-center">
                <div className="w-32 h-32 rounded-full bg-indigo-600/20 flex items-center justify-center mb-8 animate-pulse relative">
                  <Phone className="w-12 h-12 text-indigo-500 relative z-10" />
                  <div className="absolute inset-0 rounded-full border-4 border-indigo-500/30 scale-125" />
                </div>
                <h2 className="text-3xl font-bold mb-1 font-sans tracking-tight">
                  {callState === 'calling' ? 'Calling User...' : 'Ringing...'}
                </h2>
                <p className="text-zinc-400 mb-2">
                  {callType === 'video' ? 'Initiating video connection...' : 'Awaiting answer...'}
                </p>
                <p className="text-emerald-400 font-mono tracking-wider text-sm mb-12 uppercase">
                  {chats.find(c => c.id === activeCallId)?.userName || 'Guest User'}
                </p>
                <button onClick={(e) => { e.stopPropagation(); declineCall(); }} className="w-14 h-14 rounded-full bg-red-600 flex items-center justify-center hover:scale-105 transition-transform shadow-lg shadow-red-600/30">
                  <PhoneOff className="w-6 h-6" />
                </button>
              </div>
            ) : (
              // Active Call screen
              <div className="flex-1 relative flex flex-col bg-zinc-950">
                {callType === 'video' ? (
                  <div className="flex-1 relative flex items-center justify-center bg-zinc-950">
                    {/* Remote Video Full Screen */}
                    <video 
                      ref={(el) => {
                        remoteVideoRef.current = el;
                        if (el && remoteStream) {
                          el.srcObject = remoteStream;
                        }
                      }} 
                      autoPlay 
                      playsInline 
                      className="w-full h-full object-cover rounded-3xl bg-zinc-900" 
                    />
                    
                    {/* Local Video Small */}
                    <div className="absolute top-8 right-8 w-32 h-48 bg-zinc-900 border-2 border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                      {isVideoOff ? (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-950 text-zinc-500 text-xs gap-2">
                          <VideoOff className="w-5 h-5 text-zinc-600" />
                          <span>Video Off</span>
                        </div>
                      ) : (
                        <video 
                          ref={(el) => {
                            localVideoRef.current = el;
                            if (el && localStream) {
                              el.srcObject = localStream;
                            }
                          }} 
                          autoPlay 
                          playsInline 
                          muted 
                          className="w-full h-full object-cover" 
                        />
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900">
                    <div className="w-32 h-32 rounded-full bg-indigo-600 flex items-center justify-center mb-8 shadow-xl">
                      <Phone className="w-12 h-12" />
                    </div>
                    <div className="text-2xl font-bold mb-1 font-sans tracking-tight">Support Call Active</div>
                    <div className="text-sm text-zinc-400 mb-4 capitalize">
                      Connected to {chats.find(c => c.id === activeCallId)?.userName || 'Guest'}
                    </div>
                    <div className="text-emerald-400 font-mono text-lg bg-emerald-950/40 px-4 py-1.5 rounded-full border border-emerald-900/30">{formatTime(callDuration)}</div>
                  </div>
                )}
                
                <AnimatePresence>
                  {showControls && (
                    <motion.div 
                      initial={{ y: 100, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: 100, opacity: 0 }}
                      onClick={e => e.stopPropagation()}
                      className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-xl px-8 py-4 rounded-full flex gap-6 items-center shadow-2xl border border-white/10 z-20"
                    >
                      <div className="text-white font-mono mr-4 text-sm font-semibold">{formatTime(callDuration)}</div>
                      
                      {/* Mute Mic Button */}
                      <button onClick={toggleMute} className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isMuted ? 'bg-white text-black' : 'bg-white/10 hover:bg-white/20'}`}>
                        {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                      </button>

                      {/* Video Toggle Button */}
                      {callType === 'video' && (
                        <button onClick={toggleVideo} className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isVideoOff ? 'bg-red-500 text-white' : 'bg-white/10 hover:bg-white/20'}`}>
                          {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                        </button>
                      )}

                      {/* Speaker Button */}
                      <button onClick={() => setIsSpeaker(!isSpeaker)} className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isSpeaker ? 'bg-white text-black' : 'bg-white/10 hover:bg-white/20'}`}>
                        <Volume2 className="w-5 h-5" />
                      </button>

                      {/* Hang Up Button */}
                      <button onClick={declineCall} className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition-colors shadow-lg shadow-red-600/30">
                        <PhoneOff className="w-5 h-5" />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ManageVGHelpline;
