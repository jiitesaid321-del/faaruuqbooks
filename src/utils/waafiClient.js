// src/utils/waafiClient.js

const axios = require("axios");
const { v4: uuidv4 } = require("uuid");

// ✅ TRY MULTIPLE ENDPOINTS UNTIL ONE WORKS
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

    for (let baseUrl of WAIFI_ENDPOINTS) {
      try {
        console.log(`🚀 Trying Waafi endpoint: ${baseUrl}`);
        const { data } = await axios.post(baseUrl, payload, {
          headers: { "Content-Type": "application/json" },
          timeout: 10000,
        });

        console.log(`✅ Success with endpoint: ${baseUrl}`);
        console.log("✅ Waafi response:", data);

        if (data.responseCode === "2001" && data.params?.state === "APPROVED") {
          return {
            referenceId: data.params.referenceId,
            paymentUrl: data.params.paymentUrl,
            state: "APPROVED",
            waafiResponse: data,
          };
        } else {
          // 👇 THROW WAIFI ERROR MESSAGE
          throw new Error(
            `Payment not approved: ${data.responseCode} - ${
              data.responseMsg || "Unknown error"
            }`
          );
        }
      } catch (error) {
        console.warn(`⚠️ Endpoint failed: ${baseUrl}`, error.message);
      }
    }

    throw new Error("All Waafi endpoints failed. Contact Waafi support.");
  } catch (error) {
    console.error("❌ Waafi payment failed:", error.message);
    // 👇 RE-THROW WITH MESSAGE
    throw new Error(error.message);
  }
}

module.exports = { createPaymentSession };
