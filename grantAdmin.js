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

// Replace with the UID of the user you created in Authentication
const uid = "VLWG0Z1amSWZK5jlrFhy1q5mt1N2";

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
