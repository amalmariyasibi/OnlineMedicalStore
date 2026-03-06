# 🎨 AI Medicine Scanner - Visual Guide

## 📱 User Interface Overview

### Main Page Layout

```
┌─────────────────────────────────────────────────────────────┐
│                    Navigation Bar                            │
│  MediHaven | Home | Medicines | Products | AI Scanner | ... │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                                                               │
│           Specialized AI Features                            │
│           ═══════════════════════                            │
│                                                               │
│   Innovative healthcare tools designed to make life          │
│   easier for you and your family.                            │
│                                                               │
└─────────────────────────────────────────────────────────────┘

┌──────────────────────────────┬──────────────────────────────┐
│  ┌────┐                      │  ┌────┐                      │
│  │ 📄 │  AI Strip Scanner    │  │ 💊 │  Rx Expert Scanner   │
│  └────┘                      │  └────┘                      │
│  [NEW] [ELDERLY FRIENDLY]    │                              │
│                              │  Advanced OCR for doctor's   │
│  Upload a photo of your      │  handwritten prescriptions.  │
│  medicine strip. Our AI      │  Extracts dosage, strength,  │
│  identifies it and adds to   │  and matching medicines.     │
│  your cart automatically.    │                              │
│                              │                              │
│  ┌─────────────────────┐    │  ┌─────────────────────┐    │
│  │ 📷 Choose Medicine  │    │  │ Scan Prescription → │    │
│  │    Image            │    │  └─────────────────────┘    │
│  └─────────────────────┘    │                              │
│                              │                              │
│  [Image Preview Area]        │                              │
│                              │                              │
│  ┌──────────────┬────────┐  │                              │
│  │ 🔍 Start AI  │ Reset  │  │                              │
│  │  Scanning →  │        │  │                              │
│  └──────────────┴────────┘  │                              │
└──────────────────────────────┴──────────────────────────────┘
```

## 🎯 Feature Cards Design

### AI Strip Scanner Card
```
┌─────────────────────────────────────────┐
│  ┌────┐                                  │
│  │ 📄 │  AI Strip Scanner                │
│  └────┘  [NEW] [ELDERLY FRIENDLY]       │
│                                          │
│  Upload a photo of your medicine strip. │
│  Our AI identifies it and adds to your  │
│  cart automatically.                     │
│                                          │
│  ┌──────────────────────────────────┐   │
│  │  📷  Choose Medicine Image       │   │
│  └──────────────────────────────────┘   │
│                                          │
│  ┌──────────────────────────────────┐   │
│  │                                  │   │
│  │     [Image Preview]              │   │
│  │                                  │   │
│  └──────────────────────────────────┘   │
│                                          │
│  ┌─────────────────┬──────────────┐     │
│  │ 🔍 Start AI     │   Reset      │     │
│  │  Scanning →     │              │     │
│  └─────────────────┴──────────────┘     │
└─────────────────────────────────────────┘
```

### Rx Expert Scanner Card
```
┌─────────────────────────────────────────┐
│  ┌────┐                                  │
│  │ 💊 │  Rx Expert Scanner               │
│  └────┘                                  │
│                                          │
│  Advanced OCR for doctor's handwritten  │
│  prescriptions. Extracts dosage,        │
│  strength, and matching medicines.      │
│                                          │
│  ┌──────────────────────────────────┐   │
│  │  Scan Prescription →             │   │
│  └──────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

## 📊 Scan Results Display

### Single Medicine Result
```
┌─────────────────────────────────────────────────────────────┐
│  Scan Results                          [Add All to Cart]    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Paracetamol                      [Add to Cart]      │  │
│  │  by Generic Pharma                                   │  │
│  │                                                       │  │
│  │  [500mg] [Tablet] [85% match]                       │  │
│  │                                                       │  │
│  │  Pain reliever and fever reducer                     │  │
│  │                                                       │  │
│  │  ₹25.50                                              │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Multiple Medicines Result
```
┌─────────────────────────────────────────────────────────────┐
│  Scan Results                          [Add All to Cart]    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Paracetamol                      [Add to Cart]      │  │
│  │  by Generic Pharma                                   │  │
│  │  [500mg] [Tablet] [85% match]                       │  │
│  │  ₹25.50                                              │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Ibuprofen                        [Add to Cart]      │  │
│  │  by HealthCare Ltd                                   │  │
│  │  [400mg] [Tablet] [78% match]                       │  │
│  │  ₹45.00                                              │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Cetirizine                       [Add to Cart]      │  │
│  │  by Allergy Care                                     │  │
│  │  [10mg] [Tablet] [72% match]                        │  │
│  │  ₹35.00                                              │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### No Results Found
```
┌─────────────────────────────────────────────────────────────┐
│  Scan Results                                                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│                        😕                                    │
│                                                              │
│  No medicines detected in the image.                        │
│  Please try with a clearer image of the medicine strip.    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 🎨 Color Scheme

### Primary Colors
```
Blue Primary:    #2563EB  ████████
Blue Light:      #3B82F6  ████████
Blue Lighter:    #60A5FA  ████████
Blue Lightest:   #DBEAFE  ████████
```

### Secondary Colors
```
Green Success:   #059669  ████████
Purple Accent:   #7C3AED  ████████
Gray Text:       #6B7280  ████████
Gray Light:      #F3F4F6  ████████
```

### Badge Colors
```
NEW Badge:       Blue (#2563EB on #DBEAFE)
ELDERLY Badge:   Green (#059669 on #D1FAE5)
Confidence:      Green (#059669 on #D1FAE5)
Category:        Purple (#7C3AED on #EDE9FE)
Strength:        Blue (#2563EB on #DBEAFE)
```

## 📱 Responsive Breakpoints

### Desktop (1024px+)
```
┌─────────────────────────────────────────────────────────────┐
│                    Full Navigation Bar                       │
├──────────────────────────────┬──────────────────────────────┤
│                              │                              │
│    AI Strip Scanner Card     │   Rx Expert Scanner Card    │
│         (50% width)          │        (50% width)          │
│                              │                              │
└──────────────────────────────┴──────────────────────────────┘
```

### Tablet (768px - 1023px)
```
┌─────────────────────────────────────────────────────────────┐
│                    Full Navigation Bar                       │
├──────────────────────────────┬──────────────────────────────┤
│                              │                              │
│    AI Strip Scanner Card     │   Rx Expert Scanner Card    │
│         (50% width)          │        (50% width)          │
│                              │                              │
└──────────────────────────────┴──────────────────────────────┘
```

### Mobile (< 768px)
```
┌─────────────────────────────────────────┐
│         Hamburger Menu                  │
├─────────────────────────────────────────┤
│                                         │
│    AI Strip Scanner Card                │
│         (100% width)                    │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│    Rx Expert Scanner Card               │
│         (100% width)                    │
│                                         │
└─────────────────────────────────────────┘
```

## 🔄 Loading States

### Scanning State
```
┌─────────────────────────────────────────┐
│  ┌────────────────────────────────┐     │
│  │  ⟳  Scanning...                │     │
│  └────────────────────────────────┘     │
└─────────────────────────────────────────┘
```

### Upload State
```
┌─────────────────────────────────────────┐
│  ┌────────────────────────────────┐     │
│  │  📷  Choose Medicine Image     │     │
│  └────────────────────────────────┘     │
└─────────────────────────────────────────┘
```

### Preview State
```
┌─────────────────────────────────────────┐
│  ┌────────────────────────────────┐     │
│  │                                │     │
│  │     [Medicine Image]           │     │
│  │                                │     │
│  └────────────────────────────────┘     │
│                                         │
│  ┌─────────────┬──────────────┐        │
│  │ 🔍 Start AI │   Reset      │        │
│  │  Scanning → │              │        │
│  └─────────────┴──────────────┘        │
└─────────────────────────────────────────┘
```

## ⚠️ Error States

### File Type Error
```
┌─────────────────────────────────────────────────────────────┐
│  ⚠️  Invalid file type. Only JPEG, PNG, and WebP images    │
│      are allowed                                            │
└─────────────────────────────────────────────────────────────┘
```

### File Size Error
```
┌─────────────────────────────────────────────────────────────┐
│  ⚠️  Image size should be less than 10MB                    │
└─────────────────────────────────────────────────────────────┘
```

### Network Error
```
┌─────────────────────────────────────────────────────────────┐
│  ⚠️  Failed to scan medicine. Please try again.             │
└─────────────────────────────────────────────────────────────┘
```

## ✅ Success States

### Medicine Added
```
┌─────────────────────────────────────────────────────────────┐
│  ✅  Paracetamol added to cart!                             │
└─────────────────────────────────────────────────────────────┘
```

### All Medicines Added
```
┌─────────────────────────────────────────────────────────────┐
│  ✅  3 medicine(s) added to cart!                           │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 Badge Styles

### NEW Badge
```
┌──────┐
│ NEW  │  Blue background, white text
└──────┘
```

### ELDERLY FRIENDLY Badge
```
┌────────────────────┐
│ ELDERLY FRIENDLY   │  Green background, white text
└────────────────────┘
```

### Confidence Badge
```
┌──────────┐
│ 85% match│  Green background, dark green text
└──────────┘
```

### Category Badge
```
┌────────┐
│ Tablet │  Purple background, dark purple text
└────────┘
```

### Strength Badge
```
┌────────┐
│ 500mg  │  Blue background, dark blue text
└────────┘
```

## 📐 Spacing & Sizing

### Card Padding
```
Top:    32px (2rem)
Right:  32px (2rem)
Bottom: 32px (2rem)
Left:   32px (2rem)
```

### Button Sizes
```
Small:   px-4 py-2 (16px x 8px)
Medium:  px-6 py-3 (24px x 12px)
Large:   px-8 py-4 (32px x 16px)
```

### Border Radius
```
Small:   4px  (rounded)
Medium:  8px  (rounded-lg)
Large:   16px (rounded-2xl)
Full:    9999px (rounded-full)
```

### Shadows
```
Small:   shadow-sm
Medium:  shadow-md
Large:   shadow-lg
XLarge:  shadow-xl
```

## 🎨 Typography

### Headings
```
H1: text-4xl font-bold (36px, 900 weight)
H2: text-2xl font-bold (24px, 900 weight)
H3: text-xl font-bold (20px, 900 weight)
```

### Body Text
```
Large:  text-lg (18px)
Normal: text-base (16px)
Small:  text-sm (14px)
XSmall: text-xs (12px)
```

### Font Weights
```
Normal:    font-normal (400)
Medium:    font-medium (500)
Semibold:  font-semibold (600)
Bold:      font-bold (700)
```

## 🖼️ Image Guidelines

### Upload Image
```
Format:     JPEG, PNG, WebP
Max Size:   10MB
Recommended: 2-5MB
Resolution: 1200x800 or higher
Aspect:     Any (will be contained)
```

### Preview Display
```
Width:  100% (full container)
Height: 192px (h-48)
Fit:    object-contain
Border: 2px solid gray-200
Radius: 8px (rounded-lg)
```

## 🎭 Animation & Transitions

### Button Hover
```
transition-colors
duration-200
hover:bg-blue-700
```

### Card Hover
```
transition-shadow
duration-300
hover:shadow-xl
```

### Loading Spinner
```
animate-spin
duration-1000
infinite
```

## 📱 Touch Targets

### Minimum Size
```
Width:  44px (iOS guideline)
Height: 44px (iOS guideline)
```

### Button Padding
```
Mobile:  px-6 py-3 (24px x 12px)
Desktop: px-4 py-2 (16px x 8px)
```

## ♿ Accessibility

### Focus States
```
focus:outline-none
focus:ring-2
focus:ring-blue-500
focus:ring-offset-2
```

### Color Contrast
```
Text on White:  4.5:1 minimum
Text on Blue:   4.5:1 minimum
Badges:         3:1 minimum
```

### Screen Reader
```
<span className="sr-only">
  Hidden text for screen readers
</span>
```

## 🎯 Icon Usage

### Feature Icons
```
📄 - Document/Strip Scanner
💊 - Prescription/Medicine
📷 - Camera/Upload
🔍 - Search/Scan
✅ - Success
⚠️ - Warning/Error
😕 - No Results
⟳ - Loading/Spinning
```

### Icon Sizes
```
Small:  w-4 h-4 (16px)
Medium: w-5 h-5 (20px)
Large:  w-8 h-8 (32px)
XLarge: w-12 h-12 (48px)
```

## 🎨 Gradient Background

### Main Background
```
bg-gradient-to-br
from-blue-50
to-indigo-100
```

### Card Background
```
bg-white
shadow-lg
rounded-2xl
```

## 📏 Layout Grid

### Container
```
max-w-7xl
mx-auto
px-4 sm:px-6 lg:px-8
```

### Grid Layout
```
grid
md:grid-cols-2
gap-8
```

## 🎯 Call-to-Action Buttons

### Primary CTA
```
bg-blue-600
hover:bg-blue-700
text-white
px-6 py-3
rounded-lg
font-medium
```

### Secondary CTA
```
bg-gray-100
hover:bg-gray-200
text-gray-700
px-4 py-2
rounded-lg
font-medium
```

This visual guide provides a complete reference for the UI design and layout of the AI Medicine Scanner feature! 🎨
