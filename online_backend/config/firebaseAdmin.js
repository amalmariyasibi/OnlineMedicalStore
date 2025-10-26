const admin = require('firebase-admin');
const path = require('path');

let initialized = false;

function initFirebaseAdmin() {
  if (initialized) return admin;

  try {
    // Prefer a file path env var to avoid embedding secrets in code
    const keyPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
    const keyJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

    if (keyPath) {
      const serviceAccount = require(path.resolve(keyPath));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      initialized = true;
      return admin;
    }

    if (keyJson) {
      const serviceAccount = JSON.parse(keyJson);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      initialized = true;
      return admin;
    }

    throw new Error('Missing FIREBASE_SERVICE_ACCOUNT_PATH or FIREBASE_SERVICE_ACCOUNT_JSON environment variable');
  } catch (err) {
    console.error('Failed to initialize Firebase Admin SDK:', err.message);
    throw err;
  }
}

async function getUserFcmToken(userId) {
  const adm = initFirebaseAdmin();
  const db = adm.firestore();
  const snap = await db.collection('users').doc(userId).get();
  if (!snap.exists) return null;
  const data = snap.data() || {};
  // Support multiple common field names
  return data.fcmToken || data.messagingToken || data.fcm_token || null;
}

async function setUserFcmToken(userId, token) {
  const adm = initFirebaseAdmin();
  const db = adm.firestore();
  await db.collection('users').doc(userId).set({
    fcmToken: token,
    updatedAt: new Date()
  }, { merge: true });
  return true;
}

async function sendPushToToken(token, payload) {
  const adm = initFirebaseAdmin();
  const message = {
    token,
    notification: {
      title: payload?.title || 'Notification',
      body: payload?.body || ''
    },
    data: payload?.data || {}
  };
  return adm.messaging().send(message);
}

module.exports = {
  initFirebaseAdmin,
  getUserFcmToken,
  setUserFcmToken,
  sendPushToToken
};
