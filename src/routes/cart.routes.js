const express = require('express');
const controller = require('../controllers/cartController');
const { auth } = require('../middlewares/auth');

const router = express.Router();

router.use(auth());

router.get('/', controller.getCart);
router.post('/', controller.addToCart);
router.put('/item', controller.updateCartItem);
router.delete('/item/:bookId', controller.removeFromCart);
router.post('/coupon', controller.applyCoupon);
router.delete('/', controller.clearCart);

module.exports = router;