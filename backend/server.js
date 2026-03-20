const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const paymentRoutes = require('./routes/payment');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/api/payment', paymentRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Payment server is running' });
});

app.listen(PORT, () => {
  console.log(`Payment server running on port ${PORT}`);
});
