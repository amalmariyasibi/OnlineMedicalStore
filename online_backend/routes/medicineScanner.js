const express = require('express');
const router = express.Router();
const multer = require('multer');
const medicineScannerController = require('../controllers/medicineScannerController');
const { protectFirebase } = require('../middleware/authMiddleware');

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed'));
    }
  }
});

// Scan medicine image
router.post('/scan', protectFirebase, upload.single('image'), medicineScannerController.scanMedicine);

// Get scanner statistics (admin only)
router.get('/stats', protectFirebase, medicineScannerController.getScannerStats);

module.exports = router;
