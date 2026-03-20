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

// Initiate payment
router.post('/initiate', async (req, res) => {
  try {
    const { orderId, amount, customerId, customerEmail, customerPhone } = req.body;

    if (!orderId || !amount || !customerId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
    }

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
    const paytmChecksum = req.body.CHECKSUMHASH;
    delete req.body.CHECKSUMHASH;

    const isVerified = PaytmChecksum.verifySignature(
      req.body,
      PAYTM_MERCHANT_KEY,
      paytmChecksum
    );

    if (isVerified) {
      const { ORDERID, TXNID, TXNAMOUNT, STATUS, RESPCODE, RESPMSG } = req.body;

      // Redirect to frontend with payment status
      const redirectUrl = `https://varshinienterprises.vercel.app/order-confirmation?orderId=${ORDERID}&status=${STATUS}&txnId=${TXNID}&amount=${TXNAMOUNT}`;
      
      res.redirect(redirectUrl);
    } else {
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
