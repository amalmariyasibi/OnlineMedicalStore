import { useEffect, useState } from 'react';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { doc, updateDoc, arrayUnion, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { toast } from 'react-toastify';

// Firebase messaging instance
let messaging = null;

// Initialize Firebase messaging
try {
  messaging = getMessaging();
} catch (error) {
  console.error('Firebase messaging initialization error:', error);
}

const NotificationManager = ({ user }) => {
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    if (!user || !messaging) return;

    // Request permission and register FCM token
    const registerFCMToken = async () => {
      try {
        // Request permission
        const permission = await Notification.requestPermission();
        
        if (permission !== 'granted') {
          console.log('Notification permission not granted');
          return;
        }
        
        // Get FCM token
        const token = await getToken(messaging, {
          vapidKey: process.env.REACT_APP_FIREBASE_VAPID_KEY
        });
        
        if (token) {
          console.log('FCM Token:', token);
          
          // Save token to user document in Firestore
          const userRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const fcmTokens = userData.fcmTokens || [];
            
            // Only add token if it doesn't already exist
            if (!fcmTokens.includes(token)) {
              await updateDoc(userRef, {
                fcmTokens: arrayUnion(token)
              });
              console.log('FCM token saved to user document');
            }
          }
        } else {
          console.log('No FCM token available');
        }
      } catch (error) {
        console.error('Error registering FCM token:', error);
      }
    };

    // Handle foreground messages
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Foreground message received:', payload);
      
      // Set notification state
      setNotification({
        title: payload.notification?.title || 'New Notification',
        body: payload.notification?.body || '',
        data: payload.data || {}
      });
      
      // Show toast notification
      toast.info(
        <div>
          <h4>{payload.notification?.title || 'New Notification'}</h4>
          <p>{payload.notification?.body || ''}</p>
        </div>,
        {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true
        }
      );
    });

    // Register FCM token
    registerFCMToken();

    // Cleanup
    return () => {
      unsubscribe();
    };
  }, [user]);

  // Render nothing - this is just a manager component
  return null;
};

export default NotificationManager;