const axios = require('axios');

const waafi = axios.create({ baseURL: process.env.WAAFI_BASE_URL });

async function createPaymentSession({ amount, currency = 'USD', orderId, customerTel }) {
  const payload = {
    merchant_id: process.env.WAAFI_MERCHANT_ID,
    api_key: process.env.WAAFI_API_KEY,
    amount,
    currency,
    order_id: orderId,
    customer_tel: customerTel,
    return_url: process.env.WAAFI_RETURN_URL,
    callback_url: process.env.WAAFI_CALLBACK_URL,
  };
  const { data } = await waafi.post('/payments/create', payload);
  return data;
}

async function verifyPayment(reference) {
  const { data } = await waafi.post('/payments/verify', {
    merchant_id: process.env.WAAFI_MERCHANT_ID,
    api_key: process.env.WAAFI_API_KEY,
    reference,
  });
  return data;
}

module.exports = { createPaymentSession, verifyPayment };