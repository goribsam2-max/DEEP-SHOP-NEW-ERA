import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import fs from "fs";
import path from "path";

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSyBYDcBuYZEH38mwWoCqTmyImGIYqlXteZ4",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "deep-shop-bd.firebaseapp.com",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "deep-shop-bd",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "deep-shop-bd.firebasestorage.app",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "771344063997",
  appId: process.env.VITE_FIREBASE_APP_ID || "1:771344063997:web:f06c63b007a7369bf94d94"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const toSlug = (name) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

async function generateSitemap() {
  try {
    console.log("Generating sitemap...");
    const productsRef = collection(db, "products");
    const snapshot = await getDocs(productsRef);
    let urls = "";
    
    const today = new Date().toISOString().split('T')[0];
    const getSitemapDate = (val) => {
      if (!val) return null;
      if (typeof val.toMillis === "function") {
        return new Date(val.toMillis()).toISOString().split('T')[0];
      }
      const d = new Date(val);
      if (!isNaN(d.getTime())) {
        return d.toISOString().split('T')[0];
      }
      return null;
    };

    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.name) {
        const slug = toSlug(data.name);
        const lastMod = getSitemapDate(data.updatedAt) || getSitemapDate(data.createdAt) || today;
        urls += `
  <url>
    <loc>https://www.deepshop.top/${slug}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>`;
      }
    });

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://www.deepshop.top/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://www.deepshop.top/all-products</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>${urls}
</urlset>
`;

    fs.writeFileSync(path.resolve(process.cwd(), "dist/sitemap.xml"), sitemap);
    console.log("Sitemap generated successfully at dist/sitemap.xml");
    process.exit(0);
  } catch (err) {
    console.error("Error generating sitemap:", err);
    // Don't fail the build on sitemap error
    process.exit(0);
  }
}

generateSitemap();
