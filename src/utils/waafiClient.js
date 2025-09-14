// src/utils/waafiClient.js

const axios = require("axios");
const { v4: uuidv4 } = require("uuid");

const WAIFI_ENDPOINTS = [
  "https://api.waafipay.com/asm",
  "https://api.waafipay.com/v1/payments",
  "https://api.waafipay.com/gateway",
  "https://api.waafipay.com/api",
  "https://gateway.waafipay.com/asm",
];

async function createPaymentSession({ amount, orderId, customerTel }) {
  try {
    const formattedAmount = Number(amount).toFixed(2);
    const cleanPhone = customerTel.replace(/\+/g, "");

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
          accountNo: cleanPhone,
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

    // 👇 ONLY TRY PRIMARY ENDPOINT
    const baseUrl = "https://api.waafipay.com/asm";
    console.log(`🚀 Sending to Waafi: ${baseUrl}`);

    const { data } = await axios.post(baseUrl, payload, {
      headers: { "Content-Type": "application/json" },
      timeout: 15000,
    });

    console.log("✅ Waafi response:", data);

    // 👇 RETURN RAW RESPONSE — LET CONTROLLER DECIDE
    return {
      referenceId:
        data.params?.referenceId || data.transactionInfo?.referenceId,
      paymentUrl:
        data.params?.paymentUrl || `https://waafipay.com/pay/${orderId}`,
      state: data.params?.state || "UNKNOWN",
      waafiResponse: data, // 👈 RAW WAIFI RESPONSE
    };
  } catch (error) {
    console.error("❌ Waafi payment failed:", error.message);
    throw new Error("Waafi service unavailable. Please try again later.");
  }
}

module.exports = { createPaymentSession };
