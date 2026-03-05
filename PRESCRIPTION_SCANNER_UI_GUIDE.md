# Prescription Scanner - UI Visual Guide

## 🎨 Complete UI Flow

### Page Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Back                                                          │
│  AI Prescription Scanner                                         │
│  Upload your prescription and let AI detect medicines            │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────────────┐  ┌──────────────────────────────┐ │
│  │   LEFT PANEL             │  │   RIGHT PANEL                 │ │
│  │   Upload & OCR           │  │   Detected Medicines          │ │
│  └──────────────────────────┘  └──────────────────────────────┘ │
│                                                                   │
├─────────────────────────────────────────────────────────────────┤
│  How it works (4 steps)                                          │
│  Tips for better results                                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📤 Left Panel: Upload & OCR

### State 1: Empty (Initial)
```
┌──────────────────────────────────────┐
│ Upload Prescription                   │
├──────────────────────────────────────┤
│                                       │
│  ┌─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐  │
│  │                                 │  │
│  │         📤 Cloud Icon           │  │
│  │                                 │  │
│  │  Click to upload or drag & drop │  │
│  │  PNG, JPG up to 5MB             │  │
│  │                                 │  │
│  └─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘  │
│                                       │
└──────────────────────────────────────┘
```

### State 2: File Selected
```
┌──────────────────────────────────────┐
│ Upload Prescription                   │
├──────────────────────────────────────┤
│                                       │
│  ┌────────────────────────────────┐  │
│  │  [Prescription Image Preview]  │  │
│  │                                │  │
│  │         [Image]                │  │
│  │                            [X] │  │ ← Remove button
│  └────────────────────────────────┘  │
│                                       │
│  ┌────────────────────────────────┐  │
│  │ 📄 A-sample-prescription.png   │  │
│  │ 229.2 KB                       │  │
│  └────────────────────────────────┘  │
│                                       │
│  ┌────────────────────────────────┐  │
│  │  🔍 Scan Prescription          │  │ ← Purple gradient button
│  └────────────────────────────────┘  │
│                                       │
└──────────────────────────────────────┘
```

### State 3: Processing
```
┌──────────────────────────────────────┐
│ Upload Prescription                   │
├──────────────────────────────────────┤
│                                       │
│  [Image Preview]                      │
│                                       │
│  ┌────────────────────────────────┐  │
│  │ ⏳ Processing...               │  │ ← Loading spinner
│  └────────────────────────────────┘  │
│                                       │
└──────────────────────────────────────┘
```

### State 4: Results with OCR Output
```
┌──────────────────────────────────────┐
│ Upload Prescription                   │
├──────────────────────────────────────┤
│  [Image Preview]                      │
│  [File Info]                          │
│  [Scan Button - Completed]            │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│ 📄 Raw OCR Output                     │
├──────────────────────────────────────┤
│  ┌────────────────────────────────┐  │
│  │ DO (pen 1289                   │  │
│  │ 1 NOV                          │  │
│  │ DDD PRESCRIPTION               │  │
│  │ RR                             │  │
│  │ FOR (Full name, address, &     │  │
│  │ phone number) (if under 12,    │  │
│  │ give age)                      │  │
│  │ John Blowe, HMB USN: oo ono won│  │
│  │ 1 mi court se re anaea Be pa   │  │
│  │ US.S. Neverforgotten (pp 178)  │  │
│  │                                │  │
│  │ [Scrollable text area]         │  │
│  └────────────────────────────────┘  │
└──────────────────────────────────────┘
```

---

## 📋 Right Panel: Detected Medicines

### State 1: Empty (Before Scan)
```
┌──────────────────────────────────────┐
│ Detected Medicines                    │
├──────────────────────────────────────┤
│                                       │
│         📋 Document Icon              │
│                                       │
│  Upload and scan a prescription       │
│  to see detected medicines            │
│                                       │
└──────────────────────────────────────┘
```

### State 2: Medicines Detected
```
┌──────────────────────────────────────┐
│ Detected Medicines                    │
├──────────────────────────────────────┤
│                                       │
│  ┌────────────────────────────────┐  │
│  │ [1] Tr Bellidopnas Me      ✅  │  │ ← High Match badge
│  │     Raw: "Tr bellidopnas 5 me" │  │
│  │                                │  │
│  │     Belladonna Tincture        │  │
│  │     ₹185 • In Stock            │  │
│  │                                │  │
│  │     💊 120ml                   │  │
│  │                                │  │
│  │  [+ Add to Cart]  [Edit]      │  │
│  └────────────────────────────────┘  │
│                                       │
│  ┌────────────────────────────────┐  │
│  │ [10] Ampteoget Goed        ✅  │  │ ← High Match badge
│  │      Raw: "ampteoget goed 120" │  │
│  │                                │  │
│  │      ampteoget goed            │  │
│  │      ₹850 • In Stock           │  │
│  │                                │  │
│  │      💊 120ml                  │  │
│  │                                │  │
│  │  [+ Add to Cart]  [Edit]      │  │
│  └────────────────────────────────┘  │
│                                       │
│  ┌────────────────────────────────┐  │
│  │ [11] Subscription          ❌  │  │ ← No Match badge
│  │      Raw: "subscription"       │  │
│  │                                │  │
│  │      No exact match found      │  │
│  │      Please select manually    │  │
│  │                                │  │
│  │  [Edit]                        │  │
│  └────────────────────────────────┘  │
│                                       │
└──────────────────────────────────────┘
```

---

## 🎨 Color Scheme

### Confidence Badges

#### High Match (≥70%)
```
┌─────────────────┐
│ ✅ High Match   │  ← Green background (#10B981)
└─────────────────┘    Green text (#065F46)
```

#### Medium Match (40-69%)
```
┌─────────────────┐
│ ⚠️ Medium Match │  ← Yellow background (#FCD34D)
└─────────────────┘    Yellow text (#92400E)
```

#### No Match (<40%)
```
┌─────────────────┐
│ ❌ No Match     │  ← Red background (#FCA5A5)
└─────────────────┘    Red text (#991B1B)
```

### Buttons

#### Primary (Scan Prescription)
```
┌──────────────────────────┐
│ 🔍 Scan Prescription     │  ← Purple to Indigo gradient
└──────────────────────────┘    (#8B5CF6 → #4F46E5)
```

#### Secondary (Add to Cart)
```
┌──────────────────────────┐
│ + Add to Cart            │  ← Blue to Indigo gradient
└──────────────────────────┘    (#3B82F6 → #4F46E5)
```

#### Success (Added)
```
┌──────────────────────────┐
│ ✓ Added                  │  ← Green background
└──────────────────────────┘    (#D1FAE5 text: #065F46)
```

#### Tertiary (Edit)
```
┌──────────────────────────┐
│ Edit                     │  ← Gray border, white bg
└──────────────────────────┘    Border: #D1D5DB
```

---

## 📱 Responsive Behavior

### Desktop (≥1024px)
```
┌─────────────────────────────────────────────┐
│  [Left Panel 50%]  │  [Right Panel 50%]     │
└─────────────────────────────────────────────┘
```

### Tablet (768px - 1023px)
```
┌─────────────────────────────────────────────┐
│  [Left Panel 50%]  │  [Right Panel 50%]     │
└─────────────────────────────────────────────┘
```

### Mobile (<768px)
```
┌─────────────────────────────────────────────┐
│  [Left Panel 100%]                          │
├─────────────────────────────────────────────┤
│  [Right Panel 100%]                         │
└─────────────────────────────────────────────┘
```

---

## 🎯 Medicine Card Details

### Complete Medicine Card
```
┌────────────────────────────────────────────┐
│  [#]  Medicine Name              [Badge]   │ ← Header with number & badge
│       Raw: "extracted text"                │ ← Raw OCR text
├────────────────────────────────────────────┤
│  Price:     ₹185                           │ ← Details section
│  Strength:  💊 120ml                       │
│  Dosage:    1-0-1                          │
│  Duration:  5 days                         │
│  Stock:     In Stock                       │
├────────────────────────────────────────────┤
│  [+ Add to Cart]           [Edit]          │ ← Action buttons
└────────────────────────────────────────────┘
```

### Card States

#### Before Adding
```
[+ Add to Cart]  ← Blue gradient, clickable
```

#### After Adding
```
[✓ Added]  ← Green background, disabled
```

#### Out of Stock
```
[Out of Stock]  ← Gray, disabled
```

---

## 🔄 Interaction Flow

### 1. Upload Flow
```
Click Upload Area
    ↓
File Dialog Opens
    ↓
Select Image
    ↓
Preview Appears
    ↓
File Info Shows
    ↓
Scan Button Enabled
```

### 2. Scan Flow
```
Click "Scan Prescription"
    ↓
Button shows "Processing..."
    ↓
Spinner animation
    ↓
OCR processes (5-10s)
    ↓
Raw text appears (left)
    ↓
Medicines appear (right)
    ↓
Success message shows
```

### 3. Add to Cart Flow
```
Review Medicine Card
    ↓
Check Match Badge
    ↓
Verify Details
    ↓
Click "+ Add to Cart"
    ↓
Button changes to "✓ Added"
    ↓
Cart icon updates
    ↓
Correction saved for learning
```

---

## 💡 Visual Indicators

### Loading States
```
⏳ Processing...        ← Spinner + text
🔄 Loading...           ← Rotating icon
```

### Success States
```
✅ Successfully detected 3 medicine(s)
✓ Added to cart
```

### Error States
```
❌ No medicines detected
⚠️ Failed to process prescription
```

### Info States
```
ℹ️ Upload a clear image for best results
💡 Tip: Ensure good lighting
```

---

## 🎨 Animation Effects

### Button Hover
```
Normal:  bg-blue-500
Hover:   bg-blue-600  ← Darker shade
         scale(1.02)  ← Slight scale up
```

### Card Hover
```
Normal:  shadow-sm
Hover:   shadow-md  ← Elevated shadow
```

### Badge Pulse (High Match)
```
animate-pulse  ← Subtle pulsing effect
```

### Loading Spinner
```
animate-spin  ← Continuous rotation
```

---

## 📐 Spacing & Layout

### Card Spacing
```
Padding:     p-4 (16px)
Margin:      mb-4 (16px between cards)
Border:      border border-gray-200
Radius:      rounded-lg (8px)
```

### Button Spacing
```
Padding:     px-4 py-2 (16px horizontal, 8px vertical)
Margin:      space-x-2 (8px between buttons)
Radius:      rounded-lg (8px)
```

### Panel Spacing
```
Padding:     p-6 (24px)
Gap:         gap-6 (24px between panels)
```

---

## 🎯 Accessibility

### ARIA Labels
```html
<button aria-label="Upload prescription image">
<div role="status" aria-live="polite">Processing...</div>
<span aria-label="High confidence match">✅ High Match</span>
```

### Keyboard Navigation
```
Tab:        Navigate between elements
Enter:      Activate buttons
Escape:     Close modals
Space:      Toggle checkboxes
```

### Screen Reader Support
```
"Upload prescription image button"
"Scan prescription button, processing"
"Medicine card 1 of 3, Paracetamol, high match"
"Add to cart button"
```

---

## 🎨 Complete Color Palette

```
Primary:     #8B5CF6 (Purple)
Secondary:   #4F46E5 (Indigo)
Success:     #10B981 (Green)
Warning:     #F59E0B (Yellow)
Error:       #EF4444 (Red)
Info:        #3B82F6 (Blue)

Gray Scale:
  50:  #F9FAFB
  100: #F3F4F6
  200: #E5E7EB
  300: #D1D5DB
  400: #9CA3AF
  500: #6B7280
  600: #4B5563
  700: #374151
  800: #1F2937
  900: #111827
```

---

## ✨ Final UI Checklist

- ✅ Two-panel responsive layout
- ✅ Upload area with drag & drop
- ✅ Image preview with remove button
- ✅ Purple gradient scan button
- ✅ Raw OCR output display
- ✅ Numbered medicine cards
- ✅ Color-coded confidence badges
- ✅ Medicine details (price, strength, etc.)
- ✅ Add to cart functionality
- ✅ Edit button for manual selection
- ✅ Loading states and animations
- ✅ Error and success messages
- ✅ Responsive design
- ✅ Accessibility features
- ✅ Smooth transitions

---

**UI Status**: ✅ Matches Provided Design
**Responsive**: ✅ Desktop, Tablet, Mobile
**Accessible**: ✅ ARIA labels, Keyboard navigation
**Animated**: ✅ Smooth transitions and loading states
