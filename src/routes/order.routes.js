const express = require('express');
const controller = require('../controllers/orderController');
const { auth, requireRoles } = require('../middlewares/auth');

const router = express.Router();

router.use(auth());

router.post('/', controller.createOrder);
router.get('/my', controller.getUserOrders);
router.get('/:id', controller.getOrderById);

// Payment
router.post('/verify-payment', controller.verifyOrderPayment);
router.post('/webhook', controller.paymentWebhook); // Public route for Waafi

// Admin
router.use(requireRoles('admin'));
router.get('/', controller.getAllOrders);
router.put('/:id/status', controller.updateOrderStatus);

module.exports = router;