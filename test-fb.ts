import admin from "firebase-admin";
import * as adminNs from "firebase-admin";

console.log("admin:", !!admin, !!admin?.initializeApp);
console.log("adminNs:", !!adminNs, !!(adminNs as any).initializeApp);
