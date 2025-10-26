/* eslint-disable no-undef */
// Firebase Messaging service worker for background notifications

// Use compat builds to keep it simple in a service worker context
importScripts('https://www.gstatic.com/firebasejs/9.6.11/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.6.11/firebase-messaging-compat.js');

// Initialize Firebase app (same config as the web app)
firebase.initializeApp({
  apiKey: "AIzaSyAjj6Dnah51Dkvg9rYcdSEZbJlJVyw1DMM",
  authDomain: "medihaven-78f6d.firebaseapp.com",
  projectId: "medihaven-78f6d",
  storageBucket: "medihaven-78f6d.appspot.com",
  messagingSenderId: "935058134424",
  appId: "1:935058134424:web:5a4af882d150f3ddea07ed",
  measurementId: "G-TV92RDZ88X"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage(function(payload) {
  const title = payload.notification?.title || 'MediHaven Notification';
  const body = payload.notification?.body || '';
  const data = payload.data || {};

  const options = {
    body,
    icon: '/favicon.ico',
    data
  };

  self.registration.showNotification(title, options);
});
