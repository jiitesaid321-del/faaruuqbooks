const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  author: { type: String, required: true },
  description: { type: String },
  categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
  price: { type: Number, required: true, min: 0 },
  stock: { type: Number, default: 0 },
  coverUrl: { type: String },
  ratingAvg: { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 },
  isbn: { type: String },
  language: { type: String, default: 'en' },
  pages: { type: Number },
  publishedAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Book', bookSchema);