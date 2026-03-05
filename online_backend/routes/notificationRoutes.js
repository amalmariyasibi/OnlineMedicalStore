const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const notificationController = require('../controllers/notificationController');

// Route to send email notification (admin only)
router.post(
  '/email',
  protect,
  authorize('admin'),
  notificationController.sendEmailNotification
);

// Route to send order confirmation email
router.post(
  '/order-confirmation',
  protect,
  authorize('admin'),
  notificationController.sendOrderConfirmation
);

// Route to send order status update email
router.post(
  '/order-status-update',
  protect,
  authorize('admin', 'delivery'),
  notificationController.sendOrderStatusUpdate
);

// Route to send delivery assignment notification
router.post(
  '/delivery-assignment',
  protect,
  authorize('admin'),
  notificationController.sendDeliveryAssignment
);

// Route to generate OTP for delivery confirmation
router.post(
  '/generate-otp',
  protect,
  authorize('admin', 'delivery'),
  notificationController.generateDeliveryOTP
);

// Route to send push notification (admin only)
router.post(
  '/push',
  protect,
  authorize('admin'),
  notificationController.sendPushNotification
);

module.exports = router;