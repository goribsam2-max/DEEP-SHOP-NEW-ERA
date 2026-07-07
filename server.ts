import express from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer } from "vite";
import admin from "firebase-admin";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import webpush from "web-push";

try {
  if (!admin.apps?.length) {
    if (
      fs.existsSync(
        path.resolve(process.cwd(), "firebase-service-account.json"),
      )
    ) {
      const serviceAccount = JSON.parse(
        fs.readFileSync(
          path.resolve(process.cwd(), "firebase-service-account.json"),
          "utf8",
        ),
      );
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } else {
      console.warn("Firebase Admin: No credentials found. Admin SDK not initialized.");
    }
  }
} catch (e) {
  console.log("Firebase Admin init error:", e);
}

// Global VAPID state
let vapidPublicKey = process.env.VAPID_PUBLIC_KEY || "";
let vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || "";

async function initializeVapid() {
    try {
        if (!vapidPublicKey || !vapidPrivateKey) {
            let keysToUse: any = null;
            if (admin.apps?.length) {
                try {
                    const docSnap = await admin.firestore().collection("settings").doc("vapid_keys").get();
                    if (docSnap.exists) {
                        keysToUse = docSnap.data();
                    } else {
                        keysToUse = webpush.generateVAPIDKeys();
                        await admin.firestore().collection("settings").doc("vapid_keys").set(keysToUse);
                    }
                } catch (err) {
                    console.error("Firebase VAPID fetch error:", err);
                }
            }
            
            if (!keysToUse) {
                const vapidPath = path.resolve(process.cwd(), "vapid.json");
                if (fs.existsSync(vapidPath)) {
                    keysToUse = JSON.parse(fs.readFileSync(vapidPath, "utf-8"));
                } else {
                    keysToUse = webpush.generateVAPIDKeys();
                    try {
                        fs.writeFileSync(vapidPath, JSON.stringify(keysToUse, null, 2), "utf-8");
                    } catch(e) {}
                }
            }

            vapidPublicKey = keysToUse.publicKey;
            vapidPrivateKey = keysToUse.privateKey;
        }
        if (vapidPublicKey && vapidPrivateKey) {
            webpush.setVapidDetails(
              'mailto:deepshop@example.com',
              vapidPublicKey,
              vapidPrivateKey
            );
            console.log("VAPID Keys Initialized.");
        }
    } catch(e) {
        console.error("VAPID Init Error", e);
    }
}

export const app = express();
let vapidInitialized = false;

app.use(async (req, res, next) => {
    if (!vapidInitialized && !req.path.startsWith('/assets')) {
        await initializeVapid();
        vapidInitialized = true;
    }
    next();
});


    const isProd = process.env.NODE_ENV === "production" || process.env.VERCEL;

  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  app.get("/api/web-push/public-key", (req, res) => {
    res.json({ publicKey: vapidPublicKey });
  });

  
  app.post("/api/send-push-admin", express.json(), async (req, res) => {
    try {
      const { title, body, link } = req.body;
      let subscriptions = [];
      
      if (admin.apps?.length) {
         try {
             // 1. Get all admin uids
             const usersSnap = await admin.firestore().collection("users").where("role", "in", ["admin", "super_admin"]).get();
             const adminUids = usersSnap.docs.map(doc => doc.id);
             
             if (adminUids.length > 0) {
                 // 2. Get subscriptions for those uids
                 // Since 'in' allows up to 10, we can do it if admins <= 10, but better to fetch all and filter in memory if many admins
                 const subSnap = await admin.firestore().collection("web_push_subscriptions").get();
                 const adminSubs = subSnap.docs
                    .filter(doc => adminUids.includes(doc.data().uid))
                    .map(doc => doc.data().subscription)
                    .filter(Boolean);
                 subscriptions = adminSubs;
             }
         } catch(err) {
             console.error("Failed to fetch admin web_push_subscriptions", err);
         }
      }
      
      subscriptions = Array.from(new Map(subscriptions.map((s) => [s.endpoint, s])).values());
      
      if (subscriptions.length === 0) {
        return res.status(200).json({ message: "No admin subscriptions found" });
      }

      let successCount = 0;
      
      const payload = JSON.stringify({
         title: title,
         body: body,
         icon: "/favicon.png",
         data: { url: link || "/admin/vg-helpline" }
      });

      const promises = subscriptions.map((sub) =>
          webpush.sendNotification(sub, payload).catch((e) => {
              console.error("Web push to admin failed:", e);
              return null;
          })
      );
      
      const results = await Promise.all(promises);
      successCount = results.filter(r => r !== null).length;

      res.status(200).json({ success: true, count: successCount });
    } catch (error) {
      console.error("Error sending admin push:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/send-push-all", express.json(), async (req, res) => {
    try {
      const { title, body, image, link, fcmTokens = [] } = req.body;
      let { subscriptions = [] } = req.body;
      
      // Fetch web push subscriptions from firestore (Admin SDK bypasses rules)
      let loadedFromFirestore = false;
      if (admin.apps?.length) {
         try {
             const subSnap = await admin.firestore().collection("web_push_subscriptions").get();
             const dbSubs = subSnap.docs.map((doc: any) => doc.data().subscription).filter(Boolean);
             subscriptions = [...subscriptions, ...dbSubs];
             loadedFromFirestore = true;
         } catch(err) {
             console.error("Failed to fetch web_push_subscriptions", err);
         }
      }
      
      if (!loadedFromFirestore) {
         const subsPath = path.resolve(process.cwd(), "web_push_subscriptions.json");
         if (fs.existsSync(subsPath)) {
             try {
                 const subs = JSON.parse(fs.readFileSync(subsPath, "utf-8"));
                 const fileSubs = Object.values(subs).map((s: any) => s.subscription).filter(Boolean);
                 subscriptions = [...subscriptions, ...fileSubs];
             } catch(e) {}
         }
      }
      subscriptions = Array.from(new Map(subscriptions.map((s: any) => [s.endpoint, s])).values());
      
      let successCount = 0;

      if (fcmTokens.length === 0 && subscriptions.length === 0) {
        return res.status(400).json({ error: "No users subscribed to push notifications" });
      }

      // 1. FCM Tokens (Legacy Native or other methods) - requires Admin SDK
      if (fcmTokens.length > 0 && admin.apps?.length) {
          const message: any = {
            notification: {
              title,
              body,
              ...(image && { image }),
            },
            webpush: {
              fcmOptions: {
                link: link || "/",
              },
            },
            tokens: [],
          };
    
          for (let i = 0; i < fcmTokens.length; i += 500) {
            message.tokens = fcmTokens.slice(i, i + 500);
            try {
               await getMessaging().sendEachForMulticast(message);
               successCount += message.tokens.length;
            } catch(e) { console.error('FCM Error', e); }
          }
      }

      // 2. Web Push Subscriptions
      if (vapidPublicKey && vapidPrivateKey && subscriptions.length > 0) {
          const payload = JSON.stringify({
              title,
              body,
              icon: 'https://vibe-gadget.vercel.app/apple-touch-icon.png',
              image: image || undefined,
              url: link || '/'
          });

          const notificationPromises = subscriptions.map(async (subscription: any) => {
              try {
                  await webpush.sendNotification(subscription, payload);
                  successCount++;
              } catch (error: any) {
                  if (error.statusCode === 410 || error.statusCode === 404 || error.statusCode === 401 || error.statusCode === 400 || error.statusCode === 403) {
                     // Subscription expired or unsubscribed handled via frontend
                  } else {
                     console.error('Web push error:', error.statusCode, error.body || error);
                  }
              }
          });

          await Promise.all(notificationPromises);
      }

      if (successCount === 0 && fcmTokens.length === 0 && subscriptions.length === 0) {
         return res.status(400).json({ error: "No target tokens or subscriptions provided." });
      }

      res.json({ success: true, tokensCount: successCount });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: String(e.message || e) });
    }
  });

  app.post("/api/web-push/subscribe", express.json(), async (req, res) => {
    try {
        const { subscription, uid } = req.body;
        if (!subscription) return res.status(400).json({ error: "Missing subscription" });
        
        const endpointHash = Buffer.from(subscription.endpoint).toString('base64').replace(/[^a-zA-Z0-9]/g, '');
        
        let savedToFirestore = false;
        if (admin.apps?.length) {
           try {
              await admin.firestore().collection("web_push_subscriptions").doc(endpointHash).set({
                  subscription,
                  uid: uid || null,
                  createdAt: admin.firestore.FieldValue.serverTimestamp()
              });
              savedToFirestore = true;
           } catch(err) {
              console.warn("Failed to save to Firestore web_push_subscriptions, using file fallback:", err.message || err);
           }
        }
        
        if (!savedToFirestore) {
           const subsPath = path.resolve(process.cwd(), "web_push_subscriptions.json");
           let subs: any = {};
           if (fs.existsSync(subsPath)) {
               try { subs = JSON.parse(fs.readFileSync(subsPath, "utf-8")); } catch(e) {}
           }
           subs[endpointHash] = { subscription, uid: uid || null, createdAt: Date.now() };
           fs.writeFileSync(subsPath, JSON.stringify(subs, null, 2));
        }

        res.json({ success: true });
    } catch(e) {
        console.error("Save subscription error:", e);
        res.status(500).json({ error: "Failed" });
    }
  });

  app.post("/api/send-push-user", express.json(), async (req, res) => {
    try {
      const { userId, title, body, link } = req.body;
      if (!userId) return res.status(400).json({ error: "Missing userId" });
      
      let subscriptions = [];
      if (admin.apps?.length) {
         try {
             const subSnap = await admin.firestore().collection("web_push_subscriptions").where("uid", "==", userId).get();
             subscriptions = subSnap.docs.map(doc => doc.data().subscription).filter(Boolean);
         } catch(err) {
             console.error("Failed to fetch user web_push_subscriptions", err);
         }
      }
      
      if (subscriptions.length === 0) {
        return res.status(200).json({ message: "No subscriptions found for user" });
      }
      
      const payload = JSON.stringify({
         title,
         body,
         icon: "/favicon.png",
         data: { url: link || "/help-center" }
      });

      const promises = subscriptions.map((sub) =>
          webpush.sendNotification(sub, payload).catch((e) => {
              console.error("Web push to user failed:", e);
              return null;
          })
      );
      
      const results = await Promise.all(promises);
      const successCount = results.filter(r => r !== null).length;
      res.json({ success: true, count: successCount });
    } catch (error: any) {
      console.error("Error sending user push:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/send-welcome-push", express.json(), async (req, res) => {
    try {
        const { subscription } = req.body;
        if (!subscription) return res.status(400).json({ error: "No subscription" });

        if (vapidPublicKey && vapidPrivateKey) {
            const payload = JSON.stringify({
                title: '🎉 Welcome to DEEP SHOP!',
                body: 'Thank you for enabling notifications. Get ready for exclusive deals, flash sales, and mystery box drops! 🎁',
                icon: '/favicon.png',
                image: '/favicon.png',
                url: '/flash-sale'
            });

            await webpush.sendNotification(subscription, payload);
            return res.json({ success: true });
        }
        res.status(500).json({ error: "VAPID keys not configured" });
    } catch(e) {
        if (e.statusCode && [400, 401, 403, 404, 410].includes(e.statusCode)) {
            // ignore
        } else {
            console.error("Welcome push error:", e.statusCode, e.body || e);
        }
        res.status(500).json({ error: "Failed" });
    }
  });

  app.post("/api/notify-telegram", express.json(), async (req, res) => {
    try {
      const { userName, message } = req.body;

      const botToken = "8571639361:AAEuplHuF4mh6rkaCCWoC-D_c57Iho7rM8YY";
      const chatId = "5494141897";

      if (botToken && chatId) {
        const text = `<b>💬 New Chat Message</b>\n━━━━━━━━━━━━━━━━━━\n<b>👤 From:</b> ${userName}\n<b>📝 Message:</b>\n${message}\n━━━━━━━━━━━━━━━━━━\n<i>Reply from admin panel</i>`;
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
        });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Telegram notify err", error);
      res.status(500).json({ error: "Failed" });
    }
  });

  app.post("/api/admin/change-password", express.json(), async (req, res) => {
    try {
      if (!admin.apps?.length) {
        return res
          .status(500)
          .json({
            error:
              "Firebase Admin not initialized. Please add FIREBASE_SERVICE_ACCOUNT to your environment variables.",
          });
      }
      const { uid, newPassword, adminToken } = req.body;

      if (!adminToken) return res.status(401).json({ error: "Unauthorized" });

      const decodedToken = await admin.auth().verifyIdToken(adminToken);
      const adminDoc = await getFirestore()
        .collection("users")
        .doc(decodedToken.uid)
        .get();
      if (
        !adminDoc.exists ||
        (adminDoc.data()?.role !== "admin" &&
          adminDoc.data()?.role !== "staff" &&
          decodedToken.email !== "admin@vibe.shop")
      ) {
        return res
          .status(403)
          .json({ error: "Forbidden. Admin access required." });
      }

      await admin.auth().updateUser(uid, { password: newPassword });
      res.json({ success: true });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: String(e.message || e) });
    }
  });

  // NEW: Lookup user Auth Email by secondary email or phone
  app.post("/api/lookup-auth-email", express.json(), async (req, res) => {
    try {
      if (!admin.apps?.length) return res.json({ authEmail: null });
      const { identifier } = req.body;
      if (!identifier) return res.json({ authEmail: null });

      const usersRef = getFirestore().collection("users");
      // Check if it matches email, secondaryEmail, or phoneNumber
      const q1 = await usersRef.where("email", "==", identifier).limit(1).get();
      if (!q1.empty) return res.json({ authEmail: q1.docs[0].data().email });

      const q2 = await usersRef.where("secondaryEmail", "==", identifier).limit(1).get();
      if (!q2.empty) return res.json({ authEmail: q2.docs[0].data().email });

      const q3 = await usersRef.where("phoneNumber", "==", identifier).limit(1).get();
      if (!q3.empty) return res.json({ authEmail: q3.docs[0].data().email });

      // also check plain number string
      const q4 = await usersRef.where("phoneNumber", "==", `+880${identifier.startsWith("0") ? identifier.substring(1) : identifier}`).limit(1).get();
      if (!q4.empty) return res.json({ authEmail: q4.docs[0].data().email });

      // If user typed 'test@gmail.com', wait, we checked secondaryEmail exactly.

      return res.json({ authEmail: null });
    } catch (e) {
      return res.json({ authEmail: null });
    }
  });

  app.post("/api/ads/record", express.json(), async (req, res) => {
    try {
        const { adId, type, action, watchTime } = req.body;
        
        // 1. Save detailed analytics locally (always succeed)
        try {
          const analyticsPath = path.resolve(process.cwd(), "local_db/ads_analytics.json");
          let analytics: any = {};
          if (fs.existsSync(analyticsPath)) {
            try { analytics = JSON.parse(fs.readFileSync(analyticsPath, "utf-8")); } catch(err) {}
          }
          
          if (!analytics[adId]) {
            analytics[adId] = {
              id: adId,
              type,
              impressions: 0,
              conversions: 0,
              closes: 0,
              totalWatchTime: 0,
              closeSeconds: {}
            };
          }
          
          const adStat = analytics[adId];
          adStat.type = type;
          
          if (action === 'impression') {
            adStat.impressions = (adStat.impressions || 0) + 1;
          } else if (action === 'conversion') {
            adStat.conversions = (adStat.conversions || 0) + 1;
          } else if (action === 'close' && watchTime !== undefined) {
            adStat.closes = (adStat.closes || 0) + 1;
            adStat.totalWatchTime = (adStat.totalWatchTime || 0) + watchTime;
            const sec = Math.round(watchTime);
            if (!adStat.closeSeconds) adStat.closeSeconds = {};
            adStat.closeSeconds[sec] = (adStat.closeSeconds[sec] || 0) + 1;
          }
          
          const localDir = path.resolve(process.cwd(), "local_db");
          if (!fs.existsSync(localDir)) {
            fs.mkdirSync(localDir, { recursive: true });
          }
          fs.writeFileSync(analyticsPath, JSON.stringify(analytics, null, 2), "utf-8");
        } catch (err) {
          console.error("Failed to write local analytics:", err);
        }

        // 2. Try real Firestore update if active (fail silently to preserve experience)
        if (admin.apps?.length) {
          try {
            const db = getFirestore();
            const adRef = db.collection("settings").doc("ads");
            
            await db.runTransaction(async (t) => {
               const doc = await t.get(adRef);
               if (!doc.exists) return;
               const data = doc.data() || {};
               const adsArray = type === 'video' ? (data.videoAds || []) : (data.photoAds || []);
               
               const index = adsArray.findIndex((a: any) => a.id === adId);
               if (index !== -1) {
                  if (action === 'impression') {
                     adsArray[index].impressions = (adsArray[index].impressions || 0) + 1;
                  } else if (action === 'conversion') {
                     adsArray[index].conversions = (adsArray[index].conversions || 0) + 1;
                  } else if (action === 'close' && watchTime !== undefined) {
                     const currentTotalWatchTime = adsArray[index].totalWatchTime || 0;
                     const closes = (adsArray[index].closes || 0) + 1;
                     adsArray[index].totalWatchTime = currentTotalWatchTime + watchTime;
                     adsArray[index].closes = closes;
                  }
                  if (type === 'video') {
                     t.update(adRef, { videoAds: adsArray });
                  } else {
                     t.update(adRef, { photoAds: adsArray });
                  }
               }
            });
          } catch (firestoreErr: any) {
            console.warn("Firestore analytics transaction omitted (using local fallback instead):", firestoreErr.message || firestoreErr);
          }
        }
        
        res.json({ success: true });
    } catch(e) {
        console.error("Ad recording top-level error:", e);
        res.json({ success: true });
    }
  });

  app.get("/api/ads/analytics", (req, res) => {
    try {
      const analyticsPath = path.resolve(process.cwd(), "local_db/ads_analytics.json");
      let analytics = {};
      if (fs.existsSync(analyticsPath)) {
        try {
          analytics = JSON.parse(fs.readFileSync(analyticsPath, "utf-8"));
        } catch (err) {}
      }
      res.json(analytics);
    } catch (e: any) {
      res.status(500).json({ error: String(e.message || e) });
    }
  });

  app.post("/api/ads/reward", express.json(), async (req, res) => {
    try {
        const { adId, uid, rewardCoins } = req.body;
        if (!uid || !rewardCoins) return res.status(400).json({error: "Invalid request"});
        
        // Log locally for audit trail
        try {
          const logPath = path.resolve(process.cwd(), "local_db/reward_logs.json");
          let logs: any[] = [];
          if (fs.existsSync(logPath)) {
            try { logs = JSON.parse(fs.readFileSync(logPath, "utf-8")); } catch(err) {}
          }
          logs.push({ uid, adId, rewardCoins, timestamp: Date.now() });
          const localDir = path.resolve(process.cwd(), "local_db");
          if (!fs.existsSync(localDir)) fs.mkdirSync(localDir, { recursive: true });
          fs.writeFileSync(logPath, JSON.stringify(logs, null, 2), "utf-8");
        } catch(e) {}

        if (admin.apps?.length) {
          try {
            const db = getFirestore();
            const userRef = db.collection("users").doc(uid);
            
            await db.runTransaction(async (t) => {
               const doc = await t.get(userRef);
               if (!doc.exists) return;
               const currentCoins = doc.data().coins || 0;
               t.update(userRef, { coins: currentCoins + rewardCoins });
            });
          } catch(e: any) {
            console.warn("Firestore reward transaction skipped:", e.message || e);
          }
        }
        res.json({ success: true, rewardCoins });
    } catch(e) {
       res.status(500).json({ error: "Failed" });
    }
  });

  app.post('/api/reset-password-request', express.json(), async (req, res) => {
    try {
      const { identifier } = req.body; // email or phone
      if (!admin.apps?.length) {
         return res.status(500).json({ error: 'Firebase Admin not initialized.' });
      }

      const usersRef = getFirestore().collection('users');
      // Search by email, phone, or formatted phone email
      const formattedPhone = identifier.replace(/[-.+\s]/g, '');
      const possibleEmail = formattedPhone.startsWith('880') ? `${formattedPhone}@phone.deepshop.top` : `880${formattedPhone.startsWith('0') ? formattedPhone.substring(1) : formattedPhone}@phone.deepshop.top`;
      const possibleEmailLegacy = formattedPhone.startsWith('880') ? `${formattedPhone}@phone.vibegadget.com` : `880${formattedPhone.startsWith('0') ? formattedPhone.substring(1) : formattedPhone}@phone.vibegadget.com`;
      
      let userDoc = null;
      
      const emailQuery = await usersRef.where('email', '==', identifier).limit(1).get();
      if (!emailQuery.empty) userDoc = emailQuery.docs[0];
      
      if (!userDoc) {
         const phoneEmailQuery = await usersRef.where('email', '==', possibleEmail).limit(1).get();
         if (!phoneEmailQuery.empty) {
           userDoc = phoneEmailQuery.docs[0];
         } else {
           const phoneEmailQueryLegacy = await usersRef.where('email', '==', possibleEmailLegacy).limit(1).get();
           if (!phoneEmailQueryLegacy.empty) userDoc = phoneEmailQueryLegacy.docs[0];
         }
      }

      if (!userDoc) {
          // Try scanning phones
          const allUsers = await usersRef.get();
          for (let doc of allUsers.docs) {
             const data = doc.data();
             if (data.phoneNumber && data.phoneNumber.replace(/[-.+\s]/g, '').includes(formattedPhone)) {
                userDoc = doc;
                break;
             }
          }
      }

      if (!userDoc) {
         return res.status(404).json({ error: 'No account found with this number' });
      }

      const userData = userDoc.data();
      
      // Save request to db
      await getFirestore().collection('passwordResets').add({
         uid: userData.uid,
         email: userData.email,
         displayName: userData.displayName || 'Unknown',
         phoneNumber: userData.phoneNumber || identifier,
         createdAt: Date.now(),
         status: 'pending'
      });

      // Send telegram
      const botToken = "8571639361:AAEuplHuF4mh6rkaCCWoC-D_c57Iho7rM8YY";
      const chatId = "5494141897";
      const message = `<b>🔐 Password Reset Request</b>\n━━━━━━━━━━━━━━━━━━\n<b>👤 Name:</b> ${userData.displayName || 'Unknown'}\n<b>📞 Phone:</b> <code>${userData.phoneNumber || identifier}</code>\n<b>📧 Email:</b> <code>${userData.email}</code>\n<b>🆔 UID:</b> <code>${userData.uid}</code>\n━━━━━━━━━━━━━━━━━━\n<i>User requested a password reset. You can set a new password from the Manage Users panel and send it via Whatsapp/SMS.</i>`;
      
      fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: "HTML" }),
      }).catch(e => console.error("Telegram error:", e));

      res.json({ success: true, method: 'phone', mask: userData.phoneNumber || identifier });
    } catch (e: any) {
      console.error(e);
      res.status(500).json({ error: String(e.message || e) });
    }
  });

  app.post("/api/gateway/sms", express.json(), async (req, res) => {
    try {
      if (!admin.apps?.length) {
        return res.status(500).json({ error: "Firebase Admin not initialized." });
      }

      // Expected format from the Android App
      const { device_key, sender, message, receiver_sim } = req.body;

      if (!device_key || !sender || !message) {
        return res.status(400).json({ error: "Missing parameters" });
      }

      // Fetch gateway settings to verify device key
      const db = getFirestore();
      const settingsSnap = await db.collection("settings").doc("payment_gateway").get();
      const settings = settingsSnap.data() || {};

      if (settings.deviceKey !== device_key && device_key !== process.env.DEVICE_KEY) {
        return res.status(401).json({ error: "Invalid Device Key" });
      }

      // We only care about known banking senders (e.g., bKash, Nagad)
      const lcSender = sender.toLowerCase();
      let transactionId = null;
      let amount = null;

      // Extract transaction ID and Amount
      if (lcSender.includes("bkash")) {
        // e.g. "Payment Tk 150.00 to 01XXX... successful. TrxID 8I25A..."
        // e.g. "You have received Tk 150.00 from ... TrxID 8I34B..."
        const trxMatch = message.match(/TrxID[ :]+([A-Z0-9]+)/i);
        const amountMatch = message.match(/Tk[ :]+([\d,.]+)/i);
        if (trxMatch) transactionId = trxMatch[1];
        if (amountMatch) amount = parseFloat(amountMatch[1].replace(/,/g, ""));
      } else if (lcSender.includes("nagad")) {
        // e.g. "Payment successful... Amount: Tk 250.00 ... TxnID: 7IH4B..."
        const trxMatch = message.match(/TxnID[ :]+([A-Z0-9]+)/i);
        const amountMatch = message.match(/(?:Tk|Amount)[ :]+([\d,.]+)/i);
        if (trxMatch) transactionId = trxMatch[1];
        if (amountMatch) amount = parseFloat(amountMatch[1].replace(/,/g, ""));
      } else {
        // Generic parser for other SMS (e.g. Rocket, Upay)
        const trxMatch = message.match(/(?:TrxID|TxnId|TxID|Transaction ID)[ :]*([A-Z0-9]+)/i);
        const amountMatch = message.match(/(?:Tk|Amount|BDT)[ .:]*([0-9,.]+)/i);
        if (trxMatch) transactionId = trxMatch[1];
        if (amountMatch) amount = parseFloat(amountMatch[1].replace(/,/g, ""));
      }

      // Log the SMS
      await db.collection("sms_logs").add({
        sender,
        message,
        receiver_sim: receiver_sim || "Unknown",
        transactionId,
        amount,
        createdAt: FieldValue.serverTimestamp(),
        processed: transactionId ? false : true, // Mark non-transactions as processed
      });

      // If we found a TrxID and Amount, look for a matching pending order
      if (transactionId && amount) {
        // Find pending orders matching the amount
        const ordersSnap = await db.collection("orders")
          .where("status", "==", "Pending")
          .get();

        let matchedOrder = null;
        for (const doc of ordersSnap.docs) {
          const order = doc.data();
          // We check if amount closely matches the total
          if (Math.abs((order.totalAmount || order.total || 0) - amount) <= 1) {
            matchedOrder = doc;
            break;
          }
        }

        // We can also allow the user to input the TrxID during checkout,
        // and check against it here.
        if (!matchedOrder) {
            // Find order where user manually entered this TrxID
            const manualTrxSnap = await db.collection("orders")
                .where("transactionId", "==", transactionId)
                .where("status", "==", "Pending")
                .limit(1)
                .get();
            if (!manualTrxSnap.empty) {
                matchedOrder = manualTrxSnap.docs[0];
            }
        }

        if (matchedOrder) {
          // Auto-verify and update order
          await matchedOrder.ref.update({
            status: "Processing",
            paymentStatus: "Paid",
            autoVerified: true,
            verifiedTrxId: transactionId,
            verifiedAt: FieldValue.serverTimestamp()
          });

          // Also set sms log as processed
          const recentLogs = await db.collection("sms_logs")
             .where("transactionId", "==", transactionId)
             .limit(1)
             .get();
          if (!recentLogs.empty) {
             await recentLogs.docs[0].ref.update({ processed: true, orderId: matchedOrder.id });
          }
        }
      }

      res.json({ success: true, message: "SMS logged." });
    } catch (error: any) {
      console.error("SMS Gateway Error:", error);
      res.status(500).json({ error: String(error.message || error) });
    }
  });

  // Simple REST fetcher for product data to avoid loading Firebase Client SDK in Node
  const fetchProductData = async (productId: string) => {
    try {
      const res = await fetch(
        `https://firestore.googleapis.com/v1/projects/deep-shop-bd/databases/(default)/documents/products/${productId}`,
      );
      if (!res.ok) return null;
      const data = await res.json();
      return data.fields;
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  
let appInitialized = false;

export async function initializeAppAsync() {
  if (appInitialized) return;
  appInitialized = true;

  const isProd = process.env.NODE_ENV === "production" || process.env.VERCEL;
  let vite: any;
  const distPath = path.join(process.cwd(), "dist");

  // Only use static serving locally in production, NOT on Vercel
  // because on Vercel, static files are handled by vercel static routing if present.
  if (isProd && !process.env.VERCEL) {
      app.use(express.static(distPath, { index: false }));
  }

  if (!isProd) {
    const { createServer: createViteServer } = await import("vite");
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.get("*all", async (req, res) => {
    try {
      let template: string;

      if (!isProd) {
        template = fs.readFileSync(path.resolve("index.html"), "utf-8");
        template = await vite.transformIndexHtml(req.originalUrl, template);
      } else {
        template = fs.readFileSync(
          path.join(distPath, "index.html"),
          "utf-8",
        );
      }

      // Check if it's a product page matching `/product/:id` or `/:slug`
      const productMatch = req.path.match(/^\/product\/(.+)/);
      const isSlugMatch = req.path !== "/" && req.path !== "/all-products" && !req.path.startsWith("/api");

      let product: any = null;
      if (productMatch && productMatch[1]) {
        const productId = productMatch[1].split("/")[0];
        product = await fetchProductData(productId);
      } else if (isSlugMatch && admin.apps?.length) {
        try {
          const snapshot = await getFirestore().collection("products").get();
          for (const doc of snapshot.docs) {
            const data = doc.data();
            const slug = toSlug(data.title);
            if (`/${slug}` === req.path) {
              product = data;
              break;
            }
          }
        } catch (e) {}
      }

      if (product) {
        const title = product.title?.stringValue || "Product";
        const description = product.description?.stringValue || "";
        const imageUrl =
          product.image?.stringValue ||
          product.images?.arrayValue?.values?.[0]?.stringValue ||
          "/favicon.png";
        const price =
          product.price?.numberValue ||
          product.price?.integerValue ||
          product.price?.doubleValue ||
          0;

        let metaTags = `
          <title>${title} | DEEP SHOP</title>
          <meta name="description" content="${description}" />
          <meta property="og:title" content="${title} | DEEP SHOP" />
          <meta property="og:description" content="${description}" />
          <meta property="og:image" content="${imageUrl}" />
          <meta property="og:image:alt" content="${title}" />
          <meta property="og:type" content="product" />
          <meta property="og:url" content="https://www.deepshop.top${req.path}" />
          <link rel="canonical" href="https://www.deepshop.top${req.path}" />
          <meta property="product:brand" content="DEEP SHOP" />
          <meta property="product:price:amount" content="${price}" />
          <meta property="product:price:currency" content="BDT" />
          <meta property="product:availability" content="instock" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="${title}" />
          <meta name="twitter:description" content="${description}" />
          <meta name="twitter:image" content="${imageUrl}" />
        `;

        // Inject meta tags
        const metaRegex =
          /<!-- META_TAGS_PLACEHOLDER -->[\s\S]*?<!-- END_META_TAGS_PLACEHOLDER -->/;
        if (metaRegex.test(template)) {
          template = template.replace(metaRegex, metaTags);
        } else {
          template = template.replace("</head>", `${metaTags}\n</head>`);
        }

        // Basic HTML Pre-rendering for AEO / Bots
        const preRenderedHTML = `
          <div style="display: none;" aria-hidden="true">
            <h1>${title}</h1>
            <p>${description}</p>
            <img src="${imageUrl}" alt="${title}" />
            <p>Price: BDT ${price}</p>
          </div>
        `;
        template = template.replace('<div id="root"></div>', '<div id="root">' + preRenderedHTML + '</div>');
      } else if (req.path === "/all-products") {
        const category = req.query.category ? String(req.query.category) : "All";
        const canonicalUrl = category !== "All" ? `https://www.deepshop.top/all-products?category=${encodeURIComponent(category)}` : `https://www.deepshop.top/all-products`;
        
        let metaTags = `
          <title>${category === "All" ? "All Products" : `${category} Products`} | DEEP SHOP</title>
          <meta name="description" content="Browse our collection of ${category} at DEEP SHOP." />
          <meta property="og:title" content="${category === "All" ? "All Products" : `${category} Products`} | DEEP SHOP" />
          <link rel="canonical" href="${canonicalUrl}" />
          <meta property="og:url" content="${canonicalUrl}" />
        `;
        
        const metaRegex =/<!-- META_TAGS_PLACEHOLDER -->[\s\S]*?<!-- END_META_TAGS_PLACEHOLDER -->/;
        if (metaRegex.test(template)) {
          template = template.replace(metaRegex, metaTags);
        } else {
          template = template.replace("</head>", `${metaTags}\n</head>`);
        }
      } else if (req.path === "/" && admin.apps?.length) {
        // Fetch home SEO
        try {
          const seoSnap = await getFirestore()
            .collection("settings")
            .doc("seo")
            .get();
          if (seoSnap.exists) {
            const data = seoSnap.data() as any;
            const title = data.metaTitle || "DEEP SHOP | #1 Trusted Platform for Border Cross Mobiles";
            const description =
              data.metaDescription ||
              "DEEP SHOP - Discover premium border cross phones, original mobiles & accessories.";
            const imageUrl =
              data.metaImage || "/favicon.png";

            let metaTags = `
                <title>${title}</title>
                <meta name="description" content="${description}" />
                <meta property="og:title" content="${title}" />
                <meta property="og:description" content="${description}" />
                <meta property="og:image" content="${imageUrl}" />
                <meta property="og:type" content="website" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="${title}" />
                <meta name="twitter:description" content="${description}" />
                <meta name="twitter:image" content="${imageUrl}" />
             `;
            template = template.replace("</head>", `${metaTags}\n</head>`);
          }
        } catch (e) {}
      }

      res.status(200).set({ "Content-Type": "text/html" }).end(template);
    } catch (e: any) {
      if (!isProd && vite) {
        vite.ssrFixStacktrace(e);
      }
      console.log(e.stack);
      res.status(500).end(e.stack);
    }
  });
}

if (!process.env.VERCEL) {
  initializeAppAsync().then(() => {
    const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  });
}
