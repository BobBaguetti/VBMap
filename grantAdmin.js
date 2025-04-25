// grantAdmin.js

const admin = require("firebase-admin");

// Use your own service account key or Application Default Credentials
admin.initializeApp({
  credential: admin.credential.applicationDefault()
});

// Replace with the UID of the user you just created
const uid = "VLWG0Z1amSWZK5jlrFhy1q5mt1N2";

admin.auth().setCustomUserClaims(uid, { admin: true })
  .then(() => {
    console.log(`✅ Granted admin to ${uid}`);
    process.exit(0);
  })
  .catch(err => {
    console.error("❌ Error setting admin claim:", err);
    process.exit(1);
  });
