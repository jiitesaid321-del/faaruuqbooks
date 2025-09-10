const express = require('express');
const controller = require('../controllers/categoryController');
const { auth, requireRoles } = require('../middlewares/auth');

const router = express.Router();

router.get('/', controller.getAllCategories);
router.get('/:slug', controller.getCategoryBySlug);

router.use(auth(), requireRoles('admin'));
router.post('/', controller.createCategory);
router.put('/:id', controller.updateCategory);
router.delete('/:id', controller.deleteCategory);

module.exports = router;