const express = require("express");
const controller = require("../controllers/orderController");
const { auth, requireRoles } = require("../middlewares/auth"); // ← ADD requireRoles

const router = express.Router();

router.use(auth());

// 1. Create order (no payment)
router.post("/", controller.createOrder);

// 2. Initiate payment for order
router.post("/:orderId/pay", controller.initiatePayment);

// 3. Webhook (public)
router.post("/webhook", controller.paymentWebhook);

// 4. Get orders
router.get("/my", controller.getUserOrders);
router.get("/:id", controller.getOrderById);

// Admin routes
router.use(requireRoles("admin")); // ← Now defined
router.get("/", controller.getAllOrders);
router.put("/:id/status", controller.updateOrderStatus);

module.exports = router;
