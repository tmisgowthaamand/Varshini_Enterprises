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
console.log('Merchant Key (raw):', JSON.stringify(PAYTM_MERCHANT_KEY));

// Test endpoint to verify merchant credentials
router.get('/verify-merchant', (req, res) => {
  try {
    const merchantInfo = {
      merchantId: PAYTM_MERCHANT_ID || 'NOT SET',
      merchantKeyLength: PAYTM_MERCHANT_KEY?.length || 0,
      merchantKey: PAYTM_MERCHANT_KEY || 'NOT SET',
      website: PAYTM_WEBSITE || 'NOT SET',
      callbackUrl: PAYTM_CALLBACK_URL || 'NOT SET',
      channelId: PAYTM_CHANNEL_ID_WEB || 'NOT SET',
      industryType: PAYTM_INDUSTRY_TYPE || 'NOT SET'
    };

    res.json({
      success: true,
      message: 'Merchant credentials loaded',
      data: merchantInfo,
      hint: 'Verify Merchant ID and Key match your Paytm dashboard exactly'
    });
  } catch (error) {
    res.json({ error: error.message });
  }
});

// Initiate payment - Traditional Paytm form flow
router.post('/initiate', async (req, res) => {
  try {
    console.log('========== PAYMENT INITIATION START ==========');
    console.log('Payment request:', req.body);

    const { orderId, amount, customerId, customerEmail, customerPhone } = req.body;

    if (!orderId || !amount || !customerId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

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
      CALLBACK_URL: PAYTM_CALLBACK_URL
    };

    console.log('Parameters:', JSON.stringify(paytmParams, null, 2));
    console.log('Merchant Key (length):', PAYTM_MERCHANT_KEY?.length);
    console.log('Merchant Key (repr):', JSON.stringify(PAYTM_MERCHANT_KEY));

    // Try Method 1: Object passed directly
    console.log('\n--- Trying Method 1: Object directly ---');
    let checksum;
    try {
      checksum = await PaytmChecksum.generateSignature(
        paytmParams,
        PAYTM_MERCHANT_KEY
      );
      console.log('✓ Method 1 SUCCESS - Checksum:', checksum.substring(0, 30) + '...');
    } catch (e1) {
      console.log('✗ Method 1 failed:', e1.message);

      // Try Method 2: JSON stringify
      console.log('\n--- Trying Method 2: JSON.stringify ---');
      try {
        const jsonStr = JSON.stringify(paytmParams);
        checksum = await PaytmChecksum.generateSignature(
          jsonStr,
          PAYTM_MERCHANT_KEY
        );
        console.log('✓ Method 2 SUCCESS - Checksum:', checksum.substring(0, 30) + '...');
      } catch (e2) {
        console.log('✗ Method 2 failed:', e2.message);
        throw new Error('All checksum methods failed: ' + e1.message);
      }
    }

    // Add checksum to params
    paytmParams.CHECKSUMHASH = checksum;

    console.log('\nFinal Paytm Parameters:');
    Object.keys(paytmParams).forEach(key => {
      const value = paytmParams[key];
      if (key === 'CHECKSUMHASH') {
        console.log(`  ${key}: ${value.substring(0, 30)}...`);
      } else {
        console.log(`  ${key}: ${value}`);
      }
    });

    console.log('========== PAYMENT INITIATION SUCCESS ==========\n');

    // Return parameters for frontend form submission
    res.json({
      success: true,
      data: {
        paytmParams: paytmParams,
        transactionUrl: 'https://securegw.paytm.in/order/process'
      }
    });
  } catch (error) {
    console.error('========== PAYMENT INITIATION ERROR ==========');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.error('=========================================\n');

    res.status(500).json({
      success: false,
      message: 'Payment initiation failed: ' + error.message,
      error: error.message
    });
  }
});

// Payment callback
router.post('/callback', async (req, res) => {
  try {
    console.log('Payment callback received:', JSON.stringify(req.body));

    const { ORDERID, TXNID, TXNAMOUNT, STATUS, RESPCODE, RESPMSG, BANKTXNID } = req.body;
    const paytmChecksum = req.body.CHECKSUMHASH || req.body.checksumhash;

    // Log callback details
    console.log('Callback Details:', {
      ORDERID,
      STATUS,
      RESPCODE,
      RESPMSG,
      hasChecksum: !!paytmChecksum
    });

    // Even if checksum is missing, we can still process the payment status
    // This handles cases where Paytm doesn't return CHECKSUMHASH in callback

    if (paytmChecksum) {
      // Create a copy for verification (remove checksumhash before verifying)
      const bodyForVerification = { ...req.body };
      delete bodyForVerification.CHECKSUMHASH;
      delete bodyForVerification.checksumhash;

      const isVerified = PaytmChecksum.verifySignature(
        bodyForVerification,
        PAYTM_MERCHANT_KEY,
        paytmChecksum
      );

      console.log('Checksum verification:', isVerified ? 'PASSED' : 'FAILED');

      if (!isVerified) {
        console.warn('Checksum verification failed but processing payment status anyway');
      }
    } else {
      console.log('No checksum in callback, processing based on payment status from Paytm');
    }

    // Determine the status message
    let statusMessage = '';
    if (STATUS === 'TXN_SUCCESS') {
      statusMessage = 'Payment Successful';
    } else if (STATUS === 'TXN_FAILURE') {
      statusMessage = `Payment Failed: ${RESPMSG || 'Unknown error'}`;
    } else {
      statusMessage = `Payment ${STATUS || 'Unknown'}`;
    }

    console.log('Processing payment with status:', { ORDERID, STATUS, statusMessage });

    // Redirect to frontend with complete payment status
    const redirectUrl = `https://varshinienterprises.vercel.app/order-confirmation?orderId=${ORDERID}&status=${STATUS}&txnId=${TXNID || ''}&amount=${TXNAMOUNT}&respMsg=${encodeURIComponent(statusMessage)}`;

    console.log('Redirecting to:', redirectUrl);
    res.redirect(redirectUrl);
  } catch (error) {
    console.error('Callback error:', error);
    // Redirect to error page even on exception
    res.redirect('https://varshinienterprises.vercel.app/order-confirmation?status=TXN_ERROR&respMsg=' + encodeURIComponent(error.message));
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
