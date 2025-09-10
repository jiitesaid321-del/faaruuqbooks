const Review = require('../models/Review');
const Book = require('../models/Book');

exports.getReviewsByBook = async (req, res) => {
  const reviews = await Review.find({ book: req.params.bookId }).populate('user', 'name');
  res.json(reviews);
};

exports.createReview = async (req, res) => {
  const { bookId } = req.params;
  const { rating, comment } = req.body;

  const existing = await Review.findOne({ book: bookId, user: req.user.id });
  if (existing) return res.status(400).json({ error: 'You already reviewed this book' });

  const review = new Review({
    book: bookId,
    user: req.user.id,
    rating,
    comment
  });

  await review.save();

  // Update book rating
  await Book.findByIdAndUpdate(bookId, {
    $inc: { ratingCount: 1, 'ratingAvg': (rating - '$ratingAvg') / (ratingCount + 1) }
  });

  res.status(201).json(review);
};

exports.updateReview = async (req, res) => {
  const { bookId } = req.params;
  const { rating, comment } = req.body;

  const review = await Review.findOneAndUpdate(
    { book: bookId, user: req.user.id },
    { rating, comment },
    { new: true }
  );

  if (!review) return res.status(404).json({ error: 'Review not found' });

  // Recalculate avg rating
  const stats = await Review.aggregate([
    { $match: { book: review.book } },
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } }
  ]);

  await Book.findByIdAndUpdate(bookId, {
    ratingAvg: stats[0]?.avg || 0,
    ratingCount: stats[0]?.count || 0
  });

  res.json(review);
};

exports.deleteReview = async (req, res) => {
  const { bookId } = req.params;
  const review = await Review.findOneAndDelete({ book: bookId, user: req.user.id });
  if (!review) return res.status(404).json({ error: 'Review not found' });

  // Recalculate avg
  const stats = await Review.aggregate([
    { $match: { book: review.book } },
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } }
  ]);

  await Book.findByIdAndUpdate(bookId, {
    ratingAvg: stats[0]?.avg || 0,
    ratingCount: stats[0]?.count || 0
  });

  res.json({ message: 'Review deleted' });
};