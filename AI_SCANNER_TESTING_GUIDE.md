# AI Medicine Scanner - Testing Guide

## 🧪 Complete Testing Instructions

### Prerequisites
1. Backend server running on port 4321
2. Frontend server running on port 3000
3. MongoDB connected
4. User account created and logged in

## 📦 Setup Instructions

### Step 1: Seed Medicine Database
```bash
cd online_backend
npm run seed:medicines
```

Expected output:
```
Connected to MongoDB
Cleared existing medicines
✅ Successfully seeded 10 medicines

Inserted Medicines:
1. Paracetamol - 500mg - ₹25.50
2. Ibuprofen - 400mg - ₹45.00
3. Amoxicillin - 500mg - ₹120.00
...
```

### Step 2: Start Backend Server
```bash
cd online_backend
npm start
```

Expected output:
```
🚀 Server running on http://localhost:4321
MongoDB Connected
```

### Step 3: Start Frontend Server
```bash
cd online_frontend
npm start
```

Expected output:
```
Compiled successfully!
You can now view online_frontend in the browser.
Local: http://localhost:3000
```

## 🧪 Test Cases

### Test Case 1: Access Scanner Page
**Objective**: Verify user can access the scanner page

**Steps**:
1. Open browser to `http://localhost:3000`
2. Login with valid credentials
3. Click "AI Scanner" in navigation menu

**Expected Result**:
- Page loads successfully
- Shows "Specialized AI Features" heading
- Displays two feature cards:
  - AI Strip Scanner (with NEW and ELDERLY FRIENDLY badges)
  - Rx Expert Scanner
- "Choose Medicine Image" button is visible

**Status**: ✅ Pass / ❌ Fail

---

### Test Case 2: Upload Valid Image
**Objective**: Test image upload functionality

**Steps**:
1. Navigate to AI Scanner page
2. Click "Choose Medicine Image" button
3. Select a valid image file (JPEG/PNG)
4. Verify image preview appears

**Expected Result**:
- File input dialog opens
- Selected image displays in preview area
- Preview shows image clearly
- "Start AI Scanning" button becomes enabled
- "Reset" button appears

**Status**: ✅ Pass / ❌ Fail

---

### Test Case 3: Invalid File Type
**Objective**: Verify file type validation

**Steps**:
1. Navigate to AI Scanner page
2. Try to upload a PDF or text file

**Expected Result**:
- Error message: "Invalid file type. Only JPEG, PNG, and WebP images are allowed"
- No image preview shown
- Scan button remains disabled

**Status**: ✅ Pass / ❌ Fail

---

### Test Case 4: File Size Validation
**Objective**: Test file size limit

**Steps**:
1. Navigate to AI Scanner page
2. Try to upload an image larger than 10MB

**Expected Result**:
- Error message: "Image size should be less than 10MB"
- No image preview shown
- Scan button remains disabled

**Status**: ✅ Pass / ❌ Fail

---

### Test Case 5: Scan Medicine Image
**Objective**: Test OCR and medicine detection

**Steps**:
1. Upload a clear image of medicine strip (e.g., Paracetamol)
2. Click "Start AI Scanning" button
3. Wait for processing

**Expected Result**:
- Button shows "Scanning..." with spinner
- After 3-5 seconds, results appear
- Detected medicines displayed with:
  - Medicine name
  - Manufacturer
  - Strength
  - Category badge
  - Confidence percentage
  - Price
  - "Add to Cart" button
- "Add All to Cart" button at top

**Status**: ✅ Pass / ❌ Fail

---

### Test Case 6: No Medicine Detected
**Objective**: Test handling when no medicine is found

**Steps**:
1. Upload an image without medicine text
2. Click "Start AI Scanning"

**Expected Result**:
- Scan completes
- Shows message: "No medicines detected in the image. Please try with a clearer image of the medicine strip."
- Empty state icon displayed
- No medicines in results list

**Status**: ✅ Pass / ❌ Fail

---

### Test Case 7: Add Single Medicine to Cart
**Objective**: Test adding individual medicine

**Steps**:
1. Scan an image successfully
2. Click "Add to Cart" on one medicine
3. Check cart icon

**Expected Result**:
- Alert: "[Medicine Name] added to cart!"
- Cart icon count increases by 1
- Medicine added to cart

**Status**: ✅ Pass / ❌ Fail

---

### Test Case 8: Add All Medicines to Cart
**Objective**: Test bulk add functionality

**Steps**:
1. Scan image with multiple medicines detected
2. Click "Add All to Cart" button
3. Verify redirect to cart page

**Expected Result**:
- Alert: "[X] medicine(s) added to cart!"
- Redirects to /cart page
- All medicines appear in cart
- Cart total updated

**Status**: ✅ Pass / ❌ Fail

---

### Test Case 9: Reset Functionality
**Objective**: Test reset button

**Steps**:
1. Upload and scan an image
2. Click "Reset" button

**Expected Result**:
- Image preview clears
- Scan results disappear
- File input resets
- Back to initial state
- Can upload new image

**Status**: ✅ Pass / ❌ Fail

---

### Test Case 10: Rx Expert Scanner Link
**Objective**: Test navigation to prescription scanner

**Steps**:
1. Navigate to AI Scanner page
2. Click "Scan Prescription →" button in Rx Expert Scanner card

**Expected Result**:
- Redirects to /prescription-scanner page
- Prescription scanner page loads

**Status**: ✅ Pass / ❌ Fail

---

### Test Case 11: Mobile Responsiveness
**Objective**: Test on mobile devices

**Steps**:
1. Open page on mobile device or use browser dev tools
2. Test all functionality

**Expected Result**:
- Layout adapts to mobile screen
- Buttons are touch-friendly
- Images display correctly
- All features work on mobile

**Status**: ✅ Pass / ❌ Fail

---

### Test Case 12: Authentication Required
**Objective**: Verify authentication protection

**Steps**:
1. Logout from application
2. Try to access /medicine-scanner directly

**Expected Result**:
- Redirects to login page
- Cannot access scanner without login
- After login, can access scanner

**Status**: ✅ Pass / ❌ Fail

---

### Test Case 13: Multiple Scans
**Objective**: Test consecutive scans

**Steps**:
1. Scan first image
2. Click Reset
3. Upload and scan second image
4. Repeat 3-4 times

**Expected Result**:
- Each scan works independently
- No memory leaks
- Results clear between scans
- Performance remains consistent

**Status**: ✅ Pass / ❌ Fail

---

### Test Case 14: Network Error Handling
**Objective**: Test error handling

**Steps**:
1. Stop backend server
2. Try to scan an image

**Expected Result**:
- Error message displayed
- User-friendly error text
- Scan button re-enables
- Can retry after server restart

**Status**: ✅ Pass / ❌ Fail

---

### Test Case 15: Confidence Score Display
**Objective**: Verify confidence scoring

**Steps**:
1. Scan various quality images
2. Check confidence percentages

**Expected Result**:
- Clear images: 70-100% confidence
- Moderate images: 40-70% confidence
- Poor images: Below 40% or no detection
- Confidence badge shows percentage

**Status**: ✅ Pass / ❌ Fail

---

## 🎯 Performance Testing

### Load Time Test
**Objective**: Measure page load time

**Steps**:
1. Open browser dev tools
2. Navigate to scanner page
3. Check Network tab

**Expected Result**:
- Page loads in < 2 seconds
- All assets load successfully
- No console errors

**Metrics**:
- Load time: _____ ms
- Total size: _____ KB
- Requests: _____

---

### Scan Time Test
**Objective**: Measure scan processing time

**Steps**:
1. Upload test image
2. Start timer when clicking scan
3. Stop when results appear

**Expected Result**:
- Small images (< 2MB): 3-5 seconds
- Medium images (2-5MB): 5-8 seconds
- Large images (5-10MB): 8-12 seconds

**Metrics**:
- Small image: _____ seconds
- Medium image: _____ seconds
- Large image: _____ seconds

---

## 🔍 Edge Cases

### Edge Case 1: Very Blurry Image
**Test**: Upload extremely blurry image
**Expected**: No detection or very low confidence

### Edge Case 2: Multiple Medicine Strips
**Test**: Upload image with 3+ medicine strips
**Expected**: Detects all visible medicines

### Edge Case 3: Partial Text Visible
**Test**: Upload image with partially visible text
**Expected**: May detect with lower confidence

### Edge Case 4: Non-English Text
**Test**: Upload medicine with non-English text
**Expected**: May not detect or low confidence

### Edge Case 5: Damaged Strip
**Test**: Upload image of damaged/worn strip
**Expected**: Low confidence or no detection

---

## 📊 Test Results Summary

| Test Case | Status | Notes |
|-----------|--------|-------|
| 1. Access Scanner | ⬜ | |
| 2. Upload Valid Image | ⬜ | |
| 3. Invalid File Type | ⬜ | |
| 4. File Size Validation | ⬜ | |
| 5. Scan Medicine | ⬜ | |
| 6. No Medicine Detected | ⬜ | |
| 7. Add Single to Cart | ⬜ | |
| 8. Add All to Cart | ⬜ | |
| 9. Reset Functionality | ⬜ | |
| 10. Rx Expert Link | ⬜ | |
| 11. Mobile Responsive | ⬜ | |
| 12. Authentication | ⬜ | |
| 13. Multiple Scans | ⬜ | |
| 14. Network Error | ⬜ | |
| 15. Confidence Score | ⬜ | |

**Legend**: ✅ Pass | ❌ Fail | ⬜ Not Tested

---

## 🐛 Bug Report Template

If you find any issues, report using this format:

```
**Bug Title**: [Brief description]

**Severity**: Critical / High / Medium / Low

**Steps to Reproduce**:
1. 
2. 
3. 

**Expected Result**:
[What should happen]

**Actual Result**:
[What actually happened]

**Screenshots**:
[Attach if applicable]

**Environment**:
- Browser: 
- OS: 
- Screen size: 

**Console Errors**:
[Copy any error messages]
```

---

## 🎨 UI/UX Checklist

- [ ] Colors match design system
- [ ] Fonts are consistent
- [ ] Spacing is uniform
- [ ] Buttons have hover states
- [ ] Loading states are clear
- [ ] Error messages are helpful
- [ ] Success feedback is visible
- [ ] Icons are appropriate
- [ ] Layout is balanced
- [ ] Responsive on all screens

---

## ♿ Accessibility Testing

- [ ] Keyboard navigation works
- [ ] Screen reader compatible
- [ ] Color contrast sufficient
- [ ] Focus indicators visible
- [ ] Alt text on images
- [ ] ARIA labels present
- [ ] Error messages announced
- [ ] Form labels associated

---

## 🔐 Security Testing

- [ ] Authentication required
- [ ] File type validation works
- [ ] File size limits enforced
- [ ] No XSS vulnerabilities
- [ ] API endpoints protected
- [ ] JWT tokens validated
- [ ] CORS configured correctly
- [ ] No sensitive data exposed

---

## 📱 Browser Compatibility

Test on these browsers:

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Chrome
- [ ] Mobile Safari

---

## 🚀 Deployment Checklist

Before deploying to production:

- [ ] All tests pass
- [ ] No console errors
- [ ] Performance acceptable
- [ ] Mobile tested
- [ ] Security verified
- [ ] Documentation complete
- [ ] Error handling robust
- [ ] Loading states implemented
- [ ] Analytics integrated
- [ ] Monitoring setup

---

## 📝 Test Data

### Sample Medicine Names for Testing
- Paracetamol
- Ibuprofen
- Amoxicillin
- Cetirizine
- Omeprazole
- Metformin
- Aspirin
- Azithromycin
- Vitamin D3
- Cough Syrup

### Test Image Requirements
- Format: JPEG or PNG
- Size: 1-5 MB
- Resolution: 1200x800 or higher
- Content: Clear medicine strip with visible text
- Lighting: Good, natural light
- Focus: Sharp, not blurry

---

## 🎓 Testing Tips

1. **Test with real images**: Use actual medicine strip photos
2. **Vary image quality**: Test with different qualities
3. **Test edge cases**: Try unusual scenarios
4. **Check console**: Monitor for errors
5. **Test on mobile**: Don't forget mobile devices
6. **Document issues**: Keep track of bugs found
7. **Retest fixes**: Verify bug fixes work
8. **Performance monitor**: Watch for slowdowns

---

## ✅ Sign-off

**Tester Name**: _________________

**Date**: _________________

**Overall Status**: ✅ Pass / ❌ Fail / ⚠️ Pass with Issues

**Comments**:
_________________________________________________
_________________________________________________
_________________________________________________

**Ready for Production**: Yes / No
