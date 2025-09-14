// src/controllers/orderController.js

const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Book = require("../models/Book");
const { createPaymentSession } = require("../utils/waafiClient");

// 1. CREATE ORDER (NO PAYMENT)
exports.createOrder = async (req, res) => {
  let order = null;
  let cart = null;

  try {
    cart = await Cart.findOne({ user: req.user.id }).populate("items.book");
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    const items = cart.items.map((item) => ({
      book: item.book._id,
      title: item.title,
      price: item.price,
      qty: item.qty,
    }));

    order = new Order({
      user: req.user.id,
      items,
      amount: cart.total,
      currency: "USD",
      status: "created", // ← NOT "pending" — payment not started
      gateway: "waafi",
      shippingAddress: req.body.shippingAddress,
    });

    await order.save();
    console.log("✅ Order created:", order._id);

    // DO NOT reduce stock yet — wait for payment
    // DO NOT clear cart yet — wait for payment

    return res.status(201).json({
      success: true,
      orderId: order._id,
      amount: order.amount,
      message: "Order created. Proceed to payment.",
    });
  } catch (error) {
    console.error("❌ Order creation failed:", error.message);
    return res.status(500).json({
      success: false,
      error: "Failed to create order",
    });
  }
};

// 2. INITIATE PAYMENT FOR ORDER
// src/controllers/orderController.js

exports.initiatePayment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { returnUrl, cancelUrl } = req.body; // ← ADD THIS

    const order = await Order.findOne({ _id: orderId, user: req.user.id });
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      return res.status(400).json({ error: "Cart not found. Recreate order." });
    }

    const payment = await createPaymentSession({
      amount: order.amount,
      orderId: order._id.toString(),
      customerTel: order.shippingAddress.phone,
      returnUrl, // ← PASS TO WAIFI
      cancelUrl, // ← PASS TO WAIFI
    });

    const approved =
      payment.waafiResponse.responseCode === "2001" &&
      payment.waafiResponse.params?.state === "APPROVED";

    if (!approved) {
      return res.status(400).json({
        success: false,
        error: payment.waafiResponse.responseMsg || "Payment not approved",
        waafiResponse: payment.waafiResponse,
      });
    }

    order.paymentRef = payment.referenceId;
    order.status = "pending";
    await order.save();

    return res.json({
      success: true,
      paymentUrl: payment.paymentUrl,
      paymentRef: payment.referenceId,
      waafiResponse: payment.waafiResponse,
    });
  } catch (error) {
    console.error("❌ Payment initiation failed:", error.message);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// 3. WEBHOOK — UPDATE ORDER ON PAYMENT SUCCESS
exports.paymentWebhook = async (req, res) => {
  try {
    const { referenceId, state } = req.body;

    if (!referenceId) {
      return res.status(400).json({ error: "Missing referenceId" });
    }

    const order = await Order.findOne({ paymentRef: referenceId });
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    if (state === "APPROVED") {
      // ✅ PAYMENT SUCCESS → reduce stock & clear cart
      const cart = await Cart.findOne({ user: order.user });
      if (cart) {
        for (let item of cart.items) {
          await Book.findByIdAndUpdate(item.book._id, {
            $inc: { stock: -item.qty },
          });
        }
        await Cart.deleteOne({ user: order.user });
      }

      order.status = "paid";
    } else {
      order.status = "failed";
    }

    await order.save();

    return res.status(200).json({
      success: true,
      message: "Order status updated",
      orderId: order._id,
      status: order.status,
    });
  } catch (error) {
    console.error("❌ Webhook error:", error.message);
    return res.status(500).json({ error: "Webhook processing failed" });
  }
};

// ... keep other exports (getUserOrders, etc.)

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
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user.id,
    });
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json(order);
  } catch (error) {
    console.error("Get Order Error:", error);
    res.status(500).json({ error: "Failed to fetch order" });
  }
};

// src/controllers/orderController.js
// src/controllers/orderController.js

exports.getAllOrders = async (req, res) => {
  try {
    // 👇 GET QUERY PARAMETERS
    const { status, email, page = 1, limit = 10 } = req.query;

    // 👇 BUILD FILTER
    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (email) {
      filter["user.email"] = { $regex: email, $options: "i" };
    }

    // 👇 CALCULATE SKIP
    const skip = (page - 1) * limit;

    // 👇 FETCH ORDERS
    const orders = await Order.find(filter)
      .populate("user", "name email")
      .sort("-createdAt")
      .skip(skip)
      .limit(parseInt(limit));

    // 👇 GET TOTAL COUNT FOR PAGINATION
    const total = await Order.countDocuments(filter);

    return res.json({
      orders,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
        limit: parseInt(limit),
      },
    });
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
