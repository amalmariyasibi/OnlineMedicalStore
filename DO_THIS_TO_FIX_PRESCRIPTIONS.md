# ✅ DO THIS NOW - Fix Prescription Admin View

## 🎯 Goal
Make customer-uploaded prescriptions visible in the admin dashboard.

---

## 📋 Step-by-Step Checklist

### ☑️ Step 1: Open Browser Console (5 seconds)
- [ ] Press `F12` on your keyboard
- [ ] Click the "Console" tab
- [ ] Keep this open for all remaining steps

---

### ☑️ Step 2: Test Customer Upload (2 minutes)

1. **Login as Customer** (not admin)
   - [ ] Go to your website
   - [ ] Login with a customer account

2. **Upload Test Prescription**
   - [ ] Navigate to "My Prescriptions" page
   - [ ] Click "Choose File"
   - [ ] Select any image file (JPG/PNG) or PDF
   - [ ] Click "Upload Prescription"

3. **Check Console**
   - [ ] Look for: `✅ Prescription created successfully`
   - [ ] Note the Prescription ID shown in console
   - [ ] If you see errors, copy them

**✅ If successful, continue to Step 3**
**❌ If failed, share console errors with me**

---

### ☑️ Step 3: Test Admin View (1 minute)

1. **Login as Admin**
   - [ ] Logout from customer account
   - [ ] Login with: `sibiamalu@gmail.com`

2. **Go to Admin Dashboard**
   - [ ] Click "Admin Dashboard" or navigate to admin section
   - [ ] Click "View Prescriptions" tab

3. **Check Console Messages**

**Look for one of these messages:**

#### ✅ SUCCESS:
```
✅ User is admin, fetching prescriptions...
✅ Prescriptions fetched successfully: X prescriptions
```
→ **You're done! Prescriptions should be visible.**

#### ❌ PROBLEM 1:
```
❌ User role is not admin. Current role: customer
💡 TIP: Check Firestore users collection and ensure role field is set to "admin"
```
→ **Go to Step 4 below**

#### ❌ PROBLEM 2:
```
🔒 PERMISSION DENIED: Check Firestore security rules
```
→ **Go to Step 5 below**

---

### ☑️ Step 4: Fix Admin Role (3 minutes)

**Only do this if console shows "User role is not admin"**

1. **Open Firebase Console**
   - [ ] Go to: https://console.firebase.google.com/
   - [ ] Click on project: `medihaven-78f6d`

2. **Navigate to Firestore**
   - [ ] Click "Firestore Database" in left sidebar
   - [ ] Click "Data" tab (should be selected by default)

3. **Find Users Collection**
   - [ ] Click on `users` collection
   - [ ] Look for document with email: `sibiamalu@gmail.com`
   - [ ] Click on that document

4. **Check Role Field**
   - [ ] Look for field named `role`
   - [ ] Check if value is `"admin"` (lowercase)

5. **Add/Update Role** (if needed)
   - [ ] If `role` field doesn't exist, click "+ Add field"
   - [ ] If it exists but wrong value, click the field to edit
   - [ ] Set:
     - Field name: `role`
     - Field type: `string`
     - Field value: `admin` (lowercase, no quotes)
   - [ ] Click "Update" or "Save"

6. **Verify the Fix**
   - [ ] Go back to your admin dashboard
   - [ ] Refresh the page (F5)
   - [ ] Check console again
   - [ ] Should now see: `✅ User is admin, fetching prescriptions...`

**✅ If successful, you're done!**
**❌ If still not working, go to Step 5**

---

### ☑️ Step 5: Update Firestore Security Rules (5 minutes)

**Only do this if console shows "PERMISSION DENIED"**

1. **Open Firestore Rules**
   - [ ] In Firebase Console, go to Firestore Database
   - [ ] Click "Rules" tab at the top

2. **Check Current Rules**
   - [ ] Look for `match /prescriptions/` section
   - [ ] If it doesn't exist, you need to add it

3. **Update Rules**
   - [ ] Copy this complete rule set:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to check if user is admin
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
      // Users can read their own prescriptions, admins can read all
      allow read: if request.auth != null && 
                     (resource.data.userId == request.auth.uid || isAdmin());
      
      // Users can create their own prescriptions
      allow create: if request.auth != null && 
                       request.resource.data.userId == request.auth.uid;
      
      // Only admins can update prescriptions (approve/reject)
      allow update: if isAdmin();
      
      // Users can delete their own prescriptions, admins can delete any
      allow delete: if request.auth != null && 
                       (resource.data.userId == request.auth.uid || isAdmin());
    }
    
    // Add your other collection rules here
    // (medicines, orders, etc.)
  }
}
```

4. **Publish Rules**
   - [ ] Click "Publish" button
   - [ ] Wait for confirmation message

5. **Verify the Fix**
   - [ ] Go back to admin dashboard
   - [ ] Refresh the page (F5)
   - [ ] Check console
   - [ ] Should now see: `✅ Prescriptions fetched successfully`

**✅ If successful, you're done!**

---

### ☑️ Step 6: Final Verification (1 minute)

1. **Check Admin Dashboard**
   - [ ] You should see list of prescriptions
   - [ ] Each prescription shows:
     - File name
     - User ID
     - Status badge (Pending/Approved/Rejected)
     - File size
     - Upload date
     - Action buttons (View, Approve, Reject)

2. **Test Actions**
   - [ ] Click "View" on a prescription
   - [ ] Modal opens showing the image/PDF
   - [ ] Click "Approve" or "Reject"
   - [ ] Status badge updates

**✅ Everything working? You're done!**

---

## 🎉 Success Criteria

You know it's working when:
- ✅ Customer can upload prescriptions
- ✅ Console shows: `✅ Prescription created successfully`
- ✅ Admin can see all prescriptions in dashboard
- ✅ Console shows: `✅ Prescriptions fetched successfully: X prescriptions`
- ✅ Admin can view prescription images/PDFs
- ✅ Admin can approve/reject prescriptions
- ✅ Status updates are reflected immediately

---

## 🆘 Still Not Working?

If you've completed all steps and it's still not working:

1. **Copy Console Logs**
   - [ ] Copy ALL messages from console
   - [ ] Include both customer upload and admin view logs

2. **Take Screenshots**
   - [ ] Screenshot of Firestore `prescriptions` collection
   - [ ] Screenshot of your admin user in `users` collection
   - [ ] Screenshot of Firestore security rules

3. **Share Information**
   - [ ] Share console logs
   - [ ] Share screenshots
   - [ ] Describe what you see vs. what you expect

The debug logs will tell us exactly what's wrong!

---

## 📚 Reference Documents

For more details, see:
- `QUICK_FIX_PRESCRIPTION_ADMIN.md` - Quick reference guide
- `PRESCRIPTION_FIX_SUMMARY.md` - Complete fix summary
- `PRESCRIPTION_ADMIN_VIEW_FIX.md` - Detailed technical guide
- `PRESCRIPTION_SYSTEM_FLOW.md` - System architecture diagrams

---

## ⏱️ Time Estimate

- Step 1: 5 seconds
- Step 2: 2 minutes
- Step 3: 1 minute
- Step 4: 3 minutes (if needed)
- Step 5: 5 minutes (if needed)
- Step 6: 1 minute

**Total: 2-12 minutes depending on what needs to be fixed**

---

**Start with Step 1 and work through each step in order. The console logs will guide you!**
