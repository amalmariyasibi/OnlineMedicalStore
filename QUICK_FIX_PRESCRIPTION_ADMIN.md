# Quick Fix: Prescription Admin View Issue

## 🚀 Quick Diagnosis (30 seconds)

1. Open browser console (F12)
2. Login as admin
3. Go to Admin Dashboard → View Prescriptions
4. Look for this message in console:

### If you see:
```
❌ User role is not admin. Current role: customer
💡 TIP: Check Firestore users collection and ensure role field is set to "admin"
```

**→ FIX: Set admin role in Firestore (see below)**

### If you see:
```
🔒 PERMISSION DENIED: Check Firestore security rules
```

**→ FIX: Update Firestore security rules (see below)**

### If you see:
```
✅ Prescriptions fetched successfully: 0 prescriptions
```

**→ No prescriptions uploaded yet. Test customer upload first.**

---

## 🔧 Fix 1: Set Admin Role (Most Common)

### Option A: Firebase Console (Easiest)
1. Go to https://console.firebase.google.com/
2. Select project: `medihaven-78f6d`
3. Click **Firestore Database** in left menu
4. Click **users** collection
5. Find your user (email: sibiamalu@gmail.com)
6. Click the document
7. Add/Edit field:
   - Name: `role`
   - Type: `string`
   - Value: `admin`
8. Click **Update**
9. Refresh your admin dashboard

### Option B: Quick Script
Create a file `set-admin-role.js` in your backend:

```javascript
const admin = require('firebase-admin');
const serviceAccount = require('./path-to-service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function setAdminRole(email) {
  const usersRef = db.collection('users');
  const snapshot = await usersRef.where('email', '==', email).get();
  
  if (snapshot.empty) {
    console.log('User not found');
    return;
  }
  
  snapshot.forEach(async (doc) => {
    await doc.ref.update({ role: 'admin' });
    console.log('✅ Admin role set for:', email);
  });
}

setAdminRole('sibiamalu@gmail.com');
```

Run: `node set-admin-role.js`

---

## 🔧 Fix 2: Update Firestore Security Rules

1. Go to Firebase Console → Firestore Database
2. Click **Rules** tab
3. Replace with this:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function
    function isAdmin() {
      return request.auth != null && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null && 
                     (request.auth.uid == userId || isAdmin());
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Prescriptions collection
    match /prescriptions/{prescriptionId} {
      allow read: if request.auth != null && 
                     (resource.data.userId == request.auth.uid || isAdmin());
      allow create: if request.auth != null && 
                       request.resource.data.userId == request.auth.uid;
      allow update: if isAdmin();
      allow delete: if request.auth != null && 
                       (resource.data.userId == request.auth.uid || isAdmin());
    }
    
    // Add other collections as needed
  }
}
```

4. Click **Publish**

---

## ✅ Verify the Fix

### Test Customer Upload:
1. Login as customer
2. Go to "My Prescriptions"
3. Upload a test image
4. Console should show: `✅ Prescription created successfully`

### Test Admin View:
1. Login as admin
2. Go to Admin Dashboard → View Prescriptions
3. Console should show: `✅ Prescriptions fetched successfully: X prescriptions`
4. You should see the uploaded prescription in the list

---

## 📊 What Changed

I added comprehensive debug logging to:
- ✅ Admin prescriptions page
- ✅ Prescription service (Firestore queries)
- ✅ Prescription upload component

All console messages now have clear indicators:
- ✅ = Success
- ❌ = Error
- 💡 = Helpful tip
- 🔒 = Permission issue

---

## 🆘 Still Not Working?

Share these with me:
1. All console log messages (copy/paste)
2. Screenshot of Firestore `prescriptions` collection
3. Screenshot of your user document in `users` collection

The logs will tell us exactly what's wrong!
