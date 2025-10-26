const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const router = express.Router();

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Quick diagnostics to verify env configuration
router.get('/config', (req, res) => {
  console.log('Payment config endpoint called');
  const hasKeyId = Boolean(process.env.RAZORPAY_KEY_ID);
  const hasKeySecret = Boolean(process.env.RAZORPAY_KEY_SECRET);
  
  // Log configuration status
  if (!hasKeyId || !hasKeySecret) {
    console.warn('Razorpay configuration incomplete:', {
      hasKeyId,
      hasKeySecret,
    });
  } else {
    console.log('Razorpay configuration verified successfully');
  }
  
  return res.json({
    success: true,
    hasKeyId,
    hasKeySecret,
    keyIdPreview: process.env.RAZORPAY_KEY_ID ? String(process.env.RAZORPAY_KEY_ID).slice(0, 8) + '***' : null,
    timestamp: new Date().toISOString(),
  });
});

// Create Razorpay order
router.post('/create-order', async (req, res) => {
  console.log('Create order endpoint called');
  try {
    const { amount, currency, receipt, userId, userEmail, items, deliveryAddress } = req.body;
    console.log('Order request received:', { amount, currency, receipt, userId });

    // Validate required fields
    if (!amount || !currency || !receipt) {
      console.error('Missing required fields for order creation');
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: amount, currency, receipt'
      });
    }

    // Validate Razorpay configuration
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error('Razorpay configuration missing');
      return res.status(500).json({
        success: false,
        error: 'Payment gateway not properly configured'
      });
    }

    // Create order options
    const options = {
      amount: parseInt(amount), // amount in paise
      currency: currency || 'INR',
      receipt: receipt,
      notes: {
        userId: userId || 'guest',
        userEmail: userEmail || '',
        itemCount: items?.length || 0,
        deliveryCity: deliveryAddress?.city || '',
        deliveryState: deliveryAddress?.state || ''
      }
    };

    console.log('Creating Razorpay order with options:', options);
    
    // Create order with Razorpay
    const order = await razorpay.orders.create(options);
    console.log('Razorpay order created successfully:', order.id);

    console.log('Razorpay order created:', order.id);

    res.json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
        status: order.status,
        created_at: order.created_at
      }
    });

  } catch (error) {
    // Extract as much detail as possible from Razorpay error
    const detailed = {
      message: error?.message,
      description: error?.error?.description,
      field: error?.error?.field,
      step: error?.error?.step,
      reason: error?.error?.reason,
      statusCode: error?.statusCode,
    };
    console.error('Error creating Razorpay order:', detailed, error);
    res.status(500).json({
      success: false,
      error: 'Failed to create payment order',
      details: detailed
    });
  }
});

// Verify payment
router.post('/verify', async (req, res) => {
  console.log('Payment verification request received');
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    console.log('Verifying payment:', { razorpay_order_id, razorpay_payment_id });

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      console.error('Missing required payment verification fields');
      return res.status(400).json({
        success: false,
        error: 'Missing required payment verification fields'
      });
    }

    // Validate Razorpay configuration
    if (!process.env.RAZORPAY_KEY_SECRET) {
      console.error('Razorpay key secret missing for signature verification');
      return res.status(500).json({
        success: false,
        error: 'Payment verification configuration error'
      });
    }

    // Create signature for verification
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    // Verify signature
    const isAuthentic = expectedSignature === razorpay_signature;
    console.log('Signature verification result:', isAuthentic);

    if (isAuthentic) {
      console.log('Payment signature verified successfully:', razorpay_payment_id);
      
      // You can also fetch payment details from Razorpay for additional verification
      try {
        console.log('Fetching payment details from Razorpay...');
        const payment = await razorpay.payments.fetch(razorpay_payment_id);
        console.log('Payment details retrieved:', {
          id: payment.id,
          status: payment.status,
          amount: payment.amount,
          currency: payment.currency
        });
        
        res.json({
          success: true,
          message: 'Payment verified successfully',
          payment: {
            id: payment.id,
            amount: payment.amount,
            currency: payment.currency,
            status: payment.status,
            method: payment.method,
            created_at: payment.created_at
          }
        });
      } catch (fetchError) {
        console.error('Error fetching payment details:', fetchError);
        // Still return success if signature verification passed
        res.json({
          success: true,
          message: 'Payment verified successfully (signature match)',
          verified: true
        });
      }
    } else {
      console.error('Payment verification failed - signature mismatch');
      res.status(400).json({
        success: false,
        error: 'Payment verification failed',
        message: 'Invalid signature'
      });
    }

  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({
      success: false,
      error: 'Payment verification failed',
      message: error.message
    });
  }
});

// Get payment details
router.get('/payment/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;
    
    const payment = await razorpay.payments.fetch(paymentId);
    
    res.json({
      success: true,
      payment: {
        id: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        method: payment.method,
        email: payment.email,
        contact: payment.contact,
        created_at: payment.created_at,
        order_id: payment.order_id
      }
    });

  } catch (error) {
    console.error('Error fetching payment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payment details',
      message: error.message
    });
  }
});

// Webhook endpoint for Razorpay events
router.post('/webhook', (req, res) => {
  try {
    const webhookSignature = req.headers['x-razorpay-signature'];
    const webhookBody = JSON.stringify(req.body);
    
    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET)
      .update(webhookBody)
      .digest('hex');

    if (webhookSignature === expectedSignature) {
      const event = req.body.event;
      const paymentEntity = req.body.payload.payment.entity;
      
      console.log('Webhook received:', event, paymentEntity.id);
      
      // Handle different webhook events
      switch (event) {
        case 'payment.captured':
          console.log('Payment captured:', paymentEntity.id);
          // Update order status in your database
          break;
        case 'payment.failed':
          console.log('Payment failed:', paymentEntity.id);
          // Handle failed payment
          break;
        default:
          console.log('Unhandled webhook event:', event);
      }
      
      res.json({ status: 'ok' });
    } else {
      console.error('Invalid webhook signature');
      res.status(400).json({ error: 'Invalid signature' });
    }

  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

module.exports = router;
