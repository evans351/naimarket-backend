const express = require('express');
const axios = require('axios');
const router = express.Router();
require('dotenv').config();

// PAYSTACK Payment Initialization Route
router.post('/pay/paystack', async (req, res) => {
  const { email, amount } = req.body;
  const paystackSecret = process.env.PAYSTACK_SECRET;

  try {
    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email,
        amount: amount * 100, // Paystack uses kobo (KES * 100)
        currency: 'KES',
        callback_url: 'https://yourdomain.com/payment-success', // Replace with your real frontend URL
      },
      {
        headers: {
          Authorization: `Bearer ${paystackSecret}`,
        },
      }
    );

    res.status(200).json({ message: 'Paystack payment initiated', data: response.data });
  } catch (error) {
    res.status(500).json({ error: 'Paystack init failed', details: error.message });
  }
});

// PAYSTACK Payment Verification Route
router.get('/pay/paystack/verify/:reference', async (req, res) => {
  const { reference } = req.params;
  const paystackSecret = process.env.PAYSTACK_SECRET;

  try {
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${paystackSecret}`,
        },
      }
    );

    const data = response.data.data;
    if (data.status === 'success') {
      res.status(200).json({ verified: true, data });
    } else {
      res.status(400).json({ verified: false, data });
    }
  } catch (error) {
    res.status(500).json({ error: 'Paystack verification failed', details: error.message });
  }
});

module.exports = router;

