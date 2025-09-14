const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Book = require("../models/Book");
const { createPaymentSession } = require("../utils/waafiClient");

// 🚀 INITIATE PAYMENT FIRST (NO ORDER CREATED)
exports.initiatePayment = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id }).populate("items.book");
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    const total = cart.items.reduce((sum, item) => sum + (item.price * item.qty), 0);

    const payment = await createPaymentSession({
      amount: total,
      orderId: "temp_" + Date.now(),
      customerTel: req.body.shippingAddress.phone.replace(/\+/g, ""),
    });

    return res.json({
      success: true,
      paymentUrl: payment.paymentUrl,
      tempPaymentRef: payment.referenceId,
      amount: total,
      shippingAddress: req.body.shippingAddress
    });

  } catch (error) {
    console.error("❌ Payment initiation failed:", error.message);
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// 🚀 CREATE ORDER ONLY AFTER WAIFI APPROVES (via webhook)
exports.paymentWebhook = async (req, res) => {
  try {
    const { referenceId, state } = req.body;

    if (!referenceId || state !== "APPROVED") {
      return res.status(400).json({ error: "Payment not approved" });
    }

    // 👇 REPLACE WITH REAL USER ID (store in DB when initiating payment)
    const userId = "68c039c89a0a80813934de7d";

    const cart = await Cart.findOne({ user: userId }).populate("items.book");
    if (!cart) {
      return res.status(400).json({ error: "Cart not found" });
    }

    const items = cart.items.map((item) => ({
      book: item.book._id,
      title: item.title,
      price: item.price,
      qty: item.qty,
    }));

    const order = new Order({
      user: userId,
      items,
      amount: cart.total,
      currency: "USD",
      status: "paid",
      gateway: "waafi",
      paymentRef: referenceId,
      shippingAddress: req.body.shippingAddress || { /* default */ }
    });

    await order.save();

    for (let item of cart.items) {
      await Book.findByIdAndUpdate(item.book._id, {
        $inc: { stock: -item.qty },
      });
    }

    await Cart.deleteOne({ user: userId });

    return res.status(200).json({
      success: true,
      message: "Order created successfully",
      orderId: order._id,
    });

  } catch (error) {
    console.error("❌ Webhook error:", error.message);
    return res.status(500).json({ error: "Webhook processing failed" });
  }
};

// 👇 KEEP OTHER EXPORTS
exports.getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id }).sort("-createdAt");
    res.json(orders);
  } catch (error) {
    console.error("Get Orders Error:", error);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user.id });
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json(order);
  } catch (error) {
    console.error("Get Order Error:", error);
    res.status(500).json({ error: "Failed to fetch order" });
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user", "name email")
      .sort("-createdAt");
    res.json(orders);
  } catch (error) {
    console.error("Get All Orders Error:", error);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: "Status is required" });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    console.error("Update Order Status Error:", error);
    res.status(500).json({ error: "Failed to update order status" });
  }
};