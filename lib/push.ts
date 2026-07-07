import { auth, db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';

export async function unsubscribeFromWebPush() {
    try {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            return true;
        }
        const registration = await navigator.serviceWorker.ready;
        if (!registration.pushManager) return true;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
            await subscription.unsubscribe();
        }
        return true;
    } catch(e) {
        console.error('Web Push unsubscribe error', e);
        return false;
    }
}

export async function subscribeToWebPush() {
    try {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            console.log("Web Push not supported");
            return { error: "Web Push is not supported by your browser" };
        }

        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return { error: "Notification permission was denied. Please allow it in browser settings." };

        const res = await fetch('/api/web-push/public-key');
        if (!res.ok) {
           console.error("Failed to fetch public key");
           return { error: "Failed to connect to push server" };
        }
        const { publicKey } = await res.json();

        if (publicKey) {
            let registration = await navigator.serviceWorker.getRegistration();
            if (!registration) {
                 try {
                     registration = await navigator.serviceWorker.register('/custom-sw.js');
                 } catch (e: any) {
                     console.error("Service worker registration failed", e);
                     return { error: "Service worker registration failed: " + e.message };
                 }
            }
            
            registration = await navigator.serviceWorker.ready;

            if (!registration || !registration.pushManager) {
                 console.error("No push manager available");
                 return { error: "Push manager is not available in your browser" };
            }
            
            // Check if existing subscription matches current public key
            const existingSub = await registration.pushManager.getSubscription();
            
            const urlB64ToUint8Array = (base64String: string) => {
              const padding = '='.repeat((4 - base64String.length % 4) % 4);
              const base64 = (base64String + padding)
                .replace(/\-/g, '+')
                .replace(/_/g, '/');
              const rawData = window.atob(base64);
              const outputArray = new Uint8Array(rawData.length);
              for (let i = 0; i < rawData.length; ++i) {
                outputArray[i] = rawData.charCodeAt(i);
              }
              return outputArray;
            };

            let subscription = existingSub;
            
            if (existingSub) {
                const currentKey = existingSub.options.applicationServerKey;
                const newKey = urlB64ToUint8Array(publicKey);
                
                // Compare keys (rough comparison by length or first few bytes)
                // If they don't match, we must unsubscribe
                let match = true;
                if (currentKey && currentKey.byteLength === newKey.byteLength) {
                    const currArr = new Uint8Array(currentKey);
                    for (let i=0; i<5; i++) {
                       if (currArr[i] !== newKey[i]) match = false;
                    }
                } else {
                    match = false;
                }
                
                if (!match) {
                    await existingSub.unsubscribe();
                    subscription = null;
                }
            }

            if (!subscription) {
               subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlB64ToUint8Array(publicKey)
            });
            }

            const uid = auth.currentUser?.uid;
            
            // Save subscription to backend using API to avoid permission issues
            try {
                await fetch('/api/web-push/subscribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ subscription, uid })
                });
            } catch (err) {
                console.error("Failed to save subscription to API", err);
            }
            
            if (uid) {
                try {
                    await updateDoc(doc(db, "users", uid), {
                        webPushSub: JSON.parse(JSON.stringify(subscription))
                    });
                } catch(e) {
                    console.error("Failed to save to users doc", e);
                }
            }
            
            return subscription;
        }
    } catch(e: any) {
        console.error('Web Push setup error', e);
        return { error: e.message || "Failed to subscribe" };
    }
    return false;
}
