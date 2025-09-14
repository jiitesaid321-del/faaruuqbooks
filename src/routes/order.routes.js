// src/routes/order.routes.js

const express = require("express");
const controller = require("../controllers/orderController");
const { auth } = require("../middlewares/auth");

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

module.exports = router;
