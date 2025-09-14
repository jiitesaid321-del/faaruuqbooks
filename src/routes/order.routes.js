const express = require('express');
const controller = require('../controllers/orderController');
const { auth } = require('../middlewares/auth');

const router = express.Router();

router.use(auth());

// 🚀 INITIATE PAYMENT (NO ORDER CREATED)
router.post('/initiate-payment', controller.initiatePayment);

// 🚀 WAIFI WEBHOOK (CREATE ORDER AFTER PAYMENT)
router.post('/webhook', controller.paymentWebhook);

// 👇 KEEP OTHER ROUTES
router.get('/my', controller.getUserOrders);
router.get('/:id', controller.getOrderById);

// Admin routes
router.use(requireRoles('admin'));
router.get('/', controller.getAllOrders);
router.put('/:id/status', controller.updateOrderStatus);

module.exports = router;