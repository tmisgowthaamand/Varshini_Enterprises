# Payment Backend - Paytm Integration

## Setup Instructions

1. Install dependencies:
```bash
cd backend
npm install
```

2. Configure environment variables in `.env` file (already created with your credentials)

3. Start the server:
```bash
npm run dev
```

The server will run on http://localhost:3000

## API Endpoints

### POST /api/payment/initiate
Initiates a payment transaction
```json
{
  "orderId": "ORDER123",
  "amount": 1000,
  "customerId": "CUST001",
  "customerEmail": "customer@example.com",
  "customerPhone": "9876543210"
}
```

### POST /api/payment/callback
Handles Paytm callback after payment

### POST /api/payment/status
Check payment status
```json
{
  "orderId": "ORDER123"
}
```

## Important Notes

- Currently configured for Paytm STAGING environment
- For production, update PAYTM_TRANSACTION_URL and PAYTM_STATUS_URL in .env
- Production URLs:
  - Transaction: https://securegw.paytm.in/order/process
  - Status: https://securegw.paytm.in/order/status
