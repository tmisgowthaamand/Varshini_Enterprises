const express = require('express');
const router = express.Router();
const PaytmChecksum = require('paytmchecksum');

const {
  PAYTM_MERCHANT_ID,
  PAYTM_MERCHANT_KEY: RAW_MERCHANT_KEY,
  PAYTM_WEBSITE,
  PAYTM_INDUSTRY_TYPE,
  PAYTM_CHANNEL_ID_WEB,
  PAYTM_CALLBACK_URL,
  PAYTM_TRANSACTION_URL,
  PAYTM_STATUS_URL
} = process.env;

// Pad 16-char key to 32 characters by repeating it (for AES-256 compatibility)
const PAYTM_MERCHANT_KEY = RAW_MERCHANT_KEY?.length === 16
  ? RAW_MERCHANT_KEY + RAW_MERCHANT_KEY
  : RAW_MERCHANT_KEY;

// Log key info for debugging
console.log('Merchant Key: Original length:', RAW_MERCHANT_KEY?.length, '| Padded length:', PAYTM_MERCHANT_KEY?.length);

// Initiate payment
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
      transactionUrl: PAYTM_TRANSACTION_URL,
      merchantKeyLength: PAYTM_MERCHANT_KEY?.length
    });

    const paytmParams = {
      body: {
        requestType: 'Payment',
        mid: PAYTM_MERCHANT_ID,
        websiteName: PAYTM_WEBSITE,
        orderId: orderId,
        callbackUrl: PAYTM_CALLBACK_URL,
        txnAmount: {
          value: amount.toString(),
          currency: 'INR'
        },
        userInfo: {
          custId: customerId,
          email: customerEmail || '',
          mobile: customerPhone || ''
        }
      }
    };

    const checksum = await PaytmChecksum.generateSignature(
      JSON.stringify(paytmParams.body),
      PAYTM_MERCHANT_KEY
    );

    paytmParams.head = {
      signature: checksum
    };

    console.log('Payment initiated successfully for order:', orderId);

    res.json({
      success: true,
      data: {
        paytmParams,
        transactionUrl: PAYTM_TRANSACTION_URL,
        orderId
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
    
    const paytmChecksum = req.body.CHECKSUMHASH;
    delete req.body.CHECKSUMHASH;

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

    const options = {
      hostname: new URL(PAYTM_STATUS_URL).hostname,
      port: 443,
      path: new URL(PAYTM_STATUS_URL).pathname,
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
