import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { 
  getFirestore, 
  enableIndexedDbPersistence,
  CACHE_SIZE_UNLIMITED
} from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAjj6Dnah51Dkvg9rYcdSEZbJlJVyw1DMM",
  authDomain: "medihaven-78f6d.firebaseapp.com",
  projectId: "medihaven-78f6d",
  storageBucket: "medihaven-78f6d.appspot.com",
  messagingSenderId: "935058134424",
  appId: "1:935058134424:web:5a4af882d150f3ddea07ed",
  measurementId: "G-TV92RDZ88X"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Enable offline persistence
try {
  enableIndexedDbPersistence(db, {cacheSizeBytes: CACHE_SIZE_UNLIMITED})
    .then(() => {
      console.log("Offline persistence enabled successfully");
    })
    .catch((err) => {
      console.error("Error enabling offline persistence:", err);
      if (err.code === 'failed-precondition') {
        // Multiple tabs open, persistence can only be enabled in one tab at a time
        console.warn("Multiple tabs open, persistence only enabled in one tab");
      } else if (err.code === 'unimplemented') {
        // The current browser does not support all of the features required to enable persistence
        console.warn("Current browser doesn't support all features needed for persistence");
      }
    });
} catch (error) {
  console.error("Error setting up persistence:", error);
}

export { app, auth, db, storage };