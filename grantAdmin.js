// grantAdmin.js
// @version: 2

const admin = require("firebase-admin");

// Pull in your service account JSON from the env var instead of a local file
const serviceAccount = JSON.parse(process.env.FIREBASE_SA_KEY);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: "vbmap-cc834"
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
