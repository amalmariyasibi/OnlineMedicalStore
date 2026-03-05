const nodemailer = require('nodemailer');
const admin = require('firebase-admin');
const dotenv = require('dotenv');

dotenv.config();

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
      databaseURL: process.env.FIREBASE_DATABASE_URL
    });
  } catch (error) {
    console.error('Firebase admin initialization error:', error);
  }
}

// Create email transporter
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

/**
 * Generate a random OTP
 * @param {number} length - Length of OTP
 * @returns {string} - Generated OTP
 */
const generateOTP = (length = 6) => {
  const digits = '0123456789';
  let OTP = '';
  
  for (let i = 0; i < length; i++) {
    OTP += digits[Math.floor(Math.random() * 10)];
  }
  
  return OTP;
};

/**
 * Send email notification
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} html - Email content in HTML format
 * @returns {Promise} - Result of email sending
 */
const sendEmail = async (to, subject, html) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send order confirmation email to customer
 * @param {Object} order - Order details
 * @param {Object} user - User details
 * @returns {Promise} - Result of email sending
 */
const sendOrderConfirmationEmail = async (order, user) => {
  const subject = `Order Confirmation - #${order.orderId}`;
  
  // Create HTML content for the email
  let itemsList = '';
  order.items.forEach(item => {
    itemsList += `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">₹${item.price.toFixed(2)}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">₹${(item.price * item.quantity).toFixed(2)}</td>
      </tr>
    `;
  });

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #4F46E5; padding: 20px; text-align: center; color: white;">
        <h1>Order Confirmation</h1>
        <p>Order #${order.orderId}</p>
      </div>
      
      <div style="padding: 20px; background-color: #f9f9f9;">
        <h2>Thank you for your order, ${user.displayName || user.email}!</h2>
        <p>We've received your order and will process it shortly.</p>
        
        <div style="background-color: white; padding: 15px; margin-top: 20px; border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
          <h3>Order Summary</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #f2f2f2;">
                <th style="padding: 10px; text-align: left;">Item</th>
                <th style="padding: 10px; text-align: left;">Quantity</th>
                <th style="padding: 10px; text-align: left;">Price</th>
                <th style="padding: 10px; text-align: left;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsList}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3" style="padding: 10px; text-align: right; font-weight: bold;">Subtotal:</td>
                <td style="padding: 10px;">₹${order.subtotal.toFixed(2)}</td>
              </tr>
              <tr>
                <td colspan="3" style="padding: 10px; text-align: right; font-weight: bold;">Shipping:</td>
                <td style="padding: 10px;">₹${order.shippingFee.toFixed(2)}</td>
              </tr>
              <tr>
                <td colspan="3" style="padding: 10px; text-align: right; font-weight: bold;">Tax:</td>
                <td style="padding: 10px;">₹${order.tax.toFixed(2)}</td>
              </tr>
              <tr style="background-color: #f2f2f2;">
                <td colspan="3" style="padding: 10px; text-align: right; font-weight: bold;">Total:</td>
                <td style="padding: 10px; font-weight: bold;">₹${order.total.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        
        <div style="margin-top: 20px;">
          <h3>Shipping Address</h3>
          <p>
            ${order.shippingAddress.name}<br>
            ${order.shippingAddress.street}<br>
            ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zip}<br>
            ${order.shippingAddress.country || 'India'}<br>
            Phone: ${order.shippingAddress.phone}
          </p>
        </div>
        
        <div style="margin-top: 20px;">
          <h3>Payment Information</h3>
          <p>Payment Method: ${order.paymentMethod}</p>
          <p>Payment Status: ${order.paymentStatus || 'Pending'}</p>
        </div>
      </div>
      
      <div style="padding: 20px; text-align: center; color: #666; font-size: 14px;">
        <p>If you have any questions, please contact our customer service at support@medihaven.com</p>
        <p>&copy; ${new Date().getFullYear()} MediHaven. All rights reserved.</p>
      </div>
    </div>
  `;
  
  return await sendEmail(user.email, subject, html);
};

/**
 * Send order status update email to customer
 * @param {Object} order - Order details
 * @param {Object} user - User details
 * @param {string} status - New order status
 * @returns {Promise} - Result of email sending
 */
const sendOrderStatusUpdateEmail = async (order, user, status) => {
  const subject = `Order Status Update - #${order.orderId}`;
  
  let statusMessage = '';
  let statusColor = '';
  
  switch (status) {
    case 'Processing':
      statusMessage = 'Your order is now being processed.';
      statusColor = '#FFA500'; // Orange
      break;
    case 'Shipped':
      statusMessage = 'Your order has been shipped and is on its way to you.';
      statusColor = '#4299E1'; // Blue
      break;
    case 'Ready for Delivery':
      statusMessage = 'Your order is ready for delivery and will be delivered soon.';
      statusColor = '#9F7AEA'; // Purple
      break;
    case 'Out for Delivery':
      statusMessage = 'Your order is out for delivery and will arrive today.';
      statusColor = '#38B2AC'; // Teal
      break;
    case 'Delivered':
      statusMessage = 'Your order has been delivered. Thank you for shopping with us!';
      statusColor = '#48BB78'; // Green
      break;
    case 'Cancelled':
      statusMessage = 'Your order has been cancelled.';
      statusColor = '#F56565'; // Red
      break;
    default:
      statusMessage = `Your order status has been updated to: ${status}`;
      statusColor = '#4F46E5'; // Indigo
  }
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: ${statusColor}; padding: 20px; text-align: center; color: white;">
        <h1>Order Status Update</h1>
        <p>Order #${order.orderId}</p>
      </div>
      
      <div style="padding: 20px; background-color: #f9f9f9;">
        <h2>Hello, ${user.displayName || user.email}!</h2>
        <p>We're writing to inform you that your order status has been updated.</p>
        
        <div style="background-color: white; padding: 15px; margin-top: 20px; border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
          <h3>New Status: <span style="color: ${statusColor};">${status}</span></h3>
          <p>${statusMessage}</p>
          
          ${status === 'Out for Delivery' ? `
            <div style="background-color: #EBF8FF; padding: 15px; margin-top: 15px; border-radius: 5px; border-left: 4px solid #4299E1;">
              <h4 style="margin-top: 0;">Delivery Information</h4>
              <p>Your order will be delivered today. Please keep your phone handy.</p>
              <p><strong>Delivery OTP: ${order.deliveryOtp}</strong></p>
              <p>Please share this OTP with the delivery person to confirm receipt of your order.</p>
            </div>
          ` : ''}
        </div>
        
        <div style="margin-top: 20px;">
          <h3>Order Summary</h3>
          <p>Order Date: ${new Date(order.createdAt).toLocaleDateString()}</p>
          <p>Total Amount: ₹${order.total.toFixed(2)}</p>
          <p>Payment Method: ${order.paymentMethod}</p>
        </div>
      </div>
      
      <div style="padding: 20px; text-align: center; color: #666; font-size: 14px;">
        <p>If you have any questions, please contact our customer service at support@medihaven.com</p>
        <p>&copy; ${new Date().getFullYear()} MediHaven. All rights reserved.</p>
      </div>
    </div>
  `;
  
  return await sendEmail(user.email, subject, html);
};

/**
 * Send delivery assignment notification to delivery person
 * @param {Object} order - Order details
 * @param {Object} deliveryPerson - Delivery person details
 * @returns {Promise} - Result of email sending
 */
const sendDeliveryAssignmentEmail = async (order, deliveryPerson) => {
  const subject = `New Delivery Assignment - Order #${order.orderId}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #4F46E5; padding: 20px; text-align: center; color: white;">
        <h1>New Delivery Assignment</h1>
        <p>Order #${order.orderId}</p>
      </div>
      
      <div style="padding: 20px; background-color: #f9f9f9;">
        <h2>Hello, ${deliveryPerson.displayName || deliveryPerson.email}!</h2>
        <p>You have been assigned a new delivery.</p>
        
        <div style="background-color: white; padding: 15px; margin-top: 20px; border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
          <h3>Delivery Details</h3>
          <p><strong>Order ID:</strong> #${order.orderId}</p>
          <p><strong>Customer Name:</strong> ${order.shippingAddress.name}</p>
          <p><strong>Delivery Address:</strong></p>
          <p>
            ${order.shippingAddress.street}<br>
            ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zip}<br>
            ${order.shippingAddress.country || 'India'}<br>
            Phone: ${order.shippingAddress.phone}
          </p>
          
          <div style="background-color: #FFF5F5; padding: 15px; margin-top: 15px; border-radius: 5px; border-left: 4px solid #F56565;">
            <h4 style="margin-top: 0;">Important</h4>
            <p>The customer will need to provide the following OTP to confirm delivery:</p>
            <p style="font-size: 24px; font-weight: bold; text-align: center; letter-spacing: 5px; margin: 15px 0;">${order.deliveryOtp}</p>
            <p>Please ensure you collect this OTP upon delivery.</p>
          </div>
        </div>
      </div>
      
      <div style="padding: 20px; text-align: center; color: #666; font-size: 14px;">
        <p>If you have any questions, please contact your supervisor.</p>
        <p>&copy; ${new Date().getFullYear()} MediHaven. All rights reserved.</p>
      </div>
    </div>
  `;
  
  return await sendEmail(deliveryPerson.email, subject, html);
};

/**
 * Send push notification to delivery person
 * @param {string} userId - User ID of delivery person
 * @param {Object} notification - Notification details
 * @returns {Promise} - Result of push notification
 */
const sendPushNotification = async (userId, notification) => {
  try {
    // Get user's FCM tokens from Firestore
    const userDoc = await admin.firestore().collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return { success: false, error: 'User not found' };
    }
    
    const userData = userDoc.data();
    const fcmTokens = userData.fcmTokens || [];
    
    if (fcmTokens.length === 0) {
      return { success: false, error: 'No FCM tokens found for user' };
    }
    
    // Send notification to all user's devices
    const messages = fcmTokens.map(token => ({
      token,
      notification: {
        title: notification.title,
        body: notification.body
      },
      data: notification.data || {}
    }));
    
    const response = await admin.messaging().sendAll(messages);
    
    console.log('Push notifications sent:', response.successCount);
    
    return { 
      success: true, 
      successCount: response.successCount,
      failureCount: response.failureCount
    };
  } catch (error) {
    console.error('Error sending push notification:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send delivery assignment push notification
 * @param {string} deliveryPersonId - User ID of delivery person
 * @param {Object} order - Order details
 * @returns {Promise} - Result of push notification
 */
const sendDeliveryAssignmentPushNotification = async (deliveryPersonId, order) => {
  const notification = {
    title: 'New Delivery Assignment',
    body: `You have been assigned Order #${order.orderId} for delivery`,
    data: {
      type: 'delivery_assignment',
      orderId: order.orderId,
      customerName: order.shippingAddress.name,
      customerAddress: `${order.shippingAddress.street}, ${order.shippingAddress.city}`,
      customerPhone: order.shippingAddress.phone
    }
  };
  
  return await sendPushNotification(deliveryPersonId, notification);
};

/**
 * Send order status update push notification
 * @param {string} deliveryPersonId - User ID of delivery person
 * @param {Object} order - Order details
 * @param {string} status - New order status
 * @returns {Promise} - Result of push notification
 */
const sendOrderStatusUpdatePushNotification = async (deliveryPersonId, order, status) => {
  const notification = {
    title: 'Order Status Update',
    body: `Order #${order.orderId} status has been updated to ${status}`,
    data: {
      type: 'order_status_update',
      orderId: order.orderId,
      status: status
    }
  };
  
  return await sendPushNotification(deliveryPersonId, notification);
};

module.exports = {
  generateOTP,
  sendEmail,
  sendOrderConfirmationEmail,
  sendOrderStatusUpdateEmail,
  sendDeliveryAssignmentEmail,
  sendPushNotification,
  sendDeliveryAssignmentPushNotification,
  sendOrderStatusUpdatePushNotification
};