const express = require('express');
const controller = require('../controllers/bookController');
const { auth, requireRoles } = require('../middlewares/auth');

const router = express.Router();

// Public routes
router.get('/', controller.getAllBooks);
router.get('/:id', controller.getBookById);

// Admin routes
router.use(auth(), requireRoles('admin'));

// Apply upload middleware for image
router.post('/', controller.uploadCover, controller.createBook);
router.put('/:id', controller.uploadCover, controller.updateBook);
router.delete('/:id', controller.deleteBook);

module.exports = router;