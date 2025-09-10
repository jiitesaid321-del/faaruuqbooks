const express = require('express');
const controller = require('../controllers/authController');
const { authLimiter } = require('../middlewares/rateLimit');

const router = express.Router();

router.use(authLimiter);

router.post('/send-otp', controller.sendOTP);
router.post('/verify-otp', controller.verifyOTP);
router.post('/login', controller.login);
router.post('/logout', controller.logout);

module.exports = router;