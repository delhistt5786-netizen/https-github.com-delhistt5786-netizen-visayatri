const express     = require('express');
const router      = require('express').Router();
const Razorpay    = require('razorpay');
const crypto      = require('crypto');
const Application = require('../models/Application');
const Payment     = require('../models/Payment');
const { protect } = require('../middleware/auth');

/* ── Singleton Razorpay instance ─────────────────────────── */
let _rzp = null;
const getRzp = () => {
  if (!_rzp) {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error('Razorpay keys not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env');
    }
    _rzp = new Razorpay({
      key_id:     process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return _rzp;
};

/* ── POST /api/payments/create-order ─────────────────────── */
router.post('/create-order', protect, async (req, res) => {
  try {
    const { applicationId } = req.body;
    if (!applicationId)
      return res.status(400).json({ success: false, message: 'applicationId is required.' });

    const app = await Application.findById(applicationId).populate('visaId', 'country flag');
    if (!app)
      return res.status(404).json({ success: false, message: 'Application not found.' });

    // Ownership
    if (app.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin')
      return res.status(403).json({ success: false, message: 'Access denied.' });

    if (app.paymentStatus === 'paid')
      return res.status(400).json({ success: false, message: 'This application is already paid.' });

    if (!app.pricePaid || app.pricePaid <= 0)
      return res.status(400).json({ success: false, message: 'Invalid amount. Price not set for this application.' });

    // Idempotency: reuse existing pending order if it exists
    const existing = await Payment.findOne({
      applicationId: app._id,
      status: 'created',
    });
    if (existing) {
      return res.json({
        success: true,
        order: { id: existing.razorpayOrderId, amount: existing.amount * 100, currency: 'INR' },
        key:   process.env.RAZORPAY_KEY_ID,
        reused: true,
      });
    }

    const amountPaise = Math.round(app.pricePaid * 100);
    const notes = {
      applicationId: app._id.toString(),
      appCode:       app.applicationId,
      country:       app.visaId?.country || '',
      applicant:     app.applicantName,
    };

    const order = await getRzp().orders.create({
      amount:   amountPaise,
      currency: 'INR',
      receipt:  app.applicationId,
      notes,
    });

    await Payment.create({
      applicationId:   app._id,
      userId:          req.user._id,
      razorpayOrderId: order.id,
      amount:          app.pricePaid,
      notes,
    });

    // Store orderId on application for tracking
    await Application.findByIdAndUpdate(app._id, { razorpayOrderId: order.id });

    res.json({
      success: true,
      order,
      key:          process.env.RAZORPAY_KEY_ID,
      applicantName: app.applicantName,
      applicantEmail: app.applicantEmail,
      applicantPhone: app.applicantPhone,
    });
  } catch (err) {
    console.error('[create-order]', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ── POST /api/payments/verify ───────────────────────────── */
router.post('/verify', protect, async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      applicationId,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !applicationId)
      return res.status(400).json({ success: false, message: 'Missing payment verification fields.' });

    /* Signature check — HMAC SHA256 */
    const body     = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expected !== razorpay_signature) {
      // Mark payment as failed
      await Payment.findOneAndUpdate(
        { razorpayOrderId: razorpay_order_id },
        { status: 'failed' },
      );
      return res.status(400).json({ success: false, message: 'Payment signature verification failed.' });
    }

    /* Idempotency: already verified? */
    const existing = await Payment.findOne({ razorpayPaymentId: razorpay_payment_id, status: 'paid' });
    if (existing) {
      const app = await Application.findById(applicationId).populate('visaId','country flag');
      return res.json({ success: true, message: 'Payment already verified.', data: app });
    }

    /* Update Payment record */
    const payment = await Payment.findOneAndUpdate(
      { razorpayOrderId: razorpay_order_id },
      {
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        status:            'paid',
      },
      { new: true },
    );

    if (!payment)
      return res.status(404).json({ success: false, message: 'Payment record not found.' });

    /* Update Application */
    const app = await Application.findByIdAndUpdate(
      applicationId,
      {
        paymentStatus:     'paid',
        paymentMethod:     'razorpay',
        razorpayOrderId:   razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        amountPaid:        payment.amount,
        transactionId:     payment._id,
        $push: {
          statusHistory: {
            status:    'pending',
            note:      `Payment received via Razorpay. TxnID: ${razorpay_payment_id}`,
            updatedAt: new Date(),
          },
        },
      },
      { new: true },
    ).populate('visaId', 'country flag');

    res.json({
      success: true,
      message: 'Payment verified and recorded successfully.',
      data:    app,
      payment: {
        id:     razorpay_payment_id,
        amount: payment.amount,
        status: 'paid',
      },
    });
  } catch (err) {
    console.error('[verify]', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

/* ── POST /api/payments/webhook ─────────────────────────── */
/* Razorpay Dashboard → Settings → Webhooks → add this URL  */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const sig       = req.headers['x-razorpay-signature'];
    const secret    = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;
    const body      = Buffer.isBuffer(req.body) ? req.body.toString() : JSON.stringify(req.body);
    const expected  = crypto.createHmac('sha256', secret).update(body).digest('hex');

    if (sig !== expected) return res.status(400).send('Invalid signature');

    const event = JSON.parse(body);
    if (event.event === 'payment.captured') {
      const p = event.payload.payment.entity;
      await Payment.findOneAndUpdate(
        { razorpayOrderId: p.order_id },
        { razorpayPaymentId: p.id, status: 'paid' },
      );
      await Application.findOneAndUpdate(
        { razorpayOrderId: p.order_id },
        { paymentStatus: 'paid', razorpayPaymentId: p.id, amountPaid: p.amount / 100 },
      );
    }
    res.json({ received: true });
  } catch (err) {
    res.status(500).send(err.message);
  }
});

/* ── GET /api/payments/status/:appId ─────────────────────── */
router.get('/status/:appId', protect, async (req, res) => {
  try {
    const app = await Application.findById(req.params.appId).select('paymentStatus amountPaid razorpayPaymentId paymentMethod');
    if (!app) return res.status(404).json({ success: false, message: 'Not found.' });
    const payment = await Payment.findOne({ applicationId: app._id }).sort('-createdAt');
    res.json({ success: true, data: { app, payment } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
