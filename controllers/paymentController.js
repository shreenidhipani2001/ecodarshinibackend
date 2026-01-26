import { pool } from "../db/pgClient.js";
import Razorpay from "razorpay";
import crypto from "crypto";

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// CREATE RAZORPAY ORDER
export const createRazorpayOrder = async (req, res) => {
  const { amount, currency = "INR", receipt, notes } = req.body;
  console.log('Request body for creating Razorpay order:', req.body);

  try {
    if (!amount) {
      return res.status(400).json({ message: "Amount is required" });
    }

    const options = {
      amount: Math.round(amount * 100), // Razorpay expects amount in paise
      currency,
      receipt: receipt || `receipt_${Date.now()}`,
      notes: notes || {},
    };

    const order = await razorpay.orders.create(options);

    res.status(201).json({
      success: true,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.log("error in create razor pay order::::",err);
    console.error("Razorpay order creation error:", err);
    res.status(500).json({ message: err.message });
  }
};

// VERIFY RAZORPAY PAYMENT
export const verifyRazorpayPayment = async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    amount,
    user_id,
    cart_items,
  } = req.body;

  try {
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: "Missing payment details" });
    }

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    const isValid = expectedSignature === razorpay_signature;

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed - Invalid signature",
      });
    }

    // Save payment to database
    const result = await pool.query(
      `INSERT INTO payments (razorpay_order_id, razorpay_payment_id, razorpay_signature, amount, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [razorpay_order_id, razorpay_payment_id, razorpay_signature, amount, "SUCCESS"]
    );

    res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      payment: result.rows[0],
    });
  } catch (err) {
    console.error("Payment verification error:", err);
    res.status(500).json({ message: err.message });
  }
};

// CREATE PAYMENT
export const createPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount, status } = req.body;

  try {
    // Validation
    if (!razorpay_order_id || !amount || !status) {
      return res.status(400).json({
        message: "razorpay_order_id, amount, and status are required"
      });
    }

    // Check if payment with this razorpay_order_id already exists
    const existing = await pool.query(
      "SELECT * FROM payments WHERE razorpay_order_id = $1",
      [razorpay_order_id]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({
        message: "Payment with this razorpay_order_id already exists"
      });
    }

    const result = await pool.query(
      `INSERT INTO payments (razorpay_order_id, razorpay_payment_id, razorpay_signature, amount, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [razorpay_order_id, razorpay_payment_id, razorpay_signature, amount, status]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// GET ALL PAYMENTS
export const getAllPayments = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
          p.*,
          o.*
        FROM payments p
        LEFT JOIN orders o 
          ON p.razorpay_payment_id = o.payment_id
        ORDER BY p.created_at DESC; 
       `
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// GET PAYMENT BY ID
export const getPaymentById = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "SELECT * FROM payments WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Payment not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// GET PAYMENT BY RAZORPAY ORDER ID
export const getPaymentByRazorpayOrderId = async (req, res) => {
  const { razorpayOrderId } = req.params;

  try {
    const result = await pool.query(
      "SELECT * FROM payments WHERE razorpay_order_id = $1",
      [razorpayOrderId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Payment not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// UPDATE PAYMENT
export const updatePayment = async (req, res) => {
  const { id } = req.params;
  const { razorpay_payment_id, razorpay_signature, amount, status } = req.body;

  try {
    // Check if payment exists
    const existing = await pool.query(
      "SELECT * FROM payments WHERE id = $1",
      [id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ message: "Payment not found" });
    }

    const result = await pool.query(
      `UPDATE payments
       SET razorpay_payment_id = COALESCE($1, razorpay_payment_id),
           razorpay_signature = COALESCE($2, razorpay_signature),
           amount = COALESCE($3, amount),
           status = COALESCE($4, status)
       WHERE id = $5
       RETURNING *`,
      [razorpay_payment_id, razorpay_signature, amount, status, id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

// DELETE PAYMENT
export const deletePayment = async (req, res) => {
  const { id } = req.params;

  try {
    // Check if payment exists
    const existing = await pool.query(
      "SELECT * FROM payments WHERE id = $1",
      [id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({ message: "Payment not found" });
    }

    await pool.query("DELETE FROM payments WHERE id = $1", [id]);
    res.json({ message: "Payment deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};
