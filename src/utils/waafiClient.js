const axios = require('axios');

const waafi = axios.create({
  baseURL: process.env.WAAFI_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

async function createPaymentSession({ amount, orderId, customerTel }) {
  try {
    if (!amount || !orderId || !customerTel) {
      throw new Error("Missing required payment parameters");
    }

    const formattedAmount = Number(amount).toFixed(2);
    const cleanPhone = customerTel.replace(/\+/g, '');

    const payload = {
      schemaVersion: "1.0",
      requestId: require('uuid').v4(),
      timestamp: new Date().toISOString(),
      channelName: "WEB",
      serviceName: "API_PURCHASE",
      serviceParams: {
        merchantUid: process.env.WAAFI_MERCHANT_ID,
        apiUserId: "1008367",
        apiKey: process.env.WAAFI_API_KEY,
        paymentMethod: "MWALLET_ACCOUNT",
        payerInfo: {
          accountNo: cleanPhone
        },
        transactionInfo: {
          referenceId: `ref-${Date.now()}`,
          invoiceId: `inv-${orderId}`,
          amount: formattedAmount,
          currency: "USD",
          description: `Faaruuq Bookstore Order #${orderId}`,
        },
      },
    };

    console.log("🚀 [WAIFI] Creating payment for:", {
      amount: formattedAmount,
      orderId,
      customerTel: cleanPhone
    });

    const { data } = await waafi.post('/', payload);

    console.log("✅ [WAIFI] Payment created:", data);

    if (!data || !data.referenceId) {
      throw new Error("Waafi returned invalid payment data");
    }

    return data;
  } catch (error) {
    console.error("❌ [WAIFI] Payment creation failed:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    throw new Error("Payment service unavailable. Please try again later.");
  }
}

async function verifyPayment(referenceId) {
  try {
    if (!referenceId) {
      throw new Error("Missing payment reference");
    }

    // In real Waafi, you'd verify via their API
    // For now, we'll simulate success
    return {
      referenceId,
      state: "APPROVED"
    };
  } catch (error) {
    console.error("❌ [WAIFI] Payment verification failed:", error.message);
    throw new Error("Payment verification failed");
  }
}

module.exports = { createPaymentSession, verifyPayment };