import React, { useState, useEffect, useRef } from 'react';
import { Users, Clock, Share2 } from 'lucide-react';
import { useNotify } from './Notifications';
import { doc, getDoc, setDoc, onSnapshot, updateDoc, increment, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase';

export const LiveGroupBuy = ({ product, onGroupFull }: { product: any, onGroupFull: () => void }) => {
  const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes
  const [joinedCount, setJoinedCount] = useState(1);
  const [hasJoined, setHasJoined] = useState(false);
  const totalNeeded = 3;
  const notify = useNotify();
  const myIdRef = useRef(Math.random().toString(36).substring(7));

  useEffect(() => {
    if (!product?.id) return;
    const docRef = doc(db, 'group_buys', product.id);
    
    const initDoc = async () => {
      const snap = await getDoc(docRef);
      if (!snap.exists()) {
        await setDoc(docRef, { joined: 1, users: [] });
      }
    };
    initDoc();

    const unsub = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setJoinedCount(data.joined || 1);
        if (data.users && data.users.includes(myIdRef.current)) {
          setHasJoined(true);
        }
      }
    });

    return () => unsub();
  }, [product?.id]);

  useEffect(() => {
    const storageKey = `groupbuy_joined_${product.id}`;
    if (localStorage.getItem(storageKey)) {
      setHasJoined(true);
    }
    
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get('groupbuy') && !localStorage.getItem(storageKey)) {
      // Auto join if coming from link and haven't joined yet
      handleJoinClick(true);
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [product?.id]);

  useEffect(() => {
    // If we have joined and the group is full, automatically add to cart (once)
    if (hasJoined && joinedCount >= totalNeeded) {
      const addedKey = `groupbuy_added_${product.id}`;
      if (!localStorage.getItem(addedKey)) {
        localStorage.setItem(addedKey, 'true');
        onGroupFull();
      }
    }
  }, [hasJoined, joinedCount, product?.id, onGroupFull]);

  const handleJoinClick = async (fromLink = false) => {
    if (!hasJoined && joinedCount < totalNeeded) {
      setHasJoined(true);
      localStorage.setItem(`groupbuy_joined_${product.id}`, 'true');
      
      try {
        const docRef = doc(db, 'group_buys', product.id);
        await setDoc(docRef, {
          joined: increment(1),
          users: arrayUnion(myIdRef.current)
        }, { merge: true });
        
        if (fromLink) {
          notify('You joined a Group Buy from a link!', 'success');
        } else {
          notify('You joined the group buy! Waiting for others...', 'success');
        }
      } catch (err) {
        console.error("Failed to join group buy", err);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const discountAmount = product.price * 0.02; // 2% discount for group buy
  const groupPrice = product.price - discountAmount;

  const handleShare = () => {
    const url = window.location.origin + window.location.pathname + '?groupbuy=true';
    navigator.clipboard.writeText(url);
    notify('Group Buy link copied! Share with friends.', 'success');
  };

  return (
    <div className="bg-gradient-to-r from-[#1cdb5e]/10 to-[#1cdb5e]/5 rounded-[2rem] border border-[#1cdb5e]/20 p-5 mb-8 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#1cdb5e]/10 rounded-full blur-3xl -mr-10 -mt-10" />
      
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div>
          <div className="flex items-center gap-2 text-[#1cdb5e] font-bold text-xs uppercase tracking-widest mb-1">
            Live Group Buy
          </div>
          <h3 className="text-lg font-black text-zinc-900 dark:text-white">Buy together, save more!</h3>
        </div>
        <div className="bg-white dark:bg-zinc-900 text-red-500 font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm text-xs">
          <Clock className="w-3.5 h-3.5" /> {formatTime(timeLeft)}
        </div>
      </div>

      <div className="bg-white/60 dark:bg-black/40 backdrop-blur-md rounded-2xl p-4 mb-4 border border-white/20 dark:border-zinc-800 relative z-10">
        <div className="flex items-end justify-between mb-3">
          <div>
            <p className="text-xs text-zinc-500 font-bold uppercase tracking-wide">Group Price</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-[#1cdb5e]">৳{groupPrice.toLocaleString()}</span>
              <span className="text-sm text-zinc-400 line-through font-semibold">৳{product.price}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Buyers needed</p>
            <div className="flex gap-1 justify-end">
              {[...Array(totalNeeded)].map((_, i) => (
                <div key={i} className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${i < joinedCount ? 'bg-[#1cdb5e] text-white' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400'}`}>
                  {i < joinedCount ? '✓' : '?'}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-2 mb-2 overflow-hidden">
          <div className="bg-[#1cdb5e] h-full transition-all" style={{ width: `${(Math.min(joinedCount, totalNeeded) / totalNeeded) * 100}%` }} />
        </div>
        <p className="text-xs text-zinc-500 text-center font-medium">
          {joinedCount >= totalNeeded 
            ? 'Group Buy is full! Deal unlocked.' 
            : `Only ${totalNeeded - joinedCount} more buyer${totalNeeded - joinedCount > 1 ? 's' : ''} needed to activate deal!`
          }
        </p>
      </div>

      <div className="flex gap-2 relative z-10">
        <button 
          onClick={handleShare}
          className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-sm"
        >
          <Share2 className="w-4 h-4" /> Share
        </button>
        <button 
          onClick={() => handleJoinClick(false)}
          disabled={hasJoined || joinedCount >= totalNeeded}
          className={`flex-1 font-bold rounded-xl flex items-center justify-center gap-2 transition-transform shadow-xl shadow-zinc-900/10 ${hasJoined || joinedCount >= totalNeeded ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed' : 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:scale-[1.02]'}`}
        >
          <Users className="w-4 h-4" /> 
          {joinedCount >= totalNeeded 
            ? (hasJoined ? 'Group Full' : 'Group Full') 
            : (hasJoined ? 'Joined' : 'Join Group Buy')
          }
        </button>
      </div>
    </div>
  );
};
