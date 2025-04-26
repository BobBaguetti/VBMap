// grantAdmin.js
// @version: 2

const admin = require("firebase-admin");
const path  = require("path");

// Load your downloaded key (which is git-ignored)
const serviceAccount = require(path.join(__dirname, "serviceAccountKey.json"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId:  "vbmap-cc834"    // ← your Firebase project ID
});

// **Use the UID that appears in your browser console on sign-in**
const uid = "bjbZhQzEv0NceuLWSRfO4JKS9gY2";

admin.auth()
  .setCustomUserClaims(uid, { admin: true })
  .then(() => {
    console.log(`✅ Granted admin to ${uid}`);
    process.exit(0);
  })
  .catch(err => {
    console.error("❌ Error setting admin claim:", err);
    process.exit(1);
  });
