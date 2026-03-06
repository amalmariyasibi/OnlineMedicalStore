# Test Firestore Query - Quick Check

## The Issue

Your console shows the admin role is working, but prescriptions aren't loading. The debug messages I added aren't showing, which means the code changes haven't been applied yet.

## Quick Test Without Rebuilding

Open your browser console and paste this code:

```javascript
// Test Firestore query directly
(async () => {
  try {
    console.log('🔍 Testing Firestore query...');
    
    // Import Firestore functions
    const { collection, getDocs, query, orderBy } = await import('firebase/firestore');
    const { db } = await import('./firebaseConfig');
    
    // Query prescriptions
    const prescriptionsRef = collection(db, 'prescriptions');
    const q = query(prescriptionsRef, orderBy('createdAt', 'desc'));
    
    console.log('Executing query...');
    const snapshot = await getDocs(q);
    
    console.log('✅ Query successful!');
    console.log('Total prescriptions found:', snapshot.size);
    
    snapshot.forEach((doc) => {
      console.log('---');
      console.log('Document ID:', doc.id);
      console.log('Data:', doc.data());
    });
    
  } catch (error) {
    console.error('❌ Query failed:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    if (error.code === 'failed-precondition') {
      console.error('💡 TIP: You need to create a Firestore index');
      console.error('Click the link in the error message above to create it');
    }
  }
})();
```

## What to Look For

### If you see:
```
✅ Query successful!
Total prescriptions found: 5
```
→ **Firestore is working!** The issue is with the React component.

### If you see:
```
❌ Query failed: FirebaseError: The query requires an index
```
→ **Need to create Firestore index** (see solution below)

### If you see:
```
❌ Query failed: FirebaseError: Missing or insufficient permissions
```
→ **Firestore security rules issue** (see solution below)

## Solution 1: Create Firestore Index

If you see "requires an index" error:

1. Look for a link in the error message
2. Click it (it will open Firebase Console)
3. Click "Create Index"
4. Wait 1-2 minutes for index to build
5. Refresh your admin page

## Solution 2: Fix Security Rules

If you see "permission denied":

1. Go to Firebase Console
2. Click Firestore Database → Rules
3. Add this rule:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAdmin() {
      return request.auth != null && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    match /prescriptions/{prescriptionId} {
      allow read: if request.auth != null && 
                     (resource.data.userId == request.auth.uid || isAdmin());
      allow create: if request.auth != null;
      allow update, delete: if isAdmin();
    }
  }
}
```

4. Click "Publish"

## Solution 3: Rebuild Frontend

If the test works but the page still doesn't show prescriptions:

```bash
# Stop frontend server (Ctrl+C)
# Then restart:
npm start
```

Then hard refresh browser: `Ctrl+Shift+R`

## Expected Result

After fixing, you should see prescriptions in the admin dashboard!
