const admin = require('firebase-admin');
const path = require('path');

function initFirebaseAdmin() {
  // Check if already initialized
  if (admin.apps.length > 0) {
    console.log('✅ Firebase Admin already initialized, reusing existing app');
    return admin;
  }

  try {
    // Prefer a file path env var to avoid embedding secrets in code
    const keyPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
    const keyJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

    if (keyPath) {
      const serviceAccount = require(path.resolve(keyPath));
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log('✅ Firebase Admin initialized with service account file');
      return admin;
    }

    if (keyJson) {
      const serviceAccount = JSON.parse(keyJson);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      console.log('✅ Firebase Admin initialized with service account JSON');
      return admin;
    }

    // Fallback: Use individual environment variables
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (projectId && clientEmail && privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n')
        })
      });
      console.log('✅ Firebase Admin initialized with environment variables');
      return admin;
    }

    throw new Error('Missing Firebase Admin credentials. Please set FIREBASE_SERVICE_ACCOUNT_PATH, FIREBASE_SERVICE_ACCOUNT_JSON, or individual FIREBASE_* environment variables');
  } catch (err) {
    console.error('❌ Failed to initialize Firebase Admin SDK:', err.message);
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
