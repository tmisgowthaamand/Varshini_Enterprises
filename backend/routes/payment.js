const express = require('express');
const router = express.Router();
const PaytmChecksum = require('paytmchecksum');
const axios = require('axios');

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

    console.log('Generated Checksum:', checksum);

    // Make server-to-server request using https
    const https = require('https');
    const postData = JSON.stringify(paytmParams);
    const postDataBuffer = Buffer.from(postData, 'utf8');

    const hostname = 'securegw.paytm.in';
    const initPath = `/theia/api/v1/initTransaction?mid=${PAYTM_MERCHANT_ID}&orderId=${orderId}`;

    const options = {
      hostname: hostname,
      port: 443,
      path: initPath,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': postDataBuffer.length
      }
    };

    return new Promise((resolve) => {
      const request = https.request(options, (response) => {
        let data = '';
        response.on('data', (chunk) => {
          data += chunk;
        });
        response.on('end', () => {
          try {
            console.log('Paytm API Response Status:', response.statusCode);
            console.log('Paytm API Response (first 500 chars):', data.substring(0, 500));

            // Check if response is HTML (error page)
            if (data.startsWith('<!DOCTYPE') || data.startsWith('<html')) {
              console.error('Paytm returned HTML error page. Status:', response.statusCode);
              console.error('Full response:', data);
              resolve();
              return res.status(response.statusCode || 400).json({
                success: false,
                message: 'Paytm API error: Check merchant ID, key, and account status',
                statusCode: response.statusCode,
                hint: 'Verify merchant credentials and that your Paytm account is properly configured'
              });
            }

            const result = JSON.parse(data);
            console.log('Parsed Paytm response:', JSON.stringify(result).substring(0, 200));

            if (result.body && result.body.txnToken) {
              const txnToken = result.body.txnToken;
              resolve();
              return res.json({
                success: true,
                data: {
                  txnToken,
                  orderId,
                  mid: PAYTM_MERCHANT_ID,
                  transactionUrl: `https://${hostname}/theia/api/v1/showPaymentPage?mid=${PAYTM_MERCHANT_ID}&orderId=${orderId}`
                }
              });
            } else {
              console.error('No txnToken in response:', result);
              resolve();
              return res.status(400).json({
                success: false,
                message: 'Failed to generate transaction token',
                details: result.body || result
              });
            }
          } catch (parseError) {
            console.error('JSON Parse Error:', parseError.message);
            console.error('Response data:', data);
            resolve();
            return res.status(500).json({
              success: false,
              message: 'Failed to parse Paytm response - invalid response format',
              error: parseError.message
            });
          }
        });
      });

      request.on('error', (error) => {
        console.error('HTTPS Request Error:', error);
        resolve();
        res.status(500).json({
          success: false,
          message: 'Failed to connect to Paytm',
          error: error.message
        });
      });

      request.write(postDataBuffer);
      request.end();
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
