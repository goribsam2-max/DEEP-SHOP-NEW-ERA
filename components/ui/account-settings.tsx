import React, { useEffect, useState } from 'react';
import { cn, validateInput } from '@/lib/utils';
import { auth, db } from '@/firebase';
import { signOut, deleteUser, updateProfile } from 'firebase/auth';
import { doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { useNotify, useConfirm } from '@/components/Notifications';
import { Mail, User, Lock, Bell, Shield, Moon, LogOut, Trash2, ChevronRight, X } from 'lucide-react';
import { useTheme } from '@/components/ThemeContext';

export function AccountSettings() {
  const navigate = useNavigate();
  const notify = useNotify();
  const confirm = useConfirm();
  const { isDark, toggleTheme } = useTheme();

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [secondaryEmail, setSecondaryEmail] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  
  const [showEditName, setShowEditName] = useState(false);
  const [editNameValue, setEditNameValue] = useState("");

  const [showAddContact, setShowAddContact] = useState(false);
  const [contactTypeToAdd, setContactTypeToAdd] = useState<'email' | 'phone'>('email');
  const [contactInputValue, setContactInputValue] = useState('');

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      setEmail(user.email || '');
      setName(user.displayName || '');
      
      // Fetch username from DB
      import('firebase/firestore').then(({ doc, getDoc }) => {
        getDoc(doc(db, "users", user.uid)).then((d) => {
          if (d.exists()) {
            setUsername(d.data().username || '');
            setPhoneNumber(d.data().phoneNumber || '');
            setSecondaryEmail(d.data().secondaryEmail || '');
          }
        });
      });
    }
    const isGranted = typeof window !== "undefined" && 'Notification' in window && Notification.permission === 'granted';
    const isEnabled = isGranted && localStorage.getItem("vibe_push_enabled") !== "false";
    setPushEnabled(isEnabled);
  }, []);

  const handleUpdateContact = async () => {
     if (!contactInputValue) return;
     const user = auth.currentUser;
     if (!user) return;
     
     const validationError = validateInput(contactInputValue, contactTypeToAdd);
     if (validationError) {
        return notify(validationError, "error");
     }

     if (contactTypeToAdd === 'email') {
        try {
           const res = await fetch('/api/lookup-auth-email', {
              method: 'POST',
              headers: {'Content-Type':'application/json'},
              body: JSON.stringify({ identifier: contactInputValue })
           });
           const data = await res.json();
           if (data.authEmail) {
              return notify("This email is already in use by another account.", "error");
           }
        } catch(e){}
        
        try {
           await updateDoc(doc(db, "users", user.uid), { secondaryEmail: contactInputValue });
           setSecondaryEmail(contactInputValue);
           setShowAddContact(false);
           setContactInputValue('');
           notify("Email added successfully", "success");
        } catch(e) {
           notify("Failed to add email", "error");
        }
     } else {
        // phone
        const clean = contactInputValue.replace(/[-.\s]/g, '');
        let possiblePhone = clean;
        if (!clean.startsWith('+')) {
           possiblePhone = clean.startsWith('880') ? `+${clean}` : (clean.startsWith('01') ? `+880${clean.substring(1)}` : `+${clean}`);
        }
        
        try {
           const res = await fetch('/api/lookup-auth-email', {
              method: 'POST',
              headers: {'Content-Type':'application/json'},
              body: JSON.stringify({ identifier: possiblePhone })
           });
           const data = await res.json();
           if (data.authEmail) {
              return notify("This phone number is already registered.", "error");
           }
        } catch(e){}

        try {
           await updateDoc(doc(db, "users", user.uid), { phoneNumber: possiblePhone });
           setPhoneNumber(possiblePhone);
           setShowAddContact(false);
           setContactInputValue('');
           notify("Phone added successfully", "success");
        } catch(e) {
           notify("Failed to add phone", "error");
        }
     }
  };

  const handleUpdateName = async () => {
    if (!editNameValue || editNameValue.trim() === name) return;
    
    try {
      const user = auth.currentUser;
      if (!user) return;
      await updateProfile(user, { displayName: editNameValue.trim() });
      await updateDoc(doc(db, "users", user.uid), { displayName: editNameValue.trim() });
      setName(editNameValue.trim());
      setShowEditName(false);
      notify("Username updated successfully", "success");
    } catch (e: any) {
      notify(e.message || "Failed to update name", "error");
    }
  };

  const togglePush = async () => {
    if (!('serviceWorker' in navigator) || !('Notification' in window)) {
      notify("Push notifications not supported on this browser", "info");
      return;
    }

    if (!pushEnabled) {
      const { subscribeToWebPush } = await import('@/lib/push');
      const result: any = await subscribeToWebPush();
      if ((result && !result.error) || Notification.permission === 'granted') {
         localStorage.setItem("vibe_push_enabled", "true");
         setPushEnabled(true);
         notify("Push notifications enabled", "success");
      } else {
         notify(result?.error || "Permission denied. Try opening in a new tab.", "error");
      }
    } else {
      const { unsubscribeFromWebPush } = await import('@/lib/push');
      await unsubscribeFromWebPush();
      localStorage.setItem("vibe_push_enabled", "false");
      setPushEnabled(false);
      notify("Push notifications disabled", "info");
    }
  };

  const handleLogout = async () => {
    window.dispatchEvent(new CustomEvent('openAccountCenter'));
  };

  const handleDeleteAccount = () => {
    confirm({
      title: "Wait, are you sure?",
      message: "Deleting your account is permanent. All your order history and profile data will be erased from our database.",
      confirmText: "Permanently Delete",
      cancelText: "Keep Account",
      onConfirm: async () => {
        const user = auth.currentUser;
        if (!user) return;

        setIsDeleting(true);
        try {
          await deleteDoc(doc(db, "users", user.uid));
          await deleteUser(user);
          notify("Account permanently deleted", "info");
          navigate("/auth-selector");
        } catch (err: any) {
          if (err.code === "auth/requires-recent-login") {
            notify("Session expired. Please re-login to delete account.", "error");
            await auth.signOut();
            navigate("/signin");
          } else {
            notify("Process failed", "error");
          }
        } finally {
          setIsDeleting(false);
        }
      }
    });
  };

	return (
		<div className="min-h-screen bg-[#F0F2F5] dark:bg-zinc-950 font-sans pb-10 text-zinc-900 dark:text-zinc-100 relative">
      {/* Edit Name Modal */}
      {showEditName && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
           <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-[28px] p-6 shadow-2xl relative">
              <button onClick={() => setShowEditName(false)} className="absolute top-4 right-4 p-2 bg-zinc-100 dark:bg-zinc-800 rounded-full">
                 <X className="w-5 h-5 text-zinc-500" />
              </button>
              <h3 className="text-xl font-bold mb-4">Edit Username</h3>
              <input 
                 autoFocus
                 type="text"
                 className="w-full bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl p-4 text-zinc-900 dark:text-zinc-100 font-medium focus:ring-2 focus:ring-[#109E92] outline-none transition-all placeholder:text-zinc-400 mb-6"
                 value={editNameValue}
                 placeholder="Enter new username"
                 onChange={e => setEditNameValue(e.target.value)}
              />
              <button 
                 onClick={handleUpdateName}
                 disabled={!editNameValue.trim() || editNameValue.trim() === name}
                 className="w-full bg-gradient-to-r from-[#109E92] to-[#0D8A7D] text-white py-4 rounded-xl font-bold disabled:opacity-50 active:scale-[0.98] transition-transform"
              >
                 Save Changes
              </button>
           </div>
        </div>
      )}

      {showAddContact && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
           <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-[28px] p-6 shadow-2xl relative">
              <button onClick={() => setShowAddContact(false)} className="absolute top-4 right-4 p-2 bg-zinc-100 dark:bg-zinc-800 rounded-full">
                 <X className="w-5 h-5 text-zinc-500" />
              </button>
              <h3 className="text-xl font-bold mb-4">Add {contactTypeToAdd === 'email' ? 'Email' : 'Phone'}</h3>
              <input 
                 autoFocus
                 type={contactTypeToAdd === 'email' ? "email" : "tel"}
                 className="w-full bg-zinc-100 dark:bg-zinc-800 border-none rounded-xl p-4 text-zinc-900 dark:text-zinc-100 font-medium focus:ring-2 focus:ring-[#109E92] outline-none transition-all placeholder:text-zinc-400 mb-6"
                 value={contactInputValue}
                 placeholder={contactTypeToAdd === 'email' ? "Enter your email" : "+8801..."}
                 onChange={e => setContactInputValue(e.target.value)}
              />
              <button 
                 onClick={handleUpdateContact}
                 disabled={!contactInputValue.trim()}
                 className="w-full bg-gradient-to-r from-[#109E92] to-[#0D8A7D] text-white py-4 rounded-xl font-bold disabled:opacity-50 active:scale-[0.98] transition-transform"
              >
                 Add {contactTypeToAdd === 'email' ? 'Email' : 'Phone'}
              </button>
           </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-center px-6 py-6 sticky top-0 z-50 bg-[#F0F2F5]/80 dark:bg-zinc-950/80 backdrop-blur-md">
        <h1 className="text-lg font-bold">Settings</h1>
      </div>

      <div className="px-5 space-y-5 max-w-md mx-auto">
        
        {/* Main Settings Card */}
        {(() => {
           const isPhoneAccount = email.endsWith('@phone.deepshop.top') || email.endsWith('@phone.vibegadget.com');
           return (
        <div className="bg-white dark:bg-zinc-900 rounded-[28px] overflow-hidden shadow-sm p-2">
            {isPhoneAccount ? (
               <>
                 <SettingItem icon={<User className="w-5 h-5 text-zinc-500" strokeWidth={2}/>} label="Phone Number" subLabel={"+" + email.split("@")[0]} onClick={() => {}} />
                 <SettingItem 
                    icon={<Mail className="w-5 h-5 text-zinc-500" strokeWidth={2}/>} 
                    label="Email" 
                    subLabel={secondaryEmail || "Not set. Add an email to login."} 
                    onClick={() => { if (!secondaryEmail) { setContactTypeToAdd('email'); setContactInputValue(''); setShowAddContact(true); } }} 
                 />
               </>
            ) : (
               <>
                 <SettingItem icon={<Mail className="w-5 h-5 text-zinc-500" strokeWidth={2}/>} label="Email" subLabel={email} onClick={() => {}} />
                 <SettingItem 
                    icon={<User className="w-5 h-5 text-zinc-500" strokeWidth={2}/>} 
                    label="Phone Number" 
                    subLabel={phoneNumber || "Not set. Add a phone number."} 
                    onClick={() => { if (!phoneNumber) { setContactTypeToAdd('phone'); setContactInputValue(''); setShowAddContact(true); } }} 
                 />
               </>
            )}
            <SettingItem icon={<User className="w-5 h-5 text-zinc-500" strokeWidth={2}/>} label="Name" subLabel={name} onClick={() => { setEditNameValue(name); setShowEditName(true); }} />
            <SettingItem icon={<User className="w-5 h-5 text-zinc-500" strokeWidth={2}/>} label="Username" subLabel={username ? `@${username}` : "Not set"} onClick={() => navigate('/profile/edit')} />
            <SettingItem icon={<Lock className="w-5 h-5 text-zinc-500" strokeWidth={2}/>} label="Password" onClick={() => navigate('/settings/password')} />
            <SettingItem icon={<Bell className="w-5 h-5 text-zinc-500" strokeWidth={2}/>} label="Notifications" onClick={togglePush} rightElement={<Switch isChecked={pushEnabled} />} />
            <SettingItem icon={<Shield className="w-5 h-5 text-zinc-500" strokeWidth={2}/>} label="Privacy Policy" onClick={() => navigate('/privacy')} isLast />
        </div>
           );
        })()}

        {/* Preferences */}
        <div className="bg-white dark:bg-zinc-900 rounded-[28px] overflow-hidden shadow-sm p-2">
            <SettingItem icon={<Moon className="w-5 h-5 text-zinc-500" strokeWidth={2}/>} label="Dark Mode" onClick={toggleTheme} rightElement={<Switch isChecked={isDark} />} />
            <SettingItem icon={<LogOut className="w-5 h-5 text-zinc-500" strokeWidth={2}/>} label="Log Out" onClick={handleLogout} />
            <SettingItem icon={<Trash2 className="w-5 h-5 text-red-500" strokeWidth={2}/>} label="Delete Account" onClick={handleDeleteAccount} isLast textColor="text-red-500" />
        </div>

      </div>
		</div>
	);
}

function SettingItem({ icon, label, subLabel, onClick, isLast = false, rightElement, textColor }: { icon: React.ReactNode, label: string, subLabel?: string, onClick: (e?: React.MouseEvent) => void, isLast?: boolean, rightElement?: React.ReactNode, textColor?: string }) {
    return (
        <div 
            onClick={onClick}
            className={cn(
                "flex items-center justify-between p-4 cursor-pointer",
                !isLast && "border-b border-zinc-100 dark:border-zinc-800/50"
            )}
        >
            <div className="flex items-center space-x-4">
                {icon}
                <div className="flex flex-col">
                  <span className={cn("font-medium text-[15px]", textColor || "text-zinc-800 dark:text-zinc-200")}>{label}</span>
                  {subLabel && <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">{subLabel}</span>}
                </div>
            </div>
            {rightElement || <ChevronRight className="w-5 h-5 text-zinc-400" strokeWidth={2} />}
        </div>
    )
}

function Switch({ isChecked }: { isChecked: boolean }) {
    return (
        <div className={cn(
            "w-10 h-6 flex items-center rounded-full p-1 transition-colors duration-300",
            isChecked ? "bg-[#109E92]" : "bg-zinc-300 dark:bg-zinc-700"
        )}>
            <div className={cn(
                "w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300",
                isChecked ? "translate-x-4" : "translate-x-0"
            )} />
        </div>
    )
}

