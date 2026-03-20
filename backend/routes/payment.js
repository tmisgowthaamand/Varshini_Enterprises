const express = require('express');
const router = express.Router();
const PaytmChecksum = require('paytmchecksum');

const {
  PAYTM_MERCHANT_ID,
  PAYTM_MERCHANT_KEY,
  PAYTM_WEBSITE,
  PAYTM_INDUSTRY_TYPE,
  PAYTM_CHANNEL_ID_WEB,
  PAYTM_CALLBACK_URL,
  PAYTM_TRANSACTION_URL,
  PAYTM_STATUS_URL
} = process.env;

// Log key info for debugging
console.log('Merchant Key length:', PAYTM_MERCHANT_KEY?.length);
console.log('Merchant ID:', PAYTM_MERCHANT_ID);
console.log('Website:', PAYTM_WEBSITE);

// Initiate payment - Traditional Paytm form flow
router.post('/initiate', async (req, res) => {
  try {
    console.log('Payment initiation request:', req.body);

    const { orderId, amount, customerId, customerEmail, customerPhone } = req.body;

    if (!orderId || !amount || !customerId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    console.log('Paytm Config:', {
      merchantId: PAYTM_MERCHANT_ID,
      website: PAYTM_WEBSITE,
      callbackUrl: PAYTM_CALLBACK_URL,
      merchantKeyLength: PAYTM_MERCHANT_KEY?.length
    });

    // Build Paytm parameters for form submission
    const paytmParams = {
      MID: PAYTM_MERCHANT_ID,
      WEBSITE: PAYTM_WEBSITE,
      CHANNEL_ID: PAYTM_CHANNEL_ID_WEB,
      INDUSTRY_TYPE_ID: PAYTM_INDUSTRY_TYPE,
      ORDER_ID: orderId,
      CUST_ID: customerId,
      TXN_AMOUNT: amount.toString(),
      EMAIL: customerEmail || 'customer@example.com',
      MOBILE_NO: customerPhone || '9999999999',
      CALLBACK_URL: PAYTM_CALLBACK_URL,
      CHECKSUMHASH: ''
    };

    console.log('Building checksum for params:', paytmParams);

    // Generate checksum
    const checksum = await PaytmChecksum.generateSignature(
      JSON.stringify(paytmParams),
      PAYTM_MERCHANT_KEY
    );

    paytmParams.CHECKSUMHASH = checksum;

    console.log('Generated Checksum:', checksum);

    // Return parameters for frontend form submission
    res.json({
      success: true,
      data: {
        paytmParams: paytmParams,
        transactionUrl: 'https://securegw.paytm.in/order/process'
      }
    });
  } catch (error) {
    console.error('Payment initiation error:', error);
    res.status(500).json({
      success: false,
      message: 'Payment initiation failed',
      error: error.message
    });
  }
});

// Payment callback
router.post('/callback', async (req, res) => {
  try {
    console.log('Payment callback received:', req.body);
    
    const paytmChecksum = req.body.CHECKSUMHASH || req.body.checksumhash;
    
    if (!paytmChecksum) {
      console.error('Missing CHECKSUMHASH in Paytm callback. Full Body:', JSON.stringify(req.body));
      // Just redirect back to the home page or a failed transaction page
      return res.redirect('https://varshinienterprises.vercel.app/order-confirmation?status=TXN_FAILURE&respmsg=Missing_Checksum');
    }

    delete req.body.CHECKSUMHASH;
    delete req.body.checksumhash;

    const isVerified = PaytmChecksum.verifySignature(
      req.body,
      PAYTM_MERCHANT_KEY,
      paytmChecksum
    );

    if (isVerified) {
      const { ORDERID, TXNID, TXNAMOUNT, STATUS, RESPCODE, RESPMSG } = req.body;
      
      console.log('Payment verified:', { ORDERID, TXNID, STATUS, RESPCODE });

      // Redirect to frontend with payment status
      const redirectUrl = `https://varshinienterprises.vercel.app/order-confirmation?orderId=${ORDERID}&status=${STATUS}&txnId=${TXNID}&amount=${TXNAMOUNT}`;
      
      res.redirect(redirectUrl);
    } else {
      console.error('Checksum verification failed');
      res.status(400).json({ 
        success: false, 
        message: 'Checksum verification failed' 
      });
    }
  } catch (error) {
    console.error('Callback error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Callback processing failed',
      error: error.message 
    });
  }
});

// Check payment status
router.post('/status', async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Order ID is required' 
      });
    }

    const paytmParams = {
      body: {
        mid: PAYTM_MERCHANT_ID,
        orderId: orderId
      }
    };

    const checksum = await PaytmChecksum.generateSignature(
      JSON.stringify(paytmParams.body),
      PAYTM_MERCHANT_KEY
    );

    paytmParams.head = {
      signature: checksum
    };

    const https = require('https');
    const postData = JSON.stringify(paytmParams);

    const hostname = 'securegw.paytm.in';
    const statusPath = '/v3/order/status';

    const options = {
      hostname: hostname,
      port: 443,
      path: statusPath,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': postData.length
      }
    };

    const request = https.request(options, (response) => {
      let data = '';
      response.on('data', (chunk) => {
        data += chunk;
      });
      response.on('end', () => {
        res.json({ success: true, data: JSON.parse(data) });
      });
    });

    request.on('error', (error) => {
      res.status(500).json({ 
        success: false, 
        message: 'Status check failed',
        error: error.message 
      });
    });

    request.write(postData);
    request.end();
  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Status check failed',
      error: error.message 
    });
  }
});

module.exports = router;
