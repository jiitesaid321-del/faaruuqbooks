const express = require('express');
const controller = require('../controllers/userController');
const { auth, requireRoles } = require('../middlewares/auth');

const router = express.Router();

router.use(auth());

router.get('/me', controller.getProfile);
router.put('/me', controller.updateProfile);

// Admin routes
router.use(requireRoles('admin'));
router.get('/', controller.getAllUsers);
router.put('/:id/role', controller.updateUserRole);
router.delete('/:id', controller.deleteUser);

module.exports = router;