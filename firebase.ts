
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBYDcBuYZEH38mwWoCqTmyImGIYqlXteZ4",
  authDomain: "deep-shop-bd.firebaseapp.com",
  projectId: "deep-shop-bd",
  storageBucket: "deep-shop-bd.firebasestorage.app",
  messagingSenderId: "771344063997",
  appId: "1:771344063997:web:f06c63b007a7369bf94d94",
  measurementId: "G-K1LQBDQ85E"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Use standard Firestore instance to avoid IndexedDB persistent local cache crashes in sandbox iframes
export const db = getFirestore(app);

import { getMessaging, isSupported } from "firebase/messaging";
export const messaging = async () => {
  const supported = await isSupported();
  if (supported) {
    return getMessaging(app);
  }
  return null;
};
