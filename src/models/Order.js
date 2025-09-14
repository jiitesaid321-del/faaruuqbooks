const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    book: { type: mongoose.Schema.Types.ObjectId, ref: "Book", required: true },
    title: String,
    price: Number,
    qty: Number,
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: [orderItemSchema],
    amount: { type: Number, required: true },
    currency: { type: String, default: "USD" },
    status: {
      type: String,
      enum: ["created", "pending", "paid", "failed", "cancelled"], // ← ADD "created"
      default: "created", // ← OPTIONAL: make it default
    },
    paymentRef: { type: String },
    gateway: { type: String, default: "waafi" },
    shippingAddress: {
      label: String,
      country: String,
      city: String,
      district: String,
      street: String,
      phone: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
