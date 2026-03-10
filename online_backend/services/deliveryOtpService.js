const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const { generateOTPWithExpiry, verifyOTP, isOTPExpired } = require('./otpService');

dotenv.config();

// Create email transporter
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

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
 * Send delivery assignment email to customer
 * @param {Object} order - Order details
 * @param {Object} user - User details
 * @param {Object} deliveryPerson - Delivery person details
 * @returns {Promise} - Result of email sending
 */
const sendDeliveryAssignmentEmail = async (order, user, deliveryPerson) => {
  const subject = `Order #${order.orderId} - Delivery Assignment Confirmation`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #10B981; padding: 20px; text-align: center; color: white;">
        <h1>📦 Delivery Assignment</h1>
        <p>Order #${order.orderId}</p>
      </div>
      
      <div style="padding: 20px; background-color: #f9f9f9;">
        <h2>Hello, ${user.displayName || user.email}!</h2>
        <p>Good news! Your order has been assigned to a delivery person and will be delivered soon.</p>
        
        <div style="background-color: white; padding: 20px; margin-top: 20px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
          <h3 style="margin-top: 0; color: #2D3748;">Delivery Information</h3>
          <p><strong>Delivery Person:</strong> ${deliveryPerson.displayName || deliveryPerson.email}</p>
          <p><strong>Contact:</strong> ${deliveryPerson.contactNumber || deliveryPerson.phone || 'Available upon arrival'}</p>
          <p><strong>Status:</strong> <span style="color: #10B981; font-weight: bold;">Assigned</span></p>
          
          <div style="background-color: #FEF3C7; padding: 15px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #F59E0B;">
            <p style="margin: 0; color: #92400E; font-weight: bold;">📋 Next Steps:</p>
            <ol style="margin: 10px 0; padding-left: 20px; color: #78350F;">
              <li>Delivery person will pick up your order from the pharmacy</li>
              <li>You will receive an OTP when they are out for delivery</li>
              <li>Share the OTP with the delivery person upon arrival</li>
              <li>Order will be delivered after OTP verification</li>
            </ol>
          </div>
        </div>
        
        <div style="margin-top: 20px; background-color: white; padding: 15px; border-radius: 5px;">
          <h3>Order Summary</h3>
          <p><strong>Order ID:</strong> #${order.orderId}</p>
          <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
          <p><strong>Total Amount:</strong> ₹${order.total.toFixed(2)}</p>
          <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
        </div>
        
        <div style="margin-top: 20px; padding: 15px; background-color: #EBF8FF; border-radius: 5px; border-left: 4px solid #3B82F6;">
          <p style="margin: 0; color: #1E40AF;"><strong>🔒 Security Notice:</strong></p>
          <p style="margin: 10px 0; color: #1E3A8A;">Your order will be delivered using a secure OTP-based verification system to ensure safe handover and prevent wrong product delivery.</p>
        </div>
      </div>
      
      <div style="padding: 20px; text-align: center; color: #666; font-size: 14px; background-color: #F3F4F6;">
        <p style="margin: 5px 0;">If you have any questions, please contact our customer service at support@medihaven.com</p>
        <p style="margin: 5px 0;">&copy; ${new Date().getFullYear()} MediHaven. All rights reserved.</p>
      </div>
    </div>
  `;
  
  return await sendEmail(user.email, subject, html);
};

/**
 * Generate and store OTP for delivery verification
 * @param {string} orderId - Order ID
 * @param {Object} firestore - Firestore instance
 * @returns {Promise<Object>} - OTP data
 */
const generateDeliveryOTP = async (orderId, firestore) => {
  try {
    const otpData = generateOTPWithExpiry(15); // 15 minutes expiry
    
    // Store OTP in Firestore
    const otpRef = firestore.collection('deliveryOTPs').doc(orderId);
    await otpRef.set({
      otp: otpData.otp,
      expiryTime: otpData.expiryTime,
      createdAt: otpData.createdAt,
      orderId: orderId,
      status: 'active'
    });
    
    return {
      success: true,
      otp: otpData.otp,
      expiryTime: otpData.expiryTime
    };
  } catch (error) {
    console.error('Error generating delivery OTP:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Verify delivery OTP
 * @param {string} orderId - Order ID
 * @param {string} providedOtp - OTP provided by delivery person
 * @param {Object} firestore - Firestore instance
 * @returns {Promise<Object>} - Verification result
 */
const verifyDeliveryOTP = async (orderId, providedOtp, firestore) => {
  try {
    const otpRef = firestore.collection('deliveryOTPs').doc(orderId);
    const otpDoc = await otpRef.get();
    
    if (!otpDoc.exists) {
      return {
        success: false,
        error: 'OTP not found for this order'
      };
    }
    
    const otpData = otpDoc.data();
    
    // Check if OTP is expired
    if (isOTPExpired(otpData)) {
      return {
        success: false,
        error: 'OTP has expired'
      };
    }
    
    // Verify OTP
    const isValid = verifyOTP(providedOtp, otpData);
    
    if (!isValid) {
      return {
        success: false,
        error: 'Invalid OTP'
      };
    }
    
    // Mark OTP as used
    await otpRef.update({
      status: 'used',
      usedAt: new Date()
    });
    
    return {
      success: true,
      message: 'OTP verified successfully'
    };
  } catch (error) {
    console.error('Error verifying delivery OTP:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Send delivery OTP email to customer
 * @param {Object} order - Order details
 * @param {Object} user - User details
 * @returns {Promise} - Result of email sending
 */
const sendDeliveryOtpEmail = async (order, user) => {
  const subject = `Delivery OTP for Order #${order.orderId}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #38B2AC; padding: 20px; text-align: center; color: white;">
        <h1>🔐 Delivery Verification OTP</h1>
        <p>Order #${order.orderId}</p>
      </div>
      
      <div style="padding: 20px; background-color: #f9f9f9;">
        <h2>Hello, ${user.displayName || user.email}!</h2>
        <p>Your order has been assigned to a delivery person and will be delivered soon.</p>
        
        <div style="background-color: white; padding: 20px; margin-top: 20px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
          <h3 style="margin-top: 0; color: #2D3748;">Delivery Information</h3>
          <p>Your order will be delivered today. Please keep your phone handy.</p>
          
          <div style="background-color: #FEF3C7; padding: 25px; margin: 20px 0; border-radius: 10px; text-align: center; border: 2px solid #F59E0B;">
            <p style="margin: 0; font-size: 14px; color: #92400E; font-weight: 600;">YOUR DELIVERY OTP</p>
            <p style="margin: 15px 0; font-size: 42px; font-weight: bold; letter-spacing: 12px; color: #1E40AF; font-family: 'Courier New', monospace;">${order.deliveryOtp}</p>
            <p style="margin: 0; font-size: 12px; color: #78350F;">Please share this code with the delivery person</p>
          </div>
          
          <div style="background-color: #FEE2E2; padding: 15px; border-radius: 5px; border-left: 4px solid #DC2626;">
            <p style="margin: 0; color: #DC2626; font-weight: bold;">⚠️ IMPORTANT SECURITY NOTICE</p>
            <ul style="margin: 10px 0; padding-left: 20px; color: #991B1B;">
              <li>Share this OTP ONLY with the delivery person</li>
              <li>Do not share this OTP via phone, SMS, or email</li>
              <li>Verify the delivery person's identity before sharing</li>
              <li>This OTP ensures you receive the correct product</li>
            </ul>
          </div>
        </div>
        
        <div style="margin-top: 20px; background-color: white; padding: 15px; border-radius: 5px;">
          <h3>Order Summary</h3>
          <p><strong>Order ID:</strong> #${order.orderId}</p>
          <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
          <p><strong>Total Amount:</strong> ₹${order.total.toFixed(2)}</p>
          <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
        </div>
        
        <div style="margin-top: 20px; padding: 15px; background-color: #EBF8FF; border-radius: 5px; border-left: 4px solid #3B82F6;">
          <p style="margin: 0; color: #1E40AF;"><strong>💡 How it works:</strong></p>
          <ol style="margin: 10px 0; padding-left: 20px; color: #1E3A8A;">
            <li>Delivery person will arrive at your location</li>
            <li>They will ask for your delivery OTP</li>
            <li>Share the 6-digit OTP shown above</li>
            <li>Delivery person enters OTP in their system</li>
            <li>Order is marked as delivered successfully</li>
          </ol>
        </div>
      </div>
      
      <div style="padding: 20px; text-align: center; color: #666; font-size: 14px; background-color: #F3F4F6;">
        <p style="margin: 5px 0;">This OTP-based delivery ensures secure handover and prevents wrong product delivery.</p>
        <p style="margin: 5px 0;">If you have any questions, please contact our customer service at support@medihaven.com</p>
        <p style="margin: 5px 0;">&copy; ${new Date().getFullYear()} MediHaven. All rights reserved.</p>
      </div>
    </div>
  `;
  
  return await sendEmail(user.email, subject, html);
};

module.exports = {
  sendEmail,
  sendDeliveryAssignmentEmail,
  sendDeliveryOtpEmail,
  generateDeliveryOTP,
  verifyDeliveryOTP
};
