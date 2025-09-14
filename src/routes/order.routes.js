const express = require("express");
const controller = require("../controllers/orderController");
const { auth, requireRoles } = require("../middlewares/auth");

const router = express.Router();

router.use(auth());

router.post("/", controller.createOrder);
router.get("/my", controller.getUserOrders);
router.get("/:id", controller.getOrderById);

// Payment
router.post("/verify-payment", controller.verifyOrderPayment);
router.post("/webhook", controller.paymentWebhook); // Public route for Waafi

// Admin
router.use(requireRoles("admin"));
router.get("/", controller.getAllOrders);
router.put("/:id/status", controller.updateOrderStatus);

// Add this BEFORE module.exports
router.post("/test-payment", async (req, res) => {
  try {
    const payment = await createPaymentSession({
      amount: 10.0,
      orderId: "TEST_" + Date.now(),
      customerTel: "252611234567", // No + sign
    });
    res.status(200).json({
      success: true,
      payment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
