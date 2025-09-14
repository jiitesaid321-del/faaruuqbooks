const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const WAIFI_ENDPOINTS = [
  'https://api.waafipay.com/asm',
  'https://api.waafipay.com/v1/payments',
  'https://api.waafipay.com/gateway',
  'https://api.waafipay.com/api',
  'https://gateway.waafipay.com/asm'
];

async function createPaymentSession({ amount, orderId, customerTel }) {
  try {
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

    const primaryEndpoint = WAIFI_ENDPOINTS[0];
    try {
      console.log(`🚀 Trying primary Waafi endpoint: ${primaryEndpoint}`);
      const { data } = await axios.post(primaryEndpoint, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      });

      console.log(`✅ Primary endpoint response:`, data);

      if (data.responseCode !== "2001") {
        const errorMsg = data.responseMsg || `Payment failed: ${data.responseCode}`;
        throw new Error(errorMsg);
      }

      if (!data.params || data.params.state !== "APPROVED") {
        throw new Error(data.responseMsg || "Payment not approved");
      }

      return {
        referenceId: data.params.referenceId,
        paymentUrl: data.params.paymentUrl,
        state: "APPROVED",
        waafiResponse: data
      };

    } catch (primaryError) {
      console.warn(`⚠️ Primary endpoint failed:`, primaryError.message);
      if (primaryError.message.includes("Payment Failed") || primaryError.message.includes("Haraaga")) {
        throw primaryError;
      }

      for (let i = 1; i < WAIFI_ENDPOINTS.length; i++) {
        const baseUrl = WAIFI_ENDPOINTS[i];
        try {
          console.log(`🚀 Trying fallback endpoint: ${baseUrl}`);
          const { data } = await axios.post(baseUrl, payload, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 10000
          });

          if (data.responseCode === "2001" && data.params?.state === "APPROVED") {
            return {
              referenceId: data.params.referenceId,
              paymentUrl: data.params.paymentUrl,
              state: "APPROVED",
              waafiResponse: data
            };
          } else {
            throw new Error(data.responseMsg || `Payment not approved: ${data.responseCode}`);
          }
        } catch (fallbackError) {
          console.warn(`⚠️ Fallback endpoint failed: ${baseUrl}`, fallbackError.message);
        }
      }

      throw new Error("All Waafi endpoints failed. Contact Waafi support.");
    }

  } catch (error) {
    console.error("❌ Waafi payment failed:", error.message);
    throw new Error(error.message);
  }
}

module.exports = { createPaymentSession };