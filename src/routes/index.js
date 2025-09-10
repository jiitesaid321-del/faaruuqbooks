const express = require('express');
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const bookRoutes = require('./book.routes');
const categoryRoutes = require('./category.routes');
const reviewRoutes = require('./review.routes');
const cartRoutes = require('./cart.routes');
const couponRoutes = require('./coupon.routes');
const orderRoutes = require('./order.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/books', bookRoutes);
router.use('/categories', categoryRoutes);
router.use('/reviews', reviewRoutes);
router.use('/cart', cartRoutes);
router.use('/coupons', couponRoutes);
router.use('/orders', orderRoutes);

// Health check
router.get('/health', (req, res) => res.json({ status: 'OK', uptime: process.uptime() }));

module.exports = router;