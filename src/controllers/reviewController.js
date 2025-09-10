const Review = require("../models/Review");
const Book = require("../models/Book");

exports.getReviewsByBook = async (req, res) => {
  const reviews = await Review.find({ book: req.params.bookId }).populate(
    "user",
    "name"
  );
  res.json(reviews);
};

exports.createReview = async (req, res) => {
  const { bookId } = req.params;
  const { rating, comment } = req.body;

  // Check if user already reviewed this book
  const existing = await Review.findOne({ book: bookId, user: req.user.id });
  if (existing)
    return res.status(400).json({ error: "You already reviewed this book" });

  // Create the review
  const review = new Review({
    book: bookId,
    user: req.user.id,
    rating,
    comment,
  });

  await review.save();

  // 👇 GET CURRENT BOOK STATS
  const book = await Book.findById(bookId);
  const currentCount = book.ratingCount || 0;
  const currentAvg = book.ratingAvg || 0;

  // 👇 CALCULATE NEW AVERAGE
  const newCount = currentCount + 1;
  const newAvg = (currentAvg * currentCount + rating) / newCount;

  // 👇 UPDATE BOOK
  await Book.findByIdAndUpdate(bookId, {
    ratingCount: newCount,
    ratingAvg: newAvg,
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

  if (!review) return res.status(404).json({ error: "Review not found" });

  // Recalculate average from ALL reviews
  const stats = await Review.aggregate([
    { $match: { book: review.book } },
    {
      $group: {
        _id: null,
        avg: { $avg: "$rating" },
        count: { $sum: 1 },
      },
    },
  ]);

  const newAvg = stats[0]?.avg || 0;
  const newCount = stats[0]?.count || 0;

  await Book.findByIdAndUpdate(bookId, {
    ratingAvg: newAvg,
    ratingCount: newCount,
  });

  res.json(review);
};

exports.deleteReview = async (req, res) => {
  const { bookId } = req.params;
  const review = await Review.findOneAndDelete({
    book: bookId,
    user: req.user.id,
  });
  if (!review) return res.status(404).json({ error: "Review not found" });

  // Recalculate average from remaining reviews
  const stats = await Review.aggregate([
    { $match: { book: review.book } },
    {
      $group: {
        _id: null,
        avg: { $avg: "$rating" },
        count: { $sum: 1 },
      },
    },
  ]);

  const newAvg = stats[0]?.avg || 0;
  const newCount = stats[0]?.count || 0;

  await Book.findByIdAndUpdate(bookId, {
    ratingAvg: newAvg,
    ratingCount: newCount,
  });

  res.json({ message: "Review deleted" });
};
