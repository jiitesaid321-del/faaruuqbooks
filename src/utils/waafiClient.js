const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

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
      requestId: uuidv4(),
      timestamp: new Date().toISOString(),
      channelName: "WEB",
      serviceName: "API_PURCHASE",
      serviceParams: {
        merchantUid: process.env.WAAFI_MERCHANT_ID,
        apiUserId: process.env.WAAFI_API_USER_ID,
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

    console.log("🚀 [WAIFI] Sending payment request:", payload);

    const { data } = await waafi.post('/', payload);

    console.log("✅ [WAIFI] Payment response:", data);

    // Validate response
    const approved =
      data.responseCode === "2001" &&
      data.params?.state === "APPROVED";

    if (!approved) {
      throw new Error(`Payment not approved. Response: ${JSON.stringify(data)}`);
    }

    return {
      referenceId: data.params?.referenceId || data.transactionInfo?.referenceId,
      paymentUrl: data.params?.paymentUrl || "https://waafipay.com/pay/" + orderId,
      state: "APPROVED"
    };

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