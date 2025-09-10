const express = require('express');
const controller = require('../controllers/reviewController');
const { auth } = require('../middlewares/auth');

const router = express.Router();

router.get('/book/:bookId', controller.getReviewsByBook);

router.use(auth());
router.post('/book/:bookId', controller.createReview);
router.put('/book/:bookId', controller.updateReview);
router.delete('/book/:bookId', controller.deleteReview);

module.exports = router;