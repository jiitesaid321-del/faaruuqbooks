const Category = require('../models/Category');

exports.getAllCategories = async (req, res) => {
  const categories = await Category.find();
  res.json(categories);
};

exports.getCategoryBySlug = async (req, res) => {
  const category = await Category.findOne({ slug: req.params.slug });
  if (!category) return res.status(404).json({ error: 'Category not found' });
  res.json(category);
};

// Admin only
exports.createCategory = async (req, res) => {
  const { name } = req.body;
  const slug = name.toLowerCase().replace(/\s+/g, '-');
  const category = new Category({ name, slug });
  await category.save();
  res.status(201).json(category);
};

exports.updateCategory = async (req, res) => {
  const { name } = req.body;
  const slug = name.toLowerCase().replace(/\s+/g, '-');
  const category = await Category.findByIdAndUpdate(
    req.params.id,
    { name, slug },
    { new: true }
  );
  if (!category) return res.status(404).json({ error: 'Category not found' });
  res.json(category);
};

exports.deleteCategory = async (req, res) => {
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) return res.status(404).json({ error: 'Category not found' });
  res.json({ message: 'Category deleted' });
};