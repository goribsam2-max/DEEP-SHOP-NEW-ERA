import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, User, Check, Loader2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useNotify } from '../Notifications';
import { GoogleIcon, AppleIcon, FacebookIcon } from './BrandIcons';

export interface SavedAccount {
  uid: string;
  email: string;
  password?: string;
  displayName: string;
  photoURL?: string;
  provider?: string;
  lastPasswordChange?: number | null;
}

interface AccountCenterPopupProps {
  isOpen: boolean;
  onClose: () => void;
  savedAccounts: SavedAccount[];
  currentUid?: string;
}

export function AccountCenterPopup({ isOpen, onClose, savedAccounts, currentUid }: AccountCenterPopupProps) {
  const navigate = useNavigate();
  const notify = useNotify();
  const [loadingUid, setLoadingUid] = useState<string | null>(null);
  const [requirePasswordUid, setRequirePasswordUid] = useState<string | null>(null);
  const [manualPassword, setManualPassword] = useState('');

  const getSavedAccounts = (): SavedAccount[] => {
     try {
       const str = localStorage.getItem("vibe_saved_accounts");
       return str ? JSON.parse(str) : [];
     } catch(e) {
       return [];
     }
  };

  const handleSelectAccount = async (account: SavedAccount) => {
      // If already logged in to this account, just close
      if (currentUid === account.uid) {
          onClose();
          return;
      }

      // We need to login
      if (!account.password || requirePasswordUid === account.uid) {
          // Check if user has entered password
          if (requirePasswordUid === account.uid) {
               if (!manualPassword) {
                   notify("Please enter the password", "error");
                   return;
               }
               
               setLoadingUid(account.uid);
               try {
                  const cred = await signInWithEmailAndPassword(auth, account.email, manualPassword);
                  // Update password in local storage
                  const allAccounts = getSavedAccounts();
                  const updated = allAccounts.map(a => a.uid === account.uid ? { ...a, password: manualPassword } : a);
                  localStorage.setItem("vibe_saved_accounts", JSON.stringify(updated));
                  
                  notify("Logged in successfully", "success");
                  onClose();
                  setRequirePasswordUid(null);
                  setManualPassword('');
                  navigate('/');
               } catch (e: any) {
                  notify(e.message || "Invalid password", "error");
               } finally {
                  setLoadingUid(null);
               }
               return;
          }

          setRequirePasswordUid(account.uid);
          return;
      }

      setLoadingUid(account.uid);
      try {
          await signInWithEmailAndPassword(auth, account.email, account.password);
          notify("Logged in successfully", "success");
          onClose();
          navigate('/');
      } catch (e: any) {
          // If password changed or invalid credential
          if (e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential' || e.message?.toLowerCase().includes('password')) {
              setRequirePasswordUid(account.uid);
          } else {
              notify(e.message || "Failed to login", "error");
          }
      } finally {
          setLoadingUid(null);
      }
  };

  const handleAddAccount = () => {
      onClose();
      // Since they want to add account, sign out first just in case
      auth.signOut();
      navigate('/auth-selector');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-end justify-center sm:items-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="w-full sm:max-w-md bg-white dark:bg-zinc-900 rounded-t-[32px] sm:rounded-[32px] overflow-hidden shadow-2xl flex flex-col"
          >
            <div className="p-6 pb-2 relative flex items-center justify-between">
               <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Choose Account</h2>
               <button onClick={onClose} className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
                  <X className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
               </button>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-[50vh]">
               {savedAccounts.length === 0 && (
                   <div className="text-center py-8 text-zinc-500">
                      No saved accounts found.
                   </div>
               )}
               <div className="space-y-3">
                   {savedAccounts.map((account) => {
                       const isCurrent = account.uid === currentUid;
                       const requiresPass = requirePasswordUid === account.uid;
                       const isLoading = loadingUid === account.uid;
                       
                       return (
                          <div 
                              key={account.uid}
                              className={`border ${isCurrent ? 'border-[#109E92] bg-[#109E92]/5' : 'border-zinc-200 dark:border-zinc-800'} rounded-2xl p-4 transition-all`}
                          >
                              <div 
                                onClick={() => !requiresPass && handleSelectAccount(account)} 
                                className={`flex items-center justify-between ${!requiresPass ? 'cursor-pointer' : ''}`}
                              >
                                  <div className="flex items-center space-x-4">
                                      <div className="w-12 h-12 relative rounded-full overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                                          {account.photoURL ? (
                                              <img src={account.photoURL} alt={account.displayName} className="w-full h-full object-cover" />
                                          ) : (
                                              <User className="w-6 h-6 text-zinc-400" />
                                          )}
                                          {account.provider === 'google' && (
                                            <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] flex items-center justify-center">
                                              <GoogleIcon className="w-6 h-6" />
                                            </div>
                                          )}
                                          {account.provider === 'facebook' && (
                                            <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] flex items-center justify-center">
                                              <FacebookIcon className="w-6 h-6" />
                                            </div>
                                          )}
                                          {account.provider === 'apple' && (
                                            <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] flex items-center justify-center">
                                              <AppleIcon className="w-6 h-6" />
                                            </div>
                                          )}
                                      </div>
                                      <div>
                                          <p className="font-bold text-zinc-900 dark:text-zinc-100 text-[15px]">{account.displayName}</p>
                                          <p className="text-xs text-zinc-500 truncate max-w-[160px] sm:max-w-[180px]">{(account.email.endsWith('@phone.deepshop.top') || account.email.endsWith('@phone.vibegadget.com')) ? account.email.split('@')[0] : account.email}</p>
                                      </div>
                                  </div>
                                  
                                  {isCurrent ? (
                                      <div className="w-8 h-8 rounded-full bg-[#109E92] flex items-center justify-center">
                                          <Check className="w-4 h-4 text-white" />
                                      </div>
                                  ) : (
                                      !requiresPass && (
                                          <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                                              {isLoading ? <Loader2 className="w-4 h-4 animate-spin text-zinc-500" /> : <ArrowRight className="w-4 h-4 text-zinc-500" />}
                                          </div>
                                      )
                                  )}
                              </div>

                              <AnimatePresence>
                               {requiresPass && (
                                    <motion.div 
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1, marginTop: 16 }}
                                        exit={{ height: 0, opacity: 0, marginTop: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="p-3 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-xl mb-3 text-xs text-red-600 dark:text-red-400">
                                            Password might have been changed {account.lastPasswordChange ? new Date(account.lastPasswordChange).toLocaleDateString() : 'recently'}. Please enter new password.
                                        </div>
                                        <div className="flex space-x-2">
                                            <input 
                                                type="password"
                                                autoFocus
                                                placeholder="Enter password"
                                                className="flex-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 text-sm outline-none focus:border-[#109E92]"
                                                value={manualPassword}
                                                onChange={(e) => setManualPassword(e.target.value)}
                                            />
                                            <button 
                                                onClick={() => handleSelectAccount(account)}
                                                disabled={isLoading || !manualPassword}
                                                className="bg-[#109E92] text-white px-4 rounded-xl text-sm font-semibold hover:bg-[#0D8A7D] flex items-center justify-center disabled:opacity-50"
                                            >
                                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Login"}
                                            </button>
                                        </div>
                                    </motion.div>
                               )}
                              </AnimatePresence>
                          </div>
                       )
                   })}
               </div>
               
               <button 
                  onClick={handleAddAccount}
                  className="w-full flex items-center justify-center space-x-2 p-4 mt-4 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 font-medium"
               >
                  <Plus className="w-5 h-5" />
                  <span>Add another account</span>
               </button>
               
               {currentUid && (
                 <button 
                    onClick={() => {
                       auth.signOut();
                       localStorage.removeItem("f_cart");
                       onClose();
                       navigate("/");
                    }}
                    className="w-full flex items-center justify-center space-x-2 p-4 mt-2 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors rounded-2xl text-red-600 dark:text-red-400 font-medium"
                 >
                    <span>Log out</span>
                 </button>
               )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
