import { collection, addDoc, updateDoc, doc, getDocs, query, where, orderBy, Timestamp } from "firebase/firestore";
import { db } from "../firebase";

// Create a notification for a specific user
export const createUserNotification = async (userId, title, body, data = {}) => {
  try {
    if (!userId) return { success: false, error: "Missing userId" };

    const payload = {
      userId,
      title,
      body,
      data,
      status: "unread", // unread, read
      createdAt: Timestamp.now(),
    };

    const ref = await addDoc(collection(db, "notifications"), payload);
    return { success: true, id: ref.id };
  } catch (err) {
    console.error("createUserNotification error:", err);
    return { success: false, error: err.message };
  }
};

// Get notifications for user (newest first)
export const getUserNotifications = async (userId) => {
  try {
    const q = query(
      collection(db, "notifications"),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return { success: true, notifications: list };
  } catch (err) {
    console.error("getUserNotifications error:", err);
    return { success: false, error: err.message };
  }
};

// Mark one notification as read
export const markNotificationRead = async (notificationId) => {
  try {
    await updateDoc(doc(db, "notifications", notificationId), {
      status: "read",
    });
    return { success: true };
  } catch (err) {
    console.error("markNotificationRead error:", err);
    return { success: false, error: err.message };
  }
};
