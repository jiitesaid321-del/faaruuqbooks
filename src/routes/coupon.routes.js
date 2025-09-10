const express = require('express');
const controller = require('../controllers/couponController');
const { auth, requireRoles } = require('../middlewares/auth');

const router = express.Router();

router.get('/', controller.getAllCoupons);
router.get('/:code', controller.getCouponByCode);

router.use(auth(), requireRoles('admin'));
router.post('/', controller.createCoupon);
router.put('/:id', controller.updateCoupon);
router.delete('/:id', controller.deleteCoupon);

module.exports = router;