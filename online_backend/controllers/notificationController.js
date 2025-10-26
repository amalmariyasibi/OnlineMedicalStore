const notificationService = require('../services/notificationService');

/**
 * Send email notification
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const sendEmailNotification = async (req, res) => {
  try {
    const { to, subject, html } = req.body;
    
    if (!to || !subject || !html) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email recipient, subject, and content are required' 
      });
    }
    
    const result = await notificationService.sendEmail(to, subject, html);
    
    if (result.success) {
      return res.status(200).json({
        success: true,
        message: 'Email sent successfully',
        messageId: result.messageId
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Failed to send email',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error in sendEmailNotification controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Send order confirmation email
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const sendOrderConfirmation = async (req, res) => {
  try {
    const { order, user } = req.body;
    
    if (!order || !user) {
      return res.status(400).json({ 
        success: false, 
        message: 'Order and user details are required' 
      });
    }
    
    const result = await notificationService.sendOrderConfirmationEmail(order, user);
    
    if (result.success) {
      return res.status(200).json({
        success: true,
        message: 'Order confirmation email sent successfully',
        messageId: result.messageId
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Failed to send order confirmation email',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error in sendOrderConfirmation controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Send order status update email
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const sendOrderStatusUpdate = async (req, res) => {
  try {
    const { order, user, status } = req.body;
    
    if (!order || !user || !status) {
      return res.status(400).json({ 
        success: false, 
        message: 'Order, user, and status details are required' 
      });
    }
    
    const result = await notificationService.sendOrderStatusUpdateEmail(order, user, status);
    
    if (result.success) {
      return res.status(200).json({
        success: true,
        message: 'Order status update email sent successfully',
        messageId: result.messageId
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Failed to send order status update email',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error in sendOrderStatusUpdate controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Send delivery assignment notification
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const sendDeliveryAssignment = async (req, res) => {
  try {
    const { order, deliveryPerson } = req.body;
    
    if (!order || !deliveryPerson) {
      return res.status(400).json({ 
        success: false, 
        message: 'Order and delivery person details are required' 
      });
    }
    
    // Send email notification
    const emailResult = await notificationService.sendDeliveryAssignmentEmail(order, deliveryPerson);
    
    // Send push notification if delivery person has an ID
    let pushResult = { success: false, error: 'Push notification not attempted' };
    if (deliveryPerson.uid) {
      pushResult = await notificationService.sendDeliveryAssignmentPushNotification(
        deliveryPerson.uid, 
        order
      );
    }
    
    return res.status(200).json({
      success: true,
      email: emailResult,
      push: pushResult,
      message: 'Delivery assignment notifications sent'
    });
  } catch (error) {
    console.error('Error in sendDeliveryAssignment controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Generate OTP for delivery confirmation
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const generateDeliveryOTP = async (req, res) => {
  try {
    const { length } = req.body;
    
    const otp = notificationService.generateOTP(length || 6);
    
    return res.status(200).json({
      success: true,
      otp
    });
  } catch (error) {
    console.error('Error in generateDeliveryOTP controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Send push notification
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
const sendPushNotification = async (req, res) => {
  try {
    const { userId, notification } = req.body;
    
    if (!userId || !notification) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID and notification details are required' 
      });
    }
    
    const result = await notificationService.sendPushNotification(userId, notification);
    
    if (result.success) {
      return res.status(200).json({
        success: true,
        message: 'Push notification sent successfully',
        successCount: result.successCount,
        failureCount: result.failureCount
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Failed to send push notification',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error in sendPushNotification controller:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

module.exports = {
  sendEmailNotification,
  sendOrderConfirmation,
  sendOrderStatusUpdate,
  sendDeliveryAssignment,
  generateDeliveryOTP,
  sendPushNotification
};