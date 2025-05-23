// api/grantAdmin.js
// @version: 1

const admin = require("firebase-admin");

// Initialize the Admin SDK once per cold start
const serviceAccount = JSON.parse(process.env.FIREBASE_SA_KEY);
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: "vbmap-cc834",
  });
}

/**
 * Grant the “admin” custom claim to a user.
 * Pass the UID as a query parameter: ?uid=<USER_ID>
 */
module.exports = async (req, res) => {
  const uid = req.query.uid;
  if (!uid) {
    return res.status(400).json({ success: false, error: "Missing `uid` query parameter." });
  }

  try {
    await admin.auth().setCustomUserClaims(uid, { admin: true });
    console.log(`✅ Granted admin to ${uid}`);
    return res.status(200).json({ success: true, uid });
  } catch (err) {
    console.error("❌ Error setting admin claim:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

