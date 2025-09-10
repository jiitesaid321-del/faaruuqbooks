const Book = require('../models/Book');
const Category = require('../models/Category');
const { buildQueryOptions } = require('../utils/pagination');
const upload = require('../utils/upload');

// Middleware to handle image upload
exports.uploadCover = upload.single('coverImage');

// GET all books
exports.getAllBooks = async (req, res) => {
  const { skip, limit, sort } = buildQueryOptions(req);
  const filter = {};

  if (req.query.category) {
    const cat = await Category.findOne({ slug: req.query.category });
    if (cat) filter.categories = cat._id;
  }

  if (req.query.search) {
    filter.$or = [
      { title: { $regex: req.query.search, $options: 'i' } },
      { author: { $regex: req.query.search, $options: 'i' } }
    ];
  }

  const books = await Book.find(filter).sort(sort).skip(skip).limit(limit).populate('categories', 'name');
  const total = await Book.countDocuments(filter);

  res.json({
    books,
    pagination: {
      total,
      page: Math.ceil(skip / limit) + 1,
      pages: Math.ceil(total / limit)
    }
  });
};

// GET single book
exports.getBookById = async (req, res) => {
  const book = await Book.findById(req.params.id).populate('categories', 'name');
  if (!book) return res.status(404).json({ error: 'Book not found' });
  res.json(book);
};

// POST create book (Admin only) — with image upload
exports.createBook = async (req, res) => {
  try {
    if (req.file) {
      req.body.coverUrl = req.file.path; // Cloudinary returns full URL in path
    }

    const book = new Book(req.body);
    await book.save();
    res.status(201).json(book);
  } catch (error) {
    console.error("Create Book Error:", error);
    res.status(500).json({ error: error.message || 'Failed to create book' });
  }
};

// PUT update book (Admin only) — with optional image upload
exports.updateBook = async (req, res) => {
  try {
    if (req.file) {
      req.body.coverUrl = req.file.path;
    }

    const book = await Book.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!book) return res.status(404).json({ error: 'Book not found' });
    res.json(book);
  } catch (error) {
    console.error("Update Book Error:", error);
    res.status(500).json({ error: error.message || 'Failed to update book' });
  }
};

// DELETE book (Admin only)
exports.deleteBook = async (req, res) => {
  const book = await Book.findByIdAndDelete(req.params.id);
  if (!book) return res.status(404).json({ error: 'Book not found' });

  // Optional: Delete image from Cloudinary (see bonus below)
  // if (book.coverUrl) { deleteImageFromCloudinary(book.coverUrl); }

  res.json({ message: 'Book deleted' });
};

// === BONUS: Auto-delete image from Cloudinary ===
async function deleteImageFromCloudinary(imageUrl) {
  try {
    if (!imageUrl) return;

    // Extract public_id from URL
    // Example URL: https://res.cloudinary.com/yourname/image/upload/v123456789/folder/filename.jpg
    const urlObj = new URL(imageUrl);
    const parts = urlObj.pathname.split('/');
    const publicIdWithVersion = parts.slice(4).join('/'); // after "/image/upload/"
    const publicId = publicIdWithVersion.split('/').slice(1).join('/'); // remove version

    await cloudinary.uploader.destroy(`faaruuq-books/${publicId.split('.')[0]}`, {
      invalidate: true,
      resource_type: 'image'
    });
    console.log(`✅ Deleted image: ${publicId}`);
  } catch (err) {
    console.error("Failed to delete image from Cloudinary:", err.message);
  }
}

// Uncomment in deleteBook if you want auto-delete:
// if (book.coverUrl) { deleteImageFromCloudinary(book.coverUrl); }