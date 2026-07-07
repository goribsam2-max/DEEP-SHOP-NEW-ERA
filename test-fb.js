import * as admin from "firebase-admin";
try {
    admin.initializeApp();
    console.log("Success", admin.apps.length);
} catch (e) {
    console.error("Error", e);
}
