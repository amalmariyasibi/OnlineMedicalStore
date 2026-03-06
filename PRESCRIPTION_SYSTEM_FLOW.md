# Prescription System Flow Diagram

## 📤 Customer Upload Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     CUSTOMER UPLOADS PRESCRIPTION                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Select File     │
                    │  (Image or PDF)  │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Validate File   │
                    │  - Type check    │
                    │  - Size check    │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Upload to       │
                    │  Cloudinary      │
                    │  (Backend API)   │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Get File Info   │
                    │  - fileUrl       │
                    │  - fileName      │
                    │  - size, format  │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Create Record   │
                    │  in Firestore    │
                    │  'prescriptions' │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Show Success    │
                    │  Message         │
                    └──────────────────┘
```

## 📥 Admin View Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     ADMIN VIEWS PRESCRIPTIONS                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Check User      │
                    │  Authentication  │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Verify Role     │
                    │  role === 'admin'│
                    └──────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
                    ▼                   ▼
            ┌──────────────┐    ┌──────────────┐
            │  NOT ADMIN   │    │   IS ADMIN   │
            │  Show Error  │    │   Continue   │
            └──────────────┘    └──────────────┘
                                        │
                                        ▼
                              ┌──────────────────┐
                              │  Query Firestore │
                              │  'prescriptions' │
                              │  collection      │
                              └──────────────────┘
                                        │
                                        ▼
                              ┌──────────────────┐
                              │  Apply Filters   │
                              │  - Status        │
                              │  - Date range    │
                              └──────────────────┘
                                        │
                                        ▼
                              ┌──────────────────┐
                              │  Display List    │
                              │  with Actions    │
                              └──────────────────┘
                                        │
                    ┌───────────────────┼───────────────────┐
                    │                   │                   │
                    ▼                   ▼                   ▼
            ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
            │     VIEW     │    │   APPROVE    │    │    REJECT    │
            │  Show Modal  │    │  Update      │    │   Update     │
            │  with Image  │    │  Status      │    │   Status     │
            └──────────────┘    └──────────────┘    └──────────────┘
```

## 🗄️ Database Structure

### Firestore Collections

```
medihaven-78f6d (Firebase Project)
│
├── users/
│   ├── {userId1}
│   │   ├── email: "customer@example.com"
│   │   ├── name: "John Doe"
│   │   ├── role: "customer"
│   │   └── ...
│   │
│   └── {userId2}
│       ├── email: "sibiamalu@gmail.com"
│       ├── name: "Admin User"
│       ├── role: "admin"  ← MUST BE SET!
│       └── ...
│
└── prescriptions/
    ├── {prescriptionId1}
    │   ├── userId: "userId1"
    │   ├── fileName: "prescriptions/userId1_1234567890"
    │   ├── fileUrl: "https://res.cloudinary.com/..."
    │   ├── contentType: "image/jpeg"
    │   ├── size: 123456
    │   ├── resourceType: "image"
    │   ├── format: "jpg"
    │   ├── notes: "Take twice daily"
    │   ├── status: "pending"
    │   ├── createdAt: Timestamp
    │   └── updatedAt: Timestamp
    │
    └── {prescriptionId2}
        ├── userId: "userId1"
        ├── fileName: "prescriptions/userId1_9876543210"
        ├── fileUrl: "https://res.cloudinary.com/..."
        ├── contentType: "application/pdf"
        ├── size: 456789
        ├── resourceType: "raw"
        ├── format: "pdf"
        ├── notes: ""
        ├── status: "approved"
        ├── createdAt: Timestamp
        └── updatedAt: Timestamp
```

## 🔐 Security Rules Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    FIRESTORE SECURITY RULES                      │
└─────────────────────────────────────────────────────────────────┘

READ Prescription:
    ┌──────────────────┐
    │  Is user logged  │
    │  in?             │
    └──────────────────┘
            │
            ▼
    ┌──────────────────┐
    │  Is user the     │
    │  owner OR admin? │
    └──────────────────┘
            │
    ┌───────┴───────┐
    │               │
    ▼               ▼
  ALLOW          DENY

CREATE Prescription:
    ┌──────────────────┐
    │  Is user logged  │
    │  in?             │
    └──────────────────┘
            │
            ▼
    ┌──────────────────┐
    │  Is userId in    │
    │  document same   │
    │  as auth user?   │
    └──────────────────┘
            │
    ┌───────┴───────┐
    │               │
    ▼               ▼
  ALLOW          DENY

UPDATE Prescription:
    ┌──────────────────┐
    │  Is user admin?  │
    └──────────────────┘
            │
    ┌───────┴───────┐
    │               │
    ▼               ▼
  ALLOW          DENY

DELETE Prescription:
    ┌──────────────────┐
    │  Is user the     │
    │  owner OR admin? │
    └──────────────────┘
            │
    ┌───────┴───────┐
    │               │
    ▼               ▼
  ALLOW          DENY
```

## 🐛 Debug Log Flow

### Customer Upload Logs:
```
=== PRESCRIPTION UPLOAD DEBUG ===
User ID: abc123xyz
File: prescription.jpg image/jpeg 234567

Step 1: Uploading file to Cloudinary...
✅ File uploaded to backend. Info: {fileName, fileUrl, ...}

Step 2: Creating prescription in Firestore with data: {...}
=== createPrescription called ===
Input data: {...}
Creating Firestore document with: {...}
✅ Document created with ID: def456uvw
✅ Prescription created successfully: {...}
Prescription ID: def456uvw
💡 Admin should now be able to see this prescription in the dashboard
```

### Admin View Logs:
```
=== ADMIN PRESCRIPTIONS DEBUG ===
Current User: {uid: "xyz789", email: "sibiamalu@gmail.com", ...}
User Role: admin
Is Admin?: true
✅ User is admin, fetching prescriptions...

Fetching with filters: {}
=== getAllPrescriptions called ===
Filters: {}
Executing Firestore query...
Query completed. Documents found: 3
Processing document: def456uvw {...}
Processing document: ghi789rst {...}
Processing document: jkl012mno {...}
✅ Returning 3 prescriptions

✅ Prescriptions fetched successfully: 3 prescriptions
Prescription data: [{...}, {...}, {...}]
```

### Error Logs (if role not set):
```
=== ADMIN PRESCRIPTIONS DEBUG ===
Current User: {uid: "xyz789", email: "sibiamalu@gmail.com", ...}
User Role: undefined
Is Admin?: false
❌ User role is not admin. Current role: undefined
💡 TIP: Check Firestore users collection and ensure role field is set to "admin"
```

## 🎯 Key Points

### For Customer Upload to Work:
1. ✅ User must be logged in
2. ✅ File must be valid (image/PDF, <5MB)
3. ✅ Cloudinary must be configured
4. ✅ Firestore security rules must allow create
5. ✅ User's userId must match document userId

### For Admin View to Work:
1. ✅ Admin must be logged in
2. ✅ Admin user must have `role: "admin"` in Firestore
3. ✅ Firestore security rules must allow admin to read all
4. ✅ Prescriptions collection must exist
5. ✅ Prescriptions must have proper structure

## 🔍 Common Issues

| Issue | Symptom | Solution |
|-------|---------|----------|
| Admin role not set | "User role is not admin" | Set `role: "admin"` in Firestore users collection |
| Permission denied | "🔒 PERMISSION DENIED" | Update Firestore security rules |
| No prescriptions | "0 prescriptions" | Upload test prescription as customer |
| 404 on file | Image doesn't load | Check Cloudinary URL and configuration |
| Can't upload | Upload fails | Check Cloudinary API keys in backend |

## 📱 User Interface Flow

```
Customer View:
┌─────────────────────────────────────┐
│  My Prescriptions Page              │
├─────────────────────────────────────┤
│  ┌───────────────────────────────┐  │
│  │  Upload Prescription          │  │
│  │  [Choose File] [AI Scanner]   │  │
│  │  Notes: [____________]        │  │
│  │  [Upload Prescription]        │  │
│  └───────────────────────────────┘  │
│                                     │
│  Your Prescriptions:                │
│  ┌───────────────────────────────┐  │
│  │ 📄 prescription.jpg           │  │
│  │ Status: Pending               │  │
│  │ Uploaded: Mar 5, 2026         │  │
│  │ [View] [Delete]               │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘

Admin View:
┌─────────────────────────────────────┐
│  Admin Dashboard - Prescriptions    │
├─────────────────────────────────────┤
│  Filter: [All ▼]                    │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ 📄 prescription.jpg           │  │
│  │ User: abc123...               │  │
│  │ Status: Pending               │  │
│  │ Size: 2.1 MB                  │  │
│  │ Date: Mar 5, 2026             │  │
│  │ [View] [Approve] [Reject]     │  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ 📄 prescription2.pdf          │  │
│  │ User: def456...               │  │
│  │ Status: Approved              │  │
│  │ Size: 1.5 MB                  │  │
│  │ Date: Mar 4, 2026             │  │
│  │ [View]                        │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

---

**This diagram shows the complete flow of the prescription management system.**
